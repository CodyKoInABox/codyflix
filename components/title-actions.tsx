"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/app-state";
import { CheckIcon, DislikeIcon, InfoIcon, LikeIcon, PlayIcon, PlusIcon, ShareIcon } from "@/components/icons";
import type { Video } from "@/lib/types";

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
  const progress = library.progress[video.id];
  const resume = (progress?.positionSeconds ?? 0) > 1;
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const playLabel = `${resume ? "Resume" : "Play"} ${video.title}`;

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
        <Link className="icon-btn icon-btn-light" href={`/watch/${video.id}/`} aria-label={playLabel}>
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

  return (
    <div className={`actions ${layout === "billboard" ? "actions-billboard" : "actions-labeled"}`}>
      <Link className="btn" href={`/watch/${video.id}/`}>
        <PlayIcon /> {resume ? "Resume" : "Play"}
      </Link>
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
}
