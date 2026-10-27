const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => name in imports ? imports[name] : require(name), URL, Date, Number, TextEncoder });
  return module.exports;
}
const fields = load('lib/library-fields.ts');
let maximum = null, readError = null, written, maxReads = [], rpcCalls = 0;
const db = { from: table => {
  let maxQuery = false, category;
  const builder = new Proxy({}, { get: (_, key) => key === 'then' ? (resolve, reject) => Promise.resolve({ data: { id: 7 }, error: null }).then(resolve, reject) : (...args) => {
    if (key === 'insert' || key === 'update') written = args[0];
    if (key === 'select' && args[0] === 'display_order') maxQuery = true;
    if (key === 'eq' && args[0] === 'category_id') category = args[1];
    if (key === 'order' && maxQuery) assert.equal(args[1].ascending, false);
    if (key === 'maybeSingle' && maxQuery) { maxReads.push({ table, category }); return Promise.resolve({ data: maximum === null ? null : { display_order: maximum }, error: readError }); }
    if (key === 'single' || key === 'maybeSingle') return Promise.resolve({ data: { id: 7 }, error: null });
    return builder;
  } });
  return builder;
}, rpc: async (name, args) => { assert.equal(name, 'create_library_item_with_stream'); written = args.p_item; rpcCalls++; return { data: 7, error: null }; } };
const actions = load('app/admin/(protected)/library/actions.ts', {
  '@/auth': { auth: async () => ({}), isAdmin: () => true }, '@/lib/supabase/admin': { createSupabaseAdmin: () => db },
  '@/lib/cloudinary': {}, '@/lib/site-config': { siteConfig: { url: 'https://example.com' } },
  'next/cache': { revalidatePath() {} }, '@/lib/library-fields': fields,
});
const item = { category_id: 12, item_type: 'book', details: {}, name: 'Book', subtitle: null, description: null, badge: null, reels_url: null, link_url: null, display_order: null };
const category = { name: 'Books', emoji: '', description: null, is_hidden: false, item_type: 'book', display_order: null };
(async () => {
  assert.equal((await actions.upsertItem(null, item)).ok, true); assert.equal(written.display_order, 1);
  assert.equal(maxReads[0].table, 'library_items'); assert.equal(maxReads[0].category, 12);
  maximum = 42;
  assert.equal((await actions.upsertItem(null, item)).ok, true); assert.equal(written.display_order, 43);
  maximum = 99;
  assert.equal((await actions.upsertCategory(null, category)).ok, true); assert.equal(written.display_order, 100);
  assert.equal(maxReads.at(-1).table, 'library_categories'); assert.equal(maxReads.at(-1).category, undefined);
  const before = maxReads.length;
  assert.equal((await actions.upsertItem(null, { ...item, display_order: 0 })).ok, true); assert.equal(written.display_order, 0);
  assert.equal((await actions.upsertCategory(null, { ...category, display_order: 8 })).ok, true); assert.equal(written.display_order, 8);
  assert.equal(maxReads.length, before, 'Manual order must not query or override the chosen number');
  const rpcBefore = rpcCalls;
  assert.equal((await actions.upsertItem(7, item)).ok, true); assert.equal('display_order' in written, false);
  assert.equal((await actions.upsertCategory(7, category)).ok, true); assert.equal('display_order' in written, false);
  assert.equal(maxReads.length, before); assert.equal(rpcCalls, rpcBefore, 'Editing keeps order and does not create another Stream record');
  for (const display_order of [-1, 1.5, NaN, Infinity, 2147483648]) {
    assert.equal((await actions.upsertItem(null, { ...item, display_order })).ok, false);
    assert.equal((await actions.upsertCategory(null, { ...category, display_order })).ok, false);
  }
  readError = { message: 'Unavailable' };
  assert.equal((await actions.upsertItem(null, item)).ok, false); assert.equal(rpcCalls, rpcBefore);
  assert.equal((await actions.upsertCategory(null, category)).ok, false);
  readError = null; maximum = 2147483647;
  assert.equal((await actions.upsertItem(null, item)).ok, false); assert.equal(rpcCalls, rpcBefore);
  // Both public and admin queries must use the same primary order and tie breakers.
  const queryOrders = {};
  const readDB = { from: table => {
    const orders = []; queryOrders[table] = orders;
    const builder = new Proxy({}, { get: (_, key) => key === 'then'
      ? (resolve, reject) => Promise.resolve({ data: [], error: null }).then(resolve, reject)
      : (...args) => { if (key === 'order') orders.push([args[0], args[1].ascending]); return builder; } });
    return builder;
  } };
  const library = load('lib/library.ts', { './supabase/public': { createSupabasePublic: () => readDB } });
  await library.getLibraryData();
  for (const table of ['library_items', 'library_categories']) assert.equal(JSON.stringify(queryOrders[table]), JSON.stringify([['display_order', false], ['created_at', false], ['id', false]]));
  const adminPage = load('app/admin/(protected)/library/page.tsx', { '@/lib/supabase/admin': { createSupabaseAdmin: () => readDB }, './library-admin-editor': { LibraryAdminEditor: () => null } });
  await adminPage.default();
  for (const table of ['library_items', 'library_categories']) assert.equal(JSON.stringify(queryOrders[table]), JSON.stringify([['display_order', false], ['created_at', false], ['id', false]]));
  console.log('PASS automatic item/category ordering, category scope, manual zero, edit preservation, failures/limits, Stream integration, and consistent public/admin sorting');
})().catch(error => { console.error(error); process.exitCode = 1; });
