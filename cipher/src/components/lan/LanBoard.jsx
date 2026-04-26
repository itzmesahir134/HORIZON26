import { useState, useRef, useEffect, useCallback } from 'react';
import { useScreenEntrance } from '../../hooks/useScreenEntrance';
import { COLOURS, DIFFICULTY } from '../../constants';
import { computeFeedback } from '../../utils/computeFeedback';
import { onMsg, sendMsg } from '../../utils/lanSocket';
import { playPegClick, playPegHover, playActionClick, playSoftError, playSuccess, playError } from '../../utils/audio';
import ColourSlot from '../ColourSlot';
import PegDisplay from '../PegDisplay';

// ── Scaled-down mini board showing opponent's progress ──────────────────────
function OpponentMiniBoard({ guesses, feedbacks, slots, maxGuesses }) {
  return (
    <div
      className="flex flex-col border border-gray-800 bg-[#060810] shrink-0"
      style={{ width: 160, minHeight: 160, maxHeight: 420, overflowY: 'auto' }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800 bg-[#0a0d14]">
        <span className="font-display text-[8px] tracking-[0.3em] text-gray-500 uppercase">
          Opponent · {guesses.length}/{maxGuesses}
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col p-2 gap-1.5">
        {Array.from({ length: Math.min(guesses.length + 1, maxGuesses) }, (_, i) => {
          const g = guesses[i];
          const f = feedbacks[i];
          return (
            <div key={i} className="flex items-center gap-1.5">
              {/* Mini slots */}
              <div className="flex gap-[3px]">
                {Array.from({ length: slots }, (_, s) => {
                  const col = g ? COLOURS.find(c => c.id === g[s]) : null;
                  return (
                    <div
                      key={s}
                      className="w-3.5 h-3.5 rounded-full border border-white/10"
                      style={{
                        backgroundColor: col ? col.hex : 'transparent',
                        borderColor: col ? 'transparent' : '#374151',
                      }}
                    />
                  );
                })}
              </div>

              {/* Mini pegs */}
              {f && (
                <div className="flex gap-[2px] flex-wrap" style={{ width: 20 }}>
                  {Array.from({ length: slots }, (__, p) => {
                    const type =
                      p < f.black ? 'black' :
                      p < f.black + f.white ? 'white' : 'empty';
                    return (
                      <div
                        key={p}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            type === 'black' ? '#8eff71' :
                            type === 'white' ? 'transparent' : '#1f2937',
                          border: type === 'white' ? '1px solid #8eff71' : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {guesses.length === 0 && (
          <p className="font-display text-[8px] tracking-widest text-gray-700 uppercase text-center py-4">
            No guesses yet
          </p>
        )}
      </div>
    </div>
  );
}

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer(totalTime) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const tick = () => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const remaining = Math.max(0, totalTime - elapsed);
  return { remaining, startTimeRef };
}

// ── Guess Row ─────────────────────────────────────────────────────────────────
function GuessRow({ rowIndex, isActive, isPast, slots, guessData, feedback, onSlotClick, activeSlotIndex, isFirst }) {
  return (
    <div
      className={`row-${rowIndex} flex items-center gap-3 px-3 py-4 border-b border-gray-800/40 transition-all duration-200
        ${isFirst ? 'mt-4' : ''}
        ${isActive ? 'bg-[#0f1720] border-l-2 border-l-[#00e3fd]' : ''}
        ${isPast   ? 'opacity-70' : ''}
        ${!isActive && !isPast ? 'opacity-15' : ''}
      `}
    >
      <span className="font-display text-[9px] text-gray-700 w-3 text-right shrink-0">{rowIndex + 1}</span>
      <div className="flex gap-1.5 flex-1 justify-center items-center">
        {Array.from({ length: slots }, (_, s) => (
          <ColourSlot
            key={s}
            colorId={guessData ? guessData[s] : null}
            isSelected={isActive && activeSlotIndex === s}
            disabled={!isActive}
            onClick={() => { if (isActive && onSlotClick) { playPegClick(); onSlotClick(s); } }}
          />
        ))}
      </div>
      <PegDisplay feedback={feedback} totalSlots={slots} rowIndex={rowIndex} />
    </div>
  );
}

// ── Main LAN Board ────────────────────────────────────────────────────────────
export default function LanBoard({
  difficulty,
  mySecret,          // my own code (so I can validate opponent's guesses?)
  opponentSecret,    // opponent's code I'm guessing
  playerIndex,
  onFinished,        // (result, guesses, timeTaken, mySecret) => void
  onDisconnect,
}) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const config = DIFFICULTY[difficulty];
  const availableColours = COLOURS.slice(0, config.numColours);
  const { remaining, startTimeRef } = useTimer(config.totalTime);

  // My board state
  const [myGuesses, setMyGuesses] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(Array(config.slots).fill(null));
  const [activeSlot, setActiveSlot] = useState(0);
  const [finished, setFinished] = useState(false);

  // Opponent mini board
  const [oppGuesses, setOppGuesses] = useState([]);
  const [oppFeedbacks, setOppFeedbacks] = useState([]);
  const [oppFinished, setOppFinished] = useState(null); // { result, guesses, timeTaken }

  const isSubmitReady = currentGuess.every(c => c !== null);
  const localGuessRef = useRef([...currentGuess]);

  // Reset active slot & local shadow on new row
  useEffect(() => {
    if (myGuesses.length > 0) {
      localGuessRef.current = Array(config.slots).fill(null);
      setActiveSlot(0);
    }
  }, [myGuesses.length, config.slots]);

  // ── Listen for opponent moves ─────────────────────────────────────────────
  useEffect(() => {
    const unsubGuess = onMsg('peer_guess', ({ guessIndex, guess, feedback }) => {
      setOppGuesses(prev => {
        const next = [...prev];
        next[guessIndex] = guess;
        return next;
      });
      setOppFeedbacks(prev => {
        const next = [...prev];
        next[guessIndex] = feedback;
        return next;
      });
    });

    const unsubFin = onMsg('peer_finished', (data) => {
      setOppFinished(data);
    });

    const unsubDisc = onMsg('opponent_disconnected', onDisconnect);

    return () => { unsubGuess(); unsubFin(); unsubDisc(); };
  }, [onDisconnect]);

  // ── Timeout ───────────────────────────────────────────────────────────────
  const checkTimeout = useCallback(() => {
    if (remaining <= 0 && !finished) {
      setFinished(true);
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;
      sendMsg('peer_finished', { result: 'loss', guesses: myGuesses.length, timeTaken });
      onFinished('loss', myGuesses, myFeedbacks, timeTaken, mySecret, opponentSecret);
    }
  }, [remaining, finished, myGuesses.length, myFeedbacks, mySecret, opponentSecret, onFinished, startTimeRef]);

  useEffect(() => {
    checkTimeout();
  }, [checkTimeout]);

  // ── Color pick ────────────────────────────────────────────────────────────
  const handleColorPick = useCallback((colorId) => {
    if (finished) return;
    setActiveSlot(prevSlot => {
      if (prevSlot === null) return null;
      localGuessRef.current[prevSlot] = colorId;
      setCurrentGuess([...localGuessRef.current]);
      const nextEmpty = localGuessRef.current.findIndex(c => c === null);
      return nextEmpty !== -1 ? nextEmpty : null;
    });
  }, [finished]);

  // ── Submit guess ──────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!isSubmitReady || finished) { playSoftError(); return; }

    const feedback = computeFeedback(opponentSecret, currentGuess);
    const guessIndex = myGuesses.length;
    const newGuesses = [...myGuesses, currentGuess];
    const newFeedbacks = [...myFeedbacks, feedback];

    setMyGuesses(newGuesses);
    setMyFeedbacks(newFeedbacks);
    setCurrentGuess(Array(config.slots).fill(null));
    playActionClick();

    // Sync to opponent (masked — no secret info)
    sendMsg('peer_guess', { guessIndex, guess: currentGuess, feedback });

    // Check win
    if (feedback.black === config.slots) {
      playSuccess();
      handleGameEnd('win', newGuesses, newFeedbacks);
      return;
    }
    // Check loss by guesses
    if (newGuesses.length >= config.maxGuesses) {
      playError();
      handleGameEnd('loss', newGuesses, newFeedbacks);
    }
  };

  const handleGameEnd = (result, g = myGuesses, f = myFeedbacks) => {
    if (finished) return;
    setFinished(true);
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    sendMsg('peer_finished', { result, guesses: g.length, timeTaken });
    onFinished(result, g, f, timeTaken, mySecret, opponentSecret);
  };

  // Timer color
  const timerColor = remaining <= 10 ? '#ff5555' : remaining <= 20 ? '#D69E2E' : '#00e3fd';

  return (
    <div ref={containerRef} className="flex-1 flex flex-col gap-4 w-full h-full min-h-0">

      {/* ── Top HUD strip ── */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#8eff71', boxShadow: '0 0 6px #8eff71' }}
          />
          <span className="font-display text-[10px] tracking-[0.3em] text-gray-400 uppercase">
            Player {playerIndex + 1} · {difficulty}
          </span>
        </div>
        <div className="flex items-center gap-6">
          {/* Timer */}
          <div className="flex flex-col items-center">
            <span className="font-display text-[8px] tracking-widest text-gray-600 uppercase">Time</span>
            <span
              className="font-display text-2xl font-black tabular-nums"
              style={{ color: timerColor, textShadow: `0 0 12px ${timerColor}` }}
            >
              {Math.ceil(remaining)}s
            </span>
          </div>
          {/* Guesses */}
          <div className="flex flex-col items-center">
            <span className="font-display text-[8px] tracking-widest text-gray-600 uppercase">Left</span>
            <span className="font-display text-2xl font-black text-[#00e3fd]">
              {config.maxGuesses - myGuesses.length}
            </span>
          </div>
          {/* Opponent status */}
          {oppFinished && (
            <div
              className="px-3 py-1.5 font-display text-[9px] tracking-widest uppercase font-bold"
              style={{
                color: oppFinished.result === 'win' ? '#ff5555' : '#8eff71',
                border: `1px solid ${oppFinished.result === 'win' ? '#ff5555' : '#8eff71'}`,
                background: oppFinished.result === 'win' ? 'rgba(255,85,85,0.1)' : 'rgba(142,255,113,0.1)',
              }}
            >
              OPP: {oppFinished.result === 'win' ? `SOLVED in ${oppFinished.guesses}` : 'FAILED'}
            </div>
          )}
        </div>
      </div>

      {/* ── Main area: my board + opponent mini board ── */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* My Board */}
        <div className="flex-1 flex flex-col bg-[#080b12] border border-gray-700/80 overflow-hidden">

          {/* Board header */}
          <div className="bg-[#0a0d14] px-4 py-2 border-b border-gray-700/60 flex justify-between items-center shrink-0">
            <span className="font-display text-[9px] tracking-[0.3em] text-gray-400 uppercase">
              Your Board
            </span>
            <span className="font-display text-[9px] tracking-[0.2em] text-[#00e3fd] uppercase">
              {config.maxGuesses - myGuesses.length} chances left
            </span>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto flex flex-col py-2 scroll-pt-8">
            <div className="h-2 shrink-0 w-full" aria-hidden="true" />
            {Array.from({ length: config.maxGuesses }, (_, i) => {
              const type =
                i < myGuesses.length   ? 'past' :
                i === myGuesses.length ? 'active' : 'future';
              return (
                <GuessRow
                  key={i}
                  rowIndex={i}
                  isFirst={i === 0}
                  isActive={type === 'active' && !finished}
                  isPast={type === 'past'}
                  slots={config.slots}
                  guessData={type === 'active' ? currentGuess : myGuesses[i] || null}
                  feedback={myFeedbacks[i] || null}
                  activeSlotIndex={activeSlot}
                  onSlotClick={idx => setActiveSlot(idx)}
                />
              );
            })}
          </div>
        </div>

        {/* Opponent mini board */}
        <OpponentMiniBoard
          guesses={oppGuesses}
          feedbacks={oppFeedbacks}
          slots={config.slots}
          maxGuesses={config.maxGuesses}
        />
      </div>

      {/* ── Color tray + Submit ── */}
      {!finished && (
        <div className="shrink-0 flex flex-col gap-3">
          {/* Color tray */}
          <div className="bg-[#080b12] border border-gray-700/60 px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-[9px] tracking-[0.3em] text-gray-600 uppercase">Pick a color</p>
              <span className="font-display text-[9px] tracking-widest text-[#00e3fd] uppercase">
                Slot {activeSlot != null ? activeSlot + 1 : '—'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableColours.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleColorPick(c.id)}
                  onMouseEnter={playPegHover}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-150 active:scale-90 hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    border: c.border ? '2px solid #4b5563' : '2px solid transparent',
                    boxShadow: `0 0 10px ${c.hex}44`,
                  }}
                  aria-label={`Pick ${c.id}`}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className={`w-full py-4 font-display text-sm tracking-[0.25em] uppercase font-bold transition-all duration-200 active:scale-[0.98]
              ${isSubmitReady
                ? 'bg-[#00e3fd] text-[#002d33] shadow-[0_0_20px_rgba(0,227,253,0.4)] cursor-pointer hover:brightness-110'
                : 'bg-transparent text-gray-700 border-2 border-gray-800 cursor-not-allowed'
              }`}
          >
            {isSubmitReady ? '▶ CHECK PATTERN' : 'Fill all slots first'}
          </button>
        </div>
      )}

      {/* Finished overlay hint */}
      {finished && (
        <div className="shrink-0 py-4 text-center border border-gray-800 bg-[#080b12]">
          <p className="font-hud text-xs tracking-widest text-gray-400 uppercase animate-pulse">
            Waiting for opponent to finish…
          </p>
        </div>
      )}
    </div>
  );
}
