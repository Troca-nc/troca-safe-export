'use strict';

// Test the actual k6 script with simulated HTTP; no load or external requests.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness({ env = {}, status = 200, headers = { 'Content-Type': 'application/json' }, payload = { data: { access_token: 'synthetic' } }, invalidJson = false } = {}) {
  let source = fs.readFileSync(path.join(__dirname, 'critical-routes.js'), 'utf8');
  source = source.replace("import http from 'k6/http'", '').replace("import { check, sleep } from 'k6'", '')
    .replace('export const options', 'const options').replace('export function setup', 'function setup')
    .replace('export default function (data)', 'function iteration(data)');
  const calls = { post: [], batch: [], json: 0 };
  const sandbox = {
    __ENV: env,
    http: {
      post(...args) {
        calls.post.push(args);
        return { status, headers, json() {
          calls.json++;
          if (invalidJson) throw new Error('PRIVATE RESPONSE BODY');
          return payload;
        } };
      },
      batch(requests) { calls.batch.push(requests); return requests.map(() => ({ status: 200 })); },
    },
    check(response, checks) { return Object.values(checks).every(fn => fn(response)); },
    sleep() {},
  };
  vm.runInNewContext(`${source}\nthis.api = { setup, iteration, options };`, sandbox, { timeout: 1000 });
  return { ...sandbox.api, calls };
}

test('login uses API origin while all pages use frontend origin', () => {
  const h = harness({ env: { K6_BASE_URL: 'http://127.0.0.1:3000/', K6_API_BASE_URL: 'http://127.0.0.1:3001/' } });
  const data = h.setup(); h.iteration(data);
  assert.equal(h.calls.post[0][0], 'http://127.0.0.1:3001/api/auth/login');
  assert.deepEqual(Array.from(h.calls.batch[0], r => r[1]), [
    'http://127.0.0.1:3000/', 'http://127.0.0.1:3000/pro/dashboard', 'http://127.0.0.1:3000/abonnement',
  ]);
});
test('same-origin fallback remains supported', () => {
  const h = harness({ env: { K6_BASE_URL: 'http://synthetic.invalid/' } });
  h.setup(); assert.equal(h.calls.post[0][0], 'http://synthetic.invalid/api/auth/login');
});
for (const status of [0, 401, 404, 500]) {
  test(`HTTP ${status} stops before parsing JSON`, () => {
    const h = harness({ status, invalidJson: true });
    assert.throws(() => h.setup(), new RegExp(`expected HTTP 200, received ${status}`));
    assert.equal(h.calls.json, 0);
  });
}
test('HTML response stops before parsing JSON', () => {
  const h = harness({ headers: { 'Content-Type': 'text/html' } });
  assert.throws(() => h.setup(), /expected a JSON response/);
  assert.equal(h.calls.json, 0);
});
test('malformed JSON produces a safe message without body contents', () => {
  const h = harness({ invalidJson: true });
  assert.throws(() => h.setup(), error => error.message === 'Login failed: invalid JSON response');
});
test('missing or invalid access token stops setup', () => {
  for (const payload of [null, {}, { access_token: 42 }, { access_token: ' ' }]) {
    assert.throws(() => harness({ payload }).setup(), /Access token missing/);
  }
});
test('lowercase JSON header and root access token are accepted', () => {
  const h = harness({ headers: { 'content-type': 'application/json; charset=utf-8' }, payload: { access_token: 'synthetic' } });
  assert.equal(h.setup().accessToken, 'synthetic');
});
test('load profile and failure thresholds remain unchanged', () => {
  const h = harness();
  assert.equal(h.options.scenarios.critical_routes.vus, 50);
  assert.equal(h.options.scenarios.critical_routes.duration, '2m');
  assert.equal(h.options.thresholds.http_req_failed[0], 'rate<0.01');
  assert.equal(h.options.thresholds.http_req_duration[0], 'p(95)<1200');
});
