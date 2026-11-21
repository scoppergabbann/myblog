const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTypeScript(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

const root = path.resolve(__dirname, '..');
const commentTarget = loadTypeScript(path.join(root, 'lib/comment-target.ts'));
const inserted = [];
const revalidated = [];
let monologAvailable = true;

function createSupabaseAdmin() {
  return {
    from(table) {
      if (table === 'comments') {
        return {
          async insert(value) {
            inserted.push(value);
            return { error: null };
          },
        };
      }

      const filters = [];
      const builder = {
        select() { return builder; },
        eq(column, value) { filters.push([column, value]); return builder; },
        is(column, value) { filters.push([column, value]); return builder; },
        async maybeSingle() {
          assert.deepEqual(filters, [
            ['slug', 'episode-baru'],
            ['status', 'published'],
            ['archived_at', null],
          ]);
          return { data: monologAvailable ? { id: 2 } : null, error: null };
        },
      };
      return builder;
    },
  };
}

const actions = loadTypeScript(path.join(root, 'app/writing/[slug]/comment-actions.ts'), {
  'next/cache': { revalidatePath: (value) => revalidated.push(value) },
  '@/lib/supabase/admin': { createSupabaseAdmin },
  '@/lib/comment-target': commentTarget,
  '@/lib/ip-hash': { getIpHash: async () => 'visitor-hash' },
  '@/lib/rate-limit': { rateLimit: () => ({ allowed: true }) },
});

function commentForm() {
  const form = new FormData();
  form.set('kind', 'monolog');
  form.set('slug', 'episode-baru');
  form.set('name', 'Pendengar');
  form.set('message', 'Monolog ini terasa dekat sekali.');
  form.set('website', '');
  return form;
}

(async () => {
  assert.deepEqual(await actions.submitComment(null, commentForm()), { ok: true });
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].slug, 'monolog:episode-baru');
  assert.equal(inserted[0].ip_hash, 'visitor-hash');
  assert.deepEqual(revalidated, ['/monolog/episode-baru']);

  monologAvailable = false;
  assert.deepEqual(
    await actions.submitComment(null, commentForm()),
    { ok: false, error: 'Monolog tidak tersedia untuk dikomentari.' },
  );
  assert.equal(inserted.length, 1, 'unpublished or archived monolog must not receive a comment');

  console.log('PASS monolog comment namespace, validation, persistence, and revalidation');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
