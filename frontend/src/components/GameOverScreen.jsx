import { useState, useEffect } from 'react';
import { saveScore } from '../utils/api';

const AGENT_ICONS = {
  'YOU': '👤', 'MomentumBot': '📈', 'ValueBot': '🔍',
  'RiskBot': '🛡️', 'RandomBot': '🎲', 'RLBot': '🤖',
};

export default function GameOverScreen({ gameState, onPlayAgain }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [animate, setAnimate] = useState(false);

  const leaderboard = gameState?.leaderboard || [];
  const playerEntry = leaderboard.find(e => e.isPlayer);
  const playerRank = leaderboard.findIndex(e => e.isPlayer) + 1;
  const agentsBeaten = leaderboard.filter((e, i) => !e.isPlayer && i > leaderboard.findIndex(e => e.isPlayer)).length;
  const totalAgents = leaderboard.filter(e => !e.isPlayer).length;
  const pct = playerEntry?.changePercent || 0;
  const isWinner = playerRank === 1;
  const isProfit = pct >= 0;

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSaveScore = async () => {
    setSaving(true);
    try {
      await saveScore({
        playerName: playerName || 'Anonymous',
        finalValue: playerEntry?.value || 10000,
        startingCash: 10000,
        profitPercent: pct,
        totalTrades: gameState?.player?.tradeHistory?.length || 0,
        rank: playerRank,
        agentsBeaten,
        totalAgents,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const rankMessages = {
    1: { title: '🏆 CHAMPION!', sub: 'You defeated all AI agents!', color: 'var(--neon-gold)' },
    2: { title: '🥈 STRONG FINISH', sub: 'Almost beat the top bot!', color: '#b0c8e0' },
    3: { title: '🥉 RESPECTABLE', sub: 'You held your ground', color: '#c88c50' },
  };
  const rankMsg = rankMessages[playerRank] || { title: `#${playerRank} FINISH`, sub: 'Better luck next time', color: 'var(--text-secondary)' };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at center, rgba(0,30,60,0.8) 0%, var(--bg-deep) 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background rings */}
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${200 + i * 150}px`, height: `${200 + i * 150}px`,
          border: `1px solid rgba(0,212,255,${0.08 - i * 0.015})`,
          borderRadius: '50%',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `spin-slow ${8 + i * 4}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
        }} />
      ))}

      <div style={{
        zIndex: 10, maxWidth: '800px', width: '100%',
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        {/* Main result */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 56px)',
            fontWeight: '900',
            color: rankMsg.color,
            textShadow: `0 0 40px ${rankMsg.color}`,
            marginBottom: '8px',
          }}>
            {rankMsg.title}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--text-secondary)', letterSpacing: '0.2em' }}>
            {rankMsg.sub}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'FINAL VALUE', value: `$${playerEntry?.value?.toLocaleString('en', { maximumFractionDigits: 0 })}`, color: 'var(--neon-cyan)' },
            { label: 'P&L', value: `${isProfit ? '+' : ''}${pct.toFixed(2)}%`, color: isProfit ? 'var(--neon-green)' : 'var(--neon-pink)' },
            { label: 'FINAL RANK', value: `#${playerRank}`, color: rankMsg.color },
            { label: 'BOTS BEATEN', value: `${agentsBeaten}/${totalAgents}`, color: 'var(--neon-gold)' },
          ].map(stat => (
            <div key={stat.label} className="glass-panel" style={{
              padding: '16px', borderRadius: '10px', textAlign: 'center',
              border: '1px solid rgba(0,212,255,0.2)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.15em' }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(16px, 2.5vw, 24px)',
                fontWeight: '900', color: stat.color,
                textShadow: `0 0 15px ${stat.color}`,
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Final leaderboard */}
        <div className="glass-panel" style={{ borderRadius: '10px', border: '1px solid rgba(255,215,0,0.2)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,215,0,0.15)', fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.2em', color: 'var(--neon-gold)' }}>
            🏆 FINAL STANDINGS
          </div>
          {leaderboard.map((entry, i) => (
            <div key={entry.name} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px',
              background: entry.isPlayer ? 'rgba(0,212,255,0.08)' : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              border: entry.isPlayer ? '1px solid rgba(0,212,255,0.25)' : undefined,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '16px',
                color: i === 0 ? 'var(--neon-gold)' : i === 1 ? '#b0c8e0' : i === 2 ? '#c88c50' : 'var(--text-muted)',
                width: '24px', textAlign: 'center',
              }}>
                {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
              </div>
              <span style={{ fontSize: '18px' }}>{AGENT_ICONS[entry.name] || '🤖'}</span>
              <div style={{ flex: 1 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '13px',
                  color: entry.isPlayer ? 'var(--neon-cyan)' : entry.color || 'var(--text-primary)',
                }}>
                  {entry.name} {entry.isPlayer && '← YOU'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)' }}>
                  ${entry.value?.toLocaleString('en', { maximumFractionDigits: 0 })}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  color: entry.changePercent >= 0 ? 'var(--neon-green)' : 'var(--neon-pink)',
                }}>
                  {entry.changePercent >= 0 ? '+' : ''}{entry.changePercent?.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save score / play again */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!saved ? (
            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name for leaderboard..."
                style={{
                  flex: 1, padding: '12px 16px',
                  background: 'rgba(5,18,40,0.8)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  borderRadius: '8px', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)', fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSaveScore}
                disabled={saving}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(255,215,0,0.15)',
                  border: '1px solid var(--neon-gold)',
                  borderRadius: '8px', color: 'var(--neon-gold)',
                  fontFamily: 'var(--font-display)', fontSize: '12px',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {saving ? '...' : '💾 SAVE SCORE'}
              </button>
            </div>
          ) : (
            <div style={{
              flex: 1, padding: '12px 16px', textAlign: 'center',
              background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
              borderRadius: '8px', color: 'var(--neon-green)',
              fontFamily: 'var(--font-mono)', fontSize: '12px',
            }}>
              ✓ Score saved to global leaderboard!
            </div>
          )}
          
          <button
            onClick={onPlayAgain}
            className="btn-primary"
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.2))',
              border: '1px solid var(--neon-cyan)',
              borderRadius: '8px', color: 'var(--neon-cyan)',
              fontSize: '14px',
              boxShadow: '0 0 30px rgba(0,212,255,0.3)',
              cursor: 'pointer',
            }}
          >
            ⚔ PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
