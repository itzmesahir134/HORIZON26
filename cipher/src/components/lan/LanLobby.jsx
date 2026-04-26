import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useScreenEntrance } from '../../hooks/useScreenEntrance';
import { onMsg, sendMsg, disconnect } from '../../utils/lanSocket';
import { playActionClick, playActionHover, playSuccess } from '../../utils/audio';

export default function LanLobby({
  roomCode,
  playerIndex,       // 0 = host, 1 = guest
  onBothConnected,   // called when guest joins (host) or when host acks (guest)
  onDisconnect,
}) {
  const containerRef = useRef(null);
  useScreenEntrance(containerRef);
  const codeRef = useRef(null);

  const isHost = playerIndex === 0;
  const [guestJoined, setGuestJoined] = useState(!isHost); // guest starts "connected"
  const [copied, setCopied] = useState(false);

  // Pulse animation on the room code
  useEffect(() => {
    if (!codeRef.current) return;
    gsap.to(codeRef.current, {
      textShadow: '0 0 40px rgba(0,227,253,0.9)',
      repeat: -1,
      yoyo: true,
      duration: 1.4,
      ease: 'sine.inOut',
    });
  }, []);

  // Listen for guest joining (host only)
  useEffect(() => {
    const unsub = onMsg('player_joined', () => {
      setGuestJoined(true);
      playSuccess();
    });
    return unsub;
  }, []);

  // Listen for disconnects
  useEffect(() => {
    const unsub = onMsg('opponent_disconnected', onDisconnect);
    return unsub;
  }, [onDisconnect]);

  // Auto-advance when both connected
  useEffect(() => {
    if (guestJoined) {
      // Give a moment to see the "connected" state
      const t = setTimeout(() => onBothConnected(), 800);
      return () => clearTimeout(t);
    }
  }, [guestJoined, onBothConnected]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-10 px-4">

      {/* Title */}
      <div className="text-center">
        <h2
          className="font-display text-3xl md:text-4xl font-black tracking-[0.2em] uppercase mb-2"
          style={{ color: '#00e3fd', textShadow: '0 0 20px rgba(0,227,253,0.4)' }}
        >
          {isHost ? 'YOUR LOBBY' : 'JOINED LOBBY'}
        </h2>
        <p className="font-hud text-xs tracking-[0.4em] text-gray-500 uppercase">
          {isHost ? 'Share this code with your opponent' : 'Waiting for host to start…'}
        </p>
      </div>

      {/* Room code display */}
      <div
        className="w-full flex flex-col items-center gap-4 p-10 border-2 relative"
        style={{
          borderColor: '#00e3fd',
          background: 'rgba(0,227,253,0.04)',
          boxShadow: '0 0 40px rgba(0,227,253,0.08)',
        }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00e3fd]/60" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00e3fd]/60" />

        <span className="font-display text-[10px] tracking-[0.5em] text-gray-600 uppercase">
          Room Code
        </span>
        <span
          ref={codeRef}
          className="font-display text-7xl font-black tracking-[0.35em] text-[#00e3fd] select-all"
        >
          {roomCode}
        </span>

        {isHost && (
          <button
            onClick={copyCode}
            className="font-display text-[10px] tracking-[0.35em] uppercase px-5 py-2 border border-[#00e3fd]/40 text-[#00e3fd] hover:bg-[#00e3fd]/10 transition-all duration-200"
          >
            {copied ? '✓ COPIED' : '⧉ COPY CODE'}
          </button>
        )}

      </div>

      {/* Player slots */}
      <div className="w-full flex flex-col gap-3">
        {/* Host slot */}
        <div
          className="flex items-center gap-4 px-5 py-4 border"
          style={{ borderColor: '#8eff71', background: 'rgba(142,255,113,0.05)' }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: '#8eff71', boxShadow: '0 0 8px #8eff71' }}
          />
          <span className="font-display text-xs tracking-[0.3em] text-[#8eff71] uppercase font-bold flex-1">
            Player 1 (Host)
          </span>
          <span className="font-hud text-[10px] tracking-widest text-[#8eff71] uppercase">
            CONNECTED
          </span>
        </div>

        {/* Guest slot */}
        <div
          className="flex items-center gap-4 px-5 py-4 border transition-all duration-500"
          style={{
            borderColor: guestJoined ? '#00e3fd' : '#374151',
            background: guestJoined ? 'rgba(0,227,253,0.05)' : 'transparent',
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: guestJoined ? '#00e3fd' : '#374151',
              boxShadow: guestJoined ? '0 0 8px #00e3fd' : 'none',
            }}
          />
          <span
            className="font-display text-xs tracking-[0.3em] uppercase font-bold flex-1"
            style={{ color: guestJoined ? '#00e3fd' : '#374151' }}
          >
            Player 2 (Guest)
          </span>
          <span
            className="font-hud text-[10px] tracking-widest uppercase"
            style={{ color: guestJoined ? '#00e3fd' : '#374151' }}
          >
            {guestJoined ? 'CONNECTED' : 'WAITING…'}
          </span>
          {!guestJoined && (
            <span className="w-3 h-3 border-2 border-gray-600 border-t-[#00e3fd] rounded-full animate-spin" />
          )}
        </div>
      </div>

      {guestJoined && isHost && (
        <p className="font-hud text-xs tracking-widest text-[#8eff71] uppercase animate-pulse">
          Both connected — launching…
        </p>
      )}

      {/* Leave */}
      <button
        onClick={() => { playActionClick(); disconnect(); onDisconnect(); }}
        onMouseEnter={playActionHover}
        className="font-display text-xs tracking-[0.3em] text-gray-700 uppercase hover:text-[#ff5555] transition-colors duration-200"
      >
        ✕ LEAVE LOBBY
      </button>
    </div>
  );
}
