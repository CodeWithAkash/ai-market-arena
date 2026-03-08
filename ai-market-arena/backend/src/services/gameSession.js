const { v4: uuidv4 } = require('uuid');
const { MarketSimulator } = require('../services/marketSimulator');
const { createAgents } = require('../agents/tradingAgents');

class GameSession {
  constructor(selectedAgentNames, startingCash = 10000, speed = 2000) {
    this.id = uuidv4();
    this.startingCash = startingCash;
    this.speed = speed;
    this.status = 'waiting'; // waiting, active, ended
    this.createdAt = Date.now();
    this.tick = 0;
    this.maxTicks = 200;
    
    // Market
    this.market = new MarketSimulator();
    
    // Player
    this.player = {
      cash: startingCash,
      portfolio: {},
      tradeHistory: [],
      totalValue: startingCash,
    };
    
    // AI Agents (filter by selected)
    const allAgents = createAgents();
    this.agents = allAgents.filter(a => selectedAgentNames.includes(a.name));
    if (this.agents.length === 0) this.agents = allAgents; // fallback
    
    // Events log
    this.eventLog = [];
    this.recentTrades = [];
    
    // Timer
    this.intervalId = null;
  }

  getLeaderboard() {
    const marketData = this.market.getMarketData();
    
    const entries = [
      {
        name: 'YOU',
        color: '#ffffff',
        personality: 'Human Trader',
        value: this.getPlayerValue(marketData),
        change: this.getPlayerValue(marketData) - this.startingCash,
        changePercent: ((this.getPlayerValue(marketData) - this.startingCash) / this.startingCash) * 100,
        isPlayer: true,
      },
      ...this.agents.map(agent => {
        const value = agent.getPortfolioValue(marketData);
        return {
          name: agent.name,
          color: agent.color,
          personality: agent.personality,
          value,
          change: value - this.startingCash,
          changePercent: ((value - this.startingCash) / this.startingCash) * 100,
          isPlayer: false,
        };
      }),
    ];

    return entries.sort((a, b) => b.value - a.value);
  }

  getPlayerValue(marketData) {
    let value = this.player.cash;
    Object.keys(this.player.portfolio).forEach(ticker => {
      if (marketData[ticker]) {
        value += this.player.portfolio[ticker].shares * marketData[ticker].price;
      }
    });
    this.player.totalValue = parseFloat(value.toFixed(2));
    return this.player.totalValue;
  }

  playerBuy(ticker, shares) {
    const marketData = this.market.getMarketData();
    if (!marketData[ticker]) return { success: false, message: 'Invalid ticker' };
    
    const price = marketData[ticker].price;
    const cost = shares * price;
    
    if (cost > this.player.cash) {
      return { success: false, message: `Insufficient funds. Need $${cost.toFixed(2)}, have $${this.player.cash.toFixed(2)}` };
    }
    
    this.player.cash -= cost;
    if (!this.player.portfolio[ticker]) {
      this.player.portfolio[ticker] = { shares: 0, avgCost: 0 };
    }
    const existing = this.player.portfolio[ticker];
    const newTotalShares = existing.shares + shares;
    existing.avgCost = (existing.shares * existing.avgCost + cost) / newTotalShares;
    existing.shares = newTotalShares;
    
    const trade = { type: 'BUY', ticker, shares, price, timestamp: Date.now(), agent: 'YOU' };
    this.player.tradeHistory.push(trade);
    this.recentTrades.unshift(trade);
    if (this.recentTrades.length > 20) this.recentTrades.pop();
    
    return { success: true, trade, cash: this.player.cash };
  }

  playerSell(ticker, shares) {
    const marketData = this.market.getMarketData();
    if (!marketData[ticker]) return { success: false, message: 'Invalid ticker' };
    if (!this.player.portfolio[ticker] || this.player.portfolio[ticker].shares < shares) {
      return { success: false, message: 'Insufficient shares' };
    }
    
    const price = marketData[ticker].price;
    this.player.cash += shares * price;
    this.player.portfolio[ticker].shares -= shares;
    if (this.player.portfolio[ticker].shares === 0) {
      delete this.player.portfolio[ticker];
    }
    
    const trade = { type: 'SELL', ticker, shares, price, timestamp: Date.now(), agent: 'YOU' };
    this.player.tradeHistory.push(trade);
    this.recentTrades.unshift(trade);
    if (this.recentTrades.length > 20) this.recentTrades.pop();
    
    return { success: true, trade, cash: this.player.cash };
  }

  tick_() {
    if (this.status !== 'active') return null;
    this.tick++;
    
    // Trigger potential market event
    const event = this.market.triggerRandomEvent();
    if (event) {
      this.eventLog.unshift({ ...event, tick: this.tick, timestamp: Date.now() });
      if (this.eventLog.length > 10) this.eventLog.pop();
    }
    
    // Get event multiplier
    const eventMultiplier = this.market.getEventMultiplier(event);
    
    // Update prices
    this.market.updatePrices(eventMultiplier);
    
    // AI agents decide and trade
    const aiTrades = [];
    const marketData = this.market.getMarketData();
    
    this.agents.forEach(agent => {
      const decisions = agent.decide(marketData, event);
      decisions.forEach(trade => {
        aiTrades.push(trade);
        this.recentTrades.unshift(trade);
      });
    });
    
    if (this.recentTrades.length > 30) this.recentTrades = this.recentTrades.slice(0, 30);
    
    // Check if game over
    if (this.tick >= this.maxTicks) {
      this.status = 'ended';
    }
    
    return {
      tick: this.tick,
      maxTicks: this.maxTicks,
      marketData: this.market.getMarketData(),
      leaderboard: this.getLeaderboard(),
      event,
      aiTrades,
      recentTrades: this.recentTrades.slice(0, 10),
      player: {
        cash: this.player.cash,
        portfolio: this.player.portfolio,
        totalValue: this.getPlayerValue(marketData),
      },
      status: this.status,
      eventLog: this.eventLog.slice(0, 5),
    };
  }

  getFullState() {
    const marketData = this.market.getMarketData();
    return {
      id: this.id,
      tick: this.tick,
      maxTicks: this.maxTicks,
      status: this.status,
      marketData,
      leaderboard: this.getLeaderboard(),
      player: {
        cash: this.player.cash,
        portfolio: this.player.portfolio,
        totalValue: this.getPlayerValue(marketData),
        tradeHistory: this.player.tradeHistory.slice(-20),
      },
      agents: this.agents.map(a => ({
        name: a.name,
        color: a.color,
        personality: a.personality,
        cash: a.cash,
        portfolio: a.portfolio,
      })),
      recentTrades: this.recentTrades.slice(0, 10),
      eventLog: this.eventLog.slice(0, 5),
    };
  }
}

// In-memory session store (for simplicity, can be moved to Redis/MongoDB)
const sessions = new Map();

function createSession(selectedAgents, startingCash, speed) {
  const session = new GameSession(selectedAgents, startingCash, speed);
  sessions.set(session.id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id);
}

function deleteSession(id) {
  sessions.delete(id);
}

module.exports = { createSession, getSession, deleteSession, sessions };
