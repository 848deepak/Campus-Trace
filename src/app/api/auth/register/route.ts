import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setAuthCookie, signToken } from "@/lib/auth";
import { isAllowedCollegeEmail, normalizeEmail } from "@/lib/feature-utils";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  studentId: z.string().min(3),
  branch: z.string().min(2),
  year: z.number().min(1).max(6),
  profileImage: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const data = registerSchema.parse(await req.json());
    const email = normalizeEmail(data.email);

    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.json({ error: "Use your college email address." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { studentId: data.studentId }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = email.startsWith("admin") ? "ADMIN" : "STUDENT";

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        studentId: data.studentId,
        branch: data.branch,
        year: data.year,
        profileImage: data.profileImage,
        passwordHash,
        emailVerified: true,
        role,
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    setAuthCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to register." }, { status: 500 });
  }
}
