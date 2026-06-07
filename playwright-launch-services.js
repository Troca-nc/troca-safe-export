'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { loadDemoEnv } = require('./scripts/loadDemoEnv');

loadDemoEnv();

const ROOT = __dirname;
const NODE_EXE = process.env.NODE_EXE || 'C:\\Program Files\\nodejs\\node.exe';
const LOG_DIR = path.join(ROOT, 'playwright-logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

function startDetached(name, command, args, cwd, env = {}) {
  const outPath = path.join(LOG_DIR, `${name}.out.log`);
  const errPath = path.join(LOG_DIR, `${name}.err.log`);
  const out = fs.openSync(outPath, 'a');
  const err = fs.openSync(errPath, 'a');

  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: ['ignore', out, err],
    env: {
      ...process.env,
      ...env,
    },
  });

  child.unref();
  return { pid: child.pid, outPath, errPath };
}

const backend = startDetached(
  'backend',
  NODE_EXE,
  ['backend/src/index.js'],
  ROOT,
  { PORT: process.env.BACKEND_PORT || '3001', NODE_ENV: 'development' }
);

const frontend = startDetached(
  'frontend',
  NODE_EXE,
  ['node_modules/next/dist/bin/next', 'dev', '-p', process.env.FRONTEND_PORT || '3000'],
  path.join(ROOT, 'frontend'),
  { NODE_ENV: 'development' }
);

console.log(JSON.stringify({ backend, frontend }, null, 2));
