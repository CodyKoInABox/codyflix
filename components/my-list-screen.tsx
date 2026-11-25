"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-state";
import { Avatar } from "@/components/avatar";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { VideoCard } from "@/components/video-card";
import { resolveMyList, suggestForMyList } from "@/lib/mylist";
import type { Video } from "@/lib/types";
import styles from "./my-list-screen.module.css";

interface Removal {
  video: Video;
  profileId: string;
}

export function MyListScreen() {
  const { catalog, library, store, profile, toggleList } = useApp();
  const videos = store.hydrated ? resolveMyList(library.list, catalog.videos) : [];
  const suggestions = store.hydrated && videos.length === 0 ? suggestForMyList(library.list, catalog.videos, 12) : [];
  const [removal, setRemoval] = useState<Removal | null>(null);
  const recent = removal && profile && removal.profileId === profile.id ? removal : null;

  useEffect(() => {
    if (!removal) return;
    const timer = window.setTimeout(() => setRemoval(null), 6000);
    return () => window.clearTimeout(timer);
  }, [removal]);

  function remove(video: Video) {
    if (!profile) return;
    toggleList(video.id);
    setRemoval({ video, profileId: profile.id });
  }

  function undo() {
    if (!recent) return;
    if (!library.list.includes(recent.video.id)) toggleList(recent.video.id);
    setRemoval(null);
  }

  return (
    <div className="page">
      <div className={styles.head}>
        <h1 className={styles.title}>My List</h1>
        {profile ? (
          <p className={styles.owner}>
            <Avatar name={profile.name} avatar={profile.avatar} className={styles.avatar} />
            <span>
              {profile.name}
              {videos.length > 0 ? ` · ${videos.length} ${videos.length === 1 ? "title" : "titles"}` : ""}
            </span>
          </p>
        ) : null}
      </div>

      {!store.hydrated ? (
        <div className="catalog-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <>
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <PlusIcon />
            </span>
            <h2>You haven’t added any titles to your list yet.</h2>
            <p>
              Select <strong>+</strong> on any title to save it here. Each profile keeps its own list on this device.
            </p>
            <Link className="btn" href="/">
              Browse Codyflix
            </Link>
          </div>
          {suggestions.length > 0 ? (
            <section className={styles.block} aria-labelledby="my-list-suggestions">
              <h2 id="my-list-suggestions" className={styles.blockTitle}>
                Start with something new
              </h2>
              <ListGrid videos={suggestions} listed={false} onToggle={(video) => toggleList(video.id)} />
            </section>
          ) : null}
        </>
      ) : (
        <ListGrid videos={videos} listed onToggle={remove} />
      )}

      <div className={styles.toastSlot} role="status">
        {recent ? (
          <div className={styles.toast}>
            <span>
              Removed <strong>{recent.video.title}</strong> from My List.
            </span>
            <button type="button" className={styles.undo} onClick={undo}>
              Undo
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ListGrid({ videos, listed, onToggle }: { videos: Video[]; listed: boolean; onToggle: (video: Video) => void }) {
  return (
    <ul className="catalog-grid">
      {videos.map((video) => (
        <li key={video.id} className={styles.item}>
          <VideoCard video={video} />
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={listed}
            aria-label={listed ? `Remove ${video.title} from My List` : `Add ${video.title} to My List`}
            onClick={() => onToggle(video)}
          >
            {listed ? <CheckIcon /> : <PlusIcon />}
          </button>
        </li>
      ))}
    </ul>
  );
}
