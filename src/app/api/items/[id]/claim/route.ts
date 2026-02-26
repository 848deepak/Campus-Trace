import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const createClaimSchema = z.object({
  answers: z.array(z.string().min(1)).min(1),
});

const updateClaimSchema = z.object({
  claimId: z.string(),
  action: z.enum(["APPROVE", "REJECT", "COMPLETE"]),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const item = await prisma.item.findUnique({ where: { id: params.id } });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const data = createClaimSchema.parse(await req.json());
  const claim = await prisma.claim.create({
    data: {
      itemId: item.id,
      requesterId: auth.user.id,
      resolverId: item.userId,
      verificationAnswers: data.answers,
    },
  });

  await prisma.notification.create({
    data: {
      userId: item.userId,
      title: "New Claim Request",
      body: `Someone requested claim for ${item.title}`,
    },
  });

  return NextResponse.json({ claim });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return auth.error;
  }

  const data = updateClaimSchema.parse(await req.json());
  const claim = await prisma.claim.findUnique({
    where: { id: data.claimId },
    include: { item: true },
  });

  if (!claim || claim.itemId !== params.id) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  if (claim.resolverId !== auth.user.id && auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusMap = {
    APPROVE: "APPROVED",
    REJECT: "REJECTED",
    COMPLETE: "COMPLETED",
  } as const;

  const updated = await prisma.claim.update({
    where: { id: claim.id },
    data: {
      status: statusMap[data.action],
    },
  });

  if (data.action === "COMPLETE") {
    await prisma.item.update({
      where: { id: claim.item.id },
      data: { status: "RETURNED" },
    });
  }

  await prisma.notification.create({
    data: {
      userId: claim.requesterId,
      title: "Claim Status Updated",
      body: `Claim for ${claim.item.title} is now ${statusMap[data.action]}`,
    },
  });

  return NextResponse.json({ claim: updated });
}
