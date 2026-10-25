const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file, imports) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(process.cwd(), file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { if (!(name in imports)) throw Error(`Unexpected import: ${name}`); return imports[name]; }, URL, Date, Number });
  return module.exports;
}
const validation = load('lib/now-stream.ts', {});
let admin = true, calls = [], response = { data: { id: 7 }, error: null }, invalidated = [];
const query = new Proxy({}, { get: (_, method) => (...args) => {
  calls.push([method, ...args]);
  return method === 'maybeSingle' ? Promise.resolve(response) : query;
} });
const actions = load('app/admin/(protected)/now/stream-actions.ts', {
  '@/auth': { auth: async () => ({}), isAdmin: () => admin },
  '@/lib/supabase/admin': { createSupabaseAdmin: () => ({ from: table => { assert.equal(table, 'now_entries'); return query; } }) },
  'next/cache': { revalidatePath: route => invalidated.push(route) },
  '@/lib/now-stream': validation,
});
const input = { title: ' Update ', category: 'release', project: 'Website', project_url: 'https://example.com', content: '**Released**', published_on: '2026-10-25', published: false };
(async () => {
  assert.equal(validation.validateStream(input), null);
  for (const patch of [{ title: '' }, { category: 'unknown' }, { content: '' }, { project_url: 'javascript:alert(1)' }, { project_url: '//example.com' }, { published_on: '2026-02-30' }, { published_on: 'invalid' }, { published: 'true' }]) {
    assert.ok(validation.validateStream({ ...input, ...patch }), JSON.stringify(patch));
  }
  admin = false;
  await assert.rejects(actions.saveStreamEntry(null, input), /Unauthorized/);
  await assert.rejects(actions.deleteStreamEntry(7), /Unauthorized/);
  assert.equal(calls.length, 0);
  admin = true;
  assert.equal((await actions.saveStreamEntry(null, { ...input, title: '' })).ok, false);
  assert.equal(calls.length, 0);
  assert.equal((await actions.saveStreamEntry(null, input)).ok, true);
  const inserted = calls.find(c => c[0] === 'insert')[1];
  assert.equal(inserted.title, 'Update');
  assert.equal(inserted.published, false);
  assert.deepEqual(invalidated, ['/now', '/now/rss.xml', '/admin/now']);
  calls = []; invalidated = [];
  assert.equal((await actions.saveStreamEntry(7, { ...input, published: true })).ok, true);
  assert.ok(calls.some(c => c[0] === 'eq' && c[1] === 'id' && c[2] === 7));
  response = { data: null, error: { code: 'PGRST205', message: 'missing' } };
  invalidated = [];
  const missing = await actions.saveStreamEntry(null, input);
  assert.equal(missing.ok, false); assert.match(missing.error, /015_now_stream.sql/);
  assert.equal(invalidated.length, 0);
  response = { data: null, error: null };
  assert.equal((await actions.saveStreamEntry(999, input)).ok, false);
  assert.equal((await actions.deleteStreamEntry(999)).ok, false);
  response = { data: { id: 7 }, error: null };
  assert.equal((await actions.deleteStreamEntry(7)).ok, true);
  assert.equal((await actions.deleteStreamEntry(-1)).ok, false);
  console.log('PASS Stream validation, admin authorization, draft/create/update/delete, missing migrations, missing records, and cache invalidation');
})().catch(error => { console.error(error); process.exitCode = 1; });
