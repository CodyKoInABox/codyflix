import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChannelScreen } from "@/components/browse-screen";
import { channelBySlug, getCatalog } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().channels.map((channel) => ({ slug: channel.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const channel = channelBySlug(getCatalog(), slug);
  if (!channel) return { title: "Channel" };
  return {
    title: channel.name,
    description: channel.blurb,
  };
}

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const channel = channelBySlug(getCatalog(), slug);
  if (!channel) notFound();
  return <ChannelScreen channel={channel} />;
}
