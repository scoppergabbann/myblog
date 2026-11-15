const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const runtime = require('react/jsx-runtime');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, imports) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, File, FormData, Uint8Array,
    require: name => { if (!(name in imports)) throw Error(`Unexpected import: ${name}`); return imports[name]; } });
  return module.exports;
}
const photos = load('lib/stream-photos.ts', {});
const items = [1, 2, 3].map(index => ({ url: `https://example.com/${index}.jpg`, alt: `Foto ${index}` }));
assert.equal(photos.validateStreamPhotos(undefined), null);
assert.equal(photos.validateStreamPhotos([]), null);
assert.equal(photos.validateStreamPhotos(items), null);
for (const invalid of [null, {}, [null], [...items, { url: 'https://example.com/4.jpg', alt: '' }], [items[0], items[0]], [{ url: 'javascript:alert(1)', alt: '' }], [{ url: 'data:image/png;base64,x', alt: '' }], [{ url: 'https://user:password@example.com/p.jpg', alt: '' }], [{ url: items[0].url, alt: 'x'.repeat(301) }]]) {
  assert.ok(photos.validateStreamPhotos(invalid), JSON.stringify(invalid));
}
assert.equal(photos.validateStreamPhotoFile({ type: 'image/jpeg', size: photos.MAX_STREAM_PHOTO_BYTES }), null);
assert.ok(photos.validateStreamPhotoFile({ type: 'image/jpeg', size: photos.MAX_STREAM_PHOTO_BYTES + 1 }));
assert.ok(photos.validateStreamPhotoFile({ type: 'image/png', size: 0 }));
assert.ok(photos.validateStreamPhotoFile({ type: 'image/svg+xml', size: 20 }));
const signatures = {
  'image/jpeg': [255, 216, 255, 224],
  'image/png': [137, 80, 78, 71, 13, 10, 26, 10],
  'image/webp': [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80],
};
for (const [type, bytes] of Object.entries(signatures)) assert.equal(photos.streamPhotoMatchesType(new Uint8Array(bytes), type), true);
assert.equal(photos.streamPhotoMatchesType(new Uint8Array([60, 115, 118, 103]), 'image/jpeg'), false);
const gallery = load('components/stream-photo-gallery.tsx', { '@/lib/stream-photos': photos, 'react/jsx-runtime': runtime });
assert.equal(renderToStaticMarkup(gallery.StreamPhotoGallery({ title: 'Test' })), '');
const galleryHtml = renderToStaticMarkup(gallery.StreamPhotoGallery({ title: 'Jogging', photos: items }));
assert.equal((galleryHtml.match(/<img /g) || []).length, 3);
assert.ok(galleryHtml.includes('target="_blank"') && galleryHtml.includes('rel="noopener noreferrer"'));
assert.ok(galleryHtml.includes('loading="lazy"') && galleryHtml.includes('<figcaption'));
const feed = photos.streamPhotoFeedContent('<script>alert(1)</script>', [{ url: 'https://example.com/a.jpg?x=1&y=2', alt: '"><script>bad()</script>' }]);
assert.ok(!feed.includes('<script>') && feed.includes('&lt;script&gt;') && feed.includes('&amp;y=2'));
assert.equal(photos.streamPhotoFeedContent('Text only', []), undefined);
let admin = false, uploads = 0, uploaded, storageResult = { ok: true, url: items[0].url, path: '202611/photo.jpg' };
const uploader = load('lib/stream-photo-upload.ts', {
  '@/auth': { auth: async () => ({}), isAdmin: () => admin },
  '@/lib/storage': { uploadImage: async data => { uploads++; uploaded = data.get('file'); return storageResult; } },
  '@/lib/stream-photos': photos,
});
function form(bytes, type = 'image/jpeg', name = 'photo.jpg') {
  const data = new FormData(); data.set('file', new File([new Uint8Array(bytes)], name, { type })); return data;
}
(async () => {
  assert.equal((await uploader.uploadStreamPhoto(form(signatures['image/jpeg']))).ok, false);
  assert.equal(uploads, 0, 'Non-admin cannot upload');
  admin = true;
  for (const data of [new FormData(), form([], 'image/jpeg'), form([1, 2, 3], 'image/svg+xml'), form([60, 115, 118, 103], 'image/jpeg'), form(new Uint8Array(photos.MAX_STREAM_PHOTO_BYTES + 1))]) {
    assert.equal((await uploader.uploadStreamPhoto(data)).ok, false);
  }
  assert.equal(uploads, 0, 'Invalid files must never reach storage');
  for (const [type, bytes] of Object.entries(signatures)) {
    assert.equal((await uploader.uploadStreamPhoto(form(bytes, type, 'wrong.svg'))).ok, true);
    assert.ok(!uploaded.name.endsWith('.svg'), 'Storage extension follows verified format');
    assert.equal(uploaded.type, type);
  }
  storageResult = { ok: false, error: 'Storage unavailable' };
  assert.equal((await uploader.uploadStreamPhoto(form(signatures['image/jpeg']))).error, 'Storage unavailable');
  console.log('PASS three-photo limit, file limits, signatures, admin upload guard, storage errors, gallery, and RSS escaping');
})().catch(error => { console.error(error); process.exitCode = 1; });
