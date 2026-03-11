import { useState, useEffect } from 'react';
import { saveScore } from '../utils/api';

const EMOJI={YOU:'👤',MomentumBot:'📈',ValueBot:'🔍',RiskBot:'🛡️',RandomBot:'🎲',RLBot:'🤖'};
const AGENT_COLORS={MomentumBot:'#7BBDE8',ValueBot:'#4E8EA2',RiskBot:'#6EA2B3',RandomBot:'#BDD8E9',RLBot:'#49769F',YOU:'#3DE89A'};

export default function GameOverScreen({ gameState, onPlayAgain }) {
  const [name,setName]=useState('');
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [visible,setVisible]=useState(false);

  useEffect(()=>{const t=setTimeout(()=>setVisible(true),100);return()=>clearTimeout(t);},[]);

  const lb=gameState?.leaderboard||[];
  const me=lb.find(e=>e.isPlayer);
  const rank=lb.findIndex(e=>e.isPlayer)+1;
  const beaten=lb.filter((e,i)=>!e.isPlayer&&i>lb.findIndex(e=>e.isPlayer)).length;
  const total=lb.filter(e=>!e.isPlayer).length;
  const pct=me?.changePercent||0;
  const up=pct>=0;

  const msgs={
    1:{h:'🏆 CHAMPION!!',    s:'You defeated every AI agent!',       col:'var(--gold)'},
    2:{h:'🥈 STRONG FINISH',s:'One bot edged you at the line.',      col:'#BDD8E9'},
    3:{h:'🥉 RESPECTABLE',  s:"You held your own against the bots.", col:'#6EA2B3'},
  };
  const m=msgs[rank]||{h:`#${rank} FINISH`,s:'The bots schooled you — rematch?',col:'var(--t3)'};

  const handleSave=async()=>{
    setSaving(true);
    try{
      await saveScore({playerName:name||'Anonymous',finalValue:me?.value||10000,startingCash:10000,profitPct:pct,totalTrades:gameState?.player?.tradeHistory?.length||0,rank,agentsBeaten:beaten,totalAgents:total,agents:lb.filter(e=>!e.isPlayer).map(e=>e.name)});
      setSaved(true);
    }catch(err){console.error(err);}
    setSaving(false);
  };

  return(
    <div style={{minHeight:'100vh',overflowY:'auto',background:'var(--navy)',backgroundImage:'radial-gradient(ellipse at 50% 0%,rgba(10,65,116,.9) 0%,transparent 60%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:28,position:'relative'}}>

      {[0,1,2].map(i=>(
        <div key={i} style={{position:'fixed',width:`${200+i*200}px`,height:`${200+i*200}px`,border:`1px solid rgba(123,189,232,${.06-i*.015})`,borderRadius:'50%',top:'50%',left:'50%',transform:'translate(-50%,-50%)',animation:`spin ${12+i*5}s linear infinite ${i%2?'reverse':''}`,pointerEvents:'none'}}/>
      ))}

      <div style={{zIndex:10,maxWidth:800,width:'100%',opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(28px)',transition:'all .7s cubic-bezier(.34,1.56,.64,1)',display:'flex',flexDirection:'column',gap:16}}>

        <div style={{textAlign:'center',marginBottom:4}}>
          <div style={{fontFamily:'var(--fd)',fontSize:'clamp(28px,5vw,56px)',fontWeight:900,color:m.col,textShadow:`0 0 50px ${m.col}`,marginBottom:8,letterSpacing:'-.01em'}}>{m.h}</div>
          <div style={{fontSize:14,color:'var(--t3)',fontWeight:500,letterSpacing:'.04em'}}>{m.s}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[
            {l:'Final Value',v:`$${me?.value?.toLocaleString('en',{maximumFractionDigits:0})}`,col:'var(--sky)'},
            {l:'P&L',        v:`${up?'+':''}${pct.toFixed(2)}%`,                              col:up?'var(--g)':'var(--pink)'},
            {l:'Final Rank', v:`#${rank}`,                                                     col:m.col},
            {l:'Bots Beaten',v:`${beaten}/${total}`,                                           col:'var(--gold)'},
          ].map(x=>(
            <div key={x.l} style={{padding:16,borderRadius:16,textAlign:'center',background:'linear-gradient(145deg,rgba(10,65,116,.9),rgba(0,29,57,.85))',border:`1px solid ${x.col}30`,boxShadow:'0 4px 20px rgba(0,29,57,.5)'}}>
              <div style={{fontFamily:'var(--fd)',fontSize:9,fontWeight:700,color:'var(--t4)',marginBottom:8,letterSpacing:'.1em',textTransform:'uppercase'}}>{x.l}</div>
              <div style={{fontFamily:'var(--fm)',fontSize:'clamp(16px,2.5vw,26px)',fontWeight:700,color:x.col,textShadow:`0 0 16px ${x.col}60`}}>{x.v}</div>
            </div>
          ))}
        </div>

        <div style={{background:'linear-gradient(145deg,rgba(10,65,116,.9),rgba(0,29,57,.85))',borderRadius:18,border:'1px solid rgba(245,200,66,.18)',overflow:'hidden'}}>
          <div style={{padding:'13px 18px',borderBottom:'1px solid rgba(245,200,66,.12)',fontFamily:'var(--fd)',fontSize:11,fontWeight:800,letterSpacing:'.12em',color:'var(--gold)',textTransform:'uppercase'}}>🏆 Final Standings</div>
          {lb.map((e,i)=>{
            const col=AGENT_COLORS[e.name]||'var(--t2)';
            const epct=e.changePercent||0;
            return(
              <div key={e.name} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 18px',background:e.isPlayer?'rgba(61,232,154,.06)':'transparent',borderLeft:e.isPlayer?'3px solid var(--g)':'3px solid transparent',borderBottom:'1px solid rgba(123,189,232,.05)'}}>
                <span style={{fontFamily:'var(--fd)',fontSize:i<3?17:13,width:30,textAlign:'center',flexShrink:0,color:i===0?'var(--gold)':i===1?'#BDD8E9':i===2?'#6EA2B3':'var(--t4)'}}>
                  {i===0?'👑':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                </span>
                <span style={{fontSize:18,flexShrink:0}}>{EMOJI[e.name]||'🤖'}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'var(--fd)',fontSize:13,fontWeight:800,color:e.isPlayer?'var(--g)':col,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {e.name}{e.isPlayer?' ← YOU':''}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontFamily:'var(--fm)',fontSize:14,fontWeight:700,color:'var(--t1)'}}>${e.value?.toLocaleString('en',{maximumFractionDigits:0})}</div>
                  <div style={{fontFamily:'var(--fm)',fontSize:10,color:epct>=0?'var(--g)':'var(--pink)',fontWeight:600}}>{epct>=0?'+':''}{epct?.toFixed(2)}%</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{background:'linear-gradient(135deg,rgba(73,118,159,.3),rgba(78,142,162,.2))',borderRadius:16,border:'1px solid rgba(123,189,232,.18)',padding:'16px 20px'}}>
          <div style={{fontFamily:'var(--fd)',fontSize:11,fontWeight:800,color:'var(--sky)',marginBottom:8,letterSpacing:'.08em'}}>🎓 WHAT DID THE BOTS DO?</div>
          <p style={{fontSize:12,color:'var(--t3)',lineHeight:1.7,fontWeight:400}}>
            The winning strategies above use real techniques: RSI, moving-average crossovers, Q-learning, and stop-losses. Study the <strong style={{color:'var(--sky)'}}>trade feed</strong> from the last match to see exactly when and why they traded — these are the same signals real traders use on TradingView and Bloomberg.
          </p>
        </div>

        <div style={{display:'flex',gap:10}}>
          {!saved?(
            <>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name for the global leaderboard…"
                style={{flex:1,padding:'13px 16px',background:'rgba(0,29,57,.7)',border:'1px solid rgba(123,189,232,.2)',borderRadius:12,color:'var(--t1)',fontFamily:'var(--fb)',fontSize:13,fontWeight:500}}/>
              <button onClick={handleSave} disabled={saving} style={{padding:'13px 20px',background:'linear-gradient(135deg,rgba(245,200,66,.18),rgba(245,200,66,.08))',border:'1px solid var(--gold)',borderRadius:12,color:'var(--gold)',fontFamily:'var(--fd)',fontSize:11,fontWeight:700,letterSpacing:'.06em',whiteSpace:'nowrap',boxShadow:saving?'none':'0 4px 18px rgba(245,200,66,.2)',cursor:'pointer'}}>
                {saving?'…':'💾 SAVE SCORE'}
              </button>
            </>
          ):(
            <div style={{flex:1,padding:'13px 16px',background:'rgba(61,232,154,.08)',border:'1px solid rgba(61,232,154,.25)',borderRadius:12,fontFamily:'var(--fm)',fontSize:12,color:'var(--g)',textAlign:'center',fontWeight:600}}>
              ✓ Score saved to global leaderboard!
            </div>
          )}
          <button onClick={onPlayAgain} style={{padding:'13px 28px',background:'linear-gradient(135deg,var(--sky),var(--teal))',border:'none',borderRadius:12,color:'#001D39',fontFamily:'var(--fd)',fontSize:13,fontWeight:800,letterSpacing:'.05em',boxShadow:'0 6px 24px rgba(123,189,232,.4)',whiteSpace:'nowrap',cursor:'pointer'}}>
            ⚔ PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}