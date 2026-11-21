// Runs the booking API through its paces against a local `wrangler dev` (never the live one: it
// writes bookings).   API=http://127.0.0.1:8799 OWNER_TOKEN=$(gh auth token -u jeeveshverma) node test/api.mjs
const API = process.env.API || 'http://127.0.0.1:8799';
if (!/127\.0\.0\.1|localhost/.test(API)) { console.error('Refusing to run against ' + API); process.exit(2); }
const TOKEN = process.env.OWNER_TOKEN;
let fail = 0;
const check = (ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); };
const call = async (path, { method = 'GET', body, token } = {}) => {
  const r = await fetch(API + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), Origin: 'http://127.0.0.1:4321' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, j: await r.json(), cors: r.headers.get('access-control-allow-origin') };
};
const day = (n) => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
// a window nobody else in this test database uses
const base = 200 + Math.floor(Math.random() * 200), IN = day(base), OUT = day(base + 3);
const guest = { in: IN, out: OUT, adults: 2, children: 0, first: 'Jane', last: 'Doe', phone: '+44 7700 900123', email: 'jane@example.com', arrival: '15:00–16:00', pickup: true, flight: 'MS 778', requests: 'Late check-in', lang: 'en' };

let r = await call(`/availability?in=${IN}&out=${OUT}`);
check(r.status === 200 && r.j.rooms.studio.left === 1 && r.j.nights === 3, `availability: studio has 1 left for 3 nights`);
check(r.cors === 'http://127.0.0.1:4321', 'CORS allows the local site');
r = await call(`/availability?in=2020-01-01&out=2020-01-02`); check(r.status === 400 && r.j.error === 'past', 'past dates refused');
r = await call(`/availability?in=${IN}&out=${IN}`); check(r.status === 400, 'zero nights refused');

r = await call('/bookings', { method: 'POST', body: { ...guest, rooms: {} } }); check(r.status === 400 && r.j.error === 'rooms', 'no rooms refused');
r = await call('/bookings', { method: 'POST', body: { ...guest, rooms: { studio: 1 }, phone: '12' } }); check(r.status === 400 && r.j.error === 'phone', 'bad phone refused');
r = await call('/bookings', { method: 'POST', body: { ...guest, rooms: { penthouse: 1 } } }); check(r.status === 400, 'unknown room refused');

r = await call('/bookings', { method: 'POST', body: { ...guest, rooms: { studio: 1, double: 2 } } });
check(r.status === 200 && /^GP-[A-Z2-9]{6}$/.test(r.j.ref) && r.j.status === 'pending', `booking made: ${r.j.ref}`);
const ref = r.j.ref;
r = await call(`/availability?in=${IN}&out=${OUT}`); check(r.j.rooms.studio.left === 0 && r.j.rooms.double.left === 1, 'the rooms are held at once');
r = await call(`/availability?in=${day(base + 2)}&out=${day(base + 5)}`); check(r.j.rooms.studio.left === 0, 'an overlapping stay sees the studio taken');
r = await call(`/availability?in=${OUT}&out=${day(base + 5)}`); check(r.j.rooms.studio.left === 1, 'the check-out day is free for the next guest');
r = await call('/bookings', { method: 'POST', body: { ...guest, rooms: { studio: 1 } } });
check(r.status === 409 && r.j.error === 'sold_out' && r.j.left.studio === 0, 'the same studio cannot be booked twice');

// two guests take the last two doubles... only one double is left: fire five at once, one may win
const racers = await Promise.all(Array.from({ length: 5 }, (_, i) => call('/bookings', { method: 'POST', body: { ...guest, first: 'Racer' + i, rooms: { double: 1 } } })));
const won = racers.filter((x) => x.status === 200).length;
check(won <= 1, `five guests at once for the last double: ${won} got it`);
r = await call(`/availability?in=${IN}&out=${OUT}`); check(r.j.rooms.double.left === 1 - won, 'and the count is right afterwards');

