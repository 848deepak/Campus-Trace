import { describe, expect, it } from "vitest";
import {
  getCampusBlock,
  isAllowedCollegeEmail,
  isOlderThanDays,
  sanitizeSensitiveText,
} from "@/lib/feature-utils";

describe("feature-utils", () => {
  it("accepts only configured college domain", () => {
    expect(isAllowedCollegeEmail("student@college.edu")).toBe(true);
    expect(isAllowedCollegeEmail("student@other.edu")).toBe(false);
  });

  it("sanitizes email, phone, card number and links", () => {
    const input = "email me at user@college.edu or call +91 9876543210 with card 1234567812345678 https://site.test";
    const output = sanitizeSensitiveText(input);

    expect(output).toContain("[hidden-email]");
    expect(output).toContain("[hidden-phone]");
    expect(output).toContain("[hidden-card]");
    expect(output).toContain("[hidden-link]");
  });

  it("maps coordinates to campus blocks", () => {
    expect(getCampusBlock(28.6139, 77.209, 28.6139, 77.209)).toBe("Central Block");
    expect(getCampusBlock(28.615, 77.21, 28.6139, 77.209)).toBe("North-East Block");
    expect(getCampusBlock(28.612, 77.208, 28.6139, 77.209)).toBe("South-West Block");
  });

  it("checks day-based expiry", () => {
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const freshDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    expect(isOlderThanDays(oldDate, 30)).toBe(true);
    expect(isOlderThanDays(freshDate, 30)).toBe(false);
  });
});
