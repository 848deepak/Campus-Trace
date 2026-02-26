import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("ADMIN");
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const [items, users] = await Promise.all([
    prisma.item.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  return NextResponse.json({ items, users });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth("ADMIN");
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const payload = (await req.json()) as { itemId?: string; userId?: string };
  if (payload.itemId) {
    await prisma.item.delete({ where: { id: payload.itemId } });
  }

  if (payload.userId) {
    await prisma.user.delete({ where: { id: payload.userId } });
  }

  return NextResponse.json({ ok: true });
}
