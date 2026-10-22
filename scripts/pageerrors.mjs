// Prints every uncaught page error (with stack) for the given paths. Dev/preview server must be running.
//   QA_BASE=http://127.0.0.1:4321/giza-pyramids-view-guest-house node scripts/pageerrors.mjs / /ar/
import { chromium } from 'playwright';
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321/giza-pyramids-view-guest-house';
const b = await chromium.launch(); const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message, '\n', e.stack));
for (const path of process.argv.slice(2)) { console.log('==', path); await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(400); }
await b.close();
