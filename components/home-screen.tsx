"use client";

import { useApp } from "@/components/app-state";
import { Billboard } from "@/components/billboard";
import { VideoRow } from "@/components/video-row";
import { buildHomeRows, selectFeatured } from "@/lib/rows";

export function HomeScreen() {
  const { catalog, library } = useApp();
  const featured = selectFeatured(catalog.channels, catalog.videos);
  const rows = buildHomeRows(catalog.channels, catalog.videos, library);

  if (!featured) {
    return (
      <div className="page empty-state">
        <h1>No videos yet</h1>
        <p>Run npm run fetch-catalog once YouTube’s RSS feeds are reachable.</p>
      </div>
    );
  }

  return (
    <div className="home">
      <Billboard video={featured} />
      <div className="home-rows">
        {rows.map((row, index) => (
          <VideoRow key={row.id} row={row} defer={index > 1} />
        ))}
      </div>
    </div>
  );
}
