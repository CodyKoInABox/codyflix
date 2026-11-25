"use client";

import { forwardRef, useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from "react";
import type { ProgressUpdate } from "@/lib/types";

export interface YoutubePlayerHandle {
  toggleMute: () => boolean | null;
}

interface YoutubePlayerProps {
  videoId: string;
  title: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  track?: boolean;
  resumeSeconds?: number;
  concealError?: boolean;
  onUnavailable?: () => void;
  onProgress?: (update: ProgressUpdate) => void;
  className?: string;
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("YouTube API needs a browser"));
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube-nocookie.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error("YouTube IFrame API failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

export const YoutubePlayer = forwardRef<YoutubePlayerHandle, YoutubePlayerProps>(function YoutubePlayer(
  { videoId, title, autoPlay = false, muted = false, controls = true, loop = false, track = false, resumeSeconds = 0, concealError = false, onUnavailable, onProgress, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const resumeRef = useRef(resumeSeconds);
  const [fallback, setFallback] = useState(false);
  const [concealed, setConcealed] = useState(false);
  const unavailable = useEffectEvent(() => {
    onUnavailable?.();
  });
  const report = useEffectEvent(() => {
    if (!track || !onProgress) return;
    const player = playerRef.current;
    let positionSeconds = 0;
    let durationSeconds: number | undefined;
    if (player) {
      try {
        positionSeconds = Math.max(0, player.getCurrentTime() || 0);
        const duration = player.getDuration();
        if (Number.isFinite(duration) && duration > 0) durationSeconds = duration;
      } catch {
        positionSeconds = 0;
      }
    }
    onProgress({ videoId, positionSeconds, durationSeconds, started: true });
  });

  useImperativeHandle(ref, () => ({
    toggleMute: () => {
      const player = playerRef.current;
      if (!player) return null;
      if (player.isMuted()) {
        player.unMute();
        return false;
      }
      player.mute();
      return true;
    },
  }));

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;
    const mount = document.createElement("div");
    parent.appendChild(mount);
    let cancelled = false;
    let interval = 0;
    let instance: YTPlayer | null = null;
    let ready = false;
    const giveUp = () => {
      if (cancelled) return;
      if (concealError) setConcealed(true);
      else setFallback(true);
      unavailable();
    };
    const failTimer = window.setTimeout(() => {
      if (!ready) giveUp();
    }, 8000);

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !window.YT?.Player) return;
        instance = new window.YT.Player(mount, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            mute: muted ? 1 : 0,
            controls: controls ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
            ...(loop ? { loop: 1, playlist: videoId } : {}),
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              ready = true;
              window.clearTimeout(failTimer);
              playerRef.current = event.target;
              const iframe = event.target.getIframe?.();
              if (iframe) {
                iframe.style.position = "absolute";
                iframe.style.inset = "0";
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.title = title;
                iframe.referrerPolicy = "strict-origin-when-cross-origin";
              }
              parent.classList.add("is-ready");
              const resume = resumeRef.current;
              if (track && resume > 1) {
                const duration = event.target.getDuration();
                if (!duration || resume < duration - 2) event.target.seekTo(resume, true);
              }
            },
            onStateChange: (event) => {
              const playing = event.data === 1;
              const paused = event.data === 2;
              const ended = event.data === 0;
              if (playing) {
                window.clearInterval(interval);
                interval = window.setInterval(() => report(), 5000);
                report();
              } else if (paused) {
                window.clearInterval(interval);
                report();
              } else if (ended) {
                window.clearInterval(interval);
                report();
              }
            },
            onError: () => {
              giveUp();
            },
          },
        });
        })
      .catch(() => {
        giveUp();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(failTimer);
      window.clearInterval(interval);
      const player = playerRef.current ?? instance;
      playerRef.current = null;
      try {
        player?.destroy();
      } catch {
        mount.remove();
      }
    };
  }, [autoPlay, concealError, controls, loop, muted, title, track, videoId]);

  useEffect(() => {
    if ((fallback || concealed) && track) report();
  }, [concealed, fallback, track]);

  if (concealed) return null;

  if (fallback) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    if (autoPlay) params.set("autoplay", "1");
    if (muted) params.set("mute", "1");
    if (!controls) params.set("controls", "0");
    return (
      <iframe
        className={`player-frame ${className ?? ""}`}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return <div ref={hostRef} className={`player-host ${className ?? ""}`} />;
});
