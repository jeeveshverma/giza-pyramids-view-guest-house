/**
 * Landmarks around the guest house. Coordinates are each place's Google Maps pin. Distance,
 * bearing and travel minutes are computed at build time in src/lib/geo.ts — nothing here is
 * typed by hand.
 */
import type { LatLng } from '../lib/geo';

export type Art = 'pyramids' | 'sphinx' | 'museum' | 'step' | 'bent' | 'colossus' | 'bazaar' | 'tower' | 'felucca' | 'oldmuseum' | 'gate' | 'plane' | 'metro' | 'camel' | 'sun' | 'lightshow' | 'mosque';

/** `lbl` pins the city-map label to a side where the computed default would collide. */
export interface Place { id: string; name: { en: string; ar: string }; blurb: { en: string; ar: string }; art: Art; at: LatLng; kind: 'city' | 'far'; transport?: boolean; lbl?: 'l' | 'r' | 'u' | 'd' }

export const PLACES: Place[] = [
  { id: 'pyramids', kind: 'city', art: 'pyramids', lbl: 'u', at: { lat: 29.97916, lng: 31.13424 }, name: { en: 'The Great Pyramid', ar: 'الهرم الأكبر' }, blurb: { en: 'Khufu, Khafre and Menkaure on the plateau. Tickets at the gate; a taxi from the door takes minutes.', ar: 'خوفو وخفرع ومنكاورع على الهضبة. التذاكر عند البوابة، وسيارة الأجرة من الباب دقائق.' } },
  { id: 'sphinx', kind: 'city', art: 'sphinx', lbl: 'l', at: { lat: 29.97528, lng: 31.13765 }, name: { en: 'The Great Sphinx', ar: 'أبو الهول' }, blurb: { en: 'At the foot of the plateau, by the eastern entrance and the sound-and-light seats.', ar: 'عند سفح الهضبة، بجوار المدخل الشرقي ومقاعد عرض الصوت والضوء.' } },
  { id: 'gate', kind: 'city', art: 'gate', lbl: 'd', at: { lat: 29.97595, lng: 31.14255 }, name: { en: 'Sphinx entrance (eastern gate)', ar: 'مدخل أبو الهول (البوابة الشرقية)' }, blurb: { en: 'The nearest entrance to the site, at the end of Abu Al Hool Street.', ar: 'أقرب مدخل للموقع، في نهاية شارع أبو الهول.' } },
  { id: 'gem', kind: 'city', art: 'museum', lbl: 'r', at: { lat: 29.99389, lng: 31.11972 }, name: { en: 'Grand Egyptian Museum', ar: 'المتحف المصري الكبير' }, blurb: { en: 'Tutankhamun\'s whole collection under one roof, at the edge of the plateau.', ar: 'مجموعة توت عنخ آمون كاملة تحت سقف واحد، على حافة الهضبة.' } },
  { id: 'monib', kind: 'city', transport: true, art: 'metro', lbl: 'l', at: { lat: 29.98123, lng: 31.21236 }, name: { en: 'El Monib metro', ar: 'مترو المنيب' }, blurb: { en: 'End of Line 2: downtown Cairo and the Egyptian Museum in half an hour.', ar: 'نهاية الخط الثاني: وسط القاهرة والمتحف المصري في نصف ساعة.' } },
  { id: 'zoo', kind: 'city', art: 'felucca', lbl: 'r', at: { lat: 30.02395, lng: 31.21440 }, name: { en: 'The Nile at Giza', ar: 'النيل عند الجيزة' }, blurb: { en: 'Feluccas from the corniche at sunset; Giza Zoo and Cairo University on the way.', ar: 'الفلايك من الكورنيش عند الغروب، وحديقة الحيوان وجامعة القاهرة في الطريق.' } },
  { id: 'saqqara', kind: 'far', art: 'step', at: { lat: 29.87127, lng: 31.21650 }, name: { en: 'Saqqara', ar: 'سقارة' }, blurb: { en: 'Djoser\'s Step Pyramid, the oldest of them all, and the painted tombs around it.', ar: 'هرم زوسر المدرج، أقدمها جميعاً، والمقابر المزخرفة حوله.' } },
  { id: 'dahshur', kind: 'far', art: 'bent', at: { lat: 29.79041, lng: 31.20931 }, name: { en: 'Dahshur', ar: 'دهشور' }, blurb: { en: 'The Bent and the Red Pyramids, Sneferu\'s rehearsals for Giza, almost empty of crowds.', ar: 'الهرم المنحني والهرم الأحمر، تجارب سنفرو قبل الجيزة، بلا زحام تقريباً.' } },
  { id: 'memphis', kind: 'far', art: 'colossus', at: { lat: 29.84840, lng: 31.25460 }, name: { en: 'Memphis', ar: 'منف' }, blurb: { en: 'The old capital: the fallen colossus of Ramses II and the alabaster sphinx.', ar: 'العاصمة القديمة: تمثال رمسيس الثاني الراقد وتمثال أبو الهول المرمري.' } },
  { id: 'museum', kind: 'far', art: 'oldmuseum', at: { lat: 30.04780, lng: 31.23360 }, name: { en: 'Egyptian Museum, Tahrir', ar: 'المتحف المصري بالتحرير' }, blurb: { en: 'The 1902 museum on Tahrir Square, still full of the old favourites.', ar: 'متحف ١٩٠٢ في ميدان التحرير، وما زال مليئاً بالقطع المحبوبة.' } },
  { id: 'khan', kind: 'far', art: 'bazaar', at: { lat: 30.04770, lng: 31.26220 }, name: { en: 'Khan el-Khalili', ar: 'خان الخليلي' }, blurb: { en: 'The bazaar and Al Hussein, with El Fishawy café open all night.', ar: 'السوق والحسين، ومقهى الفيشاوي مفتوح طوال الليل.' } },
  { id: 'tower', kind: 'far', art: 'tower', at: { lat: 30.04590, lng: 31.22430 }, name: { en: 'Cairo Tower', ar: 'برج القاهرة' }, blurb: { en: 'Zamalek, the island in the Nile: the tower, the Opera and the cafés.', ar: 'الزمالك، جزيرة في النيل: البرج والأوبرا والمقاهي.' } },
  { id: 'cai', kind: 'far', transport: true, art: 'plane', at: { lat: 30.12190, lng: 31.40560 }, name: { en: 'Cairo International Airport', ar: 'مطار القاهرة الدولي' }, blurb: { en: 'Across the city to the north-east; the guest house arranges pickup for a fee.', ar: 'عبر المدينة إلى الشمال الشرقي، ويرتب بيت الضيافة الاستقبال برسوم.' } },
  { id: 'sph', kind: 'far', transport: true, art: 'plane', at: { lat: 30.11170, lng: 30.91250 }, name: { en: 'Sphinx International Airport', ar: 'مطار سفنكس الدولي' }, blurb: { en: 'The newer airport west of the city, on the desert road.', ar: 'المطار الأحدث غرب المدينة، على الطريق الصحراوي.' } },
];
