import type { Profile } from "@/lib/types";

export const MAX_PROFILES = 5;
export const MAX_NAME_LENGTH = 18;

export const AVATARS = [
  { id: "ember", background: "linear-gradient(145deg, #e50914 0%, #7f1d1d 100%)" },
  { id: "ocean", background: "linear-gradient(145deg, #38bdf8 0%, #1e3a8a 100%)" },
  { id: "forest", background: "linear-gradient(145deg, #4ade80 0%, #14532d 100%)" },
  { id: "sun", background: "linear-gradient(145deg, #facc15 0%, #c2410c 100%)" },
  { id: "violet", background: "linear-gradient(145deg, #d946ef 0%, #4c1d95 100%)" },
  { id: "slate", background: "linear-gradient(145deg, #cbd5e1 0%, #334155 100%)" },
  { id: "rose", background: "linear-gradient(145deg, #fb7185 0%, #9f1239 100%)" },
  { id: "ink", background: "linear-gradient(145deg, #52525b 0%, #09090b 100%)" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

const avatarIds = new Set<string>(AVATARS.map((avatar) => avatar.id));

export function sanitizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export function isAvatarId(value: string): value is AvatarId {
  return avatarIds.has(value);
}

export function avatarStyle(id: string): string {
  return AVATARS.find((avatar) => avatar.id === id)?.background ?? AVATARS[0].background;
}

export function addProfile(profiles: Profile[], profile: Profile): Profile[] {
  if (profiles.length >= MAX_PROFILES) return profiles;
  const name = sanitizeName(profile.name);
  if (!name || !profile.id) return profiles;
  if (profiles.some((item) => item.id === profile.id)) return profiles;
  return [...profiles, { id: profile.id, name, avatar: isAvatarId(profile.avatar) ? profile.avatar : "ember" }];
}

export function renameProfile(profiles: Profile[], id: string, name: string): Profile[] {
  const clean = sanitizeName(name);
  if (!clean) return profiles;
  return profiles.map((profile) => (profile.id === id ? { ...profile, name: clean } : profile));
}

export function deleteProfile(profiles: Profile[], id: string): Profile[] {
  return profiles.filter((profile) => profile.id !== id);
}
