import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const items = await prisma.save.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(items);
}
export async function POST(req: Request) {
  const body = await req.json(); // {type, payload}
  if (!body?.type) return NextResponse.json({ error: "type required" }, { status: 400 });
  const saved = await prisma.save.create({ data: { type: String(body.type), payload: JSON.stringify(body.payload ?? {}) }});
  return NextResponse.json(saved, { status: 201 });
}
