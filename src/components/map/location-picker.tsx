"use client";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents, Circle } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Picker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function LocationPicker({
  value,
  onChange,
  center,
  radius,
}: {
  value: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
  center: [number, number];
  radius: number;
}) {
  const markerPosition = useMemo(() => [value.lat, value.lng] as [number, number], [value]);

  return (
    <MapContainer center={center} zoom={16} className="h-64 w-full rounded-lg">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <Circle center={center} radius={radius} pathOptions={{ color: "#334155", dashArray: "4" }} />
      <Marker position={markerPosition} icon={markerIcon} />
      <Picker onPick={onChange} />
    </MapContainer>
  );
}
