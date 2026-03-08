// Stock market simulation service
const STOCKS = {
  AAPL: { name: 'Apple Inc.', price: 185.5, sector: 'Tech', volatility: 0.02 },
  GOOGL: { name: 'Alphabet Inc.', price: 141.2, sector: 'Tech', volatility: 0.025 },
  TSLA: { name: 'Tesla Inc.', price: 248.3, sector: 'EV', volatility: 0.045 },
  MSFT: { name: 'Microsoft Corp.', price: 378.9, sector: 'Tech', volatility: 0.018 },
  AMZN: { name: 'Amazon.com Inc.', price: 178.6, sector: 'E-Commerce', volatility: 0.03 },
  NVDA: { name: 'NVIDIA Corp.', price: 495.2, sector: 'Semiconductors', volatility: 0.05 },
  META: { name: 'Meta Platforms', price: 354.1, sector: 'Social Media', volatility: 0.035 },
  NFLX: { name: 'Netflix Inc.', price: 478.9, sector: 'Streaming', volatility: 0.04 },
};

const MARKET_EVENTS = [
  { type: 'crash', message: '🔴 BREAKING: Tech sector selloff accelerating!', impact: -0.08, sector: 'Tech' },
  { type: 'boom', message: '🟢 Fed cuts rates! Markets surge!', impact: 0.06, sector: 'all' },
  { type: 'crash', message: '🔴 Inflation data worse than expected!', impact: -0.05, sector: 'all' },
  { type: 'boom', message: '🟢 Strong earnings beat across tech giants!', impact: 0.07, sector: 'Tech' },
  { type: 'neutral', message: '⚡ Volatility spike: Options expiry approaching', impact: 0.0, sector: 'all' },
  { type: 'crash', message: '🔴 Geopolitical tensions escalate — safe havens rally', impact: -0.04, sector: 'EV' },
  { type: 'boom', message: '🟢 AI breakthrough announcement boosts semiconductor stocks!', impact: 0.09, sector: 'Semiconductors' },
  { type: 'crash', message: '🔴 Antitrust investigation launched against big tech', impact: -0.06, sector: 'Social Media' },
  { type: 'boom', message: '🟢 Surprise jobs report: Economy stronger than forecast!', impact: 0.04, sector: 'all' },
  { type: 'crash', message: '🔴 Banking sector liquidity concerns emerge', impact: -0.03, sector: 'all' },
  { type: 'boom', message: '🟢 Major acquisition announced — M&A wave begins!', impact: 0.05, sector: 'E-Commerce' },
  { type: 'neutral', message: '⚡ Circuit breaker triggered on high volatility stock', impact: 0.0, sector: 'all' },
];

class MarketSimulator {
  constructor() {
    this.stocks = JSON.parse(JSON.stringify(STOCKS));
    this.priceHistory = {};
    this.currentEvent = null;
    
    // Initialize price history
    Object.keys(this.stocks).forEach(ticker => {
      this.priceHistory[ticker] = [this.stocks[ticker].price];
    });
  }

  // Geometric Brownian Motion price simulation
  updatePrices(eventMultiplier = {}) {
    Object.keys(this.stocks).forEach(ticker => {
      const stock = this.stocks[ticker];
      const dt = 1 / 252; // Daily time step
      const mu = 0.001; // Drift
      const sigma = stock.volatility;
      
      // Random shock (Wiener process)
      const randomShock = this.normalRandom() * Math.sqrt(dt);
      let priceChange = mu * dt + sigma * randomShock;
      
      // Apply event multiplier
      if (eventMultiplier[ticker] !== undefined) {
        priceChange += eventMultiplier[ticker];
      }
      
      const newPrice = stock.price * Math.exp(priceChange);
      stock.price = Math.max(1, parseFloat(newPrice.toFixed(2)));
      
      this.priceHistory[ticker].push(stock.price);
      if (this.priceHistory[ticker].length > 50) {
        this.priceHistory[ticker].shift();
      }
    });

    return this.stocks;
  }

  triggerRandomEvent() {
    if (Math.random() < 0.08) { // 8% chance per tick
      const event = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
      this.currentEvent = { ...event, id: Date.now() };
      return this.currentEvent;
    }
    return null;
  }

  getEventMultiplier(event) {
    if (!event) return {};
    const multiplier = {};
    
    Object.keys(this.stocks).forEach(ticker => {
      const stock = this.stocks[ticker];
      if (event.sector === 'all' || stock.sector === event.sector) {
        // Add some randomness to impact
        multiplier[ticker] = event.impact * (0.5 + Math.random());
      }
    });
    
    return multiplier;
  }

  // Box-Muller transform for normal distribution
  normalRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  calculateIndicators(ticker) {
    const history = this.priceHistory[ticker];
    if (history.length < 10) return { rsi: 50, ma5: history[0], ma20: history[0], momentum: 0 };

    // RSI
    const gains = [], losses = [];
    for (let i = 1; i < Math.min(15, history.length); i++) {
      const diff = history[i] - history[i - 1];
      if (diff > 0) gains.push(diff);
      else losses.push(Math.abs(diff));
    }
    const avgGain = gains.reduce((a, b) => a + b, 0) / 14 || 0;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / 14 || 0.001;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Moving averages
    const ma5 = history.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const ma20 = history.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, history.length);

    // Momentum
    const momentum = history.length > 5 ? 
      ((history[history.length - 1] - history[history.length - 6]) / history[history.length - 6]) * 100 : 0;

    return { rsi, ma5, ma20, momentum };
  }

  getMarketData() {
    const marketData = {};
    Object.keys(this.stocks).forEach(ticker => {
      marketData[ticker] = {
        ...this.stocks[ticker],
        ticker,
        history: this.priceHistory[ticker],
        indicators: this.calculateIndicators(ticker),
      };
    });
    return marketData;
  }
}

module.exports = { MarketSimulator, STOCKS };
