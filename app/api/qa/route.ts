// app/api/qa/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// -------------------- GET: list/search --------------------
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

// -------------------- POST: upsert by slug --------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim();
    const question = String(body.question || "");
    const answer = String(body.answer || "");

    if (!slug || !question) {
      return NextResponse.json({ error: "slug and question are required" }, { status: 400 });
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

// -------------------- DELETE: by id or slug --------------------
// Optional: ?force=true to remove referencing stages first
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const qsId = url.searchParams.get("id");
    const qsSlug = url.searchParams.get("slug");
    const force = url.searchParams.get("force") === "true";

    let bodyId: number | null = null;
    let bodySlug: string | null = null;
    try {
      const body = await req.json();
      if (body?.id != null) bodyId = Number(body.id);
      if (body?.slug) bodySlug = String(body.slug);
      if (typeof body?.force === "boolean") {
        // body.force overrides query if provided
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const __ = body.force; // just to show we noticed it; we still prefer query param
      }
    } catch {
      // no/invalid body — ignore
    }

    const id = qsId ? Number(qsId) : bodyId;
    const slug = qsSlug || bodySlug;

    if (!id && !slug) {
      return NextResponse.json({ error: "Provide id or slug" }, { status: 400 });
    }

    // Resolve the target question first
    const target = await prisma.question.findUnique({
      where: id ? { id } : { slug: String(slug) },
      select: { id: true, slug: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Count referencing stages (FK Restrict in your schema)
    const inUse = await prisma.escapeStage.count({ where: { questionId: target.id } });

    if (inUse > 0 && !force) {
      return NextResponse.json(
        {
          error: "Question is used by stages",
          detail: `This question is referenced by ${inUse} stage(s). Pass force=true to delete them too.`,
          inUse,
        },
        { status: 409 }
      );
    }

    // Delete within a transaction to keep it tidy
    const result = await prisma.$transaction(async (tx) => {
      let deletedStages = 0;
      if (inUse > 0) {
        const del = await tx.escapeStage.deleteMany({ where: { questionId: target.id } });
        deletedStages = del.count;
      }
      const delQ = await tx.question.delete({ where: { id: target.id } });
      return { deletedQuestionId: delQ.id, deletedStages };
    });

    return NextResponse.json(
      {
        ok: true,
        deletedQuestionId: result.deletedQuestionId,
        deletedStages: result.deletedStages,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/qa error", err);
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
