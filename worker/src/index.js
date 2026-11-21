/**
 * Giza Pyramids View Guest House — the booking backend (Cloudflare Worker + D1).
 *
 * For guests:      GET  /availability?in=&out=      rooms left and the price a night, per room type
 *                  POST /bookings                    make a booking (held at once, status "pending")
 *                  POST /bookings/find               look one up with its number and the phone on it
 *                  POST /bookings/cancel             cancel it, up to the day before arrival
 * For the owner:   GET  /admin/bookings?from=&to=    every booking that touches those dates
 *                  GET  /admin/calendar?from=&days=  rooms taken per night per room type
 *                  POST /admin/bookings              add a booking taken elsewhere, or close rooms
 *                  POST /admin/bookings/:ref         confirm, cancel, restore, or write a note
 *
 * Room counts and prices are the site's own (content.json, edited from the dashboard), so there is
 * one place to change them. A booking holds its rooms from the moment it is made; two guests can
 * never hold the same last room. Nothing is charged: guests pay at the house.
 *
 * The owner's requests carry the dashboard's GitHub access key: whoever may push to the site's
 * repository is the owner. No password is kept here.
 */

const ROOM_IDS = ['twin-view', 'studio', 'triple', 'twin', 'double'];
const SOURCES = ['website', 'whatsapp', 'phone', 'walk-in', 'booking.com', 'other'];
const MAX_NIGHTS = 30;
const MAX_AHEAD_DAYS = 540;
const PER_HOUR = 6; // website bookings from one address

class Fail extends Error {
  constructor(status, code, message, extra) { super(message); this.status = status; this.code = code; this.extra = extra; }
}
const bad = (code, message, extra) => new Fail(400, code, message, extra);

/* ------------------------------------------------------------------ dates (the house's clock is Cairo's) */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const cairoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const validDate = (s) => typeof s === 'string' && ISO.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')) && addDays(s, 0) === s;
const nightsOf = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
const eachNight = (a, b) => Array.from({ length: nightsOf(a, b) }, (_, i) => addDays(a, i));

function checkDates(cin, cout, { past = false } = {}) {
  if (!validDate(cin) || !validDate(cout)) throw bad('dates', 'Check-in and check-out must be dates like 2026-12-24.');
  const n = nightsOf(cin, cout), today = cairoToday();
  if (n < 1) throw bad('dates', 'Check-out must be after check-in.');
  if (n > MAX_NIGHTS) throw bad('too_long', `A booking can be up to ${MAX_NIGHTS} nights. For a longer stay, write to the house.`);
  if (!past && cin < today) throw bad('past', 'Check-in is in the past.');
  if (cin > addDays(today, MAX_AHEAD_DAYS)) throw bad('too_far', 'That date is too far ahead to book online.');
  return n;
}

/* ------------------------------------------------------------------ small helpers */
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);
const digitsOf = (s) => String(s ?? '').replace(/\D/g, '');
const samePhone = (a, b) => { const x = digitsOf(a), y = digitsOf(b); return x.length >= 7 && y.length >= 7 && x.slice(-7) === y.slice(-7); };
const whole = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
/** GP-7K4M2Q: letters and digits that cannot be mistaken for each other when read out on the phone. */
function newRef() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'GP-' + [...crypto.getRandomValues(new Uint8Array(6))].map((b) => A[b % A.length]).join('');
}
const normRef = (s) => clean(s, 20).toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^GP/, 'GP-');

/* ------------------------------------------------------------------ the house's rooms (from the site) */
const metaGet = async (db, k) => db.prepare('SELECT v, at FROM meta WHERE k = ?').bind(k).first();
const metaSet = (db, k, v) => db.prepare('INSERT INTO meta (k, v, at) VALUES (?1, ?2, ?3) ON CONFLICT (k) DO UPDATE SET v = ?2, at = ?3').bind(k, v, Date.now()).run();

