# Giza Pyramids View Guest House — website

Bilingual (English / العربية) static site for **Giza Pyramids View Guest House** (بيت ضيافة إطلالة
أهرامات الجيزة), a family-run guest house on the 12th floor of 4 Abd Al Aziz Al Basel Street, Al Haram,
Giza, with the three pyramids in the window. Built with Astro 5, hosted on GitHub Pages. Bookings are real: a small backend on Cloudflare
(`worker/`, a Worker with a D1 database) holds the rooms and gives a booking number.

Live: **https://gizapyramidsviewguesthouse.com/** · Arabic: `/ar/`

## What the site shows (and what it deliberately does not)

Only facts the property already publishes on its listings: Google Maps (name, address, phone, the
score the owner quoted: 4.5 from 175), Tripadvisor (4.9 from 14, the review lines quoted verbatim),
Trip.com (8.6 from 66, the four room types, check-in 14:00 / check-out 11:00, breakfast 07:00–09:00,
languages, amenities), Booking.com and Expedia (sun terrace, airport shuttle, free Wi‑Fi).
No prices unless the owner sets them in the dashboard. Distances and bearings are computed from coordinates, never typed.

**The idea the site is built on:** the house is on the twelfth floor, which puts it level with the
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

**Booking, the way Booking.com and Agoda do it:**
search box (dates, guests) → availability table (one row per room type, sleeps, price, what is
included, a room-count picker that offers only the rooms free for those dates, "Last room" and
"Sold out" marks, a reserve panel that checks the rooms sleep the party) → checkout in three steps
(your selection, your details, check and book) → "Complete booking" holds the rooms and shows a
booking number, with a WhatsApp message carrying it for the guest to send the house. Nothing is
charged; guests pay at the house. `/booking/` ("My booking") finds a booking by its number and the
mobile on it and cancels it up to the day before arrival. The owner sees, confirms and cancels
bookings, adds ones taken by phone or WhatsApp, and closes rooms in the dashboard's Bookings
section. The stay lives in the URL and sessionStorage (`src/lib/stay.ts`); the calls to the backend
are in `src/lib/api.ts`; the backend is `worker/` (see `worker/README.md`).
`node scripts/flowtest.mjs <dir>` runs the whole path in English and Arabic, desktop and phone,
against a local backend.

**Photos:** 37 room, bathroom and detail photos are the owner's own (WhatsApp, 2026-10-23), grouped
into five room types by floors, ceilings, headboards, windows, tiles and the door numbers 5 and 8.

**Provisional until the owner confirms:**
- The five room types, their bed counts and how many of each exist (`ROOMS` in `src/data/site.ts`).
- The WhatsApp number is the listings' phone (+20 100 536 2094).
- The pin is the Google listing's (29.97496, 31.151992).
- Rates: shown as "on request" until the owner sets a price in the dashboard.

## Where things live

| What | Where |
|---|---|
| Facts: name, pin, times | `src/data/site.ts` |
| What the owner edits: prices, room counts, phone, WhatsApp number, scores, review lines | `src/data/content.json` (see the dashboard below) |
| The three pyramids' coordinates and heights (panorama, map) | `src/data/site.ts` (`PYRAMIDS`) |
| Room types, their amenities and which photos belong to each | `src/data/site.ts` (`ROOMS`) |
| Photo catalogue: group, alt text EN/AR, captions | `src/data/photos.ts` |
| Landmarks with coordinates (distances are computed) | `src/data/places.ts` |
| All wording, per language | `src/i18n/en.json`, `src/i18n/ar.json` |
| The booking backend (Worker, D1 tables, tests) | `worker/` |
| Pages | `src/views/*.astro`, routed by `src/pages/[...path].astro` |
| Components (hero, skyline, panorama, filmstrip, reviews, map, form…) | `src/components/` |
| Design tokens | `src/styles/global.css` (`:root`) |
| Photos (masters) | `src/assets/photos/*.jpg` |

Wording uses `t('key')` from `useT(lang)`; a missing Arabic string falls back to English.

## Editing

```
npm install
npm run dev        # http://127.0.0.1:4321/
npm run build      # dist/
node scripts/og.mjs   # regenerate og-image.jpg and the icons from the mark
```

QA without a browser: `npm run build && npx astro preview --host 127.0.0.1`, then
`QA_BASE=http://127.0.0.1:4321 node scripts/qa.mjs shots / 390 out --device iphone`
(screenshots), `… qa.mjs audit / /rooms/ /giza/` (overflow, broken images, console errors) or
`… scripts/pageerrors.mjs / /ar/` (uncaught script errors with stacks).

## Deploy

Every push to `main` is built and published by `.github/workflows/publish.yml` (GitHub Pages
source: GitHub Actions). Nothing is deployed by hand. The domain
`gizapyramidsviewguesthouse.com` is the Pages custom domain; its DNS is in the guest house's
Cloudflare account (apex and `www` point at `jeeveshverma.github.io`, DNS only; `api` is the
booking Worker). The booking backend is deployed separately: `worker/README.md`.

## The owner's dashboard

`/admin/` is a page for the owner: bookings (straight from the booking backend, no Publish step),
room prices and how many rooms of each type, the phone and
WhatsApp numbers, the review scores, the guests' review lines, and replacing photos. Apart from
bookings it has no server. It commits `src/data/content.json` and the photo masters to `main` through the GitHub API,
and the Publish workflow puts the change live a minute or two later.

| What | Where |
|---|---|
| The page | `public/admin/` (`index.html`, `admin.js`, `admin.css`) |
| What it edits, and the checks on it | `src/data/content.json`, `src/data/content.ts` (`admin.js` repeats the checks) |
| The photo list and the live content it reads | `src/pages/admin/photos.json.ts`, `src/pages/admin/content.json.ts` |
| The login | `public/admin/access.json`, written by `scripts/make_login.mjs` |

The login and password are not checked anywhere: the password decrypts, in the browser, a GitHub
access key stored locked in `access.json`. That key must be a fine-grained token for this repository
only (Contents: read and write). Set or change the login with
`GP_TOKEN=github_pat_... node scripts/make_login.mjs <login> [password]`, then commit and push
`access.json`. Deleting the token on GitHub locks everyone out.

`/admin/?branch=<name>` saves to another branch instead of `main`, which publishes nothing: use it
to try the dashboard.
