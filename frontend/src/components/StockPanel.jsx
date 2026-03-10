import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function StockPanel({ marketData, selected, onSelect, portfolio }) {
  const tickers = Object.keys(marketData || {});

  return (
    <div style={{ background:'rgba(22,27,36,.95)', borderRadius:14, border:'1px solid rgba(255,255,255,.07)', overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:'.1em', textTransform:'uppercase' }}>📊 Live Market</div>
      </div>
      <div className="scroll" style={{ flex:1 }}>
        {tickers.length === 0 && (
          <div style={{ padding:20, textAlign:'center', fontSize:11, color:'rgba(255,255,255,.2)' }}>Loading…</div>
        )}
        {tickers.map(ticker => {
          const s      = marketData[ticker];
          const hist   = s.history || [];
          const prev   = hist.length > 1 ? hist[hist.length-2] : s.price;
          const chg    = s.price - prev;
          const chgPct = prev > 0 ? (chg / prev) * 100 : 0;
          const up     = chg >= 0;
          const isSel  = selected === ticker;
          const held   = (portfolio?.[ticker]?.shares || 0) > 0;
          const data   = hist.slice(-20).map((p, i) => ({ i, p }));

          return (
            <div key={ticker} onClick={() => typeof onSelect === 'function' && onSelect(ticker)}
              style={{
                padding:'10px 14px', cursor:'pointer',
                borderBottom:'1px solid rgba(255,255,255,.04)',
                background: isSel ? 'rgba(10,175,230,.12)' : held ? 'rgba(0,201,110,.05)' : 'transparent',
                borderLeft:`3px solid ${isSel?'#0aafe6':held?'#00c96e':'transparent'}`,
                transition:'all .15s',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontFamily:'var(--fd)', fontSize:12, fontWeight:700, color: isSel?'#0aafe6':'rgba(255,255,255,.85)' }}>{ticker}</span>
                    {held && <span style={{ fontSize:8, padding:'1px 5px', background:'rgba(0,201,110,.2)', border:'1px solid rgba(0,201,110,.4)', borderRadius:4, color:'#00c96e', fontFamily:'var(--fm)' }}>HELD</span>}
                  </div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.25)' }}>{s.sector}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--fm)', fontSize:12, fontWeight:700, color: up?'#00c96e':'#f0436a' }}>${s.price?.toFixed(2)}</div>
                  <div style={{ fontSize:9, color: up?'rgba(0,201,110,.7)':'rgba(240,67,106,.7)' }}>
                    {up?'▲':'▼'}{Math.abs(chgPct).toFixed(2)}%
                  </div>
                </div>
              </div>
              {data.length > 1 && (
                <ResponsiveContainer width="100%" height={28}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="p" stroke={up?'#00c96e':'#f0436a'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
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