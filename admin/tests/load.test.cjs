const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(file, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  });
  const mod = { exports: {} };
  vm.runInNewContext(outputText, {
    module: mod, exports: mod.exports,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return mod.exports;
}

function loader(backend) {
  return loadModule('src/lib/load.ts', { './backend': { adminBackendJson: backend } }).loadAdminJson;
}

test('preserves successful data and forwards the requested path', async () => {
  const data = { data: [{ id: 1 }] };
  const load = loader(async (url) => { assert.equal(url, '/admin/users'); return data; });
  assert.equal(await load('/admin/users', null), data);
});

test('preserves a real empty collection and zero', async () => {
  for (const data of [[], { data: [], pagination: { total: 0 } }, 0]) {
    assert.equal(await loader(async () => data)('/test', null), data);
  }
});

test('does not turn network or authorization failures into empty data', async () => {
  for (const message of ['network unavailable', '401 internal detail', '403 private token']) {
    const load = loader(async () => { throw new Error(message); });
    await assert.rejects(() => load('/test', []), (error) => {
      assert.equal(error.message, 'Impossible de charger les données administratives.');
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('null or undefined backend responses are not a successful empty result', async () => {
  for (const data of [null, undefined]) {
    await assert.rejects(() => loader(async () => data)('/test', []));
  }
});

test('error view is generic and retry invokes reset', () => {
  const element = (type, props) => ({ type, props });
  const { default: ErrorView } = loadModule('src/app/error.tsx', {
    'react/jsx-runtime': { jsx: element, jsxs: element },
  });
  let retries = 0;
  const view = ErrorView({ error: new Error('private-token'), reset() { retries++; } });
  assert.equal(view.props.role, 'alert');
  assert.ok(!JSON.stringify(view).includes('private-token'));
  const button = view.props.children.find((child) => child.type === 'button');
  button.props.onClick();
  assert.equal(retries, 1);
});
