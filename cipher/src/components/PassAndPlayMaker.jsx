import { useState, useRef } from 'react';
import { useScreenEntrance } from '../hooks/useScreenEntrance';
import { COLOURS, DIFFICULTY } from '../constants';
import { playPegClick, playPegHover, playActionClick, playActionHover, playSoftError } from '../utils/audio';
import ColourSlot from './ColourSlot';

export default function PassAndPlayMaker({ difficulty, playerNumber = 1, onCodeLocked }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const config = DIFFICULTY[difficulty];
  const availableColours = COLOURS.slice(0, config.numColours);
  
  const [secret, setSecret] = useState(Array(config.slots).fill(null));
  const [activeSlot, setActiveSlot] = useState(0);

  const isReady = secret.every(c => c !== null);

  const handleColorSelect = (colorId) => {
    setSecret(prev => {
      const newSecret = [...prev];
      newSecret[activeSlot] = colorId;
      return newSecret;
    });
    // Auto-advance slot
    if (activeSlot < config.slots - 1) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const handleSlotClick = (index) => {
    setActiveSlot(index);
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#ff51fa] uppercase mb-2" style={{ textShadow: '0 0 20px rgba(255,81,250,0.4)' }}>
          PASS & PLAY
        </h2>
        <p className="font-hud text-sm tracking-widest text-gray-400 uppercase">
          Player {playerNumber}: Set the secret pattern
        </p>
      </div>

      {/* Code slots */}
      <div className="flex gap-4 md:gap-6 bg-[#0a0d14] p-8 border-2 border-gray-800 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {secret.map((colorId, index) => (
          <ColourSlot
            key={index}
            colorId={colorId}
            isSelected={activeSlot === index}
            disabled={false}
            onClick={() => {
              playPegClick();
              handleSlotClick(index);
            }}
          />
        ))}
      </div>

      {/* Color Tray */}
      <div className="mt-4">
        <p className="text-center font-display text-[10px] tracking-widest text-gray-500 uppercase mb-4">
          Select Colors
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {availableColours.map(c => (
            <button
              key={c.id}
              onClick={() => {
                playPegClick();
                handleColorSelect(c.id);
              }}
              onMouseEnter={playPegHover}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-150 active:scale-90 hover:scale-110"
              style={{
                backgroundColor: c.hex,
                border: c.border ? '2px solid #4b5563' : '2px solid transparent',
                boxShadow: `0 0 15px ${c.hex}40`,
              }}
              aria-label={`Pick ${c.id}`}
            />
          ))}
        </div>
      </div>

      {/* Lock Button */}
      <div className="w-full mt-8">
        <button
          onClick={() => {
            if (isReady) {
              playActionClick();
              onCodeLocked(secret);
            } else {
              playSoftError();
            }
          }}
          onMouseEnter={playActionHover}
          className={`w-full py-5 font-display text-lg tracking-[0.25em] font-bold uppercase border-2 transition-all duration-200 ${
            isReady 
              ? 'border-[#ff51fa] text-[#ff51fa] hover:bg-[#ff51fa]/10 shadow-[0_0_20px_rgba(255,81,250,0.3)]'
              : 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {isReady ? '🔒 LOCK CODE & PASS DEVICE' : 'FILL ALL SLOTS'}
        </button>
      </div>
    </div>
  );
}
