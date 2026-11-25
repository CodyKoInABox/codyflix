"use client";

import Link from "next/link";
import { useApp } from "@/components/app-state";
import { Thumb } from "@/components/thumb";
import { VideoGrid } from "@/components/video-grid";
import { byDateDesc } from "@/lib/rows";
import { ROLE_LABEL } from "@/lib/text";
import type { Channel } from "@/lib/types";

export function LatestScreen() {
  const { catalog } = useApp();
  const videos = [...catalog.videos].sort(byDateDesc);
  return (
    <div className="page">
      <p className="kicker">Publish date</p>
      <h1>Latest on Codyflix</h1>
      <p className="lede">Newest uploads across these channels. This is not a view ranking.</p>
      <VideoGrid videos={videos} />
    </div>
  );
}

export function ChannelScreen({ channel }: { channel: Channel }) {
  const { catalog } = useApp();
  const videos = catalog.videos.filter((video) => video.channelId === channel.id).sort(byDateDesc);
  const art = videos[0];
  return (
    <div className="channel-page">
      <header className="channel-hero">
        {art ? <Thumb video={art} priority alt="" /> : null}
        <div className="channel-hero-copy">
          <p className="kicker">{ROLE_LABEL[channel.role] ?? channel.role}</p>
          <h1>{channel.name}</h1>
          <p>{channel.blurb}</p>
          <p className="lede">
            {videos.length} recent {videos.length === 1 ? "upload" : "uploads"} from the public channel feed.
          </p>
          <a className="btn" href={channel.url} target="_blank" rel="noreferrer noopener">
            {channel.handle} on YouTube
          </a>
        </div>
      </header>
      <div className="page">
        {videos.length === 0 ? (
          <div className="empty-state">
            <h2>No uploads in the feed</h2>
            <p>Refresh the catalog when the channel publishes again.</p>
            <Link className="btn" href="/">
              Home
            </Link>
          </div>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </div>
    </div>
  );
}
