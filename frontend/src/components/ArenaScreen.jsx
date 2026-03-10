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
    <div style={{position:'sticky',top:0,zIndex:200,padding:'11px 22px',background:'rgba(0,29,57,.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(123,189,232,.1)',display:'flex',alignItems:'center',gap:18}}>
      <div style={{fontFamily:'var(--fd)',fontSize:12,fontWeight:900,whiteSpace:'nowrap',letterSpacing:'.06em',background:'linear-gradient(135deg,var(--sky),var(--teal))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
        AI MARKET ARENA
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <div style={{width:7,height:7,borderRadius:'50%',background:connected?'var(--g)':'var(--pink)',boxShadow:`0 0 8px ${connected?'var(--g)':'var(--pink)'}`,animation:'pulse 2s infinite'}}/>
        <span style={{fontFamily:'var(--fm)',fontSize:9,fontWeight:600,color:connected?'var(--g)':'var(--pink)'}}>
          {connected?(latency?`${latency}ms`:'LIVE'):'RECONNECTING'}
        </span>
      </div>
      <div style={{flex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
          <span style={{fontFamily:'var(--fm)',fontSize:9,color:'var(--t4)'}}>TICK {tick} / {maxTicks}</span>
          <span style={{fontFamily:'var(--fm)',fontSize:9,color:hot?'var(--ora)':'var(--t4)'}}>{(100-progress).toFixed(0)}% LEFT</span>
        </div>
        <div style={{height:5,background:'rgba(123,189,232,.1)',borderRadius:4,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${progress}%`,borderRadius:4,transition:'width .6s ease',background:hot?'linear-gradient(90deg,var(--ora),var(--pink))':'linear-gradient(90deg,var(--sky),var(--g))'}}/>
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontFamily:'var(--fm)',fontSize:20,fontWeight:700,color:up?'var(--g)':'var(--pink)',textShadow:`0 0 18px ${up?'rgba(61,232,154,.4)':'rgba(255,92,122,.4)'}`}}>
          ${pv?.toLocaleString('en',{maximumFractionDigits:0})}
        </div>
        <div style={{fontFamily:'var(--fm)',fontSize:9,color:up?'rgba(61,232,154,.75)':'rgba(255,92,122,.75)'}}>
          {up?'▲':'▼'} {Math.abs(pct).toFixed(2)}% &nbsp; {up?'+':'-'}${Math.abs(pnl).toFixed(0)}
        </div>
      </div>
    </div>
  );
}

const BOT_INFO = {
  MomentumBot:{ emoji:'📈', color:'#7BBDE8',
    rules:['BUY when RSI < 40 AND MA5 > MA20 (golden cross)','SELL when RSI > 65 OR momentum turns negative','Skip trade if volatility > 2%'],
    tip:"Watch RSI bounce off 40 — that's its exact trigger zone." },
  ValueBot:   { emoji:'🔍', color:'#4E8EA2',
    rules:['BUY when price is >3% below MA20 AND RSI < 35','SELL when price recovers to MA20 (fair value)','Max 30% of portfolio per stock'],
    tip:'It hunts hard dips. RSI < 35 is the confirmation signal.' },
  RiskBot:    { emoji:'🛡️', color:'#6EA2B3',
    rules:['HARD stop-loss: sells if any position drops >5%','Profit lock: exits positions at +8% gain','Refuses all trades when volatility > 3%'],
    tip:'Watch how it skips entire volatile ticks — that IS the strategy.' },
  RandomBot:  { emoji:'🎲', color:'#BDD8E9',
    rules:['50/50 chance to BUY or SELL any stock each tick','Random 1–10 share size per trade','Zero indicators — pure noise'],
    tip:"The baseline. Can't beat this consistently? Revisit your approach." },
  RLBot:      { emoji:'🤖', color:'#49769F',
    rules:['Q-table maps (state, action) → expected reward','ε=0.15: explores random actions 15%, exploits best 85%','Reward = portfolio Δvalue per tick (γ=0.95 discount)'],
    tip:'Early game = random. Late game = sharp. Watch it evolve in real time.' },
};

function BotStrategyPanel({ leaderboard, tradeFeed }) {
  const [activeBot, setActiveBot] = useState(null);
  const bots = leaderboard.filter(e => !e.isPlayer);
  const info = activeBot ? BOT_INFO[activeBot] : null;
  const botTrades = activeBot ? tradeFeed.filter(t => t.agent === activeBot).slice(0, 6) : [];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{background:'linear-gradient(160deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',borderRadius:16,border:'1px solid rgba(123,189,232,.1)',overflow:'hidden'}}>
        <div style={{padding:'13px 16px',borderBottom:'1px solid rgba(123,189,232,.07)'}}>
          <div style={{fontFamily:'var(--fd)',fontSize:10,fontWeight:800,color:'var(--t3)',letterSpacing:'.12em',textTransform:'uppercase'}}>🤖 Bot Strategies</div>
          <div style={{fontSize:10,color:'var(--t4)',marginTop:2,fontWeight:500}}>Tap to reveal live decision logic</div>
        </div>
        {bots.map(bot => {
          const bi = BOT_INFO[bot.name];
          const active = activeBot === bot.name;
          const up = (bot.changePercent||0) >= 0;
          const rank = leaderboard.findIndex(e=>e.name===bot.name)+1;
          return (
            <div key={bot.name} onClick={()=>setActiveBot(active?null:bot.name)}
              style={{padding:'11px 16px',cursor:'pointer',background:active?`linear-gradient(135deg,${bi?.colorSoft||'rgba(123,189,232,.1)'},rgba(0,29,57,.5))`:'transparent',borderLeft:`3px solid ${active?bi?.color||'var(--sky)':'transparent'}`,borderBottom:'1px solid rgba(123,189,232,.05)',display:'flex',alignItems:'center',gap:10,transition:'all .15s'}}>
              <span style={{fontSize:18}}>{bi?.emoji||'🤖'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:active?bi?.color:'var(--t2)',fontFamily:'var(--fd)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bot.name}</div>
                <div style={{fontSize:9,color:'var(--t4)',fontWeight:500}}>Rank #{rank}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:'var(--fm)',fontSize:12,fontWeight:700,color:'var(--t1)'}}>${bot.value?.toLocaleString('en',{maximumFractionDigits:0})}</div>
                <div style={{fontSize:9,color:up?'var(--g)':'var(--pink)',fontFamily:'var(--fm)'}}>{up?'▲':'▼'}{Math.abs(bot.changePercent||0).toFixed(1)}%</div>
              </div>
              <span style={{fontSize:9,color:'var(--t4)',flexShrink:0}}>{active?'▲':'▼'}</span>
            </div>
          );
        })}
      </div>

      {activeBot && info && (
        <div style={{background:'linear-gradient(160deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',borderRadius:16,border:`1px solid ${info.color}40`,overflow:'hidden',animation:'fadeUp .2s ease'}}>
          <div style={{padding:'13px 16px',background:`${info.color}15`,borderBottom:`1px solid ${info.color}20`,display:'flex',alignItems:'center',gap:9}}>
            <span style={{fontSize:20}}>{info.emoji}</span>
            <div>
              <div style={{fontFamily:'var(--fd)',fontSize:13,fontWeight:800,color:info.color}}>{activeBot}</div>
              <div style={{fontSize:10,color:'var(--t4)',fontWeight:500}}>Live Decision Rules</div>
            </div>
          </div>
          <div style={{padding:'14px 16px'}}>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
              {info.rules.map((r,i)=>(
                <div key={i} style={{display:'flex',gap:9,alignItems:'flex-start'}}>
                  <span style={{fontFamily:'var(--fm)',fontSize:9,fontWeight:700,color:info.color,marginTop:2,flexShrink:0,background:`${info.color}20`,padding:'2px 6px',borderRadius:5}}>#{i+1}</span>
                  <span style={{fontSize:11,color:'var(--t3)',lineHeight:1.55,fontWeight:400}}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{padding:'10px 13px',background:'rgba(0,29,57,.5)',borderRadius:10,border:'1px solid rgba(123,189,232,.08)'}}>
              <span style={{fontSize:11,color:'var(--t4)'}}>💡 <span style={{color:'var(--t2)'}}>{info.tip}</span></span>
            </div>
          </div>
          {botTrades.length > 0 && (
            <div style={{borderTop:'1px solid rgba(123,189,232,.07)',padding:'11px 16px'}}>
              <div style={{fontFamily:'var(--fd)',fontSize:9,fontWeight:700,color:'var(--t4)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:9}}>Recent Trades</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {botTrades.map((t,i)=>{
                  const buy=t.type==='BUY';
                  return(
                    <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{fontFamily:'var(--fm)',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:5,background:buy?'rgba(61,232,154,.15)':'rgba(255,92,122,.15)',color:buy?'var(--g)':'var(--pink)'}}>{t.type}</span>
                      <span style={{fontSize:11,color:'var(--t2)',fontWeight:500}}>{t.shares}× {t.ticker}</span>
                      <span style={{fontFamily:'var(--fm)',fontSize:10,color:'var(--t4)',marginLeft:'auto',fontWeight:600}}>${t.price?.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <LeaderboardPanel leaderboard={leaderboard} startingCash={10000}/>
    </div>
  );
}

export default function ArenaScreen({ selectedAgents, startingCash=10000, onExit }) {
  const [selected,setSelected]=useState('AAPL');
  const [gameOver,setGameOver]=useState(false);
  const [finalState,setFinalState]=useState(null);

  const {connected,gameState,tradeResult,latency,sendBuy,sendSell}=useGameSocket({
    selectedAgents,startingCash,
    onGameOver:s=>{setFinalState(s);setGameOver(true);},
  });

  const handleBuy  = useCallback((tk,sh)=>{if(typeof sendBuy ==='function')sendBuy(tk,sh); },[sendBuy]);
  const handleSell = useCallback((tk,sh)=>{if(typeof sendSell==='function')sendSell(tk,sh);},[sendSell]);

  if(gameOver&&finalState)return<GameOverScreen gameState={finalState} onPlayAgain={onExit}/>;

  if(!gameState)return(
    <div style={{width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--navy)',flexDirection:'column',gap:22}}>
      <div className="spinner" style={{width:50,height:50}}/>
      <div style={{fontFamily:'var(--fd)',color:'var(--sky)',fontSize:14,letterSpacing:'.18em',fontWeight:700}}>{connected?'INITIALIZING MARKET…':'CONNECTING…'}</div>
      <div style={{fontSize:12,color:'var(--t4)',fontWeight:500}}>{connected?'Server connected — waiting for first tick':'Establishing WebSocket connection'}</div>
      {!connected&&(
        <div style={{padding:'11px 22px',background:'rgba(245,200,66,.07)',border:'1px solid rgba(245,200,66,.25)',borderRadius:12,fontSize:12,color:'var(--gold)',textAlign:'center',maxWidth:340,fontWeight:500}}>
          ⚡ First visit? Render free tier wakes up in 20–30s
        </div>
      )}
    </div>
  );

  const {marketData={},leaderboard=[],player={},tradeFeed=[],eventLog=[],tick=0,maxTicks=200}=gameState;

  return(
    <div style={{minHeight:'100vh',background:'var(--navy)',overflowX:'hidden',overflowY:'auto',display:'flex',flexDirection:'column'}}>
      <HUD tick={tick} maxTicks={maxTicks} pv={player.totalValue||startingCash} start={startingCash} connected={connected} latency={latency}/>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'220px 1fr 280px',gap:10,padding:'10px 12px 24px',alignItems:'start'}}>

        <div style={{position:'sticky',top:58,maxHeight:'calc(100vh - 68px)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <StockPanel marketData={marketData} selected={selected} onSelect={setSelected} portfolio={player.portfolio||{}}/>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <TradePanel ticker={selected} marketData={marketData} player={player} onBuy={handleBuy} onSell={handleSell} tradeResult={tradeResult}/>

          <div style={{background:'linear-gradient(145deg,rgba(10,65,116,.9),rgba(0,29,57,.85))',borderRadius:14,border:'1px solid rgba(123,189,232,.1)',padding:'14px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontFamily:'var(--fd)',fontSize:11,fontWeight:700,color:'var(--t3)',letterSpacing:'.08em'}}>💼 YOUR PORTFOLIO</span>
              <span style={{fontFamily:'var(--fm)',fontSize:12,fontWeight:600,color:'var(--sky)'}}>Cash: ${(player.cash||0).toLocaleString('en',{maximumFractionDigits:0})}</span>
            </div>
            {Object.keys(player.portfolio||{}).length===0
              ?<div style={{fontSize:12,color:'var(--t4)',textAlign:'center',padding:'8px 0',fontWeight:500}}>No positions — buy a stock to start</div>
              :<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {Object.entries(player.portfolio).map(([tk,pos])=>{
                  const price=marketData[tk]?.price||0;
                  const pct=pos.avgCost>0?((price-pos.avgCost)/pos.avgCost)*100:0;
                  return(
                    <div key={tk} onClick={()=>setSelected(tk)} style={{padding:'9px 14px',borderRadius:11,cursor:'pointer',background:pct>=0?'rgba(61,232,154,.1)':'rgba(255,92,122,.1)',border:`1px solid ${pct>=0?'rgba(61,232,154,.25)':'rgba(255,92,122,.25)'}`}}>
                      <div style={{fontFamily:'var(--fd)',fontSize:12,fontWeight:800,color:'var(--t1)'}}>{tk}</div>
                      <div style={{fontFamily:'var(--fm)',fontSize:10,color:pct>=0?'var(--g)':'var(--pink)',marginTop:2}}>{pos.shares}sh · {pct>=0?'+':''}{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            }
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <EventFeed events={eventLog}/>
            <TradeFeed trades={tradeFeed}/>
          </div>
        </div>

        <div style={{position:'sticky',top:58,maxHeight:'calc(100vh - 68px)',overflowY:'auto',display:'flex',flexDirection:'column'}} className="scroll">
          <BotStrategyPanel leaderboard={leaderboard} tradeFeed={tradeFeed}/>
        </div>
      </div>
    </div>
  );
}