import { useState, useRef, useEffect } from 'react';
import { useScreenEntrance } from '../../hooks/useScreenEntrance';
import { useSpring, animated } from '@react-spring/web';
import { DIFFICULTY } from '../../constants';
import { onMsg, sendMsg } from '../../utils/lanSocket';
import { playActionClick, playActionHover, playMenuClick, playMenuHover } from '../../utils/audio';

const CARD_META = {
  easy:   { accentColor: '#8eff71', label: 'BEGINNER', icon: '◈' },
  medium: { accentColor: '#00e3fd', label: 'SKILLED',  icon: '◉' },
  hard:   { accentColor: '#ff51fa', label: 'EXPERT',   icon: '◆' },
};

function MiniCard({ mode, meta, config, onClick, disabled }) {
  const [{ scale }, api] = useSpring(() => ({ scale: 1, config: { tension: 400, friction: 20 } }));

  return (
    <animated.button
      style={{ scale, borderColor: meta.accentColor }}
      onMouseEnter={() => { if (!disabled) { playMenuHover(); api.start({ scale: 1.04 }); } }}
      onMouseLeave={() => api.start({ scale: 1 })}
      onMouseDown={() => { if (!disabled) api.start({ scale: 0.97 }); }}
      onMouseUp={() => { if (!disabled) api.start({ scale: 1.04 }); }}
      onClick={() => { if (!disabled) { playMenuClick(); onClick(); } }}
      disabled={disabled}
      className="flex flex-col gap-3 p-6 border-2 text-left transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: meta.accentColor,
        background: `rgba(${
          mode === 'easy' ? '142,255,113' : mode === 'medium' ? '0,227,253' : '255,81,250'
        }, 0.05)`,
        boxShadow: `0 0 20px rgba(${
          mode === 'easy' ? '142,255,113' : mode === 'medium' ? '0,227,253' : '255,81,250'
        }, 0.1)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl font-black uppercase" style={{ color: meta.accentColor }}>
          {mode}
        </span>
        <span style={{ color: meta.accentColor, opacity: 0.6 }}>{meta.icon}</span>
      </div>
      <div className="font-hud text-[10px] tracking-widest text-gray-500 uppercase flex flex-col gap-1">
        <span>{config.slots} slots · {config.numColours} colors</span>
        <span>{config.maxGuesses} guesses · {config.totalTime}s</span>
      </div>
    </animated.button>
  );
}

export default function LanDifficulty({ playerIndex, onDifficultyConfirmed, onDisconnect }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const isHost = playerIndex === 0;
  const [selected, setSelected] = useState(null);
  const [waiting, setWaiting] = useState(false);

  // Guest: listen for difficulty_selected from host
  useEffect(() => {
    const unsub = onMsg('difficulty_selected', ({ difficulty }) => {
      onDifficultyConfirmed(difficulty);
    });
    return unsub;
  }, [onDifficultyConfirmed]);

  // Disconnect handler
  useEffect(() => {
    const unsub = onMsg('opponent_disconnected', onDisconnect);
    return unsub;
  }, [onDisconnect]);

  const handleSelect = (mode) => {
    if (!isHost) return;
    setSelected(mode);
    setWaiting(true);
    sendMsg('difficulty_selected', { difficulty: mode });
    // Host also proceeds immediately
    onDifficultyConfirmed(mode);
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-8 px-4">

      {/* Title */}
      <div className="text-center">
        <h2
          className="font-display text-3xl md:text-4xl font-black tracking-[0.2em] uppercase mb-2"
          style={{ color: '#00e3fd', textShadow: '0 0 20px rgba(0,227,253,0.4)' }}
        >
          {isHost ? 'SELECT DIFFICULTY' : 'WAITING FOR HOST…'}
        </h2>
        <p className="font-hud text-xs tracking-[0.4em] text-gray-500 uppercase">
          {isHost ? 'You control difficulty for this match' : 'Host is choosing difficulty'}
        </p>
      </div>

      {/* Cards (host only) */}
      {isHost ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(DIFFICULTY).map(([mode, config]) => (
            <MiniCard
              key={mode}
              mode={mode}
              meta={CARD_META[mode]}
              config={config}
              onClick={() => handleSelect(mode)}
              disabled={waiting}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <span className="w-10 h-10 border-2 border-[#00e3fd] border-t-transparent rounded-full animate-spin" />
          <p className="font-hud text-sm tracking-widest text-gray-400 uppercase">
            Standby…
          </p>
        </div>
      )}
    </div>
  );
}
