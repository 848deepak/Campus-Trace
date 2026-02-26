import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    include: {
      items: { orderBy: { createdAt: "desc" }, take: 20 },
      claimsRequested: { include: { item: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  return NextResponse.json({ user });
}
