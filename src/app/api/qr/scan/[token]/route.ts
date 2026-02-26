import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const item = await prisma.item.findUnique({
    where: { qrToken: params.token },
    select: {
      id: true,
      title: true,
      category: true,
      userId: true,
      status: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  }

  await prisma.notification.create({
    data: {
      userId: item.userId,
      title: "QR Scan Alert",
      body: `Your ${item.category} (${item.title}) was scanned. Open CampusTrace to connect.`,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const redirectUrl = `${baseUrl}/login?qrItem=${item.id}`;
  return NextResponse.redirect(redirectUrl);
}