/** { 'twin-view': { count, price }, … }. Re-read from the site every minute; the last good copy is kept. */
async function inventory(env) {
  const cached = await metaGet(env.DB, 'inventory');
  if (cached && Date.now() - cached.at < 60_000) return JSON.parse(cached.v);
  try {
    const res = await fetch(env.CONTENT_URL, { cf: { cacheTtl: 30 } });
    if (!res.ok) throw new Error('the site answered ' + res.status);
    const c = await res.json();
    const inv = {};
    for (const id of ROOM_IDS) {
      const r = (c.rooms || []).find((x) => x.id === id);
      if (!r || !whole(r.count, 0, 99)) throw new Error('no room count for ' + id);
      inv[id] = { count: r.count, price: whole(r.price, 1, 9999) ? r.price : null };
    }
    await metaSet(env.DB, 'inventory', JSON.stringify(inv));
    return inv;
  } catch (e) {
    if (cached) return JSON.parse(cached.v);
    console.error('inventory:', e.message);
    throw new Fail(503, 'inventory', 'The room list could not be loaded just now. Please try again in a minute.');
  }
}

/** Rooms taken per room type per night between two dates: { room: { night: n } }. */
async function taken(db, cin, cout, { upToId = null, notId = null } = {}) {
  let sql = 'SELECT room_id, night, SUM(qty) AS n FROM booking_nights WHERE night >= ?1 AND night < ?2';
  const args = [cin, cout];
  if (upToId != null) { sql += ` AND booking_id <= ?${args.push(upToId)}`; }
  if (notId != null) { sql += ` AND booking_id != ?${args.push(notId)}`; }
  const { results } = await db.prepare(sql + ' GROUP BY room_id, night').bind(...args).all();
  const out = {};
  for (const r of results) (out[r.room_id] ||= {})[r.night] = r.n;
  return out;
}
/** Rooms of each type free on every night of the stay. */
function leftOver(inv, used, cin, cout) {
  const nights = eachNight(cin, cout), left = {};
  for (const id of ROOM_IDS) {
    const busiest = Math.max(0, ...nights.map((n) => used[id]?.[n] || 0));
    left[id] = Math.max(0, inv[id].count - busiest);
  }
  return left;
}

