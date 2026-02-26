import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth("ADMIN");
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const items = await prisma.item.findMany({
    select: {
      category: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      type: true,
    },
  });

  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  const hotspots = items.reduce<Record<string, number>>((acc, item) => {
    const key = `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const monthly = items.reduce<Record<string, number>>((acc, item) => {
    const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const mostLostCategory = Object.entries(
    items.filter((item) => item.type === "LOST").reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0] ?? ["N/A", 0];

  return NextResponse.json({
    mostLostCategory,
    categoryCounts,
    hotspots,
    monthly,
  });
}
