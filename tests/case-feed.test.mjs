/*
  The live flavor board: what a Scooplist answer must look like to be used,
  and the one rule that never bends: anything short of a valid feed renders
  the static board from flavors.ts, never an empty page.
*/
import test from "node:test";
import assert from "node:assert/strict";
import { load, capturedConsole } from "./_load.mjs";

const contract = load("src/data/caseFeed.ts");

const feed = (shop = "marshall", extra = {}) => ({
  location: { id: shop, name: "Fixture" },
  updatedAt: 1_760_000_000_000,
  boards: [
    {
      key: "handscooped",
      label: "Hand-Scooped",
      flavors: [
        { name: "Vanilla", description: "", allergens: [], tags: [] },
        { name: "Butter Pecan", description: "Toasted.", allergens: ["nuts", "milk"], tags: [] },
      ],
    },
  ],
  onDeck: [],
  ...extra,
});

test("validator: a real feed passes, extra v1 fields are ignored, an empty case is valid", () => {
  const ok = contract.validateCaseFeed(feed("marshall", { onDeck: [{ name: "x" }] }), "marshall", 1_760_000_100_000);
  assert.equal(ok.boards[0].flavors.length, 2);
  assert.deepEqual([...ok.boards[0].flavors[1].allergens], ["nuts", "milk"]);
  assert.equal(contract.validateCaseFeed({ ...feed(), boards: [] }, "marshall", 1_760_000_100_000).boards.length, 0);
  assert.equal(contract.validateCaseFeed({ ...feed(), updatedAt: null }, "marshall").updatedAt, null);
});

test("validator: wrong shop, malformed shapes, duplicates and future timestamps are refused", () => {
  const now = 1_760_000_100_000;
  const bad = [
    ["not an object", null],
    ["empty object", {}],
    ["the other shop's case", feed("battlecreek")],
    ["an error body with a 200", { error: "Unknown location." }],
    ["updatedAt from the far future", { ...feed(), updatedAt: now + 60 * 60_000 }],
    ["updatedAt as a string", { ...feed(), updatedAt: "yesterday" }],
    ["a board twice", { ...feed(), boards: [feed().boards[0], feed().boards[0]] }],
    ["a flavor twice", { ...feed(), boards: [{ ...feed().boards[0], flavors: [feed().boards[0].flavors[0], feed().boards[0].flavors[0]] }] }],
    ["allergens that are not a list", { ...feed(), boards: [{ ...feed().boards[0], flavors: [{ name: "X", description: "", allergens: "nuts", tags: [] }] }] }],
    ["a nameless flavor", { ...feed(), boards: [{ ...feed().boards[0], flavors: [{ name: "  ", description: "", allergens: [], tags: [] }] }] }],
    ["too many boards", { ...feed(), boards: Array.from({ length: 21 }, (_, i) => ({ key: `b${i}`, label: "B", flavors: [] })) }],
  ];
  for (const [label, value] of bad) {
    assert.throws(() => contract.validateCaseFeed(value, "marshall", now), label);
  }
});

const STATIC = [
  { key: "handscooped", title: "Homemade", subtitle: "Hand-scooped", flavors: [{ name: "Static Flavor" }] },
];

/** liveCase.ts with the feed URL set and `fetch` answering as the test says. */
function live({ reply = async () => feed(), env = { SCOOPLIST_FEED_URL: "https://feed.example.invalid/" } } = {}) {
  const { errors, console } = capturedConsole();
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    const shop = String(url).split("/").at(-1);
    const r = await reply(shop, url);
    if (r instanceof Response) return r;
    return { ok: true, status: 200, text: async () => (typeof r === "string" ? r : JSON.stringify(r)) };
  };
  const mod = load("src/data/liveCase.ts", {
    mocks: {
      "@/data/caseFeed": contract,
      "@/data/flavors": { boards: STATIC, boardsFor: () => STATIC, boardUpdatedLabel: "August 21" },
      "@/data/site": { locations: [{ key: "marshall", name: "Marshall" }, { key: "battlecreek", name: "Battle Creek" }] },
    },
    env,
    globals: { fetch, console },
  });
  return { ...mod, calls, errors };
}

test("a valid feed renders live, with only the badges this site knows", async () => {
  const m = live();
  const data = await m.caseFor("marshall");
  assert.equal(data.live, true);
  assert.equal(m.calls[0], "https://feed.example.invalid/api/v1/case/marshall");
  assert.deepEqual([...data.boards.map((b) => b.key)], ["handscooped"]);
  assert.deepEqual([...data.boards[0].flavors[1].allergens], ["nuts"]);
  assert.equal(data.boards[0].flavors[1].note, "Toasted.");
  assert.equal(data.updatedLabel, "October 9");
});

test("no feed URL means the static board, and fetch is never called", async () => {
  const m = live({ env: {} });
  const data = await m.caseFor("marshall");
  assert.equal(data.live, false);
  assert.equal(data.boards[0].flavors[0].name, "Static Flavor");
  assert.equal(data.updatedLabel, "August 21");
  assert.equal(m.calls.length, 0);
});

for (const [label, reply] of [
  ["a 503", async () => new Response("down", { status: 503 })],
  ["a thrown fetch (timeout, DNS)", async () => { throw new Error("aborted"); }],
  ["a body that is not JSON", async () => "<html>maintenance</html>"],
  ["an error object with a 200", async () => ({ error: "Unknown location." })],
  ["the other shop's case", async () => feed("battlecreek")],
  ["a body over the size cap", async () => "x".repeat(contract.MAX_FEED_BYTES + 1)],
]) {
  test(`${label} renders the static board, never an empty one`, async () => {
    const m = live({ reply });
    const data = await m.caseFor("marshall");
    assert.equal(data.live, false);
    assert.equal(data.boards[0].flavors[0].name, "Static Flavor");
  });
}

test("a rejected feed is logged with the reason", async () => {
  const m = live({ reply: async () => feed("battlecreek") });
  await m.caseFor("marshall");
  assert.ok(m.errors.some((l) => l.includes("rejected") && l.includes("battlecreek")));
});

test("the merged all-shops view is live only when every shop answers", async () => {
  const half = live({ reply: async (shop) => (shop === "marshall" ? feed("marshall") : new Response("", { status: 500 })) });
  const data = await half.caseAll();
  assert.equal(data.live, false);
  assert.equal(data.boards[0].flavors[0].name, "Static Flavor");

  const both = live({
    reply: async (shop) =>
      feed(shop, {
        boards: [
          {
            key: "handscooped",
            label: "Hand-Scooped",
            flavors: [
              { name: "Everywhere", description: "", allergens: [], tags: [] },
              ...(shop === "marshall" ? [{ name: "Only Here", description: "", allergens: [], tags: [] }] : []),
            ],
          },
        ],
      }),
  });
  const merged = await both.caseAll();
  assert.equal(merged.live, true);
  const byName = Object.fromEntries(merged.boards[0].flavors.map((f) => [f.name, f.at]));
  assert.equal(byName["Everywhere"], undefined);
  assert.deepEqual([...byName["Only Here"]], ["marshall"]);
});
