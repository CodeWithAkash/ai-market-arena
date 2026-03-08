'use strict';
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const http      = require('http');
const WebSocket = require('ws');
const mongoose  = require('mongoose');

const gameRoutes = require('./routes/game');
const { getSession, createSession, TICK_INTERVAL } = require('./services/gameSession');

const app    = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ noServer: true });

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

app.get('/health',     (_req, res) => res.json({ status: 'ok', ts: Date.now() }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/api', gameRoutes);

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  console.log(`[UPGRADE] request.url = "${pathname}"`);

  if (pathname === '/ws' || pathname === '/' || pathname === '') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    console.log(`[UPGRADE] Rejecting unknown path: ${pathname}`);
    socket.destroy();
  }
});

const sessionClients = new Map();
const sessionTimers  = new Map();
const wsSession      = new Map();

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[WS] Client connected from ${ip}`);

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) {
      console.error('[WS] Bad JSON:', e.message);
      return;
    }

    if (msg.type === 'JOIN') {
      const { selectedAgents, startingCash } = msg;
      console.log(`[JOIN] agents=${JSON.stringify(selectedAgents)} cash=${startingCash}`);

      const session = createSession({
        selectedAgents: selectedAgents?.length ? selectedAgents : undefined,
        startingCash:   startingCash || 10000,
      });

      wsSession.set(ws, session.id);
      if (!sessionClients.has(session.id)) sessionClients.set(session.id, new Set());
      sessionClients.get(session.id).add(ws);

      ws.send(JSON.stringify({ type: 'STATE', payload: session.fullState() }));
      startLoop(session.id);
    }

    if (msg.type === 'BUY') {
      const sid = wsSession.get(ws);
      if (!sid) return;
      const session = getSession(sid);
      if (!session) return;
      const result = session.playerBuy(msg.ticker, msg.shares);
      ws.send(JSON.stringify({ type: 'TRADE_RESULT', payload: result }));
      if (result.success) broadcast(sid, { type: 'STATE', payload: session.fullState() });
    }

    if (msg.type === 'SELL') {
      const sid = wsSession.get(ws);
      if (!sid) return;
      const session = getSession(sid);
      if (!session) return;
      const result = session.playerSell(msg.ticker, msg.shares);
      ws.send(JSON.stringify({ type: 'TRADE_RESULT', payload: result }));
      if (result.success) broadcast(sid, { type: 'STATE', payload: session.fullState() });
    }

    if (msg.type === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    const sid = wsSession.get(ws);
    if (sid) {
      const clients = sessionClients.get(sid);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          setTimeout(() => {
            if (!sessionClients.get(sid)?.size) {
              stopLoop(sid);
              sessionClients.delete(sid);
            }
          }, 30000);
        }
      }
    }
    wsSession.delete(ws);
  });

  ws.on('error', err => console.error('[WS] Socket error:', err.message));
});

function startLoop(sid) {
  if (sessionTimers.has(sid)) return;
  console.log(`[LOOP] Starting for session ${sid}`);

  const timer = setInterval(() => {
    const session = getSession(sid);
    if (!session) { stopLoop(sid); return; }

    if (session.status === 'ended') {
      broadcast(sid, { type: 'GAME_OVER', payload: session.fullState() });
      stopLoop(sid);
      return;
    }

    const update = session.advanceTick();
    if (update) broadcast(sid, { type: 'TICK', payload: update });
  }, TICK_INTERVAL);

  sessionTimers.set(sid, timer);
}

function stopLoop(sid) {
  const timer = sessionTimers.get(sid);
  if (timer) {
    clearInterval(timer);
    sessionTimers.delete(sid);
    console.log(`[LOOP] Stopped for session ${sid}`);
  }
}

function broadcast(sid, msg) {
  const clients = sessionClients.get(sid);
  if (!clients) return;
  const data = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.warn('[DB] No MONGODB_URI — leaderboard disabled'); return; }
  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected ✅');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
  }
}

connectDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 AI Market Arena backend on port ${PORT}`);
  console.log(`   REST  → /api/health`);
  console.log(`   WS    → /ws`);
  console.log(`   ENV   → ${process.env.NODE_ENV || 'development'}\n`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});