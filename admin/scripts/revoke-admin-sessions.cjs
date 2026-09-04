'use strict';

const readline = require('node:readline/promises');
const { createClient } = require('redis');

const SESSION_PATTERN = 'admin-session:active:*';
const BATCH_SIZE = 100;

function environmentName(value) {
  const name = String(value || '').trim();
  if (!/^[a-z0-9][a-z0-9._-]{1,39}$/i.test(name)) {
    throw new Error('ADMIN_ENVIRONMENT doit identifier explicitement l’environnement ciblé.');
  }
  return name;
}

function redisTarget(value) {
  const url = new URL(String(value || '').trim());
  if (!['redis:', 'rediss:'].includes(url.protocol) || !url.hostname) throw new Error('REDIS_URL invalide.');
  const database = url.pathname && url.pathname !== '/' ? url.pathname.slice(1) : '0';
  return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}/${database}`;
}

async function revokeAllAdminSessions(client) {
  let revoked = 0;
  let batch = [];
  for await (const key of client.scanIterator({ MATCH: SESSION_PATTERN, COUNT: BATCH_SIZE })) {
    if (typeof key !== 'string' || !key.startsWith('admin-session:active:')) {
      throw new Error('Redis a retourné une clé hors du périmètre Admin attendu.');
    }
    batch.push(key);
    if (batch.length === BATCH_SIZE) {
      revoked += Number(await client.unlink(batch));
      batch = [];
    }
  }
  if (batch.length) revoked += Number(await client.unlink(batch));
  return revoked;
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Cette commande destructive exige un terminal interactif.');
  }
  const environment = environmentName(process.env.ADMIN_ENVIRONMENT);
  const url = String(process.env.REDIS_URL || '').trim();
  const target = redisTarget(url);
  const phrase = `REVOKE ${environment} ADMIN SESSIONS`;
  process.stdout.write(`\nCible : ${environment} (${target})\n`);
  process.stdout.write('Cette opération déconnectera immédiatement tous les administrateurs Kalico.\n');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let confirmation;
  try { confirmation = await rl.question(`Saisissez exactement « ${phrase} » : `); } finally { rl.close(); }
  if (confirmation !== phrase) throw new Error('Confirmation incorrecte ; aucune connexion Redis effectuée.');

  const client = createClient({ url, socket: { connectTimeout: 2_000, reconnectStrategy: false } });
  client.on('error', () => undefined);
  try {
    await client.connect();
    const revoked = await revokeAllAdminSessions(client);
    process.stdout.write(`${revoked} session(s) Admin révoquée(s).\n`);
  } finally {
    if (client.isOpen) {
      try { await client.quit(); } catch { try { await client.disconnect(); } catch {} }
    }
  }
}

module.exports = { environmentName, redisTarget, revokeAllAdminSessions };

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Erreur : ${error.message}\n`);
    process.exitCode = 1;
  });
}

