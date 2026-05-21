'use strict';

const os = require('os');
const { query } = require('../config/database');
const { getRedisClient } = require('../config/redis');

const NODE_ID = `${process.pid}-${Math.random().toString(36).slice(2)}`;
const NODE_ROLE = process.env.OBSERVABILITY_ROLE?.trim() || 'api';
const NODE_HOST = os.hostname();
const NODE_TTL_MS = 60_000;
const HEARTBEAT_MS = 15_000;
const MAX_RECENT = 20;

const KEYS = {
  counts: 'observability:global:counts',
  status: 'observability:global:status',
  errors: 'observability:global:errors',
  alerts: 'observability:global:alerts',
  requests: 'observability:global:requests',
  nodes: 'observability:global:nodes',
  shareCounts: 'observability:global:share:counts',
  shareRecent: 'observability:global:share:recent',
  shareSeeded: 'observability:global:share:seeded',
  node: (id) => `observability:node:${id}`,
};

const state = {
  startedAt: Date.now(),
  http: {
    total: 0,
    byStatus: {},
    slow: 0,
    errors: 0,
    last: [],
  },
  alerts: [],
  errors: [],
  share: {
    total: 0,
    byChannel: {},
    byContentType: {},
    recent: [],
  },
  websocket: {
    connects: 0,
    disconnects: 0,
    authErrors: 0,
    messages: 0,
  },
  jobs: {
    started: 0,
    errors: 0,
    skipped: 0,
  },
};

let heartbeatTimer = null;
let warnedRedis = false;

function pushLimited(list, entry) {
  list.unshift(entry);
  if (list.length > MAX_RECENT) list.pop();
}

function normalizeShareBucket(value, fallback = 'unknown') {
  if (value == null) return fallback;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized || fallback;
}

function normalizeErrorMessage(err) {
  if (!err) return 'unknown_error';
  if (typeof err === 'string') return err;
  return err.message || String(err);
}

function nowIso() {
  return new Date().toISOString();
}

function snapshotNode(extra = {}) {
  return {
    id: NODE_ID,
    role: NODE_ROLE,
    pid: process.pid,
    host: NODE_HOST,
    started_at: new Date(state.startedAt).toISOString(),
    updated_at: nowIso(),
    memory: process.memoryUsage(),
    ...extra,
  };
}

function getLocalSnapshot() {
  const node = snapshotNode();
  return {
    scope: 'local',
    instance: node,
    uptime_ms: Date.now() - state.startedAt,
    memory: process.memoryUsage(),
    http: state.http,
    alerts: state.alerts,
    errors: state.errors,
    share: state.share,
    websocket: state.websocket,
    jobs: state.jobs,
    cluster: {
      instances: 1,
      nodes: [node],
    },
  };
}

function aggregateMemory(nodes) {
  if (!nodes.length) return process.memoryUsage();
  return nodes.reduce((acc, node) => {
    const memory = node.memory || {};
    acc.rss += Number(memory.rss || 0);
    acc.heapTotal += Number(memory.heapTotal || 0);
    acc.heapUsed += Number(memory.heapUsed || 0);
    acc.external += Number(memory.external || 0);
    acc.arrayBuffers += Number(memory.arrayBuffers || 0);
    return acc;
  }, { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 });
}

function parseMaybeJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function safeRedis() {
  const client = await getRedisClient();
  if (!client && !warnedRedis) {
    warnedRedis = true;
    console.warn('[observability] redis unavailable, using local snapshot');
  }
  if (client) warnedRedis = false;
  return client;
}

async function touchNode(extra = {}) {
  const client = await safeRedis();
  if (!client) return false;

  try {
    const nodeSnapshot = snapshotNode(extra);
    const multi = client.multi();
    multi.sAdd(KEYS.nodes, NODE_ID);
    multi.set(KEYS.node(NODE_ID), JSON.stringify(nodeSnapshot), { PX: NODE_TTL_MS });
    await multi.exec();
    return true;
  } catch {
    return false;
  }
}

async function pushRecentRedis(listKey, entry) {
  const client = await safeRedis();
  if (!client) return false;
  try {
    await client.multi()
      .lPush(listKey, JSON.stringify(entry))
      .lTrim(listKey, 0, MAX_RECENT - 1)
      .exec();
    return true;
  } catch {
    return false;
  }
}

