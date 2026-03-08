'use strict';

const STOCKS = {
  AAPL:  { name: 'Apple Inc.',        price: 185.50, sector: 'Tech',           volatility: 0.020 },
  GOOGL: { name: 'Alphabet Inc.',     price: 141.20, sector: 'Tech',           volatility: 0.025 },
  TSLA:  { name: 'Tesla Inc.',        price: 248.30, sector: 'EV',             volatility: 0.045 },
  MSFT:  { name: 'Microsoft Corp.',   price: 378.90, sector: 'Tech',           volatility: 0.018 },
  AMZN:  { name: 'Amazon.com Inc.',   price: 178.60, sector: 'E-Commerce',     volatility: 0.030 },
  NVDA:  { name: 'NVIDIA Corp.',      price: 495.20, sector: 'Semiconductors', volatility: 0.050 },
  META:  { name: 'Meta Platforms',    price: 354.10, sector: 'Social Media',   volatility: 0.035 },
  NFLX:  { name: 'Netflix Inc.',      price: 478.90, sector: 'Streaming',      volatility: 0.040 },
};

const MARKET_EVENTS = [
  { type: 'crash',   message: '🔴 BREAKING: Tech sector selloff accelerating!',      impact: -0.08, sector: 'Tech' },
  { type: 'boom',    message: '🟢 Fed cuts rates — markets surge across the board!', impact:  0.06, sector: 'all' },
  { type: 'crash',   message: '🔴 Inflation data worse than expected!',              impact: -0.05, sector: 'all' },
  { type: 'boom',    message: '🟢 Strong earnings beat — tech giants rally!',        impact:  0.07, sector: 'Tech' },
  { type: 'neutral', message: '⚡ Volatility spike: options expiry approaching',     impact:  0.00, sector: 'all' },
  { type: 'crash',   message: '🔴 Geopolitical tensions escalate — risk-off mode!',  impact: -0.04, sector: 'EV' },
  { type: 'boom',    message: '🟢 AI breakthrough lifts semiconductor stocks!',      impact:  0.09, sector: 'Semiconductors' },
  { type: 'crash',   message: '🔴 Antitrust probe launched against big tech!',       impact: -0.06, sector: 'Social Media' },
  { type: 'boom',    message: '🟢 Blockbuster jobs report beats all forecasts!',     impact:  0.04, sector: 'all' },
  { type: 'crash',   message: '🔴 Banking sector liquidity concerns spread!',        impact: -0.03, sector: 'all' },
  { type: 'boom',    message: '🟢 Mega merger announced — M&A wave begins!',         impact:  0.05, sector: 'E-Commerce' },
  { type: 'crash',   message: '🔴 Flash crash triggered — circuit breakers active!', impact: -0.07, sector: 'all' },
  { type: 'boom',    message: '🟢 Streaming wars over — content deal of decade!',    impact:  0.08, sector: 'Streaming' },
  { type: 'crash',   message: '🔴 EV demand falls — price war deepens!',             impact: -0.05, sector: 'EV' },
];

function normalRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

class MarketSimulator {
  constructor() {
    this.stocks = Object.fromEntries(Object.entries(STOCKS).map(([k, v]) => [k, { ...v }]));
    this.priceHistory = Object.fromEntries(Object.keys(STOCKS).map(k => [k, [STOCKS[k].price]]));
  }

  updatePrices(eventMultiplier = {}) {
    const dt = 1 / 252;
    Object.keys(this.stocks).forEach(ticker => {
      const s = this.stocks[ticker];
      const dW = normalRandom() * Math.sqrt(dt);
      let pct = 0.0008 * dt + s.volatility * dW;
      if (eventMultiplier[ticker] !== undefined) pct += eventMultiplier[ticker];
      s.price = Math.max(1, parseFloat((s.price * Math.exp(pct)).toFixed(2)));
      this.priceHistory[ticker].push(s.price);
      if (this.priceHistory[ticker].length > 80) this.priceHistory[ticker].shift();
    });
  }

  triggerRandomEvent() {
    if (Math.random() < 0.08) {
      return { ...MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)], id: Date.now() };
    }
    return null;
  }

  getEventMultiplier(event) {
    if (!event) return {};
    const m = {};
    Object.keys(this.stocks).forEach(ticker => {
      if (event.sector === 'all' || this.stocks[ticker].sector === event.sector) {
        m[ticker] = event.impact * (0.4 + Math.random() * 0.6);
      }
    });
    return m;
  }

  calcIndicators(ticker) {
    const h = this.priceHistory[ticker];
    if (h.length < 5) return { rsi: 50, ma5: h[0], ma20: h[0], momentum: 0 };
    const gains = [], losses = [];
    for (let i = 1; i < Math.min(15, h.length); i++) {
      const d = h[i] - h[i - 1];
      d >= 0 ? gains.push(d) : losses.push(-d);
    }
    const ag = gains.reduce((a, b) => a + b, 0) / 14 || 0;
    const al = losses.reduce((a, b) => a + b, 0) / 14 || 0.0001;
    const rsi  = 100 - 100 / (1 + ag / al);
    const ma5  = h.slice(-Math.min(5,  h.length)).reduce((a, b) => a + b, 0) / Math.min(5,  h.length);
    const ma20 = h.slice(-Math.min(20, h.length)).reduce((a, b) => a + b, 0) / Math.min(20, h.length);
    const lb   = Math.min(6, h.length);
    const momentum = ((h[h.length - 1] - h[h.length - lb]) / h[h.length - lb]) * 100;
    return { rsi, ma5, ma20, momentum };
  }

  getMarketData() {
    const out = {};
    Object.keys(this.stocks).forEach(ticker => {
      out[ticker] = { ...this.stocks[ticker], ticker, history: [...this.priceHistory[ticker]], indicators: this.calcIndicators(ticker) };
    });
    return out;
  }
}

module.exports = { MarketSimulator, STOCKS };