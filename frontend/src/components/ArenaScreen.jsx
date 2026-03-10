import { useState, useCallback } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import StockPanel from './StockPanel';
import TradePanel from './TradePanel';
import { LeaderboardPanel, EventFeed, TradeFeed } from './Panels';
import GameOverScreen from './GameOverScreen';

function HUD({ tick, maxTicks, pv, start, connected, latency }) {
  const progress = maxTicks > 0 ? (tick / maxTicks) * 100 : 0;
  const pnl = pv - start;
  const pct = start > 0 ? (pnl / start) * 100 : 0;
  const up  = pnl >= 0;
  const hot = progress > 75;

  return (
    <div style={{
      position:'sticky', top:0, zIndex:200,
      padding:'10px 20px',
      background:'rgba(13,17,23,.97)',
      backdropFilter:'blur(20px)',
      borderBottom:'1px solid rgba(255,255,255,.07)',
      display:'flex', alignItems:'center', gap:16, flexShrink:0,
    }}>
      <div style={{ fontFamily:'var(--fd)', fontSize:12, fontWeight:900, whiteSpace:'nowrap', background:'linear-gradient(135deg,#0aafe6,#00c96e)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
        AI MARKET ARENA
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background: connected?'var(--g)':'var(--pink)', boxShadow:`0 0 8px ${connected?'var(--g)':'var(--pink)'}`, animation:'pulse 2s infinite' }} />
        <span style={{ fontFamily:'var(--fm)', fontSize:9, color: connected?'var(--g)':'var(--pink)' }}>
          {connected ? (latency ? `${latency}ms` : 'LIVE') : 'RECONNECTING'}
        </span>
      </div>

      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontFamily:'var(--fm)', fontSize:9, color:'rgba(255,255,255,.35)' }}>TICK {tick}/{maxTicks}</span>
          <span style={{ fontFamily:'var(--fm)', fontSize:9, color: hot?'var(--ora)':'rgba(255,255,255,.35)' }}>
            {(100-progress).toFixed(0)}% LEFT
          </span>
        </div>
        <div style={{ height:4, background:'rgba(255,255,255,.08)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, borderRadius:4, transition:'width .6s ease', background: hot?'linear-gradient(90deg,#ff7d3b,#f0436a)':'linear-gradient(90deg,#0aafe6,#00c96e)' }} />
        </div>
      </div>

      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:800, color: up?'#00c96e':'#f0436a', textShadow:`0 0 20px ${up?'rgba(0,201,110,.4)':'rgba(240,67,106,.4)'}` }}>
          ${pv?.toLocaleString('en', { maximumFractionDigits:0 })}
        </div>
        <div style={{ fontFamily:'var(--fm)', fontSize:9, color: up?'rgba(0,201,110,.8)':'rgba(240,67,106,.8)' }}>
          {up?'▲':'▼'} {Math.abs(pct).toFixed(2)}%&nbsp;&nbsp;{up?'+':'-'}${Math.abs(pnl).toFixed(0)}
        </div>
      </div>
    </div>
  );
}

const BOT_INFO = {
  MomentumBot: {
    emoji:'📈', color:'#00c96e',
    rules: [
      'BUY when RSI < 40 AND MA5 > MA20 (golden cross)',
      'SELL when RSI > 65 OR momentum turns negative',
      'Skip trade if volatility > 2%',
    ],
    tip: "Watch for RSI bouncing off 40 — that's its trigger.",
  },
  ValueBot: {
    emoji:'🔍', color:'#0aafe6',
    rules: [
      'BUY when price is >3% below MA20 AND RSI < 35',
      'SELL when price recovers to MA20 (fair value)',
      'Max position: 30% of portfolio per stock',
    ],
    tip: 'It hunts stocks that have dipped hard. RSI < 35 is key.',
  },
  RiskBot: {
    emoji:'🛡️', color:'#f5a623',
    rules: [
      'HARD stop-loss: sells if position down >5%',
      'Profit lock: takes profit at +8%',
      'Refuses all trades when volatility > 3%',
    ],
    tip: 'Notice how it avoids volatile ticks entirely.',
  },
  RandomBot: {
    emoji:'🎲', color:'#f0436a',
    rules: [
      '50% chance to BUY or SELL any stock each tick',
      'Random share size between 1–10',
      'No indicators used — pure noise',
    ],
    tip: "The baseline. If you can't beat this, revisit your strategy.",
  },
  RLBot: {
    emoji:'🤖', color:'#9b6bff',
    rules: [
      'Q-Learning: learns state→action→reward each tick',
      'ε=0.15 exploration rate (tries random 15% of time)',
      'Gets stronger as the game progresses',
    ],
    tip: "Watch it improve — early game it's random, late game it's sharp.",
  },
};

