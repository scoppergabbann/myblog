const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.join(__dirname, '..');
let articles = [];
function load(file, mocks) {
  const context = { exports: {}, require: (name) => name in mocks ? mocks[name] : require(name) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText, context);
  return context.exports;
}
const { WritingFilter } = load('app/writing/writing-filter.tsx', {
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@/components/writing-item': { WritingItem: ({ writing }) => React.createElement('article', null, writing.title) },
});
const { default: Page } = load('app/writing/page.tsx', {
  '@/lib/seo': { pageMetadata: () => ({}) },
  'next/navigation': { notFound: () => { throw new Error('404'); } },
  '@/lib/posts': { getAllWritings: async () => articles },
  './writing-filter': { WritingFilter },
});
function filterProps(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === WritingFilter) return node.props;
  return React.Children.toArray(node.props?.children).map(filterProps).find(Boolean);
}
const post = (id, tags) => ({ slug: String(id), title: `Post ${id}`, summary: '', tags });
const page = async (number) => filterProps(await Page({ searchParams: Promise.resolve({ page: String(number) }) }));
(async () => {
  articles = Array.from({ length: 13 }, (_, i) => post(i, i % 2 ? ['general'] : ['investasi']));
  articles.push(post(13, ['general']), post(14, ['general', ' Investasi ']), post(15, ['SAHAM']));
  const first = await page(1);
  assert.equal(first.totalItems, 7);
  assert.equal(first.totalPages, 2);
  assert.equal(first.paginated.length, 6);
  assert.equal(first.allWritings.length, 16, 'Tag filters and search keep access to all articles');
  const last = await page(2);
  assert.equal(last.paginated.length, 1);
  assert.equal(last.paginated[0].slug, '13');
  const html = renderToStaticMarkup(React.createElement(WritingFilter, last));
  assert.match(html, /7–7 dari 7/);
  assert.doesNotMatch(html, /dari 16/);
  await assert.rejects(page(3), /404/);
  articles = [post(1, ['investasi']), post(2, ['saham'])];
  const hiddenOnly = await page(1);
  assert.equal(hiddenOnly.totalPages, 1);
  assert.equal(hiddenOnly.totalItems, 0);
  assert.equal(hiddenOnly.paginated.length, 0);
  articles = [];
  assert.equal((await page(1)).totalPages, 1);
  console.log('PASS: excluded tags, mixed tags/case, 6-per-page, last-page totals, 404, empty lists, full search dataset');
})().catch((error) => { console.error(error); process.exitCode = 1; });
