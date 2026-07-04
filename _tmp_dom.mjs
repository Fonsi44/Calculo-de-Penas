import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Buscar TODOS los elementos que contengan "asistente" en cualquier atributo
const found = await page.evaluate(() => {
  const els = document.querySelectorAll('[aria-label*="asistente" i], [class*="chat" i], button[aria-expanded]');
  return Array.from(els).map(el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      tag: el.tagName,
      label: el.getAttribute('aria-label'),
      cls: (el.className||'').toString().slice(0,100),
      pos: s.position,
      display: s.display,
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
    };
  });
});
console.log('FOUND:', JSON.stringify(found, null, 1));

// ¿El panel está abierto? ¿Dónde?
const dialogs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[role="dialog"]')).map(el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      label: el.getAttribute('aria-label'),
      cls: (el.className||'').toString().slice(0,120),
      pos: s.position,
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
    };
  });
});
console.log('DIALOGS:', JSON.stringify(dialogs, null, 1));
await browser.close();
