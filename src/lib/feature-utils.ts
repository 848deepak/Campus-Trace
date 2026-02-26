const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN ?? "college.edu").toLowerCase();

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAllowedCollegeEmail(email: string) {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

export function sanitizeSensitiveText(content: string) {
  return content
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[hidden-email]")
    .replace(/\b\d{12,19}\b/g, "[hidden-card]")
    .replace(/\b(?:\+?\d[\d\s-]{8,}\d)\b/g, "[hidden-phone]")
    .replace(/https?:\/\/\S+/gi, "[hidden-link]");
}

export function getCampusBlock(lat: number, lng: number, centerLat: number, centerLng: number) {
  const latBand = lat >= centerLat ? "North" : "South";
  const lngBand = lng >= centerLng ? "East" : "West";
  const nearCenter = Math.abs(lat - centerLat) < 0.0009 && Math.abs(lng - centerLng) < 0.0009;

  if (nearCenter) {
    return "Central Block";
  }

  return `${latBand}-${lngBand} Block`;
}

export function isOlderThanDays(date: Date, days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() < cutoff;
}
