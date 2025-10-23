/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/saves/:id
export async function GET(_req: Request, ctx: any) {
  const id = Number(ctx?.params?.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const row = await prisma.save.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

// DELETE /api/saves/:id
export async function DELETE(_req: Request, ctx: any) {
  const id = Number(ctx?.params?.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await prisma.save.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
