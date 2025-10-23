import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.qA.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json(); // { slug, question, answer }
  if (!body?.slug || !body?.question || !body?.answer) {
    return NextResponse.json({ error: "slug, question, answer required" }, { status: 400 });
  }
  const row = await prisma.qA.upsert({
    where: { slug: String(body.slug) },
    update: { question: String(body.question), answer: String(body.answer) },
    create: { slug: String(body.slug), question: String(body.question), answer: String(body.answer) },
  });
  return NextResponse.json(row, { status: 201 });
}
