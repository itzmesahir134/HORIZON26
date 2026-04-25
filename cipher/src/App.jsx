import { useState } from 'react';
import { COLOURS, DIFFICULTY } from './constants';
import { computeFeedback } from './utils/computeFeedback';
import DifficultyScreen from './components/DifficultyScreen';
import GameBoard from './components/GameBoard';
import TimerArc from './components/TimerArc';
import WinScreen from './components/WinScreen';
import LossScreen from './components/LossScreen';
import Leaderboard from './components/Leaderboard';
import { saveScore } from './utils/leaderboardStore';

// ── HUD status bar data ──────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'GAME_READY', 'SECRET_GAME_v2', 'GUESSING_READY',
  'PLAYER_READY', 'START_GAMES_LOADED', 'PATTERN_MAKER_ACTIVE',
  'PATTERN_LOADED', 'HINT_SYSTEM_READY', 'SCORES_READY',
];

function DataTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden border-t border-b border-gray-800 py-1 bg-[#080a0f]">
      <div className="data-ticker flex gap-12 text-[10px] font-display text-gray-600 tracking-widest">
        {doubled.map((item, i) => (
          <span key={i}>
            <span className="text-primary opacity-50 mr-2">◆</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

function HudHeader({ screen, totalTime, onTimeout }) {
  return (
    <header className="relative px-8 pt-8 pb-4">
      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-primary opacity-60" />
      <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-primary opacity-60" />

      {/* Status row */}
      <div className="flex justify-between items-center mb-4 font-display text-[10px] tracking-widest text-gray-600 h-12">
        <div className="flex-1">
          GAME <span className="text-primary">READY</span>
        </div>
        <div className="flex-1 flex justify-center">
          {screen === 'playing' ? (
            <TimerArc totalTime={totalTime} onComplete={onTimeout} isPaused={false} />
          ) : (
            <span>CIPHER_LAB <span className="text-primary hud-cursor" /></span>
          )}
        </div>
        <div className="flex-1 text-right">
          GAME <span className="text-primary">v2</span>
        </div>
      </div>

      {/* Main title */}
      <div className="text-center">
        <h1
          className="font-display text-4xl md:text-5xl font-bold tracking-[0.15em] text-white uppercase"
          style={{
            textShadow: '0 0 30px rgba(142,255,113,0.35), 0 0 60px rgba(142,255,113,0.15)',
            animation: 'title-glitch 6s ease-in-out infinite',
          }}
        >
          PROJECT CIPHER        </h1>
        <div className="mt-3 font-hud text-base text-gray-400 tracking-widest font-medium uppercase">
          {screen !== 'difficulty' && 'Pattern guessing active'}
        </div>
      </div>

      {/* Bottom corner accents */}
      <div className="absolute bottom-0 left-4 w-5 h-5 border-b-2 border-l-2 border-gray-700 opacity-40" />
      <div className="absolute bottom-0 right-4 w-5 h-5 border-b-2 border-r-2 border-gray-700 opacity-40" />
    </header>
  );
}

export default function App() {
  const [gameState, setGameState] = useState({
    screen: 'difficulty',
    difficulty: 'easy',
    secret: [],
    guesses: [],
    feedbacks: [],
    currentGuess: [],
    timeElapsed: 0,
    totalTime: 75,
    startTime: null,
    timeTaken: 0,
  });

  const handleDifficultySelect = (mode, secret) => {
    setGameState(prev => ({
      ...prev,
      difficulty: mode,
      secret,
      currentGuess: Array(DIFFICULTY[mode].slots).fill(null),
      totalTime: DIFFICULTY[mode].totalTime,
      guesses: [],
      feedbacks: [],
      timeElapsed: 0,
      startTime: Date.now(),
      screen: 'playing',
    }));
  };

  const handleUpdateGuess = (update) => {
    setGameState(prev => ({
      ...prev,
      currentGuess: typeof update === 'function' ? update(prev.currentGuess) : update
    }));
  };

  const handleSubmitGuess = () => {
    setGameState(prev => {
      const config = DIFFICULTY[prev.difficulty];
      const feedback = computeFeedback(prev.secret, prev.currentGuess);

      const newGuesses = [...prev.guesses, prev.currentGuess];
      const newFeedbacks = [...prev.feedbacks, feedback];

      // Check win
      if (feedback.black === config.slots) {
        const timeTaken = (Date.now() - prev.startTime) / 1000;
        return { ...prev, guesses: newGuesses, feedbacks: newFeedbacks, screen: 'won', timeTaken };
      }

      // Check loss
      if (newGuesses.length >= config.maxGuesses) {
        return { ...prev, guesses: newGuesses, feedbacks: newFeedbacks, screen: 'lost' };
      }

      return {
        ...prev,
        guesses: newGuesses,
        feedbacks: newFeedbacks,
        currentGuess: Array(config.slots).fill(null)
      };
    });
  };

  const handleTimeout = () => {
    setGameState(prev => ({ ...prev, screen: 'lost' }));
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center min-h-screen relative overflow-x-hidden bg-[#080a0f]">
      {/* ── Layer 1: Full-screen Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(142,255,113,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(142,255,113,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'grid-drift 8s linear infinite',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(circle at 50% 50%, #0d1117 0%, transparent 100%)' }}
        />
      </div>

      {/* ── Layer 2: Centered Content Layer ── */}
      <div className="relative z-10 flex flex-col min-h-screen w-full max-w-[1400px] mx-auto px-6">

        {/* Top Ticker (Edge-to-Edge of container) */}
        <DataTicker />

        {/* Main Panel Shell */}
        <div
          className="flex-1 flex flex-col border-x border-b border-gray-800 overflow-hidden"
          style={{ background: 'rgba(13, 17, 23, 0.85)', backdropFilter: 'blur(10px)' }}
        >
          <HudHeader
            screen={gameState.screen}
            totalTime={gameState.totalTime}
            onTimeout={handleTimeout}
          />

          {/* Divider */}
          <div className="mx-8 border-t border-gray-800 my-2" />

          {/* Screen router */}
          <main className="flex-1 flex flex-col justify-center w-full px-4 md:px-8 lg:px-12 pb-12 pt-6">
            <div className="flex-1 overflow-hidden relative">
              {gameState.screen === 'difficulty' && (
                <DifficultyScreen 
                  onSelect={handleDifficultySelect} 
                  onViewLeaderboard={() => setGameState(prev => ({ ...prev, screen: 'leaderboard' }))}
                />
              )}

              {(gameState.screen === 'playing' || gameState.screen === 'won' || gameState.screen === 'lost') && (
                <GameBoard
                  difficulty={gameState.difficulty}
                  secret={gameState.secret}
                  guesses={gameState.guesses}
                  feedbacks={gameState.feedbacks}
                  currentGuess={gameState.currentGuess}
                  onUpdateGuess={handleUpdateGuess}
                  onSubmitGuess={handleSubmitGuess}
                />
              )}

              {gameState.screen === 'won' && (
                <WinScreen
                  gameState={gameState}
                  onPlayAgain={() => setGameState(prev => ({ ...prev, screen: 'difficulty' }))}
                  onSaveScore={(name) => {
                    saveScore(gameState.difficulty, name, gameState.guesses.length, gameState.timeTaken);
                    setGameState(prev => ({ ...prev, screen: 'leaderboard' }));
                  }}
                />
              )}

              {gameState.screen === 'leaderboard' && (
                <Leaderboard 
                  onBack={() => setGameState(prev => ({ ...prev, screen: 'difficulty' }))}
                />
              )}

              {gameState.screen === 'lost' && (
                <LossScreen
                  gameState={gameState}
                  onPlayAgain={() => setGameState(prev => ({ ...prev, screen: 'difficulty' }))}
                />
              )}
            </div>
          </main>
        </div>

        {/* Bottom ticker */}
        <DataTicker />
      </div>
    </div>
  );
}
