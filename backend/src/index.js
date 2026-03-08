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
const wss    = new WebSocket.Server({ server, path: '/ws' });

app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json());
app.use('/api', gameRoutes);

const sessionClients = new Map();
const sessionTimers  = new Map();
const wsSession      = new Map();

wss.on('connection', (ws, req) => {
  console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'JOIN') {
      const { sessionId, selectedAgents, startingCash } = msg;
      let session = getSession(sessionId);
      if (!session && selectedAgents?.length) {
        session = createSession({ selectedAgents, startingCash: startingCash || 10000 });
      }
      if (!session) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Session not found' }));
        return;
      }
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
    console.log('[WS] Client disconnected');
  });

  ws.on('error', err => console.error('[WS] Error:', err.message));
});

function startLoop(sid) {
  if (sessionTimers.has(sid)) return;
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
  console.log(`[LOOP] Started for session ${sid}`);
}

function stopLoop(sid) {
  const timer = sessionTimers.get(sid);
  if (timer) { clearInterval(timer); sessionTimers.delete(sid); }
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
  if (!uri) { console.warn('[DB] No MONGODB_URI'); return; }
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
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));