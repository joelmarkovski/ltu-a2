import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.save.findUnique({ where: { id: Number(params.id) } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json(); // { type?: string, payload?: any }
  const item = await prisma.save.update({
    where: { id: Number(params.id) },
    data: {
      type: typeof body.type === "string" ? body.type : undefined,
      payload: body.payload ? JSON.stringify(body.payload) : undefined,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.save.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
