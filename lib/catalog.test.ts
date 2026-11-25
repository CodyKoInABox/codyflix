import { describe, expect, it } from "vitest";
import channels from "@/data/channels.json";
import { getCatalog } from "@/lib/catalog";
import { CHANNEL_ROLES } from "@/lib/types";

describe("committed catalog", () => {
  const catalog = getCatalog();

  it("covers the configured channels with real YouTube ids and no invented metrics", () => {
    expect(catalog.channels.map((channel) => channel.id)).toEqual(channels.map((channel) => channel.id));
    expect(catalog.videos.length).toBeGreaterThan(0);
    const channelIds = new Set(catalog.channels.map((channel) => channel.id));
    for (const channel of catalog.channels) {
      expect(CHANNEL_ROLES).toContain(channel.role);
      expect(channel.id).toMatch(/^UC[\w-]{22}$/);
      expect(catalog.videos.some((video) => video.channelId === channel.id)).toBe(true);
    }
    for (const video of catalog.videos) {
      expect(video.id).toMatch(/^[\w-]{11}$/);
      expect(video.title.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(video.publishedAt))).toBe(false);
      expect(video.thumbnail).toMatch(/^https:\/\/i\d?\.ytimg\.com\//);
      expect(channelIds.has(video.channelId)).toBe(true);
      expect(video).not.toHaveProperty("viewCount");
      expect(video).not.toHaveProperty("duration");
      expect(video).not.toHaveProperty("durationSeconds");
    }
  });

  it("includes the Cody Ko universe roles we could verify", () => {
    const roles = new Set(catalog.channels.map((channel) => channel.role));
    expect(roles.has("main")).toBe(true);
    expect(roles.has("second")).toBe(true);
    expect(roles.has("collab")).toBe(true);
    expect(roles.has("wife")).toBe(true);
    expect(roles.has("podcast")).toBe(true);
    expect(catalog.notes.join(" ")).toMatch(/DJ/i);
  });
});
