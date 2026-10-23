// Full-page captures of every page on several devices, sliced into contact sheets for review.
//   node scripts/sweep.mjs <outdir> [device ...]     devices: phone small tablet desktop
import { chromium, devices } from 'playwright';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321/giza-pyramids-view-guest-house';
const [out, ...want] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const DEV = {
  phone: { ...devices['iPhone 13'] },
  small: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tablet: { ...devices['iPad (gen 7)'] },
  desktop: { viewport: { width: 1440, height: 900 } },
};
const PAGES = (process.env.PAGES || '/ /rooms/ /rooms/twin-view/ /rooms/double/ /gallery/ /giza/ /enquire/?in=2026-11-02&out=2026-11-05&adults=2&children=0&r=studio%3A1 /ar/ /ar/rooms/ /ar/enquire/?in=2026-11-02&out=2026-11-05&adults=2&children=0&r=studio%3A1').split(' ');
const b = await chromium.launch();
for (const d of (want.length ? want : Object.keys(DEV))) {
  const ctx = await b.newContext({ ...DEV[d], reducedMotion: 'reduce' });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { document.querySelectorAll('.rv').forEach((e) => e.classList.add('in')); document.querySelectorAll('[data-map], .elev, [data-skyline]').forEach((e) => e.classList.add('in', 'go')); for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
    await page.waitForTimeout(700);
    const name = `${d}-${p.split('?')[0].replace(/\//g, '_').replace(/^_|_$/g, '') || 'home'}`;
    const buf = await page.screenshot({ fullPage: true, scale: 'css' });
    const meta = await sharp(buf).metadata();
    const W = meta.width, H = meta.height;
    // slice into columns: phones 4 across at full size; tablet 3 across at 60%; desktop 2 across at 55%
    const cfg = W < 500 ? { k: 1, cols: 4 } : W < 1000 ? { k: 0.6, cols: 3 } : { k: 0.55, cols: 2 };
    const sw = Math.round(W * cfg.k), sliceH = Math.round((d === 'desktop' ? 900 : d === 'tablet' ? 1080 : 844) * 1.6);
    const scaled = await sharp(buf).resize(sw).png().toBuffer();
    const SH = Math.round(H * cfg.k);
    const pieces = [];
    for (let y = 0; y < SH; y += sliceH) pieces.push(await sharp(scaled).extract({ left: 0, top: y, width: sw, height: Math.min(sliceH, SH - y) }).png().toBuffer());
    for (let s = 0; s * cfg.cols < pieces.length; s++) {
      const group = pieces.slice(s * cfg.cols, s * cfg.cols + cfg.cols);
      await sharp({ create: { width: cfg.cols * sw + (cfg.cols - 1) * 12, height: sliceH, channels: 3, background: '#e00' } })
        .composite(group.map((g, i) => ({ input: g, left: i * (sw + 12), top: 0 }))).jpeg({ quality: 78 }).toFile(`${out}/${name}-${s + 1}.jpg`);
    }
    console.log(`${name}: ${H}px, ${Math.ceil(pieces.length / cfg.cols)} sheets`);
    await page.close();
  }
  await ctx.close();
}
await b.close();
