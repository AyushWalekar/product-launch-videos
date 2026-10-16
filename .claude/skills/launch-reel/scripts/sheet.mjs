// Contact sheet of any video (reference or your render) by seeking in headless Chrome; Remotion's ffmpeg has no tile filter.
// usage: node .claude/skills/launch-reel/scripts/sheet.mjs <video> <outPrefix> <stepSec> <perSheet> [startSec] [endSec] [cellW]
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
const [video, outPrefix, step = "0.5", per = "24", start = "0", end = "", cellW = "320"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 2000, height: 1400 } });
const html = path.join(path.dirname(video), "sheet.html");
fs.writeFileSync(html, `<html><body style="margin:0;background:#111"><video id=v src="${path.basename(video)}" muted playsinline></video><canvas id=c></canvas></body></html>`);
await page.goto("file://" + html);
await page.waitForFunction(() => document.getElementById("v").readyState >= 1);
const dur = await page.evaluate(() => document.getElementById("v").duration);
const times = [];
for (let t = Number(start); t < (end ? Number(end) : dur) - 0.01; t += Number(step)) times.push(+t.toFixed(3));
const P = Number(per), W = Number(cellW), H = Math.round(W * 9 / 16), cols = 6;
for (let s = 0; s * P < times.length; s++) {
  const chunk = times.slice(s * P, s * P + P);
  const rows = Math.ceil(chunk.length / cols);
  const data = await page.evaluate(async ({ chunk, W, H, cols, rows }) => {
    const v = document.getElementById("v"), c = document.getElementById("c");
    c.width = W * cols; c.height = (H + 18) * rows;
    const x = c.getContext("2d"); x.fillStyle = "#111"; x.fillRect(0, 0, c.width, c.height);
    for (const [i, t] of chunk.entries()) {
      await new Promise((r) => { v.onseeked = r; v.currentTime = t; });
      const cx = (i % cols) * W, cy = Math.floor(i / cols) * (H + 18);
      x.drawImage(v, cx, cy + 18, W, H);
      x.fillStyle = "#ff0"; x.font = "14px monospace"; x.fillText(t.toFixed(2) + "s", cx + 4, cy + 14);
    }
    return c.toDataURL("image/jpeg", 0.85);
  }, { chunk, W, H, cols, rows });
  const out = `${outPrefix}${String(s).padStart(2, "0")}.jpg`;
  fs.writeFileSync(out, Buffer.from(data.split(",")[1], "base64"));
  console.log(out);
}
await browser.close();
