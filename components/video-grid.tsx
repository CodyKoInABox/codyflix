"use client";

import { VideoCard } from "@/components/video-card";
import type { Video } from "@/lib/types";

export function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <ul className="catalog-grid">
      {videos.map((video) => (
        <li key={video.id}>
          <VideoCard video={video} />
        </li>
      ))}
    </ul>
  );
}
