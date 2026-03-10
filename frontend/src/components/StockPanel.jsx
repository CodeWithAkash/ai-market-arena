import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function StockPanel({ marketData, selected, onSelect, portfolio }) {
  const tickers = Object.keys(marketData || {});
  return (
    <div style={{background:'linear-gradient(160deg,rgba(10,65,116,.95),rgba(0,29,57,.92))',borderRadius:14,border:'1px solid rgba(123,189,232,.1)',overflow:'hidden',display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'13px 16px',borderBottom:'1px solid rgba(123,189,232,.07)',flexShrink:0}}>
        <div style={{fontFamily:'var(--fd)',fontSize:10,fontWeight:800,color:'var(--t3)',letterSpacing:'.12em',textTransform:'uppercase'}}>📊 Live Market</div>
      </div>
      <div className="scroll" style={{flex:1}}>
        {tickers.length===0&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--t4)'}}>Loading…</div>}
        {tickers.map(ticker=>{
          const s=marketData[ticker];
          const hist=s.history||[];
          const prev=hist.length>1?hist[hist.length-2]:s.price;
          const chg=s.price-prev;
          const chgPct=prev>0?(chg/prev)*100:0;
          const up=chg>=0;
          const isSel=selected===ticker;
          const held=(portfolio?.[ticker]?.shares||0)>0;
          const data=hist.slice(-20).map((p,i)=>({i,p}));
          return(
            <div key={ticker} onClick={()=>typeof onSelect==='function'&&onSelect(ticker)}
              style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid rgba(123,189,232,.05)',background:isSel?'rgba(123,189,232,.12)':held?'rgba(61,232,154,.05)':'transparent',borderLeft:`3px solid ${isSel?'var(--sky)':held?'var(--g)':'transparent'}`,transition:'all .15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                    <span style={{fontFamily:'var(--fd)',fontSize:12,fontWeight:800,color:isSel?'var(--sky)':'var(--t1)'}}>{ticker}</span>
                    {held&&<span style={{fontSize:8,padding:'1px 5px',background:'rgba(61,232,154,.15)',border:'1px solid rgba(61,232,154,.3)',borderRadius:4,color:'var(--g)',fontFamily:'var(--fm)',fontWeight:700}}>HELD</span>}
                  </div>
                  <div style={{fontSize:9,color:'var(--t4)',fontWeight:500}}>{s.sector}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'var(--fm)',fontSize:12,fontWeight:700,color:up?'var(--g)':'var(--pink)'}}>${s.price?.toFixed(2)}</div>
                  <div style={{fontFamily:'var(--fm)',fontSize:9,color:up?'rgba(61,232,154,.7)':'rgba(255,92,122,.7)'}}>{up?'▲':'▼'}{Math.abs(chgPct).toFixed(2)}%</div>
                </div>
              </div>
              {data.length>1&&(
                <ResponsiveContainer width="100%" height={26}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="p" stroke={up?'#3DE89A':'#FF5C7A'} strokeWidth={1.5} dot={false} isAnimationActive={false}/>
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