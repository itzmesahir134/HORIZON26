import { useState, useEffect } from 'react';
import { DIFFICULTY } from './constants';
import { computeFeedback } from './utils/computeFeedback';
import GameSelection from './components/GameSelection';
import LandingScreen from './components/LandingScreen';
import GameBoard from './components/GameBoard';
import TimerArc from './components/TimerArc';
import WinScreen from './components/WinScreen';
import LossScreen from './components/LossScreen';
import Leaderboard from './components/Leaderboard';
import PassAndPlayMaker from './components/PassAndPlayMaker';
import PassAndPlayTransition from './components/PassAndPlayTransition';
import PassAndPlayResult from './components/PassAndPlayResult';
import PassAndPlayWinner from './components/PassAndPlayWinner';
import LanSetup from './components/lan/LanSetup';
import LanLobby from './components/lan/LanLobby';
import LanDifficulty from './components/lan/LanDifficulty';
import LanSecretMaker from './components/lan/LanSecretMaker';
import LanBoard from './components/lan/LanBoard';
import LanEndScreen from './components/lan/LanEndScreen';
import { onMsg, disconnect } from './utils/lanSocket';
import { saveScore } from './utils/leaderboardStore';
import { toggleSoundtrack } from './utils/audio';

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
          {screen !== 'gameSelection' && 'Pattern guessing active'}
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
    screen: 'landing',
    difficulty: 'easy',
    secret: [],
    guesses: [],
    feedbacks: [],
    currentGuess: [],
    timeElapsed: 0,
    totalTime: 75,
    startTime: null,
    timeTaken: 0,
    isPassAndPlay: false,
    pnpRound: 1,
    pnpSetter: 1,
    pnpGuesser: 2,
    pnpP1Stats: null,
    pnpP2Stats: null,
  });

  // ── LAN Multiplayer state ────────────────────────────────────────────────
  const [lanState, setLanState] = useState({
    roomCode: null,
    playerIndex: null,   // 0 = host, 1 = guest
    lanIp: null,         // host's LAN IP (from server)
    difficulty: null,
    mySecret: null,
    opponentSecret: null,
    myGuesses: [],
    myFeedbacks: [],
    myResult: null,
    myTime: null,
    p1Stats: null,
    p2Stats: null,
  });

  // ── Soundtrack Management ────────────────────────────────────────────────
  useEffect(() => {
    if (gameState.screen === 'playing') {
      toggleSoundtrack(true);
    } else if (gameState.screen === 'win' || gameState.screen === 'loss') {
      toggleSoundtrack(false);
    }
  }, [gameState.screen]);

  const handleDifficultySelect = (mode, secret) => {
    if (gameState.screen === 'passAndPlayDifficulty') {
      setGameState(prev => ({
        ...prev,
        difficulty: mode,
        isPassAndPlay: true,
        pnpRound: 1,
        pnpSetter: 1,
        pnpGuesser: 2,
        screen: 'passAndPlayMaker',
      }));
      return;
    }
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
        return { 
          ...prev, 
          guesses: newGuesses, 
          feedbacks: newFeedbacks, 
          screen: prev.isPassAndPlay ? 'passAndPlayResult' : 'won', 
          timeTaken,
          pnpWon: true 
        };
      }

      // Check loss
      if (newGuesses.length >= config.maxGuesses) {
        const timeTaken = (Date.now() - prev.startTime) / 1000;
        return { 
          ...prev, 
          guesses: newGuesses, 
          feedbacks: newFeedbacks, 
          screen: prev.isPassAndPlay ? 'passAndPlayResult' : 'lost',
          timeTaken,
          pnpWon: false
        };
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
    setGameState(prev => ({ 
      ...prev, 
      screen: prev.isPassAndPlay ? 'passAndPlayResult' : 'lost',
      timeTaken: (Date.now() - prev.startTime) / 1000,
      pnpWon: false
    }));
  };

  // ── Pass & Play handlers ──────────────────────────────────────────────────
  const handlePassAndPlayStart = () => {
    setGameState(prev => ({ ...prev, screen: 'passAndPlayDifficulty', isPassAndPlay: false }));
  };

  const handleCodeLocked = (secret) => {
    setGameState(prev => ({ ...prev, secret, screen: 'passAndPlayTransition' }));
  };

  const handleTransitionReady = () => {
    setGameState(prev => ({
      ...prev,
      currentGuess: Array(DIFFICULTY[prev.difficulty].slots).fill(null),
      totalTime: DIFFICULTY[prev.difficulty].totalTime,
      guesses: [],
      feedbacks: [],
      startTime: Date.now(),
      screen: 'playing',
    }));
  };

  // Called when a PnP round ends. Save the current guesser's stats, then route.
  const handlePnpNextRound = () => {
    // Round 1 just finished: Player 2 was guesser. Store P2 stats.
    const guesserPlayer = gameState.pnpGuesser; // was 2
    const currentStats = {
      result: gameState.pnpWon ? 'win' : 'loss',
      guesses: gameState.guesses.length,
      timeTaken: gameState.timeTaken,
      difficulty: gameState.difficulty,
    };
    const p1Stats = guesserPlayer === 1 ? currentStats : gameState.pnpP1Stats;
    const p2Stats = guesserPlayer === 2 ? currentStats : gameState.pnpP2Stats;

    setGameState(prev => ({
      ...prev,
      pnpRound: 2,
      pnpSetter: prev.pnpGuesser,   // old guesser now sets
      pnpGuesser: prev.pnpSetter,   // old setter now guesses
      pnpP1Stats: p1Stats,
      pnpP2Stats: p2Stats,
      secret: [],
      guesses: [],
      feedbacks: [],
      screen: 'passAndPlayMaker',
    }));
  };

  const handlePnpShowWinner = () => {
    // Round 2 just finished: save guesser stats
    const guesserPlayer = gameState.pnpGuesser;
    const currentStats = {
      result: gameState.pnpWon ? 'win' : 'loss',
      guesses: gameState.guesses.length,
      timeTaken: gameState.timeTaken,
      difficulty: gameState.difficulty,
    };
    const p1Stats = guesserPlayer === 1 ? currentStats : gameState.pnpP1Stats;
    const p2Stats = guesserPlayer === 2 ? currentStats : gameState.pnpP2Stats;
    setGameState(prev => ({ ...prev, pnpP1Stats: p1Stats, pnpP2Stats: p2Stats, screen: 'passAndPlayWinner' }));
  };

  const handlePnpHome = () => {
    setGameState(prev => ({
      ...prev,
      screen: 'gameSelection',
      isPassAndPlay: false,
      pnpP1Stats: null,
      pnpP2Stats: null,
    }));
  };

  // ── LAN Multiplayer handlers ─────────────────────────────────────────────
  const handleLanStart = () =>
    setGameState(prev => ({ ...prev, screen: 'lanSetup' }));

  const handleLanRoomCreated = (roomCode, lanIp) => {
    setLanState(prev => ({ ...prev, roomCode, playerIndex: 0, lanIp }));
    setGameState(prev => ({ ...prev, screen: 'lanLobby' }));
  };

  const handleLanRoomJoined = (roomCode) => {
    setLanState(prev => ({ ...prev, roomCode, playerIndex: 1 }));
    setGameState(prev => ({ ...prev, screen: 'lanLobby' }));
  };

  const handleLanBothConnected = () =>
    setGameState(prev => ({ ...prev, screen: 'lanDifficulty' }));

  // Guest also advances on difficulty_selected (handled in LanDifficulty itself)
  const handleLanDifficultyConfirmed = (difficulty) => {
    setLanState(prev => ({ ...prev, difficulty }));
    setGameState(prev => ({ ...prev, screen: 'lanSecretMaker' }));
  };

  // game_start arrives from server via LanSecretMaker, passes secrets up
  const handleLanGameStart = (mySecret, opponentSecret, difficulty) => {
    setLanState(prev => ({ ...prev, mySecret, opponentSecret, difficulty }));
    setGameState(prev => ({ ...prev, screen: 'lanPlaying' }));
  };

  // Called when local player finishes their round
  const handleLanFinished = (result, guesses, feedbacks, timeTaken, mySecret, opponentSecret) => {
    setLanState(prev => {
      const myStats = { result, guesses: guesses.length, timeTaken, secret: mySecret };
      const next = { ...prev, myResult: result, myGuesses: guesses, myFeedbacks: feedbacks, myTime: timeTaken };
      if (next.playerIndex === 0) next.p1Stats = myStats;
      else next.p2Stats = myStats;
      return next;
    });
  };

  // Listen for peer_finished from opponent
  useEffect(() => {
    const unsub = onMsg('peer_finished', (oppStats) => {
      setLanState(prev => {
        const next = { ...prev };
        if (next.playerIndex === 0) next.p2Stats = oppStats;
        else next.p1Stats = oppStats;
        return next;
      });
    });
    return unsub;
  }, []);

  // Check if both players are finished
  useEffect(() => {
    if (lanState.p1Stats && lanState.p2Stats && gameState.screen === 'lanPlaying') {
      setTimeout(() => setGameState(prev => ({ ...prev, screen: 'lanEnd' })), 1000);
    }
  }, [lanState.p1Stats, lanState.p2Stats, gameState.screen]);

  const handleLanDisconnect = () => {
    disconnect();
    setLanState({ roomCode: null, playerIndex: null, lanIp: null, difficulty: null, mySecret: null, opponentSecret: null, myGuesses: [], myFeedbacks: [], myResult: null, myTime: null, p1Stats: null, p2Stats: null });
    setGameState(prev => ({ ...prev, screen: 'gameSelection' }));
  };

  const handleLanPlayAgain = () => {
    setLanState(prev => ({ ...prev, mySecret: null, opponentSecret: null, myGuesses: [], myFeedbacks: [], myResult: null, myTime: null, p1Stats: null, p2Stats: null }));
    setGameState(prev => ({ ...prev, screen: 'lanDifficulty' }));
  };

  if (gameState.screen === 'landing') {
    return <LandingScreen onStart={() => setGameState(prev => ({ ...prev, screen: 'gameSelection' }))} />;
  }

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
            <div className="flex-1 overflow-hidden relative flex flex-col items-center w-full">
              {gameState.screen === 'gameSelection' && (
                <GameSelection 
                  onSelect={handleDifficultySelect} 
                  onViewLeaderboard={() => setGameState(prev => ({ ...prev, screen: 'leaderboard' }))}
                  onPassAndPlay={handlePassAndPlayStart}
                  onLocalMulti={handleLanStart}
                />
              )}

              {gameState.screen === 'passAndPlayDifficulty' && (
                <GameSelection
                  onSelect={handleDifficultySelect}
                  onViewLeaderboard={null}
                  onPassAndPlay={null}
                />
              )}

              {(gameState.screen === 'playing' || gameState.screen === 'won' || gameState.screen === 'lost' || gameState.screen === 'passAndPlayResult') && (
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
                  onPlayAgain={() => setGameState(prev => ({ ...prev, screen: 'gameSelection' }))}
                  onSaveScore={(name) => {
                    saveScore(gameState.difficulty, name, gameState.guesses.length, gameState.timeTaken);
                    setGameState(prev => ({ ...prev, screen: 'leaderboard' }));
                  }}
                />
              )}

              {gameState.screen === 'leaderboard' && (
                <Leaderboard 
                  onBack={() => setGameState(prev => ({ ...prev, screen: 'gameSelection' }))}
                />
              )}

              {gameState.screen === 'lost' && (
                <LossScreen
                  gameState={gameState}
                  onPlayAgain={() => setGameState(prev => ({ ...prev, screen: 'gameSelection' }))}
                />
              )}

              {gameState.screen === 'passAndPlayMaker' && (
                <PassAndPlayMaker
                  difficulty={gameState.difficulty}
                  playerNumber={gameState.pnpSetter}
                  onCodeLocked={handleCodeLocked}
                />
              )}

              {gameState.screen === 'passAndPlayTransition' && (
                <PassAndPlayTransition
                  playerToPlay={gameState.pnpGuesser}
                  onReady={handleTransitionReady}
                />
              )}

              {gameState.screen === 'passAndPlayResult' && (
                <PassAndPlayResult
                  result={gameState.pnpWon ? 'win' : 'loss'}
                  stats={{
                    guesses: gameState.guesses.length,
                    timeTaken: gameState.timeTaken,
                    difficulty: gameState.difficulty,
                  }}
                  player={gameState.pnpGuesser}
                  round={gameState.pnpRound}
                  onNextRound={handlePnpNextRound}
                  onShowOverallWinner={handlePnpShowWinner}
                />
              )}

              {gameState.screen === 'passAndPlayWinner' && gameState.pnpP1Stats && gameState.pnpP2Stats && (
                <PassAndPlayWinner
                  p1Stats={gameState.pnpP1Stats}
                  p2Stats={gameState.pnpP2Stats}
                  onHome={handlePnpHome}
                />
              )}

              {/* ── LAN Multiplayer screens ── */}
              {gameState.screen === 'lanSetup' && (
                <LanSetup
                  onRoomCreated={handleLanRoomCreated}
                  onRoomJoined={handleLanRoomJoined}
                  onBack={() => setGameState(prev => ({ ...prev, screen: 'gameSelection' }))}
                />
              )}

              {gameState.screen === 'lanLobby' && (
                <LanLobby
                  roomCode={lanState.roomCode}
                  lanIp={lanState.lanIp}
                  playerIndex={lanState.playerIndex}
                  onBothConnected={handleLanBothConnected}
                  onDisconnect={handleLanDisconnect}
                />
              )}

              {gameState.screen === 'lanDifficulty' && (
                <LanDifficulty
                  playerIndex={lanState.playerIndex}
                  onDifficultyConfirmed={handleLanDifficultyConfirmed}
                  onDisconnect={handleLanDisconnect}
                />
              )}

              {gameState.screen === 'lanSecretMaker' && (
                <LanSecretMaker
                  difficulty={lanState.difficulty}
                  playerIndex={lanState.playerIndex}
                  onGameStart={handleLanGameStart}
                  onDisconnect={handleLanDisconnect}
                />
              )}

              {gameState.screen === 'lanPlaying' && (
                <LanBoard
                  difficulty={lanState.difficulty}
                  mySecret={lanState.mySecret}
                  opponentSecret={lanState.opponentSecret}
                  playerIndex={lanState.playerIndex}
                  onFinished={handleLanFinished}
                  onDisconnect={handleLanDisconnect}
                />
              )}

              {gameState.screen === 'lanEnd' && lanState.p1Stats && lanState.p2Stats && (
                <LanEndScreen
                  playerIndex={lanState.playerIndex}
                  p1Stats={lanState.p1Stats}
                  p2Stats={lanState.p2Stats}
                  onPlayAgain={handleLanPlayAgain}
                  onEndSession={handleLanDisconnect}
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
