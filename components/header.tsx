"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/components/app-state";
import { Avatar } from "@/components/avatar";
import { SearchIcon } from "@/components/icons";
import { useHydrated } from "@/components/use-media";
import { searchHref } from "@/lib/search";

export function Header() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const { catalog, store, profile, signOut, requestManage, selectProfile } = useApp();
  const home = pathname === "/";
  const onSearch = pathname.startsWith("/search");
  const urlQuery = hydrated && onSearch ? (params.get("q") ?? "") : "";
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  const [value, setValue] = useState(urlQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const timer = useRef(0);
  const latestValue = useRef(value);
  const enteringSearch = useRef(false);
  const pendingProfile = useRef<string | null>(null);
  const otherProfiles = store.hydrated ? store.profiles.filter((item) => item.id !== profile?.id) : [];

  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery);
    if (!focused) {
      setValue(urlQuery);
      setSearchOpen(Boolean(urlQuery));
    }
  }

  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      root.dataset.scrolled = window.scrollY > 16 ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = pendingProfile.current;
    if (!id || pathname !== "/") return;
    pendingProfile.current = null;
    selectProfile(id);
  }, [pathname, selectProfile]);

  // Same rule as the gate: a watch page must be gone before another profile becomes active.
  function switchProfile(id: string) {
    if (pathname === "/") {
      selectProfile(id);
      return;
    }
    pendingProfile.current = id;
    router.push("/");
  }

  useEffect(() => {
    if (!onSearch || !enteringSearch.current) return;
    enteringSearch.current = false;
    const href = searchHref(latestValue.current);
    if (`${window.location.pathname}${window.location.search}` !== href) router.replace(href, { scroll: false });
  }, [onSearch, router]);

  // A replace issued while the push into /search/ is still pending would overwrite
  // the page search was opened from, so typing waits for that route to commit.
  function commit(next: string) {
    const href = searchHref(next);
    const current = `${window.location.pathname}${window.location.search}`;
    if (window.location.pathname.startsWith("/search")) {
      if (current !== href) router.replace(href, { scroll: false });
      return;
    }
    if (!next.trim() || enteringSearch.current) return;
    enteringSearch.current = true;
    router.push(href, { scroll: false });
  }

  function updateSearch(next: string) {
    latestValue.current = next;
    setValue(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(next), 160);
  }

  function collapseSearch() {
    window.clearTimeout(timer.current);
    latestValue.current = "";
    setSearchOpen(false);
    setValue("");
  }

  return (
    <header className={`site-header ${home ? "is-home" : "is-inner"}`}>
      <div className="header-inner">
        <Link className="wordmark" href="/">
          CODYFLIX
        </Link>
        <nav className="nav-desktop" aria-label="Primary">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
            Home
          </Link>
          <Link href="/latest/" aria-current={pathname.startsWith("/latest") ? "page" : undefined}>
            Latest
          </Link>
          <PopMenu id="channels-menu" label="Channels">
            {catalog.channels.map((channel) => (
              <Link key={channel.id} href={`/channel/${channel.slug}/`}>
                {channel.name}
              </Link>
            ))}
          </PopMenu>
          <Link href="/my-list/" aria-current={pathname.startsWith("/my-list") ? "page" : undefined}>
            My List
          </Link>
        </nav>
        <div className="nav-mobile">
          <PopMenu id="browse-menu" label="Browse">
            <Link href="/">Home</Link>
            <Link href="/latest/">Latest</Link>
            <Link href="/my-list/">My List</Link>
            {catalog.channels.map((channel) => (
              <Link key={channel.id} href={`/channel/${channel.slug}/`}>
                {channel.name}
              </Link>
            ))}
          </PopMenu>
        </div>
        <div className="header-tools">
          <search>
            <form
              className={searchOpen ? "search-form is-open" : "search-form"}
              action="/search/"
              method="get"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                setSearchOpen(true);
                commit(value);
              }}
            >
              <label className="visually-hidden" htmlFor="site-search">
                Search titles, channels, and descriptions
              </label>
              <input
                id="site-search"
                ref={inputRef}
                type="search"
                name="q"
                placeholder="Titles, channels, descriptions"
                value={value}
                autoComplete="off"
                onFocus={() => {
                  setFocused(true);
                  setSearchOpen(true);
                }}
                onBlur={() => {
                  setFocused(false);
                  if (!value.trim()) collapseSearch();
                }}
                onChange={(event) => {
                  setSearchOpen(true);
                  updateSearch(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") collapseSearch();
                }}
              />
              <button
                type="button"
                className="icon-btn icon-btn-plain"
                aria-expanded={searchOpen}
                aria-controls="site-search"
                onClick={() => {
                  setSearchOpen(true);
                  inputRef.current?.focus();
                }}
              >
                <SearchIcon />
                <span className="visually-hidden">Search</span>
              </button>
            </form>
          </search>
          <PopMenu
            id="profile-menu"
            label={
              <>
                {store.hydrated && profile ? (
                  <Avatar name={profile.name} avatar={profile.avatar} />
                ) : (
                  <span className="avatar avatar-skeleton" />
                )}
                <span className="profile-caret" aria-hidden="true" />
                <span className="visually-hidden">{profile ? `Profile menu, ${profile.name}` : "Profile menu"}</span>
              </>
            }
            className="profile-trigger"
          >
            <p className="menu-label">{profile?.name ?? "Profile"}</p>
            {otherProfiles.map((item) => (
              <button key={item.id} type="button" className="menu-profile" onClick={() => switchProfile(item.id)}>
                <Avatar name={item.name} avatar={item.avatar} className="avatar-sm" />
                <span>{item.name}</span>
              </button>
            ))}
            <button type="button" onClick={requestManage}>
              Manage profiles
            </button>
            <hr className="menu-divider" />
            <button type="button" onClick={signOut}>
              Switch profile
            </button>
          </PopMenu>
        </div>
      </div>
    </header>
  );
}

function PopMenu({
  id,
  label,
  children,
  className = "nav-trigger",
}: {
  id: string;
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    if (!button || !panel) return;
    const place = () => {
      const rect = button.getBoundingClientRect();
      const width = Math.max(panel.offsetWidth, 220);
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
      panel.style.top = `${rect.bottom + 8}px`;
      panel.style.left = `${Math.max(8, left)}px`;
    };
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "open") place();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("a, button")) panel.hidePopover();
    };
    panel.addEventListener("beforetoggle", onToggle);
    panel.addEventListener("click", onClick);
    return () => {
      panel.removeEventListener("beforetoggle", onToggle);
      panel.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      <button ref={buttonRef} type="button" className={className} popoverTarget={id}>
        {label}
      </button>
      <div ref={panelRef} id={id} popover="auto" className="pop-menu">
        {children}
      </div>
    </>
  );
}
