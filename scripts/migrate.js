'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { loadDemoEnv } = require('./loadDemoEnv');

loadDemoEnv();

const root = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const child = spawn(npmCommand, ['--prefix', 'backend', 'run', 'migrate'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
