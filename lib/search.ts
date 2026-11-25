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
