// app/api/qa/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/qa/:id
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const row = await prisma.question.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error("GET /api/qa/[id] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/qa/:id
// body: { slug?, question?, answer? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data: { slug?: string; question?: string; answer?: string } = {};

    if (typeof body?.slug === "string") data.slug = body.slug;
    if (typeof body?.question === "string") data.question = body.question;
    if (typeof body?.answer === "string") data.answer = body.answer;

    if (!("slug" in data) && !("question" in data) && !("answer" in data)) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const row = await prisma.question.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "slug already exists" },
        { status: 409 }
      );
    }
    console.error("PATCH /api/qa/[id] error", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE /api/qa/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/qa/[id] error", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
