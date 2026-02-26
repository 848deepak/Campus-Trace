import { ItemType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashSimilarity, semanticSimilarity } from "@/lib/ai";
import { requireAuth } from "@/lib/auth";
import { isWithinCampus } from "@/lib/campus";
import { getCampusBlock } from "@/lib/feature-utils";
import { computeMatchScore } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const itemSchema = z.object({
  type: z.enum(["LOST", "FOUND"]),
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.string().min(2),
  imageUrl: z.string().min(10),
  imageHash: z.string().optional(),
  dateOccurred: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  reward: z.number().optional(),
  contactPreference: z.string().optional(),
  safeWithMe: z.boolean().optional(),
  anonymous: z.boolean().optional(),
  aiSuggestedCategory: z.string().optional(),
  qrCode: z.string().optional(),
  qrToken: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const expiryCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await prisma.item.updateMany({
    where: {
      status: "OPEN",
      createdAt: { lt: expiryCutoff },
    },
    data: { status: "ARCHIVED" },
  });

  const type = req.nextUrl.searchParams.get("type");
  const category = req.nextUrl.searchParams.get("category");
  const date = req.nextUrl.searchParams.get("date");
  const block = req.nextUrl.searchParams.get("block");
  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";

  const centerLat = Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LAT ?? 28.6139);
  const centerLng = Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LNG ?? 77.209);

  const startOfDay = date ? new Date(`${date}T00:00:00.000Z`) : null;
  const endOfDay = date ? new Date(`${date}T23:59:59.999Z`) : null;

  const items = await prisma.item.findMany({
    where: {
      ...(type ? { type: type as ItemType } : {}),
      ...(category ? { category } : {}),
      ...(!includeArchived ? { status: { not: "ARCHIVED" } } : {}),
      ...(startOfDay && endOfDay
        ? {
            dateOccurred: {
              gte: startOfDay,
              lte: endOfDay,
            },
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          branch: true,
          year: true,
        },
      },
      lostMatches: true,
      foundMatches: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const filteredByBlock =
    block && block !== "ALL"
      ? items.filter((item) => getCampusBlock(item.latitude, item.longitude, centerLat, centerLng) === block)
      : items;

  return NextResponse.json({ items: filteredByBlock });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const ip = req.headers.get("x-forwarded-for") ?? auth.user.id;
  const limiter = applyRateLimit(`item:${ip}`, 8, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const data = itemSchema.parse(await req.json());

    if (!isWithinCampus(data.latitude, data.longitude)) {
      return NextResponse.json({ error: "Coordinates outside campus boundary" }, { status: 400 });
    }

    const duplicate = await prisma.item.findFirst({
      where: {
        userId: auth.user.id,
        title: data.title,
        category: data.category,
        type: data.type as ItemType,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60_000),
        },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "Duplicate post detected" }, { status: 409 });
    }

    const item = await prisma.item.create({
      data: {
        type: data.type as ItemType,
        title: data.title,
        description: data.description,
        category: data.category,
        imageUrl: data.imageUrl,
        imageHash: data.imageHash,
        dateOccurred: new Date(data.dateOccurred),
        latitude: data.latitude,
        longitude: data.longitude,
        reward: data.reward,
        contactPreference: data.contactPreference,
        safeWithMe: data.type === "FOUND" ? (data.safeWithMe ?? false) : false,
        anonymous: data.anonymous ?? false,
        aiSuggestedCategory: data.aiSuggestedCategory,
        qrCode: data.qrCode,
        qrToken: data.qrToken,
        userId: auth.user.id,
      },
      include: { user: true },
    });

    const oppositeType = item.type === "FOUND" ? "LOST" : "FOUND";
    const possible = await prisma.item.findMany({
      where: {
        type: oppositeType,
        status: "OPEN",
      },
      take: 80,
    });

    const createdMatches: string[] = [];
    for (const candidate of possible) {
      const { score: baseScore, distance } = computeMatchScore({
        categoryA: item.category,
        categoryB: candidate.category,
        titleA: item.title,
        titleB: candidate.title,
        descriptionA: item.description,
        descriptionB: candidate.description,
        dateA: item.dateOccurred,
        dateB: candidate.dateOccurred,
        latA: item.latitude,
        lngA: item.longitude,
        latB: candidate.latitude,
        lngB: candidate.longitude,
      });

      const imageScore = hashSimilarity(item.imageHash, candidate.imageHash) ?? 0;
      let textScore = 0;

      if (baseScore >= 0.35) {
        const semantic = await semanticSimilarity(
          `${item.title}. ${item.description}`,
          `${candidate.title}. ${candidate.description}`,
        );
        textScore = semantic ?? 0;
      }

      const score = Math.min(1, baseScore + imageScore * 0.15 + textScore * 0.2);

      if (score >= 0.55 && distance <= 200) {
        const lostItemId = item.type === "LOST" ? item.id : candidate.id;
        const foundItemId = item.type === "FOUND" ? item.id : candidate.id;

        await prisma.match.upsert({
          where: {
            lostItemId_foundItemId: {
              lostItemId,
              foundItemId,
            },
          },
          create: {
            lostItemId,
            foundItemId,
            matchScore: score,
          },
          update: { matchScore: score },
        });

        createdMatches.push(candidate.id);

        await prisma.notification.createMany({
          data: [
            {
              userId: item.userId,
              title: "Potential Match Found",
              body: `We found a potential match for ${item.title}`,
            },
            {
              userId: candidate.userId,
              title: "Potential Match Found",
              body: `We found a potential match for ${candidate.title}`,
            },
          ],
        });
      }
    }

    return NextResponse.json({ item, potentialMatches: createdMatches.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create item" }, { status: 500 });
  }
}
