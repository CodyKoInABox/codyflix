"use client";

import { useSearchParams } from "next/navigation";
import { useApp } from "@/components/app-state";
import { VideoGrid } from "@/components/video-grid";
import { useHydrated } from "@/components/use-media";
import { searchVideos } from "@/lib/search";

export function SearchScreen() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const { catalog } = useApp();
  const query = hydrated ? (params.get("q") ?? "") : "";
  const results = query ? searchVideos(catalog.videos, catalog.channels, query) : [];

  return (
    <div className="page">
      <h1>{query ? `Results for “${query}”` : "Search"}</h1>
      {!hydrated ? (
        <div className="catalog-grid" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : query && results.length === 0 ? (
        <div className="empty-state">
          <h2>No matches</h2>
          <p>Nothing in this catalog matches that title, channel, or description.</p>
        </div>
      ) : query ? (
        <>
          <p className="result-count" role="status">
            {results.length} {results.length === 1 ? "title" : "titles"}
          </p>
          <VideoGrid videos={results} />
        </>
      ) : (
        <div className="empty-state">
          <p>Type a title, a channel name, or a phrase from a description.</p>
        </div>
      )}
    </div>
  );
}
