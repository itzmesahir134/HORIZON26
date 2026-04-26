import { useRef, useEffect } from 'react';
import { useScreenEntrance } from '../hooks/useScreenEntrance';
import { playSuccess, playError, playActionHover, playActionClick } from '../utils/audio';
import { DIFFICULTY } from '../constants';

export default function PassAndPlayResult({ 
  result, // 'win' or 'loss'
  stats,  // { guesses, timeTaken, difficulty }
  player, // 1 or 2
  round,  // 1 or 2
  onNextRound,
  onShowOverallWinner
}) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  useEffect(() => {
    if (result === 'win') {
      playSuccess();
    } else {
      playError();
    }
  }, [result]);

  const config = DIFFICULTY[stats.difficulty];

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-8">
      
      <div className="text-center">
        <h2 
          className="font-display text-4xl md:text-5xl font-black tracking-[0.2em] uppercase mb-4"
          style={{
            color: result === 'win' ? '#8eff71' : '#ff5555',
            textShadow: result === 'win' ? '0 0 30px rgba(142,255,113,0.4)' : '0 0 30px rgba(255,85,85,0.4)'
          }}
        >
          {result === 'win' ? `Player ${player} Wins!` : `Player ${player} Failed!`}
        </h2>
        <p className="font-hud text-sm tracking-widest text-gray-400 uppercase">
          Round {round} Result
        </p>
      </div>

      {/* Stats Grid */}
      <div className="w-full grid grid-cols-2 gap-px bg-gray-800 border-y border-gray-800">
        <div className="bg-[#080a0f] p-6 flex flex-col items-center gap-2">
          <span className="font-display text-[10px] text-gray-500 tracking-widest uppercase">Guesses Used</span>
          <span className="font-hud text-2xl font-bold" style={{ color: result === 'win' ? '#8eff71' : '#ff5555' }}>
            {stats.guesses} <span className="text-sm text-gray-600">/ {config.maxGuesses}</span>
          </span>
        </div>
        <div className="bg-[#080a0f] p-6 flex flex-col items-center gap-2">
          <span className="font-display text-[10px] text-gray-500 tracking-widest uppercase">Time Taken</span>
          <span className="font-hud text-2xl font-bold" style={{ color: result === 'win' ? '#8eff71' : '#ff5555' }}>
            {stats.timeTaken.toFixed(1)}s
          </span>
        </div>
      </div>

      <div className="w-full mt-8">
        {round === 1 ? (
          <button
            onClick={() => {
              playActionClick();
              onNextRound();
            }}
            onMouseEnter={playActionHover}
            className="w-full py-5 font-display text-lg tracking-[0.25em] font-bold uppercase border-2 border-[#00e3fd] text-[#00e3fd] hover:bg-[#00e3fd]/10 shadow-[0_0_20px_rgba(0,227,253,0.3)] transition-all duration-200 active:scale-95"
          >
            🔄 SWAP ROLES & PLAY AGAIN
          </button>
        ) : (
          <button
            onClick={() => {
              playActionClick();
              onShowOverallWinner();
            }}
            onMouseEnter={playActionHover}
            className="w-full py-5 font-display text-lg tracking-[0.25em] font-bold uppercase bg-[#ff51fa] text-[#3a0039] hover:bg-[#ff8cfa] shadow-[0_0_20px_rgba(255,81,250,0.5)] transition-all duration-200 active:scale-95"
          >
            🏆 VIEW OVERALL WINNER
          </button>
        )}
      </div>

    </div>
  );
}
