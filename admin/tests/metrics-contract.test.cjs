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

test('health contract reports checked dependencies and time-bounded worker errors', () => {
  const routes = backendAdminRoutes();

  assert.match(routes, /await query\('SELECT 1'\)/);
  assert.match(routes, /redis\.ping\(\)/);
  assert.match(routes, /pong === 'PONG'/);
  assert.match(routes, /slow_queries_count: null/);
  assert.match(routes, /entry\.source === 'job'/);
  assert.match(routes, /entry\.event === 'error'/);
  assert.match(routes, /\['connect', 'disconnect'\]\.includes\(entry\.event\)/);
  assert.match(routes, /entry\.source === 'job' && entry\.event === 'skipped'/);
  assert.match(routes, /failed_jobs_24h: failedJobs24h/);
  assert.ok(!routes.includes("slow_queries_count: 0"));
  assert.ok(!routes.includes("snapshot.cluster?.nodes?.[0]?.updated_at || null"));
});

test('alerts and moderation failures cannot masquerade as empty queues', () => {
  const routes = backendAdminRoutes();
  const alertsRoute = routes.slice(
    routes.indexOf("router.get('/alerts/active'"),
    routes.indexOf('// ── GET /admin/stats', routes.indexOf("router.get('/alerts/active'")),
  );
  const moderationRoute = routes.slice(
    routes.indexOf("router.get('/moderation/queue'"),
    routes.indexOf("router.patch('/moderation/reports", routes.indexOf("router.get('/moderation/queue'")),
  );

  assert.match(alertsRoute, /error\.status = 503/);
  assert.match(alertsRoute, /await redis\.get\('admin:alerts'\)/);
  assert.match(alertsRoute, /Array\.isArray\(data\)/);
  assert.ok(!alertsRoute.includes(".catch(() => '[]')"));
  assert.ok(!alertsRoute.includes('res.json({ data: [] })'));
  assert.ok(!moderationRoute.includes('.catch(() => ({ rows: [] }))'));
});

test('operational read failures cannot masquerade as empty logs or payments', () => {
  const routes = backendAdminRoutes();
  const errorLogReader = routes.slice(
    routes.indexOf('async function readRedisListJson'),
    routes.indexOf('function getAdminActorId'),
  );
  const slowQueriesRoute = routes.slice(
    routes.indexOf("router.get('/health/slow-queries'"),
    routes.indexOf("router.get('/alerts/active'"),
  );
  const paymentsRoute = routes.slice(
    routes.indexOf("router.get('/payments'"),
    routes.indexOf('module.exports = router'),
  );

  assert.match(errorLogReader, /error\.status = 503/);
  assert.match(errorLogReader, /await redis\.lRange\(key, 0, Math\.max\(0, limit - 1\)\)/);
  assert.ok(!errorLogReader.includes('.catch(() => [])'));
  assert.ok(!slowQueriesRoute.includes('.catch(() => ({ rows: [] }))'));
  assert.ok(!paymentsRoute.includes('.catch(() =>'));
  assert.match(paymentsRoute, /const page = Math\.max\(1, toInt\(req\.query\.page, 1\)\)/);
  assert.match(paymentsRoute, /const limit = Math\.min\(100, Math\.max\(1, toInt\(req\.query\.limit, 25\)\)\)/);
});

test('secondary admin read failures cannot masquerade as empty subscription or engagement data', () => {
  const routes = backendAdminRoutes();
  const subscriptionSnapshot = routes.slice(
    routes.indexOf('async function getLatestSubscriptionSnapshot'),
    routes.indexOf('async function getCurrentProSubscribers'),
  );
  const proSubscribers = routes.slice(
    routes.indexOf('async function getCurrentProSubscribers'),
    routes.indexOf('async function getErrorLogsFromRedis'),
  );
  const engagementRoute = routes.slice(
    routes.indexOf("router.get('/stats/engagement'"),
    routes.indexOf("router.get('/moderation/queue'"),
  );

  assert.ok(!subscriptionSnapshot.includes('.catch(() =>'));
  assert.ok(!proSubscribers.includes('.catch(() =>'));
  assert.ok(!engagementRoute.includes('.catch(() =>'));
  assert.match(engagementRoute, /const \[messages, troc, covoit, bonPlans, chartMessages, chartTroc\] = await Promise\.all/);
});
