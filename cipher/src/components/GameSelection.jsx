import { useRef, useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useScreenEntrance } from '../hooks/useScreenEntrance';
import { DIFFICULTY, COLOURS } from '../constants';
import { playMenuClick, playMenuHover, playStart, playActionHover, playActionClick } from '../utils/audio';

// ── Card metadata ────────────────────────────────────────────────────────────
const CARD_META = {
  easy: {
    cardClass:   'card-easy',
    accentColor: '#8eff71',
    darkText:    '#0a3d00',
    label:       'BEGINNER',
    tagline:     'Learn the rules',
    icon:        '◈',
    recommended: false,
  },
  medium: {
    cardClass:   'card-medium',
    accentColor: '#00e3fd',
    darkText:    '#002d33',
    label:       'SKILLED',
    tagline:     'Recommended level',
    icon:        '◉',
    recommended: true,
  },
  hard: {
    cardClass:   'card-hard',
    accentColor: '#ff51fa',
    darkText:    '#3a0039',
    label:       'EXPERT',
    tagline:     'Hardest pattern',
    icon:        '◆',
    recommended: false,
  },
};

// ── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, accent, last }) {
  return (
    <div className={`flex items-center justify-between py-[5px] ${!last ? 'border-b border-white/[0.06]' : ''}`}>
      <span className="font-hud text-sm tracking-[0.2em] text-gray-400 font-medium uppercase">{label}</span>
      <span
        className="font-display text-2xl font-bold leading-none"
        style={{ color: accent, textShadow: `0 0 12px ${accent}55` }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Difficulty card ──────────────────────────────────────────────────────────
function DifficultyCard({ mode, config, meta, onClick, enterDelay }) {
  const [hovered, setHovered] = useState(false);

  // React Spring: card lift + scale
  // Recommended card starts at a slightly elevated scale
  const baseScale = meta.recommended ? 1.03 : 1;
  const [{ y, scale, shadow }, api] = useSpring(() => ({
    y:      0,
    scale:  baseScale,
    shadow: meta.recommended ? 0.4 : 0,
    config: { tension: 380, friction: 22 },
  }));

  const handleEnter = () => { playMenuHover(); setHovered(true);  api.start({ y: -12, scale: baseScale + 0.025, shadow: 1 }); };
  const handleLeave = () => { setHovered(false); api.start({ y: 0,   scale: baseScale,          shadow: meta.recommended ? 0.4 : 0 }); };
  const handleDown  = () => api.start({ scale: baseScale - 0.03 });
  const handleUp    = () => api.start({ scale: hovered ? baseScale + 0.025 : baseScale });

  const glowIntensity = shadow.to(v =>
    `0 ${8 + v * 20}px ${24 + v * 40}px rgba(${
      mode === 'easy'   ? '142,255,113' :
      mode === 'medium' ? '0,227,253'   :
      '255,81,250'
    }, ${0.12 + v * 0.32})`
  );

  return (
    <animated.div
      role="button"
      tabIndex={0}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onKeyDown={e => e.key === 'Enter' && (playMenuClick(), onClick())}
      onClick={() => { playMenuClick(); onClick(); }}
      style={{
        y,
        scale,
        boxShadow:      glowIntensity,
        animationDelay: `${enterDelay}ms`,
      }}
      className={`diff-card ${meta.cardClass} cursor-pointer relative flex flex-col min-h-[380px] w-full md:w-[380px] screen-enter`}
    >
      {/* Inner subtle gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${meta.accentColor}08 0%, transparent 65%)`,
        }}
      />

      {/* Corner HUD dots */}
      {['tl','tr','bl','br'].map(p => (
        <div
          key={p}
          className={`absolute ${
            p === 'tl' ? 'top-3 left-3' :
            p === 'tr' ? 'top-3 right-3' :
            p === 'bl' ? 'bottom-3 left-3' :
            'bottom-3 right-3'
          } w-1.5 h-1.5 rounded-full transition-opacity duration-200`}
          style={{ background: meta.accentColor, opacity: hovered ? 0.9 : 0.3 }}
        />
      ))}

      {/* "Recommended" badge */}
      {meta.recommended && (
        <div
          className="badge-recommended absolute -top-px left-1/2 -translate-x-1/2 px-5 py-1.5 font-display text-[9px] tracking-[0.35em] uppercase"
          style={{ background: meta.accentColor, color: meta.darkText }}
        >
          ★ RECOMMENDED
        </div>
      )}

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-[10%] bottom-[10%] w-[3px] transition-all duration-300"
        style={{
          background: `linear-gradient(180deg, transparent, ${meta.accentColor}, transparent)`,
          opacity:    hovered ? 1 : (meta.recommended ? 0.7 : 0.4),
          boxShadow:  hovered ? `0 0 12px ${meta.accentColor}` : 'none',
        }}
      />

      {/* Card content */}
      <div className="flex-1 flex flex-col px-7 py-8 xl:px-10 xl:py-10 relative z-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              className="font-display text-xs tracking-[0.4em] mb-1.5 uppercase font-semibold"
              style={{ color: meta.accentColor, opacity: 0.95 }}
            >
              {meta.label}
            </div>
            <h2
              className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider leading-none"
              style={{
                color:      hovered ? meta.accentColor : '#e8eaf0',
                textShadow: hovered ? `0 0 20px ${meta.accentColor}60` : 'none',
                transition: 'color 0.2s, text-shadow 0.2s',
              }}
            >
              {mode}
            </h2>
          </div>

          <div
            className="text-4xl font-bold leading-none mt-1 transition-all duration-200"
            style={{
              color:      meta.accentColor,
              opacity:    hovered ? 1 : (meta.recommended ? 0.65 : 0.3),
              textShadow: hovered ? `0 0 18px ${meta.accentColor}` : 'none',
            }}
          >
            {meta.icon}
          </div>
        </div>

        {/* Tagline */}
        <div
          className="font-hud text-sm tracking-widest uppercase mb-6 transition-opacity duration-200 font-medium"
          style={{ color: meta.accentColor, opacity: hovered ? 1 : (meta.recommended ? 0.8 : 0.6) }}
        >
          {meta.tagline}
        </div>

        {/* Stats */}
        <div className="flex-1 flex flex-col justify-center px-6">
          <StatRow label="Dots"    value={config.slots}           accent={meta.accentColor} />
          <StatRow label="Colors"  value={config.numColours}      accent={meta.accentColor} />
          <StatRow label="Chances" value={config.maxGuesses}      accent={meta.accentColor} />
          <StatRow label="Time"    value={`${config.totalTime}s`} accent={meta.accentColor} last />
        </div>

        {/* CTA button */}
        <button
          className="mt-6 font-display text-sm tracking-[0.2em] uppercase py-3 px-4 transition-all duration-200"
          style={{
            background:  meta.accentColor,
            borderColor: meta.accentColor,
            color:       meta.darkText,
            fontWeight:  700,
            border:      '2px solid',
            boxShadow:   hovered
              ? `0 0 24px ${meta.accentColor}80, 0 4px 16px ${meta.accentColor}40`
              : meta.recommended
              ? `0 0 12px ${meta.accentColor}40`
              : 'none',
          }}
          onClick={e => { e.stopPropagation(); onClick(); }}
        >
          ▶ PLAY NOW
        </button>

        {/* Keyboard hint for recommended card */}
        {meta.recommended && (
          <div className="mt-2 text-center font-display text-[9px] tracking-widest text-gray-600 uppercase">
            Press Enter to start
          </div>
        )}
      </div>
    </animated.div>
  );
}

// ── Difficulty screen ─────────────────────────────────────────────────────────
export default function GameSelection({ onSelect, onViewLeaderboard }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const [lbHovered, setLbHovered] = useState(false);

  const handleSelect = (mode) => {
    playStart();
    const config          = DIFFICULTY[mode];
    const availableColours = COLOURS.slice(0, config.numColours);
    const secret = Array.from({ length: config.slots }, () =>
      availableColours[Math.floor(Math.random() * availableColours.length)].id
    );
    onSelect(mode, secret);
  };

  // Global keyboard listener for Enter key (triggers Medium difficulty)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if not typing in an input (defense in depth)
      if (e.key === 'Enter' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        playStart();
        handleSelect('medium');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelect]); // handleSelect closure depends on onSelect

  return (
    <div ref={containerRef} className="flex flex-col gap-10 w-full">

      {/* Section label */}
      <div className="flex items-center gap-5">
        <div className="flex-1 h-[2px] bg-gray-700" />
        <span className="font-display text-xs md:text-sm tracking-[0.5em] text-gray-400 font-bold uppercase">
          Choose a difficulty
        </span>
        <div className="flex-1 h-[2px] bg-gray-700" />
      </div>

      {/* Cards — medium card aligned to center, outer cards slightly lower */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 w-full">
        {Object.entries(DIFFICULTY).map(([mode, config], i) => (
          <DifficultyCard
            key={mode}
            mode={mode}
            config={config}
            meta={CARD_META[mode]}
            onClick={() => handleSelect(mode)}
            enterDelay={i * 80}
          />
        ))}
      </div>

      {/* Footer: hint + leaderboard */}
      <div className="flex flex-col items-center gap-5">

        {/* Helper text */}
        <p className="font-display text-xs tracking-[0.4em] text-gray-400 font-medium uppercase">
          Select a difficulty to begin
        </p>

        {/* View High Scores */}
        <button
          onClick={() => { playActionClick(); onViewLeaderboard(); }}
          onMouseEnter={() => { setLbHovered(true); playActionHover(); }}
          onMouseLeave={() => setLbHovered(false)}
          className="font-display text-sm tracking-[0.3em] font-bold uppercase px-12 py-4 transition-all duration-200 active:scale-95"
          style={{
            background:  lbHovered ? '#00f6ff' : '#00e3fd',
            color:       '#002d33',
            boxShadow:   lbHovered ? '0 0 30px rgba(0,227,253,0.5)' : '0 0 15px rgba(0,227,253,0.2)',
          }}
        >
          ★ VIEW HIGH SCORES
        </button>
      </div>
    </div>
  );
}
