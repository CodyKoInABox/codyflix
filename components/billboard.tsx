"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useApp } from "@/components/app-state";
import { MuteIcon, VolumeIcon } from "@/components/icons";
import { Thumb } from "@/components/thumb";
import { TitleActions } from "@/components/title-actions";
import { YoutubePlayer, type YoutubePlayerHandle } from "@/components/youtube-player";
import { useAmbientPreview } from "@/components/use-media";
import { channelForVideo } from "@/lib/catalog";
import { synopsis, yearOf } from "@/lib/text";
import type { Video } from "@/lib/types";

export function Billboard({ video }: { video: Video }) {
  const { catalog, modalId, hover } = useApp();
  const ambient = useAmbientPreview();
  const channel = channelForVideo(catalog, video);
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const [muted, setMuted] = useState(true);
  const [previewFailed, setPreviewFailed] = useState(false);
  const showPreview = ambient && !modalId && !hover && !previewFailed;
  const year = yearOf(video.publishedAt);

  return (
    <section className="billboard" aria-label="Featured">
      <div className="billboard-media">
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
            loop
            concealError
            onUnavailable={() => setPreviewFailed(true)}
            className="billboard-frame"
          />
        ) : null}
      </div>
      <div className="billboard-scrim" />
      <div className="billboard-copy">
        <p className="billboard-kicker">
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
        <button
          type="button"
          className="mute-toggle"
          aria-pressed={!muted}
          aria-label={muted ? "Unmute preview" : "Mute preview"}
          onClick={() => {
            const next = playerRef.current?.toggleMute();
            if (typeof next === "boolean") setMuted(next);
          }}
        >
          {muted ? <MuteIcon /> : <VolumeIcon />}
        </button>
      ) : null}
    </section>
  );
}
