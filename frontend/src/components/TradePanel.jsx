import { useState, useEffect, useRef, useMemo } from 'react';

function CandlestickChart({ history, width=600, height=165 }) {
  const candles = useMemo(()=>{
    if(!history||history.length<2)return[];
    const out=[];
    for(let i=0;i<history.length-1;i+=2){
      const sl=history.slice(i,i+3);
      if(sl.length<2)continue;
      out.push({open:sl[0],close:sl[sl.length-1],high:Math.max(...sl),low:Math.min(...sl)});
    }
    return out.slice(-45);
  },[history]);

  if(candles.length<3)return(
    <div style={{height,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontFamily:'var(--fm)',fontSize:10,color:'var(--t4)',fontWeight:500}}>Collecting data…</span>
    </div>
  );

  const prices=candles.flatMap(c=>[c.high,c.low]);
  const rlo=Math.min(...prices),rhi=Math.max(...prices);
  const pad=(rhi-rlo)*.1||1;
  const lo=rlo-pad,hi=rhi+pad,range=hi-lo;
  const pL=6,pR=54,pT=8,pB=22;
  const W=width-pL-pR,H=height-pT-pB;
  const toY=p=>pT+H-((p-lo)/range)*H;
  const slot=W/candles.length;
  const bw=Math.max(2,slot*.62);
  const hb=bw/2;
  const yg=Array.from({length:4},(_,i)=>{const v=lo+(range/3)*i;return{y:toY(v),v};});
  const closes=candles.map(c=>c.close);
  const ma5=closes.map((_,i)=>{const s=closes.slice(Math.max(0,i-4),i+1);return s.reduce((a,b)=>a+b,0)/s.length;});
  const maPath=ma5.map((v,i)=>`${pL+i*slot+slot/2},${toY(v)}`).join(' ');
  const last=candles[candles.length-1];
  const lastY=toY(last.close);
  const bull=last.close>=last.open;

  return(
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{display:'block'}}>
      {yg.map((t,i)=>(
        <g key={i}>
          <line x1={pL} y1={t.y} x2={width-pR} y2={t.y} stroke="rgba(123,189,232,.06)" strokeWidth={1} strokeDasharray="3,5"/>
          <text x={width-pR+4} y={t.y+3.5} fill="rgba(123,189,232,.28)" fontSize={8} fontFamily="JetBrains Mono">${t.v.toFixed(0)}</text>
        </g>
      ))}
      {candles.map((c,i)=>{
        const cx=pL+i*slot+slot/2;
        const b=c.close>=c.open;
        const col=b?'#3DE89A':'#FF5C7A';
        const bT=toY(Math.max(c.open,c.close));
        const bB=toY(Math.min(c.open,c.close));
        return(
          <g key={i}>
            <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={col} strokeWidth={1} opacity={.6}/>
            <rect x={cx-hb} y={bT} width={bw} height={Math.max(1,bB-bT)} fill={col} fillOpacity={b?.88:.78} stroke={col} strokeWidth={.5}/>
          </g>
        );
      })}
      <polyline points={maPath} fill="none" stroke="rgba(245,200,66,.7)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"/>
      <line x1={pL} y1={lastY} x2={width-pR} y2={lastY} stroke={bull?'#3DE89A':'#FF5C7A'} strokeWidth={1} strokeDasharray="4,3" opacity={.5}/>
      <rect x={width-pR+2} y={lastY-9} width={50} height={17} fill={bull?'rgba(61,232,154,.15)':'rgba(255,92,122,.15)'} rx={5}/>
      <text x={width-pR+27} y={lastY+3.5} fill={bull?'#3DE89A':'#FF5C7A'} fontSize={8.5} fontFamily="JetBrains Mono" textAnchor="middle">${last.close.toFixed(2)}</text>
    </svg>
  );
}