/* ------------------------------------------------------------------ reading bookings */
async function roomsOf(db, ids) {
  if (!ids.length) return {};
  const { results } = await db.prepare(`SELECT booking_id, room_id, qty, price_usd FROM booking_rooms WHERE booking_id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
  const by = {};
  for (const r of results) (by[r.booking_id] ||= []).push({ id: r.room_id, qty: r.qty, price: r.price_usd });
  for (const k in by) by[k].sort((a, b) => ROOM_IDS.indexOf(a.id) - ROOM_IDS.indexOf(b.id));
  return by;
}
/** What the guest may see of their own booking. */
const forGuest = (b, rooms) => ({
  ref: b.ref, status: b.status, in: b.check_in, out: b.check_out, nights: nightsOf(b.check_in, b.check_out),
  adults: b.adults, children: b.children, rooms, total: b.total_usd,
  first: b.first_name, last: b.last_name, arrival: b.arrival, pickup: !!b.pickup, flight: b.flight, requests: b.requests,
  created: b.created_at, canCancel: b.status !== 'cancelled' && b.check_in > cairoToday(),
});
/** Everything, for the owner. */
const forOwner = (b, rooms) => ({
  ...forGuest(b, rooms), kind: b.kind, source: b.source, phone: b.phone, email: b.email, lang: b.lang,
  note: b.note, cancelledBy: b.cancelled_by, updated: b.updated_at,
});

/* ------------------------------------------------------------------ writing bookings */
function readRooms(input, inv) {
  const rooms = [];
  for (const id of ROOM_IDS) {
    const q = Number(input?.[id] ?? 0);
    if (!q) continue;
    if (!whole(q, 1, 9)) throw bad('rooms', 'The number of rooms is not right.');
    rooms.push({ id, qty: q, price: inv[id].price });
  }
  for (const k of Object.keys(input || {})) if (!ROOM_IDS.includes(k)) throw bad('rooms', 'Unknown room type: ' + clean(k, 30));
  if (!rooms.length) throw bad('rooms', 'Choose at least one room.');
  return rooms;
}
const totalOf = (rooms, nights) => (rooms.every((r) => r.price != null) ? rooms.reduce((a, r) => a + r.price * r.qty * nights, 0) : null);

/**
 * Insert the booking with the rooms it holds, then make sure no night is oversold. When two guests
 * take the last room at the same moment the later row loses and is removed again.
 */
async function createBooking(env, b, rooms) {
  const db = env.DB, inv = await inventory(env), now = new Date().toISOString();
  const nights = eachNight(b.check_in, b.check_out);
  // refuse early when it plainly does not fit, so the common case never writes
  const before = leftOver(inv, await taken(db, b.check_in, b.check_out), b.check_in, b.check_out);
  const short = rooms.filter((r) => r.qty > before[r.id]);
  if (short.length) throw new Fail(409, 'sold_out', 'Some of these rooms were just taken for your dates.', { left: before });

  let ref, row;
  for (let i = 0; ; i++) {
    ref = newRef();
    try {
      row = await db.prepare(
        `INSERT INTO bookings (ref, kind, status, source, check_in, check_out, adults, children, first_name, last_name, phone, phone_digits,
           email, arrival, pickup, flight, requests, lang, total_usd, note, ip_hash, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?22) RETURNING id`,
      ).bind(ref, b.kind, b.status, b.source, b.check_in, b.check_out, b.adults, b.children, b.first_name, b.last_name, b.phone, digitsOf(b.phone),
        b.email, b.arrival, b.pickup ? 1 : 0, b.flight, b.requests, b.lang, totalOf(rooms, nights.length), b.note || '', b.ip_hash || '', now).first();
      break;
    } catch (e) {
      if (i < 4 && /UNIQUE/i.test(String(e.message))) continue; // the number is taken: draw another
      throw e;
    }
  }
  const id = row.id;
  const stmts = [];
  for (const r of rooms) {
    stmts.push(db.prepare('INSERT INTO booking_rooms (booking_id, room_id, qty, price_usd) VALUES (?, ?, ?, ?)').bind(id, r.id, r.qty, r.price));
    for (const n of nights) stmts.push(db.prepare('INSERT INTO booking_nights (booking_id, room_id, night, qty) VALUES (?, ?, ?, ?)').bind(id, r.id, n, r.qty));
  }
  await db.batch(stmts);

  // the check that counts: with this booking and every earlier one in, is any night oversold?
  const used = await taken(db, b.check_in, b.check_out, { upToId: id });
  const over = rooms.some((r) => nights.some((n) => (used[r.id]?.[n] || 0) > inv[r.id].count));
  if (over) {
    await db.batch([
      db.prepare('DELETE FROM booking_nights WHERE booking_id = ?').bind(id),
      db.prepare('DELETE FROM booking_rooms WHERE booking_id = ?').bind(id),
      db.prepare('DELETE FROM bookings WHERE id = ?').bind(id),
    ]);
    const left = leftOver(inv, await taken(db, b.check_in, b.check_out), b.check_in, b.check_out);
    throw new Fail(409, 'sold_out', 'Some of these rooms were just taken for your dates.', { left });
  }
  return db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
}

async function findBooking(db, ref) {
  const b = await db.prepare('SELECT * FROM bookings WHERE ref = ?').bind(normRef(ref)).first();
  if (!b) throw new Fail(404, 'not_found', 'No booking has that number.');
  return b;
}
async function cancelBooking(db, b, by) {
  if (b.status === 'cancelled') return b;
  const now = new Date().toISOString();
  await db.batch([
    db.prepare('DELETE FROM booking_nights WHERE booking_id = ?').bind(b.id),
    db.prepare("UPDATE bookings SET status = 'cancelled', cancelled_by = ?, updated_at = ? WHERE id = ?").bind(by, now, b.id),
  ]);
  return { ...b, status: 'cancelled', cancelled_by: by, updated_at: now };
}
/** Put a cancelled booking back, if its rooms are still free. */
async function restoreBooking(env, b) {
  const db = env.DB, inv = await inventory(env);
  const rooms = (await roomsOf(db, [b.id]))[b.id] || [];
  const left = leftOver(inv, await taken(db, b.check_in, b.check_out), b.check_in, b.check_out);
  if (rooms.some((r) => r.qty > left[r.id])) throw new Fail(409, 'sold_out', 'Those rooms have been taken by another booking since this one was cancelled.', { left });
  const now = new Date().toISOString();
  const stmts = [db.prepare("UPDATE bookings SET status = 'pending', cancelled_by = '', updated_at = ? WHERE id = ?").bind(now, b.id)];
  for (const r of rooms) for (const n of eachNight(b.check_in, b.check_out)) stmts.push(db.prepare('INSERT OR REPLACE INTO booking_nights (booking_id, room_id, night, qty) VALUES (?, ?, ?, ?)').bind(b.id, r.id, n, r.qty));
  await db.batch(stmts);
  return { ...b, status: 'pending', cancelled_by: '', updated_at: now };
}

/* ------------------------------------------------------------------ the owner's sign-in */
async function requireOwner(req, env) {
  const m = /^Bearer\s+(\S{20,300})$/.exec(req.headers.get('Authorization') || '');
  if (!m) throw new Fail(401, 'signin', 'Please sign in to the dashboard again.');
  const key = 'owner:' + (await sha256(m[1]));
  const seen = await metaGet(env.DB, key);
  if (seen && Date.now() - seen.at < 15 * 60_000) return;
  const res = await fetch('https://api.github.com/repos/' + env.REPO, {
    headers: { Authorization: 'Bearer ' + m[1], Accept: 'application/vnd.github+json', 'User-Agent': 'gpv-booking', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  if (res.status === 401) throw new Fail(401, 'signin', 'The access key behind this login has expired. Please tell Jeevesh.');
  if (!res.ok) throw new Fail(503, 'signin_check', 'The sign-in could not be checked just now. Try again in a minute.');
  const repo = await res.json();
  if (!repo.permissions || repo.permissions.push !== true) throw new Fail(403, 'not_owner', 'This login may not manage bookings.');
  await metaSet(env.DB, key, '1');
  // forget sign-ins checked more than a day ago
  await env.DB.prepare("DELETE FROM meta WHERE k LIKE 'owner:%' AND at < ?").bind(Date.now() - 864e5).run();
}

/* ------------------------------------------------------------------ handlers */
async function getAvailability(url, env) {
  const cin = url.searchParams.get('in'), cout = url.searchParams.get('out');
  const nights = checkDates(cin, cout);
  const inv = await inventory(env);
  const left = leftOver(inv, await taken(env.DB, cin, cout), cin, cout);
  return { in: cin, out: cout, nights, rooms: Object.fromEntries(ROOM_IDS.map((id) => [id, { left: left[id], price: inv[id].price }])) };
}

async function postBooking(req, env) {
  const j = await body(req);
  checkDates(j.in, j.out);
  const inv = await inventory(env);
  const rooms = readRooms(j.rooms, inv);
  const adults = Number(j.adults), children = Number(j.children ?? 0);
  if (!whole(adults, 1, 12) || !whole(children, 0, 10)) throw bad('party', 'The number of guests is not right.');
  const first = clean(j.first, 60), last = clean(j.last, 60), phone = clean(j.phone, 30), email = clean(j.email, 120);
  if (!first || !last) throw bad('name', 'Please enter your first and last name.');
  if (!/^\+?[\d\s\-().]{7,}$/.test(phone) || digitsOf(phone).length < 7) throw bad('phone', 'Please enter a mobile number with the country code.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw bad('email', "That email address doesn't look right.");

  const ip = await sha256('gpv|' + (req.headers.get('CF-Connecting-IP') || ''));
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM bookings WHERE ip_hash = ? AND created_at > ? AND source = 'website'").bind(ip, new Date(Date.now() - 36e5).toISOString()).first();
  if (recent.n >= PER_HOUR) throw new Fail(429, 'slow_down', 'Too many bookings from this connection in the last hour. Please write to the house on WhatsApp.');

  const b = await createBooking(env, {
    kind: 'guest', status: 'pending', source: 'website', check_in: j.in, check_out: j.out, adults, children,
    first_name: first, last_name: last, phone, email, arrival: clean(j.arrival, 30), pickup: !!j.pickup, flight: clean(j.flight, 60),
    requests: String(j.requests ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, 1000), lang: j.lang === 'ar' ? 'ar' : 'en', ip_hash: ip,
  }, rooms);
  return forGuest(b, rooms);
}

async function guestFind(req, env) {
  const j = await body(req);
  const b = await env.DB.prepare("SELECT * FROM bookings WHERE ref = ? AND kind = 'guest'").bind(normRef(j.ref)).first();
  // the same answer whether the number or the phone is wrong, so a number cannot be guessed at
  if (!b || !samePhone(b.phone, j.phone)) throw new Fail(404, 'not_found', 'No booking matches that number and phone. Check both and try again.');
  return b;
}

async function adminList(url, env) {
  const today = cairoToday();
  const from = url.searchParams.get('from') || today, to = url.searchParams.get('to') || addDays(from, 60);
  if (!validDate(from) || !validDate(to)) throw bad('dates', 'from and to must be dates.');
  const { results } = await env.DB.prepare(
    `SELECT * FROM bookings WHERE (check_out > ?1 AND check_in <= ?2) OR (status = 'pending' AND check_out > ?3) ORDER BY check_in, id LIMIT 500`,
  ).bind(from, to, today).all();
  const rooms = await roomsOf(env.DB, results.map((b) => b.id));
  return { from, to, today, bookings: results.map((b) => forOwner(b, rooms[b.id] || [])) };
}

async function adminCalendar(url, env) {
  const from = url.searchParams.get('from') || cairoToday();
  const days = Math.max(1, Math.min(62, Number(url.searchParams.get('days')) || 14));
  if (!validDate(from)) throw bad('dates', 'from must be a date.');
  const to = addDays(from, days), inv = await inventory(env);
  const used = await taken(env.DB, from, to);
  return { from, days, today: cairoToday(), rooms: Object.fromEntries(ROOM_IDS.map((id) => [id, { count: inv[id].count, price: inv[id].price, taken: eachNight(from, to).map((n) => used[id]?.[n] || 0) }])) };
}

async function adminCreate(req, env) {
  const j = await body(req);
  const block = j.kind === 'block';
  checkDates(j.in, j.out, { past: true });
  const inv = await inventory(env);
  const rooms = readRooms(j.rooms, inv);
  if (j.prices && typeof j.prices === 'object') for (const r of rooms) { const p = j.prices[r.id]; if (p === null || p === '') r.price = null; else if (p !== undefined) { if (!whole(Number(p), 1, 9999)) throw bad('price', 'A price must be a whole number of dollars.'); r.price = Number(p); } }
  const first = clean(j.first, 60), last = clean(j.last, 60);
  if (!block && !first && !last) throw bad('name', "Write the guest's name.");
  const source = SOURCES.includes(j.source) ? j.source : 'other';
  let b;
  try {
    b = await createBooking(env, {
    kind: block ? 'block' : 'guest', status: 'confirmed', source: block ? 'other' : source, check_in: j.in, check_out: j.out,
    adults: whole(Number(j.adults), 1, 40) ? Number(j.adults) : 2, children: whole(Number(j.children), 0, 20) ? Number(j.children) : 0,
    first_name: first, last_name: last, phone: clean(j.phone, 30), email: clean(j.email, 120), arrival: clean(j.arrival, 30), pickup: !!j.pickup,
    flight: clean(j.flight, 60), requests: clean(j.requests, 1000), lang: 'en', note: clean(j.note, 500),
  }, rooms.map((r) => (block ? { ...r, price: null } : r)));
  } catch (e) {
    if (e instanceof Fail && e.code === 'sold_out') throw new Fail(409, 'sold_out', 'Not enough of those rooms are free on those nights. Look at the calendar, and cancel or move a booking first.', e.extra);
    throw e;
  }
  return forOwner(b, (await roomsOf(env.DB, [b.id]))[b.id]);
}

async function adminAct(req, env, ref) {
  const j = await body(req);
  let b = await findBooking(env.DB, ref);
  const now = new Date().toISOString();
  if (j.action === 'confirm') {
    if (b.status === 'cancelled') throw new Fail(409, 'cancelled', 'This booking is cancelled. Restore it first.');
    await env.DB.prepare("UPDATE bookings SET status = 'confirmed', updated_at = ? WHERE id = ?").bind(now, b.id).run();
    b = { ...b, status: 'confirmed', updated_at: now };
  } else if (j.action === 'cancel') b = await cancelBooking(env.DB, b, 'house');
  else if (j.action === 'restore') { if (b.status === 'cancelled') b = await restoreBooking(env, b); }
  else if (j.action !== 'note') throw bad('action', 'Unknown action.');
  if (typeof j.note === 'string') {
    const note = clean(j.note, 500);
    await env.DB.prepare('UPDATE bookings SET note = ?, updated_at = ? WHERE id = ?').bind(note, now, b.id).run();
    b = { ...b, note };
  }
  return forOwner(b, (await roomsOf(env.DB, [b.id]))[b.id] || []);
}

/* ------------------------------------------------------------------ plumbing */
async function body(req) {
  const text = await req.text();
  if (text.length > 20_000) throw new Fail(413, 'too_big', 'That is too much text.');
  try { const j = JSON.parse(text); if (j && typeof j === 'object' && !Array.isArray(j)) return j; } catch {}
  throw bad('json', 'The request could not be read.');
}
function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const ok = (env.ORIGINS || '').split(',').includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    ...(ok ? { 'Access-Control-Allow-Origin': origin } : {}), Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400',
  };
}

async function route(req, env) {
  const url = new URL(req.url);
  const p = url.pathname.replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  const is = (method, path) => req.method === method && p === path;
  if (is('GET', '/')) return { ok: true, service: 'Giza Pyramids View Guest House bookings' };
  if (is('GET', '/availability')) return getAvailability(url, env);
  if (is('POST', '/bookings')) return postBooking(req, env);
  if (is('POST', '/bookings/find')) { const b = await guestFind(req.clone(), env); return forGuest(b, (await roomsOf(env.DB, [b.id]))[b.id] || []); }
  if (is('POST', '/bookings/cancel')) {
    let b = await guestFind(req, env);
    if (b.status !== 'cancelled' && b.check_in <= cairoToday()) throw new Fail(409, 'too_late', 'It is too late to cancel online. Please write to the house on WhatsApp.');
    b = await cancelBooking(env.DB, b, 'guest');
    return forGuest(b, (await roomsOf(env.DB, [b.id]))[b.id] || []);
  }
  if (p.startsWith('/admin/')) {
    await requireOwner(req, env);
    if (is('GET', '/admin/bookings')) return adminList(url, env);
    if (is('GET', '/admin/calendar')) return adminCalendar(url, env);
    if (is('POST', '/admin/bookings')) return adminCreate(req, env);
    const m = /^\/admin\/bookings\/([A-Za-z0-9-]{4,20})$/.exec(p);
    if (m && req.method === 'POST') return adminAct(req, env, m[1]);
  }
  throw new Fail(404, 'no_route', 'Not found.');
}

export default {
  async fetch(req, env) {
    const headers = { ...cors(req, env), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    try {
      return new Response(JSON.stringify(await route(req, env)), { headers });
    } catch (e) {
      if (e instanceof Fail) return new Response(JSON.stringify({ error: e.code, message: e.message, ...(e.extra || {}) }), { status: e.status, headers });
      console.error(e.stack || e);
      return new Response(JSON.stringify({ error: 'server', message: 'Something went wrong on our side. Please try again, or write to the house on WhatsApp.' }), { status: 500, headers });
    }
  },
};
