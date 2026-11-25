"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/components/app-state";
import { MuteIcon, VolumeIcon } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { TitleActions } from "@/components/title-actions";
import { useAmbientPreview, useHydrated } from "@/components/use-media";
import { hoverOrigin } from "@/components/video-card";
import { YoutubePlayer, type YoutubePlayerHandle } from "@/components/youtube-player";
import { channelForVideo } from "@/lib/catalog";
import { isFinished, progressRatio } from "@/lib/progress";
import { formatPublished, ROLE_LABEL, synopsis } from "@/lib/text";

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function minutes(seconds: number): string {
  const total = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(total / 60);
  return hours ? `${hours}h ${total % 60}m` : `${total}m`;
}

function originCard(): HTMLElement | null {
  const card = hoverOrigin.current;
  return card?.isConnected ? card : null;
}

export function HoverCard() {
  const { hover, catalog, library, cancelClearHover, scheduleClearHover, openTitle } = useApp();
  const hydrated = useHydrated();
  const preview = useAmbientPreview();
  const cardRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const [muted, setMuted] = useState(true);
  const [failedId, setFailedId] = useState<string | null>(null);
  const hoverKey = hover ? `${hover.videoId}:${hover.left}:${hover.top}` : null;
  const [seenKey, setSeenKey] = useState(hoverKey);
  const video = hover ? catalog.videos.find((item) => item.id === hover.videoId) : undefined;

  if (seenKey !== hoverKey) {
    setSeenKey(hoverKey);
    setMuted(true);
  }

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

  useLayoutEffect(() => {
    const node = cardRef.current;
    const thumb = originCard()?.querySelector(".title-card-thumb");
    if (!node || !hover || !thumb) return;
    const rect = thumb.getBoundingClientRect();
    const scale = Math.min(0.9, rect.width / hover.width);
    node.style.setProperty("--grow-from", String(scale));
    node.style.transformOrigin = `${(rect.left - hover.left) / (1 - scale)}px ${(rect.top - hover.top) / (1 - scale)}px`;
  }, [hover]);

  if (!hydrated || !hover || !video || typeof document === "undefined") return null;
  const channel = channelForVideo(catalog, video);
  const entry = library.progress[video.id];
  const ratio = progressRatio(entry);
  const finished = entry ? isFinished(entry) : false;
  const published = formatPublished(video.publishedAt);
  const age = Date.parse(catalog.generatedAt) - Date.parse(video.publishedAt);
  const fresh = age >= 0 && age <= NEW_WINDOW_MS;
  const duration = entry?.durationSeconds ? minutes(entry.durationSeconds) : "";
  const blurb = synopsis(video.description, "");
  const tags = [channel?.name, channel ? ROLE_LABEL[channel.role] : undefined].filter(Boolean);
  const showMute = preview && failedId !== video.id;
  let progressLabel = "";
  if (finished) progressLabel = "Watched";
  else if (ratio != null && entry?.durationSeconds) progressLabel = `${minutes(entry.positionSeconds)} of ${minutes(entry.durationSeconds)}`;
  else if (entry?.started) progressLabel = "Started";

  function moreInfo() {
    if (!video) return;
    originCard()?.querySelector<HTMLElement>(".title-card-link")?.focus({ preventScroll: true });
    openTitle(video.id);
  }

  return createPortal(
    <div
      key={hoverKey}
      ref={cardRef}
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
            ref={playerRef}
            videoId={video.id}
            title={`Muted preview of ${video.title}`}
            autoPlay
            muted
            controls={false}
            loop
            concealError
            onUnavailable={() => setFailedId(video.id)}
            className="hover-frame"
          />
        ) : null}
        {showMute ? (
          <button
            type="button"
            className="hover-mute"
            aria-pressed={!muted}
            aria-label={muted ? `Unmute preview of ${video.title}` : `Mute preview of ${video.title}`}
            onClick={() => {
              const next = playerRef.current?.toggleMute();
              if (typeof next === "boolean") setMuted(next);
            }}
          >
            {muted ? <MuteIcon /> : <VolumeIcon />}
          </button>
        ) : null}
      </div>
      <div className="hover-card-body">
        <TitleActions video={video} layout="icons" onMoreInfo={moreInfo} />
        {progressLabel ? (
          <div className="hover-card-progress">
            <span className="progress-track" aria-hidden="true">
              <span style={{ width: `${Math.round((finished ? 1 : (ratio ?? 0)) * 100)}%` }} />
            </span>
            <span>{progressLabel}</span>
          </div>
        ) : null}
        <p className="hover-card-title">{video.title}</p>
        <p className="hover-card-meta">
          {fresh ? <span className="badge-new">New</span> : null}
          {published ? <span>{published}</span> : null}
          {duration ? <span>{duration}</span> : null}
        </p>
        {tags.length > 0 ? (
          <ul className="hover-card-tags" aria-label="Tags">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
        {blurb ? <p className="hover-card-synopsis">{blurb}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
