"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/app-state";
import { CheckIcon, DislikeIcon, InfoIcon, LikeIcon, PlayIcon, PlusIcon, ShareIcon } from "@/components/icons";
import { isFinished } from "@/lib/progress";
import type { ProgressEntry, Video } from "@/lib/types";

const MIN_RESUME_SECONDS = 10;
const MIN_REMAINING_SECONDS = 20;

export interface ResumePoint {
  positionSeconds: number;
  durationSeconds: number;
  ratio: number;
  remainingSeconds: number;
}

export function resumePoint(entry: ProgressEntry | undefined): ResumePoint | null {
  const duration = entry?.durationSeconds;
  if (!entry || !duration || duration <= 0 || isFinished(entry)) return null;
  const positionSeconds = Math.min(entry.positionSeconds, duration);
  const remainingSeconds = duration - positionSeconds;
  if (positionSeconds < MIN_RESUME_SECONDS || remainingSeconds < MIN_REMAINING_SECONDS) return null;
  return { positionSeconds, durationSeconds: duration, ratio: positionSeconds / duration, remainingSeconds };
}

export function formatTimeLeft(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
  if (minutes > 0) return `${minutes}m left`;
  return `${total}s left`;
}

export function watchHref(videoId: string, fromStart = false): string {
  return fromStart ? `/watch/${videoId}/?t=0` : `/watch/${videoId}/`;
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path fill="currentColor" d="M4 3.5v5.5h5.5z" />
    </svg>
  );
}

const TITLE_ACTIONS_CSS = `
.resume-meter { display: flex; align-items: center; gap: 0.75rem; max-width: 26rem; margin: 0 0 0.85rem; color: var(--muted); font-size: 0.88rem; }
.resume-meter-track { position: relative; flex: 1; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.28); overflow: hidden; }
.resume-meter-track > span { position: absolute; inset: 0 auto 0 0; background: var(--red); }
.resume-meter-left { white-space: nowrap; }
`;

export function TitleActions({
  video,
  layout,
  onMoreInfo,
}: {
  video: Video;
  layout: "billboard" | "labeled" | "icons";
  onMoreInfo?: () => void;
}) {
  const { library, toggleList, setReaction, openTitle } = useApp();
  const listed = library.list.includes(video.id);
  const reaction = library.likes[video.id];
  const point = resumePoint(library.progress[video.id]);
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const playLabel = `${point ? "Resume" : "Play"} ${video.title}`;

  async function share() {
    const url = `${window.location.origin}/watch/${video.id}/`;
    try {
      await navigator.clipboard.writeText(url);
      setManualLink("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setManualLink(url);
    }
  }

  if (layout === "icons") {
    return (
      <div className="icon-actions">
        <Link className="icon-btn icon-btn-light" href={watchHref(video.id)} aria-label={playLabel}>
          <PlayIcon />
        </Link>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={listed}
          aria-label={listed ? `Remove ${video.title} from My List` : `Add ${video.title} to My List`}
          onClick={() => toggleList(video.id)}
        >
          {listed ? <CheckIcon /> : <PlusIcon />}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={reaction === "like"}
          aria-label={`Like ${video.title}`}
          onClick={() => setReaction(video.id, reaction === "like" ? null : "like")}
        >
          <LikeIcon />
        </button>
        <button type="button" className="icon-btn" aria-label={`More info about ${video.title}`} onClick={() => (onMoreInfo ?? openTitle)(video.id)}>
          <InfoIcon />
        </button>
      </div>
    );
  }

  const actions = (
    <div className={`actions ${layout === "billboard" ? "actions-billboard" : "actions-labeled"}`}>
      <Link className="btn" href={watchHref(video.id)} aria-label={playLabel}>
        <PlayIcon /> {point ? "Resume" : "Play"}
      </Link>
      {layout === "labeled" && point ? (
        <Link className="btn btn-muted" href={watchHref(video.id, true)} aria-label={`Restart ${video.title} from the beginning`}>
          <RestartIcon /> Restart
        </Link>
      ) : null}
      {layout === "billboard" ? (
        <button type="button" className="btn btn-muted" onClick={() => openTitle(video.id)}>
          <InfoIcon /> More Info
        </button>
      ) : null}
      <button
        type="button"
        className="icon-btn"
        aria-pressed={listed}
        aria-label={listed ? `Remove ${video.title} from My List` : `Add ${video.title} to My List`}
        onClick={() => toggleList(video.id)}
      >
        {listed ? <CheckIcon /> : <PlusIcon />}
      </button>
      {layout === "labeled" ? (
        <>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={reaction === "like"}
            aria-label={`Like ${video.title}`}
            onClick={() => setReaction(video.id, reaction === "like" ? null : "like")}
          >
            <LikeIcon />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={reaction === "dislike"}
            aria-label={`Dislike ${video.title}`}
            onClick={() => setReaction(video.id, reaction === "dislike" ? null : "dislike")}
          >
            <DislikeIcon />
          </button>
          <button type="button" className="icon-btn" aria-label={`Copy link to ${video.title}`} onClick={() => void share()}>
            <ShareIcon />
          </button>
          <span className="copy-status" role="status">
            {copied ? "Link copied" : ""}
          </span>
          {manualLink ? (
            <input className="share-fallback" readOnly value={manualLink} aria-label="Shareable link" onFocus={(event) => event.currentTarget.select()} />
          ) : null}
        </>
      ) : null}
    </div>
  );

  if (layout !== "labeled") return actions;

  return (
    <>
      <style href="codyflix-title-actions" precedence="default">
        {TITLE_ACTIONS_CSS}
      </style>
      {point ? (
        <div className="resume-meter">
          <span
            className="resume-meter-track"
            role="progressbar"
            aria-label={`Watched ${Math.round(point.ratio * 100)}% of ${video.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(point.ratio * 100)}
          >
            <span style={{ width: `${(point.ratio * 100).toFixed(1)}%` }} />
          </span>
          <span className="resume-meter-left">{formatTimeLeft(point.remainingSeconds)}</span>
        </div>
      ) : null}
      {actions}
    </>
  );
}
