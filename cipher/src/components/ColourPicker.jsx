import { useSpring, useTrail, animated } from '@react-spring/web';
import { COLOURS } from '../constants';

export default function ColourPicker({ availableColours, onSelect, onClose }) {
  // Panel entrance spring
  const panelSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
    to: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    config: { tension: 300, friction: 25 }
  });

  // Staggered colour entrance
  const trail = useTrail(availableColours.length, {
    from: { opacity: 0, scale: 0.5 },
    to: { opacity: 1, scale: 1 },
    config: { tension: 400, friction: 18 }
  });

  return (
    <animated.div
      style={panelSpring}
      className="bg-[#0b0e14] border-2 border-gray-800 p-4 shadow-2xl relative z-50 flex flex-col gap-3"
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-display text-[10px] tracking-[0.2em] text-primary opacity-70 uppercase">
          Select_Data_Packet
        </span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-primary font-display text-xs"
        >
          [X]
        </button>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {trail.map((style, index) => {
          const c = availableColours[index];
          return (
            <animated.button
              key={c.id}
              style={{ ...style, backgroundColor: c.hex }}
              onClick={() => onSelect(c.id)}
              className={`
                w-12 h-12 rounded-sm cursor-pointer border-2 transition-all duration-150
                hover:scale-110 active:scale-95
                ${c.border ? 'border-gray-500' : 'border-transparent'}
              `}
              aria-label={`Select ${c.id}`}
            >
              <span className="sr-only">{c.id}</span>
            </animated.button>
          );
        })}
      </div>
    </animated.div>
  );
}
