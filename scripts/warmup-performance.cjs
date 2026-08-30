'use strict';

// Separate from k6 so first-hit timings are reported, not mixed into warm load.
const ROUTES = ['/', '/pro/dashboard', '/abonnement'];
async function warmup(baseUrl = 'http://127.0.0.1:3000') {
  const base = new URL(baseUrl);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)
      || !['http:', 'https:'].includes(base.protocol)
      || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('Warmup requires a loopback origin without credentials or path');
  }
  for (const route of ROUTES) {
    const start = performance.now();
    const response = await fetch(new URL(route, base), {
      redirect: 'error', signal: AbortSignal.timeout(30000),
    });
    // Fully consume the HTML before preparing the next page.
    await response.arrayBuffer();
    console.log(`Warmup ${route}: HTTP ${response.status}, ${Math.round(performance.now() - start)} ms`);
    if (response.status !== 200) throw new Error(`Warmup failed for ${route}: HTTP ${response.status}`);
  }
}
module.exports = { warmup, ROUTES };
if (require.main === module) {
  warmup(process.env.K6_BASE_URL).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
