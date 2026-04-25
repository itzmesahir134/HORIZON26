import { useEffect, useRef, useState } from 'react';
import { useTrail, animated, useSpring } from '@react-spring/web';
import gsap from 'gsap';
import { COLOURS, DIFFICULTY } from '../constants';

// ── Performance rating based on difficulty & guesses used ────────────────────
function getRating(difficulty, guessCount) {
  const max = DIFFICULTY[difficulty]?.maxGuesses || 8;
  const ratio = guessCount / max;
  if (ratio <= 0.35) return { label: 'Outstanding!', color: '#8eff71' };
  if (ratio <= 0.60) return { label: 'Great Job!',   color: '#00e3fd' };
  return { label: 'Well Done!', color: '#D69E2E' };
}

export default function WinScreen({ gameState, onPlayAgain, onSaveScore }) {
  const overlayRef  = useRef(null);
  const titleRef    = useRef(null);
  const seqRef      = useRef(null);
  const statsRef    = useRef(null);
  const buttonsRef  = useRef(null);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const rating = getRating(gameState.difficulty, gameState.guesses.length);

  // ── Title glow-pulse spring ──────────────────────────────────────────────
  const [glowStyle] = useSpring(() => ({
    from: { textShadow: '0 0 15px rgba(142,255,113,0.4)' },
    to:   { textShadow: '0 0 50px rgba(142,255,113,0.85)' },
    loop: { reverse: true },
    config: { duration: 1200 },
  }));

  // ── GSAP entrance timeline ───────────────────────────────────────────────
  useEffect(() => {
    const container = overlayRef.current;
    if (!container) return;

    // Confetti
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece absolute top-0 left-1/2 w-2 h-4 rounded-sm z-50 pointer-events-none';
      el.style.backgroundColor = COLOURS[Math.floor(Math.random() * COLOURS.length)].hex;
      container.appendChild(el);
    }
    gsap.to('.confetti-piece', {
      y: '+=800',
      x: () => `random(-400, 400)`,
      rotation: () => `random(0, 360)`,
      opacity: 0,
      duration: 1.8,
      stagger: { from: 'random', amount: 0.8 },
      ease: 'power2.in',
    });

    // Staggered section entrance
    const tl = gsap.timeline();
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
      .fromTo(titleRef.current,   { y: -50, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.5)' }, '-=0.1')
      .fromTo(seqRef.current,     { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.15')
      .fromTo(statsRef.current,   { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
      .fromTo(buttonsRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.15');

    return () => {
      document.querySelectorAll('.confetti-piece').forEach(e => e.remove());
    };
  }, []);

  // ── Color trail ──────────────────────────────────────────────────────────
  const secretColours = gameState.secret.map(id => COLOURS.find(c => c.id === id));
  const trail = useTrail(secretColours.length, {
    from: { opacity: 0, scale: 0.3, y: 16 },
    to:   { opacity: 1, scale: 1,   y: 0  },
    config: { tension: 300, friction: 16 },
    delay: 550,
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || saved) return;
    setSaved(true);
    onSaveScore(name);
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#080a0f]/92 backdrop-blur-md overflow-hidden"
    >
      <div className="flex flex-col items-center max-w-lg w-full px-6 gap-6 relative z-10">

        {/* ── 1. Title ── */}
        <div ref={titleRef} className="text-center">
          <animated.h2
            style={glowStyle}
            className="font-display text-5xl md:text-6xl font-black tracking-[0.25em] text-[#8eff71] uppercase"
          >
            YOU WON
          </animated.h2>
        </div>

        {/* ── 2. Correct Sequence ── */}
        <div ref={seqRef} className="w-full flex flex-col items-center gap-4">
          <span className="font-display text-[10px] tracking-[0.35em] text-gray-500 uppercase">
            Correct Pattern:
          </span>
          <div className="flex gap-3 md:gap-4 justify-center w-full">
            {trail.map((props, i) => {
              const col = secretColours[i];
              return (
                <animated.div
                  key={i}
                  style={{
                    ...props,
                    backgroundColor: col.hex,
                    boxShadow: `0 0 14px ${col.hex}70, inset 0 0 0 ${col.border ? '2px #1f2937' : '0px'}`,
                  }}
                  className="w-11 h-11 md:w-14 md:h-14 rounded-full border border-white/10"
                />
              );
            })}
          </div>
        </div>

        {/* ── 3. Stats + Save form ── */}
        <div ref={statsRef} className="w-full bg-[#0a0d14]/90 border border-gray-800 p-6 flex flex-col gap-5">

          {/* Score line */}
          <p className="font-hud text-sm text-center tracking-widest text-gray-400 uppercase">
            Solved in{' '}
            <span className="text-white font-bold">{gameState.guesses.length}</span>{' '}
            {gameState.guesses.length === 1 ? 'move' : 'moves'}
            <span className="text-gray-600"> · </span>
            <span style={{ color: rating.color }}>{rating.label}</span>
          </p>

          {/* Name input + save */}
          {!saved ? (
            <form onSubmit={handleSave} className="flex items-stretch gap-3">
              <input
                type="text"
                maxLength={15}
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value.toUpperCase())}
                className="flex-1 bg-[#0d1117] border border-gray-700 focus:border-[#8eff71] text-center font-hud text-sm tracking-widest text-white outline-none px-3 py-3 uppercase transition-colors duration-200"
              />
              <button
                type="submit"
                disabled={!name}
                className="px-5 py-3 font-display text-xs tracking-widest uppercase bg-[#8eff71] text-[#0a3d00] font-bold hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                SAVE
              </button>
            </form>
          ) : (
            <p className="text-center font-display text-xs tracking-widest text-[#8eff71] uppercase">
              ✓ Score saved — good luck beating it!
            </p>
          )}
        </div>

        {/* ── 4. Play Again CTA ── */}
        <div ref={buttonsRef} className="w-full">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 font-display text-sm tracking-[0.25em] uppercase text-[#8eff71] border-2 border-[#8eff71]/40 hover:bg-[#8eff71]/10 hover:border-[#8eff71] hover:shadow-[0_0_20px_rgba(142,255,113,0.3)] active:scale-[0.98] transition-all duration-200"
          >
            ▶ PLAY AGAIN
          </button>
        </div>

      </div>
    </div>
  );
}
