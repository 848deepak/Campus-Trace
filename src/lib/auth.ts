import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JwtUser } from "@/types";

const TOKEN_KEY = "campustrace_token";
const DEV_GUEST_EMAIL = "test.user@college.edu";
const DEV_GUEST_STUDENT_ID = "TEST-USER-001";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }
  return secret;
}

export function signToken(payload: JwtUser) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtUser {
  return jwt.verify(token, getSecret()) as JwtUser;
}

export function setAuthCookie(token: string) {
  cookies().set(TOKEN_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie() {
  cookies().set(TOKEN_KEY, "", { path: "/", maxAge: 0 });
}

export function getSessionUser(): JwtUser | null {
  const token = cookies().get(TOKEN_KEY)?.value;
  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

async function getDevGuestUser(): Promise<JwtUser> {
  const user = await prisma.user.upsert({
    where: { email: DEV_GUEST_EMAIL },
    update: {
      name: "Test User",
      role: "STUDENT",
      emailVerified: true,
    },
    create: {
      name: "Test User",
      email: DEV_GUEST_EMAIL,
      studentId: DEV_GUEST_STUDENT_ID,
      branch: "CSE",
      year: 3,
      passwordHash: "dev-bypass",
      role: "STUDENT",
      emailVerified: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
}

export async function requireAuth(role?: "STUDENT" | "ADMIN") {
  const user = getSessionUser();
  const isDevGuestEnabled =
    process.env.NODE_ENV !== "production" && process.env.DISABLE_DEV_GUEST !== "true";
  const activeUser = user ?? (isDevGuestEnabled ? await getDevGuestUser() : null);

  if (!activeUser) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }
  if (role && activeUser.role !== role) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }

  return { error: null, user: activeUser };
}
