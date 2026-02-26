import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { sanitizeSensitiveText } from "@/lib/feature-utils";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function GET(_: Request, { params }: { params: { matchId: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      lostItem: true,
      foundItem: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const allowed = match.lostItem.userId === auth.user.id || match.foundItem.userId === auth.user.id;
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { matchId: params.matchId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages, match });
}

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const data = messageSchema.parse(await req.json());
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      lostItem: true,
      foundItem: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const receiverId = match.lostItem.userId === auth.user.id ? match.foundItem.userId : match.lostItem.userId;
  if (receiverId === auth.user.id && match.lostItem.userId !== auth.user.id && match.foundItem.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      matchId: params.matchId,
      senderId: auth.user.id,
      receiverId,
      content: sanitizeSensitiveText(data.content),
    },
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: "New Chat Message",
      body: "You received a new message in CampusTrace.",
    },
  });

  return NextResponse.json({ message });
}
