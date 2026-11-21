const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: key => key in imports ? imports[key] : require(key), Date, Number, TextEncoder });
  return module.exports;
}

const posts = load('lib/posts.ts', {
  'server-only': {},
  'reading-time': () => ({ minutes: 1 }),
  './supabase/admin': { createSupabaseAdmin: () => ({}) },
});
const writings = [
  { slug: 'latest', date: '2026-11-21' },
  { slug: 'popular', date: '2026-11-01' },
  { slug: 'steady', date: '2026-10-01' },
];
const ranked = posts.rankWritingsByViews(writings, [
  { slug: 'popular', count: 20 },
  { slug: 'steady', count: 5 },
]);
assert.equal(JSON.stringify(ranked.map(item => item.slug)), JSON.stringify(['popular', 'steady', 'latest']));

const home = fs.readFileSync('app/page.tsx', 'utf8');
assert.match(home, /find\(\(episode\) => episode\.isPinned\)/, 'home must prefer the pinned monolog');
assert.match(home, /getTopWritings\(3\)/, 'home must load the most-read writing topics');
assert.match(home, /badge\?\.trim\(\).*sedang dibaca/s, 'home must derive the current book from Library status');
assert.match(home, /Jangan sungkan untuk menitipkan pesan/, 'home must invite visitors to the guestbook');
assert.doesNotMatch(home, /getAllProjects|proyek terpilih/, 'old project highlights should not dilute the new homepage focus');
console.log('PASS homepage pinned monolog, view-ranked topics, current reading, and guestbook callout');
