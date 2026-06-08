'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { loadDemoEnv } = require('./scripts/loadDemoEnv');

loadDemoEnv();

const ROOT = __dirname;
const NODE_EXE = process.env.NODE_EXE || 'C:\\Program Files\\nodejs\\node.exe';
const LOG_DIR = path.join(ROOT, 'playwright-logs');
const SERVER_STATE_FILE = path.join(ROOT, 'playwright', '.server.json');
fs.mkdirSync(LOG_DIR, { recursive: true });

function startDetached(name, command, args, cwd, env = {}) {
  const outPath = path.join(LOG_DIR, `${name}.out.log`);
  const errPath = path.join(LOG_DIR, `${name}.err.log`);
  const out = fs.openSync(outPath, 'a');
  const err = fs.openSync(errPath, 'a');

  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', out, err],
    env: {
      ...process.env,
      ...env,
    },
  });
  return { pid: child.pid, outPath, errPath };
}

const backend = startDetached(
  'backend',
  NODE_EXE,
  ['scripts/demo-server.js'],
  ROOT,
  {
    PORT: process.env.BACKEND_PORT || '3001',
    DEMO_API_PORT: process.env.BACKEND_PORT || '3001',
    NODE_ENV: 'development',
  }
);

const frontend = startDetached(
  'frontend',
  NODE_EXE,
  ['node_modules/next/dist/bin/next', 'dev', '-p', process.env.FRONTEND_PORT || '3000'],
  path.join(ROOT, 'frontend'),
  {
    NODE_ENV: 'development',
    NEXT_PUBLIC_ENABLE_MSW: process.env.PLAYWRIGHT_ENABLE_MSW === 'false' ? 'false' : 'true',
  }
);

console.log(JSON.stringify({ backend, frontend }, null, 2));

fs.mkdirSync(path.dirname(SERVER_STATE_FILE), { recursive: true });
fs.writeFileSync(
  SERVER_STATE_FILE,
  JSON.stringify(
    {
      backendPid: backend.pid,
      frontendPid: frontend.pid,
      backendOutPath: backend.outPath,
      backendErrPath: backend.errPath,
      frontendOutPath: frontend.outPath,
      frontendErrPath: frontend.errPath,
    },
    null,
    2
  ),
  'utf-8'
);

function stopDetached(child) {
  if (!child?.pid) return;
  try {
    process.kill(child.pid);
  } catch {
    // Ignore already-exited children.
  }
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  stopDetached(frontend);
  stopDetached(backend);
  try {
    fs.unlinkSync(SERVER_STATE_FILE);
  } catch {
    // Ignore state cleanup failures.
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

setInterval(() => {}, 1 << 30);
