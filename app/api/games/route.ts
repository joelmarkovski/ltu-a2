// app/api/games/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/games -> list games (with stage count)
export async function GET() {
  const games = await prisma.escapeGame.findMany({
    orderBy: { updatedAt: "desc" },
    include: { stages: { select: { id: true } } },
  });
  return NextResponse.json(
    games.map((g) => ({ ...g, stageCount: g.stages.length, stages: undefined }))
  );
}

// POST /api/games  body: { title, description?, stages: [{questionId, timerSecs?, hint?}] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.title || !Array.isArray(body?.stages)) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const created = await prisma.escapeGame.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        stages: {
          create: body.stages.map((s: any, i: number) => ({
            orderIndex: i,
            questionId: Number(s.questionId),
            timerSecs: s.timerSecs ?? null,
            hint: s.hint ?? null,
          })),
        },
      },
      include: { stages: { include: { question: true }, orderBy: { orderIndex: "asc" } } },
    });

    return NextResponse.json(created);
  } catch (e) {
    console.error("POST /api/games error", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
