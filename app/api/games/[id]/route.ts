import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/games/:id  — include stages + question text
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const g = await prisma.escapeGame.findUnique({
    where: { id },
    include: { stages: { orderBy: { orderIndex: "asc" }, include: { question: true } } },
  });

  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(g, { status: 200 });
}

// PATCH /api/games/:id  — update game + fully replace stages
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });

    const body = await req.json();
    const { title, description, images, backdrop, stages } = body || {};

    // replace stages atomically (delete then create)
    const tx = await prisma.$transaction(async (db) => {
      const updated = await db.escapeGame.update({
        where: { id },
        data: {
          title: title ?? undefined,
          description: description === undefined ? undefined : description,
          images: images === undefined ? undefined : images,
          backdrop: backdrop === undefined ? undefined : backdrop,
        },
      });

      if (Array.isArray(stages)) {
        await db.escapeStage.deleteMany({ where: { gameId: id } });
        await db.escapeStage.createMany({
          data: stages.map((s: any) => ({
            orderIndex: Number(s.orderIndex ?? 0),
            gameId: id,
            questionId: Number(s.questionId),
            timerSecs: s.timerSecs == null ? null : Number(s.timerSecs),
            hint: s.hint ?? null,
          })),
        });
      }

      return db.escapeGame.findUnique({
        where: { id },
        include: { stages: { orderBy: { orderIndex: "asc" }, include: { question: true } } },
      });
    });

    return NextResponse.json(tx, { status: 200 });
  } catch (e) {
    console.error("PATCH /api/games/:id error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
