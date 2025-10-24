
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// avoid edge caching for this route
export const dynamic = "force-dynamic";

// --- GET: list or search by ?q= ---
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";

    const where =
      q.length > 0
        ? {
            OR: [
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined;

    const rows = await prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("GET /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- POST: create or update by slug (UPSERT) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim();
    const question = String(body.question || "");
    const answer = String(body.answer || "");

    if (!slug || !question) {
      return NextResponse.json(
        { error: "slug and question are required" },
        { status: 400 }
      );
    }

    const saved = await prisma.question.upsert({
      where: { slug },
      update: { question, answer },
      create: { slug, question, answer },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("POST /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- DELETE: remove by id or slug (querystring OR JSON body) ---
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const qsId = url.searchParams.get("id");
    const qsSlug = url.searchParams.get("slug");

    let bodyId: number | null = null;
    let bodySlug: string | null = null;
    try {
      const body = await req.json();
      if (body?.id != null) bodyId = Number(body.id);
      if (body?.slug) bodySlug = String(body.slug);
    } catch {
      // no body (fine)
    }

    const id = qsId ? Number(qsId) : bodyId;
    const slug = qsSlug || bodySlug;

    if (!id && !slug) {
      return NextResponse.json({ error: "Provide id or slug" }, { status: 400 });
    }

    const where = id ? { id } : { slug: String(slug) };
    const deleted = await prisma.question.deleteMany({ where });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: deleted.count }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/qa error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