async function seedShareAnalytics(client) {
  if (!client) return false;
  if (await client.exists(KEYS.shareSeeded)) return true;

  try {
    const [aggregateResult, recentResult] = await Promise.all([
      query(
        `SELECT
           COALESCE(NULLIF(metadata->>'channel', ''), 'unknown') AS channel,
           COALESCE(NULLIF(metadata->>'content_type', ''), 'unknown') AS content_type,
           COUNT(*)::bigint AS count
         FROM analytics_events
         WHERE event_name = 'share_click'
         GROUP BY 1, 2
         ORDER BY count DESC, channel ASC, content_type ASC`
      ),
      query(
        `SELECT created_at, page_path, referrer, user_id, metadata
         FROM analytics_events
         WHERE event_name = 'share_click'
         ORDER BY created_at DESC
         LIMIT $1`,
        [MAX_RECENT]
      ),
    ]);

    const byChannel = {};
    const byContentType = {};
    let total = 0;

    for (const row of aggregateResult.rows || []) {
      const channel = normalizeShareBucket(row.channel);
      const contentType = normalizeShareBucket(row.content_type);
      const count = Number(row.count || 0);
      total += count;
      byChannel[channel] = (byChannel[channel] || 0) + count;
      byContentType[contentType] = (byContentType[contentType] || 0) + count;
    }

    const recent = (recentResult.rows || []).map((row) => {
      const metadata = parseMaybeJson(row.metadata) || {};
      return {
        ts: row.created_at ? new Date(row.created_at).toISOString() : nowIso(),
        channel: normalizeShareBucket(metadata.channel),
        contentType: normalizeShareBucket(metadata.content_type),
        itemId: metadata.item_id != null ? String(metadata.item_id) : null,
        pagePath: row.page_path || null,
        referrer: row.referrer || null,
        userId: row.user_id ?? null,
      };
    });

    const multi = client.multi();
    multi.del(KEYS.shareCounts);
    multi.del(KEYS.shareRecent);
    multi.hSet(KEYS.shareCounts, {
      share_total: String(total),
    });

    for (const [channel, count] of Object.entries(byChannel)) {
      multi.hSet(KEYS.shareCounts, `share_channel:${channel}`, String(count));
    }

    for (const [contentType, count] of Object.entries(byContentType)) {
      multi.hSet(KEYS.shareCounts, `share_content:${contentType}`, String(count));
    }

    for (const item of [...recent].reverse()) {
      multi.lPush(KEYS.shareRecent, JSON.stringify(item));
    }

    multi.set(KEYS.shareSeeded, '1');
    await multi.exec();
    return true;
  } catch {
    return false;
  }
}

async function recordShareDistributed(entry) {
  const client = await safeRedis();
  if (!client) return false;

  try {
    const channel = normalizeShareBucket(entry.channel);
    const contentType = normalizeShareBucket(entry.contentType);
    const recent = {
      ts: nowIso(),
      channel,
      contentType,
      itemId: entry.itemId != null ? String(entry.itemId) : null,
      pagePath: entry.pagePath || null,
      referrer: entry.referrer || null,
      userId: entry.userId ?? null,
      requestId: entry.requestId ?? null,
      source: entry.source || 'share',
      nodeId: NODE_ID,
      role: NODE_ROLE,
    };

    await client.multi()
      .hIncrBy(KEYS.shareCounts, 'share_total', 1)
      .hIncrBy(KEYS.shareCounts, `share_channel:${channel}`, 1)
      .hIncrBy(KEYS.shareCounts, `share_content:${contentType}`, 1)
      .lPush(KEYS.shareRecent, JSON.stringify(recent))
      .lTrim(KEYS.shareRecent, 0, MAX_RECENT - 1)
      .exec();

    await touchNode({ last_share_at: nowIso() });
    return true;
  } catch {
    return false;
  }
}

async function pushAlert(entry) {
  const alert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: nowIso(),
    severity: entry.severity || 'info',
    category: entry.category || 'system',
    title: entry.title || 'Alerte',
    message: entry.message || '',
    requestId: entry.requestId ?? null,
    source: entry.source || 'observability',
    nodeId: NODE_ID,
    role: NODE_ROLE,
  };

  pushLimited(state.alerts, alert);
  await pushRecentRedis(KEYS.alerts, alert);
  return alert;
}

