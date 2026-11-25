"use client";

import { useApp } from "@/components/app-state";
import { ROLE_LABEL } from "@/lib/text";

export function Footer() {
  const { catalog } = useApp();
  return (
    <footer className="site-footer">
      <p className="wordmark">CODYFLIX</p>
      <ul className="footer-links">
        {catalog.channels.map((channel) => (
          <li key={channel.id}>
            <a href={channel.url} target="_blank" rel="noreferrer noopener">
              {channel.name}
              <span>{ROLE_LABEL[channel.role] ?? channel.role}</span>
            </a>
          </li>
        ))}
      </ul>
      <p>
        Codyflix is an unofficial fan interface. Playback uses YouTube’s embedded player on youtube-nocookie.com.
        It is not affiliated with Cody Ko, the channels above, YouTube, or Netflix.
      </p>
      <p>The catalog is the public RSS feed for each channel, refreshed with npm run fetch-catalog. View counts and durations are not invented.</p>
    </footer>
  );
}
