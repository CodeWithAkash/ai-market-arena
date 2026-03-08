import { useEffect, useRef, useState, useCallback } from 'react';

function buildWsUrl() {
  let base = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '';

  // Convert http → ws if someone put the API url in WS field by mistake
  base = base.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');

  // Strip trailing slashes
  base = base.replace(/\/+$/, '');

  if (!base) base = 'ws://localhost:3001';

  return `${base}/ws`;
}

const WS_URL = buildWsUrl();
console.log('[WS] Target URL:', WS_URL);

export function useGameSocket({ selectedAgents, startingCash, onGameOver }) {
  const wsRef      = useRef(null);
  const retryTimer = useRef(null);
  const retries    = useRef(0);
  const pingTimer  = useRef(null);
  const pingSent   = useRef(null);
  const mounted    = useRef(true);

  const agentsRef     = useRef(selectedAgents);
  const cashRef       = useRef(startingCash);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => { agentsRef.current     = selectedAgents; }, [selectedAgents]);
  useEffect(() => { cashRef.current       = startingCash;   }, [startingCash]);
  useEffect(() => { onGameOverRef.current = onGameOver;     }, [onGameOver]);

  const [connected,   setConnected]   = useState(false);
  const [gameState,   setGameState]   = useState(null);
  const [tradeResult, setTradeResult] = useState(null);
  const [latency,     setLatency]     = useState(null);

  const connect = useCallback(() => {
    if (!mounted.current) return;

    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)) {
      return;
    }

    console.log(`[WS] Connecting (attempt ${retries.current + 1}) → ${WS_URL}`);

    let socket;
    try {
      socket = new WebSocket(WS_URL);
      wsRef.current = socket;
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      if (!mounted.current) { socket.close(); return; }
      console.log('[WS] Connected ✅');
      setConnected(true);
      retries.current = 0;

      socket.send(JSON.stringify({
        type:           'JOIN',
        sessionId:      null,
        selectedAgents: agentsRef.current  || ['MomentumBot','ValueBot','RiskBot','RandomBot','RLBot'],
        startingCash:   cashRef.current    || 10000,
      }));

      // Ping every 25s — Render kills idle connections at 30s
      clearInterval(pingTimer.current);
      pingTimer.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          pingSent.current = Date.now();
          socket.send(JSON.stringify({ type: 'PING' }));
        }
      }, 25000);
    };

    socket.onmessage = e => {
      if (!mounted.current) return;
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === 'STATE')        setGameState(msg.payload);
      if (msg.type === 'TICK')         setGameState(msg.payload);
      if (msg.type === 'TRADE_RESULT') setTradeResult({ ...msg.payload, _ts: Date.now() });
      if (msg.type === 'GAME_OVER')  { setGameState(msg.payload); onGameOverRef.current?.(msg.payload); }
      if (msg.type === 'PONG' && pingSent.current) setLatency(Date.now() - pingSent.current);
      if (msg.type === 'ERROR') console.error('[WS] Server error:', msg.message);
    };

    socket.onclose = (event) => {
      if (!mounted.current) return;
      console.log(`[WS] Closed (code=${event.code})`);
      setConnected(false);
      clearInterval(pingTimer.current);
      scheduleReconnect();
    };

    socket.onerror = () => {
      console.error('[WS] Error — will reconnect after close');
    };
  }, []);

  function scheduleReconnect() {
    if (!mounted.current) return;
    const delay = Math.min(1500 * Math.pow(1.8, retries.current), 20000);
    retries.current++;
    console.log(`[WS] Reconnecting in ${(delay / 1000).toFixed(1)}s...`);
    clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(connect, delay);
  }

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
      clearTimeout(retryTimer.current);
      clearInterval(pingTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendBuy = useCallback((ticker, shares) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'BUY', ticker, shares: parseInt(shares, 10) }));
    }
  }, []);

  const sendSell = useCallback((ticker, shares) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'SELL', ticker, shares: parseInt(shares, 10) }));
    }
  }, []);

  return { connected, gameState, tradeResult, latency, sendBuy, sendSell };
}