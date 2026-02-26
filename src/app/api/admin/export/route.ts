import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("ADMIN");
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const items = await prisma.item.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const header = "id,type,title,category,status,latitude,longitude,userEmail,createdAt";
  const rows = items.map((item) =>
    [
      item.id,
      item.type,
      item.title.replaceAll(",", " "),
      item.category,
      item.status,
      item.latitude,
      item.longitude,
      item.user.email,
      item.createdAt.toISOString(),
    ].join(","),
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=campustrace-report.csv",
    },
  });
}
