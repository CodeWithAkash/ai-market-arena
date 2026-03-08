import { useState, useEffect, useCallback } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import ParticleField from './ParticleField';
import LeaderboardPanel from './LeaderboardPanel';
import StockPanel from './StockPanel';
import TradePanel from './TradePanel';
import { EventFeed, TradeFeed } from './FeedPanels';
import GameOverScreen from './GameOverScreen';

function HUDBar({ tick, maxTicks, status, connected, playerValue, startingCash }) {
  const progress = (tick / maxTicks) * 100;
  const pnl = playerValue - startingCash;
  const pct = ((pnl) / startingCash) * 100;
  const isUp = pnl >= 0;

  return (
    <div style={{
      width: '100%', padding: '8px 16px',
      background: 'rgba(1,2,8,0.9)',
      borderBottom: '1px solid rgba(0,212,255,0.2)',
      display: 'flex', alignItems: 'center', gap: '16px',
      zIndex: 100, position: 'relative', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '13px', fontWeight: '900',
        background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '0.05em', whiteSpace: 'nowrap',
      }}>
        AI MARKET ARENA
      </div>

      {/* Connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: connected ? 'var(--neon-green)' : 'var(--neon-pink)',
          boxShadow: `0 0 8px ${connected ? 'var(--neon-green)' : 'var(--neon-pink)'}`,
          animation: 'pulse-neon 2s ease infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
          {connected ? 'LIVE' : 'RECONNECTING'}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
            TICK {tick}/{maxTicks}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
            {(100 - progress).toFixed(0)}% REMAINING
          </span>
        </div>
        <div style={{ height: '4px', background: 'rgba(0,212,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: progress > 75 ? 'linear-gradient(90deg, var(--neon-orange), var(--neon-pink))' : 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
            boxShadow: '0 0 10px rgba(0,212,255,0.5)',
            transition: 'width 0.5s ease, background 0.5s ease',
            borderRadius: '2px',
          }} />
        </div>
      </div>

      {/* Player P&L */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700',
          color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)',
          textShadow: `0 0 15px ${isUp ? 'var(--neon-green)' : 'var(--neon-pink)'}`,
        }}>
          ${playerValue?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)',
        }}>
          {isUp ? '+' : ''}{pct.toFixed(2)}% | {isUp ? '▲' : '▼'} ${Math.abs(pnl).toFixed(0)}
        </div>
      </div>
    </div>
  );
}

export default function ArenaScreen({ sessionId, initialState, onExit }) {
  const { connected, gameState, tradeResult, gameOver, sendTrade } = useGameSocket(sessionId);
  const [selectedStock, setSelectedStock] = useState(null);
  const [localTradeResult, setLocalTradeResult] = useState(null);

  const state = gameState || initialState;

  // Handle trade results
  useEffect(() => {
    if (tradeResult) {
      setLocalTradeResult(tradeResult);
    }
  }, [tradeResult]);

  const handleBuy = useCallback((ticker, shares) => {
    sendTrade('BUY', ticker, shares);
  }, [sendTrade]);

  const handleSell = useCallback((ticker, shares) => {
    sendTrade('SELL', ticker, shares);
  }, [sendTrade]);

  if (!state) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-deep)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', fontSize: '14px', letterSpacing: '0.2em' }}>
            INITIALIZING ARENA...
          </div>
        </div>
      </div>
    );
  }

  if (gameOver || state.status === 'ended') {
    return <GameOverScreen gameState={state} onPlayAgain={onExit} />;
  }

  const { marketData = {}, leaderboard = [], player = {}, recentTrades = [], eventLog = [], tick = 0, maxTicks = 200 } = state;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-deep)',
      overflow: 'hidden',
    }}>
      <ParticleField intensity={0.5} />
      
      {/* HUD Top Bar */}
      <HUDBar
        tick={tick}
        maxTicks={maxTicks}
        connected={connected}
        playerValue={player.totalValue || 10000}
        startingCash={10000}
        status={state.status}
      />

      {/* Main 3-column layout */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '260px 1fr 280px',
        gap: '8px', padding: '8px',
        overflow: 'hidden',
        position: 'relative', zIndex: 10,
      }}>
        
        {/* LEFT: Stock list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
          <StockPanel
            marketData={marketData}
            onSelectStock={setSelectedStock}
            selectedStock={selectedStock}
            playerPortfolio={player.portfolio}
          />
        </div>

        {/* CENTER: Trade panel + feeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
          <TradePanel
            selectedStock={selectedStock}
            marketData={marketData}
            playerData={player}
            onBuy={handleBuy}
            onSell={handleSell}
            tradeResult={localTradeResult}
          />
          
          {/* Bottom center: Event + Trade feeds */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1, overflow: 'hidden' }}>
            <EventFeed events={eventLog} />
            <TradeFeed trades={recentTrades} />
          </div>
        </div>

        {/* RIGHT: Leaderboard + Portfolio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
          <LeaderboardPanel leaderboard={leaderboard} startingCash={10000} />
          
          {/* Portfolio summary */}
          <div className="glass-panel" style={{
            borderRadius: '10px',
            border: '1px solid rgba(0,255,136,0.2)',
            overflow: 'hidden', flex: 1,
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(0,255,136,0.15)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>💼</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--neon-green)' }}>
                YOUR PORTFOLIO
              </span>
            </div>
            <div className="scrollable" style={{ maxHeight: '160px' }}>
              <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>CASH</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--neon-cyan)' }}>
                  ${player.cash?.toFixed(2)}
                </span>
              </div>
              {Object.keys(player.portfolio || {}).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  No positions held
                </div>
              ) : (
                Object.entries(player.portfolio || {}).map(([ticker, pos]) => {
                  const currentPrice = marketData[ticker]?.price || 0;
                  const value = pos.shares * currentPrice;
                  const pnl = (currentPrice - pos.avgCost) * pos.shares;
                  const pnlPct = ((currentPrice - pos.avgCost) / pos.avgCost) * 100;
                  const isUp = pnl >= 0;
                  
                  return (
                    <div key={ticker} style={{
                      padding: '8px 14px',
                      borderBottom: '1px solid rgba(0,212,255,0.05)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {ticker}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                          ${value.toFixed(0)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                          {pos.shares} @ ${pos.avgCost?.toFixed(2)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
                          {isUp ? '+' : ''}{pnlPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
