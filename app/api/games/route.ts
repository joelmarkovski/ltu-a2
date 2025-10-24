import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/games  — create a game with stages
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, images, backdrop, stages } = body || {};

    if (!title || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json({ error: "title and stages required" }, { status: 400 });
    }

    const created = await prisma.escapeGame.create({
      data: {
        title: String(title),
        description: description ? String(description) : null,
        images: images ?? null,
        backdrop: backdrop ?? null,
        stages: {
          create: stages.map((s: any) => ({
            orderIndex: Number(s.orderIndex ?? 0),
            question: { connect: { id: Number(s.questionId) } },
            timerSecs: s.timerSecs == null ? null : Number(s.timerSecs),
            hint: s.hint ?? null,
          })),
        },
      },
      include: {
        stages: {
          orderBy: { orderIndex: "asc" },
          include: { question: true },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/games error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/games  — optional list (handy for debugging)
export async function GET() {
  try {
    const rows = await prisma.escapeGame.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stages: { orderBy: { orderIndex: "asc" }, include: { question: true } },
      },
      take: 20,
    });
    return NextResponse.json(rows, { status: 200 });
  } catch (e) {
    console.error("GET /api/games error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
