// AI Trading Agents with different ML/algorithmic strategies

class BaseAgent {
  constructor(name, personality, color, startingCash = 10000) {
    this.name = name;
    this.personality = personality;
    this.color = color;
    this.cash = startingCash;
    this.portfolio = {}; // { ticker: { shares, avgCost } }
    this.tradeHistory = [];
    this.totalValue = startingCash;
  }

  getPortfolioValue(marketData) {
    let value = this.cash;
    Object.keys(this.portfolio).forEach(ticker => {
      if (marketData[ticker]) {
        value += this.portfolio[ticker].shares * marketData[ticker].price;
      }
    });
    this.totalValue = parseFloat(value.toFixed(2));
    return this.totalValue;
  }

  executeBuy(ticker, shares, price) {
    const cost = shares * price;
    if (cost > this.cash) return null;
    
    this.cash -= cost;
    if (!this.portfolio[ticker]) {
      this.portfolio[ticker] = { shares: 0, avgCost: 0 };
    }
    const existing = this.portfolio[ticker];
    const newTotalShares = existing.shares + shares;
    existing.avgCost = (existing.shares * existing.avgCost + cost) / newTotalShares;
    existing.shares = newTotalShares;
    
    const trade = { type: 'BUY', ticker, shares, price, timestamp: Date.now() };
    this.tradeHistory.push(trade);
    return trade;
  }

  executeSell(ticker, shares, price) {
    if (!this.portfolio[ticker] || this.portfolio[ticker].shares < shares) return null;
    
    this.cash += shares * price;
    this.portfolio[ticker].shares -= shares;
    if (this.portfolio[ticker].shares === 0) {
      delete this.portfolio[ticker];
    }
    
    const trade = { type: 'SELL', ticker, shares, price, timestamp: Date.now() };
    this.tradeHistory.push(trade);
    return trade;
  }

  getAffordableShares(price, fraction = 0.2) {
    return Math.max(1, Math.floor((this.cash * fraction) / price));
  }
}

// 1. MOMENTUM BOT — Trend following ML model
class MomentumBot extends BaseAgent {
  constructor() {
    super('MomentumBot', 'Trend Following', '#00ff88', 10000);
    this.lookbackPeriod = 5;
    this.threshold = 0.5; // momentum threshold %
  }

  decide(marketData, event) {
    const decisions = [];
    
    Object.keys(marketData).forEach(ticker => {
      const { indicators, price } = marketData[ticker];
      const { momentum, ma5, ma20 } = indicators;
      
      // Event reaction: momentum bot loves trends
      let eventBoost = 0;
      if (event) {
        eventBoost = event.type === 'boom' ? 2 : event.type === 'crash' ? -2 : 0;
      }
      
      const signal = momentum + eventBoost;
      
      if (signal > this.threshold && this.cash > price) {
        // Strong upward momentum → BUY
        const shares = this.getAffordableShares(price, 0.25);
        const trade = this.executeBuy(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: `Momentum: +${momentum.toFixed(2)}%` });
      } else if (signal < -this.threshold && this.portfolio[ticker]?.shares > 0) {
        // Downward momentum → SELL
        const shares = Math.ceil(this.portfolio[ticker].shares * 0.5);
        const trade = this.executeSell(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: `Momentum: ${momentum.toFixed(2)}%` });
      }
    });
    
    return decisions;
  }
}

// 2. VALUE BOT — Fundamental value regression model
class ValueBot extends BaseAgent {
  constructor() {
    super('ValueBot', 'Value Investing', '#4488ff', 10000);
    this.fairValueMultiplier = {}; // tracks perceived fair value per stock
  }

  decide(marketData, event) {
    const decisions = [];
    
    Object.keys(marketData).forEach(ticker => {
      const { indicators, price, history } = marketData[ticker];
      const { ma20, rsi } = indicators;
      
      // Value bot cares about RSI and deviation from mean
      const deviation = ((price - ma20) / ma20) * 100;
      
      // Oversold = undervalued = BUY
      if (rsi < 35 && deviation < -3 && this.cash > price) {
        const shares = this.getAffordableShares(price, 0.3);
        const trade = this.executeBuy(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: `Undervalued: RSI ${rsi.toFixed(0)}` });
      }
      // Overbought = overvalued = SELL  
      else if (rsi > 70 && deviation > 5 && this.portfolio[ticker]?.shares > 0) {
        const shares = this.portfolio[ticker].shares;
        const trade = this.executeSell(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: `Overbought: RSI ${rsi.toFixed(0)}` });
      }
    });
    
    return decisions;
  }
}

// 3. RISK BOT — Volatility-aware defensive model
class RiskBot extends BaseAgent {
  constructor() {
    super('RiskBot', 'Risk Averse', '#ff8800', 10000);
    this.maxVolatilityThreshold = 0.03;
    this.stopLoss = 0.05; // 5% stop loss
  }

