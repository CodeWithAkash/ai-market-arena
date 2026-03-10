import { useState, useCallback } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import ParticleField from './ParticleField';
import StockPanel from './StockPanel';
import TradePanel from './TradePanel';
import { LeaderboardPanel, EventFeed, TradeFeed } from './Panels';
import GameOverScreen from './GameOverScreen';

function HUD({ tick, maxTicks, pv, start, connected, latency, onPause, paused }) {
  const progress = maxTicks > 0 ? (tick / maxTicks) * 100 : 0;
  const pnl = pv - start;
  const pct = start > 0 ? (pnl / start) * 100 : 0;
  const up  = pnl >= 0;
  const hot = progress > 75;

  return (
    <div style={{
      padding: '7px 16px', background: 'rgba(1,2,8,.97)',
      borderBottom: '1px solid rgba(0,212,255,.22)',
      display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, zIndex: 100,
    }}>
      <span style={{
        fontFamily: 'var(--fd)', fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap',
        background: 'linear-gradient(135deg,#00d4ff,#00ff88)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        AI MARKET ARENA
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? 'var(--g)' : 'var(--pink)',
          boxShadow: `0 0 10px ${connected ? 'var(--g)' : 'var(--pink)'}`,
          animation: 'pulse 1.8s infinite',
        }} />
        <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: connected ? 'var(--g)' : 'var(--pink)' }}>
          {connected ? (latency ? `LIVE · ${latency}ms` : 'LIVE') : 'RECONNECTING…'}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 8, color: 'var(--t3)' }}>TICK {tick}/{maxTicks}</span>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 8, color: hot ? 'var(--ora)' : 'var(--t3)' }}>
            {Math.max(0, 100 - progress).toFixed(0)}% REMAINING
          </span>
        </div>
        <div style={{ height: 5, background: 'rgba(0,212,255,.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: hot ? 'linear-gradient(90deg,#ff8800,#ff0088)' : 'linear-gradient(90deg,#00d4ff,#00ff88)',
            borderRadius: 3, transition: 'width .6s ease',
          }} />
        </div>
      </div>

      <button onClick={onPause} style={{
        padding: '4px 12px', fontFamily: 'var(--fm)', fontSize: 10,
        background: 'rgba(255,215,0,.1)', border: '1px solid rgba(255,215,0,.4)',
        borderRadius: 5, color: 'var(--gold)',
      }}>
        {paused ? '▶ RESUME' : '⏸ PAUSE'}
      </button>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--fd)', fontSize: 17, fontWeight: 700,
          color: up ? 'var(--g)' : 'var(--pink)',
          textShadow: `0 0 14px ${up ? 'var(--g)' : 'var(--pink)'}`,
        }}>
          ${pv?.toLocaleString('en', { maximumFractionDigits: 0 })}
        </div>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 9, color: up ? 'var(--g)' : 'var(--pink)' }}>
          {up ? '+' : ''}{pct.toFixed(2)}% | {up ? '▲' : '▼'} ${Math.abs(pnl).toFixed(0)}
        </div>
      </div>
    </div>
  );
}

