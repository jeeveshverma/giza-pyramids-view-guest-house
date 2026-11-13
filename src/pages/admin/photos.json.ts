import type { APIRoute } from 'astro';
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { PHOTOS } from '../../data/photos';
import { ROOMS } from '../../data/site';
import en from '../../i18n/en.json';

/**
 * The photos the dashboard can replace: each master in src/assets/photos/ with its size (a new
 * photo is cut to the same size, so no layout changes), a small preview and where it is used.
 */
const all = import.meta.glob<{ default: ImageMetadata }>('../../assets/photos/*.jpg', { eager: true });
const OTHER = { view: 'The view', terrace: 'Roof terrace', house: 'The house', room: 'Rooms', bathroom: 'Rooms' } as const;

export const GET: APIRoute = async () => {
  const out = [];
  for (const p of PHOTOS) {
    const src = all[`../../assets/photos/${p.id}.jpg`]?.default;
    if (!src) throw new Error(`No photo file for id ${p.id}`);
    const room = ROOMS.find((r) => r.photos.includes(p.id));
    const thumb = await getImage({ src, width: Math.min(480, src.width), format: 'webp', quality: 60 });
    out.push({
      id: p.id, w: src.width, h: src.height, thumb: thumb.src, alt: p.alt.en,
      group: room ? (en.rooms as Record<string, { name: string }>)[room.id].name : OTHER[p.group],
      label: (p.caption ?? p.alt).en + (room && room.hero === p.id ? ' (shown first)' : ''),
    });
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