  decide(marketData, event) {
    const decisions = [];
    
    // In crash events, Risk bot immediately reduces exposure
    if (event && event.type === 'crash') {
      Object.keys(this.portfolio).forEach(ticker => {
        if (this.portfolio[ticker]?.shares > 0 && marketData[ticker]) {
          const shares = Math.ceil(this.portfolio[ticker].shares * 0.7);
          const trade = this.executeSell(ticker, shares, marketData[ticker].price);
          if (trade) decisions.push({ ...trade, agent: this.name, reason: '⚠️ Risk management: crash detected' });
        }
      });
      return decisions;
    }
    
    Object.keys(marketData).forEach(ticker => {
      const { volatility, price, indicators } = marketData[ticker];
      const { rsi, momentum } = indicators;
      
      // Stop loss check
      if (this.portfolio[ticker]) {
        const avgCost = this.portfolio[ticker].avgCost;
        const loss = (price - avgCost) / avgCost;
        if (loss < -this.stopLoss) {
          const shares = this.portfolio[ticker].shares;
          const trade = this.executeSell(ticker, shares, price);
          if (trade) decisions.push({ ...trade, agent: this.name, reason: `🛑 Stop loss: ${(loss*100).toFixed(1)}%` });
          return;
        }
      }
      
      // Only buy low-volatility, stable stocks
      if (volatility < this.maxVolatilityThreshold && rsi < 50 && rsi > 35 && this.cash > price * 2) {
        const shares = this.getAffordableShares(price, 0.15);
        const trade = this.executeBuy(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: `Low risk entry: vol=${volatility}` });
      }
    });
    
    return decisions;
  }
}

// 4. RANDOM BOT — Chaotic random trader
class RandomBot extends BaseAgent {
  constructor() {
    super('RandomBot', 'Chaos Theory', '#ff0088', 10000);
  }

  decide(marketData, event) {
    const decisions = [];
    const tickers = Object.keys(marketData);
    
    // Random action every 3-4 ticks
    if (Math.random() > 0.6) {
      const ticker = tickers[Math.floor(Math.random() * tickers.length)];
      const { price } = marketData[ticker];
      const action = Math.random();
      
      if (action < 0.5 && this.cash > price) {
        const shares = this.getAffordableShares(price, 0.2);
        const trade = this.executeBuy(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: '🎲 Random YOLO!' });
      } else if (this.portfolio[ticker]?.shares > 0) {
        const shares = Math.ceil(this.portfolio[ticker].shares * Math.random());
        if (shares > 0) {
          const trade = this.executeSell(ticker, shares, price);
          if (trade) decisions.push({ ...trade, agent: this.name, reason: '🎲 Random chaos!' });
        }
      }
    }
    
    return decisions;
  }
}

// 5. RL BOT — Reinforcement Learning Q-table agent
class RLBot extends BaseAgent {
  constructor() {
    super('RLBot', 'Reinforcement Learning', '#cc44ff', 10000);
    this.qTable = {}; // state → action values
    this.epsilon = 0.15; // exploration rate
    this.alpha = 0.1; // learning rate
    this.gamma = 0.95; // discount factor
    this.lastState = null;
    this.lastAction = null;
    this.lastValue = 10000;
  }

  getState(ticker, indicators) {
    const { rsi, momentum } = indicators;
    // Discretize state
    const rsiState = rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral';
    const momState = momentum < -1 ? 'falling' : momentum > 1 ? 'rising' : 'flat';
    const hasPosition = this.portfolio[ticker] ? 'yes' : 'no';
    return `${ticker}-${rsiState}-${momState}-${hasPosition}`;
  }

  getQValue(state, action) {
    if (!this.qTable[state]) this.qTable[state] = { buy: 0, sell: 0, hold: 0 };
    return this.qTable[state][action];
  }

  updateQ(state, action, reward, nextState) {
    if (!this.qTable[state]) this.qTable[state] = { buy: 0, sell: 0, hold: 0 };
    if (!this.qTable[nextState]) this.qTable[nextState] = { buy: 0, sell: 0, hold: 0 };
    
    const currentQ = this.qTable[state][action];
    const maxNextQ = Math.max(...Object.values(this.qTable[nextState]));
    this.qTable[state][action] = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
  }

  decide(marketData, event) {
    const decisions = [];
    
    Object.keys(marketData).forEach(ticker => {
      const { price, indicators } = marketData[ticker];
      const state = this.getState(ticker, indicators);
      
      // ε-greedy policy
      let action;
      if (Math.random() < this.epsilon) {
        // Explore
        const actions = ['buy', 'sell', 'hold'];
        action = actions[Math.floor(Math.random() * actions.length)];
      } else {
        // Exploit best known action
        if (!this.qTable[state]) this.qTable[state] = { buy: 0, sell: 0, hold: 0 };
        action = Object.entries(this.qTable[state]).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      }

      // Q-learning update from last step
      const currentValue = this.getPortfolioValue(marketData);
      const reward = currentValue - this.lastValue;
      if (this.lastState && this.lastAction) {
        this.updateQ(this.lastState + '-' + ticker, this.lastAction, reward, state);
      }
      this.lastState = state;
      this.lastAction = action;
      this.lastValue = currentValue;
      
      if (action === 'buy' && this.cash > price) {
        const shares = this.getAffordableShares(price, 0.2);
        const trade = this.executeBuy(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: `🤖 RL Policy: Q-BUY (ε=${this.epsilon.toFixed(2)})` });
      } else if (action === 'sell' && this.portfolio[ticker]?.shares > 0) {
        const shares = Math.ceil(this.portfolio[ticker].shares * 0.5);
        const trade = this.executeSell(ticker, shares, price);
        if (trade) decisions.push({ ...trade, agent: this.name, reason: `🤖 RL Policy: Q-SELL` });
      }
    });
    
    return decisions;
  }
}

function createAgents() {
  return [
    new MomentumBot(),
    new ValueBot(),
    new RiskBot(),
    new RandomBot(),
    new RLBot(),
  ];
}

module.exports = { createAgents, MomentumBot, ValueBot, RiskBot, RandomBot, RLBot };
