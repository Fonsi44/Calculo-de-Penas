const { chromium } = require('playwright');

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'servicios', path: '/servicios-juridicos' },
  { name: 'derecho-penal', path: '/derecho-penal' },
  { name: 'despacho', path: '/despacho' },
  { name: 'blog', path: '/blog' },
  { name: 'solicitar-consulta', path: '/solicitar-consulta' },
  { name: 'abogados-en-nacaome', path: '/abogados-en-nacaome' },
  { name: 'como-llegar', path: '/como-llegar' },
];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 900 },
];

const BASE = 'https://www.pinedayasociadoshn.com';

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      try {
        await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        // Medir overflow horizontal
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        await page.screenshot({ path: `docs/screenshots/${p.name}-${vp.name}.png`, fullPage: false });
        console.log(`${vp.name.padEnd(8)} ${p.name.padEnd(22)} overflow=${overflow}px`);
      } catch (e) {
        console.log(`${vp.name.padEnd(8)} ${p.name.padEnd(22)} ERROR: ${String(e).substring(0, 80)}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
})();
