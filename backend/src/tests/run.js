'use strict';

// ============================================================
//  Troca Backend — Test runner
//  Usage : node src/tests/run.js
// ============================================================

const SUITES = [
  './health.test',
  './validate.test',
  './jwt.test',
  './auth.middleware.test',
  './email.service.test',
  './phone.route.test',
  './alert.route.test',
  './scheduler.test',
  './push.service.test',
  './payment.route.test',
];

async function run() {
  console.log('\n🧪 Troca Backend — Suite de tests\n' + '─'.repeat(48));
  const start = Date.now();

  const promises = [];

  for (const suite of SUITES) {
    try {
      const mod = require(suite);
      if (mod && typeof mod.then === 'function') promises.push(mod);
    } catch (err) {
      console.error(`\n  ✗ Impossible de charger ${suite}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  const failed  = process.exitCode === 1;
  console.log('\n' + '─'.repeat(48));
  console.log(failed
    ? `\n❌ Certains tests ont échoué — ${elapsed}s\n`
    : `\n✅ Tous les tests sont passés — ${elapsed}s\n`
  );

  if (failed) process.exit(1);
}

run().catch((err) => {
  console.error('Runner error:', err);
  process.exit(1);
});
