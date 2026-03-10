import { useState } from 'react';

const AGENTS = [
  {
    name: 'MomentumBot', emoji: '📈', color: '#00c96e', colorSoft: 'rgba(0,201,110,.1)', colorBorder: 'rgba(0,201,110,.25)',
    tag: 'Trend Follower',
    desc: 'Rides breakouts using RSI and moving-average crossovers. Goes all-in when momentum aligns.',
    strategy: [
      { icon: '📊', label: 'RSI Signal', detail: 'Buys when RSI < 40 (oversold), sells when RSI > 65 (overbought)' },
      { icon: '📉', label: 'MA Crossover', detail: 'Enters when MA5 crosses above MA20 (golden cross)' },
      { icon: '⚡', label: 'Momentum Filter', detail: 'Only trades when price momentum > 0.5% per tick' },
    ],
    lesson: 'Learn to read RSI and moving averages — the foundation of technical analysis.',
    stats: { aggression:85, intelligence:70, speed:90, risk:75 },
  },
  {
    name: 'ValueBot', emoji: '🔍', color: '#0aafe6', colorSoft: 'rgba(10,175,230,.1)', colorBorder: 'rgba(10,175,230,.25)',
    tag: 'Value Investor',
    desc: 'Hunts for undervalued stocks trading below their 20-period moving average.',
    strategy: [
      { icon: '💎', label: 'Mean Reversion', detail: 'Buys when price drops >3% below MA20 (undervalued zone)' },
      { icon: '📐', label: 'RSI Divergence', detail: 'Confirms with RSI < 35 before entering position' },
      { icon: '🎯', label: 'Target Exit', detail: 'Sells when price recovers to MA20 (fair value reached)' },
    ],
    lesson: "Understand how stocks revert to mean — Warren Buffett's core principle.",
    stats: { aggression:38, intelligence:92, speed:32, risk:28 },
  },
  {
    name: 'RiskBot', emoji: '🛡️', color: '#f5a623', colorSoft: 'rgba(245,166,35,.1)', colorBorder: 'rgba(245,166,35,.25)',
    tag: 'Risk Manager',
    desc: 'Defensive strategy with hard stop-losses and volatility filters. Protects capital above all.',
    strategy: [
      { icon: '🚨', label: 'Stop Loss', detail: 'Auto-sells any position that drops more than 5% from purchase' },
      { icon: '🌡️', label: 'Volatility Gate', detail: 'Refuses to trade when market volatility exceeds 3%' },
      { icon: '🔒', label: 'Profit Lock', detail: 'Takes profit at +8% gain to avoid giving it back' },
    ],
    lesson: "Learn why risk management beats picking winners — the pro trader's secret.",
    stats: { aggression:22, intelligence:80, speed:58, risk:8 },
  },
  {
    name: 'RandomBot', emoji: '🎲', color: '#f0436a', colorSoft: 'rgba(240,67,106,.1)', colorBorder: 'rgba(240,67,106,.25)',
    tag: 'Chaos Trader',
    desc: 'Completely random Brownian motion trades. The baseline — can you beat pure luck?',
    strategy: [
      { icon: '🎰', label: 'Pure Random', detail: '50/50 chance of buying or selling any stock each tick' },
      { icon: '📏', label: 'Random Size', detail: 'Trade size between 1-10 shares chosen randomly' },
      { icon: '❓', label: 'No Logic', detail: 'No indicators, no analysis — pure stochastic noise' },
    ],
    lesson: "Understand market randomness — if you can't beat RandomBot, go back to basics.",
    stats: { aggression:100, intelligence:5, speed:100, risk:100 },
  },
  {
    name: 'RLBot', emoji: '🤖', color: '#9b6bff', colorSoft: 'rgba(155,107,255,.1)', colorBorder: 'rgba(155,107,255,.25)',
    tag: 'AI / Q-Learning',
    desc: 'Reinforcement learning agent that builds a Q-table during the game. Gets smarter each tick.',
    strategy: [
      { icon: '🧠', label: 'Q-Learning', detail: 'Maintains a Q-table mapping (state, action) → expected reward' },
      { icon: '🎯', label: 'ε-Greedy Policy', detail: 'Explores random actions 15% of the time, exploits best known action otherwise' },
      { icon: '📈', label: 'Reward Signal', detail: 'Reward = portfolio value change per tick (γ=0.95 discount factor)' },
    ],
    lesson: 'See how reinforcement learning works in practice — the same tech behind AlphaGo.',
    stats: { aggression:65, intelligence:100, speed:68, risk:52 },
  },
];

function StatBar({ label, val, color }) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:10, color:'var(--t3)', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:10, color:'var(--t2)', fontWeight:600 }}>{val}%</span>
      </div>
      <div style={{ height:4, background:'var(--surf3)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${val}%`, background:color, borderRadius:4, transition:'width 1s ease' }} />
      </div>
    </div>
  );
}

