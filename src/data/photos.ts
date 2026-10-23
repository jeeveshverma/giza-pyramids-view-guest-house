/**
 * The photo catalogue: every master in src/assets/photos/, what it shows, which group it belongs
 * to and alt text in both languages. Placement on the site follows `group` and the room lists in
 * site.ts — nothing is placed by filename.
 *
 * Sources: the room, bathroom and detail photos (studio-*, tv-*, tr-*, tw-*, db-*, kettle-tray,
 * terrace-noon, view-show) are the owner's own, sent on WhatsApp on 2026-10-23 and grouped into
 * rooms by matching floors, ceilings, headboards, windows and door numbers. The other view-*
 * photos are guests' photos from the Tripadvisor listing; terrace-*, reception and corridor come
 * from the Trip.com listing (the owner's set repeats three of them at lower resolution).
 */
export type Group = 'view' | 'room' | 'bathroom' | 'terrace' | 'house';

export interface Photo { id: string; group: Group; alt: { en: string; ar: string }; caption?: { en: string; ar: string } }

export const PHOTOS: Photo[] = [
  // the view
  { id: 'view-sunset', group: 'view', alt: { en: 'The three pyramids of Giza at sunset, the sun low on the left, the rooftops of Al Haram in the foreground', ar: 'أهرامات الجيزة الثلاثة عند الغروب، والشمس منخفضة على اليسار، وأسطح الهرم في المقدمة' }, caption: { en: 'Sunset from the eleventh floor', ar: 'الغروب من الدور الحادي عشر' } },
  { id: 'view-day', group: 'view', alt: { en: 'Khufu, Khafre and Menkaure in clear daylight above the city', ar: 'خوفو وخفرع ومنكاورع في ضوء نهار صافٍ فوق المدينة' }, caption: { en: 'Midday, all three', ar: 'الظهيرة والأهرامات الثلاثة' } },
  { id: 'view-show', group: 'view', alt: { en: 'The sound and light show: searchlights fanning up from the plateau behind the lit pyramids, the city dark below', ar: 'عرض الصوت والضوء: أشعة كشافات تتفرع من الهضبة خلف الأهرامات المضاءة، والمدينة مظلمة تحتها' }, caption: { en: 'The sound and light show, from the roof', ar: 'عرض الصوت والضوء من السطح' } },
  { id: 'view-night', group: 'view', alt: { en: 'The pyramids lit at night, a full moon above', ar: 'الأهرامات مضاءة ليلاً، وبدر فوقها' }, caption: { en: 'Moonrise over the plateau', ar: 'القمر فوق الهضبة' } },
  { id: 'view-dusk', group: 'view', alt: { en: 'The pyramids as silhouettes against a pink and violet dusk, the lights of Giza coming on', ar: 'الأهرامات ظلالاً على غسق وردي وبنفسجي، وأضواء الجيزة تُضاء' }, caption: { en: 'Dusk', ar: 'الغسق' } },
  { id: 'view-sunrise', group: 'view', alt: { en: 'An orange sun setting between Khafre and Khufu, seen from the guest house', ar: 'شمس برتقالية تغرب بين خفرع وخوفو، من بيت الضيافة' }, caption: { en: 'The sun between two pyramids', ar: 'الشمس بين هرمين' } },
  { id: 'view-sun', group: 'view', alt: { en: 'A wide sky at sunset with the three pyramids small on the horizon', ar: 'سماء واسعة عند الغروب والأهرامات الثلاثة صغيرة على الأفق' }, caption: { en: 'Big sky', ar: 'سماء واسعة' } },
  { id: 'view-panorama', group: 'view', alt: { en: 'Panorama of Giza from the eleventh floor: the plateau and the three pyramids beyond the rooftops', ar: 'بانوراما الجيزة من الدور الحادي عشر: الهضبة والأهرامات الثلاثة خلف الأسطح' }, caption: { en: 'The plateau, from the eleventh floor', ar: 'الهضبة من الدور الحادي عشر' } },

  // deluxe studio
  { id: 'studio-bed', group: 'room', alt: { en: 'Deluxe studio: a double bed against a wood-panelled wall, towel swans, white floor tiles and lines of light in the ceiling', ar: 'استوديو ديلوكس: سرير مزدوج أمام جدار بألواح خشبية وبجعات من المناشف وبلاط أبيض وخطوط إضاءة في السقف' }, caption: { en: 'The studio, wood-panelled bed wall', ar: 'الاستوديو وجدار السرير الخشبي' } },
  { id: 'studio-kitchenette', group: 'room', alt: { en: 'The studio kitchenette in black marble with a sink and cabinets, a velvet armchair in front', ar: 'المطبخ الصغير في الاستوديو بالرخام الأسود مع حوض وخزائن، وكرسي مخملي أمامه' }, caption: { en: 'The kitchenette', ar: 'المطبخ الصغير' } },
  { id: 'studio-table', group: 'room', alt: { en: 'A sunny corner of the studio: a glass-topped table and two rattan chairs', ar: 'ركن مشمس في الاستوديو: طاولة بسطح زجاجي وكرسيان من الخيزران' }, caption: { en: 'Table for two', ar: 'طاولة لشخصين' } },
  { id: 'studio-armchair', group: 'room', alt: { en: 'The studio: a velvet armchair, an open wardrobe, a painting and the air conditioning', ar: 'الاستوديو: كرسي مخملي وخزانة مفتوحة ولوحة وجهاز تكييف' }, caption: { en: 'Armchair and wardrobe', ar: 'الكرسي والخزانة' } },
  { id: 'studio-shower', group: 'bathroom', alt: { en: 'Studio bathroom: a glass-walled shower with a black frame, a lit mirror and a dark vanity', ar: 'حمّام الاستوديو: دُش بجدران زجاجية وإطار أسود ومرآة مضاءة وخزانة داكنة' }, caption: { en: 'The studio shower', ar: 'دُش الاستوديو' } },

  // twin room, pyramids view
  { id: 'tv-room5', group: 'room', alt: { en: 'Room 5 seen from the door: two beds with velvet headboards and the Great Pyramid filling the window', ar: 'الغرفة ٥ من الباب: سريران بظهر مخملي والهرم الأكبر يملأ النافذة' }, caption: { en: 'Room 5: the pyramid in the window', ar: 'الغرفة ٥: الهرم في النافذة' } },
  { id: 'tv-window', group: 'room', alt: { en: 'The picture window of a pyramids-view room: all three pyramids under a pale sky, glass panels hung in front', ar: 'نافذة غرفة الإطلالة: الأهرامات الثلاثة تحت سماء شاحبة، وألواح زجاجية معلقة أمامها' }, caption: { en: 'The window', ar: 'النافذة' } },
  { id: 'tv-sunset', group: 'room', alt: { en: 'Sunset through the room window, the sun dropping beside the pyramids, a minibar and a small Egyptian statue', ar: 'الغروب من نافذة الغرفة، والشمس تهبط بجانب الأهرامات، مع ثلاجة صغيرة وتمثال مصري صغير' }, caption: { en: 'Sunset from the bed', ar: 'الغروب من السرير' } },
  { id: 'tv-beds', group: 'room', alt: { en: 'Two large beds with velvet headboards, sunlight on the parquet floor', ar: 'سريران كبيران بظهر مخملي، والشمس على أرضية الباركيه' }, caption: { en: 'Two large beds', ar: 'سريران كبيران' } },
  { id: 'tv-wide', group: 'room', alt: { en: 'The pyramids-view twin room from the corner: two beds, bedside tables and lines of light in the ceiling', ar: 'غرفة الإطلالة من الركن: سريران وطاولتان جانبيتان وخطوط إضاءة في السقف' }, caption: { en: 'The room from the corner', ar: 'الغرفة من الركن' } },
  { id: 'tv-kettle', group: 'room', alt: { en: 'A kettle and cups on a tray by the window, two pyramids beyond the glass', ar: 'غلاية وأكواب على صينية عند النافذة، وهرمان خلف الزجاج' }, caption: { en: 'Tea with the pyramids', ar: 'شاي مع الأهرامات' } },
  { id: 'tv-table', group: 'room', alt: { en: 'A glass table and rattan chairs with a kettle tray, a minibar in the corner', ar: 'طاولة زجاجية وكراسي خيزران وصينية غلاية، وثلاجة صغيرة في الركن' }, caption: { en: 'Kettle and minibar', ar: 'الغلاية والثلاجة' } },
  { id: 'tv-mirror', group: 'room', alt: { en: 'Two beds with towel swans, a dressing table with an oval mirror and two chairs', ar: 'سريران عليهما بجعات من المناشف، وطاولة زينة بمرآة بيضاوية وكرسيان' }, caption: { en: 'Dressing table', ar: 'طاولة الزينة' } },

  // room with a double and a single bed
  { id: 'tr-beds', group: 'room', alt: { en: 'A room with a double and a single bed, velvet headboards, a wide window over Giza', ar: 'غرفة بسرير مزدوج وسرير مفرد، بظهر مخملي ونافذة واسعة على الجيزة' }, caption: { en: 'A double and a single', ar: 'سرير مزدوج ومفرد' } },
  { id: 'tr-light', group: 'room', alt: { en: 'The same room in warm light, towel swans on both beds', ar: 'الغرفة نفسها في ضوء دافئ، وبجعات من المناشف على السريرين' }, caption: { en: 'Afternoon light', ar: 'ضوء العصر' } },
  { id: 'tr-golden', group: 'room', alt: { en: 'A bed with a velvet headboard in golden evening light, a glass wardrobe behind', ar: 'سرير بظهر مخملي في ضوء المساء الذهبي، وخزانة زجاجية خلفه' }, caption: { en: 'Golden hour', ar: 'الساعة الذهبية' } },

  // twin room, two single beds
  { id: 'tw-beds', group: 'room', alt: { en: 'Twin room: two single beds with sage-green covers, a wall light and a wooden hanger rack', ar: 'غرفة بسريرين: سريران مفردان بغطاء أخضر فاتح ومصباح جداري وعلّاقة خشبية' }, caption: { en: 'Two single beds', ar: 'سريران مفردان' } },
  { id: 'tw-swan', group: 'room', alt: { en: 'A towel swan on a sage-green bed, a second bed beside it under a wall light', ar: 'بجعة من المناشف على سرير أخضر فاتح، وسرير ثانٍ بجانبه تحت مصباح جداري' }, caption: { en: 'Towel swans', ar: 'بجعات المناشف' } },
  { id: 'tw-fridge', group: 'room', alt: { en: 'Twin room with a small fridge, a wardrobe with hangers, an oval mirror and the bathroom door open', ar: 'غرفة بسريرين مع ثلاجة صغيرة وخزانة بعلّاقات ومرآة بيضاوية وباب الحمّام مفتوح' }, caption: { en: 'Fridge and wardrobe', ar: 'الثلاجة والخزانة' } },
  { id: 'tw-mirror', group: 'room', alt: { en: 'A curved mirror reflecting a twin room with towel swans on both beds', ar: 'مرآة منحنية تعكس غرفة بسريرين وعليهما بجعات من المناشف' }, caption: { en: 'In the mirror', ar: 'في المرآة' } },
  { id: 'tw-shower', group: 'bathroom', alt: { en: 'Bathroom with a glass shower, a black vanity and striped marble-pattern tiles', ar: 'حمّام بدُش زجاجي وخزانة سوداء وبلاط مخطط بنقش رخامي' }, caption: { en: 'Glass shower', ar: 'دُش زجاجي' } },

  // double room
  { id: 'db-room8', group: 'room', alt: { en: 'Room 8: a double bed with a velvet headboard, towel swans and a window with the curtain drawn back', ar: 'الغرفة ٨: سرير مزدوج بظهر مخملي وبجعات من المناشف ونافذة والستارة مفتوحة' }, caption: { en: 'Room 8', ar: 'الغرفة ٨' } },
  { id: 'db-bed', group: 'room', alt: { en: 'A double bed with two white pillows, two towel swans and a warm bedside lamp', ar: 'سرير مزدوج بوسادتين بيضاوين وبجعتين من المناشف ومصباح جانبي دافئ' }, caption: { en: 'Double bed', ar: 'سرير مزدوج' } },
  { id: 'db-window', group: 'room', alt: { en: 'A double room with a wide window over the rooftops and the air conditioning above', ar: 'غرفة مزدوجة بنافذة عريضة على الأسطح وجهاز التكييف فوقها' }, caption: { en: 'Window over the city', ar: 'نافذة على المدينة' } },
  { id: 'db-side', group: 'room', alt: { en: 'A double bed seen from the side, a velvet headboard and a window behind', ar: 'سرير مزدوج من الجانب، بظهر مخملي ونافذة خلفه' }, caption: { en: 'Quiet and simple', ar: 'هادئة وبسيطة' } },
  { id: 'db-ensuite', group: 'room', alt: { en: 'A double room with the bathroom door open, a basin inside, a window with a lilac curtain', ar: 'غرفة مزدوجة وباب الحمّام مفتوح ومغسلة في الداخل ونافذة بستارة بنفسجية' }, caption: { en: 'The bathroom next to the bed', ar: 'الحمّام بجانب السرير' } },
  { id: 'db-warm', group: 'bathroom', alt: { en: 'A bathroom in warm wood-effect tiles with a pedestal basin, seen from the bed', ar: 'حمّام ببلاط دافئ بنقش خشبي ومغسلة قائمة، يُرى من السرير' }, caption: { en: 'En-suite bathroom', ar: 'الحمّام الخاص' } },
  { id: 'db-swans', group: 'room', alt: { en: 'Two towel swans making a heart on the bed, the bathroom with striped tiles beyond', ar: 'بجعتان من المناشف تصنعان قلباً على السرير، والحمّام ببلاطه المخطط خلفهما' }, caption: { en: 'Welcome', ar: 'أهلاً بك' } },
  { id: 'db-door', group: 'room', alt: { en: 'From the bed: the wooden door, the bathroom, a dressing shelf and an oval mirror', ar: 'من السرير: الباب الخشبي والحمّام ورف زينة ومرآة بيضاوية' }, caption: { en: 'Door, bathroom and mirror', ar: 'الباب والحمّام والمرآة' } },
  { id: 'db-dresser', group: 'room', alt: { en: 'A floating dressing shelf with a pouf, a curved mirror and the wooden door', ar: 'رف زينة معلّق مع مقعد صغير ومرآة منحنية والباب الخشبي' }, caption: { en: 'Dressing shelf', ar: 'رف الزينة' } },
  { id: 'db-mirror', group: 'room', alt: { en: 'A curved mirror on a white wall reflecting the bed and a lit headboard', ar: 'مرآة منحنية على جدار أبيض تعكس السرير وظهره المضاء' }, caption: { en: 'Curved mirror', ar: 'مرآة منحنية' } },
  { id: 'kettle-tray', group: 'room', alt: { en: 'A kettle, glasses and coffee on an orange tray under an oval mirror', ar: 'غلاية وأكواب وقهوة على صينية برتقالية تحت مرآة بيضاوية' }, caption: { en: 'Kettle, tea and coffee', ar: 'غلاية وشاي وقهوة' } },

  // roof terrace and the house
  { id: 'terrace-sunset', group: 'terrace', alt: { en: 'The roof terrace at sunset: rattan chairs, glass balustrade and the pyramids on the horizon', ar: 'السطح عند الغروب: كراسي خيزران وسياج زجاجي والأهرامات على الأفق' }, caption: { en: 'The roof terrace at sunset', ar: 'السطح عند الغروب' } },
  { id: 'terrace-day', group: 'terrace', alt: { en: 'Breakfast laid on the roof terrace with the three pyramids beyond the balustrade', ar: 'الفطور على السطح والأهرامات الثلاثة خلف السياج' }, caption: { en: 'Breakfast with the pyramids', ar: 'الفطور مع الأهرامات' } },
  { id: 'terrace-noon', group: 'terrace', alt: { en: 'The covered roof terrace by day: rattan chairs and tables, a fan on the wall, the city beyond', ar: 'السطح المغطى نهاراً: كراسي وطاولات خيزران ومروحة على الجدار والمدينة خلفه' }, caption: { en: 'The terrace by day', ar: 'السطح نهاراً' } },
  { id: 'terrace-evening', group: 'terrace', alt: { en: 'The terrace at dusk: tables set with drinks, the city lights beginning', ar: 'السطح عند الغسق: طاولات عليها مشروبات وأضواء المدينة تبدأ' }, caption: { en: 'Evening on the terrace', ar: 'المساء على السطح' } },
  { id: 'terrace-tables', group: 'terrace', alt: { en: 'Rattan chairs and tables on the terrace, the low sun catching the pyramids', ar: 'كراسي وطاولات خيزران على السطح، وشمس منخفضة تضيء الأهرامات' }, caption: { en: 'Golden hour', ar: 'الساعة الذهبية' } },
  { id: 'terrace-tall', group: 'terrace', alt: { en: 'The open-sided terrace in daylight, a fan on the wall and the plateau beyond', ar: 'السطح المفتوح الجوانب في النهار، ومروحة على الجدار والهضبة في البعيد' }, caption: { en: 'Open on three sides', ar: 'مفتوح من ثلاث جهات' } },
  { id: 'reception', group: 'house', alt: { en: 'The reception: a wooden desk, a leather sofa and a framed print of the pyramids', ar: 'الاستقبال: مكتب خشبي وكنبة جلدية ولوحة للأهرامات' }, caption: { en: 'Reception, open all night', ar: 'الاستقبال مفتوح طوال الليل' } },
  { id: 'corridor', group: 'house', alt: { en: 'The corridor on the eleventh floor: marble floor, white walls and strip lights to the wooden doors', ar: 'ممر الدور الحادي عشر: أرضية رخام وجدران بيضاء وإضاءة شريطية حتى الأبواب الخشبية' }, caption: { en: 'The eleventh-floor corridor', ar: 'ممر الدور الحادي عشر' } },
];

export const photo = (id: string): Photo => {
  const p = PHOTOS.find((p) => p.id === id);
  if (!p) throw new Error(`Unknown photo id: ${id}`);
  return p;
};
