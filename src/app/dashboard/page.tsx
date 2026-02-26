"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, QrCode } from "lucide-react";
import { getCampusBlock } from "@/lib/feature-utils";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const CampusMap = dynamic(() => import("@/components/map/campus-map").then((module) => module.CampusMap), {
  ssr: false,
});

type Item = {
  id: string;
  type: "LOST" | "FOUND";
  title: string;
  category: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
  dateOccurred: string;
};

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"BOTH" | "LOST" | "FOUND">("BOTH");
  const [locating, setLocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("ALL");
  const [matches, setMatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const center = useMemo(
    () => [Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LAT ?? 28.6139), Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LNG ?? 77.209)] as [number, number],
    [],
  );
  const radius = Number(process.env.NEXT_PUBLIC_CAMPUS_RADIUS_METERS ?? 1200);

  const categoryOptions = useMemo(
    () => ["ALL", ...Array.from(new Set(items.map((item) => item.category))).sort()],
    [items],
  );

  const blockOptions = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(items.map((item) => getCampusBlock(item.latitude, item.longitude, center[0], center[1]))),
      ).sort(),
    ],
    [items, center],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "BOTH" && item.type !== filter) {
        return false;
      }

      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }

      if (dateFilter) {
        const occurred = new Date(item.dateOccurred).toISOString().slice(0, 10);
        if (occurred !== dateFilter) {
          return false;
        }
      }

      if (blockFilter !== "ALL") {
        const block = getCampusBlock(item.latitude, item.longitude, center[0], center[1]);
        if (block !== blockFilter) {
          return false;
        }
      }

      return true;
    });
  }, [items, filter, categoryFilter, dateFilter, blockFilter, center]);

  const load = async () => {
    const [itemsRes, matchesRes, notificationsRes, meRes] = await Promise.all([
      fetch("/api/items"),
      fetch("/api/matches"),
      fetch("/api/notifications"),
      fetch("/api/auth/me"),
    ]);

    if (itemsRes.ok) setItems((await itemsRes.json()).items);
    if (matchesRes.ok) setMatches((await matchesRes.json()).matches);
    if (notificationsRes.ok) setNotifications((await notificationsRes.json()).notifications);
    if (meRes.ok) setUser((await meRes.json()).user);
  };

  useEffect(() => {
    load();
    const eventSource = new EventSource("/api/stream");
    eventSource.onmessage = () => load();
    return () => eventSource.close();
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Please allow location access and try again."
            : "Could not fetch current location. Please try again.";
        alert(message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <main className="min-h-screen">
      <Navbar isAdmin={user?.role === "ADMIN"} />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">Live Campus Map</h1>
              <p className="text-sm text-slate-500">Red = lost • Blue = found • clustered and hotspot aware</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={useCurrentLocation} disabled={locating}>
                {locating ? "Fetching..." : "Use my current location"}
              </Button>
              <Button variant={filter === "LOST" ? "default" : "outline"} onClick={() => setFilter("LOST")}>Lost</Button>
              <Button variant={filter === "FOUND" ? "default" : "outline"} onClick={() => setFilter("FOUND")}>Found</Button>
              <Button variant={filter === "BOTH" ? "default" : "outline"} onClick={() => setFilter("BOTH")}>Both</Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <select
              aria-label="Filter by category"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Categories" : option}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />

            <select
              aria-label="Filter by block"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={blockFilter}
              onChange={(event) => setBlockFilter(event.target.value)}
            >
              {blockOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Blocks" : option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50">
              <div className="text-xs text-slate-500">Visible Items</div>
              <div className="text-lg font-semibold">{filteredItems.length}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50">
              <div className="text-xs text-slate-500">Potential Matches</div>
              <div className="text-lg font-semibold">{matches.length}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50">
              <div className="text-xs text-slate-500">Unread Alerts</div>
              <div className="text-lg font-semibold">{notifications.filter((note) => !note.read).length}</div>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Map</h2>
            <p className="text-sm text-slate-500">Explore current lost and found posts.</p>
          </div>
          <Link href="/scan" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <QrCode className="mr-2 h-4 w-4" /> Scan QR
          </Link>
        </div>

        <CampusMap items={filteredItems} filter="BOTH" center={center} radius={radius} currentLocation={currentLocation} />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Potential Matches</h2>
            <div className="space-y-2">
              {matches.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                  No potential matches yet. New matches will appear automatically.
                </div>
              ) : null}
              {matches.slice(0, 8).map((match) => (
                <div key={match.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 dark:border-slate-700">
                  <div>
                    <div className="font-medium">{match.lostItem.title} ↔ {match.foundItem.title}</div>
                    <div className="text-xs text-slate-500">Score: {(match.matchScore * 100).toFixed(0)}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Potential Match Found</Badge>
                    <Link href={`/chat/${match.id}`} className={buttonVariants({ size: "sm" })}>Open Chat</Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="notifications">
            <h2 className="mb-3 text-lg font-semibold">Notifications</h2>
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                  No notifications right now.
                </div>
              ) : null}
              {notifications.slice(0, 8).map((note) => (
                <div key={note.id} className="rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700">
                  <div className="font-medium">{note.title}</div>
                  <div className="text-xs text-slate-500">{note.body}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">SOS: Emergency document loss</h3>
            <p className="text-sm text-slate-500">Quickly alert support if sensitive documents are lost.</p>
          </div>
          <Button variant="danger" onClick={() => alert("SOS alert raised. Campus support notified.")}>
            <AlertTriangle className="mr-2 h-4 w-4" /> SOS
          </Button>
        </Card>
      </div>
    </main>
  );
}
