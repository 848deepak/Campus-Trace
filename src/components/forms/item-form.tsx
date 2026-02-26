"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((module) => module.LocationPicker),
  { ssr: false },
);

const categories = ["Phone", "Wallet", "ID Card", "Keys", "Laptop", "Bottle", "Bag", "Notes", "Other"];
const qrEligibleCategories = new Set(["Laptop", "Bottle", "Bag"]);

function suggestCategory(fileName: string) {
  const name = fileName.toLowerCase();
  if (name.includes("phone") || name.includes("iphone")) return "Phone";
  if (name.includes("wallet")) return "Wallet";
  if (name.includes("id") || name.includes("card")) return "ID Card";
  if (name.includes("key")) return "Keys";
  if (name.includes("laptop") || name.includes("macbook")) return "Laptop";
  if (name.includes("bag") || name.includes("backpack")) return "Bag";
  if (name.includes("bottle") || name.includes("flask")) return "Bottle";
  return "Other";
}

export function ItemForm({ type }: { type: "LOST" | "FOUND" }) {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Phone");
  const [contactPreference, setContactPreference] = useState("chat");
  const [dateOccurred, setDateOccurred] = useState("");
  const [reward, setReward] = useState(0);
  const [safeWithMe, setSafeWithMe] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [location, setLocation] = useState({
    lat: Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LAT ?? 28.6139),
    lng: Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LNG ?? 77.209),
  });

  const center = useMemo(
    () => [Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LAT ?? 28.6139), Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LNG ?? 77.209)] as [number, number],
    [],
  );
  const radius = Number(process.env.NEXT_PUBLIC_CAMPUS_RADIUS_METERS ?? 1200);

  const onImageChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Only images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }

    setCategory(suggestCategory(file.name));

    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploadingImage(true);
      const base64 = String(reader.result);
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error ?? "Upload failed");
        setUploadingImage(false);
        return;
      }
      setImageUrl(data.imageUrl);
      setImageHash(data.imageHash ?? null);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const shouldGenerateQr = qrEligibleCategories.has(category);
      const qrToken = shouldGenerateQr && typeof crypto !== "undefined" ? crypto.randomUUID() : undefined;
      const scanUrl = qrToken ? `${window.location.origin}/api/qr/scan/${qrToken}` : undefined;
      const qrCode = scanUrl ? await QRCode.toDataURL(scanUrl) : undefined;
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          category,
          imageUrl,
          dateOccurred,
          latitude: location.lat,
          longitude: location.lng,
          imageHash: imageHash ?? undefined,
          reward: type === "LOST" ? reward : undefined,
          contactPreference: type === "LOST" ? contactPreference : undefined,
          safeWithMe: type === "FOUND" ? safeWithMe : undefined,
          anonymous,
          aiSuggestedCategory: category,
          qrCode,
          qrToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error ?? "Could not post item");
        return;
      }

      alert(`Posted successfully. Potential matches: ${data.potentialMatches ?? 0}`);
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="mx-auto max-w-3xl space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Post {type === "LOST" ? "Lost" : "Found"} Item</h1>
          <p className="mt-1 text-sm text-slate-500">
            Add accurate details and location to improve match quality.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Item details</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <select
              aria-label="Category"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <div className="space-y-2">
          <div className="text-sm font-medium">Date and photo</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input type="date" value={dateOccurred} onChange={(event) => setDateOccurred(event.target.value)} />
            <Input type="file" accept="image/*" onChange={(event) => onImageChange(event.target.files?.[0] ?? null)} />
          </div>
          <p className="text-xs text-slate-500">
            {uploadingImage ? "Uploading image..." : imageUrl ? "Image uploaded successfully." : "Upload a clear image under 5MB."}
          </p>
        </div>

        {type === "LOST" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              min={0}
              placeholder="Reward (optional)"
              value={reward}
              onChange={(event) => setReward(Number(event.target.value))}
            />
            <select
              aria-label="Contact preference"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={contactPreference}
              onChange={(event) => setContactPreference(event.target.value)}
            >
              <option value="chat">In-app Chat</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
            </select>
          </div>
        ) : null}

        {type === "FOUND" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={safeWithMe} onChange={(event) => setSafeWithMe(event.target.checked)} />
            Safe with me
          </label>
        ) : null}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
          Anonymous posting
        </label>

        <div className="space-y-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-medium">Pick exact location</div>
            <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={locating}>
              {locating ? "Fetching..." : "Use my current location"}
            </Button>
          </div>
          <LocationPicker
            value={location}
            onChange={(lat, lng) => setLocation({ lat, lng })}
            center={center}
            radius={radius}
          />
          <div className="text-xs text-slate-500">Lat: {location.lat.toFixed(5)} • Lng: {location.lng.toFixed(5)}</div>
        </div>

        <Button
          onClick={submit}
          disabled={loading || uploadingImage || !imageUrl || !title || !description || !dateOccurred}
          className="w-full"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </Card>
    </motion.div>
  );
}
