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

**Drawn for this site:** the pyramids-and-sun mark, the lotus frieze, 17 landmark line icons, the
self-drawing skyline (`Skyline.astro`), the "what you see from the balcony" panorama at true bearings
with today's sunset azimuth (`Panorama.astro`), the sunset-time ribbon (`Sunset.astro`), the Giza map
with the Nile, the plateau and Pyramids Road (`MapSection.astro`), and the starfield behind the reviews.

**Provisional until the owner confirms:**
- The WhatsApp number is the listings' phone (+20 100 536 2094).
- Which photo shows which room type (`ROOMS` in `src/data/site.ts`) is read from the photos.
- The 24 photos are listing photos (Tripadvisor, ZenHotels, Trip.com; Booking.com blocks fetches and
  Agoda has no listing), placeholders until originals arrive. The roof-terrace and newer-room photos
  come from the Trip.com listing at the same address and phone.
- The pin is the Google listing's (29.97496, 31.151992); the owner may want it moved to the door.

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
(screenshots) or `… qa.mjs audit / /rooms/ /giza/` (overflow, broken images, console errors).

## Deploy

`scripts/deploy.sh` builds and force-pushes `dist/` to the `gh-pages` branch (GitHub Pages source:
branch `gh-pages`, `/`). Run `gh auth switch -u jeeveshverma` first and switch back after. The site
lives under the `/giza-pyramids-view-guest-house` base path.
