import { useState, useEffect } from 'react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TT = ({ active, payload }) => active && payload?.length
  ? <div style={{ background:'rgba(4,14,32,.95)', border:'1px solid rgba(0,212,255,.3)', borderRadius:6, padding:'6px 10px', fontFamily:'var(--fm)', fontSize:11, color:'var(--c)' }}>
      ${payload[0].value?.toFixed(2)}
    </div>
  : null;

export default function TradePanel({ ticker, marketData, player, onBuy, onSell, tradeResult }) {
  const [mode,   setMode]   = useState('BUY');
  const [shares, setShares] = useState(1);
  const [flash,  setFlash]  = useState(null);

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
  const chartData = hist.map((p, i) => ({ i, p }));
  const ind     = s?.indicators || {};

  useEffect(() => {
    if (!tradeResult) return;
    setFlash(tradeResult);
    const t = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(t);
  }, [tradeResult?._ts]);

  const handleBuy = () => {
    if (typeof onBuy === 'function') onBuy(ticker, shares);
  };

  const handleSell = () => {
    if (typeof onSell === 'function') onSell(ticker, shares);
  };

  if (!ticker || !s) return (
    <div className="glass" style={{ borderRadius:10, border:'1px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, flex:1 }}>
      <span style={{ fontSize:36, opacity:.3 }}>📈</span>
      <span style={{ fontFamily:'var(--fd)', color:'var(--t3)', fontSize:11, letterSpacing:'.2em' }}>SELECT A STOCK TO TRADE</span>
      <span style={{ fontFamily:'var(--fm)', color:'var(--t3)', fontSize:10 }}>← click any ticker from the market panel</span>
    </div>
  );

  return (
    <div className="glass" style={{ borderRadius:10, border:`1px solid ${up?'rgba(0,255,136,.25)':'rgba(255,0,136,.25)'}`, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ padding:'12px 18px', background: up?'rgba(0,255,136,.04)':'rgba(255,0,136,.04)', borderBottom:'1px solid rgba(0,212,255,.08)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:'var(--fd)', fontSize:22, fontWeight:900, color: up?'var(--g)':'var(--pink)', textShadow:`0 0 20px ${up?'var(--g)':'var(--pink)'}` }}>{ticker}</div>
          <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>{s.name} · {s.sector}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:700, color:'var(--t1)' }}>${price.toFixed(2)}</div>
          <div style={{ fontFamily:'var(--fm)', fontSize:10, color: up?'var(--g)':'var(--pink)' }}>
            {up?'▲':'▼'} {Math.abs(sessPct).toFixed(2)}% session
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div style={{ height:110, flexShrink:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top:8, right:8, bottom:0, left:0 }}>
              <Line type="monotone" dataKey="p" stroke={up?'#00ff88':'#ff0088'} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Tooltip content={<TT />} />
              <YAxis domain={['auto','auto']} hide />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Indicators */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, padding:'8px 14px', borderTop:'1px solid rgba(0,212,255,.07)', flexShrink:0 }}>
        {[
          { l:'RSI',  v: ind.rsi != null ? ind.rsi.toFixed(0) : '…',        col: (ind.rsi||50)>70?'var(--pink)':(ind.rsi||50)<30?'var(--g)':'var(--gold)' },
          { l:'MOM',  v: ind.momentum != null ? `${ind.momentum.toFixed(1)}%` : '…', col: (ind.momentum||0)>=0?'var(--g)':'var(--pink)' },
          { l:'VOL',  v: s.volatility != null ? `${(s.volatility*100).toFixed(1)}%` : '…', col:'var(--c)' },
        ].map(x => (
          <div key={x.l} style={{ background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.08)', borderRadius:6, padding:'5px 8px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--fm)', fontSize:8, color:'var(--t3)', marginBottom:2 }}>{x.l}</div>
            <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:700, color:x.col }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Holding info */}
      {holding && (
        <div style={{ margin:'0 14px 8px', padding:'7px 12px', background:'rgba(0,255,136,.07)', border:'1px solid rgba(0,255,136,.25)', borderRadius:7, display:'flex', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--g)' }}>📦 {holding.shares} shares held</span>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t2)' }}>avg ${holding.avgCost?.toFixed(2)}</span>
        </div>
      )}

      {/* Trade controls */}
      <div style={{ padding:'0 14px 14px', flexShrink:0 }}>

        {/* BUY / SELL tabs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
          {['BUY','SELL'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding:10,
              background: mode===m ? (m==='BUY'?'rgba(0,255,136,.2)':'rgba(255,0,136,.2)') : 'rgba(4,14,32,.7)',
              border:`1px solid ${mode===m ? (m==='BUY'?'var(--g)':'var(--pink)') : 'var(--border)'}`,
              borderRadius:7, fontFamily:'var(--fd)', fontSize:13, fontWeight:700,
              color: mode===m ? (m==='BUY'?'var(--g)':'var(--pink)') : 'var(--t3)',
              transition:'all .2s',
            }}>
              {m==='BUY'?'▲ BUY':'▼ SELL'}
            </button>
          ))}
        </div>

        {/* Shares input */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)', marginBottom:5 }}>SHARES</div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setShares(s => Math.max(1, s-1))} style={{ width:34, height:34, background:'rgba(0,212,255,.1)', border:'1px solid rgba(0,212,255,.25)', borderRadius:6, color:'var(--c)', fontSize:18 }}>−</button>
            <input
              type="number" min={1} value={shares}
              onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ flex:1, height:34, background:'rgba(4,14,32,.9)', border:'1px solid rgba(0,212,255,.25)', borderRadius:6, color:'var(--t1)', fontFamily:'var(--fm)', fontSize:14, textAlign:'center' }}
            />
            <button onClick={() => setShares(s => s+1)} style={{ width:34, height:34, background:'rgba(0,212,255,.1)', border:'1px solid rgba(0,212,255,.25)', borderRadius:6, color:'var(--c)', fontSize:18 }}>+</button>
          </div>
          <div style={{ display:'flex', gap:4, marginTop:5 }}>
            {[1,5,10,25].map(n => (
              <button key={n} onClick={() => setShares(n)} style={{
                flex:1, padding:'3px 0',
                background: shares===n ? 'rgba(0,212,255,.15)' : 'rgba(4,14,32,.7)',
                border:`1px solid ${shares===n ? 'var(--c)' : 'rgba(0,212,255,.12)'}`,
                borderRadius:4, color: shares===n ? 'var(--c)' : 'var(--t3)',
                fontFamily:'var(--fm)', fontSize:9,
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Cost display */}
        <div style={{ padding:'7px 12px', marginBottom:8, background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.1)', borderRadius:6, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t3)' }}>{mode==='BUY'?'COST':'PROCEEDS'}</span>
          <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--c)' }}>${cost.toFixed(2)}</span>
        </div>

        {/* Flash result message */}
        {flash && (
          <div style={{
            padding:'7px 12px', marginBottom:8,
            background: flash.success ? 'rgba(0,255,136,.1)' : 'rgba(255,0,136,.1)',
            border:`1px solid ${flash.success ? 'rgba(0,255,136,.35)' : 'rgba(255,0,136,.35)'}`,
            borderRadius:6, fontFamily:'var(--fm)', fontSize:10,
            color: flash.success ? 'var(--g)' : 'var(--pink)',
          }}>
            {flash.message}
          </div>
        )}

        {/* Execute button */}
        <button
          onClick={mode === 'BUY' ? handleBuy : handleSell}
          disabled={mode === 'BUY' ? !canBuy : !canSell}
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
            cursor: (mode==='BUY' ? canBuy : canSell) ? 'pointer' : 'not-allowed',
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