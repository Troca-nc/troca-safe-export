'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const { warmup, ROUTES } = require('../../scripts/warmup-performance.cjs');

function launch(env = {}, buildExists = true) {
  const spawned = [];
  const imports = {
    fs: { existsSync: () => buildExists, mkdirSync() {}, openSync: () => 1, writeFileSync() {} },
    path,
    child_process: { spawn(command, args, options) { spawned.push({ command, args, options }); return { pid: spawned.length }; } },
    './scripts/loadDemoEnv': { loadDemoEnv() {} },
  };
  const sandbox = {
    __dirname: path.resolve(__dirname, '../..'),
    require(name) { assert.ok(Object.hasOwn(imports, name)); return imports[name]; },
    process: { env, execPath: 'node', on() {} },
    console: { log() {} }, setInterval() {},
  };
  const source = fs.readFileSync(path.join(__dirname, '../../playwright-launch-services.js'), 'utf8');
  vm.runInNewContext(source, sandbox, { timeout: 1000 });
  return spawned;
}
test('default launcher still uses development mode', () => {
  const calls = launch();
  assert.equal(calls[1].args[1], 'dev');
  assert.equal(calls[1].options.env.NODE_ENV, 'development');
});
test('production test mode uses next start and retains simulated backend', () => {
  const calls = launch({ PLAYWRIGHT_FRONTEND_MODE: 'production' });
  assert.equal(calls[1].args[1], 'start');
  assert.equal(calls[1].options.env.NODE_ENV, 'production');
  assert.equal(calls[0].args[0], 'scripts/demo-server.js');
});
test('missing build and invalid mode fail before starting services', () => {
  assert.throws(() => launch({ PLAYWRIGHT_FRONTEND_MODE: 'production' }, false), /Build the frontend/);
  assert.throws(() => launch({ PLAYWRIGHT_FRONTEND_MODE: 'unknown' }), /must be development or production/);
});
test('warmup rejects external or ambiguous destinations', async () => {
  for (const url of ['https://kalico-nc.com', 'http://localhost.evil.invalid', 'http://user:pass@localhost', 'http://localhost/api']) {
    await assert.rejects(warmup(url), /loopback origin/);
  }
});
async function withServer(handler, fn) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
test('warmup visits each local route exactly once', async () => {
  const seen = [];
  await withServer((req, res) => { seen.push(req.url); res.end('synthetic page'); }, warmup);
  assert.deepEqual(seen, ROUTES);
});
test('warmup fails on HTTP error and stops subsequent requests', async () => {
  let count = 0;
  await withServer((req, res) => { count++; res.writeHead(503).end(); }, url => assert.rejects(warmup(url), /HTTP 503/));
  assert.equal(count, 1);
});
test('warmup never follows redirects outside the local server', async () => {
  await withServer((req, res) => { res.writeHead(302, { Location: 'https://example.invalid' }).end(); }, url => assert.rejects(warmup(url)));
});
