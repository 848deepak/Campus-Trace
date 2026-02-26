"use client";

import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type BarcodeResult = {
  rawValue?: string;
};

const SCAN_PATH_SEGMENT = "/api/qr/scan/";

function normalizeScanTarget(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes(SCAN_PATH_SEGMENT)) {
      return trimmed;
    }
    return null;
  }

  if (trimmed.includes(SCAN_PATH_SEGMENT)) {
    return `${window.location.origin}${trimmed.slice(trimmed.indexOf(SCAN_PATH_SEGMENT))}`;
  }

  return `${window.location.origin}${SCAN_PATH_SEGMENT}${encodeURIComponent(trimmed)}`;
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanAtRef = useRef(0);

  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const stopScanner = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  };

  const navigateFromValue = (value: string) => {
    const target = normalizeScanTarget(value);
    if (!target) {
      setError("Invalid QR value. Paste a valid scan link or token.");
      return;
    }
    window.location.href = target;
  };

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    setError(null);

    if (!("BarcodeDetector" in window)) {
      setError("Camera QR scanner is not supported on this browser. Use manual paste below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const DetectorCtor = (window as unknown as { BarcodeDetector: new (args?: { formats?: string[] }) => { detect: (input: HTMLVideoElement) => Promise<BarcodeResult[]> } }).BarcodeDetector;
      const detector = new DetectorCtor({ formats: ["qr_code"] });

      const tick = async () => {
        if (!videoRef.current) {
          return;
        }

        const now = Date.now();
        if (now - lastScanAtRef.current > 400) {
          lastScanAtRef.current = now;
          try {
            const results = await detector.detect(videoRef.current);
            const rawValue = results[0]?.rawValue;
            if (rawValue) {
              stopScanner();
              navigateFromValue(rawValue);
              return;
            }
          } catch {
            setError("Could not read QR from camera. Try moving closer or use manual paste.");
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      setActive(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("Camera access denied or unavailable. Use manual paste below.");
      stopScanner();
    }
  };

  const submitManual = () => {
    setError(null);
    navigateFromValue(manualCode);
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Card className="space-y-4">
          <h1 className="text-2xl font-semibold">Scan Item QR</h1>
          <p className="text-sm text-slate-500">
            Scan the owner QR from laptop, bottle, or bag. We instantly alert the owner.
          </p>

          <div className="space-y-3">
            <video ref={videoRef} className="h-72 w-full rounded-md border border-slate-200 bg-black object-cover dark:border-slate-700" muted playsInline />
            <div className="flex gap-2">
              <Button onClick={startScanner} disabled={active || !supported}>Start Camera Scan</Button>
              <Button variant="outline" onClick={stopScanner} disabled={!active}>Stop</Button>
            </div>
            {!supported ? (
              <p className="text-xs text-amber-600">Camera QR scanner not supported in this browser. Use manual input below.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Manual scan (paste token or scan URL)</div>
            <div className="flex gap-2">
              <Input
                placeholder="Paste QR token or https://.../api/qr/scan/<token>"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
              />
              <Button onClick={submitManual} disabled={!manualCode.trim()}>Open</Button>
            </div>
          </div>

          {error ? <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        </Card>
      </div>
    </main>
  );
}
