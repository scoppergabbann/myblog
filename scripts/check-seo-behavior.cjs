const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');

function load(file, imports, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    ...globals,
    exports, URL, process: globals.process ?? { env: { ADMIN_USERNAME: 'admin' } },
    console: { error() {} },
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return exports;
}

async function main() {
  let maintenance = true;
  const middleware = load('middleware.ts', {
    '@/auth': { auth: (handler) => handler },
    '@/lib/article-status-edge': { articleStatus: async () => 200 },
    'next/server': { NextResponse },
    '@/lib/maintenance-edge': { isMaintenanceEnabled: async () => maintenance },
  }).default;
  const request = (path, admin = false) => ({
    nextUrl: new URL(path, 'https://belutbakarsurabaya.com'),
    auth: admin ? { user: { login: 'admin' } } : null,
  });
  const response = await middleware(request('/writing/test?utm_source=test'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('retry-after'), '60');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-middleware-rewrite'), 'https://belutbakarsurabaya.com/maintenance');
  assert.equal((await middleware(request('/maintenance'))).status, 503);
  for (const path of ['/robots.txt', '/sitemap.xml', '/admin/login']) {
    assert.equal((await middleware(request(path))).status, 200);
  }
  assert.equal((await middleware(request('/writing/test', true))).status, 200);
  assert.equal((await middleware(request('/admin'))).status, 307);
  maintenance = false;
  assert.equal((await middleware(request('/writing/test'))).status, 200);
  assert.equal((await middleware(request('/maintenance'))).status, 307);

  let result = { data: null, error: { message: 'offline' } };
  const query = new Proxy({}, { get: (_, key) => key === 'then'
    ? (resolve) => Promise.resolve(result).then(resolve)
    : () => query });
  const posts = load('lib/posts.ts', {
    'server-only': {}, 'reading-time': { default: () => ({ minutes: 1 }) },
    './supabase/admin': { createSupabaseAdmin: () => ({ from: () => query }) },
  });
  await assert.rejects(posts.getAllWritings(), /temporarily unavailable/);
  await assert.rejects(posts.getWritingBySlug('missing'), /temporarily unavailable/);
  result = { data: null, error: null };
  assert.equal(await posts.getWritingBySlug('missing'), null);
  result = { data: [], error: null };
  assert.equal((await posts.getAllWritings()).length, 0);
  let captured;
  let available = true;
  const edge = load('lib/article-status-edge.ts', {}, {
    URLSearchParams, TextEncoder, Uint8Array, AbortSignal,
    crypto: require('node:crypto').webcrypto,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.test',
      SUPABASE_SERVICE_ROLE_KEY: 'test-only', ADMIN_SECRET: 'test-secret' } },
    fetch: async (url) => {
      captured = new URL(url);
      return { ok: available, json: async () => [] };
    },
  });
  assert.equal(await edge.articleStatus('missing', null), 404);
  assert.equal(captured.searchParams.get('status'), 'eq.published');
  await edge.articleStatus('draft', 'invalid');
  assert.equal(captured.searchParams.get('status'), 'eq.published');
  const token = require('node:crypto').createHmac('sha256', 'test-secret')
    .update('draft:draft').digest('hex').slice(0, 24);
  await edge.articleStatus('draft', token);
  assert.equal(captured.searchParams.has('status'), false);
  available = false;
  assert.equal(await edge.articleStatus('missing', null), 503);
  console.log('PASS: maintenance, public bypasses, admin auth, and database failure vs missing/empty content');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
