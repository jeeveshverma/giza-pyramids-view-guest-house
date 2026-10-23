/**
 * The guest's stay, shared by the search box, the availability list and the checkout: dates,
 * party and the rooms picked. It lives in the URL (so a link reproduces the search) and in
 * sessionStorage (so it survives moving between pages); the URL wins. Every change is broadcast as
 * a `stay` event on window, so all three stay in sync on one page. Client-side only.
 */
export interface Stay { in: string; out: string; adults: number; children: number; rooms: Record<string, number> }

const KEY = 'gp-stay';

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s: string) => new Date(s + 'T00:00:00');
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const plusDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function defaults(): Stay {
  const t = today();
  return { in: iso(t), out: iso(plusDays(t, 1)), adults: 2, children: 0, rooms: {} };
}

/** Clamp dates to today onwards and check-out after check-in; party sizes to sane ranges. */
export function normalise(s: Stay): Stay {
  const t = today();
  let a = /^\d{4}-\d{2}-\d{2}$/.test(s.in) ? parse(s.in) : t;
  if (isNaN(+a) || a < t) a = t;
  let b = /^\d{4}-\d{2}-\d{2}$/.test(s.out) ? parse(s.out) : plusDays(a, 1);
  if (isNaN(+b) || b <= a) b = plusDays(a, 1);
  const rooms: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.rooms || {})) { const n = Math.max(0, Math.min(9, Math.round(Number(v) || 0))); if (n) rooms[k] = n; }
  return { in: iso(a), out: iso(b), adults: Math.max(1, Math.min(12, Math.round(s.adults) || 2)), children: Math.max(0, Math.min(10, Math.round(s.children) || 0)), rooms };
}

const fromQuery = (q: URLSearchParams): Partial<Stay> => {
  const p: Partial<Stay> = {};
  if (q.get('in')) p.in = q.get('in')!;
  if (q.get('out')) p.out = q.get('out')!;
  if (q.get('adults')) p.adults = Number(q.get('adults'));
  if (q.get('children')) p.children = Number(q.get('children'));
  if (q.get('r') !== null) p.rooms = Object.fromEntries((q.get('r') || '').split(',').filter(Boolean).map((x) => { const [id, n] = x.split(':'); return [id, Number(n) || 1]; }));
  return p;
};

export function toQuery(s: Stay): string {
  const q = new URLSearchParams({ in: s.in, out: s.out, adults: String(s.adults), children: String(s.children) });
  const r = Object.entries(s.rooms).filter(([, n]) => n > 0).map(([id, n]) => `${id}:${n}`).join(',');
  if (r) q.set('r', r);
  return q.toString();
}

export function readStay(): Stay {
  let saved: Partial<Stay> = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch {}
  return normalise({ ...defaults(), ...saved, ...fromQuery(new URLSearchParams(location.search)) });
}

/** Save, mirror into the URL, and tell every listener on the page. */
export function writeStay(s: Stay, from?: string): Stay {
  const n = normalise(s);
  try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch {}
  const q = new URLSearchParams(location.search);
  for (const [k, v] of new URLSearchParams(toQuery(n))) q.set(k, v);
  if (!Object.keys(n.rooms).length) q.delete('r');
  history.replaceState(history.state, '', `${location.pathname}?${q.toString()}${location.hash}`);
  window.dispatchEvent(new CustomEvent('stay', { detail: { stay: n, from } }));
  return n;
}

export const onStay = (fn: (s: Stay, from?: string) => void) => window.addEventListener('stay', (e) => { const d = (e as CustomEvent).detail; fn(d.stay, d.from); });

export const nights = (s: Stay) => Math.max(1, Math.round((+parse(s.out) - +parse(s.in)) / 864e5));
export const roomCount = (s: Stay) => Object.values(s.rooms).reduce((a, b) => a + b, 0);

/** Digits in the page language (Arabic-Indic for Arabic). */
export const dg = (lang: string) => (v: number | string) => (lang === 'ar' ? String(v).replace(/\d/g, (x) => '٠١٢٣٤٥٦٧٨٩'[Number(x)]) : String(v));

/** "Fri, Oct 23, 2026" / "الجمعة، ٢٣ أكتوبر ٢٠٢٦"; `short` drops the year. */
/** Arabic is formatted by hand: Safari (iOS) and Chrome (Android) disagree on Arabic weekday and month names. */
const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const fmtDate = (s: string, lang: string, short = false) => {
  const d = parse(s);
  if (lang === 'ar') { const n = dg('ar'); return `${AR_DAYS[d.getDay()]}، ${n(d.getDate())} ${AR_MONTHS[d.getMonth()]}${short ? '' : ` ${n(d.getFullYear())}`}`; }
  return d.toLocaleDateString('en-US', short ? { weekday: 'short', month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

/** Pick the right plural form from a dictionary entry like "1 night|{n} nights" (Arabic adds a dual: "ليلة واحدة|ليلتان|{n} ليالٍ"). */
export function plural(forms: string, n: number, lang: string): string {
  const f = forms.split('|');
  const d = dg(lang);
  if (lang === 'ar' && f.length === 3) return n === 1 ? f[0] : n === 2 ? f[1] : f[2].replace('{n}', d(n));
  return (n === 1 ? f[0] : f[f.length - 1]).replace('{n}', d(n));
}
