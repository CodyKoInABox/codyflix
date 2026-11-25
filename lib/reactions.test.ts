import { describe, expect, it } from "vitest";
import { setReaction } from "@/lib/reactions";

describe("setReaction", () => {
  it("sets, replaces, and clears a reaction without mutating the input", () => {
    const initial = { aaaaaaaaaaa: "like" as const };
    const disliked = setReaction(initial, "aaaaaaaaaaa", "dislike");
    expect(disliked).toEqual({ aaaaaaaaaaa: "dislike" });
    expect(initial).toEqual({ aaaaaaaaaaa: "like" });
    expect(setReaction(disliked, "aaaaaaaaaaa", null)).toEqual({});
  });
});
