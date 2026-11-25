import { describe, expect, it } from "vitest";
import { buildHomeRows, selectFeatured, similarVideos } from "@/lib/rows";
import type { Channel, ProfileLibrary, Video } from "@/lib/types";

const channels: Channel[] = [
  {
    id: "main",
    slug: "cody-ko",
    name: "Cody Ko",
    role: "main",
    handle: "@codyko",
    url: "https://example.com/main",
    blurb: "",
  },
  {
    id: "second",
    slug: "cody-and-ko",
    name: "Cody & Ko",
    role: "second",
    handle: "@codyko2",
    url: "https://example.com/second",
    blurb: "",
  },
  {
    id: "tmg",
    slug: "tmg",
    name: "TMG Studios",
    role: "collab",
    handle: "@tmg",
    url: "https://example.com/tmg",
    blurb: "",
  },
  {
    id: "pod",
    slug: "chill",
    name: "Insanely Chill",
    role: "podcast",
    handle: "@chill",
    url: "https://example.com/pod",
    blurb: "",
  },
];

function video(id: string, channelId: string, publishedAt: string): Video {
  return {
    id,
    channelId,
    title: id,
    description: "",
    publishedAt,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

const videos = [
  video("main0000001", "main", "2024-06-01T00:00:00.000Z"),
  video("main0000002", "main", "2024-05-01T00:00:00.000Z"),
  video("second00001", "second", "2026-11-01T00:00:00.000Z"),
  video("tmg00000001", "tmg", "2025-11-01T00:00:00.000Z"),
  video("tmg00000002", "tmg", "2025-10-01T00:00:00.000Z"),
  video("pod00000001", "pod", "2024-07-01T00:00:00.000Z"),
];

const empty: ProfileLibrary = { list: [], likes: {}, progress: {} };

describe("buildHomeRows", () => {
  it("builds latest, top 10, channel, and grouped rows without personal rows", () => {
    const rows = buildHomeRows(channels, videos, empty);
    expect(rows.map((row) => row.id)).toEqual([
      "latest",
      "top10",
      "channel-cody-ko",
      "channel-cody-and-ko",
      "channel-tmg",
      "channel-chill",
      "podcasts-collabs",
    ]);
    expect(rows.find((row) => row.id === "top10")?.videos.map((video) => video.id)[0]).toBe("second00001");
    expect(rows.find((row) => row.id === "top10")?.note).toMatch(/publish date/i);
    expect(rows.find((row) => row.id === "podcasts-collabs")?.videos.map((video) => video.id)).toEqual([
      "tmg00000001",
      "tmg00000002",
      "pod00000001",
    ]);
  });

  it("puts continue watching and my list first, and builds a because-you-watched row", () => {
    const library: ProfileLibrary = {
      list: ["main0000002", "missing", "main0000002"],
      likes: {},
      progress: {
        main0000001: {
          videoId: "main0000001",
          positionSeconds: 8,
          updatedAt: 10,
          started: true,
        },
      },
      lastPlayedVideoId: "tmg00000001",
    };
    const rows = buildHomeRows(channels, videos, library);
    expect(rows[0]?.id).toBe("continue");
    expect(rows[0]?.videos.map((video) => video.id)).toEqual(["main0000001"]);
    expect(rows[1]?.id).toBe("my-list");
    expect(rows[1]?.videos.map((video) => video.id)).toEqual(["main0000002"]);
    const because = rows.find((row) => row.id === "because");
    expect(because?.title).toBe("Because you watched TMG Studios");
    expect(because?.videos.map((video) => video.id)).toEqual(["tmg00000002"]);
  });

  it("features the newest main-channel video even when another channel is newer", () => {
    expect(selectFeatured(channels, videos)?.id).toBe("main0000001");
  });

  it("prefers similar videos from the same channel", () => {
    const current = videos[0];
    expect(similarVideos(videos, current, 3).map((video) => video.id)).toEqual([
      "main0000002",
      "second00001",
      "tmg00000001",
    ]);
  });
});
