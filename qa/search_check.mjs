import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });
const errs = [];
for (const q of ['Sarah Fillier', 'sarah nurse goal', 'emma maltais', 'poulin overtime', 'harvey draft', 'frankel save', 'detroit']) {
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push(q + ': ' + e.message));
  await p.goto('http://localhost:8760/?nointro#trending', { waitUntil: 'domcontentloaded' }); await new Promise(r => setTimeout(r, 700));
  await p.type('#paste-in', q); await p.keyboard.press('Enter'); await new Promise(r => setTimeout(r, 1500));
  const title = await p.evaluate(() => { const h = document.querySelector('#view h1, #view h2'); const n = [...document.querySelectorAll('#view p')].map(x => x.textContent).find(t => /Matched|Closest/.test(t)); return (h ? h.textContent : '?') + ' || ' + (n || ''); });
  console.log(q.padEnd(18), '->', title.slice(0, 150));
  await p.close();
}
await b.close(); console.log(errs.length ? errs.join('\n') : 'no page errors');
