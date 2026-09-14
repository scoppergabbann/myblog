const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const siteConfig = {
  name: 'Test Blog', description: 'Test feed', locale: 'id-ID', url: 'https://example.com',
  author: { name: 'Author', email: 'author@example.com' },
};

(async () => {
  const feedModule = await import('feed');
  for (const file of ['app/feed.json/route.ts', 'app/rss.xml/route.ts']) {
    let mode = 'failure';
    const context = {
      exports: {}, Response,
      require(name) {
        if (name === 'feed') return feedModule;
        if (name === '@/lib/site-config') return { siteConfig };
        assert.equal(name, '@/lib/posts');
        return { getAllWritings: async () => {
          if (mode === 'failure') throw new Error('private database details');
          if (mode === 'empty') return [];
          return [{ slug: 'hello', title: 'Hello', summary: 'Public summary',
            date: '2026-09-14T00:00:00.000Z', tags: ['test'], content: 'PRIVATE PREMIUM CONTENT', isPremium: true }];
        } };
      },
    };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText, context);
    assert.equal(context.exports.dynamic, 'force-dynamic');
    const failed = await context.exports.GET();
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get('cache-control'), 'no-store');
    assert.equal(failed.headers.get('retry-after'), '60');
    assert.doesNotMatch(await failed.text(), /private database/);
    mode = 'success';
    const recovered = await context.exports.GET();
    assert.equal(recovered.status, 200);
    assert.match(recovered.headers.get('cache-control'), /s-maxage=3600/);
    const body = await recovered.text();
    assert.match(body, /Public summary/);
    assert.doesNotMatch(body, /PRIVATE PREMIUM CONTENT/);
    if (file.includes('feed.json')) assert.equal(JSON.parse(body).items.length, 1);
    else assert.match(body, /<rss/);
    mode = 'empty';
    assert.equal((await context.exports.GET()).status, 200, 'A genuinely empty database remains a valid feed');
  }
  console.log('PASS: both feeds runtime-only, outage 503/no-store, recovery 200/cacheable, empty feeds, premium content excluded');
})().catch((error) => { console.error(error); process.exitCode = 1; });
