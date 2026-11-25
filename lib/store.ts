import { isAvatarId, MAX_PROFILES, sanitizeName } from "@/lib/profiles";
import type { Profile, ProfileLibrary, ProgressEntry, Reaction, Store } from "@/lib/types";

export function emptyLibrary(): ProfileLibrary {
  return { list: [], likes: {}, progress: {} };
}

export function emptyStore(): Store {
  return { profiles: [], activeProfileId: null, libraries: {} };
}

function isReaction(value: unknown): value is Reaction {
  return value === "like" || value === "dislike";
}

function normalizeProgress(value: unknown, fallbackId: string): ProgressEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<ProgressEntry>;
  const videoId = typeof entry.videoId === "string" && entry.videoId ? entry.videoId : fallbackId;
  const position = typeof entry.positionSeconds === "number" && Number.isFinite(entry.positionSeconds)
    ? Math.max(0, entry.positionSeconds)
    : 0;
  const duration = typeof entry.durationSeconds === "number" && Number.isFinite(entry.durationSeconds) && entry.durationSeconds > 0
    ? entry.durationSeconds
    : undefined;
  const updatedAt = typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0;
  if (!videoId) return null;
  return {
    videoId,
    positionSeconds: position,
    ...(duration ? { durationSeconds: duration } : {}),
    updatedAt,
    started: entry.started !== false,
  };
}

export function normalizeLibrary(value: unknown): ProfileLibrary {
  const library = emptyLibrary();
  if (!value || typeof value !== "object") return library;
  const raw = value as Partial<ProfileLibrary>;
  if (Array.isArray(raw.list)) {
    const seen = new Set<string>();
    for (const id of raw.list) {
      if (typeof id !== "string" || !id || seen.has(id)) continue;
      seen.add(id);
      library.list.push(id);
      if (library.list.length >= 200) break;
    }
  }
  if (raw.likes && typeof raw.likes === "object") {
    for (const [id, reaction] of Object.entries(raw.likes)) {
      if (isReaction(reaction)) library.likes[id] = reaction;
    }
  }
  if (raw.progress && typeof raw.progress === "object") {
    for (const [id, entry] of Object.entries(raw.progress)) {
      const progress = normalizeProgress(entry, id);
      if (progress) library.progress[progress.videoId] = progress;
    }
  }
  if (typeof raw.lastPlayedVideoId === "string" && raw.lastPlayedVideoId) {
    library.lastPlayedVideoId = raw.lastPlayedVideoId;
  }
  return library;
}

function normalizeProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Profile>;
  if (typeof raw.id !== "string" || !raw.id) return null;
  const name = sanitizeName(typeof raw.name === "string" ? raw.name : "");
  if (!name) return null;
  return {
    id: raw.id,
    name,
    avatar: typeof raw.avatar === "string" && isAvatarId(raw.avatar) ? raw.avatar : "ember",
  };
}

export function normalizeStore(value: unknown): Store {
  if (!value || typeof value !== "object") return emptyStore();
  const raw = value as Partial<Store>;
  const profiles = (Array.isArray(raw.profiles) ? raw.profiles : [])
    .map(normalizeProfile)
    .filter((profile): profile is Profile => profile != null)
    .filter((profile, index, list) => list.findIndex((item) => item.id === profile.id) === index)
    .slice(0, MAX_PROFILES);
  const allowed = new Set(profiles.map((profile) => profile.id));
  const libraries: Record<string, ProfileLibrary> = {};
  const rawLibraries = raw.libraries && typeof raw.libraries === "object" ? raw.libraries : {};
  for (const profile of profiles) {
    libraries[profile.id] = normalizeLibrary(rawLibraries[profile.id]);
  }
  const activeProfileId = typeof raw.activeProfileId === "string" && allowed.has(raw.activeProfileId)
    ? raw.activeProfileId
    : null;
  return { profiles, activeProfileId, libraries };
}

const STORAGE_KEY = "codyflix.v1";

export type LiveStore = Store & { hydrated: boolean };

const SERVER_SNAPSHOT: LiveStore = {
  profiles: [],
  activeProfileId: null,
  libraries: {},
  hydrated: false,
};

let cache: { raw: string | null; store: LiveStore } | null = null;

function persistable(store: Store): Store {
  return {
    profiles: store.profiles,
    activeProfileId: store.activeProfileId,
    libraries: store.libraries,
  };
}

export function readLiveStore(): LiveStore {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (cache && cache.raw === raw) return cache.store;
  let parsed = emptyStore();
  if (raw) {
    try {
      parsed = normalizeStore(JSON.parse(raw));
    } catch {
      parsed = emptyStore();
    }
  }
  const store: LiveStore = { ...parsed, hydrated: true };
  cache = { raw, store };
  return store;
}

export function getServerStore(): LiveStore {
  return SERVER_SNAPSHOT;
}

export function subscribeStore(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) return;
    cache = null;
    callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("codyflix-store", callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("codyflix-store", callback);
  };
}

export function writeLiveStore(store: Store): void {
  const clean = persistable(store);
  const raw = JSON.stringify(clean);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cache = { raw, store: { ...clean, hydrated: true } };
  if (document.documentElement) {
    document.documentElement.dataset.gate = clean.activeProfileId ? "app" : "open";
  }
  window.dispatchEvent(new Event("codyflix-store"));
}

export function updateLiveStore(recipe: (store: Store) => Store): void {
  writeLiveStore(recipe(readLiveStore()));
}

export { STORAGE_KEY };
