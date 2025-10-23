import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";

    const rows = await prisma.question.findMany({
      where: q
        ? {
            OR: [
              { question: { contains: q, mode: "insensitive" as const } },
              { answer: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("GET /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.slug || !body.question || !body.answer) {
      return NextResponse.json(
        { error: "slug, question, and answer are required" },
        { status: 400 }
      );
    }

    const row = await prisma.question.create({
      data: {
        slug: String(body.slug),
        question: String(body.question),
        answer: String(body.answer),
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "slug already exists" }, { status: 409 });
    }
    console.error("POST /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
