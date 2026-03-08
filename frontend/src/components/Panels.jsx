import { useRef } from 'react';

const EMOJI = { YOU:'👤', MomentumBot:'📈', ValueBot:'🔍', RiskBot:'🛡️', RandomBot:'🎲', RLBot:'🤖' };
const COLORS = { YOU:'#ffffff', MomentumBot:'#00ff88', ValueBot:'#4488ff', RiskBot:'#ff8800', RandomBot:'#ff0088', RLBot:'#cc44ff' };

export function LeaderboardPanel({ leaderboard = [], startingCash = 10000 }) {
  const prev = useRef({});

  return (
    <div className="glass" style={{ borderRadius:10, border:'1px solid rgba(255,215,0,.25)', overflow:'hidden', flexShrink:0 }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,215,0,.15)', display:'flex', alignItems:'center', gap:8 }}>
        <span>🏆</span>
        <span style={{ fontFamily:'var(--fd)', fontSize:11, letterSpacing:'.2em', color:'var(--gold)' }}>BATTLE RANKINGS</span>
      </div>
      {leaderboard.map((e, i) => {
        const wasLower = prev.current[e.name] !== undefined && prev.current[e.name] < e.value;
        prev.current[e.name] = e.value;
        const pct  = e.changePercent || 0;
        const up   = pct >= 0;
        const rank = i + 1;
        return (
          <div key={e.name} style={{
            display:'flex', alignItems:'center', gap:9, padding:'9px 12px',
            background: e.isPlayer ? 'rgba(0,212,255,.07)' : 'transparent',
            border: e.isPlayer ? '1px solid rgba(0,212,255,.2)' : '1px solid transparent',
            borderBottom:'1px solid rgba(255,255,255,.03)',
            animation: wasLower ? 'fadeUp .3s ease' : 'none',
          }}>
            <div style={{
              width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius:6, fontFamily:'var(--fd)', fontSize: rank <= 3 ? 13 : 10,
              background: rank===1?'rgba(255,215,0,.18)':rank===2?'rgba(180,200,220,.12)':rank===3?'rgba(200,140,80,.12)':'rgba(50,70,90,.2)',
              border:`1px solid ${rank===1?'var(--gold)':rank===2?'#b0c8e0':rank===3?'#c88c50':'rgba(100,140,180,.25)'}`,
              color: rank===1?'var(--gold)':rank===2?'#b0c8e0':rank===3?'#c88c50':'var(--t3)',
              flexShrink:0,
            }}>
              {rank===1?'👑':rank===2?'🥈':rank===3?'🥉':`#${rank}`}
            </div>
            <span style={{ fontSize:15 }}>{EMOJI[e.name] || '🤖'}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:11, fontWeight:700, color: e.isPlayer?'var(--c)':e.color||'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {e.name}{e.isPlayer ? ' ← YOU' : ''}
              </div>
              <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>{e.personality}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontFamily:'var(--fm)', fontSize:12, fontWeight:700, color:'var(--t1)' }}>
                ${e.value?.toLocaleString('en', { maximumFractionDigits:0 })}
              </div>
              <div style={{ fontFamily:'var(--fm)', fontSize:9, color: up?'var(--g)':'var(--pink)' }}>
                {up?'▲':'▼'} {Math.abs(pct).toFixed(1)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EventFeed({ events = [] }) {
  return (
    <div className="glass" style={{ borderRadius:10, border:'1px solid rgba(255,215,0,.18)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'9px 13px', borderBottom:'1px solid rgba(255,215,0,.12)', display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
        <span style={{ fontSize:13 }}>⚡</span>
        <span style={{ fontFamily:'var(--fd)', fontSize:10, letterSpacing:'.2em', color:'var(--gold)' }}>MARKET EVENTS</span>
      </div>
      <div className="scroll" style={{ flex:1 }}>
        {events.length === 0
          ? <div style={{ padding:16, textAlign:'center', fontFamily:'var(--fm)', fontSize:10, color:'var(--t3)' }}>Markets calm… for now</div>
          : events.map((ev, i) => (
            <div key={ev.id || i} style={{
              padding:'8px 13px', borderBottom:'1px solid rgba(255,255,255,.03)',
              background: i===0 ? `rgba(${ev.type==='boom'?'0,255,136':ev.type==='crash'?'255,0,136':'255,215,0'},.05)` : 'transparent',
              animation: i===0 ? 'fadeUp .4s ease' : 'none',
            }}>
              <div style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t1)', lineHeight:1.4 }}>{ev.message}</div>
              <div style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--t3)', marginTop:2 }}>Tick {ev.tick}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export function TradeFeed({ trades = [] }) {
  return (
    <div className="glass" style={{ borderRadius:10, border:'1px solid rgba(0,212,255,.15)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'9px 13px', borderBottom:'1px solid rgba(0,212,255,.1)', display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
        <span style={{ fontSize:13 }}>🔄</span>
        <span style={{ fontFamily:'var(--fd)', fontSize:10, letterSpacing:'.2em', color:'var(--c)' }}>TRADE FEED</span>
      </div>
      <div className="scroll" style={{ flex:1 }}>
        {trades.length === 0
          ? <div style={{ padding:16, textAlign:'center', fontFamily:'var(--fm)', fontSize:10, color:'var(--t3)' }}>No trades yet…</div>
          : trades.map((t, i) => {
            const col = COLORS[t.agent] || '#aaa';
            const buy = t.type === 'BUY';
            return (
              <div key={`${t.timestamp}-${i}`} style={{
                padding:'6px 13px', borderBottom:'1px solid rgba(255,255,255,.02)',
                display:'flex', alignItems:'center', gap:8,
                background: i===0 ? 'rgba(0,212,255,.04)' : 'transparent',
                animation: i===0 ? 'slideL .3s ease' : 'none',
              }}>
                <span style={{ fontSize:11 }}>{EMOJI[t.agent] || '🤖'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontFamily:'var(--fm)', fontSize:9, color:col, fontWeight:700 }}>{t.agent}</span>
                    <span style={{
                      fontSize:8, padding:'1px 3px',
                      background: buy ? 'rgba(0,255,136,.15)' : 'rgba(255,0,136,.15)',
                      border:`1px solid ${buy ? 'rgba(0,255,136,.4)' : 'rgba(255,0,136,.4)'}`,
                      borderRadius:3, color: buy ? 'var(--g)' : 'var(--pink)',
                      fontFamily:'var(--fm)',
                    }}>{t.type}</span>
                    <span style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t1)' }}>{t.shares}× {t.ticker}</span>
                  </div>
                  {t.reason && (
                    <div style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--t3)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.reason}
                    </div>
                  )}
                </div>
                <span style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t2)', flexShrink:0 }}>${t.price?.toFixed(2)}</span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}