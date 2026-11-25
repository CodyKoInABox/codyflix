import { describe, expect, it } from "vitest";
import { resolveMyList, toggleMyList } from "@/lib/mylist";
import type { Video } from "@/lib/types";

const videos: Video[] = [
  {
    id: "aaaaaaaaaaa",
    channelId: "main",
    title: "One",
    description: "",
    publishedAt: "2024-01-01T00:00:00.000Z",
    thumbnail: "https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg",
  },
  {
    id: "bbbbbbbbbbb",
    channelId: "main",
    title: "Two",
    description: "",
    publishedAt: "2024-02-01T00:00:00.000Z",
    thumbnail: "https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg",
  },
];

describe("my list", () => {
  it("adds to the front and removes on the next toggle without mutating the original", () => {
    const original = ["bbbbbbbbbbb"];
    const added = toggleMyList(original, "aaaaaaaaaaa");
    expect(added).toEqual(["aaaaaaaaaaa", "bbbbbbbbbbb"]);
    expect(original).toEqual(["bbbbbbbbbbb"]);
    expect(toggleMyList(added, "aaaaaaaaaaa")).toEqual(["bbbbbbbbbbb"]);
  });

  it("drops unknown ids and duplicates while preserving order", () => {
    const resolved = resolveMyList(["missing", "bbbbbbbbbbb", "bbbbbbbbbbb", "aaaaaaaaaaa"], videos);
    expect(resolved.map((video) => video.id)).toEqual(["bbbbbbbbbbb", "aaaaaaaaaaa"]);
  });
});
