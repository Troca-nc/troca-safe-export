'use strict';

const express = require('express');
const {
  clearDemoDataset,
  getDemoStatus,
  seedDemoDataset,
} = require('../services/demoSeedService');

const router = express.Router();

function isLocalDemoEnabled() {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
}

router.use((req, res, next) => {
  if (!isLocalDemoEnabled()) {
    return res.status(404).json({ error: 'Route introuvable.' });
  }
  next();
});

router.get('/status', async (_req, res, next) => {
  try {
    const status = await getDemoStatus();
    res.json({ data: status });
  } catch (err) {
    next(err);
  }
});

router.post('/seed', async (_req, res, next) => {
  try {
    const summary = await seedDemoDataset();
    res.json({
      message: 'Jeu de données démo généré.',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/seed', async (_req, res, next) => {
  try {
    const summary = await clearDemoDataset();
    res.json({
      message: 'Jeu de données démo supprimé.',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
