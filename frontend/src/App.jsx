import { useState } from 'react';
import LandingScreen from './components/LandingScreen';
import ArenaScreen from './components/ArenaScreen';

export default function App() {
  const [screen, setScreen] = useState('landing'); // landing | arena
  const [sessionId, setSessionId] = useState(null);
  const [initialState, setInitialState] = useState(null);

  const handleStartGame = (id, state) => {
    setSessionId(id);
    setInitialState(state);
    setScreen('arena');
  };

  const handleExit = () => {
    setScreen('landing');
    setSessionId(null);
    setInitialState(null);
  };

  return (
    <>
      {screen === 'landing' && (
        <LandingScreen onStartGame={handleStartGame} />
      )}
      {screen === 'arena' && (
        <ArenaScreen
          sessionId={sessionId}
          initialState={initialState}
          onExit={handleExit}
        />
      )}
    </>
  );
}