r = await call('/bookings/find', { method: 'POST', body: { ref, phone: '07700 900123' } }); check(r.status === 200 && r.j.ref === ref && r.j.canCancel, 'guest finds the booking with number + phone (written differently)');
check(r.j.phone === undefined && r.j.email === undefined, 'the lookup does not echo phone or email');
r = await call('/bookings/find', { method: 'POST', body: { ref, phone: '+44 7700 900999' } }); check(r.status === 404, 'wrong phone finds nothing');
r = await call('/bookings/find', { method: 'POST', body: { ref: ref.toLowerCase().replace('-', ' '), phone: '+447700900123' } }); check(r.status === 200, 'number typed in lower case with a space still works');

r = await call('/admin/bookings'); check(r.status === 401, 'owner list needs a sign-in');
r = await call('/admin/bookings', { token: 'x'.repeat(40) }); check(r.status === 401, 'a made-up key is refused');
if (TOKEN) {
  r = await call(`/admin/bookings?from=${IN}&to=${OUT}`, { token: TOKEN });
  check(r.status === 200 && r.j.bookings.some((b) => b.ref === ref && b.phone === guest.phone), 'owner sees the booking with the phone');
  r = await call(`/admin/bookings/${ref}`, { method: 'POST', token: TOKEN, body: { action: 'confirm', note: 'Deposit not needed' } });
  check(r.status === 200 && r.j.status === 'confirmed' && r.j.note === 'Deposit not needed', 'owner confirms and writes a note');
  r = await call(`/admin/calendar?from=${IN}&days=4`, { token: TOKEN });
  check(r.status === 200 && r.j.rooms.studio.taken.join() === '1,1,1,0', `calendar shows the studio taken three nights: ${r.j.rooms?.studio?.taken}`);
  r = await call('/admin/bookings', { method: 'POST', token: TOKEN, body: { kind: 'block', in: IN, out: OUT, rooms: { triple: 2 }, note: 'Painting' } });
  check(r.status === 200 && r.j.kind === 'block', 'owner closes both triples');
  const block = r.j.ref;
  r = await call('/bookings', { method: 'POST', body: { ...guest, rooms: { triple: 1 } } }); check(r.status === 409, 'a closed room cannot be booked');
  r = await call('/bookings/find', { method: 'POST', body: { ref: block, phone: '0000000000' } }); check(r.status === 404, 'a closure is not a guest booking');
  r = await call(`/admin/bookings/${block}`, { method: 'POST', token: TOKEN, body: { action: 'cancel' } }); check(r.j.status === 'cancelled', 'owner reopens them');
  r = await call('/admin/bookings', { method: 'POST', token: TOKEN, body: { in: IN, out: OUT, rooms: { triple: 1 }, prices: { triple: 55 }, first: 'Ahmed', last: 'Walk-in', source: 'walk-in' } });
  check(r.status === 200 && r.j.total === 165 && r.j.status === 'confirmed' && r.j.source === 'walk-in', `owner adds a walk-in at $55 a night: total ${r.j.total}`);
  r = await call(`/admin/bookings/${ref}`, { method: 'POST', token: TOKEN, body: { action: 'cancel' } }); check(r.j.status === 'cancelled' && r.j.cancelledBy === 'house', 'owner cancels');
  r = await call('/bookings', { method: 'POST', body: { ...guest, first: 'Next', rooms: { studio: 1 } } }); check(r.status === 200, 'the freed studio can be booked again');
  const next = r.j.ref;
  r = await call(`/admin/bookings/${ref}`, { method: 'POST', token: TOKEN, body: { action: 'restore' } }); check(r.status === 409, 'the cancelled one cannot be restored over it');
  r = await call('/bookings/cancel', { method: 'POST', body: { ref: next, phone: guest.phone } }); check(r.status === 200 && r.j.status === 'cancelled', 'guest cancels their own booking');
  r = await call(`/admin/bookings/${ref}`, { method: 'POST', token: TOKEN, body: { action: 'restore' } }); check(r.status === 200 && r.j.status === 'pending', 'now it can be restored');
} else console.log('SKIP owner checks (no OWNER_TOKEN)');
console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
process.exit(fail ? 1 : 0);
