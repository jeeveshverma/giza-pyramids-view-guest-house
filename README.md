# Giza Pyramids View Guest House — website

Bilingual (English / العربية) static site for **Giza Pyramids View Guest House** (بيت ضيافة إطلالة
أهرامات الجيزة), a family-run guest house on the 11th floor of 4 Abd Al Aziz Al Basel Street, Al Haram,
Giza, with the three pyramids in the window. Built with Astro 5, hosted on GitHub Pages, no backend:
every "Enquire" button opens WhatsApp with a structured message.

Live: **https://jeeveshverma.github.io/giza-pyramids-view-guest-house/** · Arabic: `/ar/`

## What the site shows (and what it deliberately does not)

Only facts the property already publishes on its listings: Google Maps (name, address, phone, the
score the owner quoted: 4.5 from 175), Tripadvisor (4.9 from 14, the review lines quoted verbatim),
Trip.com (8.6 from 66, the four room types, check-in 14:00 / check-out 11:00, breakfast 07:00–09:00,
languages, amenities), Booking.com and Expedia (sun terrace, airport shuttle, free Wi‑Fi).
**No prices.** Distances and bearings are computed from coordinates, never typed.

**The idea the site is built on:** the house is on the eleventh floor, which puts it level with the
base of the Great Pyramid, above the rooftops of Al Haram. Everything drawn serves that.

**Drawn for this site:** the pyramids-and-sun mark; the lift panel in the hero; the self-drawing
skyline (`Skyline.astro`); the "what you see from the balcony" panorama at true bearings with today's
sunset azimuth (`Panorama.astro`); the height profile from the house to the plateau with the sight
line, approximate elevations, vertical scale x2.5 (`Elevation.astro`); the 24-hour day dial with
computed sunrise and sunset, draggable, opening at the current time in Giza, each moment with its own
view photo (`DayDial.astro`); the sunset-time ribbon (`Sunset.astro`); the Giza map with the Nile, the
plateau and Pyramids Road (`MapSection.astro`); a divider drawn from the balcony's own iron railing
(`Lattice.astro`); 17 landmark line icons; the "window faces west/east" compass on each room card; and
the starfield behind the reviews. There is deliberately no icon grid of amenities: the practical facts
are a plain list.

**Booking, the way Booking.com and Agoda do it** (there is no booking engine and no prices):
search box (dates, guests) → availability table (one row per room type, sleeps, price "on request",
what is included, a room-count picker, a reserve panel that checks the rooms sleep the party) →
checkout in three steps (your selection, your details, final step) → the request shown as the
WhatsApp message it becomes, then sent on WhatsApp. The stay lives in the URL and sessionStorage
(`src/lib/stay.ts`), so every step links and reloads cleanly. `node scripts/flowtest.mjs <dir>`
runs the whole path in English and Arabic, desktop and iPhone, and checks the message.

**Photos:** 37 room, bathroom and detail photos are the owner's own (WhatsApp, 2026-10-23), grouped
into five room types by floors, ceilings, headboards, windows, tiles and the door numbers 5 and 8.

**Provisional until the owner confirms:**
- The five room types, their bed counts and how many of each exist (`ROOMS` in `src/data/site.ts`).
- The WhatsApp number is the listings' phone (+20 100 536 2094).
- The pin is the Google listing's (29.97496, 31.151992).
- Rates: shown as "on request"; the owner may want prices.

## Where things live

| What | Where |
|---|---|
| Facts: name, phone, WhatsApp number, pin, scores, times | `src/data/site.ts` |
| The three pyramids' coordinates and heights (panorama, map) | `src/data/site.ts` (`PYRAMIDS`) |
| Room types, their amenities and which photos belong to each | `src/data/site.ts` (`ROOMS`) |
| Photo catalogue: group, alt text EN/AR, captions | `src/data/photos.ts` |
| Landmarks with coordinates (distances are computed) | `src/data/places.ts` |
| Tripadvisor review lines (verbatim) | `src/data/reviews.ts` |
| All wording, per language | `src/i18n/en.json`, `src/i18n/ar.json` |
| Pages | `src/views/*.astro`, routed by `src/pages/[...path].astro` |
| Components (hero, skyline, panorama, filmstrip, reviews, map, form…) | `src/components/` |
| Design tokens | `src/styles/global.css` (`:root`) |
| Photos (masters) | `src/assets/photos/*.jpg` |

Wording uses `t('key')` from `useT(lang)`; a missing Arabic string falls back to English.

## Editing

```
npm install
npm run dev        # http://127.0.0.1:4321/giza-pyramids-view-guest-house/
npm run build      # dist/
node scripts/og.mjs   # regenerate og-image.jpg and the icons from the mark
```

QA without a browser: `npm run build && npx astro preview --host 127.0.0.1`, then
`QA_BASE=http://127.0.0.1:4321/giza-pyramids-view-guest-house node scripts/qa.mjs shots / 390 out --device iphone`
(screenshots), `… qa.mjs audit / /rooms/ /giza/` (overflow, broken images, console errors) or
`… scripts/pageerrors.mjs / /ar/` (uncaught script errors with stacks).

## Deploy

`scripts/deploy.sh` builds and force-pushes `dist/` to the `gh-pages` branch (GitHub Pages source:
branch `gh-pages`, `/`). Run `gh auth switch -u jeeveshverma` first and switch back after. The site
lives under the `/giza-pyramids-view-guest-house` base path.
