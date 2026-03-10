import { useState, useEffect, useRef, useMemo } from 'react';

function CandlestickChart({ history, width = 600, height = 160 }) {
  const candles = useMemo(() => {
    if (!history || history.length < 2) return [];
    const out = [];
    for (let i = 0; i < history.length - 1; i += 2) {
      const slice = history.slice(i, i + 3);
      if (slice.length < 2) continue;
      out.push({ open:slice[0], close:slice[slice.length-1], high:Math.max(...slice), low:Math.min(...slice) });
    }
    return out.slice(-45);
  }, [history]);

  if (candles.length < 3) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'rgba(255,255,255,.2)' }}>Collecting candlestick data…</span>
    </div>
  );

  const prices = candles.flatMap(c => [c.high, c.low]);
  const raw_lo = Math.min(...prices), raw_hi = Math.max(...prices);
  const pad = (raw_hi - raw_lo) * 0.1 || 1;
  const lo = raw_lo - pad, hi = raw_hi + pad, range = hi - lo;

  const pL=6, pR=52, pT=8, pB=22;
  const W = width-pL-pR, H = height-pT-pB;
  const toY = p => pT + H - ((p-lo)/range)*H;
  const slotW = W/candles.length;
  const bodyW = Math.max(2, slotW*0.6);
  const halfB = bodyW/2;

  const ticks = 4;
  const yGrid = Array.from({length:ticks}, (_,i) => {
    const v = lo + (range/(ticks-1))*i;
    return { y:toY(v), v };
  });

  const closes = candles.map(c=>c.close);
  const ma5pts = closes.map((_,i) => {
    const s = closes.slice(Math.max(0,i-4),i+1);
    return s.reduce((a,b)=>a+b,0)/s.length;
  });
  const maPath = ma5pts.map((v,i)=>`${pL+i*slotW+slotW/2},${toY(v)}`).join(' ');

  const last = candles[candles.length-1];
  const lastY = toY(last.close);
  const lastBull = last.close >= last.open;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{display:'block'}}>
      {yGrid.map((t,i) => (
        <g key={i}>
          <line x1={pL} y1={t.y} x2={width-pR} y2={t.y} stroke="rgba(255,255,255,.05)" strokeWidth={1} strokeDasharray="3,5" />
          <text x={width-pR+4} y={t.y+3.5} fill="rgba(255,255,255,.22)" fontSize={8} fontFamily="Share Tech Mono">${t.v.toFixed(0)}</text>
        </g>
      ))}
      {candles.map((c,i) => {
        const cx = pL+i*slotW+slotW/2;
        const bull = c.close>=c.open;
        const col  = bull?'#00c96e':'#f0436a';
        const bT = toY(Math.max(c.open,c.close));
        const bB = toY(Math.min(c.open,c.close));
        return (
          <g key={i}>
            <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={col} strokeWidth={1} opacity={0.6} />
            <rect x={cx-halfB} y={bT} width={bodyW} height={Math.max(1,bB-bT)} fill={col} fillOpacity={bull?0.9:0.8} stroke={col} strokeWidth={0.5} />
          </g>
        );
      })}
      <polyline points={maPath} fill="none" stroke="rgba(245,166,35,.7)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <line x1={pL} y1={lastY} x2={width-pR} y2={lastY} stroke={lastBull?'#00c96e':'#f0436a'} strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
      <rect x={width-pR+2} y={lastY-9} width={48} height={16} fill={lastBull?'rgba(0,201,110,.2)':'rgba(240,67,106,.2)'} rx={4} />
      <text x={width-pR+26} y={lastY+3.5} fill={lastBull?'#00c96e':'#f0436a'} fontSize={8.5} fontFamily="Share Tech Mono" textAnchor="middle">${last.close.toFixed(2)}</text>
    </svg>
  );
}

