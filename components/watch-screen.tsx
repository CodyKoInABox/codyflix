"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useApp } from "@/components/app-state";
import { MuteIcon, PlayIcon, VolumeIcon } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { resumePoint, watchHref } from "@/components/title-actions";
import { YoutubePlayer, type PlayerSnapshot, type YoutubePlayerHandle } from "@/components/youtube-player";
import { channelForVideo } from "@/lib/catalog";
import { isFinished } from "@/lib/progress";
import { similarVideos } from "@/lib/rows";
import type { Video } from "@/lib/types";

const SEEK_STEP = 10;
const VOLUME_STEP = 10;
const IDLE_MS = 3000;
const POLL_MS = 250;

const WATCH_CSS = `
html:has(.watch-screen) { overflow: hidden; }
html:has(.watch-screen) .site-header,
html:has(.watch-screen) .site-footer { visibility: hidden; }
.watch-screen {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: #000;
  color: #fff;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
}
.watch-screen:focus { outline: none; }
.watch-screen[data-idle="true"], .watch-screen[data-idle="true"] .watch-surface { cursor: none; }
.watch-media { position: absolute; inset: 0; }
.watch-media > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0.55; }
.watch-media .player-host { opacity: 0; transition: opacity 0.5s ease; }
.watch-media .player-host.is-ready { opacity: 1; }
.watch-media .player-host iframe { pointer-events: none; }
.watch-surface { position: absolute; inset: 0; z-index: 1; cursor: pointer; }
.watch-spinner {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--red);
  animation: watch-spin 0.9s linear infinite;
  pointer-events: none;
}
@keyframes watch-spin { to { transform: rotate(360deg); } }
.watch-chrome {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
  padding-inline: clamp(1rem, 3vw, 2.6rem);
  pointer-events: none;
  transition: opacity 0.3s ease, visibility 0s linear 0s;
}
.watch-chrome > * { pointer-events: auto; }
.watch-screen[data-idle="true"] .watch-chrome:not(:has(:focus-visible)) {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.45s ease, visibility 0s linear 0.45s;
}
.watch-top {
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  padding-bottom: 3.5rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
}
.watch-top-spacer { flex: 1; pointer-events: none; }
.watch-youtube { color: #d2d2d2; font-size: 0.9rem; }
.watch-youtube:hover { color: #fff; }
.watch-bottom {
  bottom: 0;
  padding-top: 5rem;
  padding-bottom: clamp(0.6rem, 2vh, 1.4rem);
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.88), rgba(0, 0, 0, 0));
}
.watch-icon-btn {
  flex: none;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.watch-icon-btn:hover { transform: scale(1.14); }
.watch-icon-btn svg { width: 30px; height: 30px; }
.watch-screen :focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.watch-timeline { display: flex; align-items: center; gap: 1rem; }
.watch-range {
  --fill: 0%;
  --accent: var(--red);
  flex: 1;
  min-width: 0;
  height: 20px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.watch-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent) var(--fill), rgba(255, 255, 255, 0.35) var(--fill));
}
.watch-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  -webkit-appearance: none;
  appearance: none;
  transition: transform 0.15s ease;
}
.watch-range:hover::-webkit-slider-thumb { transform: scale(1.2); }
.watch-range::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.35); }
.watch-range::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--accent); }
.watch-range::-moz-range-thumb { width: 15px; height: 15px; border: 0; border-radius: 50%; background: var(--accent); }
.watch-time { min-width: 5ch; text-align: right; font-size: 0.95rem; font-variant-numeric: tabular-nums; }
.watch-bar { display: flex; align-items: center; gap: 0.3rem; margin-top: 0.35rem; }
.watch-volume { display: flex; align-items: center; }
.watch-volume .watch-range { --accent: #fff; flex: none; width: 0; opacity: 0; transition: width 0.2s ease, opacity 0.2s ease; }
.watch-volume:hover .watch-range,
.watch-volume:focus-within .watch-range { width: 96px; opacity: 1; margin-inline: 0.25rem 0.5rem; }
.watch-title {
  flex: 1;
  min-width: 0;
  margin: 0 1rem;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.05rem;
  font-weight: 700;
}
.watch-title span { margin-left: 0.6rem; color: var(--muted); font-weight: 400; }
.watch-flash {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.2rem;
  width: 112px;
  height: 112px;
  margin: -56px 0 0 -56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  font-size: 0.85rem;
  font-weight: 700;
  pointer-events: none;
  animation: watch-flash 750ms ease-out forwards;
}
.watch-flash svg { width: 40px; height: 40px; }
@keyframes watch-flash {
  0% { opacity: 0; transform: scale(0.8); }
  15% { opacity: 1; transform: scale(1); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.12); }
}
.watch-unmute {
  position: absolute;
  top: 5rem;
  right: clamp(1rem, 3vw, 2.6rem);
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.watch-unmute svg { width: 1.2rem; height: 1.2rem; }
.watch-end {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  padding: 5rem clamp(1.2rem, 5vw, 4rem) clamp(1.5rem, 8vh, 5rem);
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.7) 55%, rgba(0, 0, 0, 0.45));
  animation: watch-end-in 0.45s ease-out;
}
@keyframes watch-end-in { from { opacity: 0; } }
.watch-end-card {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  align-items: center;
  gap: 1.6rem;
  max-width: 980px;
}
.watch-end-card.is-solo { grid-template-columns: minmax(0, 1fr); }
.watch-end-thumb { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; background: #222; }
.watch-end-thumb img { width: 100%; height: 100%; display: block; object-fit: cover; }
.watch-end-kicker { margin: 0 0 0.4rem; color: var(--muted); font-size: 0.8rem; letter-spacing: 0.14em; text-transform: uppercase; }
.watch-end h2 { margin: 0 0 0.35rem; font-size: clamp(1.4rem, 3vw, 2.2rem); text-wrap: balance; }
.watch-end-channel { margin: 0; color: var(--muted); }
.watch-end-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.2rem; }
.watch-missing { position: absolute; inset: 0; display: grid; place-content: center; gap: 1rem; padding: 2rem; text-align: center; }
@media (max-width: 700px) {
  .watch-end-card { grid-template-columns: minmax(0, 1fr); }
  .watch-end-thumb { max-width: 260px; }
  .watch-title span, .watch-volume .watch-range { display: none; }
  .watch-icon-btn { width: 42px; height: 42px; }
  .watch-icon-btn svg { width: 26px; height: 26px; }
}
`;

