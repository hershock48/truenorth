const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const test = require('node:test'), assert = require('node:assert/strict'), ts = require('typescript');
function load(file, mocks = {}, env = {}, fetch, now = 1800000000000) {
  const module = { exports: {} };
  class Clock extends Date { static now() { return now; } }
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new vm.Script(code).runInNewContext({ module, exports: module.exports, require: name => name === 'server-only' ? {} : mocks[name] || (() => { throw Error(name); })(), process: { env }, fetch, Date: Clock, AbortSignal });
  return module.exports;
}
const contract = load('src/data/caseFeed.ts');
const feed = (shop = 'marshall') => ({ location: { id: shop }, updatedAt: 1700000000000, boards: [{ key: 'scoops', label: 'Scoops', flavors: [{ name: 'Vanilla', description: '', allergens: ['milk'], tags: [] }] }] });
test('empty cases are valid; malformed, wrong-shop, duplicate and future updates are rejected', () => {
  assert.equal(contract.validateCaseFeed({ ...feed(), boards: [] }, 'marshall').boards.length, 0);
  for (const value of [null, {}, feed('battle-creek'), { ...feed(), updatedAt: Infinity }, { ...feed(), updatedAt: 1900000000000 }, { ...feed(), boards: [feed().boards[0], feed().boards[0]] }, { ...feed(), boards: [{ ...feed().boards[0], flavors: [{ ...feed().boards[0].flavors[0], allergens: null }] }] }]) assert.throws(() => contract.validateCaseFeed(value, 'marshall'));
});
function runtime({ cache = new Map(), getFeed = async shop => feed(shop), env = { SCOOPLIST_FEED_URL: 'https://feed.example.invalid' }, now } = {}) {
  const staticBoards = [{ key: 'scoops', title: 'Scoops', subtitle: '', flavors: [{ name: 'Old sold-out flavor' }] }];
  // Model Data Cache revalidation. Actual host cache persistence is a launch gate.
  const unstable_cache = (callback, keys) => async () => {
    const key = JSON.stringify(keys);
    try { const value = await callback(); cache.set(key, JSON.stringify(value)); return value; }
    catch (error) { if (cache.has(key)) return JSON.parse(cache.get(key)); throw error; }
  };
  return load('src/data/liveCase.ts', {
    './caseFeed': contract, 'next/cache': { unstable_cache },
    '@/data/flavors': { boards: staticBoards, boardsFor: () => staticBoards, boardUpdatedLabel: 'old demo snapshot' },
    '@/data/site': { locations: [{ key: 'marshall', name: 'Marshall' }, { key: 'battle-creek', name: 'Battle Creek' }] },
  }, env, async url => ({ ok: true, text: async () => JSON.stringify(await getFeed(url.split('/').at(-1))) }), now);
}
test('valid feeds preserve additional allergen labels', async () => {
  const data = await runtime().caseFor('marshall');
  assert.equal(data.source, 'live'); assert.match(data.boards[0].flavors[0].note, /milk/);
  // The note is customer text: "Contains milk", never "Feed allergen: milk".
  assert.match(data.boards[0].flavors[0].note, /^Contains milk$/);
});
test('bad revalidation retains the last good snapshot across module instances', async () => {
  const cache = new Map();
  await runtime({ cache, now: 1800000000000 }).caseFor('marshall');
  const stale = await runtime({ cache, now: 1800000120000, getFeed: async () => ({ broken: true }) }).caseFor('marshall');
  assert.equal(stale.source, 'cached'); assert.equal(stale.live, false);
  assert.equal(stale.boards[0].flavors[0].name, 'Vanilla'); assert.match(stale.notice, /Availability may have changed/);
});
test('cold feed failure does not resurrect static flavors', async () => {
  const data = await runtime({ getFeed: async () => { throw Error('Offline'); } }).caseFor('marshall');
  assert.equal(data.source, 'unavailable'); assert.equal(data.boards.length, 0);
  // The exact sentence, pinned here because the home card test mocks caseFor
  // and copies the words; if liveCase.ts rewords it, this is what fails.
  assert.equal(data.notice, "Today's flavor board is temporarily unavailable. Call the shop to check what is scooping.");
});
test('origin and shop caches are isolated; partial combined feeds make no shop-only claims', async () => {
  const cache = new Map(); await runtime({ cache }).caseFor('marshall');
  const offline = async () => { throw Error('Offline'); };
  assert.equal((await runtime({ cache, getFeed: offline }).caseFor('battle-creek')).source, 'unavailable');
  assert.equal((await runtime({ cache, getFeed: offline, env: { SCOOPLIST_FEED_URL: 'https://other.example.invalid' } }).caseFor('marshall')).source, 'unavailable');
  assert.equal((await runtime({ cache, getFeed: offline }).caseAll()).boards.length, 0);
});
test('unconfigured demos are labeled static; an empty live feed stays empty', async () => {
  const demo = await runtime({ env: {} }).caseFor('marshall');
  assert.equal(demo.source, 'static');
  // Same reason as the unavailable sentence: the home card test copies it.
  assert.equal(demo.notice, "This is a sample rotation. Call the shop to confirm today's flavors.");
  const empty = await runtime({ getFeed: async shop => ({ ...feed(shop), boards: [] }) }).caseFor('marshall');
  assert.equal(empty.source, 'live'); assert.equal(empty.boards.length, 0);
});
