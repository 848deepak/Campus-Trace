import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { lostItem: { userId: auth.user.id } },
        { foundItem: { userId: auth.user.id } },
      ],
    },
    include: {
      lostItem: true,
      foundItem: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ matches });
}
