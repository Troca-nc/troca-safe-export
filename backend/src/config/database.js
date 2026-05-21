// ============================================================
//  Database — Pool PostgreSQL
// ============================================================

const { Pool } = require('pg');
const { logger } = require('../utils/logger');

function redactParams(params) {
  if (!Array.isArray(params)) return 'redacted';
  return `${params.length} param(s) redacted`;
}

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'troca_dev',
  user:     process.env.DB_USER     || 'troca',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('db_idle_client_error', { error: err });
});

/**
 * Exécute une requête SQL avec paramètres
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (process.env.NODE_ENV === 'development') {
      logger.debug('db_query', {
        duration_ms: Date.now() - start,
        text: text.slice(0, 80),
      });
    }
    return res;
  } catch (err) {
    logger.error('db_query_error', {
      text: text.slice(0, 120),
      params: redactParams(params),
      error: err,
    });
    throw err;
  }
};

/**
 * Exécute plusieurs requêtes dans une transaction atomique
 * Usage : withTransaction(async (client) => { await client.query(...) })
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Vérifie que la connexion fonctionne (utilisé au démarrage)
 */
const checkConnection = async () => {
  const res = await pool.query('SELECT NOW() AS now');
  return res.rows[0].now;
};

module.exports = { query, withTransaction, checkConnection, pool };
