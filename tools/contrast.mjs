/**
 * Which colour pairs on this site fail WCAG contrast, deduplicated and counted?
 *
 * axe reports one violation per node, which buries the useful information: a single
 * bad token can produce fifty nodes, and fifty nodes across five tokens look the
 * same in a raw report. Grouping by foreground-on-background shows you the handful
 * of decisions that actually need changing.
 *
 * That grouping is what surfaced the most useful accessibility finding on this
 * account: a heading contrast failure looked like one bad pairing, but every
 * heading on every coloured section shared it, because a single base-layer rule put
 * an explicit colour on h1-h4 and an explicit colour beats an inherited one. One
 * rule, one deletion, all of them fixed. Darkening the brand token would have fixed
 * one instance and made another worse.
 *
 * Usage:
 *   node contrast.mjs --base http://127.0.0.1:4490 --routes /,/about,/contact
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const BASE = arg("base", "http://127.0.0.1:4490");
const ROUTES = arg("routes", "/").split(",").map((r) => r.trim()).filter(Boolean);

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
  console.error("axe-core not found. See tools/README.md for the install line.");
  process.exit(1);
}
const axe = fs.readFileSync(axePath, "utf8");

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const grouped = new Map();

for (const route of ROUTES) {
  for (const w of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    // Reveal-on-scroll content does not exist for axe until it has been revealed.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
    });
    await page.addScriptTag({ content: axe });
    const rows = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: ["color-contrast"] });
      const out = [];
      for (const v of r.violations)
        for (const n of v.nodes) {
          const d = n.any?.[0]?.data;
          if (d) out.push({ ...d, sample: n.target?.[0]?.slice(0, 55) });
        }
      return out;
    });
    for (const d of rows) {
      const key = `${d.fgColor} on ${d.bgColor}`;
      if (!grouped.has(key)) grouped.set(key, { ...d, count: 0, where: new Set() });
      const g = grouped.get(key);
      g.count++;
      g.where.add(`${route}@${w}`);
    }
    await page.close();
  }
}

const list = [...grouped.entries()].sort((a, b) => b[1].count - a[1].count);
if (!list.length) {
  console.log(`No contrast failures across ${ROUTES.length} route(s).`);
} else {
  console.log(`Failing colour pairs, most instances first:\n`);
  for (const [pair, g] of list) {
    console.log(`  ${pair}`);
    console.log(`    ratio ${g.contrastRatio}  needs ${g.expectedContrastRatio}  ${g.count} node(s)`);
    console.log(`    seen on: ${[...g.where].join(", ")}`);
    console.log(`    e.g. ${g.sample}\n`);
  }
  console.log("Group by the pair, not the node: one bad token usually explains most of the list.");
}
await browser.close();
process.exit(list.length ? 1 : 0);
