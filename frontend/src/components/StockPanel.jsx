import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function StockPanel({ marketData, selected, onSelect, portfolio }) {
  const tickers = Object.keys(marketData || {});

  if (tickers.length === 0) return (
    <div className="glass" style={{ borderRadius:10, border:'1px solid rgba(0,212,255,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'var(--fm)', fontSize:10, color:'var(--t3)' }}>Loading market data…</span>
    </div>
  );

  return (
    <div className="glass" style={{ borderRadius:10, border:'1px solid rgba(0,212,255,.2)', overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(0,212,255,.12)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontSize:14 }}>📊</span>
        <span style={{ fontFamily:'var(--fd)', fontSize:11, letterSpacing:'.2em', color:'var(--c)' }}>LIVE MARKET</span>
      </div>
      <div className="scroll" style={{ flex:1 }}>
        {tickers.map(ticker => {
          const s      = marketData[ticker];
          const hist   = s.history || [];
          const prev   = hist.length > 1 ? hist[hist.length-2] : s.price;
          const chg    = s.price - prev;
          const chgPct = prev > 0 ? (chg / prev) * 100 : 0;
          const up     = chg >= 0;
          const isSel  = selected === ticker;
          const held   = portfolio?.[ticker]?.shares > 0;
          const data   = hist.slice(-25).map((p, i) => ({ i, p }));

          return (
            <div key={ticker} onClick={() => typeof onSelect === 'function' && onSelect(ticker)}
              style={{
                padding:'10px 14px', cursor:'pointer',
                borderBottom:'1px solid rgba(0,212,255,.05)',
                background: isSel ? 'rgba(0,212,255,.09)' : held ? 'rgba(0,255,136,.03)' : 'transparent',
                borderLeft:`3px solid ${isSel ? 'var(--c)' : held ? 'var(--g)' : 'transparent'}`,
                transition:'all .18s',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, color: isSel ? 'var(--c)' : 'var(--t1)' }}>{ticker}</span>
                    {held && <span style={{ fontSize:8, padding:'1px 4px', background:'rgba(0,255,136,.18)', border:'1px solid var(--g)', borderRadius:3, color:'var(--g)', fontFamily:'var(--fm)' }}>HELD</span>}
                  </div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:9, color:'var(--t3)' }}>{s.sector}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:700, color: up ? 'var(--g)' : 'var(--pink)' }}>${s.price?.toFixed(2)}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:9, color: up ? 'var(--g)' : 'var(--pink)' }}>
                    {up?'▲':'▼'} {Math.abs(chgPct).toFixed(2)}%
                  </div>
                </div>
              </div>
              {data.length > 1 && (
                <ResponsiveContainer width="100%" height={32}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="p" stroke={up?'#00ff88':'#ff0088'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}