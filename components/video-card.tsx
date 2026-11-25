"use client";

import Link from "next/link";
import { useRef } from "react";
import { useApp } from "@/components/app-state";
import { Thumb } from "@/components/thumb";
import { useFinePointer } from "@/components/use-media";
import { channelForVideo } from "@/lib/catalog";
import { progressRatio } from "@/lib/progress";
import { yearOf } from "@/lib/text";
import type { Video } from "@/lib/types";

export function VideoCard({
  video,
  hoverCards = true,
  priority = false,
}: {
  video: Video;
  hoverCards?: boolean;
  priority?: boolean;
}) {
  const { catalog, library, openTitle, setHover, scheduleClearHover } = useApp();
  const fine = useFinePointer();
  const timer = useRef(0);
  const channel = channelForVideo(catalog, video);
  const year = yearOf(video.publishedAt);
  const entry = library.progress[video.id];
  const ratio = progressRatio(entry);
  const channelName = channel?.name ?? "YouTube";

  return (
    <article
      className="title-card"
      data-video-id={video.id}
      onMouseEnter={(event) => {
        if (!hoverCards || !fine) return;
        const target = event.currentTarget;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          const rect = target.getBoundingClientRect();
          const width = Math.round(Math.max(rect.width * 1.48, 280));
          const estimated = width * (9 / 16) + 150;
          const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12));
          const top = Math.max(76, Math.min(rect.top - 12, window.innerHeight - estimated - 12));
          setHover({ videoId: video.id, top, left, width });
        }, 680);
      }}
      onMouseLeave={() => {
        window.clearTimeout(timer.current);
        if (hoverCards && fine) scheduleClearHover();
      }}
    >
      <Link
        className="title-card-link"
        href={`/watch/${video.id}/`}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          openTitle(video.id);
        }}
      >
        <span className="title-card-thumb">
          <Thumb video={video} priority={priority} />
          {ratio != null ? (
            <span className="progress" aria-hidden="true">
              <span style={{ width: `${Math.round(ratio * 100)}%` }} />
            </span>
          ) : entry?.started ? (
            <span className="started-pill">Started</span>
          ) : null}
        </span>
        <span className="title-card-copy">
          <span className="title-card-name">{video.title}</span>
          <span className="title-card-sub">
            {channelName}
            {year ? ` · ${year}` : ""}
          </span>
        </span>
      </Link>
    </article>
  );
}
