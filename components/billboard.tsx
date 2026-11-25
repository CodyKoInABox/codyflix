"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { useApp } from "@/components/app-state";
import { MuteIcon, VolumeIcon } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { TitleActions } from "@/components/title-actions";
import { YoutubePlayer, type YoutubePlayerHandle } from "@/components/youtube-player";
import { useAmbientPreview } from "@/components/use-media";
import { channelForVideo } from "@/lib/catalog";
import { synopsis, yearOf } from "@/lib/text";
import type { Video } from "@/lib/types";

const ENDED = 0;
const PLAYING = 1;
const QUIET_AFTER_MS = 4500;

function previewFrame(media: HTMLElement | null): HTMLIFrameElement | null {
  return media?.querySelector<HTMLIFrameElement>(".billboard-frame iframe") ?? null;
}

// YoutubePlayerHandle only exposes mute, so pause, resume, and replay use the
// IFrame API's postMessage commands on the player's own iframe.
function command(frame: HTMLIFrameElement | null, func: "playVideo" | "pauseVideo" | "seekTo", args: unknown[] = []) {
  if (!frame?.contentWindow || !frame.src.startsWith("https://")) return;
  frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), new URL(frame.src).origin);
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function playerState(data: unknown): number | null {
  if (typeof data !== "string") return null;
  try {
    const message = JSON.parse(data) as { event?: string; info?: unknown };
    if (message.event === "onStateChange" && typeof message.info === "number") return message.info;
    const info = message.info as { playerState?: unknown } | null | undefined;
    if (message.event === "infoDelivery" && typeof info?.playerState === "number") return info.playerState;
  } catch {
    return null;
  }
  return null;
}

export function Billboard({ video }: { video: Video }) {
  const { catalog, modalId, hover } = useApp();
  const ambient = useAmbientPreview();
  const channel = channelForVideo(catalog, video);
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
  const [previewFailed, setPreviewFailed] = useState(false);
  const showPreview = ambient && !previewFailed;
  const [mountedPreview, setMountedPreview] = useState(showPreview);
  const shouldPlay = showPreview && !ended && onScreen && pageVisible && !modalId && !hover;
  const year = yearOf(video.publishedAt);

  if (mountedPreview !== showPreview) {
    setMountedPreview(showPreview);
    setMuted(true);
    setEnded(false);
    setQuiet(false);
  }

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.intersectionRatio >= 0.5), {
      threshold: [0, 0.5, 1],
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const onPlayerState = useEffectEvent((state: number) => {
    if (state === ENDED) {
      setEnded(true);
      setQuiet(false);
    } else if (state === PLAYING && !shouldPlay) {
      command(previewFrame(mediaRef.current), "pauseVideo");
    }
  });

  useEffect(() => {
    if (!showPreview) return;
    const onMessage = (event: MessageEvent) => {
      const frame = previewFrame(mediaRef.current);
      if (!frame || event.source !== frame.contentWindow) return;
      const state = playerState(event.data);
      if (state != null) onPlayerState(state);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [showPreview]);

  useEffect(() => {
    if (!showPreview) return;
    command(previewFrame(mediaRef.current), shouldPlay ? "playVideo" : "pauseVideo");
    if (!shouldPlay) return;
    const timer = window.setTimeout(() => setQuiet(true), QUIET_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [shouldPlay, showPreview]);

  function replay() {
    command(previewFrame(mediaRef.current), "seekTo", [0, true]);
    setEnded(false);
  }

  const classes = ["billboard"];
  if (showPreview && quiet && shouldPlay) classes.push("is-quiet");
  if (ended) classes.push("is-ended");

  return (
    <section ref={sectionRef} className={classes.join(" ")} aria-label="Featured">
      <div ref={mediaRef} className="billboard-media">
        <Thumb
          video={video}
          priority
          alt={`Thumbnail for ${video.title}${channel ? ` by ${channel.name}` : ""}`}
        />
        {showPreview ? (
          <YoutubePlayer
            ref={playerRef}
            videoId={video.id}
            title={`Muted preview of ${video.title}`}
            autoPlay
            muted
            controls={false}
            concealError
            onUnavailable={() => setPreviewFailed(true)}
            className="billboard-frame"
          />
        ) : null}
      </div>
      <div className="billboard-scrim" />
      <div className="billboard-copy">
        <p className="billboard-kicker">
          <span className="billboard-mark" aria-hidden="true">
            C
          </span>
          {channel ? <Link href={`/channel/${channel.slug}/`}>{channel.name}</Link> : "Codyflix"}
          {year ? <span> · {year}</span> : null}
        </p>
        <h1 className={video.title.length > 42 ? "billboard-title is-long" : "billboard-title"}>{video.title}</h1>
        <p className="billboard-synopsis">
          {synopsis(video.description, channel ? `Recent upload from ${channel.name}.` : "Recent upload on Codyflix.")}
        </p>
        <TitleActions video={video} layout="billboard" />
      </div>
      {showPreview ? (
        <div className="billboard-tools">
          {ended ? (
            <button type="button" className="billboard-round" aria-label={`Replay preview of ${video.title}`} onClick={replay}>
              <ReplayIcon />
            </button>
          ) : (
            <button
              type="button"
              className="billboard-round"
              aria-pressed={!muted}
              aria-label={muted ? "Unmute preview" : "Mute preview"}
              onClick={() => {
                const next = playerRef.current?.toggleMute();
                if (typeof next === "boolean") setMuted(next);
              }}
            >
              {muted ? <MuteIcon /> : <VolumeIcon />}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 4.5V1.8L7.6 5.6 12 9.4V6.5a5.5 5.5 0 1 1-5.5 5.5h-2A7.5 7.5 0 1 0 12 4.5Z"
      />
    </svg>
  );
}