export default function TradePanel({ ticker, marketData, player, onBuy, onSell, tradeResult }) {
  const [mode,   setMode]   = useState('BUY');
  const [shares, setShares] = useState(1);
  const [flash,  setFlash]  = useState(null);
  const containerRef = useRef(null);
  const [chartW, setChartW] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(e => setChartW(e[0].contentRect.width || 600));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!tradeResult) return;
    setFlash(tradeResult);
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [tradeResult?._ts]);

  const s       = ticker ? marketData?.[ticker] : null;
  const holding = ticker ? player?.portfolio?.[ticker] : null;
  const cash    = player?.cash || 0;
  const price   = s?.price || 0;
  const cost    = shares * price;
  const canBuy  = cash >= cost && shares >= 1;
  const canSell = (holding?.shares || 0) >= shares && shares >= 1;
  const hist    = s?.history || [];
  const first   = hist[0] || price;
  const sessPct = first > 0 ? ((price-first)/first)*100 : 0;
  const up      = sessPct >= 0;
  const ind     = s?.indicators || {};

  const handleBuy  = () => { if (typeof onBuy  === 'function') onBuy(ticker,  shares); };
  const handleSell = () => { if (typeof onSell === 'function') onSell(ticker, shares); };

  if (!ticker || !s) return (
    <div style={{ background:'rgba(22,27,36,.95)', borderRadius:14, border:'1px solid rgba(255,255,255,.07)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:40, minHeight:200 }}>
      <span style={{ fontSize:40, opacity:.3 }}>📈</span>
      <span style={{ fontWeight:700, fontSize:14, color:'rgba(255,255,255,.4)' }}>Select a stock to trade</span>
      <span style={{ fontSize:12, color:'rgba(255,255,255,.2)' }}>← Choose from the market panel</span>
    </div>
  );

  return (
    <div ref={containerRef} style={{ background:'rgba(22,27,36,.95)', borderRadius:14, border:'1px solid rgba(255,255,255,.07)', overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ padding:'14px 18px', background: up?'rgba(0,201,110,.06)':'rgba(240,67,106,.06)', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'var(--fd)', fontSize:22, fontWeight:900, color: up?'#00c96e':'#f0436a', textShadow:`0 0 20px ${up?'rgba(0,201,110,.4)':'rgba(240,67,106,.4)'}` }}>{ticker}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>{s.name} · {s.sector}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:800, color:'rgba(255,255,255,.9)' }}>${price.toFixed(2)}</div>
          <div style={{ fontSize:11, color: up?'#00c96e':'#f0436a', marginTop:2 }}>{up?'▲':'▼'} {Math.abs(sessPct).toFixed(2)}% session</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background:'rgba(10,14,20,.8)', position:'relative' }}>
        <div style={{ position:'absolute', top:6, left:10, display:'flex', gap:12, zIndex:2 }}>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', fontFamily:'var(--fm)' }}>OHLC Candles</span>
          <span style={{ fontSize:9, color:'rgba(245,166,35,.55)', fontFamily:'var(--fm)' }}>— MA5</span>
        </div>
        <CandlestickChart history={hist} width={chartW} height={170} />
      </div>

      {/* Indicators */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        {[
          { l:'RSI',  v: ind.rsi      != null ? ind.rsi.toFixed(0)            : '—', col:(ind.rsi||50)>70?'#f0436a':(ind.rsi||50)<30?'#00c96e':'#f5a623' },
          { l:'MA5',  v: ind.ma5      != null ? `$${ind.ma5.toFixed(1)}`      : '—', col:'#0aafe6' },
          { l:'MA20', v: ind.ma20     != null ? `$${ind.ma20.toFixed(1)}`     : '—', col:'#9b6bff' },
          { l:'MOM',  v: ind.momentum != null ? `${ind.momentum.toFixed(1)}%` : '—', col:(ind.momentum||0)>=0?'#00c96e':'#f0436a' },
        ].map((x,i) => (
          <div key={x.l} style={{ padding:'10px 8px', textAlign:'center', background: i%2===0?'rgba(255,255,255,.02)':'transparent' }}>
            <div style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,.3)', marginBottom:3, letterSpacing:'.05em' }}>{x.l}</div>
            <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:700, color:x.col }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Holding */}
      {holding && (
        <div style={{ margin:'12px 16px 0', padding:'10px 14px', background:'rgba(0,201,110,.08)', border:'1px solid rgba(0,201,110,.2)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#00c96e', fontWeight:600 }}>📦 {holding.shares} shares held</span>
          <span style={{ fontFamily:'var(--fm)', fontSize:11, color:'rgba(255,255,255,.4)' }}>avg ${holding.avgCost?.toFixed(2)}</span>
        </div>
      )}

      {/* Trade controls */}
      <div style={{ padding:'14px 16px 16px' }}>

        {/* BUY / SELL */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          <button onClick={() => setMode('BUY')} style={{
            padding:'13px', borderRadius:12, fontWeight:800, fontSize:15,
            background: mode==='BUY' ? '#00c96e' : 'rgba(0,201,110,.08)',
            color: mode==='BUY' ? '#fff' : 'rgba(0,201,110,.6)',
            border: mode==='BUY' ? '2px solid #00c96e' : '2px solid rgba(0,201,110,.2)',
            boxShadow: mode==='BUY' ? '0 4px 20px rgba(0,201,110,.4)' : 'none',
            transition:'all .2s', letterSpacing:'.05em',
          }}>▲ BUY</button>
          <button onClick={() => setMode('SELL')} style={{
            padding:'13px', borderRadius:12, fontWeight:800, fontSize:15,
            background: mode==='SELL' ? '#f0436a' : 'rgba(240,67,106,.08)',
            color: mode==='SELL' ? '#fff' : 'rgba(240,67,106,.6)',
            border: mode==='SELL' ? '2px solid #f0436a' : '2px solid rgba(240,67,106,.2)',
            boxShadow: mode==='SELL' ? '0 4px 20px rgba(240,67,106,.4)' : 'none',
            transition:'all .2s', letterSpacing:'.05em',
          }}>▼ SELL</button>
        </div>

        {/* Shares */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,.35)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Shares</div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <button onClick={() => setShares(n=>Math.max(1,n-1))} style={{ width:38,height:38,borderRadius:9,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.7)',fontSize:20,flexShrink:0 }}>−</button>
            <input type="number" min={1} value={shares} onChange={e => setShares(Math.max(1,parseInt(e.target.value)||1))}
              style={{ flex:1,height:38,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:9,color:'#fff',fontFamily:'var(--fm)',fontSize:16,textAlign:'center' }} />
            <button onClick={() => setShares(n=>n+1)} style={{ width:38,height:38,borderRadius:9,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.7)',fontSize:20,flexShrink:0 }}>+</button>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            {[1,5,10,25].map(n => (
              <button key={n} onClick={() => setShares(n)} style={{
                flex:1, padding:'6px 0',
                background: shares===n?'rgba(10,175,230,.2)':'rgba(255,255,255,.04)',
                border:`1px solid ${shares===n?'rgba(10,175,230,.5)':'rgba(255,255,255,.08)'}`,
                borderRadius:7, color: shares===n?'#0aafe6':'rgba(255,255,255,.3)',
                fontFamily:'var(--fm)', fontSize:11, fontWeight:700,
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Cost */}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,.04)', borderRadius:10, marginBottom:12, border:'1px solid rgba(255,255,255,.06)' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>{mode==='BUY'?'Total Cost':'Proceeds'}</span>
          <span style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:700, color:'rgba(255,255,255,.85)' }}>${cost.toFixed(2)}</span>
        </div>

        {/* Warnings */}
        {mode==='BUY' && !canBuy && shares>=1 && (
          <div style={{ padding:'8px 12px', background:'rgba(245,166,35,.08)', border:'1px solid rgba(245,166,35,.2)', borderRadius:8, marginBottom:10, fontSize:11, color:'#f5a623' }}>
            ⚠️ Need ${(cost-cash).toFixed(2)} more cash
          </div>
        )}
        {mode==='SELL' && !canSell && shares>=1 && (
          <div style={{ padding:'8px 12px', background:'rgba(245,166,35,.08)', border:'1px solid rgba(245,166,35,.2)', borderRadius:8, marginBottom:10, fontSize:11, color:'#f5a623' }}>
            ⚠️ Only {holding?.shares||0} shares held
          </div>
        )}

        {/* Flash */}
        {flash && (
          <div style={{ padding:'10px 14px', marginBottom:10, borderRadius:10, fontSize:12, fontWeight:600, background: flash.success?'rgba(0,201,110,.12)':'rgba(240,67,106,.12)', border:`1px solid ${flash.success?'rgba(0,201,110,.3)':'rgba(240,67,106,.3)'}`, color: flash.success?'#00c96e':'#f0436a', animation:'fadeUp .2s ease' }}>
            {flash.success?'✅':'❌'} {flash.message}
          </div>
        )}

        {/* Execute */}
        <button onClick={mode==='BUY'?handleBuy:handleSell} disabled={mode==='BUY'?!canBuy:!canSell}
          style={{
            width:'100%', padding:'16px', borderRadius:12, fontSize:16, fontWeight:800,
            letterSpacing:'.06em', border:'none',
            background: mode==='BUY'
              ? (canBuy  ? 'linear-gradient(135deg,#00c96e,#00a85a)' : 'rgba(255,255,255,.05)')
              : (canSell ? 'linear-gradient(135deg,#f0436a,#c42b50)'  : 'rgba(255,255,255,.05)'),
            color: (mode==='BUY'?canBuy:canSell)?'#fff':'rgba(255,255,255,.2)',
            boxShadow: (mode==='BUY'&&canBuy)?'0 6px 24px rgba(0,201,110,.5)':(mode==='SELL'&&canSell)?'0 6px 24px rgba(240,67,106,.5)':'none',
            cursor: (mode==='BUY'?canBuy:canSell)?'pointer':'not-allowed',
            transition:'all .2s',
          }}>
          {mode==='BUY'?`▲ BUY ${shares} ${ticker}`:`▼ SELL ${shares} ${ticker}`}
        </button>

        <div style={{ marginTop:8, textAlign:'center', fontSize:10, color:'rgba(255,255,255,.2)' }}>
          Available cash: <span style={{ fontFamily:'var(--fm)', color:'rgba(255,255,255,.4)' }}>${cash.toLocaleString('en',{maximumFractionDigits:0})}</span>
        </div>
      </div>
    </div>
  );
}