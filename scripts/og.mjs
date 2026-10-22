// Renders public/og-image.jpg (1200×630): the sunset over the plateau, darkened, with the pyramids
// mark and wordmark — what WhatsApp, X and Facebook show when the link is shared. Also writes the
// apple-touch-icon and icon-512 from the mark.   node scripts/og.mjs
import sharp from 'sharp';

const W = 1200, H = 630;
const photo = await sharp('src/assets/photos/view-sunset.jpg').resize(W, H, { fit: 'cover', position: 'centre' }).modulate({ brightness: 0.7 }).toBuffer();
const mark = (c) => `<g fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="50" cy="50" r="46" stroke-width="1.6"/><circle cx="50" cy="40" r="8" fill="${c}" fill-opacity=".2"/>
  <path d="M30 40h-6M76 40h-6M50 22v-6M36 28l-4-4M64 28l4-4" stroke-width="1.6"/><path d="M8 68h84" stroke-width="1.6"/>
  <path d="M14 68l12-16 12 16"/><path d="M30 68l17-26 17 26"/><path d="M52 68l21-22 21 22"/></g>`;
const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a26" stop-opacity=".15"/><stop offset="1" stop-color="#141a26" stop-opacity=".92"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#d9b56a" stroke-opacity=".7"/>
  <g transform="translate(76 300) scale(1.3)">${mark('#d9b56a')}</g>
  <text x="230" y="392" font-family="'Cormorant Garamond', Georgia, serif" font-weight="600" font-size="74" letter-spacing="6" fill="#f4ecdd">PYRAMIDS VIEW</text>
  <text x="234" y="436" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="10" fill="#d9b56a">GUEST HOUSE · GIZA · 11TH FLOOR</text>
  <text x="${W - 80}" y="420" font-family="'Reem Kufi', 'Geeza Pro', 'Noto Kufi Arabic', sans-serif" font-size="50" fill="#f4ecdd" text-anchor="end">إطلالة الأهرامات</text>
  <text x="234" y="540" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#f4ecdd" fill-opacity=".9">All three pyramids from your balcony · breakfast on the roof · enquire on WhatsApp</text>
</svg>`;
await sharp(photo).composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og-image.jpg');

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#141a26"/><g transform="translate(10 10)">${mark('#d9b56a').replace(/stroke-width="2.4"/, 'stroke-width="4"')}</g></svg>`;
await sharp(Buffer.from(icon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(icon)).resize(512, 512).png().toFile('public/icon-512.png');
console.log('og-image.jpg, apple-touch-icon.png, icon-512.png written');
