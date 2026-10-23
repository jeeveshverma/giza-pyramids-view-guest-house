// Checks every page in iOS (WebKit, iPhone 13 / SE) and Android (Chromium, Pixel 7 / Galaxy S9+):
// page errors, sideways scroll, images that fail, inputs under 16px (iOS zooms the page on focus),
// tap targets, and saves a screenshot of the top of each page.   node scripts/devicetest.mjs <outdir>
import { chromium, webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321/giza-pyramids-view-guest-house';
const out = process.argv[2] || '/tmp/devicetest'; mkdirSync(out, { recursive: true });
const PAGES = ['/', '/rooms/', '/rooms/twin-view/', '/gallery/', '/giza/', '/enquire/?in=2026-11-02&out=2026-11-05&adults=2&children=0&r=studio%3A1', '/ar/', '/ar/rooms/', '/ar/enquire/?r=double%3A1'];
const RUNS = [['ios', webkit, devices['iPhone 13']], ['ios-se', webkit, devices['iPhone SE']], ['android', chromium, devices['Pixel 7']], ['android-s9', chromium, devices['Galaxy S9+']]];
for (const [name, engine, dev] of RUNS) {
  const b = await engine.launch();
  const ctx = await b.newContext({ ...dev });
  for (const path of PAGES) {
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 140)));
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(60); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const wide = document.documentElement.scrollWidth > W + 1 ? document.documentElement.scrollWidth : 0;
      const over = [...document.querySelectorAll('body *')].filter((e) => { if (e.closest('svg, .strip-scroll, .pano-scroll, .elev-scroll, .pm-lb, [hidden], .lb, .hdr-nav:not(.open), .hero-photo')) return false; const b = e.getBoundingClientRect(); return b.width && (b.right > W + 1 || b.left < -1) && getComputedStyle(e).position !== 'fixed'; }).map((e) => (e.className || e.tagName).toString().slice(0, 40)).slice(0, 5);
      const zoom = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 30 && b.height > 20 && parseFloat(getComputedStyle(e).fontSize) < 16; }).map((e) => `${e.name || e.tagName}:${getComputedStyle(e).fontSize}`).slice(0, 6);
      const imgs = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('loading') !== 'lazy').length;
      const tap = [...document.querySelectorAll('a, button, select, summary')].filter((e) => { const b = e.getBoundingClientRect(); if (!b.width || e.closest('[hidden], .pm-lb, footer p, .ftr, svg')) return false; return b.height < 32 && b.width < 32; }).map((e) => `${(e.className || e.tagName).toString().slice(0, 24)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`).slice(0, 4);
      return { wide, over, zoom, imgs, tap };
    });
    const bad = r.wide || r.over.length || r.zoom.length || r.imgs || r.tap.length || errs.length;
    console.log(`${bad ? 'ISSUE' : 'ok   '} ${name} ${path.split('?')[0]} ${bad ? JSON.stringify({ ...r, errs }) : ''}`);
    await p.screenshot({ path: `${out}/${name}-${path.split('?')[0].replace(/\//g, '_') || 'home'}.png` });
    await p.close();
  }
  await b.close();
}
