const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTypeScript(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

const root = path.resolve(__dirname, '..');
const shared = loadTypeScript(path.join(root, 'lib/monolog-shared.ts'));
const queries = loadTypeScript(path.join(root, 'lib/monolog-category-queries.ts'), {
  '@/lib/supabase/public': { createSupabasePublic: () => ({}) },
  '@/lib/monolog-shared': shared,
});

const mapped = queries.mapMonologCategory({ id: 9, slug: 'kopi-pagi', label: 'Kopi Pagi', sort_order: 70 });
assert.deepEqual(mapped, { id: 9, slug: 'kopi-pagi', label: 'Kopi Pagi', sortOrder: 70 });
assert.equal(shared.slugifyMonologCategory('  Ngopi & Cerita  '), 'ngopi-cerita');
assert.equal(shared.monologCategoryLabel('kopi-pagi', [mapped]), 'Kopi Pagi');
assert.equal(shared.monologCategoryLabel('catatan-harian', []), 'Catatan Harian');

const migration = fs.readFileSync(path.join(root, 'supabase/migrations/021_monolog_categories.sql'), 'utf8');
const adminPage = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/page.tsx'), 'utf8');
const manager = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/category-manager.tsx'), 'utf8');
const actions = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/category-actions.ts'), 'utf8');
const episodeActions = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/actions.ts'), 'utf8');
const editor = fs.readFileSync(path.join(root, 'app/admin/(protected)/monolog/monolog-editor.tsx'), 'utf8');
const publicList = fs.readFileSync(path.join(root, 'components/monolog-list.tsx'), 'utf8');

assert.match(migration, /create table if not exists public\.monolog_categories/);
assert.match(migration, /on update cascade/i, 'renaming category slugs must update existing episodes');
assert.match(manager, /readOnly=\{mode === 'create' && !slugManual\}/, 'automatic category slugs should ignore accidental edits');
assert.match(manager, /Pakai otomatis/, 'manual category slugs should be able to return to automatic mode');
assert.match(migration, /on delete restrict/i, 'used categories must be protected from deletion');
assert.match(migration, /monolog_categories_read_all/, 'public pages must be able to read categories');
assert.match(adminPage, /<CategoryManager/, 'admin Monolog page must expose category management');
assert.match(manager, /Tambah kategori/);
assert.match(manager, /updateMonologCategory/);
assert.match(manager, /deleteMonologCategory/);
assert.match(actions, /requireAdmin\(\)/, 'category mutations must require admin');
assert.match(actions, /masih dipakai oleh.*episode/, 'used categories must explain why deletion is blocked');
assert.match(actions, /Minimal satu kategori harus tetap tersedia/, 'the final category must not be deletable');
assert.match(episodeActions, /categoryExists\(input\.category\)/, 'episode saves must validate dynamic categories');
assert.doesNotMatch(episodeActions, /monologCategories\.some/, 'episode validation must not use a hard-coded category list');
assert.match(editor, /categories\.map/, 'episode editor must load category options dynamically');
assert.match(publicList, /categories\.map/, 'public library filters must load categories dynamically');

console.log('PASS dynamic Monolog category schema, CRUD controls, validation, and public filters');
