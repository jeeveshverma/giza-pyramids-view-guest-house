/**
 * Lines from guests' reviews of the guest house, quoted verbatim. They are kept in content.json
 * and edited from the dashboard; a line written in Arabic is shown as Arabic. The scores live in
 * SITE.scores (src/data/site.ts).
 */
import { CONTENT } from './content';

export interface Review { name?: string; lang: 'en' | 'ar'; text: string; translated?: boolean; local?: boolean; when: { en: string; ar: string } }

export const REVIEWS: Review[] = CONTENT.reviews.map((r) => ({ ...r, name: r.name || undefined, lang: /[\u0600-\u06FF]/.test(r.text) ? 'ar' : 'en' }));
