require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const gameRoutes = require('./routes/game');
const { getSession } = require('./services/gameSession');

const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.replace('*', '')))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev; tighten in prod
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api', gameRoutes);

// WebSocket game loop
const gameLoops = new Map(); // sessionId → { interval, clients }
const clientSessions = new Map(); // ws → sessionId

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'JOIN_SESSION') {
        const { sessionId } = data;
        clientSessions.set(ws, sessionId);
        
        if (!gameLoops.has(sessionId)) {
          gameLoops.set(sessionId, new Set());
        }
        gameLoops.get(sessionId).add(ws);
        
        // Send initial state
        const session = getSession(sessionId);
        if (session) {
          ws.send(JSON.stringify({ type: 'GAME_STATE', payload: session.getFullState() }));
          startGameLoop(sessionId);
        }
      }
      
      if (data.type === 'BUY' || data.type === 'SELL') {
        const sessionId = clientSessions.get(ws);
        if (!sessionId) return;
        const session = getSession(sessionId);
        if (!session) return;
        
        let result;
        if (data.type === 'BUY') {
          result = session.playerBuy(data.ticker, data.shares);
        } else {
          result = session.playerSell(data.ticker, data.shares);
        }
        
        ws.send(JSON.stringify({ type: 'TRADE_RESULT', payload: result }));
      }
      
      if (data.type === 'LEAVE_SESSION') {
        removeClientFromSession(ws);
      }
      
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  ws.on('close', () => {
    removeClientFromSession(ws);
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

function removeClientFromSession(ws) {
  const sessionId = clientSessions.get(ws);
  if (sessionId && gameLoops.has(sessionId)) {
    gameLoops.get(sessionId).delete(ws);
    if (gameLoops.get(sessionId).size === 0) {
      // Stop game loop if no clients
      clearInterval(gameIntervals.get(sessionId));
      gameIntervals.delete(sessionId);
      gameLoops.delete(sessionId);
    }
  }
  clientSessions.delete(ws);
}

const gameIntervals = new Map();

function startGameLoop(sessionId) {
  if (gameIntervals.has(sessionId)) return; // Already running
  
  const session = getSession(sessionId);
  if (!session) return;
  
  const speed = session.speed || 2000;
  
  const interval = setInterval(() => {
    const session = getSession(sessionId);
    if (!session || session.status === 'ended') {
      clearInterval(interval);
      gameIntervals.delete(sessionId);
      
      // Broadcast game over
      broadcastToSession(sessionId, { type: 'GAME_OVER', payload: session?.getFullState() });
      return;
    }
    
    const update = session.tick_();
    if (update) {
      broadcastToSession(sessionId, { type: 'GAME_UPDATE', payload: update });
    }
  }, speed);
  
  gameIntervals.set(sessionId, interval);
}

function broadcastToSession(sessionId, message) {
  const clients = gameLoops.get(sessionId);
  if (!clients) return;
  
  const data = JSON.stringify(message);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// MongoDB connection
const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.log('⚠️  No MONGODB_URI — leaderboard persistence disabled');
  }
};

connectDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 AI Market Arena server running on port ${PORT}`);
});