export default function ArenaScreen({ selectedAgents, startingCash = 10000, onExit }) {
  const [selected,   setSelected]   = useState('AAPL');
  const [gameOver,   setGameOver]   = useState(false);
  const [finalState, setFinalState] = useState(null);
  const [paused,     setPaused]     = useState(false);

  const { connected, gameState, tradeResult, latency, sendBuy, sendSell } = useGameSocket({
    selectedAgents,
    startingCash,
    onGameOver: s => { setFinalState(s); setGameOver(true); },
  });

  const handleBuy  = useCallback((ticker, shares) => {
    if (typeof sendBuy === 'function') sendBuy(ticker, shares);
  }, [sendBuy]);

  const handleSell = useCallback((ticker, shares) => {
    if (typeof sendSell === 'function') sendSell(ticker, shares);
  }, [sendSell]);

  if (gameOver && finalState) {
    return <GameOverScreen gameState={finalState} onPlayAgain={onExit} />;
  }

  if (!gameState) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg0)', flexDirection: 'column', gap: 16,
      }}>
        <div className="spinner" style={{ width: 44, height: 44 }} />
        <div style={{ fontFamily: 'var(--fd)', color: 'var(--c)', fontSize: 13, letterSpacing: '.2em' }}>
          {connected ? 'INITIALIZING MARKET…' : 'CONNECTING TO ARENA…'}
        </div>
        <div style={{ fontFamily: 'var(--fm)', color: 'var(--t3)', fontSize: 10 }}>
          {connected
            ? 'Server connected — waiting for game state'
            : 'Establishing WebSocket… (may take 10–15s on first load)'}
        </div>
        {!connected && (
          <div style={{
            marginTop: 8, padding: '8px 18px',
            background: 'rgba(255,215,0,.08)', border: '1px solid rgba(255,215,0,.3)',
            borderRadius: 8, fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--gold)',
            textAlign: 'center',
          }}>
            ⚡ Render free tier may take 20–30s to wake up on first visit
          </div>
        )}
      </div>
    );
  }

  const {
    marketData = {}, leaderboard = [], player = {},
    tradeFeed = [], eventLog = [], tick = 0, maxTicks = 200,
  } = gameState;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg0)', overflow: 'hidden',
    }}>
      <ParticleField count={40} />

      <HUD
        tick={tick} maxTicks={maxTicks}
        pv={player.totalValue || startingCash} start={startingCash}
        connected={connected} latency={latency}
        paused={paused} onPause={() => setPaused(p => !p)}
      />

      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '248px 1fr 272px',
        gap: 8, padding: 8, overflow: 'hidden',
        position: 'relative', zIndex: 10,
      }}>

        {/* LEFT — stock list */}
        <StockPanel
          marketData={marketData}
          selected={selected}
          onSelect={setSelected}
          portfolio={player.portfolio || {}}
        />

        {/* CENTER — trade panel + feeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <TradePanel
            ticker={selected}
            marketData={marketData}
            player={player}
            onBuy={handleBuy}
            onSell={handleSell}
            tradeResult={tradeResult}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>
            <EventFeed events={eventLog} />
            <TradeFeed trades={tradeFeed} />
          </div>
        </div>

        {/* RIGHT — leaderboard + portfolio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <LeaderboardPanel leaderboard={leaderboard} startingCash={startingCash} />

          <div className="glass" style={{
            borderRadius: 10, border: '1px solid rgba(0,255,136,.2)',
            overflow: 'hidden', flex: 1, minHeight: 0,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '9px 13px', borderBottom: '1px solid rgba(0,255,136,.14)',
              display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0,
            }}>
              <span>💼</span>
              <span style={{ fontFamily: 'var(--fd)', fontSize: 10, letterSpacing: '.2em', color: 'var(--g)' }}>
                YOUR PORTFOLIO
              </span>
            </div>

            <div className="scroll" style={{ flex: 1 }}>
              <div style={{
                padding: '7px 13px', display: 'flex', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(0,212,255,.07)',
              }}>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--t3)' }}>CASH</span>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--c)' }}>
                  ${(player.cash || 0).toFixed(2)}
                </span>
              </div>

              {Object.keys(player.portfolio || {}).length === 0 ? (
                <div style={{
                  padding: 20, textAlign: 'center',
                  fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--t3)', lineHeight: 1.8,
                }}>
                  No positions held.<br />
                  <span style={{ color: 'rgba(0,212,255,.35)' }}>Select a stock → BUY</span>
                </div>
              ) : (
                Object.entries(player.portfolio).map(([tk, pos]) => {
                  const price = marketData[tk]?.price || 0;
                  const pct   = pos.avgCost > 0 ? ((price - pos.avgCost) / pos.avgCost) * 100 : 0;
                  return (
                    <div key={tk} onClick={() => setSelected(tk)} style={{
                      padding: '7px 13px',
                      borderBottom: '1px solid rgba(0,212,255,.04)',
                      cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--fd)', fontSize: 11, fontWeight: 700, color: 'var(--t1)' }}>{tk}</span>
                        <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--t1)' }}>
                          ${(pos.shares * price).toFixed(0)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--t3)' }}>
                          {pos.shares} @ ${pos.avgCost?.toFixed(2)}
                        </span>
                        <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: pct >= 0 ? 'var(--g)' : 'var(--pink)' }}>
                          {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
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