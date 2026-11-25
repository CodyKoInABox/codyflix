import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const channelsPath = path.join(root, "data", "channels.json");
const catalogPath = path.join(root, "data", "catalog.json");

const NOTES = [
  "Catalog entries come from each channel’s public YouTube RSS feed (about 15 latest uploads per channel). Durations and view counts are not in that feed and are not invented.",
  "No dedicated Cody Ko DJ YouTube channel was found. He has played DJ sets live (including at Wynn Las Vegas) and has posted music on channels already in this list. SoundCloud @stupidassbeats is not a YouTube channel and is not ingested.",
  "CodyKolodziejzyk (UCTbua5jFhNVOPvAw7DMFlRQ) is an old personal channel whose RSS stops in 2009, so it is not included. TMG Podcast Highlights (UCFWQtV2Gnv79r-uwRa64fGw) stops in 2019 and is not included.",
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) => name === "entry",
  trimValues: true,
});

function text(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node).trim();
  if (typeof node === "object" && "#text" in node) return String(node["#text"] ?? "").trim();
  return "";
}

function readPrevious(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.videos) || !Array.isArray(parsed.channels)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function fetchText(url) {
  let lastError = new Error(`Failed to fetch ${url}`);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/atom+xml, application/xml, text/xml",
          "user-agent": "CodyflixCatalog/1.0",
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw lastError;
}

function videosFromFeed(xml, channel) {
  const feed = parser.parse(xml)?.feed;
  if (!feed) throw new Error(`No feed root for ${channel.slug}`);
  const entries = Array.isArray(feed.entry) ? feed.entry : [];
  const videos = [];
  for (const entry of entries) {
    const id = text(entry["yt:videoId"]);
    const title = text(entry.title);
    const publishedAt = text(entry.published);
    if (!/^[\w-]{11}$/.test(id) || !title || Number.isNaN(Date.parse(publishedAt))) continue;
    const group = entry["media:group"] ?? {};
    const description = text(group["media:description"]).slice(0, 8000);
    const thumb = group["media:thumbnail"];
    const thumbnail =
      (thumb && typeof thumb === "object" && typeof thumb["@_url"] === "string" && thumb["@_url"]) ||
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    videos.push({
      id,
      channelId: channel.id,
      title,
      description,
      publishedAt,
      thumbnail,
    });
  }
  return videos;
}

function stable(value) {
  return JSON.stringify(value);
}

async function main() {
  const channels = JSON.parse(await readFile(channelsPath, "utf8"));
  let previousRaw = "";
  try {
    previousRaw = await readFile(catalogPath, "utf8");
  } catch {
    previousRaw = "";
  }
  const previous = readPrevious(previousRaw);
  const previousByChannel = new Map();
  for (const video of previous?.videos ?? []) {
    const list = previousByChannel.get(video.channelId) ?? [];
    list.push(video);
    previousByChannel.set(video.channelId, list);
  }

  const videosByChannel = new Map();
  let failures = 0;
  let successes = 0;

  for (const channel of channels) {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channel.id)}`;
    try {
      const xml = await fetchText(url);
      const videos = videosFromFeed(xml, channel);
      if (videos.length === 0) throw new Error("Feed returned no playable entries");
      videosByChannel.set(channel.id, videos);
      successes += 1;
      console.log(`fetched ${channel.slug}: ${videos.length} videos`);
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`kept previous videos for ${channel.slug}: ${message}`);
      videosByChannel.set(channel.id, previousByChannel.get(channel.id) ?? []);
    }
  }

  const videos = channels.flatMap((channel) => videosByChannel.get(channel.id) ?? []);
  if (videos.length === 0) {
    console.error("No catalog videos are available. Build cannot invent a catalog.");
    process.exit(1);
  }

  const source = failures === 0 ? "rss" : successes === 0 ? previous?.source ?? "cache" : "mixed";
  const next = {
    generatedAt: successes > 0 ? new Date().toISOString() : previous?.generatedAt ?? new Date().toISOString(),
    source,
    notes: NOTES,
    channels,
    videos: [...videos].sort((a, b) => {
      const delta = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
      if (delta !== 0) return delta;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }),
  };

  const comparable = (catalog) => stable({
    source: catalog.source,
    notes: catalog.notes,
    channels: catalog.channels,
    videos: catalog.videos,
  });

  if (previous && comparable(previous) === comparable(next)) {
    console.log("Catalog content is unchanged. Leaving data/catalog.json as committed.");
    return;
  }

  if (successes === 0 && previous) {
    console.log("Every feed failed. Existing data/catalog.json was left untouched.");
    return;
  }

  await writeFile(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Wrote ${next.videos.length} videos (${source}, ${failures} channel failures).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
