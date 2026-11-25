import { describe, expect, it } from "vitest";
import { continueWatching, progressRatio, recordProgress } from "@/lib/progress";
import type { ProgressEntry, Video } from "@/lib/types";

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

describe("recordProgress", () => {
  it("does not invent a duration when the player has not reported one", () => {
    const next = recordProgress({}, { videoId: "aaaaaaaaaaa", positionSeconds: 12, now: 10 });
    expect(next.aaaaaaaaaaa).toEqual({
      videoId: "aaaaaaaaaaa",
      positionSeconds: 12,
      updatedAt: 10,
      started: true,
    });
    expect(next.aaaaaaaaaaa).not.toHaveProperty("durationSeconds");
  });

  it("keeps a previously reported duration", () => {
    const existing: Record<string, ProgressEntry> = {
      aaaaaaaaaaa: {
        videoId: "aaaaaaaaaaa",
        positionSeconds: 5,
        durationSeconds: 100,
        updatedAt: 1,
        started: true,
      },
    };
    const next = recordProgress(existing, { videoId: "aaaaaaaaaaa", positionSeconds: 40, now: 2 });
    expect(next.aaaaaaaaaaa.durationSeconds).toBe(100);
    expect(next.aaaaaaaaaaa.positionSeconds).toBe(40);
    expect(existing.aaaaaaaaaaa.positionSeconds).toBe(5);
  });

  it("ignores a zero duration", () => {
    const next = recordProgress({}, { videoId: "aaaaaaaaaaa", positionSeconds: 1, durationSeconds: 0, now: 3 });
    expect(next.aaaaaaaaaaa).not.toHaveProperty("durationSeconds");
  });
});

describe("continueWatching", () => {
  it("orders unfinished titles by most recently watched and drops completed ones", () => {
    const progress: Record<string, ProgressEntry> = {
      aaaaaaaaaaa: {
        videoId: "aaaaaaaaaaa",
        positionSeconds: 95,
        durationSeconds: 100,
        updatedAt: 50,
        started: true,
      },
      bbbbbbbbbbb: {
        videoId: "bbbbbbbbbbb",
        positionSeconds: 10,
        updatedAt: 20,
        started: true,
      },
    };
    expect(continueWatching(videos, progress).map((video) => video.id)).toEqual(["bbbbbbbbbbb"]);
    expect(progressRatio(progress.aaaaaaaaaaa)).toBe(0.95);
    expect(progressRatio(progress.bbbbbbbbbbb)).toBeNull();
  });
});
