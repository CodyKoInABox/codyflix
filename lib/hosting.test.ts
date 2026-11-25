import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import firebaseHosting from "@/firebase.json";

const netlifyToml = readFileSync(new URL("../netlify.toml", import.meta.url), "utf8");
const nodeVersion = readFileSync(new URL("../.node-version", import.meta.url), "utf8").trim();

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const ASSET_EXTENSIONS = ["js", "css", "svg", "woff2", "webp", "png", "jpg", "jpeg", "ico"];

describe("Netlify static hosting", () => {
  it("builds the static export with Node 22 and without the Next.js runtime", () => {
    expect(netlifyToml).toMatch(/command\s*=\s*"npm run build"/);
    expect(netlifyToml).toMatch(/publish\s*=\s*"out"/);
    expect(netlifyToml).toMatch(/NETLIFY_NEXT_PLUGIN_SKIP\s*=\s*"true"/);
    expect(netlifyToml).toMatch(/NODE_VERSION\s*=\s*"22"/);
    expect(netlifyToml).toMatch(/pretty_urls\s*=\s*true/);
    expect(nodeVersion).toBe("22");
  });

  it("keeps Firebase security headers and does not shadow exported HTML", () => {
    const security = firebaseHosting.hosting.headers.find((rule) => rule.source === "**");
    expect(security?.headers).toEqual([
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ]);
    for (const header of security?.headers ?? []) {
      expect(netlifyToml).toContain(`${header.key} = "${header.value}"`);
    }

    const assets = firebaseHosting.hosting.headers.find((rule) => rule.source.includes(".@(js|css"));
    expect(assets?.headers).toEqual([{ key: "Cache-Control", value: IMMUTABLE_CACHE }]);
    for (const extension of ASSET_EXTENSIONS) {
      expect(netlifyToml).toContain(`for = "/*.${extension}"`);
    }
    expect(netlifyToml).toContain('for = "/_next/static/*"');
    expect(netlifyToml).toContain(`Cache-Control = "${IMMUTABLE_CACHE}"`);

    expect(netlifyToml).not.toMatch(/\[\[redirects\]\]/);
    expect(netlifyToml).not.toMatch(/^\s*from\s*=/m);
    expect(netlifyToml).not.toMatch(/status\s*=\s*200/);
    expect(firebaseHosting.hosting.public).toBe("out");
    expect(firebaseHosting.hosting.trailingSlash).toBe(true);
    expect(firebaseHosting.hosting).not.toHaveProperty("rewrites");
  });
});
