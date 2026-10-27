const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => name in imports ? imports[name] : require(name), URL, FormData, console });
  return module.exports;
}
const groups = load('lib/project-status.ts');
assert.equal(groups.projectGroup('live'), 'active');
assert.equal(groups.projectGroup('wip'), 'active');
assert.equal(groups.projectGroup('archived'), 'archived');
const cards = load('components/project-card.tsx', { '@/lib/project-status': groups });
const samples = ['live', 'wip', 'archived'].map((status, index) => ({ title: 'Project ' + index, description: 'Description', stack: ['TypeScript'], status, url: 'https://example.com', github: 'https://github.com/example/repo', updated: '2026-10-26' }));
const page = load('app/projects/page.tsx', {
  '@/lib/seo': { pageMetadata: () => ({}) }, '@/lib/content-queries': { getAllProjects: async () => samples },
  '@/lib/utils': { formatDate: value => value }, '@/lib/project-status': groups, '@/components/project-card': cards,
});
let authorized = true, written, calls = 0, response = { data: { id: 7 }, error: null }, paths = [];
const query = new Proxy({}, { get: (_, key) => (...args) => {
  if (key === 'insert' || key === 'update') written = args[0];
  if (key === 'single' || key === 'maybeSingle') return Promise.resolve(response);
  return query;
} });
const actions = load('app/admin/(protected)/projects/actions.ts', {
  '@/auth': { auth: async () => ({}), isAdmin: () => authorized },
  '@/lib/supabase/admin': { createSupabaseAdmin: () => ({ from: table => { calls++; assert.equal(table, 'projects'); return query; } }) },
  'next/cache': { revalidatePath: path => paths.push(path) },
});
function form(patch = {}) {
  const value = { title: 'Test', description: 'Test project', stack: 'Next.js, PostgreSQL', status: 'live', display_order: '10', url: 'https://example.com', ...patch };
  const data = new FormData(); for (const [key, text] of Object.entries(value)) data.set(key, text); return data;
}
(async () => {
  const html = renderToStaticMarkup(await page.default());
  const activeSection = html.split('id="active-projects"')[1].split('id="archived-projects"')[0];
  const archivedSection = html.split('id="archived-projects"')[1];
  assert.ok(activeSection.includes('Project 0') && activeSection.includes('Project 1') && !activeSection.includes('Project 2'));
  assert.ok(archivedSection.includes('Project 2') && !archivedSection.includes('Project 0'));
  assert.ok(html.includes('Active Projects') && html.includes('Archived Projects'));
  const cardHTML = renderToStaticMarkup(React.createElement(cards.ProjectCard, { project: samples[0] }));
  assert.ok(cardHTML.includes('Buka proyek') && cardHTML.includes('Source code'));
  const noLink = renderToStaticMarkup(React.createElement(cards.ProjectCard, { project: { ...samples[0], url: 'javascript:alert(1)', github: undefined } }));
  assert.ok(!noLink.includes('<a ') && !noLink.includes('href="#"'));
  assert.equal((await actions.createProject(null, form())).ok, true);
  assert.equal(written.status, 'live'); assert.equal(written.stack.join(','), 'Next.js,PostgreSQL');
  assert.equal((await actions.updateProject(7, null, form({ status: 'archived' }))).ok, true);
  assert.equal(written.status, 'archived');
  assert.equal((await actions.setProjectStatus(7, 'live')).ok, true); assert.equal(written.status, 'live');
  const before = calls;
  assert.equal((await actions.setProjectStatus(7, 'wip')).ok, false);
  assert.equal((await actions.setProjectStatus(-1, 'live')).ok, false);
  assert.equal((await actions.createProject(null, form({ status: 'wip' }))).ok, false);
  assert.equal((await actions.createProject(null, form({ url: 'javascript:alert(1)' }))).ok, false);
  assert.equal((await actions.createProject(null, form({ display_order: 'NaN' }))).ok, false);
  assert.equal(calls, before);
  response = { data: null, error: null };
  assert.equal((await actions.setProjectStatus(999, 'archived')).ok, false);
  assert.equal((await actions.updateProject(999, null, form())).ok, false);
  assert.equal((await actions.deleteProject(999)).ok, false);
  response = { data: null, error: { message: 'Database unavailable' } }; paths = [];
  assert.equal((await actions.setProjectStatus(7, 'archived')).ok, false); assert.equal(paths.length, 0);
  authorized = false;
  await assert.rejects(actions.createProject(null, form()), /Unauthorized/);
  await assert.rejects(actions.setProjectStatus(7, 'live'), /Unauthorized/);
  console.log('PASS Active/Archived grouping, legacy WIP mapping, page rendering, links, CRUD/status validation, missing rows, failed writes, and admin authorization');
})().catch(error => { console.error(error); process.exitCode = 1; });
