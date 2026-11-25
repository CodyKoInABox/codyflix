"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/app-state";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { VideoGrid } from "@/components/video-grid";
import { useHydrated } from "@/components/use-media";
import { byDateDesc } from "@/lib/rows";
import { channelsInResults, searchHref, searchReturnPath, searchVideos } from "@/lib/search";
import type { Channel } from "@/lib/types";
import styles from "./search-screen.module.css";

const RETURN_KEY = "codyflix.searchReturn";

// Must render outside the Suspense boundary around SearchScreen. Next writes the
// new URL to history when this render commits, so on a client navigation
// window.location is still the page search was opened from.
export function RememberSearchOrigin() {
  const [openedFrom] = useState(() =>
    typeof window === "undefined" ? null : searchReturnPath(window.location.href, window.location.origin),
  );

  useEffect(() => {
    if (!openedFrom) return;
    try {
      sessionStorage.setItem(RETURN_KEY, openedFrom);
    } catch {}
  }, [openedFrom]);

  return null;
}

export function SearchScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const { catalog } = useApp();
  const urlQuery = hydrated ? (params.get("q") ?? "") : "";
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  const [value, setValue] = useState(urlQuery);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef(0);

  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery);
    if (!focused) setValue(urlQuery);
  }

  const query = useDeferredValue(value).trim();
  const results = useMemo(
    () => (query ? searchVideos(catalog.videos, catalog.channels, query) : []),
    [catalog, query],
  );
  const related = useMemo(() => channelsInResults(results, catalog.channels), [results, catalog.channels]);
  const latest = useMemo(() => [...catalog.videos].sort(byDateDesc).slice(0, 12), [catalog.videos]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!hydrated) return;
    const active = document.activeElement;
    if (!active || active === document.body) inputRef.current?.focus();
  }, [hydrated]);

  const leave = useCallback(() => {
    window.clearTimeout(timer.current);
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(RETURN_KEY);
      sessionStorage.removeItem(RETURN_KEY);
    } catch {}
    router.replace(target ?? "/", { scroll: false });
  }, [router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "search") return;
      event.preventDefault();
      event.stopPropagation();
      target.blur();
      leave();
    };
    // Capture phase so this runs before the header search box's own Escape handler.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [leave]);

  function writeUrl(next: string) {
    const href = searchHref(next);
    if (`${window.location.pathname}${window.location.search}` !== href) window.history.replaceState(null, "", href);
  }

  function update(next: string) {
    setValue(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => writeUrl(next), 150);
  }

  function clear() {
    window.clearTimeout(timer.current);
    setValue("");
    writeUrl("");
    inputRef.current?.focus();
  }

  return (
    <div className="page">
      <h1 className="visually-hidden">Search</h1>
      <div className={styles.top}>
        <form
          role="search"
          className={styles.bar}
          onSubmit={(event) => {
            event.preventDefault();
            window.clearTimeout(timer.current);
            writeUrl(value);
          }}
        >
          <SearchIcon />
          <label className="visually-hidden" htmlFor="search-page-input">
            Search titles, channels, and descriptions
          </label>
          <input
            id="search-page-input"
            ref={inputRef}
            className={styles.input}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Titles, channels, descriptions"
            value={value}
            onChange={(event) => update(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {value ? (
            <button type="button" className={styles.clear} onClick={clear}>
              <CloseIcon />
              <span className="visually-hidden">Clear search</span>
            </button>
          ) : null}
        </form>
        <button type="button" className={styles.close} onClick={leave}>
          Close
        </button>
      </div>

      {!hydrated ? (
        <div className="catalog-grid" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : !query ? (
        <>
          <ChannelChips channels={catalog.channels} title="Explore by channel" />
          <section className={styles.block} aria-labelledby="search-latest">
            <h2 id="search-latest" className={styles.blockTitle}>
              Latest on Codyflix
            </h2>
            <VideoGrid videos={latest} />
          </section>
        </>
      ) : results.length === 0 ? (
        <>
          <div className={styles.miss}>
            <p className={styles.missLead} role="status">
              Your search for “{query}” did not have any matches.
            </p>
            <p className={styles.missLabel}>Suggestions:</p>
            <ul className={styles.tips}>
              <li>Try different keywords</li>
              <li>{channelTip(catalog.channels)}</li>
              <li>Try a word from a video title or description</li>
            </ul>
            <button type="button" className="btn btn-muted" onClick={clear}>
              Clear search
            </button>
          </div>
          <ChannelChips channels={catalog.channels} title="Browse a channel instead" />
          <section className={styles.block} aria-labelledby="search-miss-latest">
            <h2 id="search-miss-latest" className={styles.blockTitle}>
              Latest on Codyflix
            </h2>
            <VideoGrid videos={latest} />
          </section>
        </>
      ) : (
        <section aria-label={`Results for ${query}`}>
          <p className={styles.status} role="status">
            {results.length} {results.length === 1 ? "title" : "titles"} for “{query}”
          </p>
          {related.length > 0 ? (
            <nav className={styles.related} aria-label="Channels in these results">
              <span>Explore titles from:</span>
              <ul>
                {related.map((channel) => (
                  <li key={channel.id}>
                    <Link href={`/channel/${channel.slug}/`}>{channel.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <VideoGrid videos={results} />
        </section>
      )}
    </div>
  );
}

function ChannelChips({ channels, title }: { channels: Channel[]; title: string }) {
  return (
    <nav className={styles.block} aria-label={title}>
      <h2 className={styles.blockTitle}>{title}</h2>
      <ul className={styles.chips}>
        {channels.map((channel) => (
          <li key={channel.id}>
            <Link className={styles.chip} href={`/channel/${channel.slug}/`}>
              {channel.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function channelTip(channels: Channel[]): string {
  const main = channels.find((channel) => channel.role === "main");
  const other = channels.find((channel) => channel.role !== "main" && channel.role !== "second");
  const names = [main, other].filter((channel): channel is Channel => Boolean(channel)).map((channel) => channel.name);
  if (names.length === 0) return "Search for a channel name";
  return `Search for a channel, like ${names.join(" or ")}`;
}
