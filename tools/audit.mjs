/**
 * The standing Glazed Web auditor.
 *
 * Checks every route at a phone and a desktop width for: axe violations against
 * WCAG 2.0/2.1 A and AA, horizontal overflow, console and page errors, and any
 * 4xx/5xx the page requests. Reports one summary at the end.
 *
 * Run this rather than writing a fresh one. It has been sharpened over several
 * rounds and each of the non-obvious bits below exists because a naive version
 * gave a wrong answer:
 *
 *  - It scrolls the whole page before auditing, because reveal-on-scroll content
 *    is invisible to axe until it has been revealed.
 *  - It compares documentElement.scrollWidth to clientWidth for overflow rather
 *    than looking for wide elements. Elements wider than the viewport inside an
 *    overflow-hidden parent are completely normal, a marquee track, a scaled
 *    hero image, and flagging them produces a page of false positives.
 *  - It listens for pageerror as well as console errors, because an uncaught
 *    exception during hydration does not always reach the console listener.
 *
 * Usage:
 *   node audit.mjs --base http://127.0.0.1:4490 --routes /,/about,/contact
 *   node audit.mjs                      # defaults below
 *
 * Point it at a locally served PRODUCTION build (`npm run build` then
 * `npx next start`), never the dev server: dev serves different CSS and hides
 * build-time failures. And read the stale-server section of gotchas.md first, 
 * the most common cause of an alarming audit is that the stylesheet 404'd and the
 * page rendered unstyled.
 *
 * Requires axe-core in the working directory's node_modules, and playwright-core
 * resolvable from this script's location. Install both together if you install
 * either: `npm install axe-core --no-save` on its own has pruned playwright-core.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = arg("base", "http://127.0.0.1:4490");
const ROUTES = arg("routes", "/").split(",").map((r) => r.trim()).filter(Boolean);
const WIDTHS = [
  [390, 844, "phone"],
  [1440, 900, "desk"],
];

// axe is injected into the page rather than imported, so it runs in the page's
// own context against the real rendered DOM.
// Resolve axe from the script's own location upward as well as from the working
// directory, so these work whether you run `node tools/audit.mjs` from the repo root
// or `node audit.mjs` from inside tools/.
const here = path.dirname(new URL(import.meta.url).pathname);
const axePath = [
  path.join(process.cwd(), "node_modules/axe-core/axe.min.js"),
  path.join(here, "node_modules/axe-core/axe.min.js"),
  path.join(here, "../node_modules/axe-core/axe.min.js"),
  path.join(here, "../../node_modules/axe-core/axe.min.js"),
].find((p) => fs.existsSync(p));
if (!axePath) {
  console.error("axe-core not found. Install it in the working directory:\n  npm install axe-core playwright-core --no-save");
  process.exit(1);
}
const axe = fs.readFileSync(axePath, "utf8");

const host = new URL(BASE).host;
// CHROMIUM env wins so this runs outside the Linux sandbox too (e.g. Windows:
// CHROMIUM="C:\Program Files\Google\Chrome\Application\chrome.exe").
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium",
});

let violations = 0;
const overflow = [];
const errors = [];
const bad = [];
const unreachable = [];

for (const route of ROUTES) {
  for (const [w, h, tag] of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    page.on("console", (m) => m.type() === "error" && errors.push(`${route} ${tag}: ${m.text().slice(0, 120)}`));
    page.on("pageerror", (e) => errors.push(`${route} ${tag}: uncaught ${e.message.slice(0, 120)}`));
    page.on("response", (r) => {
      if (r.status() >= 400 && new URL(r.url()).host === host) {
        bad.push(`${route}: ${r.status()} ${r.url().slice(-60)}`);
      }
    });

    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 });
    } catch (e) {
      unreachable.push(`${route} @${w}: ${e.message.split("\n")[0].slice(0, 90)}`);
      await page.close();
      continue;
    }
    await page.waitForTimeout(500);

    // Reveal-on-scroll content does not exist for axe until it has been revealed.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);

    const ov = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    if (ov.sw > ov.cw + 1) overflow.push(`${route} @${w}: ${ov.sw} > ${ov.cw}`);

    await page.addScriptTag({ content: axe });
    const found = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      });
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        n: v.nodes.length,
        target: v.nodes[0]?.target?.[0]?.slice(0, 70),
      }));
    });
    if (found.length) {
      violations += found.reduce((s, v) => s + v.n, 0);
      console.log(`\n${route} @${w}`);
      for (const v of found) {
        console.log(`   ${String(v.impact).padEnd(8)} ${v.id} x${v.n}  ${v.target || ""}`);
      }
    }
    await page.close();
  }
}

const list = (a, n = 5) => (a.length ? [...new Set(a)].slice(0, n).join(" | ") : "none");
console.log(`\n=== ${BASE}, ${ROUTES.length} route(s) at ${WIDTHS.map((x) => x[0]).join(" and ")}px ===`);
console.log(`axe violations total: ${violations}`);
console.log(`horizontal overflow:  ${list(overflow)}`);
console.log(`console errors:       ${list(errors)}`);
console.log(`4xx/5xx:              ${list(bad)}`);
if (unreachable.length) console.log(`UNREACHABLE:          ${list(unreachable)}`);

await browser.close();
process.exit(violations || overflow.length || errors.length || bad.length || unreachable.length ? 1 : 0);
