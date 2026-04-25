import { useEffect, useRef, useState } from 'react';
import { useTrail, animated, useSpring } from '@react-spring/web';
import gsap from 'gsap';
import { COLOURS } from '../constants';
import { playError, playActionClick, playActionHover } from '../utils/audio';

export default function LossScreen({ gameState, onPlayAgain }) {
  const overlayRef  = useRef(null);
  const titleRef    = useRef(null);
  const codeRef     = useRef(null);
  const buttonsRef  = useRef(null);
  const [btnHovered, setBtnHovered] = useState(false);

  // ── Red glow-pulse on the title ──────────────────────────────────────────
  const [glowStyle] = useSpring(() => ({
    from: { textShadow: '0 0 18px rgba(255,85,85,0.45)' },
    to:   { textShadow: '0 0 55px rgba(255,85,85,0.90)' },
    loop: { reverse: true },
    config: { duration: 1400 },
  }));

  // ── GSAP entrance + title shake ──────────────────────────────────────────
  useEffect(() => {
    playError();
    const tl = gsap.timeline();
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
      .fromTo(
        titleRef.current,
        { y: -30, opacity: 0, scale: 0.9 },
        { y: 0,   opacity: 1, scale: 1,   duration: 0.5, ease: 'back.out(1.4)' },
        '-=0.05'
      )
      // Shake after entrance
      .to(titleRef.current, {
        x: [-6, 6, -5, 5, -3, 3, 0],
        duration: 0.45,
        ease: 'none',
        delay: 0.1,
      })
      .fromTo(codeRef.current,    { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.1')
      .fromTo(buttonsRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.15');
  }, []);

  // ── Staggered circle trail ───────────────────────────────────────────────
  const secretColours = gameState.secret.map(id => COLOURS.find(c => c.id === id));
  const trail = useTrail(secretColours.length, {
    from: { opacity: 0, scale: 0.3, y: 18 },
    to:   { opacity: 1, scale: 1,   y: 0  },
    config: { tension: 300, friction: 16 },
    delay: 650,
  });

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
            className="font-display text-5xl md:text-6xl font-black tracking-[0.25em] text-[#ff5555] uppercase"
          >
            YOU FAILED
          </animated.h2>
          {/* Subtitle — secondary level */}
          <p className="mt-3 font-hud text-xs tracking-[0.25em] text-gray-400 uppercase">
            You ran out of attempts
          </p>
        </div>

        {/* ── 2. Correct Pattern container ── */}
        <div
          ref={codeRef}
          className="w-full flex flex-col items-center gap-5 p-7 border border-gray-700/60"
          style={{
            background:  'linear-gradient(135deg, rgba(255,85,85,0.04) 0%, rgba(10,13,20,0.9) 60%)',
            boxShadow:   'inset 0 0 32px rgba(255,85,85,0.05)',
          }}
        >
          {/* Tertiary label */}
          <span className="font-display text-[10px] tracking-[0.4em] text-gray-600 uppercase">
            Correct Pattern:
          </span>

          {/* Staggered circles */}
          <div className="flex gap-3 md:gap-5 justify-center w-full">
            {trail.map((props, i) => {
              const col = secretColours[i];
              return (
                <animated.div
                  key={i}
                  className="w-11 h-11 md:w-14 md:h-14 rounded-full border border-white/10"
                  style={{
                    ...props,
                    backgroundColor: col.hex,
                    boxShadow: `0 0 16px ${col.hex}60, inset 0 0 0 ${col.border ? '2px #1f2937' : '0px'}`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ── 3. CTA ── */}
        <div ref={buttonsRef} className="w-full">
          <button
            onClick={() => { playActionClick(); onPlayAgain(); }}
            onMouseEnter={() => { setBtnHovered(true); playActionHover(); }}
            onMouseLeave={() => setBtnHovered(false)}
            className="w-full py-4 font-display text-sm tracking-[0.3em] uppercase border-2 transition-all duration-200 active:scale-[0.97]"
            style={{
              color:       '#ff5555',
              borderColor: btnHovered ? '#ff5555' : 'rgba(255,85,85,0.35)',
              background:  btnHovered ? 'rgba(255,85,85,0.08)' : 'transparent',
              boxShadow:   btnHovered
                ? '0 0 24px rgba(255,85,85,0.35), inset 0 0 12px rgba(255,85,85,0.05)'
                : '0 0 8px rgba(255,85,85,0.12)',
            }}
          >
            ↺ TRY AGAIN
          </button>
        </div>

      </div>
    </div>
  );
}
