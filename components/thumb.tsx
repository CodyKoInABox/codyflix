"use client";

import { useState } from "react";
import { cardThumb, fallbackThumb } from "@/lib/thumbs";
import type { Video } from "@/lib/types";

export function Thumb({
  video,
  priority = false,
  alt = "",
}: {
  video: Video;
  priority?: boolean;
  alt?: string;
}) {
  const [src, setSrc] = useState(() => cardThumb(video));
  return (
    <img
      src={src}
      alt={alt}
      width={1280}
      height={720}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "low"}
      onError={() => {
        const next = fallbackThumb(video);
        setSrc((current) => (current === next ? current : next));
      }}
    />
  );
}
