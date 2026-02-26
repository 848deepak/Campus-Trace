import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const item = await prisma.item.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      title: true,
      category: true,
      qrCode: true,
      qrToken: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.userId !== auth.user.id && auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!item.qrCode || !item.qrToken) {
    return NextResponse.json({ error: "QR not available for this item" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const scanUrl = `${baseUrl}/api/qr/scan/${item.qrToken}`;

  return NextResponse.json({
    id: item.id,
    title: item.title,
    category: item.category,
    qrCode: item.qrCode,
    scanUrl,
  });
}
