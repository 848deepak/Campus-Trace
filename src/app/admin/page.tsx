"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const load = async () => {
    const [adminRes, statsRes] = await Promise.all([fetch("/api/admin"), fetch("/api/admin/stats")]);
    if (adminRes.ok) {
      const data = await adminRes.json();
      setItems(data.items);
      setUsers(data.users);
    }
    if (statsRes.ok) {
      setStats(await statsRes.json());
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeItem = async (itemId: string) => {
    await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    load();
  };

  const banUser = async (userId: string) => {
    await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    load();
  };

  return (
    <main className="min-h-screen">
      <Navbar isAdmin />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">Statistics</h2>
          {stats ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div className="text-sm text-slate-500">Most Lost Category</div>
                <div className="font-semibold">{stats.mostLostCategory?.[0]}</div>
              </div>
              <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div className="text-sm text-slate-500">Hotspot Areas</div>
                <div className="font-semibold">{Object.keys(stats.hotspots ?? {}).length}</div>
              </div>
              <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div className="text-sm text-slate-500">Monthly Trend Points</div>
                <div className="font-semibold">{Object.keys(stats.monthly ?? {}).length}</div>
              </div>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Posts</h2>
            <div className="space-y-2">
              {items.slice(0, 20).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 dark:border-slate-700">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.type} • {item.category}</div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => removeItem(item.id)}>Delete</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-2 text-lg font-semibold">Users</h2>
            <div className="space-y-2">
              {users.slice(0, 20).map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 dark:border-slate-700">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => banUser(user.id)}>Ban</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
