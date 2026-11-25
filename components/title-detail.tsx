"use client";

import Link from "next/link";
import { useApp } from "@/components/app-state";
import { Linkified } from "@/components/linkified";
import { Thumb } from "@/components/thumb";
import { TitleActions } from "@/components/title-actions";
import { VideoRow } from "@/components/video-row";
import { YoutubePlayer } from "@/components/youtube-player";
import { channelForVideo } from "@/lib/catalog";
import { similarVideos } from "@/lib/rows";
import { formatPublished } from "@/lib/text";
import type { Video } from "@/lib/types";

export function TitleDetail({ video, mode }: { video: Video; mode: "modal" | "page" }) {
  const { catalog, library, store, noteProgress } = useApp();
  const channel = channelForVideo(catalog, video);
  const similar = similarVideos(catalog.videos, video);
  const resume = library.progress[video.id]?.positionSeconds ?? 0;

  return (
    <article className={mode === "page" ? "watch-layout" : "modal-layout"}>
      <div className={mode === "page" ? "watch-stage" : "title-dialog-player"}>
        <Thumb video={video} priority={mode === "page"} alt="" />
        {store.hydrated ? (
          <YoutubePlayer
            key={`${mode}-${video.id}`}
            videoId={video.id}
            title={video.title}
            autoPlay={false}
            muted={false}
            track
            resumeSeconds={resume}
            onProgress={noteProgress}
          />
        ) : (
          <div className="player-skeleton" />
        )}
      </div>
      <div className={mode === "page" ? "watch-body" : "title-dialog-body"}>
        <p className="meta-line">
          {channel ? <Link href={`/channel/${channel.slug}/`}>{channel.name}</Link> : <span>YouTube</span>}
          {formatPublished(video.publishedAt) ? <span>{formatPublished(video.publishedAt)}</span> : null}
          <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener">
            YouTube
          </a>
        </p>
        <h1 id={mode === "modal" ? "title-dialog-heading" : undefined}>{video.title}</h1>
        <TitleActions video={video} layout="labeled" />
        <Linkified text={video.description} />
        <VideoRow title="More like this" videos={similar} hoverCards={mode === "page"} />
      </div>
    </article>
  );
}
