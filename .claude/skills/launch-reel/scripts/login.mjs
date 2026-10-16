#!/usr/bin/env node
// Open a visible Chrome window with a persistent profile so the USER can sign in themselves.
// The session is saved in <profileDir>; pass the same dir to capture.mjs/shots.mjs via --profile.
// The script exits when the user closes the window.
//
// Usage: node .claude/skills/launch-reel/scripts/login.mjs <url> <profileDir>

import { chromium } from "playwright-core";
import fs from "node:fs";

const [url, profileDir] = process.argv.slice(2);
if (!url || !profileDir) {
  console.error("usage: login.mjs <url> <profileDir>");
  process.exit(1);
}
const executablePath = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome"]
  .filter(Boolean)
  .find((p) => fs.existsSync(p));

const context = await chromium.launchPersistentContext(profileDir, {
  executablePath,
  headless: false,
  viewport: null,
  args: ["--disable-blink-features=AutomationControlled", "--window-size=1440,960"],
});
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(url).catch(() => {});
console.log("Sign in in the opened window, then close it.");
await new Promise((resolve) => context.on("close", resolve));
console.log("Window closed; session saved to", profileDir);
