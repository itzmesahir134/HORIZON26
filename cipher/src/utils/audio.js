// Web Audio API Synthesizer for UI Sounds and Ambient Soundtrack
// Generates cyberpunk-style UI sounds and background ambiance.

let audioCtx = null;
let soundtrackOsc = null;
let soundtrackGain = null;
let lfo = null;
let isSoundtrackPlaying = false;

function initCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type, duration, vol, detune = 0) {
  initCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.detune.setValueAtTime(detune, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ── Background Soundtrack ──────────────────────────────────────────────────
export const toggleSoundtrack = (play) => {
  initCtx();
  if (play && !isSoundtrackPlaying) {
    // Cyberpunk brooding drone
    soundtrackOsc = audioCtx.createOscillator();
    soundtrackGain = audioCtx.createGain();
    
    // Deep bass note (F1 ~43.65Hz)
    soundtrackOsc.type = 'sawtooth';
    soundtrackOsc.frequency.setValueAtTime(43.65, audioCtx.currentTime);
    
    // Low pass filter to make it dark
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, audioCtx.currentTime);
    
    // LFO for slow pulsing effect
    lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime); // very slow 5 second pulse
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(100, audioCtx.currentTime); // filter sweep range
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    soundtrackOsc.connect(filter);
    filter.connect(soundtrackGain);
    soundtrackGain.connect(audioCtx.destination);
    
    // Fade in
    soundtrackGain.gain.setValueAtTime(0, audioCtx.currentTime);
    soundtrackGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 3);
    
    soundtrackOsc.start();
    lfo.start();
    isSoundtrackPlaying = true;
  } else if (!play && isSoundtrackPlaying) {
    if (soundtrackGain) {
      soundtrackGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
      setTimeout(() => {
        if (soundtrackOsc) soundtrackOsc.stop();
        if (lfo) lfo.stop();
        isSoundtrackPlaying = false;
      }, 2000);
    }
  }
};

// ── Specialized UI Sounds ──────────────────────────────────────────────────

// 1. Pegs (Color selection, slot clicking) -> high mechanical glass click
export const playPegClick = () => playTone(1200, 'square', 0.04, 0.03);
export const playPegHover = () => playTone(600, 'sine', 0.03, 0.01);

// 2. Action Buttons (Submit, Save, Play Again) -> heavy tech chunk
export const playActionClick = () => {
  playTone(200, 'square', 0.08, 0.06);
  playTone(150, 'triangle', 0.1, 0.08);
};
export const playActionHover = () => playTone(250, 'sawtooth', 0.05, 0.02);

// 3. Menu/Tabs (Difficulty select, Leaderboard tabs) -> soft digital blip
export const playMenuClick = () => playTone(800, 'sine', 0.05, 0.04);
export const playMenuHover = () => playTone(400, 'sine', 0.04, 0.015);

// ── Game Event Sounds ──────────────────────────────────────────────────────

export const playStart = () => {
  initCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
};

export const playSuccess = () => {
  initCtx();
  // Triumphant chord
  setTimeout(() => playTone(523.25, 'sine', 0.2, 0.1), 0);   // C5
  setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 100); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.4, 0.1), 200); // G5
  setTimeout(() => playTone(1046.50, 'sine', 0.6, 0.1), 300); // C6
};

export const playError = () => {
  playTone(100, 'sawtooth', 0.2, 0.1);
  setTimeout(() => playTone(100, 'sawtooth', 0.3, 0.1), 150);
};

export const playSoftError = () => {
  playTone(150, 'square', 0.1, 0.05);
};
