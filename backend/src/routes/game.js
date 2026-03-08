'use strict';
const express = require('express');
const router  = express.Router();
const { createSession, getSession } = require('../services/gameSession');
const { Leaderboard } = require('../models');

router.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

router.post('/sessions', (req, res) => {
  try {
    const { selectedAgents, startingCash = 10000 } = req.body;
    const session = createSession({ selectedAgents, startingCash });
    res.json({ success: true, sessionId: session.id, state: session.fullState() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/sessions/:id', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'Session not found' });
  res.json({ success: true, state: s.fullState() });
});

router.post('/sessions/:id/buy', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'Session not found' });
  res.json(s.playerBuy(req.body.ticker, req.body.shares));
});

router.post('/sessions/:id/sell', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'Session not found' });
  res.json(s.playerSell(req.body.ticker, req.body.shares));
});

router.post('/leaderboard', async (req, res) => {
  try {
    const entry = await Leaderboard.create({
      playerName:   (req.body.playerName || 'Anonymous').slice(0, 30),
      finalValue:   req.body.finalValue,
      startingCash: req.body.startingCash,
      profitPct:    parseFloat(req.body.profitPct.toFixed(2)),
      totalTrades:  req.body.totalTrades,
      rank:         req.body.rank,
      agentsBeaten: req.body.agentsBeaten,
      totalAgents:  req.body.totalAgents,
      agents:       req.body.agents,
    });
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const entries = await Leaderboard.find().sort({ profitPct: -1 }).limit(25).lean();
    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;