// app/api/saves/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/saves  -> list latest (optionally by type ?type=escape-progress)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;

    const rows = await prisma.save.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/saves error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/saves  -> create
// body: { type: string, payload: string | object }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.type || body.payload === undefined) {
      return NextResponse.json(
        { error: "type and payload are required" },
        { status: 400 }
      );
    }

    const payload =
      typeof body.payload === "string"
        ? body.payload
        : JSON.stringify(body.payload);

    const row = await prisma.save.create({
      data: { type: String(body.type), payload },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("POST /api/saves error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
