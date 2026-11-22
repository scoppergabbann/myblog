const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

const root = path.join(__dirname, '..');
let articles = [];

function load(file, mocks) {
  const context = { exports: {}, require: (name) => name in mocks ? mocks[name] : require(name) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText, context);
  return context.exports;
}

function WritingIndex() { return null; }

const { default: Page } = load('app/writing/page.tsx', {
  '@/components/writing-index': { WritingIndex },
  '@/lib/seo': { pageMetadata: () => ({}) },
  'next/navigation': { notFound: () => { throw new Error('404'); } },
  '@/lib/posts': { getAllWritings: async () => articles },
});

function findProps(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === WritingIndex) return node.props;
  return React.Children.toArray(node.props?.children).map(findProps).find(Boolean);
}

const post = (id, tags) => ({ slug: String(id), title: `Post ${id}`, summary: '', tags });
const page = async (number) => findProps(await Page({ searchParams: Promise.resolve({ page: String(number) }) }));

(async () => {
  articles = Array.from({ length: 18 }, (_, index) => post(index + 1,
    index % 3 === 0 ? ['saham'] : index % 3 === 1 ? ['investasi'] : ['kehidupan']));

  const first = await page(1);
  assert.equal(first.totalItems, 12, 'stock articles should stay outside the main archive count');
  assert.equal(first.totalPages, 2);
  assert.equal(first.paginated.length, 8, 'the main archive should show eight articles per page');
  assert.equal(first.allWritings.length, 18, 'stock articles must remain available to category filters and search');

  const second = await page(2);
  assert.equal(second.paginated.length, 4);
  assert.equal(second.paginated[0].slug, '14');
  await assert.rejects(page(3), /404/);

  articles = [];
  const empty = await page(1);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.totalItems, 0);
  assert.equal(empty.paginated.length, 0);

  console.log('PASS: stock category remains searchable but excluded from the 8-per-page archive count');
})().catch((error) => { console.error(error); process.exitCode = 1; });
