import { useState, useEffect } from 'react';
import ParticleField from './ParticleField';

const AGENTS = [
  {
    name: 'MomentumBot', color: '#00ff88', emoji: '📈',
    personality: 'Trend Following',
    desc: 'Rides market waves using RSI + moving-average crossovers. Aggressive on breakouts.',
    strategy: 'MA crossover + momentum signal',
    stats: { aggression:85, intelligence:70, speed:90, risk:75 },
  },
  {
    name: 'ValueBot', color: '#4488ff', emoji: '🔍',
    personality: 'Value Investing',
    desc: 'Hunts undervalued stocks via RSI divergence and deviation from fair value.',
    strategy: 'RSI + 20-period MA regression',
    stats: { aggression:38, intelligence:92, speed:32, risk:28 },
  },
  {
    name: 'RiskBot', color: '#ff8800', emoji: '🛡️',
    personality: 'Risk Averse',
    desc: 'Defensive model with hard stop-losses, volatility filters, and profit-lock mechanisms.',
    strategy: 'Stop-loss + volatility gating',
    stats: { aggression:22, intelligence:80, speed:58, risk:8 },
  },
  {
    name: 'RandomBot', color: '#ff0088', emoji: '🎲',
    personality: 'Chaos Theory',
    desc: 'Pure Brownian motion YOLO. Totally unpredictable — sometimes brilliant, usually chaotic.',
    strategy: 'Stochastic random walk',
    stats: { aggression:100, intelligence:5, speed:100, risk:100 },
  },
  {
    name: 'RLBot', color: '#cc44ff', emoji: '🤖',
    personality: 'Reinforcement Learning',
    desc: 'Q-Learning agent with ε-greedy policy that learns and improves each tick.',
    strategy: 'Q-table ε-greedy (γ=0.95)',
    stats: { aggression:65, intelligence:100, speed:68, risk:52 },
  },
];

