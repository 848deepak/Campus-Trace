import Link from "next/link";
import { Compass, MapPinned, MessageCircleMore, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Campus smart lost & found
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">CampusTrace</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Post lost and found items, track everything on a live campus map, get intelligent match alerts, chat securely, and complete verified claims.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/register" className={buttonVariants({ variant: "default" })}>Create Account</Link>
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>Login</Link>
          <Link href="/login?redirect=%2Fscan" className={buttonVariants({ variant: "outline" })}>Scan QR</Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><MapPinned className="mb-2 h-5 w-5 text-red-500" />Live Campus Map</Card>
        <Card><Compass className="mb-2 h-5 w-5 text-blue-500" />Intelligent Match Score</Card>
        <Card><MessageCircleMore className="mb-2 h-5 w-5 text-violet-500" />Private In-app Chat</Card>
        <Card><ShieldCheck className="mb-2 h-5 w-5 text-emerald-500" />Secure Claim Workflow</Card>
      </section>
    </main>
  );
}
