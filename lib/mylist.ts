import type { Video } from "@/lib/types";

export function toggleMyList(list: string[], videoId: string): string[] {
  if (list.includes(videoId)) return list.filter((id) => id !== videoId);
  return [videoId, ...list.filter((id) => id !== videoId)];
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
