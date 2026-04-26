import { useRef, useEffect } from 'react';
import { useScreenEntrance } from '../hooks/useScreenEntrance';
import { playSuccess, playActionHover, playActionClick } from '../utils/audio';

export default function PassAndPlayWinner({ p1Stats, p2Stats, onHome }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  useEffect(() => {
    playSuccess();
  }, []);

  const getWinner = () => {
    const p1Score = p1Stats.result === 'win' ? p1Stats.guesses : 999;
    const p2Score = p2Stats.result === 'win' ? p2Stats.guesses : 999;
    if (p1Score < p2Score) return 1;
    if (p2Score < p1Score) return 2;
    // Equal guesses: check time (both must have won)
    if (p1Stats.result === 'win' && p2Stats.result === 'win') {
      if (p1Stats.timeTaken < p2Stats.timeTaken) return 1;
      if (p2Stats.timeTaken < p1Stats.timeTaken) return 2;
    }
    return 0; // Tie or both lost
  };
  const winner = getWinner();

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-8 px-4">
      
      <div className="text-center mb-4">
        <h2 className="font-display text-5xl md:text-6xl font-black tracking-[0.2em] uppercase text-white mb-4" style={{ textShadow: '0 0 40px rgba(255,255,255,0.4)' }}>
          {winner === 0 ? 'TIE GAME!' : `PLAYER ${winner} WINS!`}
        </h2>
        <p className="font-hud text-sm tracking-widest text-[#ff51fa] uppercase">
          Final Pass & Play Results
        </p>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-6">
        
        {/* P1 Stats */}
        <div className={`flex-1 flex flex-col p-6 rounded-xl border-2 ${winner === 1 ? 'border-[#8eff71] bg-[#8eff71]/10' : 'border-gray-800 bg-[#0a0d14]'}`}>
          <h3 className="font-display text-xl tracking-[0.2em] font-bold text-white mb-4 text-center">PLAYER 1</h3>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="font-hud text-xs text-gray-500 uppercase">Status</span>
            <span className="font-hud text-sm font-bold" style={{ color: p1Stats.result === 'win' ? '#8eff71' : '#ff5555' }}>
              {p1Stats.result.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="font-hud text-xs text-gray-500 uppercase">Guesses</span>
            <span className="font-hud text-sm text-white font-bold">{p1Stats.result === 'win' ? p1Stats.guesses : '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-hud text-xs text-gray-500 uppercase">Time</span>
            <span className="font-hud text-sm text-white font-bold">{p1Stats.timeTaken.toFixed(1)}s</span>
          </div>
        </div>

        {/* P2 Stats */}
        <div className={`flex-1 flex flex-col p-6 rounded-xl border-2 ${winner === 2 ? 'border-[#8eff71] bg-[#8eff71]/10' : 'border-gray-800 bg-[#0a0d14]'}`}>
          <h3 className="font-display text-xl tracking-[0.2em] font-bold text-white mb-4 text-center">PLAYER 2</h3>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="font-hud text-xs text-gray-500 uppercase">Status</span>
            <span className="font-hud text-sm font-bold" style={{ color: p2Stats.result === 'win' ? '#8eff71' : '#ff5555' }}>
              {p2Stats.result.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="font-hud text-xs text-gray-500 uppercase">Guesses</span>
            <span className="font-hud text-sm text-white font-bold">{p2Stats.result === 'win' ? p2Stats.guesses : '-'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-hud text-xs text-gray-500 uppercase">Time</span>
            <span className="font-hud text-sm text-white font-bold">{p2Stats.timeTaken.toFixed(1)}s</span>
          </div>
        </div>

      </div>

      <div className="w-full mt-8 max-w-sm">
        <button
          onClick={() => {
            playActionClick();
            onHome();
          }}
          onMouseEnter={playActionHover}
          className="w-full py-5 font-display text-lg tracking-[0.25em] font-bold uppercase border-2 border-[#00e3fd] text-[#00e3fd] hover:bg-[#00e3fd]/10 shadow-[0_0_20px_rgba(0,227,253,0.3)] transition-all duration-200 active:scale-95"
        >
          ▶ MAIN MENU
        </button>
      </div>

    </div>
  );
}
