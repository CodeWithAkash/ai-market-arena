import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { useState } from 'react';

function MiniChart({ data, color, up }) {
  const chartData = data.map((price, i) => ({ i, price }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={up ? '#00ff88' : '#ff0088'}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function StockPanel({ marketData = {}, onSelectStock, selectedStock, playerPortfolio = {} }) {
  const tickers = Object.keys(marketData);

  return (
    <div className="glass-panel" style={{
      borderRadius: '10px',
      border: '1px solid rgba(0,212,255,0.2)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0,212,255,0.05)',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '16px' }}>📊</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.2em', color: 'var(--neon-cyan)' }}>
          LIVE MARKET
        </span>
      </div>

      <div className="scrollable" style={{ maxHeight: '420px' }}>
        {tickers.map(ticker => {
          const stock = marketData[ticker];
          if (!stock) return null;
          const history = stock.history || [];
          const prev = history.length > 1 ? history[history.length - 2] : stock.price;
          const change = stock.price - prev;
          const changePct = prev > 0 ? (change / prev) * 100 : 0;
          const isUp = change >= 0;
          const isSelected = selectedStock === ticker;
          const inPortfolio = playerPortfolio[ticker]?.shares > 0;
          
          return (
            <div
              key={ticker}
              onClick={() => onSelectStock(ticker)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(0,212,255,0.06)',
                background: isSelected ? 'rgba(0,212,255,0.1)' : inPortfolio ? 'rgba(0,255,136,0.04)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--neon-cyan)' : inPortfolio ? '3px solid var(--neon-green)' : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '13px', fontWeight: '700',
                      color: isSelected ? 'var(--neon-cyan)' : 'var(--text-primary)',
                    }}>
                      {ticker}
                    </span>
                    {inPortfolio && (
                      <span style={{
                        fontSize: '9px', padding: '1px 5px',
                        background: 'rgba(0,255,136,0.2)',
                        border: '1px solid var(--neon-green)',
                        borderRadius: '3px', color: 'var(--neon-green)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        HELD
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {stock.sector}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px', fontWeight: '700',
                    color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)',
                  }}>
                    ${stock.price?.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: '10px', fontFamily: 'var(--font-mono)',
                    color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)',
                  }}>
                    {isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
                  </div>
                </div>
              </div>
              <MiniChart data={history.slice(-20)} color={isUp ? '#00ff88' : '#ff0088'} up={isUp} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
