import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WatchScreen } from "@/components/watch-screen";
import { getCatalog, videoById } from "@/lib/catalog";
import { truncate } from "@/lib/text";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().videos.map((video) => ({ id: video.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = videoById(getCatalog(), id);
  if (!video) return { title: "Watch" };
  return {
    title: video.title,
    description: truncate(video.description, 160) || `Watch ${video.title} on Codyflix.`,
  };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!videoById(getCatalog(), id)) notFound();
  return <WatchScreen videoId={id} />;
}
