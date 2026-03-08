'use strict';
const { v4: uuidv4 } = require('uuid');
const { MarketSimulator } = require('./marketSimulator');
const { createAgents } = require('../agents/tradingAgents');

const DEFAULT_AGENTS  = ['MomentumBot', 'ValueBot', 'RiskBot', 'RandomBot', 'RLBot'];
const MAX_TICKS       = 200;
const TICK_INTERVAL   = 1500; // ms

class GameSession {
  constructor({ selectedAgents = DEFAULT_AGENTS, startingCash = 10000 } = {}) {
    this.id           = uuidv4();
    this.startingCash = startingCash;
    this.status       = 'active';
    this.tick         = 0;
    this.maxTicks     = MAX_TICKS;
    this.createdAt    = Date.now();

    this.market    = new MarketSimulator();
    this.agents    = createAgents(selectedAgents, startingCash);
    this.eventLog  = [];
    this.tradeFeed = [];

    this.player = {
      cash:         startingCash,
      portfolio:    {},
      tradeHistory: [],
      totalValue:   startingCash,
    };
  }

  // ─── Player ──────────────────────────────────────────────────────────────
  _playerValue() {
    const md = this.market.getMarketData();
    let v = this.player.cash;
    for (const [t, pos] of Object.entries(this.player.portfolio)) {
      if (md[t]) v += pos.shares * md[t].price;
    }
    this.player.totalValue = parseFloat(v.toFixed(2));
    return this.player.totalValue;
  }

  playerBuy(ticker, shares) {
    shares = parseInt(shares, 10);
    if (!shares || shares < 1) return { success: false, message: 'Invalid shares' };
    const md = this.market.getMarketData();
    if (!md[ticker]) return { success: false, message: 'Unknown ticker' };
    const price = md[ticker].price;
    const cost  = shares * price;
    if (cost > this.player.cash) {
      return { success: false, message: `Need $${cost.toFixed(2)} — only $${this.player.cash.toFixed(2)} available` };
    }
    this.player.cash -= cost;
    if (!this.player.portfolio[ticker]) this.player.portfolio[ticker] = { shares: 0, avgCost: 0 };
    const p  = this.player.portfolio[ticker];
    const ns = p.shares + shares;
    p.avgCost = (p.shares * p.avgCost + cost) / ns;
    p.shares  = ns;
    const trade = { type: 'BUY', ticker, shares, price, agent: 'YOU', timestamp: Date.now() };
    this.player.tradeHistory.push(trade);
    this._pushFeed(trade);
    return { success: true, trade, cash: this.player.cash,
      message: `✅ Bought ${shares}× ${ticker} @ $${price.toFixed(2)}` };
  }

  playerSell(ticker, shares) {
    shares = parseInt(shares, 10);
    if (!shares || shares < 1) return { success: false, message: 'Invalid shares' };
    const pos = this.player.portfolio[ticker];
    if (!pos || pos.shares < shares) {
      return { success: false, message: `Not enough shares (have ${pos?.shares ?? 0})` };
    }
    const md    = this.market.getMarketData();
    const price = md[ticker]?.price ?? pos.avgCost;
    this.player.cash += shares * price;
    pos.shares -= shares;
    if (pos.shares === 0) delete this.player.portfolio[ticker];
    const trade = { type: 'SELL', ticker, shares, price, agent: 'YOU', timestamp: Date.now() };
    this.player.tradeHistory.push(trade);
    this._pushFeed(trade);
    return { success: true, trade, cash: this.player.cash,
      message: `✅ Sold ${shares}× ${ticker} @ $${price.toFixed(2)}` };
  }

  // ─── Tick ────────────────────────────────────────────────────────────────
  advanceTick() {
    if (this.status !== 'active') return null;
    this.tick++;
    if (this.tick >= this.maxTicks) this.status = 'ended';

    const event = this.market.triggerRandomEvent();
    if (event) {
      this.eventLog.unshift({ ...event, tick: this.tick, ts: Date.now() });
      if (this.eventLog.length > 10) this.eventLog.pop();
    }

    this.market.updatePrices(this.market.getEventMultiplier(event));
    const md = this.market.getMarketData();

    // All AI agents decide + trade
    const newTrades = [];
    for (const agent of this.agents) {
      agent.getPortfolioValue(md); // refresh value
      const trades = agent.decide(md, event);
      for (const t of trades) {
        this._pushFeed(t);
        newTrades.push(t);
      }
    }

    return this._snapshot(md, event, newTrades);
  }

  _pushFeed(trade) {
    this.tradeFeed.unshift(trade);
    if (this.tradeFeed.length > 40) this.tradeFeed.pop();
  }

  // ─── Leaderboard ─────────────────────────────────────────────────────────
  getLeaderboard(md) {
    const pv = this._playerValue();
    const entries = [
      {
        name: 'YOU', color: '#00d4ff', personality: 'Human Trader', emoji: '👤',
        value: pv,
        change:        pv - this.startingCash,
        changePercent: ((pv - this.startingCash) / this.startingCash) * 100,
        isPlayer: true,
      },
      ...this.agents.map(a => {
        const v = a.getPortfolioValue(md);
        return {
          name: a.name, color: a.color, personality: a.personality, emoji: a.emoji,
          value: v,
          change:        v - this.startingCash,
          changePercent: ((v - this.startingCash) / this.startingCash) * 100,
          isPlayer: false,
        };
      }),
    ];
    return entries.sort((a, b) => b.value - a.value);
  }

  // ─── Snapshot ─────────────────────────────────────────────────────────────
  _snapshot(md, event, newTrades) {
    const lb = this.getLeaderboard(md);
    return {
      id:          this.id,
      tick:        this.tick,
      maxTicks:    this.maxTicks,
      status:      this.status,
      marketData:  md,
      leaderboard: lb,
      event:       event || null,
      newTrades,
      tradeFeed:   this.tradeFeed.slice(0, 15),
      eventLog:    this.eventLog.slice(0, 6),
      player: {
        cash:         this.player.cash,
        portfolio:    { ...this.player.portfolio },
        totalValue:   this._playerValue(),
        tradeHistory: this.player.tradeHistory.slice(-30),
      },
    };
  }

  fullState() {
    const md = this.market.getMarketData();
    return this._snapshot(md, null, []);
  }
}

// ─── In-memory session store ──────────────────────────────────────────────────
const store = new Map();

module.exports = {
  createSession(opts) {
    const s = new GameSession(opts);
    store.set(s.id, s);
    return s;
  },
  getSession(id) { return store.get(id) || null; },
  deleteSession(id) { store.delete(id); },
  TICK_INTERVAL,
};