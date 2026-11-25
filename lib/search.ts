import type { Channel, Video } from "@/lib/types";

export function searchVideos(videos: Video[], channels: Channel[], query: string): Video[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const names = new Map(channels.map((channel) => [channel.id, channel.name.toLowerCase()]));
  const hits: { video: Video; rank: number }[] = [];

  for (const video of videos) {
    const title = video.title.toLowerCase();
    const description = video.description.toLowerCase();
    const channel = names.get(video.channelId) ?? "";
    const haystack = `${title}\n${description}\n${channel}`;
    if (!tokens.every((token) => haystack.includes(token))) continue;
    let rank = 4;
    if (title === normalized) rank = 0;
    else if (title.startsWith(normalized)) rank = 1;
    else if (title.includes(normalized)) rank = 2;
    else if (channel.includes(normalized)) rank = 3;
    hits.push({ video, rank });
  }

  hits.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const delta = Date.parse(b.video.publishedAt) - Date.parse(a.video.publishedAt);
    if (delta !== 0) return delta;
    return a.video.id < b.video.id ? -1 : a.video.id > b.video.id ? 1 : 0;
  });

  return hits.map((hit) => hit.video);
}

export function searchHref(query: string): string {
  const trimmed = query.trim();
  return trimmed ? `/search/?q=${encodeURIComponent(trimmed)}` : "/search/";
}

export function channelsInResults(results: Video[], channels: Channel[], limit = 6): Channel[] {
  const counts = new Map<string, number>();
  for (const video of results) counts.set(video.channelId, (counts.get(video.channelId) ?? 0) + 1);
  return channels
    .map((channel, index) => ({ channel, index, count: counts.get(channel.id) ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.channel);
}

export function searchReturnPath(href: string, origin: string): string | null {
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin || url.pathname.startsWith("/search")) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
