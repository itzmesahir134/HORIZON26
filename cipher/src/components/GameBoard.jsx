import { useState, useRef, useEffect } from 'react';

import { animate as anime } from 'animejs';
import { useScreenEntrance } from '../hooks/useScreenEntrance';
import { COLOURS, DIFFICULTY } from '../constants';
import ColourSlot from './ColourSlot';
import PegDisplay from './PegDisplay';

// ── Inline always-visible color tray ────────────────────────────────────────
function ColorTray({ availableColours, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {availableColours.map(c => {
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-150 active:scale-90 hover:scale-110"
            style={{
              backgroundColor: c.hex,
              border:     c.border ? '2px solid #4b5563' : '2px solid transparent',
              boxShadow:  `0 0 10px ${c.hex}44`,
            }}
            aria-label={`Pick ${c.id}`}
          />
        );
      })}
    </div>
  );
}

// ── Guess Row ────────────────────────────────────────────────────────────────
function GuessRow({ rowIndex, isActive, isPast, slots, guessData, feedback, onSlotClick, activeSlotIndex, isFirst }) {
  return (
    <div
      className={`row-${rowIndex} flex items-center gap-4 px-4 py-6 border-b border-gray-800/40 transition-all duration-200 overflow-visible
        ${isFirst ? 'mt-8' : ''}
        ${isActive ? 'bg-[#0f1720] border-l-[3px] border-l-[#8eff71]' : ''}
        ${isPast   ? 'opacity-75' : ''}
        ${!isActive && !isPast ? 'opacity-20' : ''}
      `}
    >
      {/* Row number */}
      <span className="font-display text-[10px] text-gray-600 w-4 text-right shrink-0">
        {rowIndex + 1}
      </span>

      {/* Colour slots */}
      <div className="flex gap-2 md:gap-3 flex-1 justify-center">
        {Array.from({ length: slots }).map((_, slotIndex) => (
          <ColourSlot
            key={slotIndex}
            colorId={guessData ? guessData[slotIndex] : null}
            isSelected={isActive && activeSlotIndex === slotIndex}
            disabled={!isActive}
            onClick={() => onSlotClick(slotIndex)}
          />
        ))}
      </div>

      {/* Feedback pegs */}
      <PegDisplay feedback={feedback} totalSlots={slots} rowIndex={rowIndex} />
    </div>
  );
}

