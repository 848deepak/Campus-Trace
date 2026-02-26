"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle, CircleMarker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const lostIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const foundIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const currentLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
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
};

export function CampusMap({
  items,
  filter,
  center,
  radius,
  currentLocation,
}: {
  items: Item[];
  filter: "BOTH" | "LOST" | "FOUND";
  center: [number, number];
  radius: number;
  currentLocation?: { lat: number; lng: number } | null;
}) {
  const visible = useMemo(
    () => (filter === "BOTH" ? items : items.filter((item) => item.type === filter)),
    [items, filter],
  );

  const heat = useMemo(() => {
    const bucket = new Map<string, { lat: number; lng: number; count: number }>();
    visible.forEach((item) => {
      const key = `${item.latitude.toFixed(3)}:${item.longitude.toFixed(3)}`;
      const current = bucket.get(key);
      if (current) {
        current.count += 1;
      } else {
        bucket.set(key, { lat: item.latitude, lng: item.longitude, count: 1 });
      }
    });
    return Array.from(bucket.values()).filter((entry) => entry.count > 1);
  }, [visible]);

  function RecenterOnCurrentLocation({ location }: { location?: { lat: number; lng: number } | null }) {
    const map = useMap();
    useEffect(() => {
      if (!location) return;
      map.setView([location.lat, location.lng], Math.max(map.getZoom(), 17));
    }, [location, map]);
    return null;
  }

  return (
    <MapContainer center={center} zoom={16} className="h-[520px] w-full rounded-xl" minZoom={14} maxZoom={20}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <Circle center={center} radius={radius} pathOptions={{ color: "#334155", dashArray: "4" }} />

      {currentLocation ? (
        <Marker
          position={[currentLocation.lat, currentLocation.lng]}
          icon={currentLocationIcon}
        >
          <Popup>You are here</Popup>
        </Marker>
      ) : null}

      <RecenterOnCurrentLocation location={currentLocation} />

      {heat.map((entry) => (
        <CircleMarker
          key={`${entry.lat}-${entry.lng}`}
          center={[entry.lat, entry.lng]}
          radius={Math.min(30, 8 + entry.count * 2)}
          pathOptions={{ color: "#f97316", fillOpacity: 0.25 }}
        />
      ))}

      <MarkerClusterGroup chunkedLoading>
        {visible.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={item.type === "LOST" ? lostIcon : foundIcon}
          >
            <Popup>
              <div className="space-y-2">
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-xs text-slate-500">{item.category} • {item.type}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.title} className="h-24 w-full rounded object-cover" />
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
