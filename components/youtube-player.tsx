"use client";

import { forwardRef, useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from "react";
import type { ProgressUpdate } from "@/lib/types";

declare global {
  interface YTPlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    getPlayerState: () => number;
    getVolume: () => number;
    setVolume: (volume: number) => void;
  }
}

export type PlaybackState = "unstarted" | "playing" | "paused" | "buffering" | "ended" | "cued";

export interface PlayerSnapshot {
  state: PlaybackState;
  currentSeconds: number;
  durationSeconds: number;
  muted: boolean;
  volume: number;
}

export interface YoutubePlayerHandle {
  toggleMute: () => boolean | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => PlaybackState | null;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => number | null;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  snapshot: () => PlayerSnapshot | null;
}

interface YoutubePlayerProps {
  videoId: string;
  title: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  track?: boolean;
  startSeconds?: number;
  focusable?: boolean;
  concealError?: boolean;
  onUnavailable?: () => void;
  onAutoplayMuted?: () => void;
  onProgress?: (update: ProgressUpdate) => void;
  className?: string;
}

const STATES: Record<number, PlaybackState> = {
  [-1]: "unstarted",
  0: "ended",
  1: "playing",
  2: "paused",
  3: "buffering",
  5: "cued",
};

const AUTOPLAY_GRACE_MS = 2500;

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
      script.src = "https://www.youtube.com/iframe_api";
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

function stateOf(player: YTPlayer): PlaybackState {
  return STATES[player.getPlayerState()] ?? "unstarted";
}