export default function TradePanel({ ticker, marketData, player, onBuy, onSell, tradeResult }) {
  const [mode,setMode]=useState('BUY');
  const [shares,setShares]=useState(1);
  const [flash,setFlash]=useState(null);
  const containerRef=useRef(null);
  const [chartW,setChartW]=useState(600);

  useEffect(()=>{
    if(!containerRef.current)return;
    const ro=new ResizeObserver(e=>setChartW(e[0].contentRect.width||600));
    ro.observe(containerRef.current);
    return()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    if(!tradeResult)return;
    setFlash(tradeResult);
    const t=setTimeout(()=>setFlash(null),2500);
    return()=>clearTimeout(t);
  },[tradeResult?._ts]);

  const s=ticker?marketData?.[ticker]:null;
  const holding=ticker?player?.portfolio?.[ticker]:null;
  const cash=player?.cash||0;
  const price=s?.price||0;
  const cost=shares*price;
  const canBuy=cash>=cost&&shares>=1;
  const canSell=(holding?.shares||0)>=shares&&shares>=1;
  const hist=s?.history||[];
  const first=hist[0]||price;
  const sessPct=first>0?((price-first)/first)*100:0;
  const up=sessPct>=0;
  const ind=s?.indicators||{};

  const go=fn=>{if(typeof fn==='function')fn(ticker,shares);};

  if(!ticker||!s)return(
    <div style={{background:'linear-gradient(145deg,rgba(10,65,116,.9),rgba(0,29,57,.85))',borderRadius:14,border:'1px solid rgba(123,189,232,.1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:44,minHeight:200}}>
      <span style={{fontSize:42,opacity:.3}}>📈</span>
      <span style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:14,color:'var(--t4)'}}>Select a stock to trade</span>
      <span style={{fontSize:12,color:'var(--t4)',fontWeight:500}}>← Pick from the market panel</span>
    </div>
  );

  return(
    <div ref={containerRef} style={{background:'linear-gradient(145deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',borderRadius:14,border:'1px solid rgba(123,189,232,.1)',overflow:'hidden',display:'flex',flexDirection:'column'}}>

      {/* Header */}
      <div style={{padding:'15px 20px',background:up?'rgba(61,232,154,.06)':'rgba(255,92,122,.06)',borderBottom:'1px solid rgba(123,189,232,.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontFamily:'var(--fd)',fontSize:24,fontWeight:900,color:up?'var(--g)':'var(--pink)',textShadow:`0 0 22px ${up?'rgba(61,232,154,.4)':'rgba(255,92,122,.4)'}`}}>{ticker}</div>
          <div style={{fontSize:11,color:'var(--t4)',marginTop:3,fontWeight:500}}>{s.name} · {s.sector}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:'var(--fm)',fontSize:22,fontWeight:700,color:'var(--t1)'}}>${price.toFixed(2)}</div>
          <div style={{fontFamily:'var(--fm)',fontSize:11,color:up?'var(--g)':'var(--pink)',marginTop:3}}>{up?'▲':'▼'} {Math.abs(sessPct).toFixed(2)}% session</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{background:'rgba(0,15,30,.65)',position:'relative'}}>
        <div style={{position:'absolute',top:7,left:10,display:'flex',gap:12,zIndex:2}}>
          <span style={{fontSize:9,color:'rgba(123,189,232,.3)',fontFamily:'var(--fm)',fontWeight:600}}>OHLC Candles</span>
          <span style={{fontSize:9,color:'rgba(245,200,66,.5)',fontFamily:'var(--fm)',fontWeight:600}}>— MA5</span>
        </div>
        <CandlestickChart history={hist} width={chartW} height={170}/>
      </div>

      {/* Indicators */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'1px solid rgba(123,189,232,.07)'}}>
        {[
          {l:'RSI', v:ind.rsi!=null?ind.rsi.toFixed(0):'—',                  col:(ind.rsi||50)>70?'var(--pink)':(ind.rsi||50)<30?'var(--g)':'var(--gold)'},
          {l:'MA5', v:ind.ma5!=null?`$${ind.ma5.toFixed(1)}`:'—',             col:'var(--sky)'},
          {l:'MA20',v:ind.ma20!=null?`$${ind.ma20.toFixed(1)}`:'—',           col:'var(--mist)'},
          {l:'MOM', v:ind.momentum!=null?`${ind.momentum.toFixed(1)}%`:'—',   col:(ind.momentum||0)>=0?'var(--g)':'var(--pink)'},
        ].map((x,i)=>(
          <div key={x.l} style={{padding:'11px 8px',textAlign:'center',background:i%2===0?'rgba(0,29,57,.3)':'transparent'}}>
            <div style={{fontFamily:'var(--fd)',fontSize:8,fontWeight:700,color:'var(--t4)',marginBottom:4,letterSpacing:'.08em'}}>{x.l}</div>
            <div style={{fontFamily:'var(--fm)',fontSize:13,fontWeight:700,color:x.col}}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Holding */}
      {holding&&(
        <div style={{margin:'13px 18px 0',padding:'10px 15px',background:'rgba(61,232,154,.07)',border:'1px solid rgba(61,232,154,.2)',borderRadius:11,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--g)',fontWeight:700}}>📦 {holding.shares} shares held</span>
          <span style={{fontFamily:'var(--fm)',fontSize:11,color:'var(--t4)'}}>avg ${holding.avgCost?.toFixed(2)}</span>
        </div>
      )}

      {/* Controls */}
      <div style={{padding:'14px 18px 18px'}}>

        {/* BUY / SELL */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:15}}>
          {['BUY','SELL'].map(m=>{
            const active=mode===m;
            const isBuy=m==='BUY';
            return(
              <button key={m} onClick={()=>setMode(m)} style={{padding:'14px',borderRadius:13,fontWeight:800,fontSize:15,fontFamily:'var(--fd)',letterSpacing:'.04em',background:active?(isBuy?'linear-gradient(135deg,#3DE89A,#22C55E)':'linear-gradient(135deg,#FF5C7A,#E02D4E)'):(isBuy?'rgba(61,232,154,.08)':'rgba(255,92,122,.08)'),color:active?(isBuy?'#001D39':'#fff'):(isBuy?'rgba(61,232,154,.55)':'rgba(255,92,122,.55)'),border:active?'none':`2px solid ${isBuy?'rgba(61,232,154,.2)':'rgba(255,92,122,.2)'}`,boxShadow:active?(isBuy?'0 5px 20px rgba(61,232,154,.45)':'0 5px 20px rgba(255,92,122,.45)'):'none',transition:'all .2s'}}>
                {isBuy?'▲ BUY':'▼ SELL'}
              </button>
            );
          })}
        </div>

        {/* Shares */}
        <div style={{marginBottom:13}}>
          <div style={{fontFamily:'var(--fd)',fontSize:9,fontWeight:700,color:'var(--t4)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:9}}>Shares</div>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <button onClick={()=>setShares(n=>Math.max(1,n-1))} style={{width:40,height:40,borderRadius:10,background:'rgba(123,189,232,.08)',border:'1px solid rgba(123,189,232,.15)',color:'var(--t2)',fontSize:22,flexShrink:0}}>−</button>
            <input type="number" min={1} value={shares} onChange={e=>setShares(Math.max(1,parseInt(e.target.value)||1))}
              style={{flex:1,height:40,background:'rgba(0,29,57,.5)',border:'1px solid rgba(123,189,232,.18)',borderRadius:10,color:'var(--t1)',fontFamily:'var(--fm)',fontSize:17,textAlign:'center',fontWeight:700}}/>
            <button onClick={()=>setShares(n=>n+1)} style={{width:40,height:40,borderRadius:10,background:'rgba(123,189,232,.08)',border:'1px solid rgba(123,189,232,.15)',color:'var(--t2)',fontSize:22,flexShrink:0}}>+</button>
          </div>
          <div style={{display:'flex',gap:6}}>
            {[1,5,10,25].map(n=>(
              <button key={n} onClick={()=>setShares(n)} style={{flex:1,padding:'7px 0',background:shares===n?'rgba(123,189,232,.18)':'rgba(0,29,57,.5)',border:`1px solid ${shares===n?'rgba(123,189,232,.45)':'rgba(123,189,232,.1)'}`,borderRadius:8,color:shares===n?'var(--sky)':'var(--t4)',fontFamily:'var(--fm)',fontSize:11,fontWeight:700,transition:'all .15s'}}>{n}</button>
            ))}
          </div>
        </div>

        {/* Cost */}
        <div style={{display:'flex',justifyContent:'space-between',padding:'11px 15px',background:'rgba(0,29,57,.5)',borderRadius:11,marginBottom:12,border:'1px solid rgba(123,189,232,.09)'}}>
          <span style={{fontSize:12,color:'var(--t4)',fontWeight:500}}>{mode==='BUY'?'Total Cost':'Proceeds'}</span>
          <span style={{fontFamily:'var(--fm)',fontSize:14,fontWeight:700,color:'var(--t1)'}}>${cost.toFixed(2)}</span>
        </div>

        {mode==='BUY'&&!canBuy&&shares>=1&&(
          <div style={{padding:'9px 13px',background:'rgba(245,200,66,.07)',border:'1px solid rgba(245,200,66,.2)',borderRadius:9,marginBottom:11,fontSize:12,color:'var(--gold)',fontWeight:600}}>
            ⚠️ Need ${(cost-cash).toFixed(2)} more cash
          </div>
        )}
        {mode==='SELL'&&!canSell&&shares>=1&&(
          <div style={{padding:'9px 13px',background:'rgba(245,200,66,.07)',border:'1px solid rgba(245,200,66,.2)',borderRadius:9,marginBottom:11,fontSize:12,color:'var(--gold)',fontWeight:600}}>
            ⚠️ Only {holding?.shares||0} shares held
          </div>
        )}

        {flash&&(
          <div style={{padding:'11px 15px',marginBottom:11,borderRadius:11,fontSize:12,fontWeight:700,background:flash.success?'rgba(61,232,154,.1)':'rgba(255,92,122,.1)',border:`1px solid ${flash.success?'rgba(61,232,154,.28)':'rgba(255,92,122,.28)'}`,color:flash.success?'var(--g)':'var(--pink)',animation:'fadeUp .2s ease'}}>
            {flash.success?'✅':'❌'} {flash.message}
          </div>
        )}

        {/* Execute */}
        <button onClick={()=>mode==='BUY'?go(onBuy):go(onSell)} disabled={mode==='BUY'?!canBuy:!canSell}
          style={{width:'100%',padding:'17px',borderRadius:13,fontSize:16,fontWeight:800,fontFamily:'var(--fd)',letterSpacing:'.05em',border:'none',background:mode==='BUY'?(canBuy?'linear-gradient(135deg,#3DE89A,#22C55E)':'rgba(0,29,57,.5)'):(canSell?'linear-gradient(135deg,#FF5C7A,#E02D4E)':'rgba(0,29,57,.5)'),color:(mode==='BUY'?canBuy:canSell)?(mode==='BUY'?'#001D39':'#fff'):'var(--t4)',boxShadow:(mode==='BUY'&&canBuy)?'0 6px 26px rgba(61,232,154,.5)':(mode==='SELL'&&canSell)?'0 6px 26px rgba(255,92,122,.5)':'none',cursor:(mode==='BUY'?canBuy:canSell)?'pointer':'not-allowed',transition:'all .2s'}}>
          {mode==='BUY'?`▲ BUY ${shares} ${ticker}`:`▼ SELL ${shares} ${ticker}`}
        </button>

        <div style={{marginTop:9,textAlign:'center',fontSize:11,color:'var(--t4)',fontWeight:500}}>
          Available: <span style={{fontFamily:'var(--fm)',color:'var(--t3)',fontWeight:700}}>${cash.toLocaleString('en',{maximumFractionDigits:0})}</span>
        </div>
      </div>
    </div>
  );
}