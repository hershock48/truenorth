/*
  /api/order, as main actually behaves.

  Two things are pinned above all: ordering off means the endpoint refuses
  BEFORE it reads a body (ORDERING_LIVE in site.ts), and when it is on,
  names and prices come from the menu, never from the post.
*/
import test from "node:test";
import assert from "node:assert/strict";
import { load, capturedConsole, nextServer } from "./_load.mjs";

const SHOPS = [
  { key: "marshall", name: "Marshall", street: "1 Fixture St", phone: "(269) 000-0000" },
  { key: "battlecreek", name: "Battle Creek", street: "2 Fixture St", phone: "(269) 000-0001" },
];
const ITEMS = [
  { key: "pint", name: "Homemade pint", price: "$10" },
  { key: "ss-pint", name: "Soft serve pint", price: "$8", at: ["marshall"] },
];
const CONFIGURED = { RESEND_API_KEY: "fixture-key", INQUIRY_TO: "shop@example.invalid" };

function orderRoute({ live = true, reply = { data: { id: "ok" }, error: null }, env = CONFIGURED } = {}) {
  const attempts = [];
  const { errors, console } = capturedConsole();
  const route = load("src/app/api/order/route.ts", {
    mocks: {
      "next/server": nextServer,
      resend: { Resend: class { emails = { send: async (p) => (attempts.push(p), reply) }; } },
      "@/data/site": { ORDERING_LIVE: live, locations: SHOPS },
      "@/data/menu": { orderables: ITEMS },
    },
    env,
    globals: { console },
  });
  return { POST: route.POST, attempts, errors };
}

const ORDER = { store: "marshall", name: "Ann", phone: "555", "qty-pint": "2" };
const json = (body = ORDER) =>
  new Request("https://fixture.invalid/api/order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const form = (fields = ORDER) =>
  new Request("https://fixture.invalid/api/order", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });

test("ordering off: both formats get a 404 and the body is never read", async () => {
  const r = orderRoute({ live: false });
  const unreadable = {
    headers: new Headers({ "content-type": "application/json" }),
    json: () => { throw new Error("the body must not be read while ordering is off"); },
    formData: () => { throw new Error("the body must not be read while ordering is off"); },
  };
  const res = await r.POST(unreadable);
  assert.equal(res.status, 404);
  assert.match((await res.json()).error, /not open yet/);
  const page = await r.POST({ ...unreadable, headers: new Headers({ "content-type": "application/x-www-form-urlencoded" }) });
  assert.equal(page.status, 404);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.equal(r.attempts.length, 0);
});

test("ordering on: one order is one email with the shop, the lines, and an estimate priced from the menu", async () => {
  const r = orderRoute();
  const res = await r.POST(json());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(r.attempts.length, 1);
  const mail = r.attempts[0];
  assert.match(mail.subject, /Marshall/);
  assert.match(mail.text, /2 × Homemade pint \(\$10\)/);
  assert.match(mail.text, /Estimated total: \$20\.00/);
  assert.match(mail.text, /1 Fixture St/);
});

test("prices and names cannot be supplied by the post", async () => {
  const r = orderRoute();
  await r.POST(json({ ...ORDER, price: "$1", name: "Ann", "qty-pint": "1", "qty-free-cake": "9" }));
  assert.match(r.attempts[0].text, /1 × Homemade pint \(\$10\)/);
  assert.doesNotMatch(r.attempts[0].text, /free-cake|\$1\)/);
});

test("quantities clamp to 0..20 and junk counts as zero", async () => {
  const r = orderRoute();
  await r.POST(json({ ...ORDER, "qty-pint": "99" }));
  assert.match(r.attempts[0].text, /20 × Homemade pint/);
  const res = await r.POST(json({ ...ORDER, "qty-pint": "<b>2</b>" }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /at least one thing/);
});

test("an item the chosen shop does not carry is refused, not silently accepted", async () => {
  const r = orderRoute();
  const res = await r.POST(json({ ...ORDER, store: "battlecreek", "qty-ss-pint": "1" }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /Soft serve pint is not available at the Battle Creek shop/);
  assert.equal(r.attempts.length, 0);
});

test("validation: a known shop, a name, and a phone or email", async () => {
  const r = orderRoute();
  assert.equal((await r.POST(json({ ...ORDER, store: "detroit" }))).status, 400);
  assert.equal((await r.POST(json({ ...ORDER, name: "" }))).status, 400);
  assert.equal((await r.POST(json({ ...ORDER, phone: "" }))).status, 400);
  assert.equal((await r.POST(json({ ...ORDER, phone: "", email: "ann@example.invalid" }))).status, 200);
});

test("success is a Resend acceptance id, nothing less", async () => {
  for (const reply of [{}, { data: {}, error: null }, { data: null, error: { message: "refused" } }]) {
    const r = orderRoute({ reply });
    const res = await r.POST(json());
    assert.equal(res.status, 502);
    assert.match((await res.json()).error, /\(269\) 000-0000/);
  }
});

test("the no-JS path: success is a relative redirect to /thanks, failure hands the order back to fix", async () => {
  const ok = await orderRoute().POST(form());
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get("location"), "/thanks");

  const bad = await orderRoute().POST(form({ ...ORDER, name: "", flavors: "<script>x</script>" }));
  assert.equal(bad.status, 400);
  const html = await bad.text();
  assert.match(html, /<input type="hidden" name="store" value="marshall">/);
  assert.match(html, /<input type="hidden" name="qty-pint" value="2">/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>x/);
});

test("the honeypot is accepted and discarded without a send", async () => {
  const r = orderRoute();
  const res = await r.POST(json({ ...ORDER, company: "bot" }));
  assert.equal(res.status, 200);
  assert.equal(r.attempts.length, 0);
});

test("unconfigured mail answers 503 naming the shop's phone and logs the order", async () => {
  const r = orderRoute({ env: {} });
  const res = await r.POST(json());
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /\(269\) 000-0000/);
  assert.ok(r.errors.some((l) => l.includes("mail not configured") && l.includes("Homemade pint")));
  assert.equal(r.attempts.length, 0);
});

test("ORDER_TO wins over INQUIRY_TO, and INQUIRY_TO is the fallback", async () => {
  const a = orderRoute({ env: { ...CONFIGURED, ORDER_TO: "orders@example.invalid" } });
  await a.POST(json());
  assert.deepEqual([...a.attempts[0].to], ["orders@example.invalid"]);
  const b = orderRoute();
  await b.POST(json());
  assert.deepEqual([...b.attempts[0].to], ["shop@example.invalid"]);
});
