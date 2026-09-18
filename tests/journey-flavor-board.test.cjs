/*
  JOURNEY: a visitor reads the flavor board.

  This is the site's other end-to-end path, and the one that can lie. A
  Scooplist feed is fetched, validated, cached, and then rendered on three
  surfaces: the home page shop cards, /flavors, and each shop page. The
  journey runs the real contract (src/data/caseFeed.ts) and the real cache
  logic (src/data/liveCase.ts) against a faked fetch, then renders the real
  pages from whatever came out. Nothing here reaches a network.

  The four states the feed can leave a visitor in, and what each must say:

    live         the flavors, no caveat
    cached       the flavors, plus when the board was last checked
    static       the demo rotation, labeled a sample
    unavailable  no flavors at all, and a sentence saying so

  tests/case-feed.test.cjs already pins the data layer's behavior and
  tests/home-board-caveat.test.cjs pins the home card's rendering. This file
  is the journey that joins them: one feed outcome, carried all the way to
  what a person reads on all three surfaces, so a page that quietly stops
  passing the freshness through fails here even when both halves still pass.

  The Data Cache is modeled, not real. Whether the deployment's Data Cache
  persists and is shared across workers is a launch gate in the README, and
  no test on this workstation can settle it.
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const test = require('node:test');

const root = path.join(__dirname, '..');

function load(file, { mocks = {}, env = {}, fetch, now, jsx = false } = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: jsx ? ts.JsxEmit.ReactJSX : undefined,
    },
  }).outputText;
  const module = { exports: {} };
  class Clock extends Date {
    static now() { return now ?? Date.now(); }
  }
  new vm.Script(code, { filename: file }).runInNewContext({
    module,
    exports: module.exports,
    require: name => {
      if (name === 'server-only') return {};
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error('Unexpected dependency ' + name);
    },
    process: { env },
    fetch,
    Date: Clock,
    AbortSignal,
    JSON,
  });
  return module.exports;
}

const FEED_URL = 'https://feed.example.invalid';
const FIRST_FETCH = 1800000000000;
const LATER = FIRST_FETCH + 600000;

// One recognizable flavor per shop, so a board that belongs to the other
// counter is visible in the rendered output rather than inferred.
const FEED_FLAVOR = { marshall: 'Marshall Feed Flavor', 'battle-creek': 'Battle Creek Feed Flavor' };
const goodFeed = shop => ({
  location: { id: shop },
  updatedAt: 1799999000000,
  boards: [{
    key: 'handscooped',
    label: 'Hand-scooped',
    flavors: [{ name: FEED_FLAVOR[shop], description: 'From the feed', allergens: ['nuts'], tags: [] }],
  }],
});

// The seeded demo board. Its flavor name must never appear on a page whose
// feed is configured, whatever the feed did.
const SAMPLE_FLAVOR = 'Sample Rotation Flavor';
const sampleBoards = [{ key: 'handscooped', title: 'Hand-scooped', subtitle: 'fixture', flavors: [{ name: SAMPLE_FLAVOR }] }];

const shops = [
  { key: 'marshall', name: 'Marshall' },
  { key: 'battle-creek', name: 'Battle Creek' },
];

/**
 * One instance of the case pipeline. `cache` is the modeled Data Cache and is
 * passed between instances on purpose: that is how a later request sees what
 * an earlier one stored, which is the whole point of the cached state.
 */
function pipeline({ cache = new Map(), respond = async shop => ({ ok: true, body: JSON.stringify(goodFeed(shop)) }), env = { SCOOPLIST_FEED_URL: FEED_URL }, now = FIRST_FETCH } = {}) {
  // The real validator, on this pipeline's clock. A fixture that agreed with
  // the test would prove nothing about what a malformed feed actually does,
  // and the validator's "not from the future" rule needs the same clock the
  // rest of the run is using or the fixture dates decide the outcome.
  const contract = load('src/data/caseFeed.ts', { now });
  const unstable_cache = (callback, keys) => async () => {
    const key = JSON.stringify(keys);
    try {
      const value = await callback();
      cache.set(key, JSON.stringify(value));
      return value;
    } catch (error) {
      // A failed revalidation must not write. The previous snapshot stands.
      if (cache.has(key)) return JSON.parse(cache.get(key));
      throw error;
    }
  };
  return load('src/data/liveCase.ts', {
    mocks: {
      './caseFeed': contract,
      'next/cache': { unstable_cache },
      '@/data/flavors': { boards: sampleBoards, boardsFor: () => sampleBoards, boardUpdatedLabel: 'August 21' },
      '@/data/site': { locations: shops },
    },
    env,
    now,
    fetch: async url => {
      const shop = url.split('/').at(-1);
      const answer = await respond(shop);
      if (!answer.ok) return { ok: false, text: async () => '' };
      return { ok: true, text: async () => answer.body };
    },
  });
}