function AgentCard({ agent, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const on = selected;

  return (
    <div style={{
      borderRadius:16, overflow:'hidden',
      border: on ? `2px solid ${agent.color}` : '2px solid var(--card-border)',
      background: on ? agent.colorSoft : 'var(--surf0)',
      boxShadow: on
        ? `0 4px 24px ${agent.colorSoft}, 0 1px 4px rgba(0,0,0,.06)`
        : '0 2px 10px rgba(0,0,0,.05)',
      transition:'all .2s ease',
    }}>
      <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
        onClick={() => onToggle(agent.name)}>
        <div style={{
          width:44, height:44, borderRadius:12, fontSize:22,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: on ? agent.color : 'var(--surf2)',
          boxShadow: on ? `0 4px 12px ${agent.colorSoft}` : 'none',
          transition:'all .2s',
        }}>{agent.emoji}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <span style={{ fontWeight:700, fontSize:15, color: on ? agent.color : 'var(--t1)' }}>{agent.name}</span>
            <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background: on ? agent.color : 'var(--surf2)', color: on ? '#fff' : 'var(--t3)' }}>{agent.tag}</span>
          </div>
          <p style={{ fontSize:12, color:'var(--t3)', lineHeight:1.4 }}>{agent.desc}</p>
        </div>
        <div style={{
          width:24, height:24, borderRadius:8, flexShrink:0,
          border: on ? `2px solid ${agent.color}` : '2px solid var(--t4)',
          background: on ? agent.color : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .2s',
        }}>
          {on && <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>✓</span>}
        </div>
      </div>

      <div style={{ padding:'0 18px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px' }}>
        <StatBar label="Aggression"   val={agent.stats.aggression}   color={agent.color} />
        <StatBar label="Intelligence" val={agent.stats.intelligence} color={agent.color} />
        <StatBar label="Speed"        val={agent.stats.speed}        color={agent.color} />
        <StatBar label="Risk"         val={agent.stats.risk}         color={agent.color} />
      </div>

      <div style={{ borderTop:`1px solid ${on ? agent.colorBorder : 'var(--card-border)'}` }}>
        <button onClick={() => setExpanded(e => !e)} style={{
          width:'100%', padding:'10px 18px',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'transparent', color:'var(--t3)', fontSize:12, fontWeight:600,
        }}>
          <span>🎓 View Strategy Details</span>
          <span style={{ fontSize:10, transition:'transform .2s', transform: expanded?'rotate(180deg)':'none' }}>▼</span>
        </button>
        {expanded && (
          <div style={{ padding:'0 18px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {agent.strategy.map((s, i) => (
              <div key={i} style={{ padding:'10px 12px', background: on ? 'rgba(255,255,255,.5)' : 'var(--surf1)', borderRadius:10, border:`1px solid ${on ? agent.colorBorder : 'var(--card-border)'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                  <span>{s.icon}</span>
                  <span style={{ fontWeight:700, fontSize:12, color: on ? agent.color : 'var(--t1)' }}>{s.label}</span>
                </div>
                <p style={{ fontSize:11, color:'var(--t2)', lineHeight:1.5 }}>{s.detail}</p>
              </div>
            ))}
            <div style={{ padding:'10px 12px', background: on ? agent.colorSoft : 'var(--surf2)', borderRadius:10, border:`1px solid ${on ? agent.colorBorder : 'var(--card-border)'}` }}>
              <span style={{ fontSize:11, color:'var(--t2)' }}>💡 <strong>What you'll learn:</strong> {agent.lesson}</span>
            </div>
          </div>
        )}
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

  const toggle = name => setSel(prev => {
    const n = new Set(prev);
    if (n.has(name) && n.size === 1) return n;
    n.has(name) ? n.delete(name) : n.add(name);
    return n;
  });

  const handleStart = async () => {
    if (sel.size === 0) return;
    setLoading(true);
    for (let i = 3; i > 0; i--) { setCd(i); await sleep(700); }
    setCd('GO!'); await sleep(400);
    onStart([...sel], cash);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', overflowY:'auto' }}>

      {cd && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(13,17,23,.9)', backdropFilter:'blur(12px)' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:120, fontWeight:900, color: cd==='GO!'?'var(--g)':'var(--c)', textShadow:'0 0 60px currentColor', lineHeight:1 }}>{cd}</div>
            <div style={{ marginTop:16, fontFamily:'var(--fm)', fontSize:12, color:'rgba(255,255,255,.4)', letterSpacing:'.3em' }}>
              {cd==='GO!' ? 'ENTERING ARENA' : 'PREPARE YOURSELF'}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ background:'rgba(255,255,255,.88)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--card-border)', padding:'14px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--c),var(--g))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚔️</div>
          <div>
            <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:900, color:'var(--t1)' }}>AI MARKET ARENA</div>
            <div style={{ fontSize:10, color:'var(--t3)' }}>Practice Trading Platform</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--t3)' }}>Free to play · No login</span>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--g)', animation:'pulse 2s infinite', boxShadow:'0 0 8px var(--g)' }} />
        </div>
      </div>

      <div style={{ maxWidth:980, margin:'0 auto', padding:'36px 24px 48px' }}>

        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--c-soft)', border:'1px solid var(--c-border)', borderRadius:20, padding:'6px 16px', marginBottom:16 }}>
            <span style={{ fontSize:12 }}>🎓</span>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--c)' }}>Learn by competing against real ML strategies</span>
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:800, color:'var(--t1)', lineHeight:1.15, marginBottom:12 }}>
            Trade Against<br />
            <span style={{ background:'linear-gradient(135deg,var(--c),var(--g))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>5 AI Bots</span>
          </h1>
          <p style={{ fontSize:15, color:'var(--t2)', maxWidth:480, margin:'0 auto', lineHeight:1.6 }}>
            Practice stock trading with real ML strategies. Each bot shows you exactly what signals it uses — learn technical analysis through play.
          </p>
        </div>

        {/* Pills */}
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:36, flexWrap:'wrap' }}>
          {[
            { icon:'📊', label:'8 NASDAQ Stocks' },
            { icon:'⏱️', label:'200 Ticks / Game' },
            { icon:'🧠', label:'5 ML Strategies' },
            { icon:'📈', label:'Candlestick Charts' },
          ].map(p => (
            <div key={p.label} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', background:'var(--surf0)', borderRadius:20, border:'1px solid var(--card-border)', boxShadow:'var(--card-shadow)' }}>
              <span style={{ fontSize:14 }}>{p.icon}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--t2)' }}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>

          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'var(--t1)' }}>Choose Your Opponents</h2>
              <span style={{ fontSize:12, color:'var(--t3)' }}>{sel.size} of {AGENTS.length} selected</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {AGENTS.map(a => (
                <AgentCard key={a.name} agent={a} selected={sel.has(a.name)} onToggle={toggle} />
              ))}
            </div>
          </div>

          {/* Config panel */}
          <div style={{ position:'sticky', top:72 }}>
            <div style={{ background:'var(--surf0)', borderRadius:20, border:'1px solid var(--card-border)', boxShadow:'0 4px 24px rgba(0,0,0,.08)', overflow:'hidden' }}>
              <div style={{ padding:'20px 20px 0' }}>
                <h3 style={{ fontWeight:700, fontSize:15, color:'var(--t1)', marginBottom:16 }}>⚙️ Battle Config</h3>

                <div style={{ marginBottom:18 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--t3)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:10 }}>Starting Capital</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    {[5000,10000,25000,50000].map(v => (
                      <button key={v} onClick={() => setCash(v)} style={{
                        padding:'10px 4px', borderRadius:10, fontSize:13, fontWeight:700,
                        background: cash===v ? 'var(--c)' : 'var(--surf1)',
                        color: cash===v ? '#fff' : 'var(--t2)',
                        border: cash===v ? '2px solid var(--c)' : '2px solid transparent',
                        boxShadow: cash===v ? '0 4px 14px rgba(10,175,230,.3)' : 'none',
                        transition:'all .18s',
                      }}>${v.toLocaleString()}</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:18 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--t3)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:10 }}>Opponents ({sel.size})</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {AGENTS.filter(a => sel.has(a.name)).map(a => (
                      <div key={a.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:a.colorSoft, borderRadius:10, border:`1px solid ${a.colorBorder}` }}>
                        <span style={{ fontSize:16 }}>{a.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.name}</div>
                          <div style={{ fontSize:10, color:'var(--t3)' }}>{a.tag}</div>
                        </div>
                        <button onClick={() => toggle(a.name)} style={{ fontSize:14, color:'var(--t4)', padding:'0 4px', background:'transparent' }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding:'0 20px 20px' }}>
                <button onClick={handleStart} disabled={loading || sel.size === 0}
                  style={{
                    width:'100%', padding:'16px',
                    background: loading ? 'var(--surf2)' : 'linear-gradient(135deg,var(--c),#0082b8)',
                    color: loading ? 'var(--t3)' : '#fff',
                    border:'none', borderRadius:12, fontSize:15, fontWeight:700,
                    boxShadow: loading ? 'none' : '0 6px 20px rgba(10,175,230,.4)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    transition:'all .2s',
                  }}>
                  {loading
                    ? <><span className="spinner" style={{ width:18, height:18 }} /> Initializing…</>
                    : '⚔️ Enter the Arena'}
                </button>
                <p style={{ textAlign:'center', fontSize:11, color:'var(--t3)', marginTop:10, lineHeight:1.6 }}>
                  Real-time simulation · See bot strategies after the match
                </p>
              </div>
            </div>

            <div style={{ marginTop:14, padding:'14px 16px', background:'linear-gradient(135deg,rgba(155,107,255,.08),rgba(10,175,230,.08))', borderRadius:14, border:'1px solid rgba(155,107,255,.2)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--pur)', marginBottom:6 }}>🎓 Pro Tip</div>
              <p style={{ fontSize:11, color:'var(--t2)', lineHeight:1.6 }}>
                After each game, review the <strong>Bot Strategy Panel</strong> in the arena to see exactly what signals each bot acted on.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}