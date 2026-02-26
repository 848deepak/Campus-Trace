import { describe, expect, it } from "vitest";
import { computeMatchScore, distanceMeters } from "@/lib/matching";

describe("matching", () => {
  it("returns near-zero distance for identical coordinates", () => {
    expect(distanceMeters(28.6139, 77.209, 28.6139, 77.209)).toBeLessThan(0.001);
  });

  it("gives high score for close and similar items", () => {
    const result = computeMatchScore({
      categoryA: "Phone",
      categoryB: "Phone",
      titleA: "Black iPhone 13",
      titleB: "iPhone black found",
      dateA: new Date("2026-02-20T10:00:00Z"),
      dateB: new Date("2026-02-21T09:00:00Z"),
      latA: 28.6139,
      lngA: 77.209,
      latB: 28.6142,
      lngB: 77.2091,
    });

    expect(result.score).toBeGreaterThan(0.55);
    expect(result.distance).toBeLessThan(200);
  });

  it("gives low score for far and dissimilar items", () => {
    const result = computeMatchScore({
      categoryA: "Wallet",
      categoryB: "Laptop",
      titleA: "Brown wallet with cards",
      titleB: "Silver laptop",
      dateA: new Date("2026-02-01T10:00:00Z"),
      dateB: new Date("2026-02-25T10:00:00Z"),
      latA: 28.6139,
      lngA: 77.209,
      latB: 28.7,
      lngB: 77.3,
    });

    expect(result.score).toBeLessThan(0.35);
    expect(result.distance).toBeGreaterThan(200);
  });
});
