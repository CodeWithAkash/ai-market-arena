import { useState, useEffect, useRef, useMemo } from 'react';

function CandlestickChart({ history, width = 600, height = 140 }) {
  const candles = useMemo(() => {
    if (!history || history.length < 2) return [];
    const grouped = [];
    const size = 2;
    for (let i = 0; i < history.length - 1; i += size) {
      const slice = history.slice(i, i + size + 1);
      if (slice.length < 2) continue;
      grouped.push({
        open:  slice[0],
        close: slice[slice.length - 1],
        high:  Math.max(...slice),
        low:   Math.min(...slice),
      });
    }
    return grouped.slice(-40);
  }, [history]);

  if (candles.length < 2) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>Collecting data…</span>
    </div>
  );

  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const padV  = range * 0.08;
  const lo    = minP - padV;
  const hi    = maxP + padV;
  const totalRange = hi - lo;

  const padL = 8, padR = 8, padT = 8, padB = 18;
  const chartW = width  - padL - padR;
  const chartH = height - padT - padB;

  const toY = p => padT + chartH - ((p - lo) / totalRange) * chartH;

  const candleW  = Math.max(3, Math.floor(chartW / candles.length) - 2);
  const halfBody = Math.max(1.5, candleW / 2);

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const val = lo + (totalRange / (yTicks - 1)) * i;
    return { y: toY(val), label: `$${val.toFixed(0)}` };
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
      style={{ display:'block' }}>

      {yLabels.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={width - padR} y2={t.y}
            stroke="rgba(0,212,255,.07)" strokeWidth={1} strokeDasharray="3,4" />
          <text x={padL} y={t.y - 3} fill="rgba(0,212,255,.35)"
            fontSize={8} fontFamily="Share Tech Mono">{t.label}</text>
        </g>
      ))}

      {candles.map((c, i) => {
        const x    = padL + (i / candles.length) * chartW + (chartW / candles.length) / 2;
        const bull = c.close >= c.open;
        const col  = bull ? '#00ff88' : '#ff0088';
        const glow = bull ? 'rgba(0,255,136,.5)' : 'rgba(255,0,136,.5)';
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bodyH   = Math.max(1, bodyBot - bodyTop);
        const wickTop = toY(c.high);
        const wickBot = toY(c.low);
        return (
          <g key={i}>
            <line x1={x} y1={wickTop} x2={x} y2={wickBot} stroke={col} strokeWidth={1} opacity={0.7} />
            <rect x={x - halfBody} y={bodyTop} width={candleW} height={bodyH}
              fill={col} fillOpacity={bull ? 0.85 : 0.75}
              stroke={col} strokeWidth={0.5}
              style={{ filter:`drop-shadow(0 0 3px ${glow})` }} />
          </g>
        );
      })}

      {(() => {
        const closes = candles.map(c => c.close);
        const ma = closes.map((_, i) => {
          const slice = closes.slice(Math.max(0, i - 4), i + 1);
          return slice.reduce((a, b) => a + b, 0) / slice.length;
        });
        const points = ma.map((v, i) => {
          const x = padL + (i / candles.length) * chartW + (chartW / candles.length) / 2;
          return `${x},${toY(v)}`;
        }).join(' ');
        return <polyline points={points} fill="none" stroke="rgba(255,215,0,.6)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />;
      })()}

      {candles.length > 0 && (() => {
        const last = candles[candles.length - 1].close;
        const y    = toY(last);
        const bull = candles[candles.length-1].close >= candles[candles.length-1].open;
        return (
          <g>
            <line x1={padL} y1={y} x2={width - padR} y2={y}
              stroke={bull ? '#00ff88' : '#ff0088'} strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
            <rect x={width - padR - 42} y={y - 8} width={42} height={14}
              fill={bull ? 'rgba(0,255,136,.18)' : 'rgba(255,0,136,.18)'} rx={3} />
            <text x={width - padR - 21} y={y + 3.5}
              fill={bull ? '#00ff88' : '#ff0088'}
              fontSize={8} fontFamily="Share Tech Mono" textAnchor="middle">
              ${last.toFixed(2)}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

const TooltipEl = ({ msg, success }) => (
  <div style={{
    padding:'7px 12px', marginBottom:8,
    background: success ? 'rgba(0,255,136,.1)' : 'rgba(255,0,136,.1)',
    border:`1px solid ${success ? 'rgba(0,255,136,.35)' : 'rgba(255,0,136,.35)'}`,
    borderRadius:6, fontFamily:'var(--fm)', fontSize:10,
    color: success ? 'var(--g)' : 'var(--pink)',
  }}>{msg}</div>
);

export default function TradePanel({ ticker, marketData, player, onBuy, onSell, tradeResult }) {
  const [mode,   setMode]   = useState('BUY');
  const [shares, setShares] = useState(1);
  const [flash,  setFlash]  = useState(null);
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setChartWidth(entries[0].contentRect.width || 600);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const s       = ticker ? marketData?.[ticker] : null;
  const holding = ticker ? player?.portfolio?.[ticker] : null;
  const cash    = player?.cash || 0;
  const price   = s?.price || 0;
  const cost    = shares * price;
  const canBuy  = cash >= cost && shares >= 1;
  const canSell = (holding?.shares || 0) >= shares && shares >= 1;
  const hist    = s?.history || [];
  const first   = hist[0] || price;
  const sessPct = first > 0 ? ((price - first) / first) * 100 : 0;
  const up      = sessPct >= 0;
  const ind     = s?.indicators || {};

  useEffect(() => {
    if (!tradeResult) return;
    setFlash(tradeResult);
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [tradeResult?._ts]);

  const handleBuy  = () => { if (typeof onBuy  === 'function') onBuy(ticker,  shares); };
  const handleSell = () => { if (typeof onSell === 'function') onSell(ticker, shares); };

  if (!ticker || !s) return (
    <div className="glass" style={{ borderRadius:10, border:'1px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, flex:1, minHeight:180 }}>
      <span style={{ fontSize:36, opacity:.3 }}>📈</span>
      <span style={{ fontFamily:'var(--fd)', color:'var(--t3)', fontSize:11, letterSpacing:'.2em' }}>SELECT A STOCK TO TRADE</span>
      <span style={{ fontFamily:'var(--fm)', color:'var(--t3)', fontSize:10 }}>← click any ticker from the market panel</span>
    </div>
  );

  return (
    <div ref={containerRef} className="glass scroll"
      style={{
        borderRadius:10,
        border:`1px solid ${up?'rgba(0,255,136,.25)':'rgba(255,0,136,.25)'}`,
        overflow:'auto',
        display:'flex', flexDirection:'column',
        flex:1,
      }}>

      <div style={{ padding:'12px 18px', background: up?'rgba(0,255,136,.04)':'rgba(255,0,136,.04)', borderBottom:'1px solid rgba(0,212,255,.08)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:'var(--fd)', fontSize:24, fontWeight:900, color: up?'var(--g)':'var(--pink)', textShadow:`0 0 20px ${up?'var(--g)':'var(--pink)'}` }}>{ticker}</div>
          <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>{s.name} · {s.sector}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:700, color:'var(--t1)' }}>${price.toFixed(2)}</div>
          <div style={{ fontFamily:'var(--fm)', fontSize:10, color: up?'var(--g)':'var(--pink)' }}>
            {up?'▲':'▼'} {Math.abs(sessPct).toFixed(2)}% session
          </div>
        </div>
      </div>

      <div style={{ background:'rgba(1,4,12,.7)', borderBottom:'1px solid rgba(0,212,255,.08)', flexShrink:0, position:'relative' }}>
        <div style={{ position:'absolute', top:6, right:10, display:'flex', gap:10, zIndex:2 }}>
          <span style={{ fontFamily:'var(--fm)', fontSize:8, color:'rgba(0,255,136,.7)', display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ display:'inline-block', width:12, height:2, background:'rgba(0,255,136,.8)' }} />BULL
          </span>
          <span style={{ fontFamily:'var(--fm)', fontSize:8, color:'rgba(255,0,136,.7)', display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ display:'inline-block', width:12, height:2, background:'rgba(255,0,136,.8)' }} />BEAR
          </span>
          <span style={{ fontFamily:'var(--fm)', fontSize:8, color:'rgba(255,215,0,.7)', display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ display:'inline-block', width:12, height:2, background:'rgba(255,215,0,.6)' }} />MA5
          </span>
        </div>
        <CandlestickChart history={hist} width={chartWidth} height={155} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, padding:'8px 14px', borderBottom:'1px solid rgba(0,212,255,.07)', flexShrink:0 }}>
        {[
          { l:'RSI',  v: ind.rsi      != null ? ind.rsi.toFixed(0)            : '…', col:(ind.rsi||50)>70?'var(--pink)':(ind.rsi||50)<30?'var(--g)':'var(--gold)' },
          { l:'MA5',  v: ind.ma5      != null ? `$${ind.ma5.toFixed(1)}`      : '…', col:'var(--c)' },
          { l:'MA20', v: ind.ma20     != null ? `$${ind.ma20.toFixed(1)}`     : '…', col:'var(--pur)' },
          { l:'MOM',  v: ind.momentum != null ? `${ind.momentum.toFixed(1)}%` : '…', col:(ind.momentum||0)>=0?'var(--g)':'var(--pink)' },
        ].map(x => (
          <div key={x.l} style={{ background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.08)', borderRadius:6, padding:'5px 8px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--fm)', fontSize:7, color:'var(--t3)', marginBottom:2 }}>{x.l}</div>
            <div style={{ fontFamily:'var(--fm)', fontSize:11, fontWeight:700, color:x.col }}>{x.v}</div>
          </div>
        ))}
      </div>

      {holding && (
        <div style={{ margin:'8px 14px 0', padding:'7px 12px', background:'rgba(0,255,136,.07)', border:'1px solid rgba(0,255,136,.25)', borderRadius:7, display:'flex', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--g)' }}>📦 {holding.shares} shares held</span>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t2)' }}>avg ${holding.avgCost?.toFixed(2)}</span>
        </div>
      )}

      <div style={{ padding:'10px 14px 14px', flexShrink:0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
          {['BUY','SELL'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding:10,
              background: mode===m ? (m==='BUY'?'rgba(0,255,136,.2)':'rgba(255,0,136,.2)') : 'rgba(4,14,32,.7)',
              border:`1px solid ${mode===m ? (m==='BUY'?'var(--g)':'var(--pink)') : 'var(--border)'}`,
              borderRadius:7, fontFamily:'var(--fd)', fontSize:13, fontWeight:700,
              color: mode===m ? (m==='BUY'?'var(--g)':'var(--pink)') : 'var(--t3)',
              boxShadow: mode===m ? `0 0 14px ${m==='BUY'?'rgba(0,255,136,.3)':'rgba(255,0,136,.3)'}` : 'none',
              transition:'all .2s',
            }}>{m==='BUY'?'▲ BUY':'▼ SELL'}</button>
          ))}
        </div>

        <div style={{ marginBottom:8 }}>
          <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)', marginBottom:5 }}>SHARES</div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setShares(n => Math.max(1, n-1))} style={{ width:34,height:34,background:'rgba(0,212,255,.1)',border:'1px solid rgba(0,212,255,.25)',borderRadius:6,color:'var(--c)',fontSize:18 }}>−</button>
            <input type="number" min={1} value={shares}
              onChange={e => setShares(Math.max(1, parseInt(e.target.value)||1))}
              style={{ flex:1,height:34,background:'rgba(4,14,32,.9)',border:'1px solid rgba(0,212,255,.25)',borderRadius:6,color:'var(--t1)',fontFamily:'var(--fm)',fontSize:14,textAlign:'center' }}
            />
            <button onClick={() => setShares(n => n+1)} style={{ width:34,height:34,background:'rgba(0,212,255,.1)',border:'1px solid rgba(0,212,255,.25)',borderRadius:6,color:'var(--c)',fontSize:18 }}>+</button>
          </div>
          <div style={{ display:'flex', gap:4, marginTop:5 }}>
            {[1,5,10,25].map(n => (
              <button key={n} onClick={() => setShares(n)} style={{
                flex:1, padding:'3px 0',
                background: shares===n?'rgba(0,212,255,.15)':'rgba(4,14,32,.7)',
                border:`1px solid ${shares===n?'var(--c)':'rgba(0,212,255,.12)'}`,
                borderRadius:4, color: shares===n?'var(--c)':'var(--t3)',
                fontFamily:'var(--fm)', fontSize:9,
              }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ padding:'7px 12px', marginBottom:8, background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.1)', borderRadius:6, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t3)' }}>{mode==='BUY'?'COST':'PROCEEDS'}</span>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--c)' }}>${cost.toFixed(2)}</span>
        </div>

        {flash && <TooltipEl msg={flash.message} success={flash.success} />}

        <button
          onClick={mode==='BUY' ? handleBuy : handleSell}
          disabled={mode==='BUY' ? !canBuy : !canSell}
          style={{
            width:'100%', padding:14, borderRadius:8,
            fontFamily:'var(--fd)', fontSize:13, fontWeight:700, letterSpacing:'.1em',
            background: mode==='BUY'
              ? (canBuy  ? 'linear-gradient(135deg,rgba(0,255,136,.25),rgba(0,200,100,.15))' : 'rgba(4,14,32,.7)')
              : (canSell ? 'linear-gradient(135deg,rgba(255,0,136,.25),rgba(200,0,80,.15))'  : 'rgba(4,14,32,.7)'),
            border: mode==='BUY'
              ? `1px solid ${canBuy  ? 'var(--g)'    : 'var(--border)'}`
              : `1px solid ${canSell ? 'var(--pink)' : 'var(--border)'}`,
            color: mode==='BUY'
              ? (canBuy  ? 'var(--g)'    : 'var(--t3)')
              : (canSell ? 'var(--pink)' : 'var(--t3)'),
            boxShadow: (mode==='BUY'&&canBuy)?'0 0 18px rgba(0,255,136,.28)':(mode==='SELL'&&canSell)?'0 0 18px rgba(255,0,136,.28)':'none',
            cursor: (mode==='BUY'?canBuy:canSell) ? 'pointer' : 'not-allowed',
            transition:'all .22s',
          }}>
          {mode==='BUY' ? `▲ BUY ${shares} ${ticker}` : `▼ SELL ${shares} ${ticker}`}
        </button>

        <div style={{ marginTop:5, textAlign:'right', fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>
          Cash: ${cash.toFixed(2)}
        </div>
      </div>
    </div>
  );
}