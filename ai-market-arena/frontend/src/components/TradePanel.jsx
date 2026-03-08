import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(5,18,40,0.95)', border: '1px solid rgba(0,212,255,0.3)',
        borderRadius: '6px', padding: '8px 12px',
        fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--neon-cyan)',
      }}>
        ${payload[0].value?.toFixed(2)}
      </div>
    );
  }
  return null;
};

export default function TradePanel({ selectedStock, marketData, playerData, onBuy, onSell, tradeResult }) {
  const [shares, setShares] = useState(1);
  const [mode, setMode] = useState('BUY');
  const [resultMsg, setResultMsg] = useState(null);

  const stock = selectedStock ? marketData?.[selectedStock] : null;
  const holding = selectedStock ? playerData?.portfolio?.[selectedStock] : null;
  const cash = playerData?.cash || 0;

  const chartData = stock?.history?.map((price, i) => ({ i, price })) || [];
  const currentPrice = stock?.price || 0;
  const costEstimate = shares * currentPrice;
  const canBuy = cash >= costEstimate && shares > 0;
  const canSell = (holding?.shares || 0) >= shares && shares > 0;

  useEffect(() => {
    if (tradeResult) {
      setResultMsg(tradeResult);
      const t = setTimeout(() => setResultMsg(null), 2000);
      return () => clearTimeout(t);
    }
  }, [tradeResult]);

  const handleTrade = () => {
    if (mode === 'BUY') onBuy(selectedStock, shares);
    else onSell(selectedStock, shares);
  };

  if (!selectedStock || !stock) {
    return (
      <div className="glass-panel" style={{
        borderRadius: '10px', padding: '32px',
        border: '1px solid rgba(0,212,255,0.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '12px', minHeight: '300px',
      }}>
        <span style={{ fontSize: '40px', opacity: 0.4 }}>📈</span>
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.2em' }}>
          SELECT A STOCK TO TRADE
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '10px' }}>
          Click any ticker from the market panel
        </div>
      </div>
    );
  }

  const history = stock.history || [];
  const firstPrice = history[0] || currentPrice;
  const totalChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const isUp = totalChange >= 0;
  const indicators = stock.indicators || {};

  return (
    <div className="glass-panel" style={{
      borderRadius: '10px',
      border: `1px solid ${isUp ? 'rgba(0,255,136,0.25)' : 'rgba(255,0,136,0.25)'}`,
      overflow: 'hidden',
    }}>
      {/* Stock header */}
      <div style={{
        padding: '14px 18px',
        background: isUp ? 'rgba(0,255,136,0.05)' : 'rgba(255,0,136,0.05)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '900',
            color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)',
            textShadow: `0 0 20px ${isUp ? 'var(--neon-green)' : 'var(--neon-pink)'}`,
          }}>
            {selectedStock}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
            {stock.name} · {stock.sector}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: '700',
            color: 'var(--text-primary)',
          }}>
            ${currentPrice.toFixed(2)}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '12px',
            color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)',
          }}>
            {isUp ? '▲' : '▼'} {Math.abs(totalChange).toFixed(2)}% session
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div style={{ padding: '0 8px', height: '120px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <Line
              type="monotone" dataKey="price"
              stroke={isUp ? '#00ff88' : '#ff0088'}
              strokeWidth={2} dot={false}
              isAnimationActive={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <YAxis domain={['auto', 'auto']} hide />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Indicators */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px', padding: '10px 14px',
        borderTop: '1px solid rgba(0,212,255,0.08)',
      }}>
        {[
          { label: 'RSI', value: indicators.rsi?.toFixed(0), color: indicators.rsi > 70 ? 'var(--neon-pink)' : indicators.rsi < 30 ? 'var(--neon-green)' : 'var(--neon-gold)' },
          { label: 'MOM', value: `${indicators.momentum?.toFixed(1)}%`, color: (indicators.momentum || 0) >= 0 ? 'var(--neon-green)' : 'var(--neon-pink)' },
          { label: 'VOL', value: `${((stock.volatility || 0) * 100).toFixed(1)}%`, color: 'var(--neon-cyan)' },
        ].map(ind => (
          <div key={ind.label} style={{
            background: 'rgba(0,212,255,0.05)', borderRadius: '6px',
            padding: '6px', textAlign: 'center',
            border: '1px solid rgba(0,212,255,0.1)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>{ind.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '700', color: ind.color }}>{ind.value}</div>
          </div>
        ))}
      </div>

      {/* Holding info */}
      {holding && (
        <div style={{
          margin: '0 14px 10px',
          padding: '8px 12px',
          background: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.25)',
          borderRadius: '6px',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--neon-green)' }}>
            📦 Holding: {holding.shares} shares
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Avg: ${holding.avgCost?.toFixed(2)}
          </span>
        </div>
      )}

      {/* Trade controls */}
      <div style={{ padding: '0 14px 14px' }}>
        {/* BUY / SELL tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '6px', marginBottom: '12px',
        }}>
          {['BUY', 'SELL'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '10px',
                background: mode === m
                  ? m === 'BUY' ? 'rgba(0,255,136,0.2)' : 'rgba(255,0,136,0.2)'
                  : 'rgba(5,18,40,0.6)',
                border: mode === m
                  ? `1px solid ${m === 'BUY' ? 'var(--neon-green)' : 'var(--neon-pink)'}`
                  : '1px solid rgba(0,212,255,0.15)',
                borderRadius: '6px',
                color: mode === m
                  ? m === 'BUY' ? 'var(--neon-green)' : 'var(--neon-pink)'
                  : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontSize: '13px', fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mode === m
                  ? `0 0 15px ${m === 'BUY' ? 'rgba(0,255,136,0.3)' : 'rgba(255,0,136,0.3)'}`
                  : 'none',
              }}
            >
              {m === 'BUY' ? '▲ BUY' : '▼ SELL'}
            </button>
          ))}
        </div>

        {/* Shares input */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--text-muted)', display: 'block', marginBottom: '6px',
          }}>
            SHARES
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShares(s => Math.max(1, s - 1))} style={{
              width: '36px', height: '36px',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: '6px', color: 'var(--neon-cyan)',
              cursor: 'pointer', fontSize: '18px',
            }}>−</button>
            <input
              type="number" min="1" value={shares}
              onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                flex: 1, height: '36px',
                background: 'rgba(5,18,40,0.8)',
                border: '1px solid rgba(0,212,255,0.25)',
                borderRadius: '6px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: '14px',
                textAlign: 'center', outline: 'none',
              }}
            />
            <button onClick={() => setShares(s => s + 1)} style={{
              width: '36px', height: '36px',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: '6px', color: 'var(--neon-cyan)',
              cursor: 'pointer', fontSize: '18px',
            }}>+</button>
          </div>
          
          {/* Quick amounts */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
            {[1, 5, 10, 25].map(n => (
              <button key={n} onClick={() => setShares(n)} style={{
                flex: 1, padding: '4px',
                background: shares === n ? 'rgba(0,212,255,0.15)' : 'rgba(5,18,40,0.6)',
                border: `1px solid ${shares === n ? 'var(--neon-cyan)' : 'rgba(0,212,255,0.12)'}`,
                borderRadius: '4px', color: shares === n ? 'var(--neon-cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer',
              }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Cost estimate */}
        <div style={{
          padding: '8px 12px', marginBottom: '10px',
          background: 'rgba(0,212,255,0.05)',
          border: '1px solid rgba(0,212,255,0.1)',
          borderRadius: '6px',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {mode === 'BUY' ? 'COST' : 'PROCEEDS'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--neon-cyan)' }}>
            ${costEstimate.toFixed(2)}
          </span>
        </div>

        {/* Result message */}
        {resultMsg && (
          <div style={{
            padding: '8px 12px', marginBottom: '8px',
            background: resultMsg.success ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,136,0.1)',
            border: `1px solid ${resultMsg.success ? 'rgba(0,255,136,0.3)' : 'rgba(255,0,136,0.3)'}`,
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            color: resultMsg.success ? 'var(--neon-green)' : 'var(--neon-pink)',
            animation: 'fadeIn 0.3s ease',
          }}>
            {resultMsg.success ? '✓ ' : '✗ '}{resultMsg.message || (resultMsg.success ? 'Trade executed!' : 'Trade failed')}
          </div>
        )}

        {/* Execute button */}
        <button
          onClick={handleTrade}
          disabled={mode === 'BUY' ? !canBuy : !canSell}
          style={{
            width: '100%', padding: '14px',
            background: mode === 'BUY'
              ? canBuy ? 'linear-gradient(135deg, rgba(0,255,136,0.25), rgba(0,200,100,0.15))' : 'rgba(5,18,40,0.6)'
              : canSell ? 'linear-gradient(135deg, rgba(255,0,136,0.25), rgba(200,0,100,0.15))' : 'rgba(5,18,40,0.6)',
            border: mode === 'BUY'
              ? `1px solid ${canBuy ? 'var(--neon-green)' : 'rgba(0,212,255,0.15)'}`
              : `1px solid ${canSell ? 'var(--neon-pink)' : 'rgba(0,212,255,0.15)'}`,
            borderRadius: '8px',
            color: mode === 'BUY'
              ? canBuy ? 'var(--neon-green)' : 'var(--text-muted)'
              : canSell ? 'var(--neon-pink)' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: '14px', fontWeight: '700',
            cursor: (mode === 'BUY' ? canBuy : canSell) ? 'pointer' : 'not-allowed',
            letterSpacing: '0.1em',
            boxShadow: (mode === 'BUY' && canBuy)
              ? '0 0 20px rgba(0,255,136,0.3)'
              : (mode === 'SELL' && canSell) ? '0 0 20px rgba(255,0,136,0.3)' : 'none',
            transition: 'all 0.25s',
          }}
        >
          {mode === 'BUY' ? `▲ BUY ${shares} ${selectedStock}` : `▼ SELL ${shares} ${selectedStock}`}
        </button>
        
        <div style={{
          marginTop: '6px', textAlign: 'right',
          fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)',
        }}>
          Cash: ${cash.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
