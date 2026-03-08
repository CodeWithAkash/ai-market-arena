import { useState, useEffect, useRef } from 'react';

const AGENT_ICONS = {
  'YOU': '👤',
  'MomentumBot': '📈',
  'ValueBot': '🔍',
  'RiskBot': '🛡️',
  'RandomBot': '🎲',
  'RLBot': '🤖',
};

function RankBadge({ rank }) {
  const colors = {
    1: { bg: 'rgba(255,215,0,0.2)', border: '#ffd700', text: '#ffd700', icon: '👑' },
    2: { bg: 'rgba(180,200,220,0.15)', border: '#b0c8e0', text: '#b0c8e0', icon: '🥈' },
    3: { bg: 'rgba(200,140,80,0.15)', border: '#c88c50', text: '#c88c50', icon: '🥉' },
  };
  const style = colors[rank] || { bg: 'rgba(60,80,100,0.2)', border: 'rgba(100,140,180,0.3)', text: 'var(--text-muted)', icon: `#${rank}` };
  
  return (
    <div style={{
      width: '28px', height: '28px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: rank <= 3 ? '14px' : '12px',
      color: style.text,
      flexShrink: 0,
    }}>
      {style.icon}
    </div>
  );
}

export default function LeaderboardPanel({ leaderboard = [], startingCash = 10000 }) {
  const prevValues = useRef({});
  const [flashing, setFlashing] = useState({});

  useEffect(() => {
    const newFlashing = {};
    leaderboard.forEach(entry => {
      const prev = prevValues.current[entry.name];
      if (prev !== undefined && prev !== entry.value) {
        newFlashing[entry.name] = entry.value > prev ? 'up' : 'down';
      }
      prevValues.current[entry.name] = entry.value;
    });
    
    if (Object.keys(newFlashing).length > 0) {
      setFlashing(newFlashing);
      setTimeout(() => setFlashing({}), 500);
    }
  }, [leaderboard]);

  return (
    <div className="glass-panel" style={{
      borderRadius: '10px',
      border: '1px solid rgba(255,215,0,0.25)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(255,215,0,0.05)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '16px' }}>🏆</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px', letterSpacing: '0.2em',
          color: 'var(--neon-gold)',
        }}>
          BATTLE RANKINGS
        </span>
      </div>
      
      {/* Entries */}
      <div style={{ padding: '8px' }}>
        {leaderboard.map((entry, i) => {
          const flash = flashing[entry.name];
          const pct = entry.changePercent;
          const isUp = pct >= 0;
          
          return (
            <div
              key={entry.name}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 8px',
                borderRadius: '8px',
                background: entry.isPlayer
                  ? 'rgba(0,212,255,0.08)'
                  : flash ? `rgba(${flash === 'up' ? '0,255,136' : '255,0,136'}, 0.08)` : 'transparent',
                border: entry.isPlayer ? '1px solid rgba(0,212,255,0.25)' : '1px solid transparent',
                marginBottom: '4px',
                transition: 'background 0.3s ease',
                animation: flash ? 'fadeIn 0.3s ease' : 'none',
              }}
            >
              <RankBadge rank={i + 1} />
              
              <span style={{ fontSize: '16px' }}>{AGENT_ICONS[entry.name] || '🤖'}</span>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px', fontWeight: '700',
                  color: entry.isPlayer ? 'var(--neon-cyan)' : entry.color || 'var(--text-primary)',
                  textShadow: entry.isPlayer ? '0 0 10px var(--neon-cyan)' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {entry.name} {entry.isPlayer && '← YOU'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {entry.personality}
                </div>
              </div>
              
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px', fontWeight: '700',
                  color: flash === 'up' ? 'var(--neon-green)' : flash === 'down' ? 'var(--neon-pink)' : 'var(--text-primary)',
                  transition: 'color 0.3s',
                }}>
                  ${entry.value?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: isUp ? 'var(--neon-green)' : 'var(--neon-pink)',
                }}>
                  {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