function BotStrategyPanel({ leaderboard, tradeFeed }) {
  const [activeBot, setActiveBot] = useState(null);
  const bots  = leaderboard.filter(e => !e.isPlayer);
  const info  = activeBot ? BOT_INFO[activeBot] : null;
  const botTrades = activeBot ? tradeFeed.filter(t => t.agent === activeBot).slice(0, 6) : [];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      <div style={{ background:'rgba(22,27,36,.95)', borderRadius:14, border:'1px solid rgba(255,255,255,.07)', overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:'.1em', textTransform:'uppercase' }}>🤖 Bot Strategies</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.25)', marginTop:2 }}>Tap a bot to see its logic live</div>
        </div>
        {bots.map(bot => {
          const bi = BOT_INFO[bot.name];
          const isActive = activeBot === bot.name;
          const up = (bot.changePercent || 0) >= 0;
          const rank = leaderboard.findIndex(e => e.name === bot.name) + 1;
          return (
            <div key={bot.name} onClick={() => setActiveBot(isActive ? null : bot.name)}
              style={{
                padding:'10px 14px', cursor:'pointer',
                background: isActive ? `${bi?.color}18` : 'transparent',
                borderLeft: isActive ? `3px solid ${bi?.color}` : '3px solid transparent',
                borderBottom:'1px solid rgba(255,255,255,.04)',
                display:'flex', alignItems:'center', gap:10, transition:'all .15s',
              }}>
              <span style={{ fontSize:18 }}>{bi?.emoji || '🤖'}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color: isActive ? bi?.color : 'rgba(255,255,255,.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bot.name}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,.3)' }}>Rank #{rank}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.8)' }}>${bot.value?.toLocaleString('en',{maximumFractionDigits:0})}</div>
                <div style={{ fontSize:9, color: up?'#00c96e':'#f0436a' }}>{up?'▲':'▼'}{Math.abs(bot.changePercent||0).toFixed(1)}%</div>
              </div>
              <span style={{ fontSize:9, color:'rgba(255,255,255,.2)', flexShrink:0 }}>{isActive?'▲':'▼'}</span>
            </div>
          );
        })}
      </div>

      {activeBot && info && (
        <div style={{ background:'rgba(22,27,36,.95)', borderRadius:14, border:`1px solid ${info.color}30`, overflow:'hidden', animation:'fadeUp .2s ease' }}>
          <div style={{ padding:'12px 14px', background:`${info.color}12`, borderBottom:`1px solid ${info.color}20`, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{info.emoji}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:info.color }}>{activeBot}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Decision Rules</div>
            </div>
          </div>
          <div style={{ padding:'12px 14px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:12 }}>
              {info.rules.map((r, i) => (
                <div key={i} style={{ display:'flex', gap:8 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:info.color, marginTop:2, flexShrink:0 }}>#{i+1}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,.6)', lineHeight:1.5 }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'9px 12px', background:'rgba(255,255,255,.04)', borderRadius:9, border:'1px solid rgba(255,255,255,.06)' }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,.4)' }}>💡 <span style={{ color:'rgba(255,255,255,.65)' }}>{info.tip}</span></span>
            </div>
          </div>
          {botTrades.length > 0 && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', padding:'10px 14px' }}>
              <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,.3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Recent Trades</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {botTrades.map((t, i) => {
                  const isBuy = t.type === 'BUY';
                  return (
                    <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background: isBuy?'rgba(0,201,110,.2)':'rgba(240,67,106,.2)', color: isBuy?'#00c96e':'#f0436a' }}>{t.type}</span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,.6)' }}>{t.shares}× {t.ticker}</span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginLeft:'auto' }}>${t.price?.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <LeaderboardPanel leaderboard={leaderboard} startingCash={10000} />
    </div>
  );
}

export default function ArenaScreen({ selectedAgents, startingCash = 10000, onExit }) {
  const [selected,   setSelected]   = useState('AAPL');
  const [gameOver,   setGameOver]   = useState(false);
  const [finalState, setFinalState] = useState(null);

  const { connected, gameState, tradeResult, latency, sendBuy, sendSell } = useGameSocket({
    selectedAgents, startingCash,
    onGameOver: s => { setFinalState(s); setGameOver(true); },
  });

  const handleBuy  = useCallback((ticker, shares) => { if (typeof sendBuy  === 'function') sendBuy(ticker, shares);  }, [sendBuy]);
  const handleSell = useCallback((ticker, shares) => { if (typeof sendSell === 'function') sendSell(ticker, shares); }, [sendSell]);

  if (gameOver && finalState) return <GameOverScreen gameState={finalState} onPlayAgain={onExit} />;

  if (!gameState) return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d1117', flexDirection:'column', gap:20 }}>
      <div className="spinner" style={{ width:48, height:48 }} />
      <div style={{ fontFamily:'var(--fd)', color:'var(--c)', fontSize:14, letterSpacing:'.2em' }}>
        {connected ? 'INITIALIZING MARKET…' : 'CONNECTING…'}
      </div>
      <div style={{ fontFamily:'var(--fm)', color:'rgba(255,255,255,.3)', fontSize:11 }}>
        {connected ? 'Waiting for first tick' : 'Establishing connection'}
      </div>
      {!connected && (
        <div style={{ padding:'10px 20px', background:'rgba(245,166,35,.08)', border:'1px solid rgba(245,166,35,.3)', borderRadius:10, fontSize:11, color:'var(--gold)', textAlign:'center', maxWidth:320 }}>
          ⚡ First visit? Render free tier wakes up in 20–30s
        </div>
      )}
    </div>
  );

  const { marketData={}, leaderboard=[], player={}, tradeFeed=[], eventLog=[], tick=0, maxTicks=200 } = gameState;

  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', overflowX:'hidden', overflowY:'auto', display:'flex', flexDirection:'column' }}>
      <HUD tick={tick} maxTicks={maxTicks} pv={player.totalValue||startingCash} start={startingCash} connected={connected} latency={latency} />

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'220px 1fr 280px', gap:10, padding:'10px 12px 20px', alignItems:'start' }}>

        {/* LEFT */}
        <div style={{ position:'sticky', top:58, maxHeight:'calc(100vh - 68px)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <StockPanel marketData={marketData} selected={selected} onSelect={setSelected} portfolio={player.portfolio||{}} />
        </div>

        {/* CENTER */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <TradePanel ticker={selected} marketData={marketData} player={player} onBuy={handleBuy} onSell={handleSell} tradeResult={tradeResult} />

          {/* Portfolio strip */}
          <div style={{ background:'rgba(22,27,36,.95)', borderRadius:14, border:'1px solid rgba(255,255,255,.07)', padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.6)' }}>💼 Your Portfolio</span>
              <span style={{ fontFamily:'var(--fm)', fontSize:12, color:'var(--c)' }}>Cash: ${(player.cash||0).toLocaleString('en',{maximumFractionDigits:0})}</span>
            </div>
            {Object.keys(player.portfolio||{}).length === 0 ? (
              <div style={{ fontSize:11, color:'rgba(255,255,255,.2)', textAlign:'center', padding:'6px 0' }}>No positions — buy a stock to start</div>
            ) : (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Object.entries(player.portfolio).map(([tk, pos]) => {
                  const price = marketData[tk]?.price || 0;
                  const pct   = pos.avgCost > 0 ? ((price - pos.avgCost) / pos.avgCost) * 100 : 0;
                  return (
                    <div key={tk} onClick={() => setSelected(tk)} style={{ padding:'8px 12px', borderRadius:10, cursor:'pointer', background: pct>=0?'rgba(0,201,110,.12)':'rgba(240,67,106,.12)', border:`1px solid ${pct>=0?'rgba(0,201,110,.3)':'rgba(240,67,106,.3)'}` }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.85)' }}>{tk}</div>
                      <div style={{ fontSize:10, color: pct>=0?'#00c96e':'#f0436a' }}>{pos.shares}sh · {pct>=0?'+':''}{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <EventFeed events={eventLog} />
            <TradeFeed trades={tradeFeed} />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ position:'sticky', top:58, maxHeight:'calc(100vh - 68px)', overflowY:'auto', display:'flex', flexDirection:'column' }} className="scroll">
          <BotStrategyPanel leaderboard={leaderboard} tradeFeed={tradeFeed} />
        </div>
      </div>
    </div>
  );
}