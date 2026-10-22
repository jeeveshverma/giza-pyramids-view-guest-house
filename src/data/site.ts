/**
 * Every public fact about Giza Pyramids View Guest House, in one place. Only what the property
 * already publishes on its listings (Google Maps, Tripadvisor, Trip.com, Booking.com, Expedia)
 * goes here — no prices.
 */
export const SITE = {
  url: 'https://jeeveshverma.github.io/giza-pyramids-view-guest-house',
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
  /** The phone on every listing (+20 100 536 2094); an Egyptian mobile, so used for WhatsApp too until the owner says otherwise. */
  whatsapp: '201005362094',
  whatsappDisplay: '+20 100 536 2094',
  phone: '+201005362094',
  phoneDisplay: '+20 100 536 2094',
  googleReviewsUrl: 'https://www.google.com/maps/search/?api=1&query=Giza+Pyramids+View+Guest+House+Abd+Al+Aziz+Al+Basel+Al+Haram+Giza',
  tripadvisorUrl: 'https://www.tripadvisor.com/Hotel_Review-g294202-d20814271-Reviews-Giza_Pyramids_View_Guest_House-Giza_Giza_Governorate.html',
  tripUrl: 'https://www.trip.com/hotels/al-haraneyah-hotel-detail-45697800/giza-pyramids-view-guest-house/',
  bookingUrl: 'https://www.booking.com/hotel/eg/giza-pyramids-view-hostel.en-gb.html',
  /** Guest scores as published on 2026-10-23; Google's is the figure the owner gave. */
  scores: {
    google: { score: '4.5', outOf: '5', count: 175 },
    tripadvisor: { score: '4.9', outOf: '5', count: 14 },
    trip: { score: '8.6', outOf: '10', count: 66 },
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

export type RoomId = 'twin-view' | 'double-view' | 'studio' | 'twin-city';

export type Amenity = 'view' | 'cityView' | 'balcony' | 'ac' | 'bath' | 'fridge' | 'wifi' | 'tv' | 'breakfast' | 'lift';

/**
 * The four room types as the Trip.com listing names them (2026-10-23). Which photo shows which
 * room is read from the photos, not confirmed. Photo ids refer to src/data/photos.ts; the
 * non-view photos pair with the walk-through steps first.
 */
export const ROOMS: { id: RoomId; photos: string[]; hero: string; amenities: Amenity[]; faces: 'w' | 'e' }[] = [
  { id: 'double-view', hero: 'room-view', photos: ['room-view', 'balcony-day', 'view-sunset', 'lounge-sunset'], amenities: ['view', 'balcony', 'ac', 'bath', 'fridge', 'wifi', 'breakfast', 'lift'] , faces: 'w' },
  { id: 'twin-view', hero: 'room-twin', photos: ['room-twin', 'room-window', 'view-day', 'balcony-sunset'], amenities: ['view', 'ac', 'bath', 'fridge', 'wifi', 'breakfast', 'lift'] , faces: 'w' },
  { id: 'studio', hero: 'lounge-new', photos: ['lounge-new', 'sofa-corner', 'view-dusk'], amenities: ['view', 'ac', 'bath', 'fridge', 'wifi', 'tv', 'breakfast', 'lift'] , faces: 'w' },
  { id: 'twin-city', hero: 'corridor', photos: ['corridor', 'room-twin', 'terrace-day'], amenities: ['cityView', 'ac', 'bath', 'wifi', 'breakfast', 'lift'] , faces: 'e' },
];
