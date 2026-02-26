"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type QrPayload = {
  id: string;
  title: string;
  category: string;
  qrCode: string;
  scanUrl: string;
};

export default function QrItemPage({ params }: { params: { itemId: string } }) {
  const [data, setData] = useState<QrPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/items/${params.itemId}/qr`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error ?? "Could not load QR");
          return;
        }
        setData(payload);
      })
      .catch(() => setError("Could not load QR"));
  }, [params.itemId]);

  const copyLink = async () => {
    if (!data?.scanUrl) return;
    await navigator.clipboard.writeText(data.scanUrl);
    alert("Scan link copied");
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Card className="space-y-4">
          <h1 className="text-2xl font-semibold">Item QR</h1>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          {!data && !error ? <p className="text-sm text-slate-500">Loading QR...</p> : null}

          {data ? (
            <>
              <div>
                <div className="font-medium">{data.title}</div>
                <div className="text-xs text-slate-500">{data.category}</div>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.qrCode} alt="Item QR Code" className="mx-auto h-56 w-56 rounded border border-slate-200 p-2 dark:border-slate-700" />

              <div className="rounded-md border border-slate-200 p-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {data.scanUrl}
              </div>

              <div className="flex gap-2">
                <Button onClick={copyLink}>Copy Scan Link</Button>
                <Link href="/profile">
                  <Button variant="outline">Back to Profile</Button>
                </Link>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
