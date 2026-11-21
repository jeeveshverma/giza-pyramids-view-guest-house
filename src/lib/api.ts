/**
 * The booking backend (worker/, a Cloudflare Worker with a D1 database): live availability, making
 * a booking, and the guest finding or cancelling their own. Client-side only. `PUBLIC_API` points a
 * local build at a local Worker (see worker/README.md).
 */
import type { Stay } from './stay';

export const API: string = (import.meta.env.PUBLIC_API as string | undefined) || 'https://api.gizapyramidsviewguesthouse.com';

export interface Avail { in: string; out: string; nights: number; rooms: Record<string, { left: number; price: number | null }> }
export interface Booking {
  ref: string; status: 'pending' | 'confirmed' | 'cancelled'; in: string; out: string; nights: number; adults: number; children: number;
  rooms: { id: string; qty: number; price: number | null }[]; total: number | null;
  first: string; last: string; arrival: string; pickup: boolean; flight: string; requests: string; created: string; canCancel: boolean;
}
export interface Guest { first: string; last: string; phone: string; email: string; arrival: string; pickup: boolean; flight: string; requests: string }

/** `code` is the backend's reason ('sold_out', 'not_found', …) or 'offline' when it could not be reached. */
export class ApiError extends Error {
  constructor(public code: string, message: string, public left?: Record<string, number>) { super(message); }
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  } catch { throw new ApiError('offline', ''); }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(j.error || 'server', j.message || '', j.left);
  return j as T;
}

export const availability = (s: Pick<Stay, 'in' | 'out'>) => call<Avail>(`/availability?in=${s.in}&out=${s.out}`);
export const book = (s: Stay, g: Guest, lang: string) => call<Booking>('/bookings', { in: s.in, out: s.out, adults: s.adults, children: s.children, rooms: s.rooms, ...g, lang });
export const findBooking = (ref: string, phone: string) => call<Booking>('/bookings/find', { ref, phone });
export const cancelBooking = (ref: string, phone: string) => call<Booking>('/bookings/cancel', { ref, phone });

/** The guest's own bookings made on this device (number and phone), so "My booking" opens without typing. */
const MINE = 'gp-bookings';
export function remember(ref: string, phone: string) {
  try { const all = mine().filter((x) => x.ref !== ref); all.unshift({ ref, phone }); localStorage.setItem(MINE, JSON.stringify(all.slice(0, 5))); } catch {}
}
export function mine(): { ref: string; phone: string }[] {
  try { const v = JSON.parse(localStorage.getItem(MINE) || '[]'); return Array.isArray(v) ? v.filter((x) => x && x.ref && x.phone) : []; } catch { return []; }
}
