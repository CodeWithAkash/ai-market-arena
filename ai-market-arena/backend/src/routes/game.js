const express = require('express');
const router = express.Router();
const { createSession, getSession } = require('../services/gameSession');
const { Leaderboard } = require('../models');

// Create new game session
router.post('/sessions', (req, res) => {
  try {
    const { selectedAgents = ['MomentumBot', 'ValueBot', 'RiskBot', 'RandomBot', 'RLBot'], startingCash = 10000 } = req.body;
    const session = createSession(selectedAgents, startingCash);
    session.status = 'active';
    res.json({ 
      success: true, 
      sessionId: session.id,
      state: session.getFullState()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get session state
router.get('/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  res.json({ success: true, state: session.getFullState() });
});

// Player buy
router.post('/sessions/:id/buy', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  
  const { ticker, shares } = req.body;
  const result = session.playerBuy(ticker, parseInt(shares));
  res.json(result);
});

// Player sell
router.post('/sessions/:id/sell', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  
  const { ticker, shares } = req.body;
  const result = session.playerSell(ticker, parseInt(shares));
  res.json(result);
});

// Save score to leaderboard
router.post('/leaderboard', async (req, res) => {
  try {
    const { playerName, sessionId, finalValue, startingCash, profitPercent, totalTrades, rank, agentsBeaten, totalAgents } = req.body;
    const entry = new Leaderboard({ playerName, finalValue, startingCash, profitPercent, totalTrades, rank, agentsBeaten, totalAgents });
    await entry.save();
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get global leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const entries = await Leaderboard.find().sort({ profitPercent: -1 }).limit(20);
    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

module.exports = router;
