/*
  JOURNEY: a customer orders ahead for pickup.

  True North takes no money online. The whole order journey is one enquiry:
  the customer picks a shop and quantities on /order, the route resolves the
  names and prices server-side, and one email lands in the counter's inbox.
  There is no payment step, no fulfillment record, no cancellation and no
  refund, because nothing is ever charged. So the steps that exist are:

    render  ->  submit  ->  provider accepts  ->  customer is told

  and every way that chain can break. Each test below is named for the step
  it proves.

  The provider is faked. Nothing in this file can reach Resend: the route is
  compiled and run inside a vm with `resend` bound to a stub that records
  every call. `attempts` counts calls to the provider, so "sends nothing"
  means the stub was never called, not that the send merely failed.

  Not proven here, because the code does not do it: there is NO duplicate
  submit protection. The last test pins that as the current behavior rather
  than pretending otherwise. See the README section "What the tests prove".
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const test = require('node:test');

const root = path.join(__dirname, '..');

function compile(file, mocks, env, logs) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new vm.Script(code, { filename: file }).runInNewContext({
    module,
    exports: module.exports,
    require: name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error('Unexpected dependency ' + name);
    },
    process: { env },
    Response, Request, Headers, URL, URLSearchParams,
    // Captured, not silenced: the unconfigured path is supposed to log the
    // whole order so nothing a customer typed is lost, and that is asserted.
    console: { error: (...args) => logs.push(args.join(' ')) },
  });
  return module.exports;
}

// Two shops and two items, one of which only Marshall carries. That single
// `at` tag is what proves the route refuses a cross-shop order.
const locations = [
  { key: 'marshall', name: 'Marshall', street: '100 Fixture St', phone: '(269) 000-0000' },
  { key: 'battle-creek', name: 'Battle Creek', street: '200 Fixture Ave', phone: '(269) 000-0001' },
];
const orderables = [
  { key: 'pint', name: 'Pint', price: '$6.00', at: ['marshall', 'battle-creek'] },
  { key: 'softserve-pint', name: 'Soft serve pint', price: '$5.50', at: ['marshall'] },
];

const CONFIGURED = { RESEND_API_KEY: 'fixture-key', ORDER_TO: 'counter@example.invalid' };

function orderRoute({ live = true, env = CONFIGURED, reply } = {}) {
  const attempts = [];
  const logs = [];
  const accepted = { data: { id: 'fixture-acceptance-id' }, error: null };
  const handler = compile('src/app/api/order/route.ts', {
    'next/server': { NextResponse: { json: Response.json.bind(Response), redirect: Response.redirect.bind(Response) } },
    resend: {
      Resend: class {
        emails = {
          send: async payload => {
            attempts.push(payload);
            return reply ? reply(payload, attempts.length) : accepted;
          },
        };
      },
    },
    '@/data/site': { ORDERING_LIVE: live, locations },
    '@/data/menu': { orderables },
  }, env, logs).POST;
  return { handler, attempts, logs };
}

const URL_ORDER = 'https://fixture.invalid/api/order';
const complete = {
  store: 'marshall',
  name: 'Fixture Customer',
  phone: '269-555-0100',
  email: 'customer@example.invalid',
  pickup: 'Saturday around 4pm',
  flavors: 'Mint chip if you have it',
  'qty-pint': '2',
  'qty-softserve-pint': '1',
};

const asJson = (fields, url = URL_ORDER) =>
  new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(fields) });
const asForm = (fields, url = URL_ORDER) =>
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(Object.entries(fields).map(([k, v]) => [k, String(v)])),
  });

// The order page, rendered as a plain {type, props} tree instead of React.
async function orderPage(live) {
  const jsx = (type, props) => ({ type, props });
  const page = compile('src/app/order/page.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'next/link': { default: 'link' },
    '@/data/site': { ORDERING_LIVE: live },
    '@/components/OrderForm': { default: 'ORDER_FORM' },
    '@/components/PageHero': { default: 'hero' },
  }, {}, []).default;
  return JSON.stringify(await page({ searchParams: Promise.resolve({ at: 'battle-creek' }) }));
}

test('step: a live order page renders the form and carries the shop from ?at=', async () => {
  const rendered = await orderPage(true);
  assert.match(rendered, /ORDER_FORM/);
  assert.match(rendered, /battle-creek/);
});

test('step: a complete order sends exactly one email with every field the counter needs', async () => {
  const route = orderRoute();
  const response = await route.handler(asJson(complete));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(route.attempts.length, 1);

  const [mail] = route.attempts;
  // The owner opens this in an inbox. Everything needed to pull the order and
  // call the customer back has to be in it.
  // Spread first: the route builds this array inside the vm, so its prototype
  // is the vm realm's Array and a strict deep compare would fail on that alone.
  assert.deepEqual([...mail.to], ['counter@example.invalid']);
  assert.equal(mail.replyTo, 'customer@example.invalid');
  assert.match(mail.subject, /Marshall/);
  assert.match(mail.subject, /Fixture Customer/);
  assert.match(mail.subject, /2× Pint/);
  for (const line of [
    'Pickup at: Marshall, 100 Fixture St',
    'When: Saturday around 4pm',
    'Name: Fixture Customer',
    'Phone: 269-555-0100',
    'Email: customer@example.invalid',
    // 2 x $6.00 plus 1 x $5.50, computed from the menu, not from the post.
    'Estimated total: $17.50, pay at pickup',
    '2 × Pint ($6.00)',
    '1 × Soft serve pint ($5.50)',
    'Mint chip if you have it',
  ]) assert.ok(mail.text.includes(line), 'missing from the order email: ' + line);
  assert.match(mail.html, /Fixture Customer/);
});

test('step: the customer is only told the order is in once the provider returns an acceptance id', async () => {
  // A provider answer with no id is not an acceptance. Reporting success on
  // one is the "fake ok" this route's own header comment rules out: the
  // customer walks to the counter and no email ever arrived.
  const route = orderRoute({ reply: () => ({ data: null, error: null }) });
  const response = await route.handler(asJson(complete));

  assert.equal(route.attempts.length, 1);
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /269\) 000-0000/);
});

test('step: a no-JS order posts the same fields and lands on /thanks', async () => {
  const route = orderRoute();
  const response = await route.handler(asForm(complete));

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://fixture.invalid/thanks');
  assert.equal(route.attempts.length, 1);
  assert.ok(route.attempts[0].text.includes('Name: Fixture Customer'));
});

test('step: prices and item names come from the menu, never from the post', async () => {
  const route = orderRoute();
  await route.handler(asJson({ ...complete, 'qty-pint': '1', 'qty-softserve-pint': '0', price: '$0.01', name2: 'Free Pint' }));

  const [mail] = route.attempts;
  assert.ok(mail.text.includes('1 × Pint ($6.00)'));
  assert.ok(mail.text.includes('Estimated total: $6.00'));
  assert.ok(!mail.text.includes('0.01'));
});

test('step: an item the chosen shop does not carry is refused and nothing is sent', async () => {
  const route = orderRoute();
  const response = await route.handler(asJson({ ...complete, store: 'battle-creek' }));

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /not available at the Battle Creek shop/);
  assert.equal(route.attempts.length, 0);
});

test('step: the ordering-off switch closes the page before any form is built', async () => {
  const rendered = await orderPage(false);
  assert.ok(!rendered.includes('ORDER_FORM'));
  assert.match(rendered, /not available yet/);
});

test('step: the ordering-off switch refuses both post formats before the body is read', async () => {
  // The request objects here throw if anything touches the body, so passing
  // means the switch is checked before customer input is parsed, not after.
  for (const contentType of ['application/json', 'application/x-www-form-urlencoded']) {
    const route = orderRoute({ live: false });
    const response = await route.handler({
      headers: new Headers({ 'content-type': contentType }),
      json: () => { throw new Error('The body must not be read while ordering is off.'); },
      formData: () => { throw new Error('The body must not be read while ordering is off.'); },
    });
    assert.equal(response.status, 503);
    assert.match(await response.text(), /currently closed/);
    assert.equal(route.attempts.length, 0);
  }
});

test('step: a malformed body is refused in the caller own format and sends nothing', async () => {
  const json = orderRoute();
  const jsonResponse = await json.handler(
    new Request(URL_ORDER, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' }),
  );
  assert.equal(jsonResponse.status, 400);
  assert.deepEqual(await jsonResponse.json(), { error: 'Invalid request.' });
  assert.equal(json.attempts.length, 0);

  // A no-JS visitor gets a readable page, not a JSON blob.
  const form = orderRoute();
  const formResponse = await form.handler(
    new Request(URL_ORDER, {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=fixture' },
      body: 'this is not a multipart body',
    }),
  );
  assert.equal(formResponse.status, 400);
  assert.match(formResponse.headers.get('content-type'), /text\/html/);
  assert.match(await formResponse.text(), /could not be read/);
  assert.equal(form.attempts.length, 0);
});

test('step: an oversized body is clamped to the field limits before it reaches the provider', async () => {
  const huge = 'x'.repeat(200000);
  const route = orderRoute();
  const response = await route.handler(asJson({
    ...complete,
    name: huge,
    phone: huge,
    pickup: huge,
    flavors: huge,
    'qty-pint': '999999',
  }));

  assert.equal(response.status, 200);
  const [mail] = route.attempts;
  const field = label => mail.text.split('\n').find(line => line.startsWith(label)).slice(label.length);
  assert.equal(field('Name: ').length, 120);
  assert.equal(field('Phone: ').length, 40);
  assert.equal(field('When: ').length, 120);
  // Quantity clamps to 20 per item, so an inflated number cannot inflate the
  // estimate either: 20 x $6.00 plus 1 x $5.50.
  assert.ok(mail.text.includes('20 × Pint ($6.00)'));
  assert.ok(mail.text.includes('Estimated total: $125.50'));
  // A 200KB post produces a small email, not a forwarded payload.
  assert.ok(mail.text.length < 3000, 'order email grew with the request: ' + mail.text.length);
});

test('step: every missing required field is named back to the customer and sends nothing', async () => {
  const cases = [
    [{ store: '' }, /pick a shop/i],
    [{ store: 'not-a-shop' }, /pick a shop/i],
    [{ name: '' }, /add your name/i],
    [{ phone: '', email: '' }, /phone number or an email/i],
    [{ email: 'not-an-email' }, /does not look right/i],
    [{ 'qty-pint': '0', 'qty-softserve-pint': '0' }, /at least one thing/i],
  ];
  for (const [override, message] of cases) {
    const route = orderRoute();
    const response = await route.handler(asJson({ ...complete, ...override }));
    assert.equal(response.status, 400, JSON.stringify(override));
    assert.match((await response.json()).error, message);
    assert.equal(route.attempts.length, 0);
  }
});

test('step: a no-JS validation failure hands back what the customer typed instead of losing it', async () => {
  const route = orderRoute();
  const response = await route.handler(asForm({ ...complete, name: '' }));
  const page = await response.text();

  assert.equal(response.status, 400);
  assert.match(page, /add your name/i);
  assert.match(page, /Saturday around 4pm/);
  assert.match(page, /Mint chip if you have it/);
  // Quantities are not retyped, they ride along hidden.
  assert.match(page, /type="hidden" name="qty-pint" value="2"/);
  assert.equal(route.attempts.length, 0);
});

test('step: a bot that fills the honeypot is accepted silently and sends nothing', async () => {
  const json = orderRoute();
  const jsonResponse = await json.handler(asJson({ ...complete, company: 'Acme Spam Co' }));
  assert.equal(jsonResponse.status, 200);
  assert.deepEqual(await jsonResponse.json(), { ok: true });
  assert.equal(json.attempts.length, 0);

  const form = orderRoute();
  const formResponse = await form.handler(asForm({ ...complete, company: 'Acme Spam Co' }));
  assert.equal(formResponse.status, 303);
  assert.equal(form.attempts.length, 0);
});

test('step: provider failure returns a plain error with the shop phone number', async () => {
  // Both shapes a provider failure can take: a returned error, and a throw.
  for (const reply of [
    () => ({ data: null, error: { name: 'application_error', message: 'Fixture failure' } }),
    () => { throw new Error('Fixture network failure'); },
  ]) {
    const route = orderRoute({ reply });
    const response = await route.handler(asJson(complete));
    assert.equal(route.attempts.length, 1);
    assert.equal(response.status, 502);
    const { error } = await response.json();
    assert.match(error, /Could not send that/);
    assert.match(error, /269\) 000-0000/);
    // The customer is told what went wrong, not shown the provider's words.
    assert.ok(!/Fixture/.test(error));
  }
});

test('step: unconfigured mail tells the truth, logs the whole order and never fakes an ok', async () => {
  for (const env of [{}, { RESEND_API_KEY: 'fixture-key' }, { ORDER_TO: 'counter@example.invalid' }]) {
    const route = orderRoute({ env });
    const response = await route.handler(asJson(complete));
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /269\) 000-0000/);
    assert.equal(route.attempts.length, 0);
    // Nothing the customer typed is lost: it is on the server log.
    const logged = route.logs.join('\n');
    assert.match(logged, /ORDER \(mail not configured\)/);
    assert.match(logged, /Fixture Customer/);
    assert.match(logged, /Mint chip if you have it/);
  }
});

test('step: ORDER_TO is optional and delivery falls back to the inquiry inbox', async () => {
  const route = orderRoute({ env: { RESEND_API_KEY: 'fixture-key', INQUIRY_TO: 'hello@example.invalid, owner@example.invalid' } });
  const response = await route.handler(asJson(complete));
  assert.equal(response.status, 200);
  assert.deepEqual([...route.attempts[0].to], ['hello@example.invalid', 'owner@example.invalid']);
});

test('step: NO duplicate-submit protection exists, two identical posts send two emails', async () => {
  // This is the current behavior, recorded rather than wished away. The route
  // keeps no state between requests: no submission window, no idempotency key
  // on the provider call. A double tap on a slow phone mails the counter
  // twice. Whether that is worth fixing is Kevin's call; if it is fixed, this
  // test is the one that has to change, and its name says so.
  const route = orderRoute();
  const first = await route.handler(asJson(complete));
  const second = await route.handler(asJson(complete));

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(route.attempts.length, 2);
  assert.equal(route.attempts[0].subject, route.attempts[1].subject);
});
