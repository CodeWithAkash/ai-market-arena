'use strict';
const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  playerName:   { type: String, default: 'Anonymous', maxlength: 30 },
  finalValue:   { type: Number, required: true },
  startingCash: { type: Number, default: 10000 },
  profitPct:    { type: Number, required: true },
  totalTrades:  { type: Number, default: 0 },
  rank:         { type: Number },
  agentsBeaten: { type: Number, default: 0 },
  totalAgents:  { type: Number, default: 5 },
  agents:       [String],
  createdAt:    { type: Date, default: Date.now },
});

module.exports = { Leaderboard: mongoose.model('Leaderboard', LeaderboardSchema) };