"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      alert("Invalid login");
      setLoading(false);
      return;
    }
    const redirect = searchParams.get("redirect") || "/dashboard";
    router.push(redirect);
    router.refresh();
    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue to your dashboard.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
        </div>

        <Button className="w-full" onClick={login} disabled={loading || !email || !password}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          New here? <a className="font-medium text-slate-900 underline dark:text-slate-100" href="/register">Create account</a>
        </p>
      </Card>
    </main>
  );
}
