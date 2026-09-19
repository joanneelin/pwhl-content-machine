import puppeteer from 'puppeteer-core';
const out = new URL('../../qa-shots/', import.meta.url).pathname;
import fs from 'fs'; fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
const errs = [];
for (const [name, vp] of [['phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['desk', { width: 1440, height: 900 }]]) {
  const p = await b.newPage(); await p.setViewport(vp);
  p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
  p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message));
  await p.goto('http://localhost:8801/', { waitUntil: 'networkidle2' });
  await p.screenshot({ path: out + name + '-0-intro.png' });
  await p.click('#intro-start');
  await p.screenshot({ path: out + name + '-1-trending.png', fullPage: false });
  await p.type('#paste-in', 'frankel save');
  await p.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 6500));
  await p.screenshot({ path: out + name + '-2-studio.png', fullPage: name === 'phone' });
  await p.click('[data-plat="reels"]'); await new Promise(r => setTimeout(r, 1500));
  await p.click('#approve'); await new Promise(r => setTimeout(r, 500));
  await p.screenshot({ path: out + name + '-3-reels-approved.png' });
  await p.goto('http://localhost:8801/#impact', { waitUntil: 'domcontentloaded' }); await new Promise(r => setTimeout(r, 1500));
  await p.screenshot({ path: out + name + '-4-impact.png', fullPage: name === 'phone' });
}
await b.close();
console.log(errs.length ? errs.join('\n') : 'no errors');
