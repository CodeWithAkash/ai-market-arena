import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

export function useGameSocket(sessionId) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tradeResult, setTradeResult] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const reconnectTimer = useRef(null);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const connect = useCallback(() => {
    if (!sessionIdRef.current) return;
    
    try {
      ws.current = new WebSocket(WS_URL);
      
      ws.current.onopen = () => {
        setConnected(true);
        ws.current.send(JSON.stringify({ type: 'JOIN_SESSION', sessionId: sessionIdRef.current }));
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'GAME_STATE':
              setGameState(message.payload);
              break;
            case 'GAME_UPDATE':
              setLastUpdate(message.payload);
              setGameState(prev => prev ? { ...prev, ...message.payload } : message.payload);
              break;
            case 'TRADE_RESULT':
              setTradeResult({ ...message.payload, timestamp: Date.now() });
              break;
            case 'GAME_OVER':
              setGameOver(true);
              setGameState(message.payload);
              break;
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };
      
      ws.current.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 2 seconds
        reconnectTimer.current = setTimeout(() => {
          if (sessionIdRef.current) connect();
        }, 2000);
      };
      
      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.current?.close();
      };
    } catch (err) {
      console.error('WS connection failed:', err);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      connect();
    }
    
    return () => {
      clearTimeout(reconnectTimer.current);
      if (ws.current) {
        ws.current.send(JSON.stringify({ type: 'LEAVE_SESSION' }));
        ws.current.close();
      }
    };
  }, [sessionId, connect]);

  const sendTrade = useCallback((type, ticker, shares) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, ticker, shares }));
    }
  }, []);

  return { connected, gameState, lastUpdate, tradeResult, gameOver, sendTrade };
}
