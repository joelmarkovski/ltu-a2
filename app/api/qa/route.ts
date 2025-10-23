import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- GET: list or search ---
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";

    const whereClause =
      q.trim().length > 0
        ? ({
            OR: [
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          } as any)
        : undefined;

    const rows = await prisma.question.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("GET /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- POST: create ---
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

// --- DELETE: remove by ID or slug ---
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");

    if (!id && !slug) {
      return NextResponse.json(
        { error: "Missing id or slug parameter" },
        { status: 400 }
      );
    }

    const deleted = await prisma.question.deleteMany({
      where: id ? { id: Number(id) } : { slug: String(slug) },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: deleted.count });
  } catch (err) {
    console.error("DELETE /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
