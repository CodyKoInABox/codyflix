import type { ProgressEntry, ProgressUpdate, Video } from "@/lib/types";

const COMPLETE_RATIO = 0.92;

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function progressRatio(entry: ProgressEntry | undefined): number | null {
  if (!entry?.durationSeconds || entry.durationSeconds <= 0) return null;
  const ratio = entry.positionSeconds / entry.durationSeconds;
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  return Math.min(1, ratio);
}

export function isFinished(entry: ProgressEntry): boolean {
  const ratio = progressRatio(entry);
  return ratio != null && ratio >= COMPLETE_RATIO;
}

export function recordProgress(
  existing: Record<string, ProgressEntry>,
  update: ProgressUpdate,
): Record<string, ProgressEntry> {
  const previous = existing[update.videoId];
  const incomingPosition = finiteNumber(update.positionSeconds);
  const positionSeconds = Math.max(0, incomingPosition ?? previous?.positionSeconds ?? 0);
  const incomingDuration = finiteNumber(update.durationSeconds);
  const durationSeconds =
    incomingDuration != null && incomingDuration > 0
      ? incomingDuration
      : previous?.durationSeconds && previous.durationSeconds > 0
        ? previous.durationSeconds
        : undefined;
  const next: ProgressEntry = {
    videoId: update.videoId,
    positionSeconds,
    ...(durationSeconds ? { durationSeconds } : {}),
    updatedAt: update.now ?? Date.now(),
    started: true,
  };
  return { ...existing, [update.videoId]: next };
}

export function continueWatching(videos: Video[], progress: Record<string, ProgressEntry>): Video[] {
  const byId = new Map(videos.map((video) => [video.id, video]));
  return Object.values(progress)
    .filter((entry) => (entry.started || entry.positionSeconds > 0) && !isFinished(entry))
    .filter((entry) => byId.has(entry.videoId))
    .sort((a, b) => b.updatedAt - a.updatedAt || (a.videoId < b.videoId ? -1 : 1))
    .map((entry) => byId.get(entry.videoId) as Video);
}
