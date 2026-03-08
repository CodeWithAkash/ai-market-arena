# ⚔ AI Market Arena — Human vs AI Trading Battle

A real-time, ML-powered stock market battle game where you trade against 5 AI agents with different strategies.

Live - https://market.akash-codes.space

## 🎮 What It Is

- **Interactive trading battle** — you vs 5 AI agents in real-time
- **ML-powered AI** — momentum, value, risk-averse, random, and Q-learning RL bots
- **Live market simulation** — Geometric Brownian Motion price simulation with realistic indicators
- **Market events** — random news events affect prices and agent behavior
- **No login required** — jump straight in
- **Cyberpunk HUD** — dark futuristic UI with particle effects and neon glow

## 🏗️ Architecture

```
Frontend (Netlify) → WebSocket → Backend (Render) → MongoDB (Atlas)
    React + Vite          Node.js + WS          Leaderboard storage
```

## 🤖 AI Agents

| Agent | Strategy | Color |
|-------|----------|-------|
| **MomentumBot** | Trend following (RSI + Moving Averages + Momentum) | 🟢 Green |
| **ValueBot** | Value investing (Regression + RSI divergence) | 🔵 Blue |
| **RiskBot** | Volatility hedging + stop-loss engine | 🟠 Orange |
| **RandomBot** | Chaos theory (Brownian YOLO) | 🔴 Pink |
| **RLBot** | Q-Learning reinforcement learning (ε-greedy) | 🟣 Purple |

## 🚀 Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ai-market-arena.git
cd ai-market-arena
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3001 and VITE_WS_URL=ws://localhost:3001/ws
npm run dev
```

## 🌐 Deployment

### MongoDB Atlas
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user
4. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/ai-market-arena`
5. Allow all IPs in Network Access (0.0.0.0/0)

### Backend on Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` = your Atlas connection string
   - `FRONTEND_URL` = your Netlify URL (after deploying frontend)
   - `NODE_ENV` = `production`
6. Deploy — note your Render URL (e.g., `https://ai-market-arena.onrender.com`)

### Frontend on Netlify
1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Connect your GitHub repo
3. Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add Environment Variables:
   - `VITE_API_URL` = `https://your-app.onrender.com`
   - `VITE_WS_URL` = `wss://your-app.onrender.com`
5. Deploy → set your custom domain

## 📁 Project Structure

```
ai-market-arena/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingScreen.jsx    # Arena selection + agent picker
│   │   │   ├── ArenaScreen.jsx      # Main battle HUD
│   │   │   ├── StockPanel.jsx       # Live stock list with mini charts
│   │   │   ├── TradePanel.jsx       # Buy/sell execution
│   │   │   ├── LeaderboardPanel.jsx # Live rankings
│   │   │   ├── FeedPanels.jsx       # Events + trade feed
│   │   │   ├── GameOverScreen.jsx   # Results + score save
│   │   │   └── ParticleField.jsx    # Animated background
│   │   ├── hooks/
│   │   │   └── useGameSocket.js     # WebSocket hook
│   │   ├── utils/
│   │   │   └── api.js               # API calls
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.js                 # Express + WebSocket server
│   │   ├── routes/game.js           # REST API routes
│   │   ├── services/
│   │   │   ├── marketSimulator.js   # GBM price simulation + events
│   │   │   └── gameSession.js       # Session management
│   │   ├── agents/
│   │   │   └── tradingAgents.js     # All 5 AI agent classes
│   │   └── models/index.js          # MongoDB schemas
│   └── package.json
│
├── netlify.toml
├── render.yaml
└── README.md
```

## 🎯 How to Play

1. **Choose your opponents** — select which AI bots to battle (all selected by default)
2. **Set starting capital** — $5K, $10K, $25K, or $50K
3. **Click "Enter the Arena"** — 3-2-1-GO countdown starts the battle
4. **Select a stock** from the left panel
5. **Set your shares** and click BUY or SELL
6. **Watch the AI agents** react to market events in real-time
7. **200 ticks** later, see who won!

## 🧪 ML Components

- **MomentumBot**: Uses momentum score (price change over lookback period) to buy rising stocks and sell falling ones
- **ValueBot**: RSI + deviation from 20-period MA to identify overbought/oversold conditions
- **RiskBot**: Volatility-weighted position sizing with automatic stop-loss at -5%
- **RLBot**: Q-Learning with discretized state space (RSI bucket × momentum × position), ε-greedy exploration
- **Price Simulation**: Geometric Brownian Motion (GBM): `dS = μS·dt + σS·dW`

## 📊 Market Data

- 8 NASDAQ stocks: AAPL, GOOGL, TSLA, MSFT, AMZN, NVDA, META, NFLX
- Technical indicators: RSI, 5-MA, 20-MA, Momentum, Volatility
- 12 random market events affecting prices

## License
MIT
