import { useEffect, useRef } from 'react';
import { useTrail, animated, useSpring } from '@react-spring/web';
import gsap from 'gsap';
import { useScreenEntrance } from '../../hooks/useScreenEntrance';
import { COLOURS } from '../../constants';
import { playActionClick, playActionHover, playSuccess, playError } from '../../utils/audio';
import { onMsg, disconnect } from '../../utils/lanSocket';

function SecretReveal({ secret, label, accentColor }) {
  const colours = secret.map(id => COLOURS.find(c => c.id === id));
  const trail = useTrail(colours.length, {
    from: { opacity: 0, scale: 0.3, y: 12 },
    to:   { opacity: 1, scale: 1,   y: 0 },
    config: { tension: 320, friction: 18 },
    delay: 400,
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-display text-[9px] tracking-[0.4em] text-gray-600 uppercase">{label}</span>
      <div className="flex gap-2">
        {trail.map((props, i) => {
          const col = colours[i];
          return (
            <animated.div
              key={i}
              style={{
                ...props,
                backgroundColor: col?.hex || '#333',
                boxShadow: `0 0 14px ${col?.hex || '#333'}70`,
              }}
              className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/10"
            />
          );
        })}
      </div>
    </div>
  );
}

function StatPanel({ label, result, guesses, timeTaken, secret, accentColor, isWinner }) {
  return (
    <div
      className="flex-1 flex flex-col p-5 border-2 gap-4"
      style={{
        borderColor: isWinner ? accentColor : '#374151',
        background: isWinner ? `rgba(${accentColor === '#8eff71' ? '142,255,113' : '0,227,253'}, 0.07)` : 'rgba(10,13,20,0.8)',
        boxShadow: isWinner ? `0 0 30px rgba(${accentColor === '#8eff71' ? '142,255,113' : '0,227,253'}, 0.15)` : 'none',
      }}
    >
      {isWinner && (
        <div
          className="text-center font-display text-[9px] tracking-[0.4em] uppercase font-bold"
          style={{ color: accentColor }}
        >
          ★ WINNER
        </div>
      )}

      <h3
        className="font-display text-xl tracking-[0.2em] font-bold text-center"
        style={{ color: isWinner ? accentColor : '#9ca3af' }}
      >
        {label}
      </h3>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center py-2 border-b border-gray-800">
          <span className="font-hud text-xs text-gray-500 uppercase">Status</span>
          <span
            className="font-hud text-xs font-bold uppercase"
            style={{ color: result === 'win' ? '#8eff71' : '#ff5555' }}
          >
            {result === 'win' ? '✓ SOLVED' : '✗ FAILED'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-800">
          <span className="font-hud text-xs text-gray-500 uppercase">Guesses</span>
          <span className="font-hud text-xs text-white font-bold">{guesses ?? '—'}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-hud text-xs text-gray-500 uppercase">Time</span>
          <span className="font-hud text-xs text-white font-bold">{timeTaken?.toFixed(1) ?? '—'}s</span>
        </div>
      </div>

      {/* Reveal secret */}
      {secret && <SecretReveal secret={secret} label="Their Pattern" accentColor={accentColor} />}
    </div>
  );
}

function getWinner(p1, p2) {
  const s1 = p1.result === 'win' ? p1.guesses : 999;
  const s2 = p2.result === 'win' ? p2.guesses : 999;
  if (s1 < s2) return 'p1';
  if (s2 < s1) return 'p2';
  if (p1.result === 'win' && p2.result === 'win') {
    if (p1.timeTaken < p2.timeTaken) return 'p1';
    if (p2.timeTaken < p1.timeTaken) return 'p2';
  }
  return 'tie';
}

export default function LanEndScreen({ playerIndex, p1Stats, p2Stats, onPlayAgain, onEndSession }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);
  const titleRef = useRef(null);

  const winner = getWinner(p1Stats, p2Stats);
  const myKey = playerIndex === 0 ? 'p1' : 'p2';
  const myResult = myKey === 'p1' ? p1Stats.result : p2Stats.result;
  const iWon = winner === myKey;
  const isTie = winner === 'tie';

  const titleColor =
    isTie ? '#D69E2E' :
    iWon  ? '#8eff71' : '#ff5555';

  const [glowSpring] = useSpring(() => ({
    from: { textShadow: `0 0 15px ${titleColor}60` },
    to:   { textShadow: `0 0 50px ${titleColor}cc` },
    loop: { reverse: true },
    config: { duration: 1200 },
  }));

  useEffect(() => {
    if (!titleRef.current) return;
    gsap.fromTo(titleRef.current,
      { scale: 0.7, opacity: 0, y: -30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)' }
    );
    if (iWon) playSuccess();
    else if (!isTie) playError();
  }, [iWon, isTie]);

  useEffect(() => {
    const unsub = onMsg('opponent_disconnected', onEndSession);
    return unsub;
  }, [onEndSession]);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-8 px-4">

      {/* Title */}
      <div ref={titleRef} className="text-center">
        <animated.h2
          style={{ ...glowSpring, color: titleColor }}
          className="font-display text-5xl md:text-6xl font-black tracking-[0.2em] uppercase mb-3"
        >
          {isTie ? 'TIE!' : iWon ? 'YOU WIN!' : 'YOU LOSE!'}
        </animated.h2>
        <p className="font-hud text-xs tracking-[0.4em] text-gray-500 uppercase">
          Local Multiplayer · Final Results
        </p>
      </div>

      {/* Stat panels */}
      <div className="w-full flex flex-col md:flex-row gap-5">
        <StatPanel
          label="Player 1"
          result={p1Stats.result}
          guesses={p1Stats.guesses}
          timeTaken={p1Stats.timeTaken}
          secret={p1Stats.secret}
          accentColor="#8eff71"
          isWinner={winner === 'p1'}
        />
        <StatPanel
          label="Player 2"
          result={p2Stats.result}
          guesses={p2Stats.guesses}
          timeTaken={p2Stats.timeTaken}
          secret={p2Stats.secret}
          accentColor="#00e3fd"
          isWinner={winner === 'p2'}
        />
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col md:flex-row gap-4">
        <button
          onClick={() => { playActionClick(); onPlayAgain(); }}
          onMouseEnter={playActionHover}
          className="flex-1 py-4 font-display text-sm tracking-[0.25em] uppercase font-bold border-2 border-[#8eff71]/40 text-[#8eff71] hover:bg-[#8eff71]/10 hover:border-[#8eff71] hover:shadow-[0_0_20px_rgba(142,255,113,0.3)] transition-all duration-200 active:scale-[0.98]"
        >
          ↺ PLAY AGAIN
        </button>
        <button
          onClick={() => { playActionClick(); disconnect(); onEndSession(); }}
          onMouseEnter={playActionHover}
          className="flex-1 py-4 font-display text-sm tracking-[0.25em] uppercase border-2 border-gray-700 text-gray-500 hover:border-[#ff5555] hover:text-[#ff5555] hover:bg-[#ff5555]/5 transition-all duration-200 active:scale-[0.98]"
        >
          ✕ END SESSION
        </button>
      </div>
    </div>
  );
}
