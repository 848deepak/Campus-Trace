"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    studentId: "",
    branch: "",
    year: 1,
  });

  const update = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const register = async () => {
    setLoading(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-10">
      <Card className="w-full space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join CampusTrace to report and recover items faster.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Your name" onChange={(event) => update("name", event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input placeholder="you@example.com" onChange={(event) => update("email", event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Student ID</label>
            <Input placeholder="Student ID" onChange={(event) => update("studentId", event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Branch</label>
            <Input placeholder="CSE" onChange={(event) => update("branch", event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Year</label>
            <Input type="number" min={1} max={6} placeholder="4" onChange={(event) => update("year", Number(event.target.value))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" placeholder="Minimum 8 characters" onChange={(event) => update("password", event.target.value)} />
          </div>
        </div>
        <Button
          className="w-full"
          onClick={register}
          disabled={
            loading
            || !form.name
            || !form.email
            || !form.password
            || !form.studentId
            || !form.branch
            || !form.year
          }
        >
          {loading ? "Creating account..." : "Register"}
        </Button>
        <p className="text-center text-sm text-slate-500">
          Already registered? <a className="font-medium text-slate-900 underline dark:text-slate-100" href="/login">Sign in</a>
        </p>
      </Card>
    </main>
  );
}
