/*
  What the inquiry route is allowed to call a success.

  Resend's SDK answers with a union: {data:{id}, error:null} when it took the
  message, {data:null, error} when it refused. Reading only `error` treats a
  2xx carrying neither as a send, and the visitor is told "we got it" while
  nothing reaches the inbox. That is the one thing this route's own header
  comment forbids, so it is pinned here.

  The provider is faked. Nothing in this file can reach Resend: the route is
  compiled and run inside a vm with `resend` bound to a stub, and `attempts`
  counts calls to it.
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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
    console: { error: (...args) => logs.push(args.map(String).join(' ')) },
  });
  return module.exports;
}

const CONFIGURED = { RESEND_API_KEY: 'fixture-key', INQUIRY_TO: 'shop@example.invalid' };

function inquiryRoute(reply) {
  const attempts = [];
  const logs = [];
  const handler = compile('src/app/api/inquiry/route.ts', {
    'next/server': {
      NextResponse: { json: Response.json.bind(Response), redirect: Response.redirect.bind(Response) },
    },
    resend: {
      Resend: class {
        emails = {
          send: async payload => {
            attempts.push(payload);
            return reply;
          },
        };
      },
    },
    '@/data/site': { site: { cateringPhone: '(269) 000-0000', email: 'shop@example.invalid' } },
  }, CONFIGURED, logs).POST;
  return { handler, attempts, logs };
}

const FIELDS = { name: 'Fixture Person', email: 'guest@example.invalid', details: 'A cake, please.' };

function post() {
  return new Request('https://fixture.invalid/api/inquiry', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(FIELDS),
  });
}

test('an acceptance id is a success', async () => {
  const r = inquiryRoute({ data: { id: 'fixture-acceptance-id' }, error: null });
  const response = await r.handler(post());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(r.attempts.length, 1);
});

test('a refusal is a failure, with the phone number', async () => {
  const r = inquiryRoute({ data: null, error: { name: 'validation_error', message: 'fixture refusal' } });
  const response = await r.handler(post());
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /\(269\) 000-0000/);
});

// The regression. Both of these are 2xx replies with no refusal in them, and
// both used to read as sent.
for (const [label, reply] of [
  ['a reply carrying neither an id nor an error', {}],
  ['a reply whose data has no id', { data: {}, error: null }],
]) {
  test(`${label} is a failure, not a quiet success`, async () => {
    const r = inquiryRoute(reply);
    const response = await r.handler(post());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, undefined);
    assert.ok(r.logs.some(l => l.includes('no acceptance id returned')), 'the reason is logged');
  });
}
