// app/api/qa/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/qa?slug=hello-world&q=search
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") ?? undefined;
    const q = searchParams.get("q") ?? undefined;

    const rows = await prisma.question.findMany({
      where: {
        ...(slug ? { slug } : {}),
        ...(q
          ? {
              OR: [
                { question: { contains: q, mode: "insensitive" } },
                { answer: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/qa  (create)
// body: { slug: string, question: string, answer: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.slug || !body?.question || !body?.answer) {
      return NextResponse.json(
        { error: "slug, question, answer are required" },
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
    // Unique constraint (slug)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "slug already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
