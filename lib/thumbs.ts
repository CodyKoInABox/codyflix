import type { Video } from "@/lib/types";

export function cardThumb(video: Pick<Video, "id">): string {
  return `https://i.ytimg.com/vi/${video.id}/hq720.jpg`;
}

export function fallbackThumb(video: Pick<Video, "id" | "thumbnail">): string {
  if (video.thumbnail.startsWith("https://")) return video.thumbnail;
  return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
}
