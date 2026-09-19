// Robustness checks for Content Machine (run after flow.mjs).
//   node robustness.mjs http://localhost:8760/ [http://localhost:8761/content-machine/]
// Second URL is optional: the same app served from a sub-path (like GitHub Pages).
// Covers file://, blocked storage, reduced motion, offline, deep links, mid-run
// navigation, finder edge cases, horizontal overflow at 320/390px and keyboard focus.
import puppeteer from 'puppeteer-core';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (i) => (process.argv[i] ? (process.argv[i].endsWith('/') ? process.argv[i] : process.argv[i] + '/') : null);
const BASE = arg(2);
const SUB = arg(3);
if (!BASE) { console.error('Usage: node robustness.mjs <base-url> [sub-path-url]'); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, detail = '') => results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });

async function fresh(vp = PHONE, before) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(vp);
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
  if (before) await before(p);
  return { ctx, p, errs };
}

// A. file://
{
  const { ctx, p, errs } = await fresh();
  await p.goto('file://' + ROOT + '/index.html?nointro#trending', { waitUntil: 'load' });
  await sleep(500);
  const cards = await p.$$eval('.mcard', (e) => e.length);
  await p.click('[data-action="gen"]');
  await p.waitForSelector('.studio[data-state="done"]', { timeout: 10000 });
  await sleep(500);
  const note = await p.$eval('#media-note', (e) => !e.hidden);
  const imgs = await p.$$eval('img', (els) => els.filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length);
  ok('file:// renders 8 cards, runs, shows offline note, images load', cards === 8 && note && imgs === 0, `cards ${cards}, note ${note}, broken imgs ${imgs}, errs ${errs.join(' | ') || 'none'}`);
  await p.screenshot({ path: '/tmp/r-file.png' });
  await ctx.close();
}

// B. Storage throws everywhere
{
  const { ctx, p, errs } = await fresh(PHONE, (pg) => pg.evaluateOnNewDocument(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: boom });
    Object.defineProperty(window, 'sessionStorage', { get: boom });
  }));
  await p.goto(BASE, { waitUntil: 'networkidle2' });
  const intro = await p.$eval('#intro', (e) => !e.hidden);
  await p.click('#intro-start');
  await sleep(400);
  await p.click('[data-action="gen"]');
  await p.waitForSelector('.studio[data-state="done"]', { timeout: 10000 });
  await p.click('#approve-btn');
  await sleep(300);
  await p.click('.tabbar [data-tab="impact"]');
  await sleep(300);
  const n = await p.$eval('#kpi-approved', (e) => e.textContent);
  ok('storage blocked: app works, counter in memory', intro && n === '1' && errs.length === 0, `approved ${n}, errs ${errs.join(' | ') || 'none'}`);
  await ctx.close();
}

// C. Reduced motion
{
  const { ctx, p, errs } = await fresh();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(BASE + '?nointro#studio/m4', { waitUntil: 'networkidle2' });
  const t0 = Date.now();
  await p.click('#gen-btn');
  await p.waitForSelector('.studio[data-state="done"]', { timeout: 10000 });
  const ms = Date.now() - t0;
  ok('reduced motion: pipeline ~1s', ms < 1600, `${ms} ms, errs ${errs.length}`);
  await ctx.close();
}

// D. Offline after load
{
  const { ctx, p, errs } = await fresh();
  await p.goto(BASE + '?nointro#studio/m2', { waitUntil: 'networkidle2' });
  await p.setOfflineMode(true);
  await p.click('#gen-btn');
  await p.waitForSelector('.studio[data-state="done"]', { timeout: 10000 });
  await sleep(800);
  const note = await p.$eval('#media-note', (e) => !e.hidden);
  const frames = await p.$$eval('iframe', (e) => e.length);
  ok('offline: poster stays + offline note, no iframe', note && frames === 0, `note ${note}, iframes ${frames}, errs ${errs.join(' | ') || 'none'}`);
  await p.screenshot({ path: '/tmp/r-offline.png' });
  await ctx.close();
}

// E. Sub-path hosting
if (SUB) {
  const { ctx, p, errs } = await fresh({ width: 1440, height: 900 });
  await p.goto(SUB + '?nointro#studio/m7', { waitUntil: 'networkidle2' });
  const title = await p.$eval('#s-title', (e) => e.textContent).catch(() => null);
  await p.goto(SUB + '?nointro#trending', { waitUntil: 'networkidle2' });
  await sleep(300);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(800);
  const broken = await p.$$eval('img', (els) => els.filter((i) => i.complete && i.naturalWidth === 0).length);
  ok('sub-path /content-machine/ works', title === 'Goldeneyes goal #1' && broken === 0 && errs.length === 0, `title ${title}, broken ${broken}, errs ${errs.join(' | ') || 'none'}`);
  await ctx.close();
}

