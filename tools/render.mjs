/**
 * Renders the proposal's link card and screenshots the proposal itself, so it
 * gets LOOKED at before anything ships (render-before-shipping, glaze.md).
 *
 *   1. public/pitch/truenorth/og-card.html  ->  pitch/darkhorse/og.jpg   (1200x630, JPEG)
 *      plus a center 630x630 crop to OUT, which is what iOS shows (glaze/link-cards.md)
 *   2. public/pitch/truenorth/index.html at 1280, 390 and 320 wide: page errors,
 *      horizontal overflow, broken images, and screenshots at several scroll
 *      positions written to OUT.
 *
 * Run from the glazedweb repo so playwright-core resolves from its node_modules:
 *   cd C:/Users/hersh/Glazedweb/glazedweb && node C:/Users/hersh/Glazedweb/truenorth/tools/render.mjs --out <dir>
 *
 * The browser loader is the shared one in glaze/scripts/lib/browser.mjs, imported by
 * absolute path rather than copied, for the reason written at the top of that file.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const LIB = pathToFileURL("C:/Users/hersh/Glazedweb/glazedweb/glaze/scripts/lib/browser.mjs").href;
const { loadChromium, launchOpts, arg } = await import(LIB);

const ROOT = "C:/Users/hersh/Glazedweb/truenorth";
const PITCH = path.join(ROOT, "public/pitch/truenorth");
const OUT = arg("out", path.join(ROOT, "tools/out"));
fs.mkdirSync(OUT, { recursive: true });

const chromium = await loadChromium();
const browser = await chromium.launch({ headless: true, ...launchOpts() });
const summary = {};

// 1. The card.
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(PITCH, "og-card.html")).href, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const og = path.join(PITCH, "og.jpg");
  await page.screenshot({ path: og, type: "jpeg", quality: 86 });
  await page.screenshot({ path: path.join(OUT, "og-center-630.jpg"), type: "jpeg", quality: 86, clip: { x: 285, y: 0, width: 630, height: 630 } });
  summary.og = { bytes: fs.statSync(og).size };
  await page.close();
}

// 2. The proposal.
const url = pathToFileURL(path.join(PITCH, "index.html")).href;
for (const [w, h, name] of [[1280, 900, "desk"], [390, 844, "phone"], [320, 568, "narrow"]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160)); });
  await page.goto(url, { waitUntil: "load" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto !important}" });
  await page.waitForTimeout(400);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const stops = name === "desk" ? [0, 0.12, 0.3, 0.48, 0.62, 0.78, 0.92] : [0, 0.1, 0.35, 0.6, 0.85];
  for (let i = 0; i < stops.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * stops[i]));
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, `${name}-${i}.png`) });
  }
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.slice(-60)),
    h1: document.querySelector("h1")?.innerText.replace(/\n/g, " "),
    title: document.title,
    links: [...document.querySelectorAll("a[href^='http']")].map((a) => a.href),
    emDash: (document.body.innerText.match(/[\u2014\u2013]/g) || []).length,
  }));
  summary[name] = { ...m, links: undefined, linkCount: m.links.length, errors, overflow: m.scrollWidth > m.clientWidth };
  if (name === "desk") summary.externalLinks = [...new Set(m.links)];
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
