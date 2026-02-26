import { describe, expect, it } from "vitest";
import { hashSimilarity, semanticSimilarity } from "@/lib/ai";

describe("ai utilities", () => {
  it("returns full similarity for identical hashes", () => {
    expect(hashSimilarity("abcd", "abcd")).toBe(1);
  });

  it("returns partial similarity for different hashes", () => {
    expect(hashSimilarity("abcd", "abcf")).toBeCloseTo(0.75, 3);
  });

  it("returns null when hashes are absent or length mismatch", () => {
    expect(hashSimilarity(undefined, "abcf")).toBeNull();
    expect(hashSimilarity("abc", "abcf")).toBeNull();
  });

  it("returns null semantic score when semantic matching is not explicitly enabled", async () => {
    const value = await semanticSimilarity("black wallet", "wallet with cards");
    expect(value).toBeNull();
  });
});
