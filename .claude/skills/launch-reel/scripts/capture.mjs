#!/usr/bin/env node
// Capture high-res screenshots (and optional full-page scroll strips) of a URL
// for use as real product footage in a demo video.
//
// Usage:
//   node .claude/skills/launch-reel/scripts/capture.mjs <url> <outDir> [--name hero] [--profile dir] [--full] [--dark] [--width 1440] [--height 900] [--wait 2500]
//
// Prints a JSON summary (files + extracted brand tokens) to stdout.

import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const url = args[0];
const outDir = args[1];
if (!url || !outDir) {
  console.error("usage: capture.mjs <url> <outDir> [--name n] [--full] [--dark] [--width w] [--height h] [--wait ms]");
  process.exit(1);
}
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};
const name = flag("name", "hero");
const width = Number(flag("width", 1440));
const height = Number(flag("height", 900));
const wait = Number(flag("wait", 2500));

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("No Chrome found. Set CHROME_PATH.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
// --profile <dir> reuses a session the user signed into via login.mjs.
const profile = flag("profile", null);
const contextOptions = {
  viewport: { width, height },
  deviceScaleFactor: 2,
  colorScheme: flag("dark", false) ? "dark" : "light",
};
const browser = profile ? null : await chromium.launch({ executablePath, headless: true });
const context = profile
  ? await chromium.launchPersistentContext(profile, { executablePath, headless: true, ...contextOptions })
  : await browser.newContext(contextOptions);
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(wait);

const files = [];
const viewportFile = path.join(outDir, `${name}.png`);
await page.screenshot({ path: viewportFile });
files.push(viewportFile);

if (flag("full", false)) {
  const fullFile = path.join(outDir, `${name}-full.png`);
  await page.screenshot({ path: fullFile, fullPage: true });
  files.push(fullFile);
}

// Brand tokens: the most common accent colours on buttons/links, fonts, title, headline, logo.
const brand = await page.evaluate(() => {
  const count = (arr) => Object.entries(arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const btns = [...document.querySelectorAll("button, a")].filter((e) => e.offsetWidth > 0);
  const bgs = btns.map((e) => getComputedStyle(e).backgroundColor).filter((c) => !/rgba\(0, 0, 0, 0\)|transparent|oklch\(1 0 0\)|rgb\(255, 255, 255\)/.test(c));
  const h1 = document.querySelector("h1");
  const logo = document.querySelector('header img, nav img, a[href="/"] img');
  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content ?? null,
    headline: h1?.innerText ?? null,
    accentColors: count(bgs).slice(0, 3),
    textColor: h1 ? getComputedStyle(h1).color : null,
    bodyFont: getComputedStyle(document.body).fontFamily,
    headingFont: h1 ? getComputedStyle(h1).fontFamily : null,
    logo: logo?.src ?? null,
    ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
  };
});

await (browser ?? context).close();
console.log(JSON.stringify({ url, files, brand }, null, 2));