export const YoutubePlayer = forwardRef<YoutubePlayerHandle, YoutubePlayerProps>(function YoutubePlayer(
  {
    videoId,
    title,
    autoPlay = false,
    muted = false,
    controls = true,
    loop = false,
    track = false,
    startSeconds = 0,
    focusable = true,
    concealError = false,
    onUnavailable,
    onAutoplayMuted,
    onProgress,
    className,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const startRef = useRef(Math.max(0, Math.floor(startSeconds)));
  const playedRef = useRef(false);
  const [fallback, setFallback] = useState(false);
  const [concealed, setConcealed] = useState(false);
  const unavailable = useEffectEvent(() => {
    onUnavailable?.();
  });
  const autoplayMuted = useEffectEvent(() => {
    onAutoplayMuted?.();
  });
  const report = useEffectEvent(() => {
    const player = playerRef.current;
    // Until playback has started the player still reports 0, which would wipe a saved resume point.
    if (!track || !onProgress || !player || !playedRef.current) return;
    try {
      const positionSeconds = Math.max(0, player.getCurrentTime() || 0);
      const duration = player.getDuration();
      onProgress({
        videoId,
        positionSeconds,
        durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : undefined,
        started: true,
      });
    } catch {
      // The iframe can be torn down before the final read.
    }
  });

  useImperativeHandle(ref, () => {
    const withPlayer = <T,>(run: (player: YTPlayer) => T): T | null => {
      const player = playerRef.current;
      if (!player) return null;
      try {
        return run(player);
      } catch {
        return null;
      }
    };
    return {
      toggleMute: () =>
        withPlayer((player) => {
          if (player.isMuted()) {
            player.unMute();
            return false;
          }
          player.mute();
          return true;
        }),
      play: () => {
        withPlayer((player) => player.playVideo());
      },
      pause: () => {
        withPlayer((player) => player.pauseVideo());
      },
      togglePlay: () =>
        withPlayer((player) => {
          const state = stateOf(player);
          if (state === "playing" || state === "buffering") {
            player.pauseVideo();
            return "paused";
          }
          if (state === "ended") player.seekTo(0, true);
          player.playVideo();
          return "playing";
        }),
      seekTo: (seconds: number) => {
        withPlayer((player) => player.seekTo(Math.max(0, seconds), true));
      },
      seekBy: (deltaSeconds: number) =>
        withPlayer((player) => {
          const duration = player.getDuration() || Number.POSITIVE_INFINITY;
          const target = Math.min(Math.max(0, (player.getCurrentTime() || 0) + deltaSeconds), duration);
          player.seekTo(target, true);
          return target;
        }),
      setMuted: (next: boolean) => {
        withPlayer((player) => (next ? player.mute() : player.unMute()));
      },
      setVolume: (volume: number) => {
        withPlayer((player) => {
          const level = Math.round(Math.min(100, Math.max(0, volume)));
          player.setVolume(level);
          if (level > 0 && player.isMuted()) player.unMute();
          if (level === 0) player.mute();
        });
      },
      snapshot: () =>
        withPlayer((player) => ({
          state: stateOf(player),
          currentSeconds: Math.max(0, player.getCurrentTime() || 0),
          durationSeconds: Math.max(0, player.getDuration() || 0),
          muted: player.isMuted(),
          volume: player.getVolume(),
        })),
    };
  }, []);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;
    const mount = document.createElement("div");
    parent.appendChild(mount);
    let cancelled = false;
    let interval = 0;
    let autoplayTimer = 0;
    let instance: YTPlayer | null = null;
    let ready = false;
    playedRef.current = false;
    const giveUp = () => {
      if (cancelled) return;
      if (concealError) setConcealed(true);
      else setFallback(true);
      unavailable();
    };
    const failTimer = window.setTimeout(() => {
      if (!ready) giveUp();
    }, 8000);
    const start = startRef.current;

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
            disablekb: controls ? 0 : 1,
            fs: controls ? 1 : 0,
            iv_load_policy: 3,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
            ...(start > 0 ? { start } : {}),
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
                if (!focusable) {
                  iframe.tabIndex = -1;
                  iframe.inert = true;
                }
              }
              parent.classList.add("is-ready");
              if (!autoPlay) return;
              event.target.playVideo();
              if (muted) return;
              // Browsers block unmuted autoplay without a user gesture; fall back to muted playback.
              autoplayTimer = window.setTimeout(() => {
                const player = playerRef.current;
                if (cancelled || !player) return;
                const state = stateOf(player);
                if (state !== "unstarted" && state !== "cued") return;
                player.mute();
                player.playVideo();
                autoplayMuted();
              }, AUTOPLAY_GRACE_MS);
            },
            onStateChange: (event) => {
              const state = STATES[event.data];
              if (state === "playing") {
                playedRef.current = true;
                window.clearInterval(interval);
                interval = window.setInterval(() => report(), 5000);
                report();
              } else if (state === "paused" || state === "ended") {
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

    const onHidden = () => {
      if (document.visibilityState === "hidden") report();
    };
    const onPageHide = () => report();
    if (track) {
      document.addEventListener("visibilitychange", onHidden);
      window.addEventListener("pagehide", onPageHide);
    }

    return () => {
      if (track) {
        document.removeEventListener("visibilitychange", onHidden);
        window.removeEventListener("pagehide", onPageHide);
        report();
      }
      cancelled = true;
      window.clearTimeout(failTimer);
      window.clearTimeout(autoplayTimer);
      window.clearInterval(interval);
      const player = playerRef.current ?? instance;
      playerRef.current = null;
      try {
        player?.destroy();
      } catch {
        mount.remove();
      }
    };
  }, [autoPlay, concealError, controls, focusable, loop, muted, title, track, videoId]);

  // onProgress writes the store, which hands back a new callback; keep it out of the deps or this loops.
  const markStarted = useEffectEvent(() => {
    if (track && onProgress) onProgress({ videoId, started: true });
  });

  useEffect(() => {
    if (fallback || concealed) markStarted();
  }, [concealed, fallback]);

  if (concealed) return null;

  if (fallback) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    if (autoPlay) params.set("autoplay", "1");
    if (muted) params.set("mute", "1");
    if (startRef.current > 0) params.set("start", String(startRef.current));
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
