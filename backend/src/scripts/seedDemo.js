'use strict';

const {
  seedDemoDataset,
} = require('../services/demoSeedService');

async function main() {
  if (process.env.DEMO_MODE !== 'true' && process.env.NODE_ENV === 'production') {
    throw new Error('Le seed démo est désactivé en production.');
  }

  const summary = await seedDemoDataset();
  console.log('\n=== Troca demo seed ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error('[demo-seed]', err.message);
  process.exit(1);
});
