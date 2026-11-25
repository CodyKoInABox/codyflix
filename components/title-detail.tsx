"use client";

import Link from "next/link";
import { useApp } from "@/components/app-state";
import { Linkified } from "@/components/linkified";
import { Thumb } from "@/components/thumb";
import { TitleActions } from "@/components/title-actions";
import { useMediaQuery, useSaveData } from "@/components/use-media";
import { VideoRow } from "@/components/video-row";
import { YoutubePlayer } from "@/components/youtube-player";
import { channelForVideo } from "@/lib/catalog";
import { similarVideos } from "@/lib/rows";
import { formatPublished } from "@/lib/text";
import type { Video } from "@/lib/types";

const TITLE_DETAIL_CSS = `
.title-dialog-player .player-host { opacity: 0; transition: opacity 0.4s ease; pointer-events: none; }
.title-dialog-player .player-host.is-ready { opacity: 1; }
.title-dialog-player::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 32%;
  background: linear-gradient(180deg, rgba(24, 24, 24, 0), #181818);
  pointer-events: none;
}
.title-dialog-heading:focus { outline: none; }
`;

export function TitleDetail({ video }: { video: Video }) {
  const { catalog, store } = useApp();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const saveData = useSaveData();
  const channel = channelForVideo(catalog, video);
  const similar = similarVideos(catalog.videos, video);
  const published = formatPublished(video.publishedAt);

  return (
    <article className="modal-layout">
      <style href="codyflix-title-detail" precedence="default">
        {TITLE_DETAIL_CSS}
      </style>
      <div className="title-dialog-player">
        <Thumb video={video} alt="" />
        {store.hydrated && !reduceMotion && !saveData ? (
          <YoutubePlayer
            key={video.id}
            videoId={video.id}
            title={`Muted preview of ${video.title}`}
            autoPlay
            muted
            controls={false}
            loop
            focusable={false}
            concealError
          />
        ) : null}
      </div>
      <div className="title-dialog-body">
        <p className="meta-line">
          {channel ? <Link href={`/channel/${channel.slug}/`}>{channel.name}</Link> : <span>YouTube</span>}
          {published ? <span>{published}</span> : null}
          <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener">
            YouTube
          </a>
        </p>
        <h1 id="title-dialog-heading" className="title-dialog-heading" tabIndex={-1}>
          {video.title}
        </h1>
        <TitleActions video={video} layout="labeled" />
        <Linkified text={video.description} />
        <VideoRow title="More like this" videos={similar} hoverCards={false} />
      </div>
    </article>
  );
}
