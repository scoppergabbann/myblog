const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'app/api/cron/supabase-heartbeat/route.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const env = {};
let calls = 0;
let failure = false;
let throws = false;
const context = {
  exports: {}, Buffer, Response, AbortSignal, process: { env }, console: { error() {} },
  require(name) {
    if (name === 'node:crypto') return require(name);
    assert.equal(name, '@/lib/supabase/admin');
    return { createSupabaseAdmin() {
      calls++;
      if (throws) throw new Error('sensitive credentials');
      return { from(table) {
        assert.equal(table, 'database_heartbeat');
        return { upsert(row, options) {
          assert.equal(row.id, 1);
          assert.ok(Number.isFinite(Date.parse(row.last_seen_at)));
          assert.equal(options.onConflict, 'id');
          return { abortSignal: async (signal) => {
            assert.ok(signal instanceof AbortSignal);
            return { error: failure ? { code: 'TEST', message: 'sensitive database error' } : null };
          } };
        } };
      } };
    } };
  },
};
vm.runInNewContext(code, context);
const run = (authorization) => context.exports.GET(new Request('https://example.com/api/cron/supabase-heartbeat', {
  headers: authorization ? { authorization } : {},
}));
(async () => {
  assert.equal((await run()).status, 503);
  env.CRON_SECRET = 'test-secret-not-for-production';
  for (const header of [undefined, 'Bearer wrong', `Bearer ${'x'.repeat(env.CRON_SECRET.length)}`]) {
    assert.equal((await run(header)).status, 401);
  }
  assert.equal(calls, 0, 'Unauthorized requests never access database');
  const auth = `Bearer ${env.CRON_SECRET}`;
  for (let i = 0; i < 2; i++) {
    const response = await run(auth);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).ok, true);
  }
  failure = true;
  assert.equal((await run(auth)).status, 503);
  throws = true;
  const failed = await run(auth);
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /sensitive/);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.deepEqual(config.crons, [{ path: '/api/cron/supabase-heartbeat', schedule: '0 2 * * *' }]);
  console.log('PASS: missing/invalid secrets, no unauthorized DB access, singleton upsert, no cache, DB errors, exception redaction, daily schedule');
})().catch((error) => { console.error(error); process.exitCode = 1; });