// ── Game Board ───────────────────────────────────────────────────────────────
export default function GameBoard({ difficulty, secret, guesses, feedbacks, currentGuess, onUpdateGuess, onSubmitGuess }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const config           = DIFFICULTY[difficulty];
  const availableColours = COLOURS.slice(0, config.numColours);

  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  // Synchronous shadow of currentGuess to handle rapid clicks flawlessly
  const localGuessRef = useRef([...currentGuess]);

  // Reset active slot and local shadow when row changes (next guess)
  useEffect(() => {
    localGuessRef.current = [...currentGuess];
    setActiveSlotIndex(0);
  }, [guesses.length]);

  const isSubmitReady = currentGuess.every(c => c !== null);

  // Click a slot → just activate it
  const handleSlotClick = (index) => setActiveSlotIndex(index);

  // Click a color in the tray → assign to active slot, auto-advance
  const handleColorPick = (colorId) => {
    setActiveSlotIndex(prevSlot => {
      if (prevSlot === null) return null;

      // 1. Synchronously update local shadow
      localGuessRef.current[prevSlot] = colorId;

      // 2. Dispatch update to parent
      onUpdateGuess([...localGuessRef.current]);

      // 3. Find next empty slot synchronously
      const nextEmpty = localGuessRef.current.findIndex(c => c === null);
      return nextEmpty !== -1 ? nextEmpty : null;
    });
  };

  // Clear a slot on double-click / right-click
  const handleSlotClear = (index) => {
    localGuessRef.current[index] = null;
    onUpdateGuess([...localGuessRef.current]);
    setActiveSlotIndex(index);
  };


  // Build row data
  const allRows = Array.from({ length: config.maxGuesses }, (_, i) => {
    if (i < guesses.length)     return { type: 'past',   guess: guesses[i],   feedback: feedbacks[i] };
    if (i === guesses.length)   return { type: 'active', guess: currentGuess, feedback: null };
    return                               { type: 'future', guess: null,         feedback: null };
  });

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto h-full">

      {/* ── Board ── */}
      <div className="flex-1 flex flex-col bg-[#080b12] border border-gray-700/80 shadow-2xl overflow-hidden">

        {/* Board header */}
        <div className="bg-[#0a0d14] px-5 py-2.5 border-b border-gray-700/60 flex justify-between items-center">
          <span className="font-display text-xs tracking-[0.3em] text-gray-400 font-medium uppercase">
            Game Board
            <span className="ml-2 text-gray-600">// {difficulty}</span>
          </span>
          <span className="font-display text-[10px] tracking-[0.2em] text-[#8eff71] uppercase">
            {config.maxGuesses - guesses.length} chances left
          </span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto flex flex-col px-5 pb-5 pt-12 gap-5 scroll-pt-12">
          {allRows.map((row, i) => (
            <GuessRow
              key={i}
              rowIndex={i}
              isFirst={i === 0}
              isActive={row.type === 'active'}
              isPast={row.type === 'past'}
              slots={config.slots}
              guessData={row.guess}
              feedback={row.feedback}
              activeSlotIndex={activeSlotIndex}
              onSlotClick={handleSlotClick}
            />
          ))}
        </div>
      </div>

      {/* ── Side Panel ── */}
      <div className="w-full md:w-64 flex flex-col gap-5 shrink-0">

        {/* Instructions */}
        <div className="bg-[#080b12] border border-gray-700/60 px-5 py-4">
          <p className="font-display text-[10px] tracking-[0.4em] text-gray-500 uppercase mb-3">How to play</p>
          <ol className="flex flex-col gap-2">
            {[
              'Click a circle to select a slot',
              'Pick a color from the tray below',
              'Fill all slots, then submit',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center font-display text-[9px] font-bold mt-0.5"
                  style={{ background: '#8eff71', color: '#0a3d00' }}
                >
                  {i + 1}
                </span>
                <span className="font-hud text-xs tracking-widest text-gray-300 uppercase leading-snug">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Color tray */}
        <div className="bg-[#080b12] border border-gray-700/60 px-5 py-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-[9px] tracking-[0.3em] text-gray-600 uppercase">
              Pick a color
            </p>
            {/* Active slot indicator */}
            <span className="font-display text-[9px] tracking-widest text-[#8eff71] uppercase">
              Slot {activeSlotIndex != null ? activeSlotIndex + 1 : '—'}
            </span>
          </div>

          <ColorTray
            availableColours={availableColours}
            onSelect={handleColorPick}
          />

          {/* Clear slot hint */}
          <p className="font-display text-[9px] tracking-widest text-gray-700 uppercase text-center">
            Click a filled slot to re-select it
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={isSubmitReady ? onSubmitGuess : () => anime({ targets: `.row-${guesses.length}`, translateX: [0, -8, 8, -6, 6, -3, 3, 0], duration: 380 })}
          className={`
            w-full py-4 font-display text-sm tracking-[0.25em] uppercase font-bold transition-all duration-200 active:scale-[0.98]
            ${isSubmitReady
              ? 'bg-[#8eff71] text-[#0a3d00] shadow-[0_0_20px_rgba(142,255,113,0.4)] cursor-pointer hover:brightness-110'
              : 'bg-transparent text-gray-700 border-2 border-gray-800 cursor-not-allowed'
            }
          `}
        >
          {isSubmitReady ? '▶ CHECK PATTERN' : 'Fill all slots first'}
        </button>

      </div>
    </div>
  );
}
