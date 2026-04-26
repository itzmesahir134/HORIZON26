import { useState, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useScreenEntrance } from '../../hooks/useScreenEntrance';
import { hostGame, joinGame } from '../../utils/lanSocket';
import { playActionClick, playActionHover, playSoftError, playMenuHover } from '../../utils/audio';

export default function LanSetup({ onRoomCreated, onRoomJoined, onBack }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const [mode, setMode] = useState(null); // 'host' | 'join'
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Button spring ────────────────────────────────────────────────────────
  const [hostSpring, hostApi] = useSpring(() => ({ scale: 1, config: { tension: 400, friction: 20 } }));
  const [joinSpring, joinApi] = useSpring(() => ({ scale: 1, config: { tension: 400, friction: 20 } }));

  // ── Host flow ────────────────────────────────────────────────────────────
  const handleHost = async () => {
    setMode('host');
    setError('');
    setLoading(true);
    setStatus('Creating room…');
    try {
      const code = await hostGame();
      onRoomCreated(code);
    } catch {
      setError('Could not connect to the matchmaking server. Check your internet.');
      setLoading(false);
      setMode(null);
    }
  };

  // ── Join flow ────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (roomCode.length !== 4) {
      playSoftError();
      setError('Enter the 4-digit room code.');
      return;
    }
    setError('');
    setLoading(true);
    setStatus('Connecting…');
    try {
      await joinGame(roomCode);
      onRoomJoined(roomCode);
    } catch {
      setError(`Could not find a room with code ${roomCode}. Is the host still waiting?`);
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto gap-8 px-4">

      {/* Title */}
      <div className="text-center">
        <h2
          className="font-display text-4xl md:text-5xl font-black tracking-[0.2em] uppercase mb-2"
          style={{ color: '#00e3fd', textShadow: '0 0 30px rgba(0,227,253,0.5)' }}
        >
          LOCAL MULTI
        </h2>
        <p className="font-hud text-xs tracking-[0.4em] text-gray-500 uppercase">
          LAN · Same Wi-Fi Network
        </p>
      </div>

      {/* Mode selector */}
      {!mode && (
        <div className="w-full flex flex-col md:flex-row gap-5">

          {/* Host */}
          <animated.button
            style={hostSpring}
            onMouseEnter={() => { playMenuHover(); hostApi.start({ scale: 1.03 }); }}
            onMouseLeave={() => hostApi.start({ scale: 1 })}
            onMouseDown={() => hostApi.start({ scale: 0.97 })}
            onMouseUp={() => hostApi.start({ scale: 1.03 })}
            onClick={() => { playActionClick(); handleHost(); }}
            className="flex-1 flex flex-col items-center gap-4 p-8 border-2 transition-all duration-200"
            style={{
              borderColor: '#00e3fd',
              background: 'rgba(0,227,253,0.05)',
              boxShadow: '0 0 20px rgba(0,227,253,0.1)',
            }}
          >
            <span className="text-4xl">🖥</span>
            <span className="font-display text-xl tracking-[0.2em] text-[#00e3fd] uppercase font-bold">
              Host Game
            </span>
            <span className="font-hud text-xs text-gray-500 tracking-widest uppercase text-center">
              Create a room &amp; share code
            </span>
          </animated.button>

          {/* Join */}
          <animated.button
            style={joinSpring}
            onMouseEnter={() => { playMenuHover(); joinApi.start({ scale: 1.03 }); }}
            onMouseLeave={() => joinApi.start({ scale: 1 })}
            onMouseDown={() => joinApi.start({ scale: 0.97 })}
            onMouseUp={() => joinApi.start({ scale: 1.03 })}
            onClick={() => { playActionClick(); setMode('join'); setError(''); }}
            className="flex-1 flex flex-col items-center gap-4 p-8 border-2 transition-all duration-200"
            style={{
              borderColor: '#ff51fa',
              background: 'rgba(255,81,250,0.05)',
              boxShadow: '0 0 20px rgba(255,81,250,0.1)',
            }}
          >
            <span className="text-4xl">📡</span>
            <span className="font-display text-xl tracking-[0.2em] text-[#ff51fa] uppercase font-bold">
              Join Game
            </span>
            <span className="font-hud text-xs text-gray-500 tracking-widest uppercase text-center">
              Enter code from host
            </span>
          </animated.button>
        </div>
      )}

      {/* Join form */}
      {mode === 'join' && (
        <div className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-display text-[10px] tracking-[0.4em] text-gray-500 uppercase">
              Room Code
            </label>
            <input
              type="text"
              maxLength={4}
              placeholder="4-digit code"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.replace(/\D/g, ''))}
              className="bg-[#0d1117] border border-gray-700 focus:border-[#ff51fa] text-center font-display text-3xl tracking-[0.5em] text-[#ff51fa] outline-none px-4 py-4 transition-colors duration-200"
            />
          </div>

          <button
            onClick={() => { playActionClick(); handleJoin(); }}
            onMouseEnter={playActionHover}
            disabled={loading}
            className="w-full py-4 font-display text-sm tracking-[0.25em] uppercase font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
            style={{
              background: '#ff51fa',
              color: '#3a0039',
              boxShadow: '0 0 20px rgba(255,81,250,0.4)',
            }}
          >
            {loading ? 'Connecting…' : '▶ JOIN ROOM'}
          </button>
        </div>
      )}

      {/* Host connecting state */}
      {mode === 'host' && loading && (
        <div className="text-center">
          <p className="font-hud text-sm tracking-widest text-[#00e3fd] uppercase animate-pulse">{status}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="font-hud text-xs tracking-widest text-[#ff5555] uppercase text-center border border-[#ff5555]/30 bg-[#ff5555]/5 px-4 py-3">
          ⚠ {error}
        </p>
      )}

      {/* Back */}
      <button
        onClick={() => { playActionClick(); onBack(); }}
        onMouseEnter={playActionHover}
        className="font-display text-xs tracking-[0.3em] text-gray-600 uppercase hover:text-gray-400 transition-colors duration-200"
      >
        ← BACK
      </button>
    </div>
  );
}
