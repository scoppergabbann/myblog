const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const crypto = require('node:crypto');

function load(file, imports, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, ...globals,
    require: name => { if (!(name in imports)) throw Error(`Unexpected import: ${name}`); return imports[name]; } });
  return module.exports;
}
const shared = load('lib/stream-reactions.ts', {});
let visitor = null, limited = false, failedWrite = false, failedRead = false, countFailed = false;
let writes = 0, invalidated = [], rows = [];
const entries = [{ id: 9, published: true }, { id: 10, published: false }];
function database(admin = false) {
  return { from(table) {
    let mode = 'select', values, options = {}, filters = [], columns;
    const query = {
      select(value, config = {}) { columns = value; options = config; return query; },
      eq(key, value) { filters.push(row => row[key] === value); return query; },
      in(key, values) { filters.push(row => values.includes(row[key])); return query; },
      upsert(value, config) {
        assert.equal(admin, true); assert.equal(config.onConflict, 'slug,emoji,ip_hash'); assert.equal(config.ignoreDuplicates, true);
        mode = 'upsert'; values = value; return query;
      },
      delete() { assert.equal(admin, true); mode = 'delete'; return query; },
      maybeSingle() { return execute(true); },
      then(resolve, reject) { return execute(false).then(resolve, reject); },
    };
    async function execute(single) {
      if (mode !== 'select') {
        writes++;
        if (failedWrite) return { data: null, error: { message: 'storage failed' } };
        if (mode === 'upsert') {
          if (!rows.some(row => row.slug === values.slug && row.emoji === values.emoji && row.ip_hash === values.ip_hash)) rows.push({ ...values });
        } else rows = rows.filter(row => !filters.every(filter => filter(row)));
        return { data: null, error: null };
      }
      if (failedRead || (options.head && countFailed)) return { data: null, count: null, error: { message: 'read failed' } };
      const matches = (table === 'now_entries' ? entries : rows).filter(row => filters.every(filter => filter(row)));
      if (options.head) { assert.equal(options.count, 'exact'); return { count: matches.length, data: null, error: null }; }
      return { data: single ? matches[0] ?? null : matches.map(row => Object.fromEntries(columns.split(',').map(column => [column, row[column]]))), error: null };
    }
    return query;
  } };
}
const common = {
  '@/lib/supabase/public': { createSupabasePublic: () => database() },
  '@/lib/stream-visitor': { getStreamVisitorHash: async create => { if (create && !visitor) visitor = 'visitor-a'; return visitor; } },
  '@/lib/stream-reactions': shared,
};
const actions = load('app/now/reaction-actions.ts', { ...common,
  '@/lib/supabase/admin': { createSupabaseAdmin: () => database(true) },
  '@/lib/ip-hash': { getIpHash: async () => 'same-network' },
  '@/lib/rate-limit': { rateLimit: key => { assert.equal(key, 'stream-love:same-network'); return { allowed: !limited }; } },
  'next/cache': { revalidatePath: path => invalidated.push(path) },
});
const queries = load('lib/stream-reaction-queries.ts', { ...common, 'server-only': {} });

