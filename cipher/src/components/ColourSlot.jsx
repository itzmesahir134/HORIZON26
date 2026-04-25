import { COLOURS } from '../constants';

export default function ColourSlot({ colorId, isSelected, onClick, disabled }) {
  const colorObj = COLOURS.find(c => c.id === colorId);
  const bgHex    = colorObj ? colorObj.hex : null;

  const currentBoxShadow = isSelected
    ? `0 0 0 2px #fff, 0 0 18px ${bgHex || '#8eff71'}`
    : bgHex
    ? `0 0 12px ${bgHex}55`
    : `0 0 0px transparent`;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      style={{
        transform: isSelected ? 'scale(1.18)' : 'scale(1)',
        boxShadow: currentBoxShadow,
        backgroundColor: bgHex || 'transparent',
        cursor: disabled ? 'default' : 'pointer',
      }}
      className={`
        w-10 h-10 md:w-12 md:h-12 rounded-full shrink-0
        flex items-center justify-center m-1
        transition-all duration-100 ease-out
        ${!bgHex ? 'border-2 border-gray-700' : ''}
        ${!disabled && !bgHex ? 'hover:border-gray-500 hover:bg-gray-800/50' : ''}
        ${disabled && !bgHex ? 'opacity-25' : ''}
      `}
      aria-label={colorId ? `Color ${colorId}` : 'Empty slot'}
    >
      {!bgHex && (
        <span className="w-2 h-2 rounded-full bg-gray-700 opacity-50" />
      )}
    </button>
  );
}
