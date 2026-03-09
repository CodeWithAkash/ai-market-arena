import { useState, useEffect } from 'react';
import ParticleField from './ParticleField';

const AGENTS = [
  {
    name: 'MomentumBot',
    personality: 'Trend Following',
    color: '#00ff88',
    description: 'Rides market waves with ML momentum signals. Aggressive and fast.',
    stats: { aggression: 85, intelligence: 70, speed: 90, risk: 75 },
    icon: '📈',
    strategy: 'RSI + Moving Avg + Trend ML',
  },
  {
    name: 'ValueBot',
    personality: 'Value Investing',
    color: '#4488ff',
    description: 'Hunts undervalued stocks with regression models. Patient but deadly.',
    stats: { aggression: 40, intelligence: 90, speed: 35, risk: 30 },
    icon: '🔍',
    strategy: 'DCF + RSI Divergence',
  },
  {
    name: 'RiskBot',
    personality: 'Risk Averse',
    color: '#ff8800',
    description: 'Master of stop-losses and volatility hedging. Never loses big.',
    stats: { aggression: 25, intelligence: 80, speed: 60, risk: 10 },
    icon: '🛡️',
    strategy: 'Volatility + Stop-Loss Engine',
  },
  {
    name: 'RandomBot',
    personality: 'Chaos Theory',
    color: '#ff0088',
    description: 'Pure chaos. Unpredictable. Sometimes genius, sometimes disaster.',
    stats: { aggression: 100, intelligence: 10, speed: 100, risk: 100 },
    icon: '🎲',
    strategy: 'Brownian Motion YOLO',
  },
  {
    name: 'RLBot',
    personality: 'Reinforcement Learning',
    color: '#cc44ff',
    description: 'Q-learning agent that evolves every game. Gets smarter each tick.',
    stats: { aggression: 65, intelligence: 100, speed: 70, risk: 55 },
    icon: '🤖',
    strategy: 'Q-Learning ε-greedy Policy',
  },
];

function StatBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(180,200,220,0.7)', marginBottom: '3px', fontFamily: 'var(--font-mono)' }}>
        <span>{label}</span><span>{value}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, background: color,
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 1s ease',
          borderRadius: '2px',
        }} />
      </div>
    </div>
  );
}

