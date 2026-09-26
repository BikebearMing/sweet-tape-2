/* Tablet audit filmstrip shooter.
 * Scrolls each page once, top to bottom, at human pace, capturing one frame
 * per viewport-height. Usage:
 *   node shoot.mjs <outRoot> [pageFilter] [viewportFilter]
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import path from "node:path";

const EXE =
  "/Users/karminglaw/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BASE = "http://localhost:3000";

const PAGES = [
  { name: "home", url: "/" },
  { name: "about", url: "/about" },
  { name: "news", url: "/news" },
  { name: "article", url: "/news/same-tape-three-generations-finally-a-face" },
  { name: "products", url: "/products" },
  { name: "product-opp", url: "/products/opp" },
  { name: "contact", url: "/contact" },
];

const VIEWPORTS = [
  { name: "768x1024", w: 768, h: 1024, touch: true },
  { name: "820x1180", w: 820, h: 1180, touch: true },
  { name: "834x1194", w: 834, h: 1194, touch: true },
  { name: "1024x1366", w: 1024, h: 1366, touch: true },
  { name: "1024x768", w: 1024, h: 768, touch: true },
  { name: "1180x820", w: 1180, h: 820, touch: true },
  { name: "1366x1024", w: 1366, h: 1024, touch: true },
  { name: "800x1280", w: 800, h: 1280, touch: true },
  { name: "1440x900", w: 1440, h: 900, touch: false },
  { name: "390x844", w: 390, h: 844, touch: true, mobile: true },
];

const outRoot = process.argv[2];
const pageFilter = process.argv[3]; // comma-separated substrings, or empty
const vpFilter = process.argv[4];
const matches = (filter, name) =>
  !filter || filter.split(",").some((f) => name.includes(f));
if (!outRoot) {
  console.error("usage: node shoot.mjs <outRoot> [pageFilter] [vpFilter]");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: EXE });

for (const vp of VIEWPORTS) {
  if (!matches(vpFilter, vp.name)) continue;
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    hasTouch: !!vp.touch,
    isMobile: !!vp.mobile,
    userAgent: vp.touch
      ? "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      : undefined,
  });

  for (const pg of PAGES) {
    if (!matches(pageFilter, pg.name)) continue;
    const dir = path.join(outRoot, pg.name, vp.name);
    mkdirSync(dir, { recursive: true });
    const page = await context.newPage();
    try {
      await page.goto(BASE + pg.url, { waitUntil: "networkidle", timeout: 45000 });
      // wait for the preloader to release the page
      await page
        .waitForSelector("html:not([data-loading])", { timeout: 30000 })
        .catch(() => console.warn(`  ! preloader never released on ${pg.name}`));
      await sleep(1500); // reveal animations after handoff

      let frame = 0;
      await page.screenshot({ path: path.join(dir, `${String(frame).padStart(2, "0")}.png`) });

      // one pass down, human pace, one frame per viewport-height
      for (let i = 0; i < 30; i++) {
        const { y, max } = await page.evaluate(() => ({
          y: window.scrollY,
          max: document.documentElement.scrollHeight - window.innerHeight,
        }));
        if (y >= max - 4) break;
        // wheel in a few ticks so smooth scroll + scrub triggers behave like a reader
        for (let t = 0; t < 4; t++) {
          await page.mouse.wheel(0, vp.h / 4);
          await sleep(90);
        }
        await sleep(700); // let scrub/reveals settle
        frame++;
        await page.screenshot({ path: path.join(dir, `${String(frame).padStart(2, "0")}.png`) });
      }
      console.log(`ok ${pg.name} @ ${vp.name} (${frame + 1} frames)`);
    } catch (e) {
      console.error(`FAIL ${pg.name} @ ${vp.name}: ${e.message}`);
    } finally {
      await page.close();
    }
  }
  await context.close();
}

await browser.close();
