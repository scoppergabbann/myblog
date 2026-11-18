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
      jsx: ts.JsxEmit.ReactJSX,
    },
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
const streamReactions = loadTypeScript(path.join(root, 'lib/stream-reactions.ts'));
const monologReactions = loadTypeScript(path.join(root, 'lib/monolog-reactions.ts'), {
  '@/lib/stream-reactions': streamReactions,
});

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
  assert.equal(shared.slugifyMonologTitle('Ngopi & Tenis di Surabaya!'), 'ngopi-tenis-di-surabaya');
  assert.equal(shared.slugifyMonologTitle('  Déjà Vu  '), 'deja-vu');
  assert.deepEqual(
    monologReactions.monologReactionTarget('episode-baru', 'heart'),
    { slug: '/monolog/episode-baru', emoji: 'love' },
  );
  assert.deepEqual(
    monologReactions.monologReactionTarget('episode-baru', 'cheers'),
    { slug: '/monolog/episode-baru:cheers', emoji: 'love' },
  );

  databaseError = { code: 'PGRST205', message: 'table missing' };
  assert.deepEqual(await monolog.getPublishedMonologEpisodes(), [], 'missing migration should keep public index available');
  databaseError = null;

  const migration = fs.readFileSync(path.join(root, 'supabase/migrations/019_monolog.sql'), 'utf8');
  const actions = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/actions.ts'), 'utf8');
  const audioUpload = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/audio-upload.tsx'), 'utf8');
  const editor = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/monolog-editor.tsx'), 'utf8');
  const detail = fs.readFileSync(path.join(root, 'app/monolog/[slug]/page.tsx'), 'utf8');
  const reactionActions = fs.readFileSync(path.join(root, 'app/monolog/[slug]/reaction-actions.ts'), 'utf8');
  const reactionQueries = fs.readFileSync(path.join(root, 'lib/monolog-reaction-queries.ts'), 'utf8');
  const audioPlayer = fs.readFileSync(path.join(root, 'components/monolog-audio-player.tsx'), 'utf8');
  const globalCss = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
  const listUi = fs.readFileSync(path.join(root, 'components/monolog-list.tsx'), 'utf8');
  const cardUi = fs.readFileSync(path.join(root, 'components/monolog-episode-card.tsx'), 'utf8');
  const indexPage = fs.readFileSync(path.join(root, 'app/monolog/page.tsx'), 'utf8');
  const adminLayout = fs.readFileSync(path.join(root, 'app/admin/(protected)/layout.tsx'), 'utf8');
  assert.match(migration, /create table if not exists public\.monolog_episodes/);
  assert.match(migration, /using \(status = 'published'\)/, 'public policy must hide drafts');
  assert.match(migration, /'monolog-audio'/, 'migration must create the audio bucket');
  assert.match(actions, /requireAdmin\(\)/, 'CRUD and upload actions must require admin');
  assert.match(actions, /createSignedUploadUrl/, 'audio must use direct signed upload');
  assert.match(actions, /referencedAudioPaths/, 'orphan cleanup must protect referenced audio');
  assert.match(actions, /discardMonologAudio/, 'abandoned uploads must be removable');
  assert.match(audioUpload, /XMLHttpRequest/, 'audio upload should expose progress events');
  assert.match(audioUpload, /role="progressbar"/, 'audio upload should render accessible progress');
  assert.match(editor, /slugifyMonologTitle/, 'new episode slug should follow its title');
  assert.match(detail, /verifyDraftToken\(`monolog:/, 'draft preview must verify a namespaced token');
  assert.match(detail, /index: false, follow: false/, 'draft preview must not be indexed');
  assert.match(detail, /isPreview \? null : await getMonologReactionStates/, 'draft preview must not load reactions');
  assert.match(reactionActions, /eq\('status', 'published'\)/, 'only published episodes may accept reactions');
  assert.match(reactionActions, /monolog-reaction:/, 'monolog reactions must have a dedicated rate limit');
  assert.match(reactionActions, /getStreamVisitorHash\(true\)/, 'anonymous reactions need a stable browser identity');
  assert.match(reactionActions, /onConflict: 'slug,emoji,ip_hash'/, 'reaction retries must be idempotent');
  assert.match(reactionQueries, /monologReactionTarget/, 'reaction counts must use the isolated monolog namespace');
  assert.match(audioPlayer, /WAVEFORM_BARS/, 'audio player should render a waveform timeline');
  assert.match(audioPlayer, /isPlaying \? 'is-playing'/, 'equalizer animation must follow playback state');
  assert.match(audioPlayer, /passed = progress > 0/, 'waveform should visualize elapsed progress');
  assert.match(globalCss, /@keyframes monologWaveformPulse/, 'waveform animation must be defined');
  assert.match(globalCss, /prefers-reduced-motion:[\s\S]*monolog-player\.is-playing/, 'equalizer must respect reduced motion');
  assert.match(indexPage, /Koleksi suara untuk pikiran yang perlu didengar/, 'index should present an audio-library hero');
  assert.match(listUi, /type="search"/, 'audio library should be searchable');
  assert.match(listUi, /episode\.title, episode\.description, \.\.\.episode\.tags/, 'search should cover useful episode metadata');
  assert.match(cardUi, /variant="compact"/, 'library rows should use the compact audio player');
  assert.match(globalCss, /\.monolog-cover-disc/, 'episode rows should have collection artwork');

  const runtime = require('react/jsx-runtime');
  const icons = loadTypeScript(path.join(root, 'components/stream-reaction-icon.tsx'), {
    'react/jsx-runtime': runtime,
    '@/lib/stream-reactions': streamReactions,
  });
  const reactionUi = loadTypeScript(path.join(root, 'components/monolog-reactions.tsx'), {
    'react/jsx-runtime': runtime,
    react: require('react'),
    '@/app/monolog/[slug]/reaction-actions': { setMonologReaction: async () => ({ ok: true, active: true, count: 1 }) },
    '@/components/stream-reaction-icon': icons,
    '@/lib/monolog-reactions': monologReactions,
  });
  const initial = Object.fromEntries(streamReactions.streamReactionOptions.map(({ kind }) => [
    kind, { count: 0, active: false, available: true },
  ]));
  const reactionHtml = require('react-dom/server').renderToStaticMarkup(runtime.jsx(reactionUi.MonologReactions, {
    slug: 'episode-baru', title: 'Episode Baru', initial,
  }));
  assert.equal((reactionHtml.match(/<button /g) ?? []).length, 4, 'monolog should show four positive reactions');
  assert.ok(!/love/i.test(reactionHtml), 'monolog reaction UI must not expose a Love label');
  assert.ok(reactionHtml.includes('<svg'), 'Bersulang should use the bottle illustration');
  assert.match(adminLayout, /href: '\/admin\/monolog'/, 'admin navigation should include Monolog');
  assert.ok(fs.existsSync(path.join(root, 'app/admin/(protected)/monolog/new/page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'app/admin/(protected)/monolog/[id]/page.tsx')));
  console.log('Monolog CRUD checks passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
