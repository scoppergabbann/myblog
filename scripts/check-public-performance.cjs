const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  try {
    for (const path of ['/', '/about', '/writing/episode-08-indeks-sektoral-dan-cara-membaca-rotasi-uang']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.addInitScript(() => {
        window.measurement = { lcp: 0, shifts: [] };
        new PerformanceObserver((list) => {
          const entry = list.getEntries().at(-1);
          window.measurement.lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.measurement.shifts.push(e.value);
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(process.argv[3] + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(5000);
      const metrics = await page.evaluate(() => ({
        lcpMs: Math.round(window.measurement.lcp),
        layoutShiftSum: window.measurement.shifts.reduce((a, b) => a + b, 0),
        overflow: document.documentElement.scrollWidth > innerWidth,
        h1Count: document.querySelectorAll('h1').length,
      }));
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      await page.getByRole('button', { name: 'Close menu', exact: true }).click();
      await page.waitForTimeout(350);
      results.push({ path, ...metrics, mobileMenu: 'pass' });
      console.log(JSON.stringify(results.at(-1)));
      fs.mkdirSync('artifacts', { recursive: true });
      await page.screenshot({ path: `artifacts/public-${process.argv[4]}-${results.length}.png` });
      await page.close();
    }
    const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await page.goto(process.argv[3], { waitUntil: 'load' });
    const visibleHeading = await page.locator('.home-typing-live').innerText();
    console.log(JSON.stringify({ noJavaScriptHeading: visibleHeading }));
    fs.writeFileSync(`artifacts/public-${process.argv[4]}.json`, JSON.stringify({
      environment: 'Local headless Edge, 390x844, no CPU/network throttling; 5-second observation. Not field CWV/INP.',
      results, noJavaScriptHeading: visibleHeading,
    }, null, 2));
  } finally { await browser.close(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
