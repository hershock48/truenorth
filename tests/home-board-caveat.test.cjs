/*
  The home page's two shop cards carry a taste of each counter under
  "Scooping today". This renders the real page and the real MapCard for the
  three freshness states liveCase.ts can hand back (plus the unconfigured
  sample) and checks what a visitor would actually read:

    live         chips, no caveat
    cached       chips, plus when the board was checked and the ask to confirm
    static       chips, plus the sample-rotation label
    unavailable  no chips, a plain sentence saying the board is not available

  The feed contract allows an empty flavor list, so a cached board with no
  hand-scooped flavors is also covered: the heading and caveat still render
  with no chips. Before this, page.tsx read only `boards`, so a cached
  snapshot looked like today's list and an unavailable shop rendered an
  empty, silent card.

  The sentences below are copies. tests/case-feed.test.cjs pins the exact
  words liveCase.ts produces, so a rewording there fails that file first.
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const test = require('node:test');
const root = path.join(__dirname, '..');

function load(file, mocks) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new vm.Script(compiled, { filename: file }).runInNewContext({ module, exports: module.exports, require: n => { if (Object.hasOwn(mocks, n)) return mocks[n]; throw Error('Unexpected dependency ' + n); }, process: { env: {} } });
  return module.exports;
}

// A plain element tree instead of React: {type, props}. Deep enough to find
// the MapCard elements the page builds and to read what the card renders.
const jsx = (type, props) => ({ type, props });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: 'fragment' };

const locations = [
  { key: 'marshall', name: 'Marshall', note: 'fixture', phone: '(269) 000-0000', phoneHref: 'tel:+12690000000', hours: [{ day: 0, label: 'Sunday', open: 12, close: 21 }] },
  { key: 'battle-creek', name: 'Battle Creek', note: 'fixture', phone: '(269) 000-0001', phoneHref: 'tel:+12690000001', hours: [{ day: 0, label: 'Sunday', open: 14, close: 21 }] },
];

// The exact shapes and sentences liveCase.ts produces for each source.
const chips = [{ key: 'handscooped', title: 'Hand-scooped', subtitle: '', flavors: [{ name: 'Vanilla' }, { name: 'Blue Moon' }] }];
const states = {
  live: { boards: chips, updatedLabel: 'September 17', live: true, source: 'live', notice: 'The case changes throughout the day. Call if you are making a trip for a favorite.' },
  cached: { boards: chips, updatedLabel: 'September 17', live: false, source: 'cached', notice: 'Showing the last confirmed board, checked 9/17/2026, 3:04:12 PM Eastern. Availability may have changed. Call the shop to confirm.' },
  static: { boards: chips, updatedLabel: 'August 21', live: false, source: 'static', notice: "This is a sample rotation. Call the shop to confirm today's flavors." },
  unavailable: { boards: [], updatedLabel: 'unavailable', live: false, source: 'unavailable', notice: "Today's flavor board is temporarily unavailable. Call the shop to check what is scooping." },
  // A cached snapshot whose hand-scooped board validated with no flavors.
  cachedEmpty: { boards: [{ ...chips[0], flavors: [] }], updatedLabel: 'September 17', live: false, source: 'cached', notice: 'Showing the last confirmed board, checked 9/17/2026, 3:04:12 PM Eastern. Availability may have changed. Call the shop to confirm.' },
};

function findAll(node, type, out = []) {
  if (Array.isArray(node)) node.forEach(n => findAll(n, type, out));
  else if (node && typeof node === 'object') {
    if (node.type === type) out.push(node);
    Object.values(node.props ?? {}).forEach(v => findAll(v, type, out));
  }
  return out;
}

async function homeCards(state) {
  const page = load('src/app/page.tsx', {
    'react/jsx-runtime': jsxRuntime,
    'next/image': { default: 'img' }, 'next/link': { default: 'link' },
    '@/components/SpinningCompass': { default: 'compass' }, '@/components/SignRising': { default: 'sign' },
    '@/components/Sprinkles': { default: 'sprinkles' }, '@/components/CompassRose': { default: 'rose' },
    '@/components/MapCard': { default: 'MAP_CARD' }, '@/components/MeltEdge': { default: 'melt' },
    '@/components/Reveal': { default: 'reveal' },
    '@/data/liveCase': { caseFor: async () => states[state] },
    '@/data/site': { locations },
  }).default;
  return findAll(await page(), 'MAP_CARD');
}

function renderCard(props) {
  const MapCard = load('src/components/MapCard.tsx', {
    'react/jsx-runtime': jsxRuntime, 'next/link': { default: 'link' },
    '@/components/OpenNow': { default: 'open-now' },
    '@/data/shops': { uniformDailySpan: () => ({ open: 12, close: 21 }) },
    '@/data/site': { ORDERING_LIVE: false, formatHour: h => String(h), fullAddress: () => 'fixture', mapsEmbedUrl: () => 'fixture', mapsUrl: () => 'fixture', orderHref: () => '/order', shopHref: () => '/marshall' },
  }).default;
  const tree = MapCard(props);
  return { tree, text: JSON.stringify(tree), lists: findAll(tree, 'ul').length };
}

test('home page hands each shop card its freshness state, not just the boards', async () => {
  for (const state of Object.keys(states)) {
    const cards = await homeCards(state);
    assert.equal(cards.length, locations.length);
    for (const card of cards) {
      assert.equal(card.props.caseSource, states[state].source);
      assert.equal(card.props.caseNotice, states[state].notice);
    }
  }
});

test('a live board shows chips with no caveat', async () => {
  const [card] = await homeCards('live');
  const { text, lists } = renderCard(card.props);
  assert.equal(lists, 1);
  assert.match(text, /Vanilla/); assert.match(text, /Scooping today/);
  assert.doesNotMatch(text, /Call if you are making a trip/);
});

test('a cached board says when it was checked and asks to confirm with the shop', async () => {
  const [card] = await homeCards('cached');
  const { text, lists } = renderCard(card.props);
  assert.equal(lists, 1);
  assert.match(text, /Vanilla/);
  assert.match(text, /checked 9\/17\/2026, 3:04:12 PM Eastern/);
  assert.match(text, /Call the shop to confirm/);
});

test('a cached board with no hand-scooped flavors still shows the heading and the caveat', async () => {
  const [card] = await homeCards('cachedEmpty');
  assert.deepEqual(card.props.scooping, []);
  const { text, lists } = renderCard(card.props);
  assert.equal(lists, 0);
  assert.match(text, /Scooping today/);
  assert.match(text, /checked 9\/17\/2026, 3:04:12 PM Eastern/);
  assert.match(text, /Call the shop to confirm/);
  // The live branch is unchanged: an empty live board renders no block at all.
  const live = renderCard({ ...card.props, caseSource: 'live', caseNotice: states.live.notice });
  assert.equal(live.lists, 0);
  assert.doesNotMatch(live.text, /Scooping today/);
});

test('a sample rotation is labeled as one', async () => {
  const [card] = await homeCards('static');
  const { text } = renderCard(card.props);
  assert.match(text, /Vanilla/); assert.match(text, /sample rotation/);
});

test('an unavailable board says so in words instead of rendering an empty list', async () => {
  const [card] = await homeCards('unavailable');
  const { text, lists } = renderCard(card.props);
  assert.equal(lists, 0);
  assert.doesNotMatch(text, /Vanilla/);
  assert.match(text, /Scooping today/);
  assert.match(text, /temporarily unavailable/); assert.match(text, /Call the shop/);
});

test('a card with no freshness state at all renders as before (the /contact cards)', () => {
  const { text, lists } = renderCard({ location: locations[0] });
  assert.equal(lists, 0);
  assert.doesNotMatch(text, /Scooping today/);
});
