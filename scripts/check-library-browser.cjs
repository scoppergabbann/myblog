const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${process.argv[3]}/library`, { waitUntil: 'networkidle' });
      console.log(JSON.stringify(await page.evaluate(() => ({
        width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        images: [...document.images].map((im) => ({ width: im.width,
          naturalWidth: im.naturalWidth, loaded: im.complete && im.naturalWidth > 0,
          source: im.currentSrc })).slice(0, 3),
      }))));
      fs.mkdirSync('artifacts', { recursive: true });
      await page.screenshot({ path: `artifacts/library-${process.argv[4]}-${width}.png`, fullPage: false });
      const next = page.getByRole('button', { name: 'Lihat konten yang lebih lama' }).first();
      if (await next.count()) {
        await next.click();
        await page.getByRole('button', { name: 'Lihat konten yang lebih baru' }).first().click();
      }
      await page.locator('section button').filter({ has: page.locator('img') }).first().click();
      await page.getByRole('button', { name: 'Tutup', exact: true }).click();
      if (errors.length) throw new Error(errors.join('\n'));
      console.log(`PASS carousel and modal at ${width}px`);
      await page.close();
    }
  } finally { await browser.close(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
