"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { addProfile, deleteProfile as removeProfile, renameProfile as renameProfileList } from "@/lib/profiles";
import { toggleMyList } from "@/lib/mylist";
import { recordProgress } from "@/lib/progress";
import { setReaction as applyReaction } from "@/lib/reactions";
import { EMPTY_LIBRARY } from "@/lib/rows";
import { emptyLibrary, getServerStore, readLiveStore, subscribeStore, updateLiveStore, type LiveStore } from "@/lib/store";
import type { Catalog, Profile, ProfileLibrary, ProgressUpdate, Reaction, Video } from "@/lib/types";

export interface HoverState {
  videoId: string;
  top: number;
  left: number;
  width: number;
}

interface AppContextValue {
  catalog: Catalog;
  store: LiveStore;
  profile: Profile | null;
  library: ProfileLibrary;
  gateEditing: boolean;
  modalId: string | null;
  hover: HoverState | null;
  openTitle: (videoId: string) => void;
  closeTitle: () => void;
  setHover: (hover: HoverState | null) => void;
  scheduleClearHover: () => void;
  cancelClearHover: () => void;
  toggleList: (videoId: string) => void;
  setReaction: (videoId: string, reaction: Reaction | null) => void;
  noteProgress: (update: ProgressUpdate) => void;
  selectProfile: (id: string) => void;
  signOut: () => void;
  requestManage: () => void;
  finishManage: () => void;
  createProfile: (profile: Profile) => boolean;
  renameProfile: (id: string, name: string) => void;
  changeAvatar: (id: string, avatar: string) => void;
  deleteProfile: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside Providers");
  return value;
}

function libraryFor(store: LiveStore): ProfileLibrary {
  if (!store.hydrated || !store.activeProfileId) return EMPTY_LIBRARY;
  return store.libraries[store.activeProfileId] ?? emptyLibrary();
}

export function Providers({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const store = useSyncExternalStore(subscribeStore, readLiveStore, getServerStore);
  const [modalId, setModalId] = useState<string | null>(null);
  const [hover, setHoverState] = useState<HoverState | null>(null);
  const [gateEditing, setGateEditing] = useState(false);
  const hoverRef = useRef<HoverState | null>(null);
  const clearTimer = useRef(0);

  const setHover = useCallback((next: HoverState | null) => {
    window.clearTimeout(clearTimer.current);
    hoverRef.current = next;
    setHoverState(next);
  }, []);

  const scheduleClearHover = useCallback(() => {
    window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => {
      const current = hoverRef.current;
      const floater = document.getElementById("hover-card");
      const card = current ? document.querySelector(`[data-video-id="${current.videoId}"]`) : null;
      if (floater?.matches(":hover") || card?.matches(":hover")) return;
      hoverRef.current = null;
      setHoverState(null);
    }, 240);
  }, []);

  const cancelClearHover = useCallback(() => {
    window.clearTimeout(clearTimer.current);
  }, []);

  const openTitle = useCallback((videoId: string) => {
    window.clearTimeout(clearTimer.current);
    hoverRef.current = null;
    setHoverState(null);
    setModalId(videoId);
  }, []);

  const closeTitle = useCallback(() => setModalId(null), []);

  useEffect(() => {
    if (!store.hydrated) return;
    document.documentElement.dataset.gate = store.activeProfileId ? "app" : "open";
  }, [store.activeProfileId, store.hydrated]);

  const mutateLibrary = useCallback((recipe: (library: ProfileLibrary) => ProfileLibrary) => {
    updateLiveStore((current) => {
      if (!current.activeProfileId) return current;
      const library = current.libraries[current.activeProfileId] ?? emptyLibrary();
      return {
        ...current,
        libraries: {
          ...current.libraries,
          [current.activeProfileId]: recipe(library),
        },
      };
    });
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const profile = store.hydrated
      ? store.profiles.find((item) => item.id === store.activeProfileId) ?? null
      : null;
    return {
      catalog,
      store,
      profile,
      library: libraryFor(store),
      gateEditing,
      modalId,
      hover,
      openTitle,
      closeTitle,
      setHover,
      scheduleClearHover,
      cancelClearHover,
      toggleList: (videoId: string) => {
        mutateLibrary((library) => ({ ...library, list: toggleMyList(library.list, videoId) }));
      },
      setReaction: (videoId: string, reaction: Reaction | null) => {
        mutateLibrary((library) => ({ ...library, likes: applyReaction(library.likes, videoId, reaction) }));
      },
      noteProgress: (update: ProgressUpdate) => {
        mutateLibrary((library) => ({
          ...library,
          progress: recordProgress(library.progress, update),
          lastPlayedVideoId: update.videoId,
        }));
      },
      selectProfile: (id: string) => {
        setGateEditing(false);
        setModalId(null);
        updateLiveStore((current) => ({ ...current, activeProfileId: id }));
      },
      signOut: () => {
        setGateEditing(false);
        setModalId(null);
        updateLiveStore((current) => ({ ...current, activeProfileId: null }));
      },
      requestManage: () => {
        setGateEditing(true);
        setModalId(null);
        updateLiveStore((current) => ({ ...current, activeProfileId: null }));
      },
      finishManage: () => setGateEditing(false),
      createProfile: (next: Profile) => {
        let created = false;
        updateLiveStore((current) => {
          const profiles = addProfile(current.profiles, next);
          created = profiles !== current.profiles;
          if (!created) return current;
          return {
            ...current,
            profiles,
            libraries: { ...current.libraries, [next.id]: emptyLibrary() },
          };
        });
        return created;
      },
      renameProfile: (id: string, name: string) => {
        updateLiveStore((current) => ({ ...current, profiles: renameProfileList(current.profiles, id, name) }));
      },
      changeAvatar: (id: string, avatar: string) => {
        updateLiveStore((current) => ({
          ...current,
          profiles: current.profiles.map((item) => (item.id === id ? { ...item, avatar } : item)),
        }));
      },
      deleteProfile: (id: string) => {
        updateLiveStore((current) => {
          const profiles = removeProfile(current.profiles, id);
          if (profiles === current.profiles) return current;
          const libraries = { ...current.libraries };
          delete libraries[id];
          return {
            ...current,
            profiles,
            libraries,
            activeProfileId: current.activeProfileId === id ? null : current.activeProfileId,
          };
        });
      },
    };
  }, [
    cancelClearHover,
    catalog,
    closeTitle,
    gateEditing,
    hover,
    modalId,
    mutateLibrary,
    openTitle,
    scheduleClearHover,
    setHover,
    store,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function videoFromCatalog(catalog: Catalog, id: string): Video | undefined {
  return catalog.videos.find((video) => video.id === id);
}
