"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons";
import { VideoCard } from "@/components/video-card";
import type { HomeRow } from "@/lib/types";
import type { Video } from "@/lib/types";

export function VideoRow({
  row,
  videos,
  title,
  note,
  variant = "rail",
  channelSlug,
  defer = false,
  hoverCards = true,
}: {
  row?: HomeRow;
  videos?: Video[];
  title?: string;
  note?: string;
  variant?: HomeRow["variant"];
  channelSlug?: string;
  defer?: boolean;
  hoverCards?: boolean;
}) {
  const items = row?.videos ?? videos ?? [];
  const heading = row?.title ?? title ?? "Titles";
  const detail = row?.note ?? note;
  const kind = row?.variant ?? variant;
  const slug = row?.channelSlug ?? channelSlug;
  const headingId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      setAtStart(track.scrollLeft <= 2);
      setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2);
    };
    const frame = window.requestAnimationFrame(measure);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) measure();
    });
    observer.observe(track);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [items.length, kind]);

  if (items.length === 0) return null;

  function sync() {
    const track = trackRef.current;
    if (!track) return;
    const nextStart = track.scrollLeft <= 2;
    const nextEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    setAtStart(nextStart);
    setAtEnd(nextEnd);
    if (nextStart && document.activeElement === prevRef.current) nextRef.current?.focus();
    if (nextEnd && document.activeElement === nextRef.current) prevRef.current?.focus();
  }

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.86, 220),
      behavior: reduce ? "auto" : "smooth",
    });
    setStatus(`${heading}, scrolled ${direction > 0 ? "forward" : "back"}`);
  }

  return (
    <section
      className={defer ? "video-row is-deferred" : "video-row"}
      id={row?.id === "latest" ? "latest" : undefined}
      aria-roledescription="carousel"
      aria-labelledby={headingId}
    >
      <div className="video-row-head">
        <h2 id={headingId}>{heading}</h2>
        <div className="video-row-tools">
          {detail ? <p className="video-row-note">{detail}</p> : null}
          {slug ? (
            <Link className="row-explore" href={`/channel/${slug}/`}>
              Explore
            </Link>
          ) : null}
        </div>
      </div>
      <div className={`video-row-scroller ${atStart ? "" : "has-left"} ${atEnd ? "" : "has-right"}`}>
        <button
          ref={prevRef}
          type="button"
          className="row-nav prev"
          aria-label={`Previous titles in ${heading}`}
          disabled={atStart}
          onClick={() => scroll(-1)}
        >
          <ChevronIcon direction="left" />
        </button>
        <div
          ref={trackRef}
          className={kind === "top10" ? "video-row-track is-top10" : "video-row-track"}
          role="group"
          aria-label={`${heading} titles`}
          onScroll={sync}
        >
          {items.map((video, index) =>
            kind === "top10" ? (
              <div className="top10-item" key={video.id}>
                <span className="rank-num" aria-hidden="true">
                  {index + 1}
                </span>
                <VideoCard video={video} hoverCards={hoverCards} />
              </div>
            ) : (
              <VideoCard key={video.id} video={video} hoverCards={hoverCards} />
            ),
          )}
        </div>
        <button
          ref={nextRef}
          type="button"
          className="row-nav next"
          aria-label={`Next titles in ${heading}`}
          disabled={atEnd}
          onClick={() => scroll(1)}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </section>
  );
}
