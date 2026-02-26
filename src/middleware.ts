import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/post", "/profile", "/chat", "/claims", "/admin", "/qr", "/scan"];

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("campustrace_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/post/:path*", "/profile/:path*", "/chat/:path*", "/claims/:path*", "/admin/:path*", "/qr/:path*", "/scan/:path*"],
};
