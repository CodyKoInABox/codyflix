"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/components/app-state";
import { Thumb } from "@/components/thumb";
import { TitleActions } from "@/components/title-actions";
import { useAmbientPreview, useHydrated } from "@/components/use-media";
import { YoutubePlayer } from "@/components/youtube-player";
import { channelForVideo } from "@/lib/catalog";
import { yearOf } from "@/lib/text";

export function HoverCard() {
  const { hover, catalog, cancelClearHover, scheduleClearHover, openTitle } = useApp();
  const hydrated = useHydrated();
  const preview = useAmbientPreview();
  const video = hover ? catalog.videos.find((item) => item.id === hover.videoId) : undefined;

  useEffect(() => {
    if (!hover) return;
    const close = () => scheduleClearHover();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [hover, scheduleClearHover]);

  if (!hydrated || !hover || !video || typeof document === "undefined") return null;
  const channel = channelForVideo(catalog, video);

  return createPortal(
    <div
      id="hover-card"
      className="hover-card"
      style={{ top: hover.top, left: hover.left, width: hover.width }}
      onMouseEnter={cancelClearHover}
      onMouseLeave={scheduleClearHover}
    >
      <div className="hover-card-media">
        <Thumb video={video} alt="" />
        {preview ? (
          <YoutubePlayer
            videoId={video.id}
            title={`Muted preview of ${video.title}`}
            autoPlay
            muted
            controls={false}
            loop
            concealError
            className="hover-frame"
          />
        ) : null}
      </div>
      <div className="hover-card-body">
        <TitleActions video={video} layout="icons" onMoreInfo={() => openTitle(video.id)} />
        <p className="hover-card-title">{video.title}</p>
        <p className="hover-card-meta">
          {channel?.name}
          {yearOf(video.publishedAt) ? ` · ${yearOf(video.publishedAt)}` : ""}
        </p>
      </div>
    </div>,
    document.body,
  );
}
