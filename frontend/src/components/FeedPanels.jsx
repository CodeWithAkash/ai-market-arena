import { useEffect, useRef } from 'react';

const AGENT_COLORS = {
  'YOU': '#ffffff',
  'MomentumBot': '#00ff88',
  'ValueBot': '#4488ff',
  'RiskBot': '#ff8800',
  'RandomBot': '#ff0088',
  'RLBot': '#cc44ff',
};

const AGENT_ICONS = {
  'YOU': '👤',
  'MomentumBot': '📈',
  'ValueBot': '🔍',
  'RiskBot': '🛡️',
  'RandomBot': '🎲',
  'RLBot': '🤖',
};

export function EventFeed({ events = [] }) {
  return (
    <div className="glass-panel" style={{
      borderRadius: '10px',
      border: '1px solid rgba(255,215,0,0.2)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '14px' }}>⚡</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--neon-gold)' }}>
          MARKET EVENTS
        </span>
      </div>
      <div style={{ maxHeight: '150px', overflow: 'hidden' }}>
        {events.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            Markets calm... for now
          </div>
        ) : (
          events.map((event, i) => (
            <div key={event.id || i} style={{
              padding: '8px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: i === 0 ? `rgba(${event.type === 'boom' ? '0,255,136' : event.type === 'crash' ? '255,0,136' : '255,215,0'}, 0.06)` : 'transparent',
              animation: i === 0 ? 'fadeIn 0.4s ease' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {event.message}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Tick {event.tick}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TradeFeed({ trades = [] }) {
  const feedRef = useRef(null);

  return (
    <div className="glass-panel" style={{
      borderRadius: '10px',
      border: '1px solid rgba(0,212,255,0.15)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '14px' }}>🔄</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--neon-cyan)' }}>
          TRADE FEED
        </span>
      </div>
      <div ref={feedRef} className="scrollable" style={{ maxHeight: '220px' }}>
        {trades.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            No trades yet...
          </div>
        ) : (
          trades.map((trade, i) => {
            const color = AGENT_COLORS[trade.agent] || '#aaa';
            const icon = AGENT_ICONS[trade.agent] || '🤖';
            const isBuy = trade.type === 'BUY';
            
            return (
              <div key={`${trade.timestamp}-${i}`} style={{
                padding: '7px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', gap: '8px',
                animation: i === 0 ? 'slideInLeft 0.3s ease' : 'none',
                background: i === 0 ? 'rgba(0,212,255,0.04)' : 'transparent',
              }}>
                <span style={{ fontSize: '12px', flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color, fontWeight: '700' }}>
                      {trade.agent}
                    </span>
                    <span style={{
                      fontSize: '9px', padding: '1px 4px',
                      background: isBuy ? 'rgba(0,255,136,0.15)' : 'rgba(255,0,136,0.15)',
                      border: `1px solid ${isBuy ? 'rgba(0,255,136,0.4)' : 'rgba(255,0,136,0.4)'}`,
                      borderRadius: '3px',
                      color: isBuy ? 'var(--neon-green)' : 'var(--neon-pink)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {trade.type}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-primary)' }}>
                      {trade.shares}x {trade.ticker}
                    </span>
                  </div>
                  {trade.reason && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {trade.reason}
                    </div>
                  )}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: 'var(--text-secondary)', flexShrink: 0,
                }}>
                  ${trade.price?.toFixed(2)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