async function incrementRedisCounts({ statusCode, isSlow = false, websocketEvent = null, jobEvent = null, error = false }) {
  const client = await safeRedis();
  if (!client) return false;

  try {
    const multi = client.multi();

    if (statusCode !== undefined && statusCode !== null) {
      multi.hIncrBy(KEYS.counts, 'http_total', 1);
      multi.hIncrBy(KEYS.status, String(statusCode), 1);
      if (Number(statusCode) >= 500) multi.hIncrBy(KEYS.counts, 'http_errors', 1);
      if (isSlow) multi.hIncrBy(KEYS.counts, 'http_slow', 1);
    }

    if (websocketEvent) {
      multi.hIncrBy(KEYS.counts, `ws_${websocketEvent}`, 1);
    }

    if (jobEvent) {
      multi.hIncrBy(KEYS.counts, `job_${jobEvent}`, 1);
    }

    if (error) {
      multi.hIncrBy(KEYS.counts, 'errors_total', 1);
    }

    await multi.exec();
    return true;
  } catch {
    return false;
  }
}

async function recordHttpDistributed(entry) {
  await incrementRedisCounts({
    statusCode: entry.statusCode,
    isSlow: entry.durationMs >= 1000,
    error: entry.statusCode >= 500,
  });
  await pushRecentRedis(KEYS.requests, {
    ts: nowIso(),
    requestId: entry.requestId,
    method: entry.method,
    path: entry.path,
    statusCode: entry.statusCode,
    durationMs: entry.durationMs,
    userId: entry.userId ?? null,
    nodeId: NODE_ID,
    role: NODE_ROLE,
  });

  if (entry.statusCode >= 500) {
    await pushAlert({
      severity: 'critical',
      category: 'http',
      title: `Erreur HTTP ${entry.statusCode}`,
      message: `${entry.method} ${entry.path} a repondu ${entry.statusCode} en ${Math.round(entry.durationMs)} ms`,
      requestId: entry.requestId,
      source: 'http',
    });
  } else if (entry.durationMs >= 1000) {
    await pushAlert({
      severity: 'warning',
      category: 'http',
      title: 'Requete lente detectee',
      message: `${entry.method} ${entry.path} a pris ${Math.round(entry.durationMs)} ms`,
      requestId: entry.requestId,
      source: 'http',
    });
  }

  await touchNode({ last_http_at: nowIso() });
}

async function recordErrorDistributed(entry) {
  await incrementRedisCounts({ error: true });
  await pushRecentRedis(KEYS.errors, {
    ts: nowIso(),
    nodeId: NODE_ID,
    role: NODE_ROLE,
    ...entry,
  });
  await pushAlert({
    severity: 'critical',
    category: entry.source || 'error',
    title: 'Erreur applicative',
    message: normalizeErrorMessage(entry.message || entry.error || entry.reason),
    requestId: entry.requestId ?? entry.request_id ?? null,
    source: entry.source || 'app',
  });
  await touchNode({ last_error_at: nowIso() });
}

async function recordWebsocketDistributed(event, data = {}) {
  await incrementRedisCounts({ websocketEvent: event });

  if (event === 'connect' || event === 'disconnect' || event === 'auth_error') {
    await pushRecentRedis(KEYS.errors, {
      ts: nowIso(),
      nodeId: NODE_ID,
      role: NODE_ROLE,
      source: 'ws',
      event,
      ...data,
    });
  }

  if (event === 'auth_error') {
    await pushAlert({
      severity: 'warning',
      category: 'websocket',
      title: 'WebSocket auth refusee',
      message: normalizeErrorMessage(data.message || 'Erreur dauthentification websocket'),
      requestId: data.requestId ?? null,
      source: 'ws',
    });
  } else if (event === 'disconnect') {
    await pushAlert({
      severity: 'info',
      category: 'websocket',
      title: 'Deconnexion websocket',
      message: normalizeErrorMessage(data.message || 'Deconnexion du client temps reel'),
      requestId: data.requestId ?? null,
      source: 'ws',
    });
  }

  await touchNode({ last_ws_at: nowIso() });
}

