'use strict';

const { loadDemoEnv } = require('../../scripts/loadDemoEnv');

loadDemoEnv();

const { seedCategories } = require('../../backend/src/scripts/seedCategories');
const { seedDemoDataset } = require('../../backend/src/services/demoSeedService');

async function main() {
  await seedCategories();
  const summary = await seedDemoDataset();
  console.log('\n=== Troca demo seed ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error('[demo-seed] seed failed');
  if (err?.code) {
    console.error(`[demo-seed] error code: ${err.code}`);
  }
  if (err?.message) {
    console.error(`[demo-seed] message: ${err.message}`);
  }
  if (err?.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
