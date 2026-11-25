import type { Video } from "@/lib/types";

export function toggleMyList(list: string[], videoId: string): string[] {
  if (list.includes(videoId)) return list.filter((id) => id !== videoId);
  return [videoId, ...list.filter((id) => id !== videoId)];
}

export function suggestForMyList(list: string[], videos: Video[], limit = 12): Video[] {
  const saved = new Set(list);
  return videos
    .filter((video) => !saved.has(video.id))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, limit);
}

export function resolveMyList(list: string[], videos: Video[]): Video[] {
  const byId = new Map(videos.map((video) => [video.id, video]));
  const seen = new Set<string>();
  const resolved: Video[] = [];
  for (const id of list) {
    if (seen.has(id)) continue;
    const video = byId.get(id);
    if (!video) continue;
    seen.add(id);
    resolved.push(video);
  }
  return resolved;
}
