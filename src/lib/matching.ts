interface MatchInput {
  categoryA: string;
  categoryB: string;
  titleA: string;
  titleB: string;
  descriptionA?: string;
  descriptionB?: string;
  dateA: Date;
  dateB: Date;
  latA: number;
  lngA: number;
  latB: number;
  lngB: number;
}

const MAX_DISTANCE_METERS = 200;
const MAX_DATE_GAP_DAYS = 10;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earth = 6371e3;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earth * c;
}

function titleSimilarity(a: string, b: string) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (!wordsA.size || !wordsB.size) {
    return 0;
  }
  let intersection = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) {
      intersection += 1;
    }
  });
  return intersection / Math.max(wordsA.size, wordsB.size);
}

function descriptionSimilarity(a?: string, b?: string) {
  if (!a || !b) {
    return 0;
  }
  return titleSimilarity(a, b);
}

export function computeMatchScore(data: MatchInput) {
  const categoryScore = data.categoryA === data.categoryB ? 1 : 0;
  const distance = distanceMeters(data.latA, data.lngA, data.latB, data.lngB);
  const distanceScore = Math.max(0, 1 - distance / MAX_DISTANCE_METERS);
  const dateGap = Math.abs(data.dateA.getTime() - data.dateB.getTime()) / (1000 * 60 * 60 * 24);
  const dateScore = Math.max(0, 1 - dateGap / MAX_DATE_GAP_DAYS);
  const titleScore = titleSimilarity(data.titleA, data.titleB);
  const descriptionScore = descriptionSimilarity(data.descriptionA, data.descriptionB);

  const score =
    categoryScore * 0.35 +
    distanceScore * 0.2 +
    dateScore * 0.1 +
    titleScore * 0.2 +
    descriptionScore * 0.15;
  return {
    score,
    distance,
  };
}
