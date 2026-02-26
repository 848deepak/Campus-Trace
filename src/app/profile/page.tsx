"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setUser(data.user));
  }, []);

  if (!user) {
    return <main className="p-6 text-sm text-slate-500">Loading profile...</main>;
  }

  return (
    <main className="min-h-screen">
      <Navbar isAdmin={user.role === "ADMIN"} />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <Card>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Badge>{user.branch}</Badge>
            <Badge>Year {user.year}</Badge>
            <Badge>{user.studentId}</Badge>
            <Badge>{user.role}</Badge>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Posted Items History</h2>
            <div className="space-y-2">
              {!user.items?.length ? (
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                  You have not posted any items yet.
                </div>
              ) : null}
              {user.items?.map((item: any) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-2 dark:border-slate-700">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.type} • {item.status}</div>
                  {item.qrToken ? (
                    <div className="mt-2">
                      <Link href={`/qr/${item.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        View QR
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Claimed Items History</h2>
            <div className="space-y-2">
              {!user.claimsRequested?.length ? (
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                  You have not made any claim requests yet.
                </div>
              ) : null}
              {user.claimsRequested?.map((claim: any) => (
                <div key={claim.id} className="rounded-md border border-slate-200 p-2 dark:border-slate-700">
                  <div className="font-medium">{claim.item.title}</div>
                  <div className="text-xs text-slate-500">Claim status: {claim.status}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
