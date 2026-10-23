// Exercises the booking bar: guests popover, dates, and the hand-over to the enquiry form.
import { chromium, devices } from 'playwright';
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321/giza-pyramids-view-guest-house';
const OUT = process.argv[2] || '.';
const b = await chromium.launch();
for (const [name, ctxOpts, path] of [['desk', { viewport: { width: 1440, height: 900 } }, '/'], ['phone', { ...devices['iPhone 13'] }, '/'], ['ar', { ...devices['iPhone 13'] }, '/ar/']]) {
  const ctx = await b.newContext({ ...ctxOpts, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  const bar = p.locator('[data-book]').first(); await bar.scrollIntoViewIfNeeded();
  console.log(name, 'initial:', (await bar.innerText()).replace(/\s+/g, ' '));
  await bar.screenshot({ path: `${OUT}/${name}-bar.png` });
  await bar.locator('[data-guests-btn]').click(); await bar.locator('[data-inc=children]').click(); await bar.locator('[data-inc=adults]').click();
  await p.screenshot({ path: `${OUT}/${name}-pop.png` });
  await bar.locator('[data-done]').click();
  await bar.locator('[name=in]').fill('2026-11-02'); await bar.locator('[name=in]').dispatchEvent('change');
  await bar.locator('[name=out]').fill('2026-11-05'); await bar.locator('[name=out]').dispatchEvent('change');
  console.log(name, 'after:', (await bar.innerText()).replace(/\s+/g, ' '));
  await bar.locator('.book-cta').click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(600);
  const f = p.locator('[data-enquiry]');
  console.log(name, 'enquire url:', p.url().replace(BASE, ''), '| form:', await f.locator('[name=in]').inputValue(), await f.locator('[name=out]').inputValue(), await f.locator('[name=adults]').inputValue(), await f.locator('[name=children]').inputValue(), '|', await f.locator('[data-nights]').innerText());
  console.log(name, 'errors:', errs.length ? errs : 'none');
  await ctx.close();
}
await b.close();
