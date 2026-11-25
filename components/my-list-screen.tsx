"use client";

import Link from "next/link";
import { useApp } from "@/components/app-state";
import { VideoGrid } from "@/components/video-grid";
import { resolveMyList } from "@/lib/mylist";

export function MyListScreen() {
  const { catalog, library, store, profile } = useApp();
  const videos = store.hydrated ? resolveMyList(library.list, catalog.videos) : [];

  return (
    <div className="page">
      <h1>My List{profile ? ` · ${profile.name}` : ""}</h1>
      {!store.hydrated ? (
        <div className="catalog-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <h2>Your list is empty</h2>
          <p>Add titles from a row, a preview, or a title page. The list stays on this device.</p>
          <Link className="btn" href="/">
            Browse
          </Link>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
}
