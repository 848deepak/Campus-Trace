"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MapPinned, QrCode, Shield, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props {
  isAdmin?: boolean;
}

export function Navbar({ isAdmin }: Props) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-blue-500" />
          <span className="flex flex-col">
            <span className="text-lg font-semibold leading-none">CampusTrace</span>
            <span className="text-xs text-slate-500">Lost &amp; Found</span>
          </span>
        </Link>
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>Dashboard</Link>
          <Link href="/post/lost" className={buttonVariants({ variant: "ghost", size: "sm" })}>Post Lost</Link>
          <Link href="/post/found" className={buttonVariants({ variant: "ghost", size: "sm" })}>Post Found</Link>
          <Link href="/scan" className={buttonVariants({ variant: "ghost", size: "sm" })}><QrCode className="mr-1 h-4 w-4" />Scan QR</Link>
          <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}><User className="mr-1 h-4 w-4" />Profile</Link>
          <Link href="/dashboard#notifications" className={buttonVariants({ variant: "ghost", size: "sm" })}><Bell className="mr-1 h-4 w-4" />Alerts</Link>
          {isAdmin ? <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "sm" })}><Shield className="mr-1 h-4 w-4" />Admin</Link> : null}
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </div>
    </header>
  );
}
