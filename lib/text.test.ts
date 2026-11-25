import { describe, expect, it } from "vitest";
import { formatPublished, truncate, yearOf } from "@/lib/text";

describe("truncate", () => {
  it("keeps short text and trims whitespace", () => {
    expect(truncate("  hello   there  ", 40)).toBe("hello there");
  });

  it("cuts on a word boundary", () => {
    expect(truncate("Cody and Kelsey film a date night", 12)).toBe("Cody and…");
  });

  it("returns an empty string when the limit is zero", () => {
    expect(truncate("hello", 0)).toBe("");
  });
});

describe("dates", () => {
  it("formats a publish date in UTC", () => {
    expect(formatPublished("2026-11-24T18:04:30+00:00")).toBe("Nov 24, 2026");
    expect(yearOf("2026-11-24T18:04:30+00:00")).toBe("2026");
  });

  it("returns an empty string for junk dates", () => {
    expect(formatPublished("nope")).toBe("");
    expect(yearOf("nope")).toBe("");
  });
});
