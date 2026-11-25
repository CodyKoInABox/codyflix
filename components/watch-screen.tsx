"use client";

import { useApp } from "@/components/app-state";
import { TitleDetail } from "@/components/title-detail";

export function WatchScreen({ videoId }: { videoId: string }) {
  const { catalog } = useApp();
  const video = catalog.videos.find((item) => item.id === videoId);
  if (!video) {
    return (
      <div className="page empty-state">
        <h1>That title is not in the catalog</h1>
      </div>
    );
  }
  return <TitleDetail video={video} mode="page" />;
}
