# Booking backend

One Cloudflare Worker (`gpv-booking`) and one D1 database (`gpv-bookings`) in the guest house's own
Cloudflare account (Pyramidsterraceinn, the account that holds `gizapyramidsviewguesthouse.com`).
The site and the owner's dashboard call it at `https://api.gizapyramidsviewguesthouse.com`.

What it does and every route: the comment at the top of `src/index.js`. The tables: `migrations/`.

- Room counts and prices are not stored here. They are read from the site's own
  `admin/content.json` (what the dashboard publishes), re-read every minute.
- A booking holds its rooms from the moment it is made (`pending`); the owner confirms or cancels
  it in the dashboard; the guest can cancel up to the day before arrival. Cancelling frees the rooms.
- The owner's requests carry the dashboard's GitHub access key. Whoever may push to the site's
  repository is the owner; the Worker keeps no password.
- One connection can make 6 website bookings an hour.

## Run and test it on this computer

```
cd worker
npx wrangler d1 migrations apply gpv-bookings --local
npx wrangler dev --local --port 8799
OWNER_TOKEN=$(gh auth token -u jeeveshverma) node test/api.mjs      # the API, 33 checks
```

The site against the local backend (the flow test makes real bookings, so never run it on the live one):

```
PUBLIC_API=http://127.0.0.1:8799 npm run build && npx astro preview --port 4321 --host 127.0.0.1
node scripts/flowtest.mjs <dir>                                     # ENGINE=webkit for Safari
```

The dashboard against it: `/admin/?api=http://127.0.0.1:8799`. To start clean (the hourly limit
counts test bookings too): `npx wrangler d1 execute gpv-bookings --local --command "DELETE FROM booking_nights; DELETE FROM booking_rooms; DELETE FROM bookings;"`

## Deploy

```
cd worker
npx wrangler d1 migrations apply gpv-bookings --remote    # only when migrations/ changed
npx wrangler deploy
```

Nothing deploys the Worker automatically; a push to `main` publishes the site only.
