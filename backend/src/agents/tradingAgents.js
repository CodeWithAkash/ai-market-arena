'use strict';

class BaseAgent {
  constructor(name, personality, color, emoji, startingCash) {
    this.name = name; this.personality = personality;
    this.color = color; this.emoji = emoji;
    this.cash = startingCash; this.portfolio = {};
    this.tradeLog = []; this.totalValue = startingCash;
  }
  getPortfolioValue(marketData) {
    let v = this.cash;
    for (const [ticker, pos] of Object.entries(this.portfolio)) {
      if (marketData[ticker]) v += pos.shares * marketData[ticker].price;
    }
    this.totalValue = parseFloat(v.toFixed(2));
    return this.totalValue;
  }
  buy(ticker, shares, price) {
    const cost = shares * price;
    if (cost > this.cash || shares < 1) return null;
    this.cash -= cost;
    if (!this.portfolio[ticker]) this.portfolio[ticker] = { shares: 0, avgCost: 0 };
    const p = this.portfolio[ticker];
    const ns = p.shares + shares;
    p.avgCost = (p.shares * p.avgCost + cost) / ns;
    p.shares = ns;
    const t = { type: 'BUY', ticker, shares, price, agent: this.name, timestamp: Date.now() };
    this.tradeLog.push(t); return t;
  }
  sell(ticker, shares, price) {
    if (!this.portfolio[ticker] || this.portfolio[ticker].shares < shares) return null;
    this.cash += shares * price;
    this.portfolio[ticker].shares -= shares;
    if (this.portfolio[ticker].shares === 0) delete this.portfolio[ticker];
    const t = { type: 'SELL', ticker, shares, price, agent: this.name, timestamp: Date.now() };
    this.tradeLog.push(t); return t;
  }
  maxAffordable(price, fraction = 0.2) {
    return Math.max(1, Math.floor((this.cash * fraction) / price));
  }
}

class MomentumBot extends BaseAgent {
  constructor(cash) { super('MomentumBot', 'Trend Following', '#00ff88', '📈', cash); }
  decide(marketData, event) {
    const trades = [];
    const boost = event?.type === 'boom' ? 2.5 : event?.type === 'crash' ? -2.5 : 0;
    for (const [ticker, data] of Object.entries(marketData)) {
      const { price, indicators: { momentum, ma5, ma20 } } = data;
      const signal = momentum + boost;
      if (signal > 0.4 && ma5 > ma20 && this.cash >= price) {
        const t = this.buy(ticker, this.maxAffordable(price, 0.25), price);
        if (t) { t.reason = `📈 Momentum +${momentum.toFixed(1)}%`; trades.push(t); }
      } else if (signal < -0.4 && this.portfolio[ticker]?.shares > 0) {
        const t = this.sell(ticker, Math.ceil(this.portfolio[ticker].shares * 0.6), price);
        if (t) { t.reason = `📉 Momentum ${momentum.toFixed(1)}%`; trades.push(t); }
      }
    }
    return trades;
  }
}

class ValueBot extends BaseAgent {
  constructor(cash) { super('ValueBot', 'Value Investing', '#4488ff', '🔍', cash); }
  decide(marketData) {
    const trades = [];
    for (const [ticker, data] of Object.entries(marketData)) {
      const { price, indicators: { rsi, ma20 } } = data;
      const dev = ((price - ma20) / ma20) * 100;
      if (rsi < 32 && dev < -4 && this.cash >= price) {
        const t = this.buy(ticker, this.maxAffordable(price, 0.28), price);
        if (t) { t.reason = `🔍 Undervalued RSI ${rsi.toFixed(0)}`; trades.push(t); }
      } else if (rsi > 72 && dev > 6 && this.portfolio[ticker]?.shares > 0) {
        const t = this.sell(ticker, this.portfolio[ticker].shares, price);
        if (t) { t.reason = `💰 Overbought RSI ${rsi.toFixed(0)}`; trades.push(t); }
      }
    }
    return trades;
  }
}

