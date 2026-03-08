import { useState } from 'react';
import LandingScreen from './components/LandingScreen';
import ArenaScreen   from './components/ArenaScreen';

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [config, setConfig] = useState(null);

  return screen === 'landing'
    ? <LandingScreen onStart={(agents, cash) => { setConfig({ agents, cash }); setScreen('arena'); }} />
    : <ArenaScreen selectedAgents={config.agents} startingCash={config.cash} onExit={() => { setScreen('landing'); setConfig(null); }} />;
}