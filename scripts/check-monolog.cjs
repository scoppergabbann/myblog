const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTypeScript(file, mocks = {}) {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

const rows = [
  {
    id: 2, slug: 'episode-baru', title: 'Episode Baru', description: 'Deskripsi baru.', category: 'karier',
    audio_url: 'https://cdn.example.com/baru.m4a', audio_path: '2026/11/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.m4a',
    duration_seconds: 125, published_at: '2026-11-15T08:00:00+07:00', status: 'published',
    transcript: 'Transkrip', reflection: null, tags: ['komunikasi'], created_at: '2026-11-15', updated_at: '2026-11-15',
  },
  {
    id: 1, slug: 'episode-lama', title: 'Episode Lama', description: 'Deskripsi lama.', category: 'karier',
    audio_url: 'https://cdn.example.com/lama.m4a', audio_path: null, duration_seconds: 61,
    published_at: '2026-10-01T08:00:00+07:00', status: 'published', transcript: null,
    reflection: null, tags: ['komunikasi'], created_at: '2026-10-01', updated_at: '2026-10-01',
  },
  {
    id: 3, slug: 'draft', title: 'Draft', description: 'Belum publik.', category: 'random',
    audio_url: '', audio_path: null, duration_seconds: 0, published_at: null, status: 'draft',
    transcript: null, reflection: null, tags: [], created_at: '2026-11-16', updated_at: '2026-11-16',
  },
];

let databaseError = null;
function createSupabasePublic() {
  return {
    from() {
      const filters = [];
      let single = false;
      const builder = {
        select() { return builder; },
        eq(column, value) { filters.push([column, value]); return builder; },
        order() { return builder; },
        maybeSingle() { single = true; return builder; },
        then(resolve) {
          if (databaseError) return resolve({ data: null, error: databaseError });
          const matched = rows.filter((row) => filters.every(([column, value]) => row[column] === value));
          return resolve({ data: single ? matched[0] ?? null : matched, error: null });
        },
      };
      return builder;
    },
  };
}

const root = path.resolve(__dirname, '..');
const monolog = loadTypeScript(path.join(root, 'lib/monolog.ts'), {
  '@/lib/supabase/public': { createSupabasePublic },
});
const shared = loadTypeScript(path.join(root, 'lib/monolog-shared.ts'));

(async () => {
  const published = await monolog.getPublishedMonologEpisodes();
  assert.equal(published.length, 2, 'draft episodes must not be returned');
  assert.equal(published[0].audioUrl, 'https://cdn.example.com/baru.m4a');
  assert.equal(published[0].audioPath, '2026/11/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.m4a');
  assert.equal((await monolog.getPublishedMonologEpisode('draft')), null, 'draft detail must be hidden');
  assert.equal((await monolog.getPublishedMonologEpisode('episode-baru')).title, 'Episode Baru');
  assert.equal(monolog.getRelatedMonologEpisodes(published[0], published)[0].slug, 'episode-lama');
  assert.equal(shared.formatAudioDuration(125), '2:05');
  assert.equal(shared.audioDurationIso(125), 'PT2M5S');
  assert.equal(shared.monologCategoryLabel('menuju-nikah'), 'Menuju Nikah');

  databaseError = { code: 'PGRST205', message: 'table missing' };
  assert.deepEqual(await monolog.getPublishedMonologEpisodes(), [], 'missing migration should keep public index available');
  databaseError = null;

  const migration = fs.readFileSync(path.join(root, 'supabase/migrations/019_monolog.sql'), 'utf8');
  const actions = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/actions.ts'), 'utf8');
  const adminLayout = fs.readFileSync(path.join(root, 'app/admin/(protected)/layout.tsx'), 'utf8');
  assert.match(migration, /create table if not exists public\.monolog_episodes/);
  assert.match(migration, /using \(status = 'published'\)/, 'public policy must hide drafts');
  assert.match(migration, /'monolog-audio'/, 'migration must create the audio bucket');
  assert.match(actions, /requireAdmin\(\)/, 'CRUD and upload actions must require admin');
  assert.match(actions, /createSignedUploadUrl/, 'audio must use direct signed upload');
  assert.match(adminLayout, /href: '\/admin\/monolog'/, 'admin navigation should include Monolog');
  assert.ok(fs.existsSync(path.join(root, 'app/admin/(protected)/monolog/new/page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'app/admin/(protected)/monolog/[id]/page.tsx')));
  console.log('Monolog CRUD checks passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
