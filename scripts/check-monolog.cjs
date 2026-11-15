const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTypeScript(file, mocks = {}) {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

const root = path.resolve(__dirname, '..');
const content = loadTypeScript(path.join(root, 'content/monolog/episodes.ts'));
const monolog = loadTypeScript(path.join(root, 'lib/monolog.ts'), {
  '@/content/monolog/episodes': content,
});

assert.equal(monolog.getPublishedMonologEpisodes().length, 0, 'development sample must stay private');

const fixtures = [
  {
    id: 'older', slug: 'episode-lama', title: 'Episode Lama', description: 'Deskripsi episode lama.',
    category: 'karier', audioUrl: '/audio/monolog/episode-lama.m4a', durationSeconds: 61,
    publishedAt: '2026-01-01T08:00:00+07:00', status: 'published', tags: ['komunikasi'],
  },
  {
    id: 'newer', slug: 'episode-baru', title: 'Episode Baru', description: 'Deskripsi episode baru.',
    category: 'karier', audioUrl: 'https://cdn.example.com/episode-baru.m4a', durationSeconds: 125,
    publishedAt: '2026-02-01T08:00:00+07:00', status: 'published', tags: ['komunikasi', 'kerja'],
  },
  {
    id: 'draft', slug: 'masih-draft', title: 'Masih Draft', description: 'Belum tersedia untuk publik.',
    category: 'random', audioUrl: null, durationSeconds: null, publishedAt: null, status: 'draft',
  },
];

const parsed = monolog.parseMonologEpisodes(fixtures);
assert.equal(parsed.length, 3);
assert.deepEqual(parsed[1].tags, ['komunikasi', 'kerja']);
assert.equal(monolog.formatAudioDuration(125), '2:05');
assert.equal(monolog.audioDurationIso(125), 'PT2M5S');
assert.equal(monolog.monologCategoryLabel('menuju-nikah'), 'Menuju Nikah');

assert.throws(() => monolog.parseMonologEpisodes([...fixtures, {
  ...fixtures[0], id: 'broken', slug: 'audio-rusak', audioUrl: '/audio/monolog/audio-rusak.mp3',
}]), /URL \.m4a yang valid/);
assert.throws(() => monolog.parseMonologEpisodes([...fixtures, {
  ...fixtures[0], id: 'duplicate', slug: 'episode-baru',
}]), /slug .* duplikat/);

const nav = fs.readFileSync(path.join(root, 'lib/site-config.ts'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'app/sitemap.ts'), 'utf8');
assert.match(nav, /href: '\/monolog'/, 'Monolog should be in navigation');
assert.match(sitemap, /getPublishedMonologEpisodes/, 'published episodes should be in sitemap');

console.log('Monolog content checks passed.');
