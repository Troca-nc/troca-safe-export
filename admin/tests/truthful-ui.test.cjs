const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

test('Admin shell does not claim an unverified hostname or fabricated availability', () => {
  const shell = source('src/components/AdminShell.tsx');
  for (const claim of ['admin.kalico.nc', 'Système OK', 'Backend 99.9%', 'dernier job récent']) {
    assert.ok(!shell.includes(claim));
  }
  assert.match(shell, /Espace d’administration/);
});

test('dashboard distinguishes absent values from actual zero and labels churn honestly', () => {
  const dashboard = source('src/app/dashboard/page.tsx');
  assert.match(dashboard, /Non renseigné/);
  assert.ok(!dashboard.includes("|| 'ok'"));
  assert.ok(!dashboard.includes('Système en ligne'));
  assert.ok(!dashboard.includes("{ label: 'Conducteurs à vérifier', value: '0'"));
  assert.ok(!dashboard.includes('Paiements bloqués'));
  assert.match(dashboard, /Abonnements résiliés/);
});

test('authentication code has no fallback to an unconfirmed Admin hostname', () => {
  const auth = source('src/lib/auth.ts');
  assert.ok(!auth.includes('admin.kalico.nc'));
  assert.ok(!auth.includes('getAdminBaseUrl'));
});
