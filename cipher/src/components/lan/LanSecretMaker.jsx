import { useState, useRef, useEffect } from 'react';
import { useScreenEntrance } from '../../hooks/useScreenEntrance';
import { COLOURS, DIFFICULTY } from '../../constants';
import { onMsg, sendMsg } from '../../utils/lanSocket';
import { playPegClick, playPegHover, playActionClick, playActionHover, playSoftError, playSuccess } from '../../utils/audio';
import ColourSlot from '../ColourSlot';

export default function LanSecretMaker({ difficulty, playerIndex, onGameStart, onDisconnect }) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);

  const config = DIFFICULTY[difficulty];
  const availableColours = COLOURS.slice(0, config.numColours);

  const [secret, setSecret] = useState(Array(config.slots).fill(null));
  const [activeSlot, setActiveSlot] = useState(0);
  const [selfReady, setSelfReady] = useState(false);
  const selfReadyRef = useRef(false);
  const [opponentReady, setOpponentReady] = useState(false);

  const isReady = secret.every(c => c !== null);

  // ── Keep a ref in sync so the game_start callback never reads stale secret ─
  const secretRef = useRef(secret);
  useEffect(() => { secretRef.current = secret; }, [secret]);

  const opponentSecretRef = useRef(null);

  // ── Listen for server events ──────────────────────────────────────────────
  useEffect(() => {
    const unsubPeerReady = onMsg('peer_ready', ({ secret: oppSecret }) => {
      setOpponentReady(true);
      opponentSecretRef.current = oppSecret;

      if (selfReadyRef.current) {
        setTimeout(() => {
          playSuccess();
          onGameStart(secretRef.current, oppSecret, difficulty);
        }, 500);
      }
    });

    const unsubDisc = onMsg('opponent_disconnected', onDisconnect);

    return () => { unsubPeerReady(); unsubDisc(); };
  }, [onGameStart, onDisconnect, difficulty]);

  const handleColorSelect = (colorId) => {
    if (selfReady) return;
    setSecret(prev => {
      const next = [...prev];
      next[activeSlot] = colorId;
      return next;
    });
    if (activeSlot < config.slots - 1) setActiveSlot(activeSlot + 1);
  };

  const handleSlotClick = (index) => {
    if (!selfReady) setActiveSlot(index);
  };

  const handleReady = () => {
    if (!isReady) { playSoftError(); return; }
    playActionClick();
    setSelfReady(true);
    selfReadyRef.current = true;
    sendMsg('peer_ready', { secret });

    if (opponentReady) {
      setTimeout(() => {
        playSuccess();
        onGameStart(secretRef.current, opponentSecretRef.current, difficulty);
      }, 500);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-8 px-4">

      {/* Title */}
      <div className="text-center">
        <h2
          className="font-display text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#ff51fa] uppercase mb-2"
          style={{ textShadow: '0 0 20px rgba(255,81,250,0.4)' }}
        >
          SET YOUR CODE
        </h2>
        <p className="font-hud text-sm tracking-widest text-gray-400 uppercase">
          Player {playerIndex + 1}: Set the secret pattern
        </p>
      </div>

      {/* Code slots */}
      <div
        className="flex gap-4 md:gap-6 bg-[#0a0d14] p-8 border-2 rounded-2xl"
        style={{
          borderColor: selfReady ? '#8eff71' : '#1f2937', // gray-800
          boxShadow: selfReady ? '0 0 30px rgba(142,255,113,0.1)' : '0 0 30px rgba(0,0,0,0.5)',
          transition: 'all 0.4s ease',
        }}
      >
        {secret.map((colorId, index) => (
          <ColourSlot
            key={index}
            colorId={colorId}
            isSelected={!selfReady && activeSlot === index}
            disabled={selfReady}
            onClick={() => { playPegClick(); handleSlotClick(index); }}
          />
        ))}
      </div>

      {/* Color tray */}
      {!selfReady && (
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-[10px] tracking-widest text-gray-500 uppercase">
            Select Colors
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {availableColours.map(c => (
              <button
                key={c.id}
                onClick={() => { playPegClick(); handleColorSelect(c.id); }}
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
      )}

      {/* Status / Ready indicators */}
      <div className="w-full flex flex-col gap-3">
        {/* Self status */}
        <div
          className="flex items-center justify-between px-5 py-3 border"
          style={{ borderColor: selfReady ? '#8eff71' : '#374151' }}
        >
          <span className="font-display text-xs tracking-widest text-gray-400 uppercase">
            You
          </span>
          <span
            className="font-hud text-xs tracking-widest uppercase font-bold"
            style={{ color: selfReady ? '#8eff71' : '#374151' }}
          >
            {selfReady ? '✓ READY' : 'NOT READY'}
          </span>
        </div>

        {/* Opponent status */}
        <div
          className="flex items-center justify-between px-5 py-3 border"
          style={{ borderColor: opponentReady ? '#00e3fd' : '#374151' }}
        >
          <span className="font-display text-xs tracking-widest text-gray-400 uppercase">
            Opponent
          </span>
          <span
            className="font-hud text-xs tracking-widest uppercase font-bold"
            style={{ color: opponentReady ? '#00e3fd' : '#374151' }}
          >
            {opponentReady ? '✓ READY' : 'SETTING CODE…'}
          </span>
          {!opponentReady && (
            <span className="w-3 h-3 border-2 border-gray-700 border-t-[#00e3fd] rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Ready button */}
      {!selfReady && (
        <button
          onClick={handleReady}
          onMouseEnter={playActionHover}
          className={`w-full py-5 font-display text-lg tracking-[0.25em] font-bold uppercase border-2 transition-all duration-200 ${
            isReady
              ? 'border-[#ff51fa] text-[#ff51fa] hover:bg-[#ff51fa]/10 shadow-[0_0_20px_rgba(255,81,250,0.3)] cursor-pointer'
              : 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {isReady ? '🔒 LOCK CODE & READY UP' : 'FILL ALL SLOTS FIRST'}
        </button>
      )}

      {selfReady && !opponentReady && (
        <div className="flex items-center gap-3 text-center">
          <span className="w-4 h-4 border-2 border-[#00e3fd] border-t-transparent rounded-full animate-spin" />
          <p className="font-hud text-sm tracking-widest text-[#00e3fd] uppercase">
            Waiting for opponent…
          </p>
        </div>
      )}
    </div>
  );
}
