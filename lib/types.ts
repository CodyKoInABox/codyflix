export const CHANNEL_ROLES = [
  "main",
  "second",
  "collab",
  "wife",
  "dj",
  "podcast",
  "related",
] as const;

export type ChannelRole = (typeof CHANNEL_ROLES)[number];

export interface Channel {
  id: string;
  slug: string;
  name: string;
  role: ChannelRole;
  handle: string;
  url: string;
  blurb: string;
}

export interface Video {
  id: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
}

export interface Catalog {
  generatedAt: string;
  source: "rss" | "mixed" | "cache" | "researched";
  notes: string[];
  channels: Channel[];
  videos: Video[];
}

export interface ProgressEntry {
  videoId: string;
  positionSeconds: number;
  durationSeconds?: number;
  updatedAt: number;
  started: boolean;
}

export type Reaction = "like" | "dislike";

export interface ProfileLibrary {
  list: string[];
  likes: Record<string, Reaction>;
  progress: Record<string, ProgressEntry>;
  lastPlayedVideoId?: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
}

export interface Store {
  profiles: Profile[];
  activeProfileId: string | null;
  libraries: Record<string, ProfileLibrary>;
}

export interface ProgressUpdate {
  videoId: string;
  positionSeconds?: number;
  durationSeconds?: number;
  started?: boolean;
  now?: number;
}

export type RowVariant = "rail" | "top10";

export interface HomeRow {
  id: string;
  title: string;
  note?: string;
  variant: RowVariant;
  videos: Video[];
  channelSlug?: string;
}
