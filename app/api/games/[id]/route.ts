// app/api/games/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// GET /api/games/:id -> game with ordered stages & question
export async function GET(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const game = await prisma.escapeGame.findUnique({
    where: { id },
    include: { stages: { include: { question: true }, orderBy: { orderIndex: "asc" } } },
  });

  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

// PATCH /api/games/:id -> replace title/description and full stage list
export async function PATCH(req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const { title, description, stages } = body ?? {};

  try {
    if (Array.isArray(stages)) {
      await prisma.$transaction([
        prisma.escapeStage.deleteMany({ where: { gameId: id } }),
        prisma.escapeGame.update({
          where: { id },
          data: {
            title: title ?? undefined,
            description: description ?? undefined,
            stages: {
              create: stages.map((s: any, i: number) => ({
                orderIndex: s.orderIndex ?? i,
                questionId: Number(s.questionId),
                timerSecs: s.timerSecs ?? null,
                hint: s.hint ?? null,
              })),
            },
          },
        }),
      ]);
    } else if (title || typeof description === "string") {
      await prisma.escapeGame.update({
        where: { id },
        data: { title: title ?? undefined, description: description ?? undefined },
      });
    }

    const result = await prisma.escapeGame.findUnique({
      where: { id },
      include: { stages: { include: { question: true }, orderBy: { orderIndex: "asc" } } },
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("PATCH /api/games/[id] error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE /api/games/:id
export async function DELETE(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.escapeGame.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
