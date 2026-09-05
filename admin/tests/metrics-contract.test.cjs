const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function adminSource(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

function backendAdminRoutes() {
  return fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'src', 'routes', 'admin.routes.js'), 'utf8');
}

test('DAU, WAU and MAU are based on distinct analytics users', () => {
  const routes = backendAdminRoutes();
  assert.match(routes, /COUNT\(DISTINCT user_id\) FILTER \(WHERE created_at >= CURRENT_DATE\)::int AS active_dau/);
  assert.match(routes, /COUNT\(DISTINCT user_id\) FILTER \(WHERE created_at >= NOW\(\) - INTERVAL '7 days'\)::int AS active_wau/);
  assert.match(routes, /COUNT\(DISTINCT user_id\) FILTER \(WHERE created_at >= NOW\(\) - INTERVAL '30 days'\)::int AS active_mau/);
  assert.ok(!routes.includes('active_wau: Number(summary.rows[0]?.new_this_week'));
  assert.ok(!routes.includes('active_mau: Number(summary.rows[0]?.new_this_month'));
});

test('monthly report consistently exposes collected revenue, not MRR', () => {
  const routes = backendAdminRoutes();
  const page = adminSource('src/app/reports/page.tsx');
  const exportRoute = adminSource('src/app/api/reports/monthly/export/route.ts');

  assert.match(routes, /revenue_xpf: Number\(revenue\.rows\[0\]\?\.revenue_xpf \?\? 0\)/);
  assert.match(page, /Revenus encaissés/);
  assert.match(page, /data\?\.revenue_xpf/);
  assert.match(exportRoute, /\['revenue_xpf', String\(data\?\.revenue_xpf \?\? 0\)\]/);
  assert.ok(!page.includes('data?.mrr_xpf'));
  assert.ok(!exportRoute.includes('data?.mrr_xpf'));
});

test('payment totals are numeric zeros when there are no successful payments', () => {
  const routes = backendAdminRoutes();
  for (const field of ['total_xpf', 'boost_xpf', 'sub_xpf']) {
    assert.match(routes, new RegExp(`${field}: Number\\(totals\\.rows\\[0\\]\\?\\.${field} \\?\\? 0\\)`));
  }
});

test('subscription revenue metrics do not confuse MRR, receipts and churn', () => {
  const routes = backendAdminRoutes();

  assert.match(routes, /status = 'cancelled' AND updated_at >= NOW\(\) - INTERVAL '30 days'/);
  assert.ok(!routes.includes("payment_status = 'failed' AND updated_at >= NOW() - INTERVAL '30 days'"));
  assert.match(routes, /FROM payments\s+WHERE status = 'succeeded'/);
  assert.match(routes, /current_total_xpf/);
  assert.match(routes, /previous_total_xpf/);
  assert.match(routes, /mrr_trend: null/);
  assert.match(routes, /ltv_estimate_xpf: churnRate > 0 \? Math\.round\(mrr \/ churnRate\) : null/);
  assert.ok(!routes.includes('Math.max(0.01'));
});
