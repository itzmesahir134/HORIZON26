import { useRef } from 'react';
import { useScreenEntrance } from '../hooks/useScreenEntrance';
import { playStart, playActionHover } from '../utils/audio';

export default function PassAndPlayTransition({ playerToPlay, onReady }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  // Auto-focus logic can be added if needed, but a clear button is best

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full min-h-[60vh] gap-10">
      
      <div className="text-center">
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[0.2em] text-white uppercase mb-6">
          Device Locked
        </h2>
        
        <div className="font-hud text-lg md:text-xl tracking-widest text-[#00e3fd] uppercase p-8 border-2 border-[#00e3fd]/40 bg-[#00e3fd]/10 rounded-xl shadow-[0_0_30px_rgba(0,227,253,0.2)]">
          Pass the device to <span className="font-bold text-white">Player {playerToPlay}</span>
        </div>
      </div>

      <div className="mt-8">
        <p className="font-display text-[10px] tracking-widest text-gray-500 uppercase text-center mb-4">
          Player {playerToPlay}, press when ready
        </p>
        <button
          onClick={() => {
            playStart();
            onReady();
          }}
          onMouseEnter={playActionHover}
          className="px-12 py-5 font-display text-lg tracking-[0.3em] font-bold uppercase bg-[#00e3fd] text-[#002d33] rounded-lg hover:bg-[#4dffff] active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(0,227,253,0.4)]"
        >
          ▶ I AM READY
        </button>
      </div>

    </div>
  );
}
