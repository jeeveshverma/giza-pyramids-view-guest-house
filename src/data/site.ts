/**
 * Every public fact about Giza Pyramids View Guest House, in one place. Only what the property
 * already publishes on its listings (Google Maps, Tripadvisor, Trip.com, Booking.com, Expedia)
 * goes here. What the owner changes from the dashboard comes in from content.json.
 */
import { CONTENT, digitsOnly } from './content';

const count = Object.fromEntries(CONTENT.rooms.map((r) => [r.id, r]));

export const SITE = {
  url: 'https://gizapyramidsviewguesthouse.com',
  name: { en: 'Giza Pyramids View Guest House', ar: 'بيت ضيافة إطلالة أهرامات الجيزة' },
  shortName: { en: 'Pyramids View Guest House', ar: 'إطلالة الأهرامات' },
  city: { en: 'Giza', ar: 'الجيزة' },
  region: { en: 'Giza Governorate', ar: 'محافظة الجيزة' },
  country: { en: 'Egypt', ar: 'مصر' },
  /** The listings' address: building 4 on Abd Al Aziz Al Basel Street, off Mohamed Afify Street, Al Haram; the guest house takes the 11th floor. */
  street: { en: '4 Abd Al Aziz Al Basel St, 11th floor, Al Haram', ar: '٤ شارع عبد العزيز الباسل، الدور ١١، الهرم' },
  floor: 11,
  postal: '12511',
  /** The pin on the Google listing (via Wanderlog's map centre). */
  geo: { lat: 29.97496, lng: 31.151992 },
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Giza+Pyramids+View+Guest+House+Abd+Al+Aziz+Al+Basel+Al+Haram+Giza',
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=29.97496,31.151992',
  /** The phone on every listing (+20 100 536 2094) and the WhatsApp number; both set from the dashboard (content.json). */
  whatsapp: digitsOnly(CONTENT.contact.whatsapp),
  whatsappDisplay: CONTENT.contact.whatsapp,
  phone: '+' + digitsOnly(CONTENT.contact.phone),
  phoneDisplay: CONTENT.contact.phone,
  googleReviewsUrl: 'https://www.google.com/maps/search/?api=1&query=Giza+Pyramids+View+Guest+House+Abd+Al+Aziz+Al+Basel+Al+Haram+Giza',
  tripadvisorUrl: 'https://www.tripadvisor.com/Hotel_Review-g294202-d20814271-Reviews-Giza_Pyramids_View_Guest_House-Giza_Giza_Governorate.html',
  tripUrl: 'https://www.trip.com/hotels/al-haraneyah-hotel-detail-45697800/giza-pyramids-view-guest-house/',
  bookingUrl: 'https://www.booking.com/hotel/eg/giza-pyramids-view-hostel.en-gb.html',
  /** Guest scores, set from the dashboard (content.json). */
  scores: {
    google: { ...CONTENT.scores.google, outOf: '5' },
    tripadvisor: { ...CONTENT.scores.tripadvisor, outOf: '5' },
    trip: { ...CONTENT.scores.trip, outOf: '10' },
  },
  /** Published on the listings. */
  checkIn: '14:00',
  checkOut: '11:00',
  breakfast: { from: '07:00', to: '09:00' },
  languages: { en: 'English, Arabic, French, German, Dutch, Portuguese, Russian', ar: 'العربية والإنجليزية والفرنسية والألمانية والهولندية والبرتغالية والروسية' },
} as const;

/**
 * The three pyramids as seen from the balcony: apex coordinates and present heights, so the
 * panorama diagram and the map draw them at their true bearings and apparent sizes.
 */
export const PYRAMIDS = [
  { id: 'khufu', name: { en: 'Khufu', ar: 'خوفو' }, sub: { en: 'The Great Pyramid, 138 m', ar: 'الهرم الأكبر، ١٣٨ م' }, at: { lat: 29.97916, lng: 31.13424 }, height: 138.5 },
  { id: 'khafre', name: { en: 'Khafre', ar: 'خفرع' }, sub: { en: 'Still wearing its casing at the top, 136 m', ar: 'ما زال يحتفظ بكسوته عند القمة، ١٣٦ م' }, at: { lat: 29.97602, lng: 31.13079 }, height: 136.4 },
  { id: 'menkaure', name: { en: 'Menkaure', ar: 'منكاورع' }, sub: { en: 'The smallest of the three, 65 m', ar: 'أصغر الثلاثة، ٦٥ م' }, at: { lat: 29.97238, lng: 31.12822 }, height: 65 },
] as const;

export type RoomId = 'twin-view' | 'studio' | 'triple' | 'twin' | 'double';

/** What a room has, drawn from the owner's photos (2026-10-23) plus what every listing states. */
export type Feature = 'pyramids' | 'cityView' | 'kitchenette' | 'kettle' | 'minibar' | 'fridge' | 'table' | 'armchair' | 'wardrobe' | 'dresser' | 'shower' | 'ac' | 'wifi' | 'towels';

export interface Room {
  id: RoomId;
  hero: string;
  photos: string[];
  /** beds in the room, by kind */
  beds: { double?: number; queen?: number; single?: number };
  /** how many guests the beds sleep */
  sleeps: number;
  features: Feature[];
  /** the most a guest can pick in the availability list; the house has 12 rooms in all (Trip.com) */
  max: number;
  /** US dollars a night, or null to show "On request" */
  price: number | null;
}

/**
 * The five room types, grouped from the owner's 37 room photos by matching floors, ceilings,
 * headboards, windows, bathroom tiles and the door numbers (5 and 8). Bed counts follow the photos
 * and the Trip.com room names. How many of each type there are (`max`) and the price come from the
 * dashboard (content.json). Everything here is provisional until the owner confirms it.
 */
export const ROOMS: Room[] = ([
  { id: 'twin-view', hero: 'tv-room5', photos: ['tv-room5', 'tv-window', 'tv-sunset', 'tv-beds', 'tv-wide', 'tv-kettle', 'tv-table', 'tv-mirror'], beds: { double: 2 }, sleeps: 4, features: ['pyramids', 'minibar', 'kettle', 'table', 'dresser', 'ac', 'wifi', 'towels'] },
  { id: 'studio', hero: 'studio-bed', photos: ['studio-bed', 'studio-kitchenette', 'studio-table', 'studio-armchair', 'studio-shower'], beds: { queen: 1 }, sleeps: 2, features: ['kitchenette', 'armchair', 'table', 'wardrobe', 'shower', 'ac', 'wifi', 'towels'] },
  { id: 'triple', hero: 'tr-beds', photos: ['tr-beds', 'tr-light', 'tr-golden'], beds: { double: 1, single: 1 }, sleeps: 3, features: ['cityView', 'wardrobe', 'ac', 'wifi', 'towels'] },
  { id: 'twin', hero: 'tw-beds', photos: ['tw-beds', 'tw-swan', 'tw-fridge', 'tw-mirror', 'tw-shower'], beds: { single: 2 }, sleeps: 2, features: ['fridge', 'wardrobe', 'dresser', 'shower', 'ac', 'wifi', 'towels'] },
  { id: 'double', hero: 'db-room8', photos: ['db-room8', 'db-bed', 'db-window', 'db-side', 'db-ensuite', 'db-warm', 'db-swans', 'db-door', 'db-dresser', 'db-mirror', 'kettle-tray'], beds: { double: 1 }, sleeps: 2, features: ['cityView', 'kettle', 'dresser', 'ac', 'wifi', 'towels'] },
] as Omit<Room, 'max' | 'price'>[]).map((r) => ({ ...r, max: count[r.id].count, price: count[r.id].price }));
