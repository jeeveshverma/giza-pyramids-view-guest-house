// End-to-end test of the booking path: search → availability → select rooms → checkout details →
// final step → the WhatsApp link. Screenshots every step.   node scripts/flowtest.mjs <outdir>
import { chromium, webkit, devices } from 'playwright';
// ENGINE=webkit runs it in Safari's engine (iOS); the default is Chromium (Android/Chrome)
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321/giza-pyramids-view-guest-house';
const OUT = process.argv[2] || '.';
const b = await (process.env.ENGINE === 'webkit' ? webkit : chromium).launch();
const PHONE = process.env.ENGINE === 'webkit' ? devices['iPhone 13'] : devices['Pixel 7'];
const runs = [['desk', { viewport: { width: 1440, height: 900 } }, '/'], ['phone', { ...PHONE }, '/'], ['ar', { ...PHONE }, '/ar/']];
let fail = 0;
const check = (name, ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} [${name}] ${msg}`); };
for (const [name, opts, home] of runs) {
  const ctx = await b.newContext({ ...opts, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(BASE + home, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/${name}-1-hero.png` });
  // search: 3 adults, 1 child, Nov 2 → Nov 5
  const sb = p.locator('#search');
  await sb.scrollIntoViewIfNeeded();
  await sb.locator('[name=in]').fill('2026-11-02'); await sb.locator('[name=in]').dispatchEvent('change');
  await sb.locator('[name=out]').fill('2026-11-05'); await sb.locator('[name=out]').dispatchEvent('change');
  await sb.locator('[data-gbtn]').click();
  await sb.locator('[data-step="adults:1"]').click(); await sb.locator('[data-step="children:1"]').click();
  await p.screenshot({ path: `${OUT}/${name}-2-search.png` });
  await sb.locator('[data-done]').click();
  await sb.locator('.sb-go').click(); await p.waitForTimeout(600);
  const sum = await p.locator('[data-sum]').innerText();
  check(name, /3/.test(sum) || /٣/.test(sum), `availability summary: ${sum}`);
  // property + mosaic screenshot
  await p.locator('#property').scrollIntoViewIfNeeded(); await p.screenshot({ path: `${OUT}/${name}-3-property.png` });
  // lightbox opens and closes
  await p.locator('.pm-big').click(); await p.waitForTimeout(300);
  check(name, await p.locator('[data-lb]').first().isVisible(), 'gallery viewer opens');
  await p.screenshot({ path: `${OUT}/${name}-4-viewer.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  check(name, !(await p.locator('[data-lb]').first().isVisible()), 'gallery viewer closes on Escape');
  // select: 1 double → warn (sleeps 2 < 4); then 1 twin-view instead → ok
  await p.locator('#availability').scrollIntoViewIfNeeded();
  await p.locator('[data-room=double]').selectOption('1'); await p.waitForTimeout(150);
  check(name, await p.locator('[data-warn]').first().isVisible(), `capacity warning: ${await p.locator('[data-warn]').first().innerText()}`);
  await p.locator('[data-room=double]').selectOption('0'); await p.locator('[data-room=twin-view]').selectOption('1'); await p.waitForTimeout(150);
  check(name, !(await p.locator('[data-warn]').first().isVisible()), 'warning clears with the twin pyramids-view room (sleeps 4)');
  await p.locator('[data-row=twin-view]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/${name}-5-avail.png` });
  // reserve → checkout
  await p.locator('[data-reserve]').click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
  check(name, /enquire\/\?/.test(p.url()) && /r=twin-view%3A1|r=twin-view:1/.test(p.url()), `checkout url ${p.url().replace(BASE, '')}`);
  await p.screenshot({ path: `${OUT}/${name}-6-details.png`, fullPage: name === 'desk' });
  // submit empty → errors
  await p.locator('.co-next').click(); await p.waitForTimeout(200);
  check(name, await p.locator('[data-err]').isVisible(), `validation: ${await p.locator('[data-err]').innerText()}`);
  await p.fill('[name=first]', 'Jane'); await p.fill('[name=last]', 'Doe'); await p.fill('[name=phone]', '+44 7700 900123');
  await p.selectOption('[name=arrival]', { index: 3 }); await p.check('[name=pickup]'); await p.fill('[name=flight]', 'MS 778 14:30'); await p.fill('[name=req]', 'A late check-in please');
  await p.locator('.co-next').click(); await p.waitForTimeout(500);
  check(name, await p.locator('[data-step="3"]').isVisible(), 'final step shows');
  const msg = await p.locator('[data-msg]').innerText();
  const href = await p.locator('[data-send]').getAttribute('href');
  check(name, href.startsWith('https://wa.me/201005362094?text=') && decodeURIComponent(href.split('text=')[1]) === msg, 'WhatsApp link carries exactly the previewed message');
  check(name, /Jane Doe/.test(msg) && /MS 778/.test(msg) && (/twin|بسريرين/i.test(msg)), 'message has name, flight and room');
  console.log(`--- ${name} message ---\n${msg}\n---`);
  await p.screenshot({ path: `${OUT}/${name}-7-final.png`, fullPage: name === 'desk' });
  // back button returns to details with the fields kept
  await p.goBack(); await p.waitForTimeout(400);
  check(name, (await p.locator('[data-step="2"]').isVisible()) && (await p.inputValue('[name=first]')) === 'Jane', 'Back returns to details, fields kept');
  check(name, errs.length === 0, `no page errors ${errs.join(' | ')}`);
  await ctx.close();
}
await b.close();
console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
