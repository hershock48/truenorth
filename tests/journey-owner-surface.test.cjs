/*
  JOURNEY: the owner's side. There is not one, and that is the finding.

  True North has no workroom, no admin page, no login, no staff view and no
  owner control of any kind. Flavors are edited in src/data/flavors.ts and
  deployed, or they come from the owner's Scooplist case through the feed,
  which is a different app in a different repo. Orders arrive as email. So
  there is no owner journey to test: no fulfillment step, no cancellation, no
  refund, nothing behind a passcode.

  A short file that asserts the absence is worth more than no file, because
  "there is no owner surface" is a claim that quietly stops being true the
  day someone adds one. These tests fail if an owner surface appears, which
  is the moment the real owner journey tests have to be written.

  The one machine-facing endpoint the site does have is /api/status. It is
  public and unauthenticated by design: it reports the flavor board's
  freshness and nothing else. It is covered here because it is the closest
  thing to an operator surface, and because the September review (L12) found
  it had changed shape.
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const test = require('node:test');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const sourceFiles = walk(src).filter(f => /\.tsx?$/.test(f));
const read = file => fs.readFileSync(file, 'utf8');
const relative = file => path.relative(root, file).split(path.sep).join('/');

test('step: the app ships exactly the public routes it documents, and no owner surface', () => {
  // A route file is how any surface, owner or not, comes into existence. If
  // this list grows, someone added a screen, and the question of who is
  // allowed to open it has to be answered before this test is updated.
  const routes = walk(path.join(src, 'app'))
    .filter(f => /[\\/](page|route)\.tsx?$/.test(f))
    .map(f => '/' + path.relative(path.join(src, 'app'), path.dirname(f)).split(path.sep).join('/'))
    .map(r => (r === '/.' ? '/' : r))
    .sort();

  assert.deepEqual(routes, [
    '/',
    '/about',
    '/api/inquiry',
    '/api/order',
    '/api/status',
    '/battle-creek',
    '/catering',
    '/contact',
    '/flavors',
    '/marshall',
    '/menu',
    '/order',
    '/thanks',
  ]);
});

test('step: nothing in the app can hold a session, so there is nobody to sign in', () => {
  // The three mechanisms an owner surface would need. Word searches would
  // trip over "Cookie Dough" and "DAMPING"; these are the real primitives.
  assert.equal(fs.existsSync(path.join(root, 'middleware.ts')), false);
  assert.equal(fs.existsSync(path.join(src, 'middleware.ts')), false);

  for (const file of sourceFiles) {
    const text = read(file);
    assert.ok(!text.includes('next/headers'), relative(file) + ' reads request headers or cookies');
    assert.ok(!/set-cookie/i.test(text), relative(file) + ' sets a cookie');
  }
});

test('step: the app reads only mail and feed configuration, never a shared secret gate', () => {
  const allowed = new Set([
    'RESEND_API_KEY', 'INQUIRY_TO', 'INQUIRY_FROM', 'ORDER_TO', 'ORDER_FROM', 'SCOOPLIST_FEED_URL',
  ]);
  const found = new Set();
  for (const file of sourceFiles) {
    for (const match of read(file).matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      assert.ok(allowed.has(match[1]), relative(file) + ' reads an undocumented variable: ' + match[1]);
      found.add(match[1]);
    }
  }
  // A PASSCODE, PIN or SESSION_SECRET appearing here is a new owner surface.
  assert.ok(found.has('RESEND_API_KEY'));
  assert.ok(found.has('SCOOPLIST_FEED_URL'));
});

/* /api/status, loaded with the case layer faked so the endpoint is what is
   under test and not the feed. */
function statusRoute({ feedConfigured = true, data } = {}) {
  const source = fs.readFileSync(path.join(root, 'src/app/api/status/route.ts'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new vm.Script(code, { filename: 'status' }).runInNewContext({
    module,
    exports: module.exports,
    require: name => {
      if (name === 'next/server') return { NextResponse: { json: Response.json.bind(Response) } };
      if (name === '@/data/liveCase') return { caseAll: async () => data };
      throw new Error('Unexpected dependency ' + name);
    },
    process: { env: feedConfigured ? { SCOOPLIST_FEED_URL: 'https://feed.example.invalid/secret-path' } : {} },
    Response, Boolean,
  });
  return module.exports;
}

const CASED = {
  boards: [
    { key: 'handscooped', title: 'Hand-scooped', subtitle: '', flavors: [{ name: 'Vanilla' }, { name: 'Blue Moon' }] },
    { key: 'softserve', title: 'Soft serve', subtitle: '', flavors: [{ name: 'Twist' }] },
  ],
  updatedLabel: 'Marshall: September 17; Battle Creek: September 17',
  live: false,
  source: 'cached',
  notice: 'Showing the last confirmed board, checked 9/17/2026, 3:04:12 PM Eastern.',
};

test('step: /api/status reports the same source and freshness the pages show', async () => {
  const route = statusRoute({ data: CASED });
  const body = await (await route.GET()).json();

  assert.equal(body.board.source, 'cached');
  assert.equal(body.board.live, false);
  assert.equal(body.board.updatedLabel, CASED.updatedLabel);
  // The count is the real flavor count across every board, not a board count.
  assert.equal(body.board.flavors, 3);
  assert.equal(body.summary, CASED.notice);
  assert.equal(body.feed.configured, true);
});

test('step: /api/status says a feed is configured without publishing its URL', async () => {
  const configured = await (await statusRoute({ data: CASED }).GET()).json();
  assert.ok(!JSON.stringify(configured).includes('secret-path'), '/api/status leaked the feed URL');
  assert.ok(!JSON.stringify(configured).includes('feed.example.invalid'), '/api/status leaked the feed host');

  const unconfigured = await (await statusRoute({ feedConfigured: false, data: { ...CASED, source: 'static' } }).GET()).json();
  assert.equal(unconfigured.feed.configured, false);
  assert.equal(unconfigured.board.source, 'static');
});

test('step: /api/status is never cached, so it cannot report yesterday freshness', async () => {
  const response = await statusRoute({ data: CASED }).GET();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  // force-dynamic is what keeps Next from serving a built snapshot of this.
  const source = fs.readFileSync(path.join(root, 'src/app/api/status/route.ts'), 'utf8');
  assert.match(source, /export const dynamic = "force-dynamic"/);
  assert.match(source, /export const runtime = "nodejs"/);
});

test('step: /api/status answers with an outage rather than an empty board', async () => {
  const route = statusRoute({
    data: { boards: [], updatedLabel: 'one or more shops unavailable', live: false, source: 'unavailable', notice: "A shop's board is unavailable. Check each shop separately or call to confirm flavors." },
  });
  const body = await (await route.GET()).json();

  assert.equal(body.board.source, 'unavailable');
  assert.equal(body.board.flavors, 0);
  assert.match(body.summary, /unavailable/);
});