/* The three surfaces, rendered as plain {type, props} trees. */
const jsxFactory = (type, props) => ({ type, props });
const jsxRuntime = { jsx: jsxFactory, jsxs: jsxFactory, Fragment: 'fragment' };

const renderLocations = [
  { key: 'marshall', slug: 'marshall', name: 'Marshall', note: 'fixture', offerings: 'fixture', phone: '(269) 000-0000', phoneHref: 'tel:+12690000000', hoursSummary: 'Noon to 9 daily', hours: [{ day: 0, label: 'Sunday', short: 'Sun', open: 12, close: 21 }] },
  { key: 'battle-creek', slug: 'battle-creek', name: 'Battle Creek', note: 'fixture', offerings: 'fixture', phone: '(269) 000-0001', phoneHref: 'tel:+12690000001', hoursSummary: '2 to 9 daily', hours: [{ day: 0, label: 'Sunday', short: 'Sun', open: 14, close: 21 }] },
];

const siteMock = {
  ORDERING_LIVE: false,
  site: { name: 'True North Ice Cream' },
  locations: renderLocations,
  locationBySlug: slug => renderLocations.find(l => l.slug === slug),
  formatHour: h => String(h),
  fullAddress: () => 'fixture address',
  mapsEmbedUrl: () => 'https://maps.example.invalid/embed',
  mapsUrl: () => 'https://maps.example.invalid',
  orderHref: () => '/order',
  shopHref: () => '/marshall',
  shopAnchors: { case: 'case', menu: 'menu' },
};

function findAll(node, type, out = []) {
  if (Array.isArray(node)) node.forEach(n => findAll(n, type, out));
  else if (node && typeof node === 'object') {
    if (node.type === type) out.push(node);
    Object.values(node.props ?? {}).forEach(v => findAll(v, type, out));
  }
  return out;
}

/** The home page, with the real MapCard so the caveat is read, not inferred. */
async function homeText(caseFor) {
  const page = load('src/app/page.tsx', {
    jsx: true,
    mocks: {
      'react/jsx-runtime': jsxRuntime,
      'next/image': { default: 'img' }, 'next/link': { default: 'link' },
      '@/components/SpinningCompass': { default: 'compass' }, '@/components/SignRising': { default: 'sign' },
      '@/components/Sprinkles': { default: 'sprinkles' }, '@/components/CompassRose': { default: 'rose' },
      '@/components/MapCard': { default: 'MAP_CARD' }, '@/components/MeltEdge': { default: 'melt' },
      '@/components/Reveal': { default: 'reveal' },
      '@/data/liveCase': { caseFor },
      '@/data/site': { locations: renderLocations },
    },
  }).default;
  const MapCard = load('src/components/MapCard.tsx', {
    jsx: true,
    mocks: {
      'react/jsx-runtime': jsxRuntime, 'next/link': { default: 'link' },
      '@/components/OpenNow': { default: 'open-now' },
      '@/data/shops': { uniformDailySpan: () => ({ open: 12, close: 21 }) },
      '@/data/site': siteMock,
    },
  }).default;
  const cards = findAll(await page(), 'MAP_CARD');
  assert.equal(cards.length, renderLocations.length, 'the home page lost a shop card');
  return cards.map(card => JSON.stringify(MapCard(card.props))).join('\n');
}

