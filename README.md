# Codyflix

Codyflix is a static, Netflix-style browser for YouTube videos from Cody Ko and the channels around him. Profiles, My List, likes, and continue-watching progress stay in `localStorage`. Playback uses the official YouTube player on `youtube-nocookie.com`. There is no database, no Cloud Functions, and no API key.

The previous app in this repo is preserved under `(archive)/` and is not part of the build.

## Channels

| Channel | Role | Channel ID |
| --- | --- | --- |
| Cody Ko | main | `UCfp86n--4JvqKbunwSI2lYQ` |
| Cody & Ko | second | `UCy06jHRS_82N2i5v1YL7glQ` |
| TMG Studios (Tiny Meat Gang, with Noel Miller) | collab | `UC4sf8XtH_uXnwNP699luQVQ` |
| Insanely Chill | podcast | `UCr2YGSi6k38GdeVzwXpbmmw` |
| Circle Time with Kelsey Kreppel | podcast | `UCAuv0BvlTmR9KAOQKSyEaJw` |
| Kelsey Kreppel | wife | `UCZym84-cGUKAf1T2isIIXvw` |
| Cody Trains | related | `UC1zrPxxLTkfQdbwdn6lJQ7w` |

No dedicated Cody Ko DJ YouTube channel showed up in public channel lists or RSS. Live DJ sets (including Wynn Las Vegas) and the SoundCloud account `@stupidassbeats` are not YouTube channels, so they are not in the catalog. Music videos that the RSS feeds actually include are normal catalog entries.

`CodyKolodziejzyk` (`UCTbua5jFhNVOPvAw7DMFlRQ`) stops in 2009. TMG Podcast Highlights (`UCFWQtV2Gnv79r-uwRa64fGw`) stops in 2019. Neither is a current channel, so both are left out.

YouTube’s public RSS feed returns about 15 latest uploads per channel. Codyflix does not invent view counts, durations, or extra videos. Duration appears on a card only after the YouTube IFrame Player API reports it during playback. “Latest” and “Top 10 Latest” are ordered by publish date.

## Local development

```bash
npm install
npm run dev
```

Open the URL Next prints (usually `http://localhost:3000`).

## Refresh the catalog

```bash
npm run fetch-catalog
```

That reads `data/channels.json`, downloads each channel’s public feed at `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`, and rewrites `data/catalog.json` when the videos or channel metadata changed. If a feed fails and a catalog already exists, the previous videos for that channel are kept. If every feed fails, the committed catalog is left untouched and the command still exits 0. If there is no catalog and every feed fails, the command exits 1.

`npm run build` runs the same fetch first, then exports the site. A failed refresh does not fail the build when `data/catalog.json` is already present.

## Production build

```bash
npm run build
```

Next.js writes a static site to `out/` (`output: 'export'`, `images.unoptimized`, `trailingSlash`). Serve it with any static host. For a quick local check:

```bash
npx --yes serve out -l 4173
```

## Firebase Hosting (Spark, free tier)

This project is static files only. Do not enable Cloud Functions, App Hosting, or the Blaze plan.

1. Create a Firebase project on the Spark plan.
2. Install nothing globally. From this repo, after `npm run build`:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use --add
```

`firebase use --add` writes `.firebaserc` with your project id. That file is gitignored. `.firebaserc.example` shows the shape. The project id is not a secret, but it is environment-specific, so it stays off the branch.

3. Deploy Hosting only:

```bash
npx -y firebase-tools@latest deploy --only hosting
```

`firebase.json` publishes the `out` directory. There is no catch-all rewrite, so exported HTML files are served as files. `trailingSlash` is on, matching the Next export. `(archive)/` is not inside `out`, and it is also listed in the Hosting ignore list.

Optional local preview of the hosting config:

```bash
npx -y firebase-tools@latest emulators:start --only hosting
```

The emulator serves `out/` at `http://localhost:5000` by default.

## Netlify

The existing Netlify site builds GitHub deploy previews from this repo. `netlify.toml` is only that build contract. Production hosting stays on Firebase, above.

The file sets the build command to `npm run build`, the publish directory to `out`, and Node `22` (also in `.node-version`). `NETLIFY_NEXT_PLUGIN_SKIP=true` keeps Netlify’s Next.js runtime from turning the export into a server deploy. Pretty URLs serve the trailing-slash pages (`/`, `/search/`, `/my-list/`, `/latest/`, `/channel/<slug>/`, `/watch/<id>/`). There is no catch-all rewrite. The response headers match the security and immutable-asset headers in `firebase.json`.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run fetch-catalog` — refresh `data/catalog.json`
- `npm run build` — refresh, then static export
- `npm test` — unit tests for search, rows, progress, My List, and profiles
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
