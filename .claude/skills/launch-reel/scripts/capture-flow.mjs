#!/usr/bin/env node
// Captures a sequence of real product screens (clicking through the app like a user) and prints the
// CSS-px centre of any element you name, for cursor targets / typing rects in reel.json.
//
// Usage: node .claude/skills/launch-reel/scripts/capture-flow.mjs <flow.json> [--profile <dir>]
// flow.json:
// {
//   "base": "https://app.example.com",
//   "out": "public/reel/acme",
//   "viewport": [1440, 900],
//   "dark": false,
//   "replaceText": [["Jane Real-Name", "Alex Demo"], ["jane@corp.com", "alex@acme.com"]],  // presentation only
//   "steps": [
//     { "goto": "/dashboard", "wait": 2500, "shot": "home", "locate": ["Start", "New report"] },
//     { "click": "New report", "wait": 3000, "shot": "editor", "locate": ["Submit"] },
//     { "click": "Option B", "frame": true, "wait": 600, "shot": "editor-picked" },
//     { "scrollTo": "Pricing", "shot": "pricing", "fullPage": false }
//   ]
// }
// - "frame": true runs click/locate inside the first iframe (embedded apps).
// - Never submit forms or change account settings from a flow: capture states, don't create data.
// - Sign-in: run login.mjs first and pass the same --profile (copy it if the login window is still open).

import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flowPath = args[0];
if (!flowPath) {
  console.error("usage: capture-flow.mjs <flow.json> [--profile <dir>]");
  process.exit(1);
}
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? null : args[i + 1];
};
const flow = JSON.parse(fs.readFileSync(flowPath, "utf8"));
const [w, h] = flow.viewport ?? [1440, 900];
const OUT = path.resolve(flow.out);
fs.mkdirSync(OUT, { recursive: true });
const executablePath = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => p && fs.existsSync(p));
const opts = { viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: flow.dark ? "dark" : "light" };
const profile = flag("profile");
const browser = profile ? null : await chromium.launch({ executablePath, headless: true });
const context = profile ? await chromium.launchPersistentContext(profile, { executablePath, headless: true, ...opts }) : await browser.newContext(opts);
const page = await context.newPage();
if (flow.dark) await page.addInitScript(() => localStorage.setItem("theme", "dark"));
await page.addInitScript(() => {
  const s = document.createElement("style");
  s.textContent = "nextjs-portal, [data-nextjs-toast], #__next-build-watcher, [data-sonner-toaster] { display: none !important; }";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(s));
});

const settle = async (ms = 1500) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
};
const scope = (step) => (step.frame ? page.frameLocator("iframe").first() : page);
// First *visible* element with this text (skips <title>, hidden menus, offscreen duplicates).
const byText = (step, text) => scope(step).getByText(text, { exact: false }).locator("visible=true").first();
const replace = async () => {
  if (!flow.replaceText?.length) return;
  for (const f of [page.mainFrame(), ...page.frames()]) {
    await f
      .evaluate((pairs) => {
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walk.nextNode()) nodes.push(walk.currentNode);
        for (const n of nodes) for (const [a, b] of pairs) if (n.textContent.includes(a)) n.textContent = n.textContent.split(a).join(b);
      }, flow.replaceText)
      .catch(() => {});
  }
};
const locate = async (step) => {
  for (const text of step.locate ?? []) {
    const box = await byText(step, text).boundingBox({ timeout: 3000 }).catch(() => null);
    if (!box) {
      console.log(`    locate "${text}": not found`);
      continue;
    }
    // Playwright reports boxes in page CSS px, also for elements inside iframes.
    const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
    console.log(`    locate "${text}": center [${x}, ${y}]  box [${Math.round(box.x)}, ${Math.round(box.y)}, ${Math.round(box.width)}, ${Math.round(box.height)}]`);
  }
};

for (const [i, step] of flow.steps.entries()) {
  console.log(`step ${i + 1}: ${JSON.stringify({ goto: step.goto, click: step.click, scrollTo: step.scrollTo, shot: step.shot })}`);
  if (step.goto) await page.goto(new URL(step.goto, flow.base).href, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  if (step.click) await byText(step, step.click).click().catch((e) => console.log(`    click failed: ${e.message.split("\n")[0]}`));
  if (step.scrollTo)
    await byText(step, step.scrollTo)
      .evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40))
      .catch(() => {});
  await settle(step.wait ?? 1500);
  await replace();
  if (step.locate) await locate(step);
  if (step.shot) {
    const file = path.join(OUT, `${step.shot}.png`);
    await page.screenshot({ path: file, fullPage: !!step.fullPage });
    console.log(`    → ${path.relative(process.cwd(), file)}`);
  }
}
await (browser ?? context).close();
