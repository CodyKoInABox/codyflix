import { describe, expect, it } from "vitest";
import { channelsInResults, searchHref, searchReturnPath, searchVideos } from "@/lib/search";
import type { Channel, Video } from "@/lib/types";

const channels: Channel[] = [
  {
    id: "main",
    slug: "cody-ko",
    name: "Cody Ko",
    role: "main",
    handle: "@codyko",
    url: "https://www.youtube.com/channel/main",
    blurb: "",
  },
  {
    id: "wife",
    slug: "kelsey",
    name: "Kelsey Kreppel",
    role: "wife",
    handle: "@k",
    url: "https://www.youtube.com/channel/wife",
    blurb: "",
  },
];

function video(partial: Partial<Video> & Pick<Video, "id" | "title">): Video {
  return {
    channelId: "main",
    description: "",
    publishedAt: "2024-01-01T00:00:00.000Z",
    thumbnail: "https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg",
    ...partial,
  };
}

const videos = [
  video({ id: "aaaaaaaaaaa", title: "Tinder Nightmares 8", publishedAt: "2024-04-19T00:00:00.000Z" }),
  video({
    id: "bbbbbbbbbbb",
    title: "Something else",
    description: "A tinder story buried in the description",
    publishedAt: "2025-01-01T00:00:00.000Z",
  }),
  video({
    id: "ccccccccccc",
    channelId: "wife",
    title: "elaborate date night",
    publishedAt: "2026-11-06T00:00:00.000Z",
  }),
];

describe("searchVideos", () => {
  it("returns nothing for a blank query", () => {
    expect(searchVideos(videos, channels, "   ")).toEqual([]);
  });

  it("matches titles ahead of descriptions and is case insensitive", () => {
    const results = searchVideos(videos, channels, "tinder");
    expect(results.map((item) => item.id)).toEqual(["aaaaaaaaaaa", "bbbbbbbbbbb"]);
  });

  it("matches a channel name", () => {
    const results = searchVideos(videos, channels, "kelsey");
    expect(results.map((item) => item.id)).toEqual(["ccccccccccc"]);
  });

  it("requires every word to match", () => {
    expect(searchVideos(videos, channels, "tinder date")).toEqual([]);
    expect(searchVideos(videos, channels, "elaborate night").map((item) => item.id)).toEqual(["ccccccccccc"]);
  });
});

describe("searchHref", () => {
  it("trims and encodes the query, and drops it when blank", () => {
    expect(searchHref("  tinder & dates ")).toBe("/search/?q=tinder%20%26%20dates");
    expect(searchHref("   ")).toBe("/search/");
  });
});

describe("channelsInResults", () => {
  it("orders channels by hits, then catalog order, and skips channels with none", () => {
    const hits = [videos[2], videos[0], videos[1]];
    expect(channelsInResults(hits, channels).map((channel) => channel.id)).toEqual(["main", "wife"]);
    expect(channelsInResults([videos[2]], channels).map((channel) => channel.id)).toEqual(["wife"]);
    expect(channelsInResults(hits, channels, 1).map((channel) => channel.id)).toEqual(["main"]);
  });
});

describe("searchReturnPath", () => {
  const origin = "https://codyflix.example";

  it("keeps the path, query, and hash of a same-site page", () => {
    expect(searchReturnPath(`${origin}/channel/cody-ko/?tab=1#top`, origin)).toBe("/channel/cody-ko/?tab=1#top");
    expect(searchReturnPath(`${origin}/`, origin)).toBe("/");
  });

  it("ignores the search page itself, other sites, and junk", () => {
    expect(searchReturnPath(`${origin}/search/?q=tinder`, origin)).toBeNull();
    expect(searchReturnPath("https://evil.example/my-list/", origin)).toBeNull();
    expect(searchReturnPath("http://[", origin)).toBeNull();
  });
});