type Flash = { key: number; label: string; text?: string; icon: ReactNode };

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function PauseIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" />
    </Glyph>
  );
}

function BackIcon() {
  return (
    <Glyph>
      <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M20 12H5M11 5l-7 7 7 7" />
    </Glyph>
  );
}

function SkipIcon({ direction }: { direction: "back" | "forward" }) {
  const flip = direction === "back" ? "matrix(-1 0 0 1 24 0)" : undefined;
  return (
    <Glyph>
      <g transform={flip}>
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
        <path fill="currentColor" d="M20 3.5v5.5h-5.5z" />
      </g>
      <text x="12" y="15.2" fill="currentColor" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="inherit">
        {SEEK_STEP}
      </text>
    </Glyph>
  );
}

function NextIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M5 5.2v13.6c0 .8.9 1.3 1.6.8L16 12.8c.6-.4.6-1.3 0-1.7L6.6 4.4C5.9 4 5 4.4 5 5.2ZM17 5h2.5v14H17z" />
    </Glyph>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <Glyph>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d={exit ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"}
      />
    </Glyph>
  );
}

function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}` : `${minutes}:${secs}`;
}

function parseStart(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function canGoBack(): boolean {
  const navigation = (window as Window & { navigation?: { canGoBack?: boolean } }).navigation;
  if (typeof navigation?.canGoBack === "boolean") return navigation.canGoBack;
  return window.history.length > 1 && document.referrer.startsWith(window.location.origin);
}

function WatchPoster({ video }: { video: Video }) {
  return (
    <section className="watch-screen" aria-label={`Loading ${video.title}`}>
      <div className="watch-media">
        <Thumb video={video} priority alt="" />
      </div>
      <div className="watch-spinner" />
    </section>
  );
}

function WatchPlayer({ video }: { video: Video }) {
  const params = useSearchParams();
  const { store } = useApp();
  if (!store.hydrated) return <WatchPoster video={video} />;
  return <Playback video={video} requestedStart={parseStart(params.get("t"))} />;
}

function Playback({ video, requestedStart }: { video: Video; requestedStart: number | null }) {
  const { catalog, library, noteProgress, setHover } = useApp();
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const idleTimer = useRef(0);
  const flashKey = useRef(0);
  const pointerType = useRef("mouse");
  const [start] = useState(() => requestedStart ?? resumePoint(library.progress[video.id])?.positionSeconds ?? 0);
  const [snap, setSnap] = useState<PlayerSnapshot | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [autoMuted, setAutoMuted] = useState(false);
  const [idle, setIdle] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const canFullscreen = document.fullscreenEnabled;
  const channel = channelForVideo(catalog, video);

  const upNext = useMemo(() => {
    const pool = similarVideos(catalog.videos, video, 24);
    return pool.find((item) => !library.progress[item.id] || !isFinished(library.progress[item.id])) ?? pool[0] ?? null;
  }, [catalog.videos, library.progress, video]);

  const state = snap?.state ?? "unstarted";
  const playing = state === "playing" || state === "buffering";
  const ended = state === "ended";
  const duration = snap?.durationSeconds ?? 0;
  const current = Math.min(scrub ?? snap?.currentSeconds ?? start, duration || Number.POSITIVE_INFINITY);
  const muted = snap?.muted ?? false;
  const volume = muted ? 0 : (snap?.volume ?? 100);
  const loading = !unavailable && (!snap || state === "buffering" || (state === "unstarted" && !autoMuted));
  const hideChrome = idle && playing && !ended;
  const seekFill = duration > 0 ? `${((current / duration) * 100).toFixed(2)}%` : "0%";

  function wake() {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }

  function show(label: string, icon: ReactNode, text?: string) {
    flashKey.current += 1;
    setFlash({ key: flashKey.current, label, icon, text });
  }

  function togglePlay() {
    const next = playerRef.current?.togglePlay();
    if (next === "playing") show("Playing", <PlayIcon />);
    else if (next === "paused") show("Paused", <PauseIcon />);
  }

  function seekBy(delta: number) {
    const target = playerRef.current?.seekBy(delta);
    if (target == null) return;
    setSnap((previous) => (previous ? { ...previous, currentSeconds: target } : previous));
    show(delta > 0 ? `Forward ${delta} seconds` : `Back ${-delta} seconds`, <SkipIcon direction={delta > 0 ? "forward" : "back"} />);
  }

  function toggleMute() {
    const nowMuted = playerRef.current?.toggleMute();
    if (nowMuted == null) return;
    setAutoMuted(false);
    setSnap((previous) => (previous ? { ...previous, muted: nowMuted } : previous));
    show(nowMuted ? "Muted" : "Sound on", nowMuted ? <MuteIcon /> : <VolumeIcon />);
  }

  function changeVolume(level: number, announce = true) {
    const next = Math.round(Math.min(100, Math.max(0, level)));
    playerRef.current?.setVolume(next);
    setAutoMuted(false);
    setSnap((previous) => (previous ? { ...previous, volume: next, muted: next === 0 } : previous));
    if (announce) show(`Volume ${next}%`, next === 0 ? <MuteIcon /> : <VolumeIcon />, `${next}%`);
  }

  async function toggleFullscreen() {
    const root = rootRef.current;
    if (!root || !document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.requestFullscreen();
    } catch {
      // The browser can refuse fullscreen without a user gesture.
    }
  }

  function leave() {
    if (canGoBack()) router.back();
    else router.push("/");
  }

  function replay() {
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest("textarea, select, [contenteditable='true'], input:not([type='range'])")) return;
    if (target?.closest(".watch-volume") && event.key.startsWith("Arrow")) return;
    wake();
    switch (event.key) {
      case " ":
      case "Spacebar":
        if (target?.matches("button:focus-visible")) return;
        event.preventDefault();
        if (!event.repeat) togglePlay();
        return;
      case "k":
      case "K":
        event.preventDefault();
        if (!event.repeat) togglePlay();
        return;
      case "f":
      case "F":
        event.preventDefault();
        if (!event.repeat) void toggleFullscreen();
        return;
      case "m":
      case "M":
        event.preventDefault();
        if (!event.repeat) toggleMute();
        return;
      case "ArrowLeft":
      case "j":
      case "J":
        event.preventDefault();
        seekBy(-SEEK_STEP);
        return;
      case "ArrowRight":
      case "l":
      case "L":
        event.preventDefault();
        seekBy(SEEK_STEP);
        return;
      case "ArrowUp":
        event.preventDefault();
        changeVolume(volume + VOLUME_STEP);
        return;
      case "ArrowDown":
        event.preventDefault();
        changeVolume(volume - VOLUME_STEP);
        return;
      case "Escape":
        event.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
        else leave();
        return;
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setSnap(playerRef.current?.snapshot() ?? null), POLL_MS);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(idleTimer.current);
    };
  }, []);

  useEffect(() => {
    setHover(null);
    rootRef.current?.focus({ preventScroll: true });
  }, [setHover]);

  useEffect(() => {
    if (requestedStart == null) return;
    window.history.replaceState(null, "", watchHref(video.id));
  }, [requestedStart, video.id]);

  useEffect(() => {
    const root = rootRef.current;
    const sync = () => setFullscreen(Boolean(root) && document.fullscreenElement === root);
    document.addEventListener("fullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      if (root && document.fullscreenElement === root) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (ended) endRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
  }, [ended]);

  return (
    <section
      ref={rootRef}
      className="watch-screen"
      tabIndex={-1}
      aria-label={`Video player: ${video.title}`}
      data-idle={hideChrome ? "true" : undefined}
      onPointerMove={wake}
      onPointerLeave={() => {
        if (playing) setIdle(true);
      }}
    >
      <div className="watch-media">
        <Thumb video={video} priority alt="" />
        <YoutubePlayer
          ref={playerRef}
          videoId={video.id}
          title={video.title}
          autoPlay
          controls={false}
          track
          focusable={false}
          startSeconds={start}
          onProgress={noteProgress}
          onUnavailable={() => setUnavailable(true)}
          onAutoplayMuted={() => setAutoMuted(true)}
        />
      </div>

      {unavailable ? null : (
        <div
          className="watch-surface"
          aria-hidden="true"
          onPointerDown={(event) => {
            pointerType.current = event.pointerType;
          }}
          onClick={() => {
            const revealOnly = pointerType.current === "touch" && hideChrome;
            wake();
            if (!revealOnly) togglePlay();
          }}
          onDoubleClick={() => void toggleFullscreen()}
        />
      )}

      {loading ? <div className="watch-spinner" /> : null}

      {flash ? (
        <div key={flash.key} className="watch-flash" aria-hidden="true">
          {flash.icon}
          {flash.text ? <span>{flash.text}</span> : null}
        </div>
      ) : null}
      <p className="visually-hidden" role="status">
        {flash?.label ?? ""}
      </p>

      <div className="watch-chrome watch-top">
        <button type="button" className="watch-icon-btn" aria-label="Back" onClick={leave}>
          <BackIcon />
        </button>
        <span className="watch-top-spacer" />
        <a className="watch-youtube" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener">
          Watch on YouTube
        </a>
      </div>

      {autoMuted && muted && !ended ? (
        <button type="button" className="watch-unmute" onClick={toggleMute}>
          <MuteIcon /> Unmute
        </button>
      ) : null}

      {unavailable || ended ? null : (
        <div className="watch-chrome watch-bottom">
          <div className="watch-timeline">
            <input
              type="range"
              className="watch-range"
              aria-label="Seek"
              aria-valuetext={`${clock(current)} of ${clock(duration)}`}
              min={0}
              max={Math.max(1, Math.floor(duration))}
              step={1}
              value={Math.floor(current)}
              style={{ "--fill": seekFill } as CSSProperties}
              onChange={(event) => {
                const seconds = Number(event.currentTarget.value);
                setScrub(seconds);
                playerRef.current?.seekTo(seconds);
              }}
              onPointerUp={() => setScrub(null)}
              onKeyUp={() => setScrub(null)}
              onBlur={() => setScrub(null)}
            />
            <span className="watch-time" aria-label={`${clock(duration - current)} remaining`}>
              {clock(duration - current)}
            </span>
          </div>
          <div className="watch-bar">
            <button type="button" className="watch-icon-btn" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button type="button" className="watch-icon-btn" aria-label={`Back ${SEEK_STEP} seconds`} onClick={() => seekBy(-SEEK_STEP)}>
              <SkipIcon direction="back" />
            </button>
            <button type="button" className="watch-icon-btn" aria-label={`Forward ${SEEK_STEP} seconds`} onClick={() => seekBy(SEEK_STEP)}>
              <SkipIcon direction="forward" />
            </button>
            <div className="watch-volume">
              <button type="button" className="watch-icon-btn" aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} onClick={toggleMute}>
                {muted ? <MuteIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                className="watch-range"
                aria-label="Volume"
                min={0}
                max={100}
                step={5}
                value={volume}
                style={{ "--fill": `${volume}%` } as CSSProperties}
                onChange={(event) => changeVolume(Number(event.currentTarget.value), false)}
              />
            </div>
            <p className="watch-title">
              {video.title}
              {channel ? <span>{channel.name}</span> : null}
            </p>
            {upNext ? (
              <Link className="watch-icon-btn" href={watchHref(upNext.id)} aria-label={`Next title: ${upNext.title}`}>
                <NextIcon />
              </Link>
            ) : null}
            {canFullscreen ? (
              <button
                type="button"
                className="watch-icon-btn"
                aria-label={fullscreen ? "Exit full screen" : "Full screen"}
                onClick={() => void toggleFullscreen()}
              >
                <FullscreenIcon exit={fullscreen} />
              </button>
            ) : null}
          </div>
        </div>
      )}

      {ended ? (
        <div className="watch-end" ref={endRef}>
          <section className={upNext ? "watch-end-card" : "watch-end-card is-solo"} aria-labelledby="watch-end-heading">
            {upNext ? (
              <Link className="watch-end-thumb" href={watchHref(upNext.id)} tabIndex={-1} aria-hidden="true">
                <Thumb video={upNext} alt="" />
              </Link>
            ) : null}
            <div>
              <p className="watch-end-kicker">{upNext ? "Up next" : "You finished"}</p>
              <h2 id="watch-end-heading">{upNext ? upNext.title : video.title}</h2>
              {upNext ? <p className="watch-end-channel">{channelForVideo(catalog, upNext)?.name ?? "YouTube"}</p> : null}
              <div className="watch-end-actions">
                {upNext ? (
                  <Link className="btn" href={watchHref(upNext.id)}>
                    <PlayIcon /> Play next
                  </Link>
                ) : null}
                <button type="button" className="btn btn-muted" onClick={replay}>
                  Watch again
                </button>
                <Link className="btn btn-muted" href="/">
                  Back to Home
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export function WatchScreen({ videoId }: { videoId: string }) {
  const { catalog } = useApp();
  const video = catalog.videos.find((item) => item.id === videoId);
  return (
    <>
      <style href="codyflix-watch" precedence="default">
        {WATCH_CSS}
      </style>
      {video ? (
        <Suspense fallback={<WatchPoster video={video} />}>
          <WatchPlayer video={video} />
        </Suspense>
      ) : (
        <section className="watch-screen">
          <div className="watch-missing">
            <h1>That title is not in the catalog</h1>
            <p>
              <Link className="btn" href="/">
                Back to Home
              </Link>
            </p>
          </div>
        </section>
      )}
    </>
  );
}
