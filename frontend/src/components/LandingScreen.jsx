import { useState } from 'react';

const AGENTS = [
  {
    name:'MomentumBot', emoji:'📈',
    color:'#7BBDE8', colorSoft:'rgba(123,189,232,.15)', colorBorder:'rgba(123,189,232,.35)',
    tag:'Trend Follower',
    desc:'Rides breakouts using RSI and moving-average crossovers. Goes all-in when momentum aligns.',
    strategy:[
      {icon:'📊',label:'RSI Signal',      detail:'Buys when RSI < 40 (oversold), sells when RSI > 65 (overbought)'},
      {icon:'📉',label:'MA Crossover',    detail:'Enters when MA5 crosses above MA20 — the golden cross'},
      {icon:'⚡',label:'Momentum Filter', detail:'Only trades when price momentum > 0.5% per tick'},
    ],
    lesson:'Learn RSI and moving averages — the foundation of technical analysis.',
    stats:{aggression:85,intelligence:70,speed:90,risk:75},
  },
  {
    name:'ValueBot', emoji:'🔍',
    color:'#4E8EA2', colorSoft:'rgba(78,142,162,.2)', colorBorder:'rgba(78,142,162,.4)',
    tag:'Value Investor',
    desc:'Hunts undervalued stocks trading below their 20-period moving average.',
    strategy:[
      {icon:'💎',label:'Mean Reversion', detail:'Buys when price drops >3% below MA20 (undervalued zone)'},
      {icon:'📐',label:'RSI Divergence', detail:'Confirms entry with RSI < 35 before buying'},
      {icon:'🎯',label:'Target Exit',    detail:'Sells when price recovers to MA20 (fair value)'},
    ],
    lesson:"Understand mean reversion — Warren Buffett's core principle.",
    stats:{aggression:38,intelligence:92,speed:32,risk:28},
  },
  {
    name:'RiskBot', emoji:'🛡️',
    color:'#6EA2B3', colorSoft:'rgba(110,162,179,.15)', colorBorder:'rgba(110,162,179,.35)',
    tag:'Risk Manager',
    desc:'Defensive strategy with hard stop-losses and volatility filters. Capital protection first.',
    strategy:[
      {icon:'🚨',label:'Stop Loss',       detail:'Auto-sells any position down more than 5% from purchase price'},
      {icon:'🌡️',label:'Volatility Gate', detail:'Refuses to trade when market volatility exceeds 3%'},
      {icon:'🔒',label:'Profit Lock',     detail:'Takes profit at +8% gain to avoid giving it back'},
    ],
    lesson:"Risk management beats stock-picking — the pro trader's real edge.",
    stats:{aggression:22,intelligence:80,speed:58,risk:8},
  },
  {
    name:'RandomBot', emoji:'🎲',
    color:'#BDD8E9', colorSoft:'rgba(189,216,233,.1)', colorBorder:'rgba(189,216,233,.28)',
    tag:'Chaos Trader',
    desc:'Pure Brownian motion. The baseline — can you beat complete randomness?',
    strategy:[
      {icon:'🎰',label:'Pure Random', detail:'50/50 chance of buying or selling any stock each tick'},
      {icon:'📏',label:'Random Size', detail:'Trade size 1–10 shares chosen randomly each time'},
      {icon:'❓',label:'No Logic',    detail:'Zero indicators — pure stochastic noise'},
    ],
    lesson:"If you can't beat RandomBot consistently, go back to basics.",
    stats:{aggression:100,intelligence:5,speed:100,risk:100},
  },
  {
    name:'RLBot', emoji:'🤖',
    color:'#49769F', colorSoft:'rgba(73,118,159,.2)', colorBorder:'rgba(73,118,159,.4)',
    tag:'Q-Learning AI',
    desc:'Reinforcement learning agent building a Q-table in real time. Gets sharper each tick.',
    strategy:[
      {icon:'🧠',label:'Q-Learning',      detail:'Builds a Q-table mapping (state, action) → expected reward'},
      {icon:'🎯',label:'ε-Greedy Policy', detail:'Explores random actions 15% of time, exploits best known otherwise'},
      {icon:'📈',label:'Reward Signal',   detail:'Reward = portfolio value change per tick (γ=0.95 discount)'},
    ],
    lesson:'See reinforcement learning in action — same tech behind AlphaGo.',
    stats:{aggression:65,intelligence:100,speed:68,risk:52},
  },
];

