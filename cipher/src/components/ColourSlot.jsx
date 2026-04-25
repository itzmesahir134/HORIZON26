import { useSpring, animated } from '@react-spring/web';
import { COLOURS } from '../constants';

export default function ColourSlot({ colorId, isSelected, onClick, disabled }) {
  const colorObj = COLOURS.find(c => c.id === colorId);
  const bgHex    = colorObj ? colorObj.hex : null;

  const { scale, boxShadow } = useSpring({
    scale:     isSelected ? 1.18 : 1,
    boxShadow: isSelected
      ? `0 0 0 2px #fff, 0 0 18px ${bgHex || '#8eff71'}, inset 0 0 0 0px transparent`
      : bgHex
      ? `0 0 12px ${bgHex}55, inset 0 0 0 0px transparent`
      : `0 0 0px transparent`,
    config: { tension: 440, friction: 18 },
  });

  return (
    <animated.button
      type="button"
      onClick={disabled ? undefined : onClick}
      style={{
        scale,
        boxShadow,
        backgroundColor: bgHex || 'transparent',
        cursor: disabled ? 'default' : 'pointer',
      }}
      className={`
        w-10 h-10 md:w-12 md:h-12 rounded-full
        flex items-center justify-center
        transition-colors duration-150
        ${!bgHex ? 'border-2 border-gray-700' : ''}
        ${!disabled && !bgHex ? 'hover:border-gray-500 hover:bg-gray-800/50' : ''}
        ${disabled && !bgHex ? 'opacity-25' : ''}
      `}
      aria-label={colorId ? `Color ${colorId}` : 'Empty slot'}
    >
      {!bgHex && (
        <span className="w-2 h-2 rounded-full bg-gray-700 opacity-50" />
      )}
    </animated.button>
  );
}