async function flavorsText(caseFor, slug = 'marshall') {
  const page = load('src/app/flavors/page.tsx', {
    jsx: true,
    mocks: {
      'react/jsx-runtime': jsxRuntime, 'next/link': { default: 'link' },
      '@/components/FlavorBoardCard': { default: 'board-card' },
      '@/components/PageHero': { default: 'hero' },
      '@/components/Reveal': { default: 'reveal' },
      '@/data/liveCase': { caseFor },
      '@/data/site': siteMock,
    },
  }).default;
  return JSON.stringify(await page({ searchParams: Promise.resolve({ at: slug }) }));
}

async function shopPageText(caseFor, key = 'marshall') {
  const LocationPage = load('src/components/LocationPage.tsx', {
    jsx: true,
    mocks: {
      'react/jsx-runtime': jsxRuntime, 'next/link': { default: 'link' },
      '@/components/FlavorBoardCard': { default: 'board-card' },
      '@/components/MeltEdge': { default: 'melt' },
      '@/components/MenuSectionCard': { default: 'menu-card' },
      '@/components/OpenNow': { default: 'open-now' },
      '@/components/PageHero': { default: 'hero' },
      '@/components/Reveal': { default: 'reveal' },
      '@/data/liveCase': { caseFor },
      '@/data/menu': { menuFor: () => [] },
      '@/data/shops': { uniformDailySpan: () => ({ open: 12, close: 21 }) },
      '@/data/site': siteMock,
    },
  }).default;
  return JSON.stringify(await LocationPage({ location: renderLocations.find(l => l.key === key) }));
}

/** All three surfaces from one case outcome, which is the journey's point. */
async function surfaces(caseFor) {
  return {
    home: await homeText(caseFor),
    flavors: await flavorsText(caseFor),
    shop: await shopPageText(caseFor),
  };
}
const everySurface = (rendered, pattern, message) => {
  for (const [name, text] of Object.entries(rendered)) assert.match(text, pattern, `${name}: ${message}`);
};
const noSurface = (rendered, pattern, message) => {
  for (const [name, text] of Object.entries(rendered)) assert.doesNotMatch(text, pattern, `${name}: ${message}`);
};

test('step: a healthy feed reaches the case as live, carrying that shop own flavors', async () => {
  const data = await pipeline().caseFor('marshall');
  assert.equal(data.source, 'live');
  assert.equal(data.live, true);
  assert.equal(data.boards[0].flavors[0].name, FEED_FLAVOR.marshall);
  // Subtitles are site voice and stay with the site, not the feed.
  assert.equal(data.boards[0].subtitle, 'fixture');
});

test('step: a live board shows its flavors on all three surfaces with no stale caveat', async () => {
  const run = pipeline();
  const rendered = await surfaces(shop => run.caseFor(shop));
  everySurface(rendered, /Marshall Feed Flavor|Battle Creek Feed Flavor/, 'a live board lost its flavors');
  noSurface(rendered, /Availability may have changed/, 'a live board claimed to be stale');
  noSurface(rendered, /sample rotation/, 'a live board was labeled a sample');
  noSurface(rendered, new RegExp(SAMPLE_FLAVOR), 'the demo list leaked into a live board');
});

test('step: a malformed feed is refused and the last good board is what visitors still see', async () => {
  const cache = new Map();
  await pipeline({ cache }).caseFor('marshall');

  // Shapes the contract must refuse: not an object, a board with no key, a
  // flavor whose allergens are not a list, and an update time from the future.
  for (const broken of [
    'not an object at all',
    JSON.stringify({ location: { id: 'marshall' }, updatedAt: null, boards: [{ label: 'No key', flavors: [] }] }),
    JSON.stringify({ ...goodFeed('marshall'), boards: [{ key: 'handscooped', label: 'Hand-scooped', flavors: [{ name: 'X', description: '', allergens: null, tags: [] }] }] }),
    JSON.stringify({ ...goodFeed('marshall'), updatedAt: LATER + 86400000 }),
  ]) {
    const data = await pipeline({ cache, now: LATER, respond: async () => ({ ok: true, body: broken }) }).caseFor('marshall');
    assert.equal(data.source, 'cached');
    assert.equal(data.live, false);
    assert.equal(data.boards[0].flavors[0].name, FEED_FLAVOR.marshall, 'a malformed feed replaced the last good board');
  }
});

