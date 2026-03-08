const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  playerName: { type: String, default: 'Anonymous' },
  finalValue: { type: Number, required: true },
  startingCash: { type: Number, default: 10000 },
  profitPercent: { type: Number, required: true },
  totalTrades: { type: Number, default: 0 },
  rank: { type: Number },
  agentsBeaten: { type: Number, default: 0 },
  totalAgents: { type: Number, default: 5 },
  duration: { type: Number }, // ticks
  createdAt: { type: Date, default: Date.now },
});

const GameSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  status: { type: String, default: 'active' },
  selectedAgents: [String],
  startingCash: { type: Number, default: 10000 },
  finalLeaderboard: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);
const GameSessionModel = mongoose.model('GameSession', GameSessionSchema);

module.exports = { Leaderboard, GameSessionModel };