function Bar({ label, val, col }) {
  return (
    <div style={{ marginBottom:5 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--t3)', marginBottom:2, fontFamily:'var(--fm)' }}>
        <span>{label}</span><span>{val}%</span>
      </div>
      <div style={{ height:3, background:'rgba(255,255,255,.07)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${val}%`, background:col, boxShadow:`0 0 8px ${col}`, borderRadius:2, transition:'width 1.2s ease' }} />
      </div>
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function LandingScreen({ onStart }) {
  const [sel,     setSel]     = useState(new Set(['MomentumBot','ValueBot','RiskBot','RandomBot','RLBot']));
  const [cash,    setCash]    = useState(10000);
  const [loading, setLoading] = useState(false);
  const [cd,      setCd]      = useState(null);
  const [glitch,  setGlitch]  = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > .88) { setGlitch(true); setTimeout(() => setGlitch(false), 180); }
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const toggle = name => setSel(prev => {
    const n = new Set(prev);
    if (n.has(name) && n.size === 1) return n;
    n.has(name) ? n.delete(name) : n.add(name);
    return n;
  });

  const handleStart = async () => {
    if (sel.size === 0) return;
    setLoading(true);
    for (let i = 3; i > 0; i--) { setCd(i); await sleep(650); }
    setCd('GO!'); await sleep(420);
    onStart([...sel], cash);
  };

  return (
    <div style={{
      width:'100vw', height:'100vh', overflow:'auto', position:'relative',
      background:'radial-gradient(ellipse at 20% 60%, rgba(0,40,80,.45) 0%, var(--bg0) 60%), radial-gradient(ellipse at 80% 15%, rgba(0,70,35,.3) 0%, transparent 55%)',
    }} className="scroll">
      <ParticleField count={65} />

      {cd && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(1,2,8,.85)', backdropFilter:'blur(6px)' }}>
          <span style={{ fontFamily:'var(--fd)', fontSize:130, fontWeight:900, color:cd==='GO!'?'var(--g)':'var(--c)', textShadow:`0 0 80px ${cd==='GO!'?'var(--g)':'var(--c)'}` }}>{cd}</span>
        </div>
      )}

      <div style={{ padding:'10px 28px', borderBottom:'1px solid rgba(0,212,255,.12)', display:'flex', justifyContent:'space-between', position:'relative', zIndex:10, background:'rgba(1,2,8,.6)' }}>
        <span style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--c)' }}>SYS:ARENA_v3.0 · STATUS:ONLINE · NO LOGIN REQUIRED</span>
        <span style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--g)' }}>{new Date().toLocaleTimeString()} · NASDAQ SIM</span>
      </div>

      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 28px 40px', position:'relative', zIndex:10 }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <h1 style={{
            fontFamily:'var(--fd)', fontWeight:900,
            fontSize:'clamp(34px,5vw,76px)', letterSpacing:'.08em',
            background:'linear-gradient(135deg,#00d4ff 0%,#00ff88 50%,#ffd700 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            filter:'drop-shadow(0 0 28px rgba(0,212,255,.5))',
            animation: glitch ? 'glitch .2s ease' : 'none',
            lineHeight:1.05,
          }}>AI MARKET ARENA</h1>
          <p style={{ fontFamily:'var(--fm)', color:'var(--t3)', fontSize:13, letterSpacing:'.28em', marginTop:8 }}>
            ⚔&nbsp; HUMAN VS ARTIFICIAL INTELLIGENCE &nbsp;⚔
          </p>
          <p style={{ color:'rgba(120,170,200,.55)', fontSize:12, marginTop:6 }}>
            Compete against 5 ML-powered trading agents in real-time simulated stock market · No login required
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, alignItems:'start' }}>

          <div>
            <div style={{ fontFamily:'var(--fd)', fontSize:12, letterSpacing:'.2em', color:'var(--c)', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
              ⚔ SELECT YOUR OPPONENTS
              <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t3)', fontWeight:'normal' }}>({sel.size} selected)</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
              {AGENTS.map(a => {
                const on = sel.has(a.name);
                return (
                  <div key={a.name} onClick={() => toggle(a.name)} className="glass"
                    style={{
                      padding:16, borderRadius:10, cursor:'pointer',
                      border:`1px solid ${on ? a.color : 'var(--border)'}`,
                      background: on ? `rgba(0,0,0,.07)` : 'var(--panel)',
                      boxShadow: on ? `0 0 22px ${a.color}22` : 'none',
                      transition:'all .22s ease', position:'relative', overflow:'hidden',
                    }}>
                    {on && <div style={{ position:'absolute', top:10, right:10, width:8, height:8, borderRadius:'50%', background:a.color, boxShadow:`0 0 10px ${a.color}`, animation:'pulse 2s infinite' }} />}
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:26 }}>{a.emoji}</span>
                      <div>
                        <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, color: on ? a.color : 'var(--t1)', textShadow: on ? `0 0 14px ${a.color}` : 'none' }}>{a.name}</div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>{a.strategy}</div>
                      </div>
                    </div>
                    <p style={{ fontSize:11, color:'rgba(160,200,220,.7)', marginBottom:12, lineHeight:1.5 }}>{a.desc}</p>
                    <Bar label="AGGRESSION"   val={a.stats.aggression}   col={a.color} />
                    <Bar label="INTELLIGENCE" val={a.stats.intelligence} col={a.color} />
                    <Bar label="SPEED"        val={a.stats.speed}        col={a.color} />
                    <Bar label="RISK"         val={a.stats.risk}         col={a.color} />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="glass" style={{ borderRadius:10, padding:22, border:'1px solid rgba(255,215,0,.25)' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:12, letterSpacing:'.2em', color:'var(--gold)', marginBottom:18 }}>⚙ BATTLE CONFIG</div>

              <div style={{ marginBottom:18 }}>
                <div style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t2)', marginBottom:8 }}>STARTING CAPITAL</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {[5000,10000,25000,50000].map(v => (
                    <button key={v} onClick={() => setCash(v)} style={{
                      padding:'8px 4px',
                      background: cash===v ? 'rgba(0,212,255,.18)' : 'rgba(4,14,32,.8)',
                      border:`1px solid ${cash===v ? 'var(--c)' : 'rgba(0,212,255,.18)'}`,
                      borderRadius:6, color: cash===v ? 'var(--c)' : 'var(--t3)',
                      fontFamily:'var(--fm)', fontSize:11, transition:'all .18s',
                    }}>
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t2)', marginBottom:8 }}>OPPONENTS ({sel.size})</div>
                {[...sel].map(n => {
                  const a = AGENTS.find(x => x.name === n);
                  return (
                    <div key={n} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:a.color, boxShadow:`0 0 6px ${a.color}`, flexShrink:0 }} />
                      <span style={{ fontFamily:'var(--fm)', fontSize:11, color:a.color }}>{a.emoji} {n}</span>
                    </div>
                  );
                })}
              </div>

              <button onClick={handleStart} disabled={loading || sel.size === 0} style={{
                width:'100%', padding:16,
                background: loading ? 'rgba(0,212,255,.06)' : 'linear-gradient(135deg,rgba(0,212,255,.2),rgba(0,255,136,.15))',
                border:`1px solid ${loading ? 'var(--border)' : 'var(--c)'}`,
                borderRadius:9, fontFamily:'var(--fd)', fontSize:15, fontWeight:700,
                letterSpacing:'.12em',
                color: loading ? 'var(--t3)' : 'var(--c)',
                boxShadow: loading ? 'none' : '0 0 28px rgba(0,212,255,.28)',
                transition:'all .25s',
              }}>
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                      <span className="spinner" style={{ width:16, height:16 }} /> INITIALIZING…
                    </span>
                  : '⚔ ENTER THE ARENA'}
              </button>

              <p style={{ textAlign:'center', fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)', marginTop:10, lineHeight:1.7 }}>
                No login · Free to play<br/>200 ticks · Real-time AI simulation
              </p>
            </div>

            <div className="glass" style={{ borderRadius:10, padding:16, border:'1px solid rgba(204,68,255,.2)' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:10, letterSpacing:'.15em', color:'var(--pur)', marginBottom:10 }}>🧠 ML STACK</div>
              {[
                ['MomentumBot','RSI + MA trend model'],
                ['ValueBot','Regression valuation'],
                ['RiskBot','Volatility hedge model'],
                ['RandomBot','Brownian motion'],
                ['RLBot','Q-Learning (ε-greedy)'],
              ].map(([n, s]) => {
                const a = AGENTS.find(x => x.name === n);
                return (
                  <div key={n} style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontFamily:'var(--fm)', fontSize:10, color:a.color }}>{a.emoji} {n}</span>
                    <span style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}