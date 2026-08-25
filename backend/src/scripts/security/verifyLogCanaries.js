'use strict';

const fs = require('fs/promises');
const path = require('path');

function assertCanary(value) {
  const canary = String(value || '');
  if (!canary.startsWith('KALICO_CANARY_') || canary.length < 24) {
    throw new Error('A synthetic KALICO_CANARY_ value is required');
  }
  return canary;
}

async function detectCanary(filePath, canary) {
  const resolved = path.resolve(filePath);
  const content = await fs.readFile(resolved, 'utf8');
  return content.includes(assertCanary(canary));
}

function parseFiles(argv) {
  const files = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--file' && argv[index + 1]) files.push(argv[index + 1]);
  }
  if (!files.length) throw new Error('At least one --file is required');
  return files;
}

async function main() {
  if (process.env.NODE_ENV !== 'test' || process.env.KALICO_SECURITY_TEST_ONLY !== 'true') {
    throw new Error('Canary verification requires the security-test environment');
  }
  const canary = assertCanary(process.env.SECURITY_LOG_CANARY);
  const files = parseFiles(process.argv.slice(2));
  const results = [];
  for (const file of files) {
    results.push({ source: path.basename(file), detected: await detectCanary(file, canary) });
  }
  process.stdout.write(`${JSON.stringify({ schema_version: 1, results }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[security-canary-check]', error.message);
    process.exitCode = 1;
  });
}

module.exports = { assertCanary, detectCanary, parseFiles };
