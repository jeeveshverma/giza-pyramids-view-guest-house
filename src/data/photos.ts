/**
 * The photo catalogue: every master in src/assets/photos/, what it shows, which group it belongs
 * to and alt text in both languages. Placement on the site follows `group` and the room lists
 * in site.ts — nothing is placed by filename. Sources (2026-10-23): the guest house's own
 * Tripadvisor listing photos and travellers' photos there (view-*, lounge-sunset,
 * lounge-ceiling), its ZenHotels listing (balcony-sunset, lounge-night, room-window) and its
 * Trip.com listing (the roof terrace, the newer rooms, reception, corridor). Placeholders until
 * the owner sends originals.
 */
export type Group = 'view' | 'balcony' | 'terrace' | 'room' | 'house';

export interface Photo { id: string; group: Group; alt: { en: string; ar: string }; caption?: { en: string; ar: string } }

export const PHOTOS: Photo[] = [
  // the view
  { id: 'view-sunset', group: 'view', alt: { en: 'The three pyramids of Giza at sunset, the sun low on the left, the rooftops of Al Haram in the foreground', ar: 'أهرامات الجيزة الثلاثة عند الغروب، والشمس منخفضة على اليسار، وأسطح الهرم في المقدمة' }, caption: { en: 'Sunset from the balcony', ar: 'الغروب من الشرفة' } },
  { id: 'view-day', group: 'view', alt: { en: 'Khufu, Khafre and Menkaure in clear daylight above the city', ar: 'خوفو وخفرع ومنكاورع في ضوء نهار صافٍ فوق المدينة' }, caption: { en: 'Midday, all three', ar: 'الظهيرة والأهرامات الثلاثة' } },
  { id: 'view-night', group: 'view', alt: { en: 'The pyramids lit by the sound and light show at night, a full moon above', ar: 'الأهرامات مضاءة بعرض الصوت والضوء ليلاً، وبدر فوقها' }, caption: { en: 'The sound and light show, from your chair', ar: 'عرض الصوت والضوء من كرسيك' } },
  { id: 'view-dusk', group: 'view', alt: { en: 'The pyramids as silhouettes against a pink and violet dusk, the lights of Giza coming on', ar: 'الأهرامات ظلالاً على غسق وردي وبنفسجي، وأضواء الجيزة تُضاء' }, caption: { en: 'Dusk', ar: 'الغسق' } },
  { id: 'view-sunrise', group: 'view', alt: { en: 'An orange sun setting exactly between Khafre and Khufu, seen from the guest house', ar: 'شمس برتقالية تغرب بين خفرع وخوفو تماماً، من بيت الضيافة' }, caption: { en: 'The sun between two pyramids', ar: 'الشمس بين هرمين' } },
  { id: 'view-sun', group: 'view', alt: { en: 'A wide sky at sunset with the three pyramids small on the horizon', ar: 'سماء واسعة عند الغروب والأهرامات الثلاثة صغيرة على الأفق' }, caption: { en: 'Big sky', ar: 'سماء واسعة' } },
  { id: 'view-panorama', group: 'view', alt: { en: 'Panorama of Giza from the eleventh floor: the plateau and the three pyramids beyond the rooftops', ar: 'بانوراما الجيزة من الدور الحادي عشر: الهضبة والأهرامات الثلاثة خلف الأسطح' }, caption: { en: 'The plateau, from the eleventh floor', ar: 'الهضبة من الدور الحادي عشر' } },
  // balcony and lounge
  { id: 'balcony-day', group: 'balcony', alt: { en: 'The balcony: a wrought-iron railing with sun ornaments, the three pyramids straight ahead', ar: 'الشرفة: درابزين حديدي مشغول بزخارف الشمس، والأهرامات الثلاثة في المواجهة' }, caption: { en: 'The balcony railing and the pyramids', ar: 'درابزين الشرفة والأهرامات' } },
  { id: 'balcony-sunset', group: 'balcony', alt: { en: 'The balcony at sunset: plants, the iron railing and the pyramids glowing behind', ar: 'الشرفة عند الغروب: نباتات ودرابزين حديدي والأهرامات متوهجة خلفها' }, caption: { en: 'Sunset on the balcony', ar: 'الغروب على الشرفة' } },
  { id: 'lounge-sunset', group: 'balcony', alt: { en: 'The lounge: gold fretwork pelmet and ceiling, brown curtains, a patterned sofa and the pyramids pink through the glass', ar: 'الصالة: كورنيش وسقف مخرّمان بالذهبي وستائر بنية وكنبة منقوشة والأهرامات وردية خلف الزجاج' }, caption: { en: 'The lounge at sunset', ar: 'الصالة عند الغروب' } },
  { id: 'lounge-ceiling', group: 'balcony', alt: { en: 'The lounge ceiling: a gold cut-out medallion lit from within, the pyramids in the window below', ar: 'سقف الصالة: ميدالية ذهبية مخرّمة مضاءة من الداخل، والأهرامات في النافذة أسفلها' }, caption: { en: 'The gold ceiling', ar: 'السقف الذهبي' } },
  { id: 'lounge-night', group: 'balcony', alt: { en: 'The lounge at night: gold fretwork, a mural of the pyramids and the lit plateau through the window', ar: 'الصالة ليلاً: زخارف ذهبية مخرّمة وجدارية للأهرامات والهضبة مضاءة خلف النافذة' }, caption: { en: 'The lounge, lights on', ar: 'الصالة والأنوار مضاءة' } },
  { id: 'sofa-corner', group: 'balcony', alt: { en: 'A sitting corner: a wooden sofa with striped cushions, bougainvillea and the pyramids through the window', ar: 'ركن جلوس: كنبة خشبية بوسائد مخططة وجهنمية والأهرامات خلف النافذة' }, caption: { en: 'The sitting corner', ar: 'ركن الجلوس' } },
  { id: 'lounge-new', group: 'balcony', alt: { en: 'The renovated lounge: cream sofas, a round fretwork ceiling light and the pyramids at sunset in the window', ar: 'الصالة بعد التجديد: كنب كريمي وإضاءة سقف دائرية مخرّمة والأهرامات عند الغروب في النافذة' }, caption: { en: 'The new lounge', ar: 'الصالة الجديدة' } },
  // roof terrace
  { id: 'terrace-sunset', group: 'terrace', alt: { en: 'The roof terrace at sunset: rattan chairs, glass balustrade and the pyramids on the horizon', ar: 'سطح البيت عند الغروب: كراسي خيزران وسياج زجاجي والأهرامات على الأفق' }, caption: { en: 'The roof terrace', ar: 'السطح' } },
  { id: 'terrace-day', group: 'terrace', alt: { en: 'Breakfast laid on the roof terrace with the three pyramids beyond the balustrade', ar: 'الفطور على السطح والأهرامات الثلاثة خلف السياج' }, caption: { en: 'Breakfast with the pyramids', ar: 'الفطور مع الأهرامات' } },
  { id: 'terrace-evening', group: 'terrace', alt: { en: 'The terrace at dusk: tables set with drinks, the city lights beginning', ar: 'السطح عند الغسق: طاولات عليها مشروبات وأضواء المدينة تبدأ' }, caption: { en: 'Evening on the terrace', ar: 'المساء على السطح' } },
  { id: 'terrace-tables', group: 'terrace', alt: { en: 'Rattan chairs and tables on the terrace, the low sun catching the pyramids', ar: 'كراسي وطاولات خيزران على السطح، وشمس منخفضة تضيء الأهرامات' }, caption: { en: 'Golden hour', ar: 'الساعة الذهبية' } },
  { id: 'terrace-tall', group: 'terrace', alt: { en: 'The open-sided terrace in daylight, a fan on the wall and the plateau beyond', ar: 'السطح المفتوح الجوانب في النهار، ومروحة على الجدار والهضبة في البعيد' }, caption: { en: 'The terrace by day', ar: 'السطح نهاراً' } },
  // rooms and the house
  { id: 'room-twin', group: 'room', alt: { en: 'Twin room: two beds with beige velvet headboards and towel swans, a window onto the city', ar: 'غرفة بسريرين: سريران بظهر مخملي بيج وبجعات من المناشف، ونافذة على المدينة' }, caption: { en: 'A twin room', ar: 'غرفة بسريرين' } },
  { id: 'room-view', group: 'room', alt: { en: 'A room with the pyramids in the window: two beds, a small table and chairs, strip lighting on the ceiling', ar: 'غرفة والأهرامات في النافذة: سريران وطاولة صغيرة وكرسيان وإضاءة شريطية في السقف' }, caption: { en: 'The pyramids from the bed', ar: 'الأهرامات من السرير' } },
  { id: 'room-window', group: 'room', alt: { en: 'Two beds under brown curtains, a pyramid framed in the window', ar: 'سريران تحت ستائر بنية، وهرم في إطار النافذة' }, caption: { en: 'A pyramid in the window', ar: 'هرم في النافذة' } },
  { id: 'corridor', group: 'house', alt: { en: 'The corridor on the eleventh floor: marble floor, white walls and strip lights to the wooden doors', ar: 'ممر الدور الحادي عشر: أرضية رخام وجدران بيضاء وإضاءة شريطية حتى الأبواب الخشبية' }, caption: { en: 'The corridor', ar: 'الممر' } },
  { id: 'reception', group: 'house', alt: { en: 'The reception: a wooden desk, a leather sofa and a framed print of the pyramids', ar: 'الاستقبال: مكتب خشبي وكنبة جلدية ولوحة للأهرامات' }, caption: { en: 'Reception', ar: 'الاستقبال' } },
];

export const photo = (id: string): Photo => {
  const p = PHOTOS.find((p) => p.id === id);
  if (!p) throw new Error(`Unknown photo id: ${id}`);
  return p;
};
