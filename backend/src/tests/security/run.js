'use strict';

async function run() {
  const { flushTests } = require('../helpers');
  require('./securityHarness.test');
  require('./logSanitization.test');
  require('./messageMediaPresentation.test');
  require('./qrStorageBoundary.test');
  await flushTests();
  if (process.exitCode === 1) process.exit(1);
}

run().catch((error) => {
  console.error('[security-unit-runner]', error.message);
  process.exit(1);
});