test('step: a stale board says on every surface when it was last checked', async () => {
  const cache = new Map();
  await pipeline({ cache }).caseFor('marshall');
  const run = pipeline({ cache, now: LATER, respond: async () => ({ ok: false }) });
  const data = await run.caseFor('marshall');

  assert.equal(data.source, 'cached');
  // The checked-at time is the real fetch time, not the time of the page view.
  const checkedAt = new Date(FIRST_FETCH).toLocaleString('en-US', { timeZone: 'America/Detroit' });
  assert.ok(data.notice.includes(checkedAt), 'the cached notice does not carry the real fetch time: ' + data.notice);

  const rendered = await surfaces(shop => run.caseFor(shop));
  everySurface(rendered, /Marshall Feed Flavor/, 'a cached board lost the flavors it still knows');
  everySurface(rendered, /Availability may have changed/, 'a cached board passed itself off as today');
  everySurface(rendered, /call the shop to confirm|Call the shop to confirm/, 'a cached board did not ask anyone to confirm');
  everySurface(rendered, new RegExp(checkedAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'a surface dropped the checked-at time');
});

test('step: a feed answering for the wrong shop is refused and never crosses counters', async () => {
  const cache = new Map();
  await pipeline({ cache }).caseFor('marshall');
  // Battle Creek's endpoint answers with Marshall's board.
  const crossed = pipeline({ cache, now: LATER, respond: async () => ({ ok: true, body: JSON.stringify(goodFeed('marshall')) }) });
  const battleCreek = await crossed.caseFor('battle-creek');

  assert.equal(battleCreek.source, 'unavailable', 'a wrong-shop feed was accepted');
  assert.equal(battleCreek.boards.length, 0);
  // Marshall's own cached board is untouched by the other shop's failure.
  assert.equal((await crossed.caseFor('marshall')).boards[0].flavors[0].name, FEED_FLAVOR.marshall);
});

test('step: a valid but empty board stays empty and is never refilled from the sample list', async () => {
  const run = pipeline({ respond: async shop => ({ ok: true, body: JSON.stringify({ ...goodFeed(shop), boards: [] }) }) });
  const data = await run.caseFor('marshall');
  assert.equal(data.source, 'live', 'an empty case is a valid answer, not a failure');
  assert.equal(data.boards.length, 0);

  const rendered = await surfaces(shop => run.caseFor(shop));
  noSurface(rendered, new RegExp(SAMPLE_FLAVOR), 'an empty live board was refilled with demo flavors');
  noSurface(rendered, /Marshall Feed Flavor/, 'an empty live board showed flavors from nowhere');
});

test('step: an unavailable board says so in words on every surface, never an empty list', async () => {
  const run = pipeline({ respond: async () => { throw new Error('Fixture outage'); } });
  const data = await run.caseFor('marshall');
  assert.equal(data.source, 'unavailable');
  assert.equal(data.boards.length, 0);

  const rendered = await surfaces(shop => run.caseFor(shop));
  everySurface(rendered, /temporarily unavailable/, 'an unavailable board rendered silence');
  everySurface(rendered, /Call the shop/, 'an unavailable board gave the visitor nowhere to go');
  noSurface(rendered, new RegExp(SAMPLE_FLAVOR), 'an outage resurrected the demo flavors');
  noSurface(rendered, /Marshall Feed Flavor/, 'an outage still showed feed flavors');
});

test('step: with no feed configured every surface labels the demo data a sample rotation', async () => {
  const run = pipeline({ env: {} });
  const data = await run.caseFor('marshall');
  assert.equal(data.source, 'static');
  assert.equal(data.boards[0].flavors[0].name, SAMPLE_FLAVOR);

  const rendered = await surfaces(shop => run.caseFor(shop));
  everySurface(rendered, /sample rotation/, 'demo flavors were shown as if they were today');
  everySurface(rendered, new RegExp(SAMPLE_FLAVOR), 'the sample board lost its flavors');
});

test('step: /flavors leads with the outage instead of counting flavors it does not have', async () => {
  const run = pipeline({ respond: async () => { throw new Error('Fixture outage'); } });
  const text = await flavorsText(shop => run.caseFor(shop));
  assert.match(text, /temporarily unavailable/);
  assert.doesNotMatch(text, /0 flavors listed/);
});
