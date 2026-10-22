/**
 * Lines from guests' Tripadvisor reviews of the guest house, quoted verbatim (titles and
 * opening lines), collected 2026-10-23. The scores themselves live in SITE.scores
 * (src/data/site.ts).
 */
export interface Review { name?: string; lang: 'en' | 'ar'; text: string; translated?: boolean; local?: boolean; when: { en: string; ar: string } }

export const REVIEWS: Review[] = [
  { name: 'Andrea v', lang: 'en', when: { en: 'Tripadvisor, October 2022', ar: 'Tripadvisor، أكتوبر ٢٠٢٢' }, text: 'The view of the pyramids from this guest house is so beautiful, that it\'s powerful' },
  { name: 'shimron R', lang: 'en', when: { en: 'Tripadvisor, January 2025', ar: 'Tripadvisor، يناير ٢٠٢٥' }, text: 'The room was comfortable and offered a stunning view of the pyramids from the balcony.' },
  { name: 'Luca Di Lisio', lang: 'en', when: { en: 'Tripadvisor, August 2025', ar: 'Tripadvisor، أغسطس ٢٠٢٥' }, text: 'The real highlight is the breathtaking view of the pyramids from the room and the communal terrace.' },
  { name: 'Cc', lang: 'en', when: { en: 'Tripadvisor, May 2023', ar: 'Tripadvisor، مايو ٢٠٢٣' }, text: 'A very authentic Egyptian guest house with lovely people.' },
  { name: 'Richard S', lang: 'en', when: { en: 'Tripadvisor, October 2022', ar: 'Tripadvisor، أكتوبر ٢٠٢٢' }, text: 'Clean, tidy and extremely comfortable beds.' },
  { name: 'Stella F', lang: 'en', when: { en: 'Tripadvisor, September 2023', ar: 'Tripadvisor، سبتمبر ٢٠٢٣' }, text: 'The staff was so lovely & welcoming.' },
  { name: 'Joshua S', lang: 'en', when: { en: 'Tripadvisor, December 2022', ar: 'Tripadvisor، ديسمبر ٢٠٢٢' }, text: 'Amazing guest house, the staff are extremely friendly and helpful!' },
  { name: 'Maurizio3030', lang: 'en', when: { en: 'Tripadvisor, September 2020', ar: 'Tripadvisor، سبتمبر ٢٠٢٠' }, text: 'Each room has its own bathroom and they have a variety of room sizes.' },
];
