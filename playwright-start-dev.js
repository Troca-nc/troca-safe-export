'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const LOG_DIR = path.join(ROOT, 'playwright-logs');
const OUT_LOG = path.join(LOG_DIR, 'dev.out.log');
const ERR_LOG = path.join(LOG_DIR, 'dev.err.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

const out = fs.openSync(OUT_LOG, 'a');
const err = fs.openSync(ERR_LOG, 'a');

const child = spawn(process.execPath, ['scripts/dev.js'], {
  cwd: ROOT,
  detached: true,
  stdio: ['ignore', out, err],
  env: process.env,
});

child.unref();

console.log(JSON.stringify({ pid: child.pid, out: OUT_LOG, err: ERR_LOG }, null, 2));
