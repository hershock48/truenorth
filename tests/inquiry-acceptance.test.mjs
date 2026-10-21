/*
  What /api/inquiry is allowed to call a success.

  Resend's SDK answers with a union: {data:{id}, error:null} when it took the
  message, {data:null, error} when it refused. Reading only `error` treated a
  2xx carrying neither as a send, and the visitor was told "we got it" while
  nothing reached the inbox. Fixed in #9; pinned here (test from #8).
*/
import test from "node:test";
import assert from "node:assert/strict";
import { load, capturedConsole, nextServer } from "./_load.mjs";

const CONFIGURED = { RESEND_API_KEY: "fixture-key", INQUIRY_TO: "shop@example.invalid" };

function inquiryRoute(reply, env = CONFIGURED) {
  const attempts = [];
  const { errors, console } = capturedConsole();
  const route = load("src/app/api/inquiry/route.ts", {
    mocks: {
      "next/server": nextServer,
      resend: {
        Resend: class {
          emails = { send: async (payload) => (attempts.push(payload), reply) };
        },
      },
      "@/data/site": { site: { cateringPhone: "(269) 000-0000", email: "shop@example.invalid" } },
    },
    env,
    globals: { console },
  });
  return { POST: route.POST, attempts, errors };
}

const FIELDS = { name: "Fixture Person", email: "guest@example.invalid", details: "A cake, please." };

const json = (body = FIELDS) =>
  new Request("https://fixture.invalid/api/inquiry", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const form = (fields = FIELDS) =>
  new Request("https://fixture.invalid/api/inquiry", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", referer: "https://fixture.invalid/catering" },
    body: new URLSearchParams(fields),
  });

test("an acceptance id is a success, and reply-to is the customer", async () => {
  const r = inquiryRoute({ data: { id: "fixture-acceptance-id" }, error: null });
  const res = await r.POST(json());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(r.attempts.length, 1);
  assert.equal(r.attempts[0].replyTo, FIELDS.email);
  assert.deepEqual([...r.attempts[0].to], ["shop@example.invalid"]);
});

test("a refusal is a failure, with the phone number", async () => {
  const r = inquiryRoute({ data: null, error: { name: "validation_error", message: "fixture refusal" } });
  const res = await r.POST(json());
  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /\(269\) 000-0000/);
});

for (const [label, reply] of [
  ["a reply carrying neither an id nor an error", {}],
  ["a reply whose data has no id", { data: {}, error: null }],
]) {
  test(`${label} is a failure, not a quiet success`, async () => {
    const r = inquiryRoute(reply);
    const res = await r.POST(json());
    assert.equal(res.status, 502);
    assert.equal((await res.json()).ok, undefined);
    assert.ok(r.errors.some((l) => l.includes("no acceptance id in reply")), "the reason is logged");
  });
}

test("the no-JS form post lands on /thanks with a relative Location", async () => {
  const r = inquiryRoute({ data: { id: "x" }, error: null });
  const res = await r.POST(form());
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/thanks");
});

test("the honeypot is accepted and discarded without a send", async () => {
  const r = inquiryRoute({ data: { id: "x" }, error: null });
  const res = await r.POST(json({ ...FIELDS, company: "Totally Real LLC" }));
  assert.equal(res.status, 200);
  assert.equal(r.attempts.length, 0);
});

test("validation: name required, then a phone or an email, and the email must look like one", async () => {
  const r = inquiryRoute({ data: { id: "x" }, error: null });
  assert.equal((await r.POST(json({ email: "a@b.co" }))).status, 400);
  assert.equal((await r.POST(json({ name: "Ann" }))).status, 400);
  assert.equal((await r.POST(json({ name: "Ann", email: "nope" }))).status, 400);
  assert.equal((await r.POST(json({ name: "Ann", phone: "555" }))).status, 200);
  assert.equal(r.attempts.length, 1);
});

test("unconfigured mail answers 503 with the phone number and logs the whole payload", async () => {
  const r = inquiryRoute({ data: { id: "x" }, error: null }, {});
  const res = await r.POST(json());
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /\(269\) 000-0000/);
  assert.equal(r.attempts.length, 0);
  assert.ok(r.errors.some((l) => l.includes("mail not configured") && l.includes("A cake, please.")));
  // And the no-JS path gets a real page with the same message and a way back.
  const page = await r.POST(form());
  assert.equal(page.status, 503);
  assert.match(page.headers.get("content-type"), /text\/html/);
  const html = await page.text();
  assert.match(html, /\(269\) 000-0000/);
  assert.match(html, /href="\/catering"/);
});
