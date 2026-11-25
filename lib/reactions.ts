import type { Reaction } from "@/lib/types";

export function setReaction(
  likes: Record<string, Reaction>,
  videoId: string,
  reaction: Reaction | null,
): Record<string, Reaction> {
  const next = { ...likes };
  if (reaction == null) delete next[videoId];
  else next[videoId] = reaction;
  return next;
}
