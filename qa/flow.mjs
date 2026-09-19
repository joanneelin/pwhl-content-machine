// End-to-end demo walk for Content Machine.
//   node flow.mjs http://localhost:8760/
// Serves nothing itself: pass the base URL of an already-running static server.
// Walks the judge flow at phone (390x844) and desktop (1440x900), saves
// screenshots to qa/shots/, prints console errors, page errors, failed
// requests and check results. Exits 1 if anything failed.

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2];
if (!base) {
  console.error('Usage: node flow.mjs <base-url>   e.g. node flow.mjs http://localhost:8760/');
  process.exit(2);
}
const baseUrl = base.endsWith('/') || base.includes('?') ? base : base + '/';
const shots = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(shots, { recursive: true });

const VIEWPORTS = [
  ['phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ['desktop', { width: 1440, height: 900, deviceScaleFactor: 1 }]
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const checks = [];
const saved = [];

function check(vp, name, ok, detail = '') {
  checks.push({ vp, name, ok: Boolean(ok), detail });
}

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
});

try {
  for (const [vp, viewport] of VIEWPORTS) {
    const ctx = await browser.createBrowserContext(); // fresh session storage per run
    const page = await ctx.newPage();
    await page.setViewport(viewport);

    page.on('console', (m) => { if (m.type() === 'error') problems.push(`[${vp}] console error: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`[${vp}] page error: ${e.message}`));
    page.on('requestfailed', (r) => {
      const url = r.url();
      const why = r.failure() ? r.failure().errorText : '';
      // Aborted media/ads requests inside the YouTube player are not our app.
      if (/youtube|ytimg|googlevideo|doubleclick|google\.com|gstatic/.test(url) && why === 'net::ERR_ABORTED') return;
      problems.push(`[${vp}] request failed: ${url} ${why}`);
    });
    page.on('response', (r) => {
      if (r.status() >= 400 && r.url().startsWith(new URL(baseUrl).origin)) problems.push(`[${vp}] HTTP ${r.status()}: ${r.url()}`);
    });

    const shot = async (name, fullPage = false) => {
      const path = join(shots, `${vp}-${name}.png`);
      await page.screenshot({ path, fullPage });
      saved.push(path);
    };

    // 1. Intro
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const introVisible = await page.$eval('#intro', (el) => !el.hidden).catch(() => false);
    check(vp, 'intro overlay shows on first visit', introVisible);
    await shot('01-intro');
    await page.click('#intro-start');
    await page.waitForSelector('#intro', { hidden: true, timeout: 3000 });
    await sleep(300);

    // 2. Trending
    await page.waitForSelector('.mcard');
    const cardCount = await page.$$eval('.mcard', (els) => els.length);
    check(vp, 'trending lists 8 moments', cardCount === 8, `${cardCount} cards`);
    await shot('02-trending');
    await shot('02b-trending-full', true);

    // 3. Filter Stars
    await page.click('[data-filter="Stars"]');
    await sleep(250);
    const cats = await page.$$eval('.mcard .cat', (els) => els.map((e) => e.textContent.trim()));
    check(vp, 'Stars filter shows only Stars', cats.length > 0 && cats.every((c) => c === 'Stars'), cats.join(', '));

    // 4. Expand a card
    const firstCard = await page.$('.mcard');
    await firstCard.$eval('.expand-btn', (b) => b.scrollIntoView({ block: 'center' }));
    await (await firstCard.$('.expand-btn')).click();
    await sleep(300);
    const expanded = await firstCard.$eval('.more-quotes', (el) => !el.hidden);
    check(vp, 'card expands to show all fan quotes', expanded);
    await firstCard.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await sleep(200);
    await shot('03-card-expanded');

    // 5. Generate drafts (double-click on purpose: must start one run only)
    const genBtn = await firstCard.$('[data-action="gen"]');
    const momentId = await genBtn.evaluate((b) => b.dataset.id);
    await genBtn.click();
    await page.waitForSelector('.studio[data-state="running"]', { timeout: 3000 });
    const t0 = Date.now();
    await page.evaluate(() => { const b = document.querySelector('#gen-btn'); if (b) { b.click(); b.click(); } });
    await sleep(1500);
    await shot('04-generating');
    const runningSteps = await page.$$eval('.step', (els) => els.map((e) => e.dataset.s).join(','));
    await page.waitForSelector('.studio[data-state="done"]', { timeout: 12000 });
    const genMs = Date.now() - t0;
    check(vp, 'generation finishes in ~4.5s', genMs > 3500 && genMs < 7000, `${genMs} ms; mid-run steps ${runningSteps}`);
    check(vp, 'studio shows the chosen moment', (await page.$eval('.studio', (e) => e.dataset.moment)) === momentId, momentId);

    // Wait for the preview video (or the offline fallback).
    const video = await page.waitForFunction(() => {
      const s = document.querySelector('#screen');
      const n = document.querySelector('#media-note');
      if (s && s.classList.contains('is-live')) return 'live';
      if (n && !n.hidden) return 'offline';
      return false;
    }, { timeout: 25000 }).then((h) => h.jsonValue()).catch(() => 'pending');
    check(vp, 'video preview is live or shows offline note', video === 'live' || video === 'offline', video);
    const frames = await page.$$eval('iframe', (els) => els.length);
    check(vp, 'at most one iframe', frames <= 1, `${frames} iframe(s)`);
    await sleep(1500);

    // 6. Platforms
    for (const p of ['tiktok', 'reels', 'shorts']) {
      await page.click(`.seg [data-p="${p}"]`);
      await sleep(400);
      const plat = await page.$eval('#screen', (e) => e.dataset.platform);
      check(vp, `switch to ${p}`, plat === p, plat);
      await shot(`05-studio-${p}`);
    }
    await shot('05b-studio-full', true);

    // 7. Regenerate
    const before = await page.$eval('#cap-input', (e) => e.value);
    await page.click('#regen-btn');
    await sleep(900);
    const after = await page.$eval('#cap-input', (e) => e.value);
    const ver = await page.$eval('#draft-ver', (e) => e.textContent);
    check(vp, 'regenerate swaps to the next version', before !== after && /version 2 of 3/.test(ver), ver);

    // 8. Approve
    await page.click('#approve-btn');
    await sleep(400);
    const toastText = await page.$eval('#toast', (e) => e.textContent);
    check(vp, 'approve shows toast', /Approved — queued for your team/.test(toastText), toastText);
    const badge = await page.$eval('.seg [data-p="shorts"]', (e) => e.classList.contains('is-approved'));
    check(vp, 'approved badge on platform', badge);
    await shot('06-approved');
    await sleep(2800); // let the toast clear before the next screen

    // 9. Impact
    await page.click(vp === 'phone' ? '.tabbar [data-tab="impact"]' : '.tabs-top [data-tab="impact"]');
    await page.waitForSelector('.impact');
    await sleep(1000);
    const approvedN = await page.$eval('#kpi-approved', (e) => e.textContent.trim());
    check(vp, 'impact counts the approved draft', approvedN === '1', approvedN);
    await shot('07-impact');
    await shot('07b-impact-full', true);

    // 10. Back to Trending, paste "poulin overtime", press Enter
    await page.click(vp === 'phone' ? '.tabbar [data-tab="trending"]' : '.tabs-top [data-tab="trending"]');
    await page.waitForSelector('#paste-in');
    // Empty submit must not crash, just hint.
    await page.click('#paste-in');
    await page.keyboard.press('Enter');
    await sleep(200);
    const hint = await page.$eval('#finder-hint', (e) => e.textContent);
    check(vp, 'empty search shows a hint', hint.length > 0, hint);
    await page.type('#paste-in', 'poulin overtime');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.studio[data-state="running"]', { timeout: 3000 });
    await page.waitForSelector('.studio[data-state="done"]', { timeout: 12000 });
    const found = await page.$eval('.studio', (e) => e.dataset.moment);
    check(vp, '"poulin overtime" finds Captain Clutch (m1)', found === 'm1', found);
    await sleep(2500);
    await shot('08-search-result');
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    await shot('08b-search-result-top');

    // 11. Deep link survives refresh
    await page.goto(new URL('?nointro#studio/m3', baseUrl).href, { waitUntil: 'networkidle2' });
    await page.reload({ waitUntil: 'networkidle2' });
    const deep = await page.$eval('.studio', (e) => e.dataset.moment).catch(() => null);
    check(vp, 'deep link #studio/m3 survives refresh', deep === 'm3', String(deep));
    await shot('09-deeplink-m3');

    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log('\nChecks');
for (const c of checks) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  [${c.vp}] ${c.name}${c.detail ? '  (' + c.detail + ')' : ''}`);
console.log('\nConsole / page errors / failed requests');
console.log(problems.length ? problems.map((p) => '  ' + p).join('\n') : '  none');
console.log('\nScreenshots');
for (const s of saved) console.log('  ' + s);
const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed, ${problems.length} error(s).`);
process.exit(failed || problems.length ? 1 : 0);