export default function LandingScreen({ onStartGame }) {
  const [selectedAgents, setSelectedAgents] = useState(['MomentumBot', 'ValueBot', 'RiskBot', 'RandomBot', 'RLBot']);
  const [startingCash, setStartingCash] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [titleGlitch, setTitleGlitch] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Random glitch effect on title
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.85) {
        setTitleGlitch(true);
        setTimeout(() => setTitleGlitch(false), 200);
      }
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const toggleAgent = (name) => {
    setSelectedAgents(prev =>
      prev.includes(name) ? (prev.length > 1 ? prev.filter(a => a !== name) : prev) : [...prev, name]
    );
  };

  const handleStart = async () => {
    if (selectedAgents.length === 0) return;
    setLoading(true);
    setError(null);
    
    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 600));
    }
    setCountdown('GO!');
    await new Promise(r => setTimeout(r, 400));
    
    try {
      const result = await createSession(selectedAgents, startingCash);
      onStartGame(result.sessionId, result.state);
    } catch (err) {
      setError('Connection failed. Make sure the backend is running.');
      setLoading(false);
      setCountdown(null);
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(0,40,80,0.5) 0%, var(--bg-deep) 60%), radial-gradient(ellipse at 80% 20%, rgba(0,80,40,0.3) 0%, transparent 50%)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <ParticleField intensity={1} />
      
      {/* Countdown overlay */}
      {countdown && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(1,2,8,0.8)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '120px', fontWeight: '900',
            color: countdown === 'GO!' ? 'var(--neon-green)' : 'var(--neon-cyan)',
            textShadow: `0 0 60px ${countdown === 'GO!' ? 'var(--neon-green)' : 'var(--neon-cyan)'}`,
            animation: 'pulse-neon 0.3s ease',
          }}>
            {countdown}
          </div>
        </div>
      )}

      {/* Top HUD bar */}
      <div style={{
        width: '100%', padding: '12px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        zIndex: 10, position: 'relative',
        background: 'rgba(1,2,8,0.5)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontSize: '12px' }}>
          SYS: ARENA_v2.0 | STATUS: ONLINE | TICK: READY
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', fontSize: '12px' }}>
          {new Date().toLocaleTimeString()} UTC | NASDAQ SIM
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, width: '100%', maxWidth: '1400px',
        padding: '20px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '24px', zIndex: 10, position: 'relative',
        overflowY: 'auto',
      }} className="scrollable">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 72px)',
            fontWeight: '900',
            letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 50%, #ffd700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: titleGlitch ? 'glitch 0.2s ease' : 'none',
            filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.5))',
            lineHeight: 1.1,
          }}>
            AI MARKET ARENA
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            letterSpacing: '0.3em',
            marginTop: '8px',
            textTransform: 'uppercase',
          }}>
            ⚔ Human vs Artificial Intelligence ⚔
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            color: 'rgba(120,180,210,0.6)',
            fontSize: '13px',
            marginTop: '6px',
          }}>
            Compete against ML-powered trading agents in real-time market simulation
          </div>
        </div>

        {/* Arena layout: agent selection + settings */}
        <div style={{ display: 'flex', gap: '24px', width: '100%', alignItems: 'flex-start' }}>
          
          {/* Agent Selection */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px', letterSpacing: '0.2em',
              color: 'var(--neon-cyan)', marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>⚔</span>
              SELECT YOUR OPPONENTS
              <span style={{
                fontSize: '10px', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontWeight: 'normal',
              }}>({selectedAgents.length} selected)</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {AGENTS.map(agent => {
                const isSelected = selectedAgents.includes(agent.name);
                const isHovered = hoveredAgent === agent.name;
                
                return (
                  <div
                    key={agent.name}
                    onClick={() => toggleAgent(agent.name)}
                    onMouseEnter={() => setHoveredAgent(agent.name)}
                    onMouseLeave={() => setHoveredAgent(null)}
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected
                        ? `1px solid ${agent.color}`
                        : '1px solid rgba(0,212,255,0.15)',
                      boxShadow: isSelected
                        ? `0 0 20px ${agent.color}33, inset 0 0 20px ${agent.color}0a`
                        : 'none',
                      background: isSelected
                        ? `rgba(${hexToRgb(agent.color)}, 0.08)`
                        : 'rgba(5,18,40,0.6)',
                      transition: 'all 0.25s ease',
                      transform: isHovered ? 'translateY(-2px)' : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: agent.color,
                        boxShadow: `0 0 10px ${agent.color}`,
                        animation: 'pulse-neon 2s ease infinite',
                      }} />
                    )}
                    
                    {/* Agent header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{agent.icon}</span>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '14px', fontWeight: '700',
                          color: isSelected ? agent.color : 'var(--text-primary)',
                          textShadow: isSelected ? `0 0 15px ${agent.color}` : 'none',
                        }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {agent.strategy}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '11px', color: 'rgba(160,200,220,0.7)', marginBottom: '12px', lineHeight: 1.5 }}>
                      {agent.description}
                    </div>
                    
                    {/* Stats */}
                    <StatBar label="AGGRESSION" value={agent.stats.aggression} color={agent.color} />
                    <StatBar label="INTELLIGENCE" value={agent.stats.intelligence} color={agent.color} />
                    <StatBar label="SPEED" value={agent.stats.speed} color={agent.color} />
                    <StatBar label="RISK LEVEL" value={agent.stats.risk} color={agent.color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Settings + Start */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div className="glass-panel animated-border" style={{
              borderRadius: '10px', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px', letterSpacing: '0.2em',
                color: 'var(--neon-gold)',
              }}>
                ⚙ BATTLE CONFIG
              </div>
              
              {/* Starting cash */}
              <div>
                <label style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  color: 'var(--text-secondary)', display: 'block', marginBottom: '8px',
                }}>
                  STARTING CAPITAL
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[5000, 10000, 25000, 50000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setStartingCash(amt)}
                      style={{
                        padding: '8px',
                        background: startingCash === amt ? 'rgba(0,212,255,0.2)' : 'rgba(5,18,40,0.8)',
                        border: `1px solid ${startingCash === amt ? 'var(--neon-cyan)' : 'rgba(0,212,255,0.2)'}`,
                        borderRadius: '6px',
                        color: startingCash === amt ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opponents preview */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  YOUR OPPONENTS ({selectedAgents.length})
                </label>
                {selectedAgents.map(name => {
                  const agent = AGENTS.find(a => a.name === name);
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: agent?.color, boxShadow: `0 0 6px ${agent?.color}` }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: agent?.color }}>
                        {agent?.icon} {name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div style={{
                  padding: '10px', borderRadius: '6px',
                  background: 'rgba(255,0,100,0.1)', border: '1px solid rgba(255,0,100,0.3)',
                  color: 'var(--neon-pink)', fontSize: '12px', fontFamily: 'var(--font-mono)',
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Start button */}
              <button
                onClick={handleStart}
                disabled={loading || selectedAgents.length === 0}
                className="btn-primary"
                style={{
                  padding: '18px',
                  background: loading
                    ? 'rgba(0,212,255,0.1)'
                    : 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.2))',
                  border: '1px solid var(--neon-cyan)',
                  borderRadius: '8px',
                  color: loading ? 'var(--text-muted)' : 'var(--neon-cyan)',
                  fontSize: '16px',
                  boxShadow: loading ? 'none' : '0 0 30px rgba(0,212,255,0.3), inset 0 0 30px rgba(0,212,255,0.05)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                    INITIALIZING...
                  </span>
                ) : (
                  '⚔ ENTER THE ARENA'
                )}
              </button>
              
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.6 }}>
                No login required · Free to play<br/>
                200 trading ticks · Real-time AI battle
              </div>
            </div>

            {/* Stats preview */}
            <div className="glass-panel" style={{
              borderRadius: '10px', padding: '16px', marginTop: '12px',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--neon-gold)', marginBottom: '10px' }}>
                📊 MARKET CONDITIONS
              </div>
              {['AAPL', 'TSLA', 'NVDA', 'MSFT'].map(t => (
                <div key={t} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{t}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: Math.random() > 0.5 ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
                    {Math.random() > 0.5 ? '▲' : '▼'} {(Math.random() * 3).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 212, 255';
}
