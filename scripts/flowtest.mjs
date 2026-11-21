// End-to-end test of the booking path: search → availability → select rooms → checkout details →
// final step → booking number and the WhatsApp link → My booking → cancel. It makes real bookings,
// so the site must be built against a local backend (PUBLIC_API=http://127.0.0.1:8799, worker/README.md). Screenshots every step.   node scripts/flowtest.mjs <outdir>
import { chromium, webkit, devices } from 'playwright';
// ENGINE=webkit runs it in Safari's engine (iOS); the default is Chromium (Android/Chrome)
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321';
const OUT = process.argv[2] || '.';
const b = await (process.env.ENGINE === 'webkit' ? webkit : chromium).launch();
const PHONE = process.env.ENGINE === 'webkit' ? devices['iPhone 13'] : devices['Pixel 7'];
const runs = [['desk', { viewport: { width: 1440, height: 900 } }, '/'], ['phone', { ...PHONE }, '/'], ['ar', { ...PHONE }, '/ar/']];
let fail = 0;
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const off = 300 + Math.floor(Math.random() * 60), IN = day(off), OUTD = day(off + 3);
const check = (name, ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} [${name}] ${msg}`); };
for (const [name, opts, home] of runs) {
  const ctx = await b.newContext({ ...opts, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(BASE + home, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${OUT}/${name}-1-hero.png` });
  // search: 3 adults, 1 child, three nights about ten months ahead (a different week per run, so reruns do not collide)
  const sb = p.locator('#search');
  await sb.scrollIntoViewIfNeeded();
  await sb.locator('[name=in]').fill(IN); await sb.locator('[name=in]').dispatchEvent('change');
  await sb.locator('[name=out]').fill(OUTD); await sb.locator('[name=out]').dispatchEvent('change');
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
  await p.locator('[data-step="2"] .co-next').click(); await p.waitForTimeout(200);
  check(name, await p.locator('[data-err]').isVisible(), `validation: ${await p.locator('[data-err]').innerText()}`);
  await p.fill('[name=first]', 'Jane'); await p.fill('[name=last]', 'Doe'); await p.fill('[name=phone]', '+44 7700 900123');
  await p.selectOption('[name=arrival]', { index: 3 }); await p.check('[name=pickup]'); await p.fill('[name=flight]', 'MS 778 14:30'); await p.fill('[name=req]', 'A late check-in please');
  await p.locator('[data-step="2"] .co-next').click(); await p.waitForTimeout(500);
  check(name, await p.locator('[data-step="3"]').isVisible(), 'final step shows');
  const rv = await p.locator('[data-review]').innerText();
  check(name, /Jane Doe/.test(rv) && /MS 778/.test(rv) && /7700/.test(rv), 'the review lists name, flight and mobile');
  await p.screenshot({ path: `${OUT}/${name}-7-final.png`, fullPage: name === 'desk' });
  // back button returns to details with the fields kept, forward again
  await p.goBack(); await p.waitForTimeout(400);
  check(name, (await p.locator('[data-step="2"]').isVisible()) && (await p.inputValue('[name=first]')) === 'Jane', 'Back returns to details, fields kept');
  await p.locator('[data-step="2"] .co-next').click(); await p.waitForTimeout(400);
  // complete the booking: a number comes back and the rooms are held
  await p.locator('[data-book]').click();
  await p.locator('[data-step="4"]').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const ref = (await p.locator('[data-ref]').innerText().catch(() => '')).trim();
  check(name, /^GP-[A-Z2-9]{6}$/.test(ref), `booking number shown: ${ref || (await p.locator('[data-berr]').innerText().catch(() => '?'))}`);
  const msg = await p.locator('[data-msg]').innerText();
  const href = await p.locator('[data-send]').getAttribute('href');
  check(name, href.startsWith('https://wa.me/201005362094?text=') && decodeURIComponent(href.split('text=')[1]) === msg, 'WhatsApp link carries exactly the previewed message');
  check(name, msg.includes(ref) && /Jane Doe/.test(msg) && /MS 778/.test(msg) && (/twin|بسريرين/i.test(msg)), 'message has the booking number, name, flight and room');
  console.log(`--- ${name} message ---\n${msg}\n---`);
  await p.screenshot({ path: `${OUT}/${name}-8-booked.png`, fullPage: true });
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  check(name, (await p.locator('[data-step="4"]').isVisible()) && (await p.locator('[data-ref]').innerText()).trim() === ref, 'a reload still shows the booking, not an empty form');
  // My booking opens it without typing, and cancels in two presses
  await p.locator('[data-manage]').click(); await p.waitForLoadState('networkidle');
  await p.locator('[data-res]').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  check(name, (await p.locator('[data-res] [data-ref]').innerText().catch(() => '')).trim() === ref && (await p.locator('[data-st]').getAttribute('data-s')) === 'pending', 'My booking shows it, waiting for the house');
  await p.screenshot({ path: `${OUT}/${name}-9-mybooking.png`, fullPage: true });
  await p.locator('[data-cancel]').click(); await p.waitForTimeout(150);
  check(name, await p.locator('[data-ask]').isVisible(), 'cancel asks first');
  await p.locator('[data-cancel]').click();
  await p.waitForFunction(() => document.querySelector('[data-st]')?.getAttribute('data-s') === 'cancelled', null, { timeout: 10000 }).catch(() => {});
  check(name, (await p.locator('[data-st]').getAttribute('data-s')) === 'cancelled' && !(await p.locator('[data-cancel]').isVisible()), 'cancelled, and the button is gone');
  // someone who knows only the number cannot open it
  await p.locator('[data-other]').click(); await p.fill('[data-find] [name=ref]', ref); await p.fill('[data-find] [name=phone]', '+44 7700 900999'); await p.locator('.mb-go').click();
  await p.locator('[data-err]').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  check(name, await p.locator('[data-find] [data-err]').isVisible(), `wrong mobile finds nothing: ${await p.locator('[data-find] [data-err]').innerText().catch(() => '')}`);
  // the one 404 is the wrong-mobile lookup just above
  const real = errs.filter((e) => !/status of 404/.test(e));
  check(name, real.length === 0 && errs.length - real.length <= 1, `no page errors ${real.join(' | ')}`);
  await ctx.close();
}
await b.close();
console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