function StatBar({label,val,color}){
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
        <span style={{fontSize:11,color:'var(--t3)',fontWeight:500}}>{label}</span>
        <span style={{fontSize:11,fontFamily:'var(--fm)',color:'var(--t2)',fontWeight:600}}>{val}%</span>
      </div>
      <div style={{height:5,background:'rgba(0,29,57,.6)',borderRadius:4,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${val}%`,background:color,borderRadius:4,opacity:.85,transition:'width 1s ease'}}/>
      </div>
    </div>
  );
}

function AgentCard({agent,selected,onToggle}){
  const [expanded,setExpanded]=useState(false);
  const on=selected;
  return(
    <div style={{
      borderRadius:18,overflow:'hidden',
      background:on
        ?`linear-gradient(145deg,${agent.colorSoft},rgba(0,29,57,.75))`
        :'linear-gradient(145deg,rgba(10,65,116,.92),rgba(0,29,57,.88))',
      border:`1.5px solid ${on?agent.colorBorder:'rgba(123,189,232,.1)'}`,
      boxShadow:on?`0 6px 32px rgba(0,29,57,.6),inset 0 1px 0 ${agent.colorBorder}`:'0 2px 12px rgba(0,29,57,.4)',
      transition:'all .22s ease',
    }}>
      <div style={{padding:'18px 20px',display:'flex',alignItems:'center',gap:14,cursor:'pointer'}}
        onClick={()=>onToggle(agent.name)}>
        <div style={{width:48,height:48,borderRadius:14,fontSize:24,display:'flex',alignItems:'center',justifyContent:'center',background:on?agent.color:'rgba(73,118,159,.35)',flexShrink:0,transition:'all .22s'}}>{agent.emoji}</div>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontWeight:800,fontSize:16,color:on?agent.color:'var(--t1)',fontFamily:'var(--fd)'}}>{agent.name}</span>
            <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:on?agent.color:'rgba(73,118,159,.3)',color:on?'#001D39':'var(--t3)',letterSpacing:'.04em'}}>{agent.tag}</span>
          </div>
          <p style={{fontSize:12,color:'var(--t3)',lineHeight:1.55}}>{agent.desc}</p>
        </div>
        <div style={{width:26,height:26,borderRadius:9,flexShrink:0,border:`2px solid ${on?agent.color:'rgba(123,189,232,.2)'}`,background:on?agent.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>
          {on&&<span style={{color:'#001D39',fontSize:14,fontWeight:900,lineHeight:1}}>✓</span>}
        </div>
      </div>

      <div style={{padding:'0 20px 16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 20px'}}>
        <StatBar label="Aggression"   val={agent.stats.aggression}   color={agent.color}/>
        <StatBar label="Intelligence" val={agent.stats.intelligence} color={agent.color}/>
        <StatBar label="Speed"        val={agent.stats.speed}        color={agent.color}/>
        <StatBar label="Risk Level"   val={agent.stats.risk}         color={agent.color}/>
      </div>

      <div style={{borderTop:'1px solid rgba(123,189,232,.08)'}}>
        <button onClick={()=>setExpanded(e=>!e)} style={{width:'100%',padding:'11px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'transparent',color:'var(--t3)',fontSize:12,fontWeight:600,letterSpacing:'.02em'}}>
          <span>🎓 Strategy Details & Learning Goal</span>
          <span style={{fontSize:10,transition:'transform .2s',transform:expanded?'rotate(180deg)':'none',color:'var(--steel)'}}>▼</span>
        </button>
        {expanded&&(
          <div style={{padding:'0 20px 18px',display:'flex',flexDirection:'column',gap:9,animation:'fadeUp .2s ease'}}>
            {agent.strategy.map((s,i)=>(
              <div key={i} style={{padding:'11px 14px',borderRadius:12,background:'rgba(0,29,57,.5)',border:'1px solid rgba(123,189,232,.1)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                  <span style={{fontSize:14}}>{s.icon}</span>
                  <span style={{fontWeight:700,fontSize:12,color:agent.color}}>{s.label}</span>
                </div>
                <p style={{fontSize:11,color:'var(--t3)',lineHeight:1.55}}>{s.detail}</p>
              </div>
            ))}
            <div style={{padding:'11px 14px',borderRadius:12,background:`linear-gradient(135deg,${agent.colorSoft},rgba(0,29,57,.3))`,border:`1px solid ${agent.colorBorder}`}}>
              <span style={{fontSize:11,color:'var(--t2)',lineHeight:1.6}}>💡 <strong style={{color:agent.color}}>Learn:</strong> {agent.lesson}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

export default function LandingScreen({onStart}){
  const [sel,setSel]=useState(new Set(['MomentumBot','ValueBot','RiskBot','RandomBot','RLBot']));
  const [cash,setCash]=useState(10000);
  const [loading,setLoading]=useState(false);
  const [cd,setCd]=useState(null);

  const toggle=name=>setSel(prev=>{
    const n=new Set(prev);
    if(n.has(name)&&n.size===1)return n;
    n.has(name)?n.delete(name):n.add(name);
    return n;
  });

  const handleStart=async()=>{
    if(!sel.size)return;
    setLoading(true);
    for(let i=3;i>0;i--){setCd(i);await sleep(700);}
    setCd('GO!');await sleep(420);
    onStart([...sel],cash);
  };

  return(
    <div style={{minHeight:'100vh',overflowY:'auto',background:'var(--bg)'}}>

      {cd&&(
        <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,29,57,.96)',backdropFilter:'blur(16px)'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--fd)',fontSize:130,fontWeight:900,color:cd==='GO!'?'var(--g)':'var(--sky)',lineHeight:1,textShadow:'0 0 80px currentColor'}}>{cd}</div>
            <div style={{marginTop:16,fontSize:13,fontWeight:600,color:'var(--t4)',letterSpacing:'.35em',textTransform:'uppercase'}}>{cd==='GO!'?'Entering Arena':'Prepare Yourself'}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{background:'rgba(0,29,57,.92)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(123,189,232,.1)',padding:'14px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--sky),var(--teal))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 14px rgba(123,189,232,.3)'}}>⚔️</div>
          <div>
            <div style={{fontFamily:'var(--fd)',fontSize:14,fontWeight:900,color:'var(--t1)',letterSpacing:'.05em'}}>AI MARKET ARENA</div>
            <div style={{fontSize:10,color:'var(--t4)',fontWeight:500}}>Practice Trading Platform</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,color:'var(--t4)',fontWeight:500}}>Free · No login</span>
          <div style={{width:8,height:8,borderRadius:'50%',background:'var(--g)',animation:'pulse 2s infinite',boxShadow:'0 0 10px var(--g)'}}/>
        </div>
      </nav>

      <div style={{maxWidth:1020,margin:'0 auto',padding:'40px 24px 60px'}}>

        {/* Hero */}
        <div style={{textAlign:'center',marginBottom:44}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(123,189,232,.1)',border:'1px solid rgba(123,189,232,.2)',borderRadius:24,padding:'7px 18px',marginBottom:20}}>
            <span style={{fontSize:13}}>🎓</span>
            <span style={{fontSize:12,fontWeight:600,color:'var(--sky)'}}>Learn by competing against real ML strategies</span>
          </div>
          <h1 style={{fontSize:'clamp(30px,5.5vw,60px)',fontWeight:900,fontFamily:'var(--fd)',color:'var(--t1)',lineHeight:1.1,marginBottom:14,letterSpacing:'-.01em'}}>
            Trade Against<br/>
            <span style={{background:'linear-gradient(135deg,var(--sky),var(--teal),var(--g))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>5 AI Bots</span>
          </h1>
          <p style={{fontSize:15,color:'var(--t3)',maxWidth:500,margin:'0 auto',lineHeight:1.7,fontWeight:400}}>
            Practice stock trading with real ML strategies. Each bot reveals exactly what signals it uses — master technical analysis through competition.
          </p>
        </div>

        {/* Pills */}
        <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:44,flexWrap:'wrap'}}>
          {[{icon:'📊',label:'8 NASDAQ Stocks'},{icon:'⏱️',label:'200 Ticks / Game'},{icon:'🧠',label:'5 ML Strategies'},{icon:'📈',label:'Candlestick Charts'}].map(p=>(
            <div key={p.label} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 18px',background:'rgba(10,65,116,.7)',borderRadius:24,border:'1px solid rgba(123,189,232,.15)',boxShadow:'0 2px 10px rgba(0,29,57,.4)'}}>
              <span style={{fontSize:14}}>{p.icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:'var(--t2)'}}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 310px',gap:22,alignItems:'start'}}>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h2 style={{fontSize:18,fontWeight:800,color:'var(--t1)',fontFamily:'var(--fd)'}}>Choose Opponents</h2>
              <span style={{fontSize:12,color:'var(--t4)',fontWeight:500}}>{sel.size} / {AGENTS.length} selected</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {AGENTS.map(a=><AgentCard key={a.name} agent={a} selected={sel.has(a.name)} onToggle={toggle}/>)}
            </div>
          </div>

          {/* Config panel */}
          <div style={{position:'sticky',top:78}}>
            <div style={{borderRadius:20,overflow:'hidden',background:'linear-gradient(160deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',border:'1px solid rgba(123,189,232,.15)',boxShadow:'0 8px 40px rgba(0,29,57,.7)'}}>
              <div style={{padding:'20px 22px',borderBottom:'1px solid rgba(123,189,232,.08)'}}>
                <div style={{fontFamily:'var(--fd)',fontSize:13,fontWeight:800,color:'var(--t1)',letterSpacing:'.06em'}}>⚙️ BATTLE CONFIG</div>
              </div>
              <div style={{padding:'20px 22px 0'}}>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--t4)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Starting Capital</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                    {[5000,10000,25000,50000].map(v=>(
                      <button key={v} onClick={()=>setCash(v)} style={{padding:'11px 4px',borderRadius:12,fontSize:14,fontWeight:700,fontFamily:'var(--fm)',background:cash===v?'linear-gradient(135deg,var(--sky),var(--teal))':'rgba(0,29,57,.6)',color:cash===v?'#001D39':'var(--t3)',border:cash===v?'2px solid var(--sky)':'2px solid rgba(123,189,232,.1)',boxShadow:cash===v?'0 4px 16px rgba(123,189,232,.3)':'none',transition:'all .18s'}}>
                        ${v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--t4)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Opponents ({sel.size})</div>
                  <div style={{display:'flex',flexDirection:'column',gap:7}}>
                    {AGENTS.filter(a=>sel.has(a.name)).map(a=>(
                      <div key={a.name} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 13px',background:`linear-gradient(135deg,${a.colorSoft},rgba(0,29,57,.3))`,borderRadius:11,border:`1px solid ${a.colorBorder}`}}>
                        <span style={{fontSize:16}}>{a.emoji}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:700,color:a.color}}>{a.name}</div>
                          <div style={{fontSize:10,color:'var(--t4)'}}>{a.tag}</div>
                        </div>
                        <button onClick={()=>toggle(a.name)} style={{fontSize:15,color:'var(--t4)',padding:'0 4px',lineHeight:1}}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{padding:'0 22px 22px'}}>
                <button onClick={handleStart} disabled={loading||!sel.size} style={{width:'100%',padding:'17px',background:loading?'rgba(0,29,57,.6)':'linear-gradient(135deg,var(--sky),var(--teal))',color:loading?'var(--t4)':'#001D39',border:'none',borderRadius:14,fontSize:15,fontWeight:800,fontFamily:'var(--fd)',letterSpacing:'.04em',boxShadow:loading?'none':'0 6px 24px rgba(123,189,232,.4)',cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all .2s'}}>
                  {loading?<><span className="spinner" style={{width:18,height:18}}/> Initializing…</>:'⚔️ Enter the Arena'}
                </button>
                <p style={{textAlign:'center',fontSize:11,color:'var(--t4)',marginTop:11,lineHeight:1.7}}>Real-time simulation · See bot strategies live</p>
              </div>
            </div>
            <div style={{marginTop:14,padding:'16px 18px',background:'linear-gradient(135deg,rgba(73,118,159,.3),rgba(78,142,162,.2))',borderRadius:16,border:'1px solid rgba(110,162,179,.25)'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--mist)',marginBottom:7}}>🎓 Pro Tip</div>
              <p style={{fontSize:11,color:'var(--t3)',lineHeight:1.65}}>During the match, tap any bot in the <strong style={{color:'var(--sky)'}}>Strategy Panel</strong> to see its exact decision rules in real time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}