(async () => {
  for (const [id, liked] of [[0, true], [-1, true], [1.5, true], ['9', true], [9, 'true']]) assert.equal((await actions.setStreamReaction(id, 'heart', liked)).ok, false);
  assert.equal((await actions.setStreamReaction(10, 'heart', true)).ok, false, 'Draft must not accept reactions');
  assert.equal((await actions.setStreamReaction(999, 'heart', true)).ok, false);
  assert.equal(writes, 0);
  limited = true;
  assert.equal((await actions.setStreamReaction(9, 'heart', true)).ok, false);
  assert.equal(writes, 0);
  limited = false;
  const first = await actions.setStreamReaction(9, 'heart', true);
  assert.equal(first.ok, true); assert.equal(first.count, 1); assert.equal(first.active, true);
  assert.equal(rows[0].slug, '/now#update-9'); assert.equal(rows[0].emoji, 'love');
  assert.equal((await actions.setStreamReaction(9, 'heart', true)).count, 1, 'Retry must not duplicate a love');
  visitor = 'visitor-b';
  assert.equal((await actions.setStreamReaction(9, 'heart', true)).count, 2, 'Separate browsers on one network can each love');
  const state = await queries.getStreamReactionStates([9, 9, -1]);
  assert.equal(Object.keys(state).length, 1); assert.equal(state[9].heart.active, true); assert.equal(state[9].heart.count, 2); assert.equal(state[9].heart.available, true);
  visitor = null;
  assert.equal((await queries.getStreamReactionStates([9]))[9].heart.active, false);
  visitor = 'visitor-a';
  assert.equal((await actions.setStreamReaction(9, 'heart', false)).count, 1);
  assert.equal(rows[0].ip_hash, 'visitor-b', 'Unlike must leave other visitors untouched');
  assert.equal((await actions.setStreamReaction(9, 'heart', false)).count, 1);
  failedWrite = true;
  assert.equal((await actions.setStreamReaction(9, 'heart', true)).ok, false);
  failedWrite = false;
  countFailed = true;
  const persisted = await actions.setStreamReaction(9, 'heart', true);
  assert.equal(persisted.ok, true); assert.equal(persisted.count, null, 'Failed count must not report a saved love as unsaved');
  assert.equal((await queries.getStreamReactionStates([9]))[9].heart.available, false);
  countFailed = false; failedRead = true;
  assert.equal((await actions.setStreamReaction(9, 'heart', true)).ok, false);
  assert.equal((await queries.getStreamReactionStates([9]))[9].heart.available, false);
  assert.ok(invalidated.length > 0 && invalidated.every(path => path === '/now'));

  failedRead = false; visitor = 'visitor-a'; rows = [];
  const beforeInvalid = writes;
  for (const kind of ['poop', 'unknown', '__proto__', null]) assert.equal((await actions.setStreamReaction(9, kind, true)).ok, false);
  assert.equal(writes, beforeInvalid, 'Only the four positive reactions are allowed');
  for (const { kind } of shared.streamReactionOptions) {
    assert.equal((await actions.setStreamReaction(9, kind, true)).count, 1);
    assert.equal((await actions.setStreamReaction(9, kind, true)).count, 1);
  }
  assert.equal(rows.length, 4, 'All four kinds must have independent storage');
  const allKinds = (await queries.getStreamReactionStates([9]))[9];
  for (const { kind } of shared.streamReactionOptions) {
    assert.equal(allKinds[kind].count, 1); assert.equal(allKinds[kind].active, true);
  }
  assert.equal((await actions.setStreamReaction(9, 'cheers', false)).count, 0);
  const afterCheers = (await queries.getStreamReactionStates([9]))[9];
  assert.equal(afterCheers.heart.count, 1); assert.equal(afterCheers.fire.count, 1); assert.equal(afterCheers.clap.count, 1);
  assert.equal(afterCheers.cheers.active, false);

  const runtime = require('react/jsx-runtime');
  const icons = load('components/stream-reaction-icon.tsx', { 'react/jsx-runtime': runtime, '@/lib/stream-reactions': shared });
  const ui = load('components/stream-reactions.tsx', { 'react/jsx-runtime': runtime, react: require('react'), '@/lib/stream-reactions': shared, '@/components/stream-reaction-icon': icons, '@/app/now/reaction-actions': actions });
  const html = require('react-dom/server').renderToStaticMarkup(runtime.jsx(ui.StreamReactions, { entryId: 9, title: 'Test', initial: allKinds }));
  assert.equal((html.match(/<button /g) || []).length, 4);
  assert.ok(!/love/i.test(html), 'No Love text, tooltip, or accessible label');
  for (const label of ['Suka', 'Bersulang', 'Semangat', 'Keren']) assert.ok(html.includes(label));
  assert.ok(html.includes('<svg'), 'Cheers uses a pair of bottle illustrations');

  let cookie, cookieOptions, cookieWrites = 0;
  const identity = load('lib/stream-visitor.ts', {
    'server-only': {}, 'node:crypto': crypto,
    'next/headers': { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined, set: (name, value, options) => { assert.equal(name, 'bbs-stream-visitor'); cookie = value; cookieOptions = options; cookieWrites++; } }) },
  }, { process: { env: { NODE_ENV: 'production' } } });
  assert.equal(await identity.getStreamVisitorHash(), null); assert.equal(cookieWrites, 0);
  const hash = await identity.getStreamVisitorHash(true);
  assert.match(hash, /^[a-f0-9]{64}$/); assert.notEqual(hash, cookie);
  assert.equal(cookieOptions.httpOnly, true); assert.equal(cookieOptions.secure, true); assert.equal(cookieOptions.sameSite, 'lax');
  assert.equal(await identity.getStreamVisitorHash(), hash); assert.equal(cookieWrites, 1);
  cookie = 'malformed';
  assert.equal(await identity.getStreamVisitorHash(), null);
  assert.notEqual(await identity.getStreamVisitorHash(true), hash);
  console.log('PASS four positive emoji reactions, no Love label, bottle icon, preserved hearts, isolated counts, anonymous access, idempotency, visitor cookie, and rate limits');
})().catch(error => { console.error(error); process.exitCode = 1; });