async function recordJobDistributed(event, data = {}) {
  await incrementRedisCounts({ jobEvent: event });

  if (event === 'error' || event === 'skipped') {
    await pushRecentRedis(KEYS.errors, {
      ts: nowIso(),
      nodeId: NODE_ID,
      role: NODE_ROLE,
      source: 'job',
      event,
      ...data,
    });
  }

  if (event === 'error') {
    await pushAlert({
      severity: 'critical',
      category: 'job',
      title: 'Job en erreur',
      message: normalizeErrorMessage(data.message || 'Tache planifiee en echec'),
      source: 'job',
    });
  } else if (event === 'skipped') {
    await pushAlert({
      severity: 'warning',
      category: 'job',
      title: 'Job saute',
      message: normalizeErrorMessage(data.message || 'Execution de job ignoree par verrou'),
      source: 'job',
    });
  }

  await touchNode({ last_job_at: nowIso() });
}

async function recordShare(entry = {}) {
  const channel = normalizeShareBucket(entry.channel);
  const contentType = normalizeShareBucket(entry.contentType);
  const recent = {
    ts: nowIso(),
    channel,
    contentType,
    itemId: entry.itemId != null ? String(entry.itemId) : null,
    pagePath: entry.pagePath || null,
    referrer: entry.referrer || null,
    userId: entry.userId ?? null,
    requestId: entry.requestId ?? null,
    source: entry.source || 'share',
  };

  state.share.total += 1;
  state.share.byChannel[channel] = (state.share.byChannel[channel] || 0) + 1;
  state.share.byContentType[contentType] = (state.share.byContentType[contentType] || 0) + 1;
  pushLimited(state.share.recent, recent);

  void recordShareDistributed({
    ...recent,
    channel,
    contentType,
  }).catch(() => {});
}

async function registerObservabilityInstance(role = NODE_ROLE) {
  await touchNode({ role, registered_at: nowIso() });
  if (heartbeatTimer) return true;

  heartbeatTimer = setInterval(() => {
    void touchNode({ heartbeat_at: nowIso() });
  }, HEARTBEAT_MS);
  if (heartbeatTimer.unref) heartbeatTimer.unref();
  return true;
}

async function stopObservabilityHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

async function readDistributedSnapshot() {
  const client = await safeRedis();
  if (!client) return null;

  try {
    await seedShareAnalytics(client);

    const [counts, status, errors, alerts, requests, nodeIds, shareCounts, shareRecent] = await Promise.all([
      client.hGetAll(KEYS.counts),
      client.hGetAll(KEYS.status),
      client.lRange(KEYS.errors, 0, MAX_RECENT - 1),
      client.lRange(KEYS.alerts, 0, MAX_RECENT - 1),
      client.lRange(KEYS.requests, 0, MAX_RECENT - 1),
      client.sMembers(KEYS.nodes),
      client.hGetAll(KEYS.shareCounts),
      client.lRange(KEYS.shareRecent, 0, MAX_RECENT - 1),
    ]);

    const nodeValues = await Promise.all(
      (nodeIds || []).map(async (nodeId) => {
        const raw = await client.get(KEYS.node(nodeId));
        return parseMaybeJson(raw);
      })
    );

    const nodes = nodeValues
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = Date.parse(a.updated_at || a.started_at || 0) || 0;
        const bTime = Date.parse(b.updated_at || b.started_at || 0) || 0;
        return bTime - aTime;
      });

    const byStatus = {};
    for (const [statusCode, value] of Object.entries(status || {})) {
      byStatus[statusCode] = Number(value || 0);
    }

    const parsedErrors = errors.map(parseMaybeJson).filter(Boolean);
    const parsedAlerts = alerts.map(parseMaybeJson).filter(Boolean);
    const parsedRequests = requests.map(parseMaybeJson).filter(Boolean);
    const parsedShareRecent = shareRecent.map(parseMaybeJson).filter(Boolean);

    const shareByChannel = {};
    const shareByContentType = {};
    for (const [key, value] of Object.entries(shareCounts || {})) {
      if (key === 'share_total') continue;
      const count = Number(value || 0);
      if (!count) continue;
      if (key.startsWith('share_channel:')) {
        shareByChannel[key.slice('share_channel:'.length)] = count;
      } else if (key.startsWith('share_content:')) {
        shareByContentType[key.slice('share_content:'.length)] = count;
      }
    }

    const totalCounts = {
      total: Number(counts.http_total || 0),
      slow: Number(counts.http_slow || 0),
      errors: Number(counts.http_errors || counts.errors_total || 0),
    };

    const websocket = {
      connects: Number(counts.ws_connect || 0),
      disconnects: Number(counts.ws_disconnect || 0),
      authErrors: Number(counts.ws_auth_error || 0),
      messages: Number(counts.ws_message || 0),
    };

    const jobs = {
      started: Number(counts.job_started || 0),
      errors: Number(counts.job_error || 0),
      skipped: Number(counts.job_skipped || 0),
    };

    const aggregateUptime = nodes.length
      ? Math.max(
        0,
        Date.now() - Math.min(...nodes.map((node) => Date.parse(node.started_at || node.updated_at || Date.now()) || Date.now()))
      )
      : Date.now() - state.startedAt;

    return {
      scope: 'distributed',
      instance: snapshotNode(),
      uptime_ms: aggregateUptime,
      memory: aggregateMemory(nodes),
      http: {
        total: totalCounts.total,
        byStatus,
        slow: totalCounts.slow,
        errors: totalCounts.errors,
        last: parsedRequests,
      },
      share: {
        total: Number(shareCounts.share_total || 0),
        byChannel: shareByChannel,
        byContentType: shareByContentType,
        recent: parsedShareRecent,
      },
      alerts: parsedAlerts,
      errors: parsedErrors,
      websocket,
      jobs,
      cluster: {
        instances: nodes.length,
        nodes,
      },
    };
  } catch {
    return null;
  }
}

