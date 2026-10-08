'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, makeReq, makeRes, assertStatus } = require('./helpers');
const {
  CAMPAIGN_PRICE_TABLE,
  CAMPAIGN_LIMITS,
  getPublicCampaignConfig,
} = require('../services/campaignsService');

const root = path.resolve(__dirname, '..', '..', '..');
const routeSource = fs.readFileSync(path.join(root, 'backend/src/routes/campaigns.route.js'), 'utf8');

function invoke(router, req) {
  const res = makeRes();
  return new Promise((resolve, reject) => {
    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      originalJson(payload);
      resolve(res);
      return res;
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

describe('campaign public config', () => {
  it('projette les trois formats depuis les sources tarifaires serveur', () => {
    const config = getPublicCampaignConfig();

    assert.strictEqual(config.currency, 'XPF');
    assert.deepStrictEqual(config.formats.map((format) => format.type), ['bon_plan', 'banner', 'popup']);
    assert.deepStrictEqual(
      config.formats.map((format) => format.concurrent_capacity),
      [CAMPAIGN_LIMITS.bon_plan, CAMPAIGN_LIMITS.banner, CAMPAIGN_LIMITS.popup]
    );

    const bonPlan = config.formats[0];
    assert.deepStrictEqual(
      bonPlan.pricing_options.filter((option) => option.pricing_mode === 'one_shot'),
      Object.entries(CAMPAIGN_PRICE_TABLE.bon_plan.one_shot).map(([durationDays, priceXpf]) => ({
        pricing_mode: 'one_shot',
        duration_days: Number(durationDays),
        price_xpf: priceXpf,
      }))
    );
    assert.deepStrictEqual(
      bonPlan.pricing_options.filter((option) => option.pricing_mode === 'monthly'),
      Object.entries(CAMPAIGN_PRICE_TABLE.bon_plan.monthly).map(([pricingPlan, priceXpf]) => ({
        pricing_mode: 'monthly',
        pricing_plan: pricingPlan,
        duration_days: 30,
        price_xpf: priceXpf,
      }))
    );
  });

  it('retourne une nouvelle projection à chaque appel', () => {
    const first = getPublicCampaignConfig();
    first.formats[0].pricing_options[0].price_xpf = 0;
    const second = getPublicCampaignConfig();

    assert.strictEqual(second.formats[0].pricing_options[0].price_xpf, CAMPAIGN_PRICE_TABLE.bon_plan.one_shot[3]);
  });

  it('expose la route publique avant les routes de campagne dynamiques', async () => {
    const publicIndex = routeSource.indexOf("router.get('/public/config'");
    const dynamicIndex = routeSource.indexOf("router.post('/:id/pause'");
    assert.ok(publicIndex > 0 && publicIndex < dynamicIndex);

    const router = require('../routes/campaigns.route');
    const res = await invoke(router, makeReq({ method: 'GET', url: '/public/config' }));
    assertStatus(res, 200);
    assert.deepStrictEqual(res._payload.data, getPublicCampaignConfig());
  });
});
