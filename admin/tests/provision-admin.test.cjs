const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const provision = require('../scripts/provision-admin.cjs');

test('example bcrypt hash is literal for Docker Compose interpolation', () => {
  const example = fs.readFileSync(path.join(__dirname, '../../.env.example'), 'utf8');
  assert.match(example, /^ADMIN_PASSWORD_HASH='\$2b\$12\$/m);
});

function runtimeTotp() {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/totp.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, { module: mod, exports: mod.exports,
    require(name) { assert.equal(name, 'node:crypto'); return require('node:crypto'); }, Buffer, URLSearchParams });
  return mod.exports;
}

test('provisioning generates a 160-bit Base32 secret and an encoded standard URI', () => {
  const secret = provision.generateBase32Secret(Buffer.from([...Array(20).keys()]));
  assert.match(secret, /^[A-Z2-7]{32}$/);
  const uri = provision.createOtpAuthUrl(secret, 'operator+test@example.test');
  assert.ok(uri.startsWith('otpauth://totp/Kalico%20Admin%3Aoperator%2Btest%40example.test?'));
  assert.equal(new URL(uri).searchParams.get('secret'), secret);
  assert.equal(new URL(uri).searchParams.get('issuer'), 'Kalico Admin');
});

test('provisioning TOTP verifier agrees with the RFC vector truncated to six digits', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(provision.verifyTotpToken(secret, '287082', 59_000, 0), true);
  assert.equal(provision.verifyTotpToken(secret, '287083', 59_000, 0), false);
  assert.equal(provision.verifyTotpToken(secret, 'not-a-code', 59_000, 0), false);
});

test('provisioning and application verify the same generated secret', () => {
  const secret = provision.generateBase32Secret(Buffer.from([...Array(20).keys()].reverse()));
  const epoch = 1_725_000_000_000;
  const matchingCode = provision.generateTotpToken(secret, epoch);
  assert.equal(runtimeTotp().verifyTotpToken({ secret, token: matchingCode, epoch, window: 0 }), true);
});

test('email and password policy reject unsafe provisioning input', () => {
  assert.equal(provision.validateEmail(' Operator@Example.test '), 'operator@example.test');
  for (const value of ['', 'not-an-email', 'a@b', "o'perator@example.test", `${'a'.repeat(250)}@example.test`]) {
    assert.throws(() => provision.validateEmail(value));
  }
  assert.equal(provision.validatePassword('a secure phrase!'), 'a secure phrase!');
  assert.throws(() => provision.validatePassword('too-short'));
  assert.throws(() => provision.validatePassword('a'.repeat(201)));
});

test('non-interactive execution fails before producing any secret', () => {
  const script = path.join(__dirname, '../scripts/provision-admin.cjs');
  const result = spawnSync(process.execPath, [script], { input: '', encoding: 'utf8', windowsHide: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /terminal interactif local/);
  assert.ok(!result.stdout.includes('ADMIN_TOTP_SECRET'));
  assert.ok(!result.stdout.includes('otpauth://'));
});