function recordHttp(entry) {
  state.http.total += 1;
  state.http.byStatus[entry.statusCode] = (state.http.byStatus[entry.statusCode] || 0) + 1;
  if (entry.durationMs >= 1000) state.http.slow += 1;
  if (entry.statusCode >= 500) state.http.errors += 1;

  pushLimited(state.http.last, {
    ts: nowIso(),
    requestId: entry.requestId,
    method: entry.method,
    path: entry.path,
    statusCode: entry.statusCode,
    durationMs: entry.durationMs,
    userId: entry.userId ?? null,
  });

  if (entry.statusCode >= 500) {
    pushLimited(state.alerts, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ts: nowIso(),
      severity: 'critical',
      category: 'http',
      title: `Erreur HTTP ${entry.statusCode}`,
      message: `${entry.method} ${entry.path} a repondu ${entry.statusCode} en ${Math.round(entry.durationMs)} ms`,
      requestId: entry.requestId ?? null,
      source: 'http',
      nodeId: NODE_ID,
      role: NODE_ROLE,
    });
  } else if (entry.durationMs >= 1000) {
    pushLimited(state.alerts, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ts: nowIso(),
      severity: 'warning',
      category: 'http',
      title: 'Requete lente detectee',
      message: `${entry.method} ${entry.path} a pris ${Math.round(entry.durationMs)} ms`,
      requestId: entry.requestId ?? null,
      source: 'http',
      nodeId: NODE_ID,
      role: NODE_ROLE,
    });
  }

  void recordHttpDistributed(entry).catch(() => {});
}

function recordError(entry) {
  pushLimited(state.errors, {
    ts: nowIso(),
    ...entry,
  });
  if (state.errors.length > MAX_RECENT) state.errors.pop();
  void recordErrorDistributed(entry).catch(() => {});
}

function recordWebsocket(event, data = {}) {
  if (event === 'connect') state.websocket.connects += 1;
  if (event === 'disconnect') state.websocket.disconnects += 1;
  if (event === 'auth_error') state.websocket.authErrors += 1;
  if (event === 'message') state.websocket.messages += 1;

  if (event === 'auth_error' || event === 'disconnect' || event === 'connect') {
    pushLimited(state.errors, {
      ts: nowIso(),
      source: 'ws',
      event,
      ...data,
    });
  }

  void recordWebsocketDistributed(event, data).catch(() => {});
}

function recordJob(event, data = {}) {
  if (event === 'started') state.jobs.started += 1;
  if (event === 'error') state.jobs.errors += 1;
  if (event === 'skipped') state.jobs.skipped += 1;

  if (event === 'error' || event === 'skipped') {
    pushLimited(state.errors, {
      ts: nowIso(),
      source: 'job',
      event,
      ...data,
    });
  }

  void recordJobDistributed(event, data).catch(() => {});
}

async function getSnapshot() {
  const distributed = await readDistributedSnapshot();
  if (distributed) return distributed;
  return getLocalSnapshot();
}

module.exports = {
  getSnapshot,
  registerObservabilityInstance,
  recordError,
  recordHttp,
  recordJob,
  recordShare,
  recordWebsocket,
  stopObservabilityHeartbeat,
};
