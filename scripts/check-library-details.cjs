const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, imports = {}, extra = '', globals = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(file, 'utf8') + extra;
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: key => key in imports ? imports[key] : require(key), URL, Date, TextEncoder, Number, Buffer, File: globalThis.File, ...globals });
  return module.exports;
}
const fields = load('lib/library-fields.ts');
const detailsUI = load('app/admin/(protected)/library/library-detail-fields.tsx', { '@/lib/library-fields': fields });
const detailPublic = load('components/library-item-details.tsx', { '@/lib/library-fields': fields });
const actionsMock = new Proxy({}, { get: () => async () => ({ ok: true, id: 7 }) });
const editor = load('app/admin/(protected)/library/library-admin-editor.tsx', {
  'next/navigation': { useRouter: () => ({ refresh() {} }) },
  '@/components/admin/toast': { useToast: () => ({ error() {}, success() {} }) },
  '@/components/admin/use-unsaved-close': { useUnsavedClose: () => () => {} },
  '@/lib/library-fields': fields, './library-detail-fields': detailsUI, './actions': actionsMock,
}, '\nexport { ItemModal };');
const render = component => renderToStaticMarkup(component);
for (const [kind, expected, unwanted] of [
  ['book', ['Judul buku', 'Penulis', 'Penerbit', 'Tahun terbit', 'ISBN', 'Kesan setelah membaca', 'Catatan &amp; kutipan buku'], ['Kapasitas mesin', 'Link Reels IG']],
  ['car', ['Nama mobil', 'Merek', 'Model / varian', 'Tahun produksi', 'Kapasitas mesin', 'Transmisi'], ['Penulis', 'ISBN', 'Status membaca']],
  ['motorcycle', ['Nama motor', 'pengalaman berkendara', 'Merek', 'Model / varian'], ['Penulis', 'ISBN']],
  ['note', ['Judul catatan', 'Isi catatan', 'Tanggal catatan', 'Sumber / referensi'], ['Kapasitas mesin', 'ISBN', 'Link Reels IG']],
  ['drink', ['Nama minuman', 'Merek / kedai', 'Jenis minuman', 'Penyajian'], ['Penulis', 'ISBN']],
]) {
  const html = render(React.createElement(editor.ItemModal, { item: null, categoryId: 1, category: { name: 'Koleksi', item_type: kind }, onClose() {}, onSaved() {} }));
  for (const text of expected) assert.ok(html.includes(text), `${kind} missing ${text}`);
  for (const text of unwanted) assert.ok(!html.includes(text), `${kind} leaked ${text}`);
  assert.ok(html.includes('role="dialog"') && html.includes('Simpan'));
}
assert.equal(fields.resolveLibraryKind(null, { name: 'Buku' }), 'book');
assert.equal(fields.resolveLibraryKind(null, { name: 'Buku', item_type: 'general' }), 'general');
assert.equal(fields.resolveLibraryKind({ item_type: 'car' }, { name: 'Buku', item_type: 'book' }), 'car');
for (const kind of Object.keys(fields.libraryKinds)) assert.ok(!fields.cleanLibraryDetails(kind, {}).error);
assert.ok(fields.cleanLibraryDetails('book', { author: 'Writer', published_year: 'NaN' }).error);
assert.ok(fields.cleanLibraryDetails('book', { author: 'Writer', finished_on: '2026-02-30' }).error);
assert.ok(fields.cleanLibraryDetails('book', { author: 'Writer', isbn: '123' }).error);
const book = fields.cleanLibraryDetails('book', { author: 'Haruki Murakami', publisher: 'Gramedia', published_year: '1987', isbn: '978-0-307-74371-2', notes: 'Catatan buku', engine_cc: '2000' });
assert.ok(!book.error);
assert.equal(book.details.engine_cc, undefined);
assert.equal(fields.getLibraryItemSubtitle({ subtitle: null, item_type: 'book', details: book.details }), 'Haruki Murakami · 1987');
const publicHTML = render(React.createElement(detailPublic.LibraryItemDetails, { item: { item_type: 'book', details: book.details } }));
assert.ok(publicHTML.includes('Gramedia') && publicHTML.includes('1987'));
const notesHTML = render(React.createElement(detailPublic.LibraryItemNotes, { item: { item_type: 'book', details: book.details } }));
assert.ok(notesHTML.includes('Catatan buku'));
assert.equal(render(React.createElement(detailPublic.LibraryItemDetails, { item: { name: 'Legacy', subtitle: 'Old subtitle' } })), '');
// A Stream hash must open the referenced item, including items beyond carousel page one.
const effects = [], selectedItems = [], events = {};
let stateIndex = 0;
const fakeWindow = { location: { hash: '#item-19' }, addEventListener: (name, handler) => { events[name] = handler; }, removeEventListener() {} };
const shelf = load('app/library/library-shelf.tsx', {
  react: { ...React, useRef: () => ({ current: {} }), useState: initial => { const index = stateIndex++; return [initial, value => { if (index === 1) selectedItems.push(value); }]; }, useEffect: effect => effects.push(effect) },
  'next/image': () => null, '@/lib/library': { getCoverUrl: () => null },
  '@/lib/library-fields': fields, '@/components/library-item-details': detailPublic,
}, '', { window: fakeWindow });
const visibleItems = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, category_id: 1, name: 'Item ' + (i + 1), photos: [] }));
shelf.LibraryShelf({ data: { categories: [{ id: 1, name: 'Buku' }], itemsByCategory: { 1: visibleItems } } });
effects[0]();
assert.equal(selectedItems.at(-1).id, 19);
fakeWindow.location.hash = '#item-999'; events.hashchange(); assert.equal(selectedItems.at(-1), null);
fakeWindow.location.hash = '#other'; events.hashchange(); assert.equal(selectedItems.at(-1), null);
let rpcCalls = 0;
let admin = true, written, response = { data: { id: 7 }, error: null }, invalidated = [];
const query = new Proxy({}, { get: (_, key) => (...args) => { if (key === 'insert' || key === 'update') written = args[0]; if (key === 'single' || key === 'maybeSingle') return Promise.resolve(response); return query; } });
const actions = load('app/admin/(protected)/library/actions.ts', {
  '@/auth': { auth: async () => ({}), isAdmin: () => admin },
  '@/lib/supabase/admin': { createSupabaseAdmin: () => ({ from: () => query, rpc: async (name, args) => { assert.equal(name, 'create_library_item_with_stream'); assert.equal(args.p_site_url, 'https://example.com'); rpcCalls++; written = args.p_item; return { data: response.data?.id ?? null, error: response.error }; } }) },
  '@/lib/site-config': { siteConfig: { url: 'https://example.com' } },
  '@/lib/cloudinary': {}, 'next/cache': { revalidatePath: route => invalidated.push(route) }, '@/lib/library-fields': fields,
});
(async () => {
  const input = { category_id: 1, item_type: 'book', details: book.details, name: 'Book', subtitle: null, description: 'My impression', badge: 'Selesai dibaca', reels_url: null, link_url: null, display_order: 0 };
  assert.equal((await actions.upsertItem(null, input)).ok, true);
  assert.equal(written.details.publisher, 'Gramedia'); assert.equal(written.description, 'My impression');
  assert.deepEqual(invalidated, ['/library', '/admin/library', '/now', '/now/rss.xml', '/admin/now']);
  assert.equal(rpcCalls, 1);
  assert.equal((await actions.upsertItem(7, input)).ok, true);
  assert.equal(rpcCalls, 1, 'Editing must not create another Stream entry');
  assert.equal((await actions.upsertItem(null, { ...input, details: {}, description: null })).ok, true);
  assert.equal((await actions.upsertItem(null, { ...input, link_url: 'javascript:alert(1)' })).ok, false);
  assert.equal((await actions.upsertItem(null, { ...input, item_type: 'note', details: {}, description: '' })).ok, true);
  response = { data: null, error: { code: 'PGRST204', message: 'Column missing' } };
  const missing = await actions.upsertItem(null, input);
  assert.equal(missing.ok, false); assert.match(missing.error, /016_library_item_details/);
  response = { data: null, error: { code: 'PGRST202', message: 'RPC missing' } };
  const noIntegration = await actions.upsertItem(null, input);
  assert.equal(noIntegration.ok, false); assert.match(noIntegration.error, /017_library_stream/);
  response = { data: null, error: { code: '23514', message: 'Stream constraint failed' } };
  invalidated = [];
  assert.equal((await actions.upsertItem(null, input)).ok, false);
  assert.equal(invalidated.length, 0, 'Failed transaction must not report success');
  admin = false; await assert.rejects(actions.upsertItem(null, input), /Unauthorized/);
  console.log('PASS category forms, validation, metadata round trip, legacy rendering, missing migration, URLs, notes, Stream RPC, edit deduplication, deep links, and admin authorization');
})().catch(error => { console.error(error); process.exitCode = 1; });
