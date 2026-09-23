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
let readFailure = false;
let stored = null;
let writes = 0;
let now = '2026-01-30T02:45:00.000Z';
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
}
const context = {
  Date: TestDate,
  exports: {}, Buffer, Response, AbortSignal, process: { env }, console: { error() {} },
  require(name) {
    if (name === 'node:crypto') return require(name);
    assert.equal(name, '@/lib/supabase/admin');
    return { createSupabaseAdmin() {
      calls++;
      if (throws) throw new Error('sensitive credentials');
      return { from(table) {
        assert.equal(table, 'database_heartbeat');
        return {
          select(column) {
            assert.equal(column, 'last_seen_at');
            return { eq(key, value) {
              assert.equal(key, 'id');
              assert.equal(value, 1);
              return { abortSignal: () => ({ maybeSingle: async () => ({
                data: stored ? { last_seen_at: stored } : null,
                error: readFailure ? { code: 'TEST' } : null,
              }) }) };
            } };
          },
          upsert(row, options) {
          assert.equal(row.id, 1);
          assert.ok(Number.isFinite(Date.parse(row.last_seen_at)));
          assert.equal(options.onConflict, 'id');
          return { abortSignal: async (signal) => {
            assert.ok(signal instanceof AbortSignal);
            if (!failure) { stored = row.last_seen_at; writes++; }
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
  assert.equal(writes, 1, 'Repeated call does not rewrite heartbeat');
  now = '2026-02-01T02:00:00.000Z';
  assert.equal((await (await run(auth)).json()).skipped, true);
  assert.equal(writes, 1);
  now = '2026-02-02T02:00:00.000Z';
  assert.equal((await run(auth)).status, 200);
  assert.equal(writes, 2, 'Third calendar day writes across month boundary despite earlier clock time');
  readFailure = true;
  assert.equal((await run(auth)).status, 503);
  assert.equal(writes, 2);
  readFailure = false;
  now = '2026-02-05T02:00:00.000Z';
  failure = true;
  assert.equal((await run(auth)).status, 503);
  assert.equal(writes, 2);
  failure = false;
  now = '2026-02-06T02:00:00.000Z';
  assert.equal((await run(auth)).status, 200);
  assert.equal(writes, 3, 'Next daily invocation retries a failed write');
  throws = true;
  const failed = await run(auth);
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /sensitive/);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.deepEqual(config.crons, [{ path: '/api/cron/supabase-heartbeat', schedule: '0 2 * * *' }]);
  console.log('PASS: authorization, singleton, three-day writes, month boundary, early/repeated calls, read/write failures, retry, daily schedule');
})().catch((error) => { console.error(error); process.exitCode = 1; });
