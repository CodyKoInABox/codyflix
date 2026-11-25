import { continueWatching } from "@/lib/progress";
import { resolveMyList } from "@/lib/mylist";
import type { Channel, HomeRow, ProfileLibrary, Video } from "@/lib/types";

export const EMPTY_LIBRARY: ProfileLibrary = {
  list: [],
  likes: {},
  progress: {},
};

const ROLE_RANK: Record<string, number> = {
  main: 0,
  second: 1,
  collab: 2,
  podcast: 3,
  wife: 4,
  dj: 5,
  related: 6,
};

export function byDateDesc(a: Video, b: Video): number {
  const delta = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  if (delta !== 0) return delta;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function selectFeatured(channels: Channel[], videos: Video[]): Video | null {
  const main = channels.find((channel) => channel.role === "main");
  const pool = main ? videos.filter((video) => video.channelId === main.id) : videos;
  return [...pool].sort(byDateDesc)[0] ?? null;
}

export function similarVideos(videos: Video[], video: Video, limit = 12): Video[] {
  const sameChannel = videos
    .filter((item) => item.channelId === video.channelId && item.id !== video.id)
    .sort(byDateDesc);
  if (sameChannel.length >= limit) return sameChannel.slice(0, limit);
  const rest = videos.filter((item) => item.channelId !== video.channelId).sort(byDateDesc);
  return [...sameChannel, ...rest].slice(0, limit);
}

export function buildHomeRows(channels: Channel[], videos: Video[], library: ProfileLibrary): HomeRow[] {
  const rows: HomeRow[] = [];
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));

  const watching = continueWatching(videos, library.progress);
  if (watching.length > 0) {
    rows.push({ id: "continue", title: "Continue Watching", variant: "rail", videos: watching });
  }

  const mine = resolveMyList(library.list, videos);
  if (mine.length > 0) {
    rows.push({ id: "my-list", title: "My List", variant: "rail", videos: mine });
  }

  const latest = [...videos].sort(byDateDesc).slice(0, 20);
  if (latest.length > 0) {
    rows.push({
      id: "latest",
      title: "Latest on Codyflix",
      variant: "rail",
      videos: latest,
    });
  }

  const top = [...videos].sort(byDateDesc).slice(0, 10);
  if (top.length > 0) {
    rows.push({
      id: "top10",
      title: "Top 10 Latest",
      note: "Ordered by publish date, not views.",
      variant: "top10",
      videos: top,
    });
  }

  if (library.lastPlayedVideoId) {
    const last = videos.find((video) => video.id === library.lastPlayedVideoId);
    const channel = last ? channelById.get(last.channelId) : undefined;
    if (last && channel) {
      const because = videos
        .filter((video) => video.channelId === channel.id && video.id !== last.id)
        .sort(byDateDesc)
        .slice(0, 20);
      if (because.length > 0) {
        rows.push({
          id: "because",
          title: `Because you watched ${channel.name}`,
          variant: "rail",
          videos: because,
          channelSlug: channel.slug,
        });
      }
    }
  }

  const orderedChannels = channels
    .map((channel, index) => ({ channel, index }))
    .sort((a, b) => (ROLE_RANK[a.channel.role] ?? 99) - (ROLE_RANK[b.channel.role] ?? 99) || a.index - b.index);

  for (const { channel } of orderedChannels) {
    const channelVideos = videos.filter((video) => video.channelId === channel.id).sort(byDateDesc);
    if (channelVideos.length === 0) continue;
    rows.push({
      id: `channel-${channel.slug}`,
      title: channel.name,
      variant: "rail",
      videos: channelVideos,
      channelSlug: channel.slug,
    });
  }

  const grouped = channels.filter((channel) => channel.role === "collab" || channel.role === "podcast");
  const groupedIds = new Set(grouped.map((channel) => channel.id));
  const mixed = videos.filter((video) => groupedIds.has(video.channelId)).sort(byDateDesc);
  const represented = new Set(mixed.map((video) => video.channelId));
  if (represented.size >= 2) {
    rows.push({
      id: "podcasts-collabs",
      title: "Podcasts & Collabs",
      variant: "rail",
      videos: mixed.slice(0, 20),
    });
  }

  return rows;
}
