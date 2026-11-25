"use client";

import { useSyncExternalStore } from "react";

const subscribers = new Map<string, (callback: () => void) => () => void>();

function subscribe(query: string) {
  const cached = subscribers.get(query);
  if (cached) return cached;
  const listener = (callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };
  subscribers.set(query, listener);
  return listener;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function subscribeConnection(callback: () => void) {
  const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
  connection?.addEventListener?.("change", callback);
  return () => connection?.removeEventListener?.("change", callback);
}

function saveDataSnapshot() {
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
}

export function useSaveData(): boolean {
  return useSyncExternalStore(subscribeConnection, saveDataSnapshot, () => false);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

export function useAmbientPreview(): boolean {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const narrow = useMediaQuery("(max-width: 899px)");
  const fine = useFinePointer();
  const saveData = useSaveData();
  return fine && !narrow && !reduce && !saveData;
}
