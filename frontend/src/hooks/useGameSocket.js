import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const WS_URL  = `${WS_BASE}/ws`;

export function useGameSocket({ selectedAgents, startingCash, onGameOver }) {
  const ws         = useRef(null);
  const retryTimer = useRef(null);
  const retries    = useRef(0);
  const pingTimer  = useRef(null);
  const pingSent   = useRef(null);

  const [connected,   setConnected]   = useState(false);
  const [gameState,   setGameState]   = useState(null);
  const [tradeResult, setTradeResult] = useState(null);
  const [latency,     setLatency]     = useState(null);

  const agentsRef      = useRef(selectedAgents);
  const startCashRef   = useRef(startingCash);
  const onGameOverRef  = useRef(onGameOver);

  useEffect(() => { agentsRef.current = selectedAgents; }, [selectedAgents]);
  useEffect(() => { startCashRef.current = startingCash; }, [startingCash]);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(WS_URL);
      ws.current = socket;

      socket.onopen = () => {
        setConnected(true);
        retries.current = 0;
        // Send JOIN immediately — backend creates session
        socket.send(JSON.stringify({
          type: 'JOIN',
          selectedAgents: agentsRef.current || [],
          startingCash:   startCashRef.current || 10000,
        }));
        // Keep-alive ping
        pingTimer.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            pingSent.current = Date.now();
            socket.send(JSON.stringify({ type: 'PING' }));
          }
        }, 20000);
      };

      socket.onmessage = e => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        if (msg.type === 'STATE')        setGameState(msg.payload);
        if (msg.type === 'TICK')         setGameState(msg.payload);
        if (msg.type === 'TRADE_RESULT') setTradeResult({ ...msg.payload, _ts: Date.now() });
        if (msg.type === 'GAME_OVER')  { setGameState(msg.payload); onGameOverRef.current?.(msg.payload); }
        if (msg.type === 'PONG' && pingSent.current) setLatency(Date.now() - pingSent.current);
      };

      socket.onclose = () => {
        setConnected(false);
        clearInterval(pingTimer.current);
        const delay = Math.min(1000 * 2 ** retries.current, 12000);
        retries.current++;
        retryTimer.current = setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();

    } catch (err) {
      console.error('[WS] connect error:', err);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryTimer.current);
      clearInterval(pingTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const sendBuy  = useCallback((ticker, shares) => {
    if (ws.current?.readyState === WebSocket.OPEN)
      ws.current.send(JSON.stringify({ type: 'BUY', ticker, shares: parseInt(shares, 10) }));
  }, []);

  const sendSell = useCallback((ticker, shares) => {
    if (ws.current?.readyState === WebSocket.OPEN)
      ws.current.send(JSON.stringify({ type: 'SELL', ticker, shares: parseInt(shares, 10) }));
  }, []);

  return { connected, gameState, tradeResult, latency, sendBuy, sendSell };
}