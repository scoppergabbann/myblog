const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, imports = {}, extra = '') {
  const module = { exports: {} };
  const source = fs.readFileSync(file, 'utf8') + extra;
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: key => key in imports ? imports[key] : require(key), URL, Date, TextEncoder, Number, Buffer, File: globalThis.File });
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
let admin = true, written, response = { data: { id: 7 }, error: null }, invalidated = [];
const query = new Proxy({}, { get: (_, key) => (...args) => { if (key === 'insert' || key === 'update') written = args[0]; if (key === 'single' || key === 'maybeSingle') return Promise.resolve(response); return query; } });
const actions = load('app/admin/(protected)/library/actions.ts', {
  '@/auth': { auth: async () => ({}), isAdmin: () => admin },
  '@/lib/supabase/admin': { createSupabaseAdmin: () => ({ from: () => query }) },
  '@/lib/cloudinary': {}, 'next/cache': { revalidatePath: route => invalidated.push(route) }, '@/lib/library-fields': fields,
});
(async () => {
  const input = { category_id: 1, item_type: 'book', details: book.details, name: 'Book', subtitle: null, description: 'My impression', badge: 'Selesai dibaca', reels_url: null, link_url: null, display_order: 0 };
  assert.equal((await actions.upsertItem(null, input)).ok, true);
  assert.equal(written.details.publisher, 'Gramedia'); assert.equal(written.description, 'My impression');
  assert.deepEqual(invalidated, ['/library', '/admin/library']);
  assert.equal((await actions.upsertItem(null, { ...input, details: {}, description: null })).ok, true);
  assert.equal((await actions.upsertItem(null, { ...input, link_url: 'javascript:alert(1)' })).ok, false);
  assert.equal((await actions.upsertItem(null, { ...input, item_type: 'note', details: {}, description: '' })).ok, true);
  response = { data: null, error: { code: 'PGRST204', message: 'Column missing' } };
  const missing = await actions.upsertItem(null, input);
  assert.equal(missing.ok, false); assert.match(missing.error, /016_library_item_details/);
  admin = false; await assert.rejects(actions.upsertItem(null, input), /Unauthorized/);
  console.log('PASS category forms, validation, metadata round trip, legacy rendering, missing migration, URLs, notes, and admin authorization');
})().catch(error => { console.error(error); process.exitCode = 1; });