class RiskBot extends BaseAgent {
  constructor(cash) { super('RiskBot', 'Risk Averse', '#ff8800', '🛡️', cash); this.stopLoss = 0.05; }
  decide(marketData, event) {
    const trades = [];
    if (event?.type === 'crash') {
      for (const [ticker, pos] of Object.entries(this.portfolio)) {
        if (pos.shares > 0 && marketData[ticker]) {
          const t = this.sell(ticker, Math.ceil(pos.shares * 0.75), marketData[ticker].price);
          if (t) { t.reason = '⚠️ Crash: emergency exit'; trades.push(t); }
        }
      }
      return trades;
    }
    for (const [ticker, data] of Object.entries(marketData)) {
      const { price, volatility, indicators: { rsi } } = data;
      if (this.portfolio[ticker]) {
        const loss = (price - this.portfolio[ticker].avgCost) / this.portfolio[ticker].avgCost;
        if (loss < -this.stopLoss) {
          const t = this.sell(ticker, this.portfolio[ticker].shares, price);
          if (t) { t.reason = `🛑 Stop-loss ${(loss*100).toFixed(1)}%`; trades.push(t); }
          continue;
        }
        if (loss > 0.12) {
          const t = this.sell(ticker, Math.ceil(this.portfolio[ticker].shares * 0.5), price);
          if (t) { t.reason = `✅ Profit lock +${(loss*100).toFixed(1)}%`; trades.push(t); }
          continue;
        }
      }
      if (!this.portfolio[ticker] && volatility <= 0.028 && rsi > 38 && rsi < 52 && this.cash >= price * 2) {
        const t = this.buy(ticker, this.maxAffordable(price, 0.14), price);
        if (t) { t.reason = `🛡️ Safe entry vol=${(volatility*100).toFixed(1)}%`; trades.push(t); }
      }
    }
    return trades;
  }
}

class RandomBot extends BaseAgent {
  constructor(cash) { super('RandomBot', 'Chaos Theory', '#ff0088', '🎲', cash); }
  decide(marketData) {
    const trades = [];
    if (Math.random() > 0.55) return trades;
    const tickers = Object.keys(marketData);
    const ticker  = tickers[Math.floor(Math.random() * tickers.length)];
    const { price } = marketData[ticker];
    const roll = Math.random();
    if (roll < 0.48 && this.cash >= price) {
      const t = this.buy(ticker, this.maxAffordable(price, 0.22), price);
      if (t) { t.reason = '🎲 YOLO BUY!'; trades.push(t); }
    } else if (roll < 0.8 && this.portfolio[ticker]?.shares > 0) {
      const shares = Math.max(1, Math.ceil(this.portfolio[ticker].shares * Math.random()));
      const t = this.sell(ticker, shares, price);
      if (t) { t.reason = '🎲 Chaos sell!'; trades.push(t); }
    }
    return trades;
  }
}

class RLBot extends BaseAgent {
  constructor(cash) {
    super('RLBot', 'Reinforcement Learning', '#cc44ff', '🤖', cash);
    this.Q = {}; this.epsilon = 0.18; this.alpha = 0.12; this.gamma = 0.95;
    this.prevState = null; this.prevAct = null; this.prevVal = cash;
  }
  disc(rsi, momentum, hasPos) {
    const r = rsi < 30 ? 'OS' : rsi > 70 ? 'OB' : 'N';
    const m = momentum < -1.5 ? 'D' : momentum > 1.5 ? 'U' : 'F';
    return `${r}-${m}-${hasPos ? 'H' : 'E'}`;
  }
  decide(marketData) {
    const trades = [];
    const tickers = Object.keys(marketData);
    const ticker  = tickers[Math.floor(Math.random() * tickers.length)];
    const { price, indicators: { rsi, momentum } } = marketData[ticker];
    const hasPos = !!this.portfolio[ticker];
    const state  = `${ticker}-${this.disc(rsi, momentum, hasPos)}`;
    if (!this.Q[state]) this.Q[state] = { buy: 0, sell: 0, hold: 0 };
    if (this.prevState && this.prevAct) {
      const reward = (this.totalValue - this.prevVal) / this.prevVal * 100;
      if (!this.Q[this.prevState]) this.Q[this.prevState] = { buy: 0, sell: 0, hold: 0 };
      const maxNext = Math.max(...Object.values(this.Q[state]));
      this.Q[this.prevState][this.prevAct] += this.alpha * (reward + this.gamma * maxNext - this.Q[this.prevState][this.prevAct]);
      this.prevVal = this.totalValue;
    }
    const action = Math.random() < this.epsilon
      ? ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)]
      : Object.entries(this.Q[state]).sort((a, b) => b[1] - a[1])[0][0];
    this.prevState = state; this.prevAct = action;
    this.epsilon = Math.max(0.05, this.epsilon * 0.999);
    if (action === 'buy' && this.cash >= price) {
      const t = this.buy(ticker, this.maxAffordable(price, 0.2), price);
      if (t) { t.reason = `🤖 Q-BUY ε=${this.epsilon.toFixed(2)}`; trades.push(t); }
    } else if (action === 'sell' && hasPos) {
      const t = this.sell(ticker, Math.ceil(this.portfolio[ticker].shares * 0.55), price);
      if (t) { t.reason = `🤖 Q-SELL`; trades.push(t); }
    }
    return trades;
  }
}

function createAgents(names, startingCash) {
  const map = {
    MomentumBot: () => new MomentumBot(startingCash),
    ValueBot:    () => new ValueBot(startingCash),
    RiskBot:     () => new RiskBot(startingCash),
    RandomBot:   () => new RandomBot(startingCash),
    RLBot:       () => new RLBot(startingCash),
  };
  return names.filter(n => map[n]).map(n => map[n]());
}

module.exports = { createAgents };