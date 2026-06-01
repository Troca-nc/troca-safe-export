'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { loadDemoEnv } = require('./loadDemoEnv');

loadDemoEnv();

const root = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const services = [
  { name: 'backend', args: ['--prefix', 'backend', 'run', 'dev'] },
  { name: 'frontend', args: ['--prefix', 'frontend', 'run', 'dev'] },
  { name: 'admin', args: ['--prefix', 'admin', 'run', 'dev'] },
];

const children = new Map();
let shuttingDown = false;

function killChildren(signal = 'SIGINT') {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const service of services) {
  const command = process.platform === 'win32' ? 'cmd.exe' : npmCommand;
  const commandArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', npmCommand, ...service.args]
    : service.args;

  const child = spawn(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  children.set(service.name, child);

  child.on('exit', (code, signal) => {
    children.delete(service.name);
    if (!shuttingDown && (code !== 0 || signal)) {
      console.error(`[dev] ${service.name} exited with code ${code ?? 'null'}${signal ? ` signal ${signal}` : ''}`);
      killChildren();
      process.exit(code ?? 1);
    }
    if (!shuttingDown && children.size === 0) {
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => killChildren('SIGINT'));
process.on('SIGTERM', () => killChildren('SIGTERM'));