// F. Deep links
{
  const { ctx, p, errs } = await fresh();
  await p.goto(BASE + '?nointro#impact', { waitUntil: 'networkidle2' });
  await p.reload({ waitUntil: 'networkidle2' });
  const impact = await p.$('.impact');
  await p.goto(BASE + '?nointro#studio/zz', { waitUntil: 'networkidle2' });
  const empty = await p.$eval('.studio-empty .lede', (e) => e.textContent).catch(() => '');
  const picks = await p.$$eval('.pick', (e) => e.length);
  await p.goto(BASE + '?nointro#nonsense', { waitUntil: 'networkidle2' });
  const trending = await p.$('.trend-layout');
  const active = await p.$eval('.tabbar [aria-current="page"]', (e) => e.dataset.tab);
  await p.goto(BASE + '?nointro#studio', { waitUntil: 'networkidle2' });
  const picks2 = await p.$$eval('.pick', (e) => e.length);
  await p.click('.pick');
  await p.waitForSelector('.studio[data-state="done"]', { timeout: 10000 });
  const hash = await p.evaluate(() => location.hash);
  ok('deep links: #impact, bad id, junk hash, bare #studio', impact && /isn’t in this demo/.test(empty) && picks === 3 && trending && active === 'trending' && picks2 === 3 && hash === '#studio/m1',
    `picks ${picks}/${picks2}, hash ${hash}, errs ${errs.join(' | ') || 'none'}`);
  await ctx.close();
}

// G. Navigate away mid-run, come back; spam controls
{
  const { ctx, p, errs } = await fresh();
  await p.goto(BASE + '?nointro#trending', { waitUntil: 'networkidle2' });
  await p.click('[data-action="gen"]');
  await sleep(1200);
  await p.click('.tabbar [data-tab="trending"]');
  await sleep(4500);
  const onTrending = await p.$('.trend-layout');
  await p.click('.tabbar [data-tab="studio"]');
  await sleep(300);
  const state = await p.$eval('.studio', (e) => e.dataset.state);
  await p.click('#gen-btn');
  for (let i = 0; i < 5; i++) { await p.evaluate(() => document.querySelector('#gen-btn') && document.querySelector('#gen-btn').click()); }
  await p.waitForSelector('.studio[data-state="done"]', { timeout: 10000 });
  for (const pl of ['reels', 'shorts', 'tiktok', 'reels', 'shorts']) await p.click(`.seg [data-p="${pl}"]`);
  for (let i = 0; i < 6; i++) await p.click('#regen-btn').catch(() => {});
  await sleep(1000);
  await p.click('.next-btn');
  await p.waitForSelector('.studio[data-moment="m2"][data-state="done"]', { timeout: 10000 });
  const frames = await p.$$eval('iframe', (e) => e.length);
  ok('mid-run navigation + control spam stay clean', onTrending && state === 'idle' && frames <= 1 && errs.length === 0, `state after return ${state}, iframes ${frames}, errs ${errs.join(' | ') || 'none'}`);
  await ctx.close();
}

// H. Finder edge cases
{
  const { ctx, p, errs } = await fresh();
  const tries = [['!!!', null], ['   ', null], ['the', 'closest'], ['I love being queer and I love hockey', 'm4'], ['Detroit', 'm5'], ['frost heise', 'm6'], ['GOLDENEYES first goal', 'm7'], ['maltais tiktok', 'm8'], ['KK Harvey #1 pick', 'm3'], ['Walter Cup champions Montréal', 'm2'], ['zzqx', 'closest']];
  const out = [];
  await p.goto(BASE + '?nointro#trending', { waitUntil: 'networkidle2' });
  for (const [q, want] of tries) {
    await p.evaluate(() => { location.hash = '#trending'; });
    await p.waitForSelector('#paste-in');
    await p.type('#paste-in', q);
    await p.keyboard.press('Enter');
    await sleep(300);
    const onStudio = await p.$('.studio');
    if (!want) { out.push(`${q.trim() || '(blank)'}→${onStudio ? 'studio!' : 'hint'}`); if (onStudio) out.push('BAD'); continue; }
    const id = await p.$eval('.studio', (e) => e.dataset.moment).catch(() => null);
    const note = await p.$eval('.match-note', (e) => e.textContent).catch(() => '');
    const good = want === 'closest' ? /Closest match/.test(note) : id === want;
    out.push(`${q}→${id}${good ? '' : ' BAD'}`);
  }
  ok('finder matches', !out.some((x) => x.includes('BAD')) && errs.length === 0, out.join(', '));
  await ctx.close();
}

// I. Horizontal overflow at 320 and 390
for (const w of [320, 390]) {
  const { ctx, p, errs } = await fresh({ ...PHONE, width: w });
  const bad = [];
  await p.goto(BASE + '?nointro#trending', { waitUntil: 'networkidle2' });
  for (const h of ['#trending', '#studio/m5', '#impact', '#studio']) {
    await p.evaluate((hh) => { location.hash = hh; }, h);
    await sleep(400);
    if (h.startsWith('#studio/')) { await p.click('#gen-btn'); await p.waitForSelector('.studio[data-state="done"]', { timeout: 10000 }); await sleep(500); }
    const o = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    if (o[0] > o[1]) bad.push(`${h} ${o[0]}>${o[1]}`);
  }
  if (w === 320) {
    await p.evaluate(() => { location.hash = '#trending'; });
    await sleep(500);
    await p.screenshot({ path: '/tmp/r-320.png' });
  }
  ok(`no horizontal scroll at ${w}px`, bad.length === 0 && errs.length === 0, bad.join('; ') || `errs ${errs.length}`);
  await ctx.close();
}

// J. Keyboard: tab into the page shows a focus ring
{
  const { ctx, p } = await fresh({ width: 1440, height: 900 });
  await p.goto(BASE + '?nointro#trending', { waitUntil: 'networkidle2' });
  for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
  const f = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return a.tagName + '.' + a.className + ' outline=' + cs.outlineStyle + ' ' + cs.outlineWidth; });
  ok('keyboard focus is visible', /solid 3px/.test(f), f);
  await p.screenshot({ path: '/tmp/r-focus.png' });
  await ctx.close();
}

await b.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
