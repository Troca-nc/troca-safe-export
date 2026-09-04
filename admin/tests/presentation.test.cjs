const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function presentation() {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/presentation.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, { module: mod, exports: mod.exports,
    require(name) { assert.equal(name, './formatters'); return { formatXpf: (value) => `${value} XPF` }; } });
  return mod.exports;
}

test('presentation preserves real zero and rejects missing or malformed metrics', () => {
  const view = presentation();
  assert.equal(view.displayCount(0), '0');
  assert.equal(view.displayCount(12), '12');
  assert.equal(view.displayXpf(0), '0 XPF');
  for (const value of [undefined, null, '', '0', Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(view.displayCount(value), 'Non renseigné');
    assert.equal(view.displayXpf(value), 'Non renseigné');
  }
});

test('array presentation distinguishes a real empty result from an absent collection', () => {
  const view = presentation();
  assert.equal(view.displayArrayCount([]), '0');
  assert.equal(view.displayArrayCount([{}, {}]), '2');
  assert.equal(view.displayArrayCount(undefined), 'Non renseigné');
  assert.deepEqual(Array.from(view.rowsOrEmpty([{ id: 1 }])), [{ id: 1 }]);
  assert.deepEqual(Array.from(view.rowsOrEmpty(null)), []);
});

test('visual percentage width is bounded without presenting a missing metric as data', () => {
  const view = presentation();
  assert.equal(view.percentageWidth(0), 0);
  assert.equal(view.percentageWidth(42.5), 42.5);
  assert.equal(view.percentageWidth(120), 100);
  assert.equal(view.percentageWidth(-2), 0);
  assert.equal(view.percentageWidth(undefined), 0);
});

test('remaining Admin metric screens do not coerce absent headline values to zero', () => {
  for (const file of ['src/app/dashboard/page.tsx', 'src/app/stats/page.tsx', 'src/app/reports/page.tsx', 'src/app/payments/page.tsx',
    'src/app/users/page.tsx', 'src/app/users/[id]/page.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.ok(!source.includes('?? 0'), file);
    assert.ok(!source.includes('|| 0'), file);
  }
});
