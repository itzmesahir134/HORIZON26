// Web Audio API Synthesizer for UI Sounds
// Generates cyberpunk-style UI sounds without needing external audio files.

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export const playClick = () => {
  // Short, high-pitched mechanical click
  playTone(800, 'square', 0.05, 0.05);
};

export const playHover = () => {
  // Very soft, low blip
  playTone(300, 'sine', 0.05, 0.02);
};

export const playSuccess = () => {
  // Rising major third sequence
  if (audioCtx.state === 'suspended') audioCtx.resume();
  setTimeout(() => playTone(523.25, 'sine', 0.15, 0.1), 0);   // C5
  setTimeout(() => playTone(659.25, 'sine', 0.15, 0.1), 100); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.3, 0.1), 200);  // G5
};

export const playError = () => {
  // Harsh low buzz
  playTone(150, 'sawtooth', 0.2, 0.1);
  setTimeout(() => playTone(150, 'sawtooth', 0.3, 0.1), 150);
};

export const playStart = () => {
  // Tech bootup sound
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
};
