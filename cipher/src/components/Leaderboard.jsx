import { useState, useRef, useEffect } from 'react';
import { useScreenEntrance } from '../hooks/useScreenEntrance';
import { getScores } from '../utils/leaderboardStore';
import { DIFFICULTY } from '../constants';
import { playClick, playHover } from '../utils/audio';

// ── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'easy',   label: 'BEGINNER', accent: '#8eff71',  glow: 'rgba(142,255,113,0.25)' },
  { key: 'medium', label: 'SKILLED',  accent: '#00e3fd',  glow: 'rgba(0,227,253,0.25)'   },
  { key: 'hard',   label: 'EXPERT',   accent: '#ff51fa',  glow: 'rgba(255,81,250,0.25)'  },
];

// ── Medal for top 3 ──────────────────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉'];

// ── Animated row ─────────────────────────────────────────────────────────────
function ScoreRow({ score, index, accent }) {
  const isFirst = index === 0;
  const isTop3  = index < 3;

  return (
    <div
      className="flex items-center px-5 py-3 border-b border-gray-800/60 transition-colors duration-150 hover:bg-white/[0.02]"
      style={{
        background: isFirst ? `${accent}08` : 'transparent',
        borderLeft: isFirst ? `2px solid ${accent}` : '2px solid transparent',
        animation: `fadeInUp 0.3s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Rank */}
      <div className="w-10 text-center shrink-0">
        {isTop3 ? (
          <span className="text-base leading-none">{MEDALS[index]}</span>
        ) : (
          <span className="font-display text-xs text-gray-600">#{index + 1}</span>
        )}
      </div>

      {/* Name */}
      <div
        className="flex-1 font-hud text-sm tracking-widest uppercase truncate pl-3"
        style={{ color: isFirst ? '#fff' : '#9ca3af' }}
      >
        {score.name}
      </div>

      {/* Moves */}
      <div
        className="w-16 text-right font-display text-sm font-bold shrink-0"
        style={{ color: isFirst ? accent : '#6b7280' }}
      >
        {score.attempts}
      </div>

      {/* Time */}
      <div className="w-20 text-right font-display text-xs text-gray-600 shrink-0 pl-2">
        {score.timeTaken.toFixed(1)}s
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Leaderboard({ onBack }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const [activeTab, setActiveTab] = useState('easy');
  const [displayedTab, setDisplayedTab] = useState('easy');

  const tab    = TABS.find(t => t.key === activeTab);
  const scores = getScores(displayedTab);

  // Small delay when switching tabs so rows can re-animate
  const handleTabChange = (key) => {
    setActiveTab(key);
    setTimeout(() => setDisplayedTab(key), 80);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full h-full"
      style={{ animation: 'fadeIn 0.35s ease both' }}
    >
      {/* ── Header ── */}
      <div className="text-center mb-8">
        <div className="font-display text-[10px] tracking-[0.4em] text-gray-600 mb-2 uppercase">
          ◀ Rankings ▶
        </div>
        <h2
          className="font-display text-4xl md:text-5xl font-bold tracking-[0.2em] uppercase"
          style={{
            color: tab.accent,
            textShadow: `0 0 30px ${tab.glow}, 0 0 60px ${tab.glow}`,
            transition: 'color 0.3s ease, text-shadow 0.3s ease',
          }}
        >
          HIGH SCORES
        </h2>
      </div>

      {/* ── Centered content column ── */}
      <div className="w-full max-w-[720px] mx-auto flex flex-col gap-0 flex-1">

        {/* ── Tabs ── */}
        <div className="flex border border-gray-800 bg-[#0a0d14]">
          {TABS.map(t => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onMouseEnter={playHover}
                onClick={() => { playClick(); handleTabChange(t.key); }}
                className="flex-1 py-3 font-display text-xs tracking-[0.25em] uppercase transition-all duration-200 relative"
                style={{
                  color:      isActive ? t.accent : '#4b5563',
                  background: isActive ? `${t.accent}0d` : 'transparent',
                  borderBottom: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
                }}
              >
                {isActive && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: `inset 0 -4px 12px ${t.glow}` }}
                  />
                )}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Table Container ── */}
        <div className="flex-1 bg-[#0a0d14]/90 border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative">
          
          {/* Cyberpunk corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: `${tab.accent}60` }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: `${tab.accent}60` }} />

          {/* Column headers */}
          <div className="flex items-center px-5 py-3 border-b border-gray-800/80 bg-[#0d1117]/50">
            <div className="w-10 shrink-0" />
            <div className="flex-1 pl-3 font-display text-[9px] tracking-[0.3em] text-gray-500 uppercase">Pilot</div>
            <div className="w-16 text-right font-display text-[9px] tracking-[0.3em] text-gray-500 uppercase shrink-0">Moves</div>
            <div className="w-20 text-right font-display text-[9px] tracking-[0.3em] text-gray-500 uppercase shrink-0 pl-2">Time</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col min-h-[280px]">
            {scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16 text-center">
                <div className="font-display text-2xl" style={{ color: `${tab.accent}40` }}>—</div>
                <p className="font-hud text-xs tracking-widest text-gray-500 uppercase">
                  NO NETWORK RECORDS FOUND
                </p>
                <p className="font-display text-[10px] text-gray-600 tracking-[0.2em] mt-1 uppercase">
                  Complete a sequence to establish ranking
                </p>
              </div>
            ) : (
              scores.map((score, i) => (
                <ScoreRow
                  key={`${displayedTab}-${i}`}
                  score={score}
                  index={i}
                  accent={tab.accent}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Back button ── */}
        <div className="mt-6 pb-4">
          <button
            onClick={() => { playClick(); onBack(); }}
            className="w-full py-4 font-display text-xs tracking-[0.3em] uppercase border-2 transition-all duration-200"
            style={{
              color:        tab.accent,
              borderColor:  `${tab.accent}40`,
            }}
            onMouseEnter={e => {
              playHover();
              e.currentTarget.style.background    = `${tab.accent}10`;
              e.currentTarget.style.borderColor   = tab.accent;
              e.currentTarget.style.boxShadow     = `0 0 18px ${tab.glow}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background    = 'transparent';
              e.currentTarget.style.borderColor   = `${tab.accent}40`;
              e.currentTarget.style.boxShadow     = 'none';
            }}
          >
            ◀ BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
