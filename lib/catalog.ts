import catalogJson from "@/data/catalog.json";
import type { Catalog, Channel, Video } from "@/lib/types";

export function getCatalog(): Catalog {
  return catalogJson as Catalog;
}

export function videoById(catalog: Catalog, id: string): Video | undefined {
  return catalog.videos.find((video) => video.id === id);
}

export function channelById(catalog: Catalog, id: string): Channel | undefined {
  return catalog.channels.find((channel) => channel.id === id);
}

export function channelBySlug(catalog: Catalog, slug: string): Channel | undefined {
  return catalog.channels.find((channel) => channel.slug === slug);
}

export function channelForVideo(catalog: Catalog, video: Video): Channel | undefined {
  return channelById(catalog, video.channelId);
}
