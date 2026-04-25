import { useEffect, useRef } from 'react';
import { animate as anime, stagger } from 'animejs';

export default function PegDisplay({ feedback = null, totalSlots, rowIndex }) {
  const prevFeedback = useRef(feedback);

  useEffect(() => {
    if (!prevFeedback.current && feedback) {
      requestAnimationFrame(() => {
        anime({
          targets: `.row-${rowIndex} .peg`,
          scale:   [0.1, 1],
          delay:   stagger(100),
          easing:  'easeOutBack',
        });
      });
    }
    prevFeedback.current = feedback;
  }, [feedback, rowIndex]);

  const pegs = [];
  if (feedback) {
    for (let i = 0; i < feedback.black; i++) pegs.push('black');
    for (let i = 0; i < feedback.white; i++) pegs.push('white');
  }
  while (pegs.length < totalSlots) pegs.push('empty');

  // Display in a 2-column grid
  return (
    <div
      className="grid grid-cols-2 gap-[5px] pl-4 border-l border-gray-700/60 shrink-0"
      style={{ width: 44 }}
    >
      {pegs.map((type, i) => (
        <div
          key={i}
          className={`
            w-[14px] h-[14px] rounded-full peg
            ${type === 'black' ? 'bg-[#8eff71] shadow-[0_0_8px_rgba(142,255,113,0.7)]' : ''}
            ${type === 'white' ? 'border-2 border-[#8eff71] shadow-[0_0_6px_rgba(142,255,113,0.4)] bg-transparent' : ''}
            ${type === 'empty' ? 'bg-gray-800 border border-gray-700 opacity-25' : ''}
          `}
        />
      ))}
    </div>
  );
}
