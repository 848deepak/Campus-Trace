const centerLat = Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LAT ?? 28.6139);
const centerLng = Number(process.env.NEXT_PUBLIC_CAMPUS_CENTER_LNG ?? 77.209);
const radiusMeters = Number(process.env.NEXT_PUBLIC_CAMPUS_RADIUS_METERS ?? 1200);

export const CAMPUS_CONFIG = {
  centerLat,
  centerLng,
  radiusMeters,
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceFromCampusCenter(lat: number, lng: number) {
  const earth = 6371e3;
  const dLat = toRadians(lat - centerLat);
  const dLng = toRadians(lng - centerLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(centerLat)) * Math.cos(toRadians(lat)) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinCampus(lat: number, lng: number) {
  return distanceFromCampusCenter(lat, lng) <= radiusMeters;
}
