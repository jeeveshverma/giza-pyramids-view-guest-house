/**
 * What the owner can change from the dashboard at /admin/: room prices and counts, the phone and
 * WhatsApp numbers, the review scores and the guests' review lines. The dashboard commits
 * content.json; the checks here are the same as the dashboard's (public/admin/admin.js), so a
 * file edited by hand and got wrong stops the build instead of reaching the site.
 */
import raw from './content.json';

export const ROOM_IDS = ['twin-view', 'studio', 'triple', 'twin', 'double'] as const;
export const SCORE_SITES = { google: 5, tripadvisor: 5, trip: 10 } as const;

export interface Content {
  updated?: string;
  rooms: { id: (typeof ROOM_IDS)[number]; price: number | null; count: number }[];
  contact: { phone: string; whatsapp: string };
  scores: Record<keyof typeof SCORE_SITES, { score: string; count: number }>;
  reviews: { name: string; text: string; when: { en: string; ar: string } }[];
}

const PHONE = /^\+\d[\d ]{7,18}\d$/;

function check(c: Content): Content {
  const bad = (msg: string): never => { throw new Error(`src/data/content.json: ${msg}`); };
  if (c.rooms.map((r) => r.id).join() !== ROOM_IDS.join()) bad(`rooms must be ${ROOM_IDS.join(', ')} in that order`);
  for (const r of c.rooms) {
    if (r.price !== null && !(Number.isInteger(r.price) && r.price >= 1 && r.price <= 9999)) bad(`${r.id}: price must be a whole number of dollars, or null`);
    if (!(Number.isInteger(r.count) && r.count >= 1 && r.count <= 9)) bad(`${r.id}: count must be 1 to 9`);
  }
  for (const k of ['phone', 'whatsapp'] as const) if (!PHONE.test(c.contact[k])) bad(`contact.${k} must look like +20 100 536 2094`);
  for (const [k, outOf] of Object.entries(SCORE_SITES)) {
    const s = c.scores[k as keyof typeof SCORE_SITES];
    if (!/^\d{1,2}(\.\d)?$/.test(s.score) || parseFloat(s.score) > outOf) bad(`scores.${k}.score must be a number up to ${outOf}`);
    if (!(Number.isInteger(s.count) && s.count >= 1 && s.count <= 999999)) bad(`scores.${k}.count must be a whole number`);
  }
  if (!c.reviews.length) bad('keep at least one review');
  c.reviews.forEach((r, i) => { if (!r.text || !r.when.en || !r.when.ar) bad(`review ${i + 1} needs its text and where it was written, in English and Arabic`); });
  return c;
}

export const CONTENT = check(raw as Content);
export const digitsOnly = (s: string) => s.replace(/\D/g, '');
