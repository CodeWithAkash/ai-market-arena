import { useRef } from 'react';

const EMOJI={YOU:'👤',MomentumBot:'📈',ValueBot:'🔍',RiskBot:'🛡️',RandomBot:'🎲',RLBot:'🤖'};
const AGENT_COLORS={MomentumBot:'#7BBDE8',ValueBot:'#4E8EA2',RiskBot:'#6EA2B3',RandomBot:'#BDD8E9',RLBot:'#49769F',YOU:'#3DE89A'};

export function LeaderboardPanel({ leaderboard=[], startingCash=10000 }) {
  const prev=useRef({});
  return(
    <div style={{background:'linear-gradient(160deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',border:'1px solid rgba(245,200,66,.2)',borderRadius:16,overflow:'hidden'}}>
      <div style={{padding:'13px 16px',borderBottom:'1px solid rgba(245,200,66,.12)',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:15}}>🏆</span>
        <span style={{fontFamily:'var(--fd)',fontSize:10,fontWeight:800,letterSpacing:'.12em',color:'var(--gold)',textTransform:'uppercase'}}>Battle Rankings</span>
      </div>
      {leaderboard.map((e,i)=>{
        const wasLower=prev.current[e.name]!==undefined&&prev.current[e.name]<e.value;
        prev.current[e.name]=e.value;
        const pct=e.changePercent||0;
        const up=pct>=0;
        const rank=i+1;
        const col=AGENT_COLORS[e.name]||'var(--t2)';
        return(
          <div key={e.name} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 14px',background:e.isPlayer?'rgba(61,232,154,.07)':'transparent',borderLeft:e.isPlayer?'3px solid var(--g)':'3px solid transparent',borderBottom:'1px solid rgba(123,189,232,.05)',animation:wasLower?'fadeUp .3s ease':'none'}}>
            <div style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,fontFamily:'var(--fd)',fontSize:rank<=3?13:10,flexShrink:0,background:rank===1?'rgba(245,200,66,.15)':rank===2?'rgba(189,216,233,.1)':rank===3?'rgba(110,162,179,.12)':'rgba(0,29,57,.5)',border:`1px solid ${rank===1?'var(--gold)':rank===2?'#BDD8E9':rank===3?'#6EA2B3':'rgba(123,189,232,.15)'}`,color:rank===1?'var(--gold)':rank===2?'#BDD8E9':rank===3?'#6EA2B3':'var(--t4)'}}>
              {rank===1?'👑':rank===2?'🥈':rank===3?'🥉':`#${rank}`}
            </div>
            <span style={{fontSize:16}}>{EMOJI[e.name]||'🤖'}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'var(--fd)',fontSize:11,fontWeight:700,color:e.isPlayer?'var(--g)':col,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {e.name}{e.isPlayer?' ← YOU':''}
              </div>
              <div style={{fontFamily:'var(--fm)',fontSize:9,color:'var(--t4)',fontWeight:500}}>{e.personality}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontFamily:'var(--fm)',fontSize:12,fontWeight:700,color:'var(--t1)'}}>${e.value?.toLocaleString('en',{maximumFractionDigits:0})}</div>
              <div style={{fontFamily:'var(--fm)',fontSize:9,color:up?'var(--g)':'var(--pink)',fontWeight:600}}>{up?'▲':'▼'} {Math.abs(pct).toFixed(1)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EventFeed({ events=[] }) {
  return(
    <div style={{background:'linear-gradient(160deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',border:'1px solid rgba(245,200,66,.15)',borderRadius:16,overflow:'hidden',display:'flex',flexDirection:'column',minHeight:160}}>
      <div style={{padding:'12px 15px',borderBottom:'1px solid rgba(245,200,66,.1)',display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
        <span style={{fontSize:14}}>⚡</span>
        <span style={{fontFamily:'var(--fd)',fontSize:10,fontWeight:800,letterSpacing:'.1em',color:'var(--gold)',textTransform:'uppercase'}}>Market Events</span>
      </div>
      <div className="scroll" style={{flex:1,maxHeight:180}}>
        {events.length===0
          ?<div style={{padding:18,textAlign:'center',fontFamily:'var(--fm)',fontSize:11,color:'var(--t4)',fontWeight:500}}>Markets calm…</div>
          :events.slice(0,12).map((ev,i)=>(
            <div key={ev.id||i} style={{padding:'9px 15px',borderBottom:'1px solid rgba(123,189,232,.05)',background:i===0?`rgba(${ev.type==='boom'?'61,232,154':ev.type==='crash'?'255,92,122':'245,200,66'},.05)`:'transparent',animation:i===0?'fadeUp .4s ease':'none'}}>
              <div style={{fontSize:11,color:'var(--t2)',lineHeight:1.45,fontWeight:500}}>{ev.message}</div>
              <div style={{fontFamily:'var(--fm)',fontSize:9,color:'var(--t4)',marginTop:3}}>Tick {ev.tick}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export function TradeFeed({ trades=[] }) {
  return(
    <div style={{background:'linear-gradient(160deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',border:'1px solid rgba(123,189,232,.12)',borderRadius:16,overflow:'hidden',display:'flex',flexDirection:'column',minHeight:160}}>
      <div style={{padding:'12px 15px',borderBottom:'1px solid rgba(123,189,232,.08)',display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
        <span style={{fontSize:14}}>🔄</span>
        <span style={{fontFamily:'var(--fd)',fontSize:10,fontWeight:800,letterSpacing:'.1em',color:'var(--sky)',textTransform:'uppercase'}}>Trade Feed</span>
      </div>
      <div className="scroll" style={{flex:1,maxHeight:180}}>
        {trades.length===0
          ?<div style={{padding:18,textAlign:'center',fontFamily:'var(--fm)',fontSize:11,color:'var(--t4)',fontWeight:500}}>No trades yet…</div>
          :trades.slice(0,20).map((t,i)=>{
            const col=AGENT_COLORS[t.agent]||'var(--t2)';
            const buy=t.type==='BUY';
            return(
              <div key={`${t.timestamp}-${i}`} style={{padding:'8px 15px',borderBottom:'1px solid rgba(123,189,232,.04)',display:'flex',alignItems:'center',gap:8,background:i===0?'rgba(123,189,232,.05)':'transparent',animation:i===0?'slideL .3s ease':'none'}}>
                <span style={{fontSize:13}}>{EMOJI[t.agent]||'🤖'}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                    <span style={{fontFamily:'var(--fd)',fontSize:9,fontWeight:700,color:col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:68}}>{t.agent}</span>
                    <span style={{fontFamily:'var(--fm)',fontSize:8,padding:'1px 5px',background:buy?'rgba(61,232,154,.15)':'rgba(255,92,122,.15)',border:`1px solid ${buy?'rgba(61,232,154,.35)':'rgba(255,92,122,.35)'}`,borderRadius:4,color:buy?'var(--g)':'var(--pink)',fontWeight:700}}>{t.type}</span>
                    <span style={{fontFamily:'var(--fm)',fontSize:9,color:'var(--t2)',fontWeight:600}}>{t.shares}× {t.ticker}</span>
                  </div>
                  {t.reason&&<div style={{fontFamily:'var(--fm)',fontSize:8,color:'var(--t4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.reason}</div>}
                </div>
                <span style={{fontFamily:'var(--fm)',fontSize:10,color:'var(--t3)',flexShrink:0,fontWeight:600}}>${t.price?.toFixed(2)}</span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}