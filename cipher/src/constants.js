export const COLOURS = [
  { id: 'red',    hex: '#E53E3E' },
  { id: 'blue',   hex: '#3182CE' },
  { id: 'green',  hex: '#38A169' },
  { id: 'yellow', hex: '#D69E2E' },
  { id: 'orange', hex: '#DD6B20' },
  { id: 'purple', hex: '#805AD5' },
  { id: 'pink',   hex: '#D53F8C' },
  { id: 'white',  hex: '#EDF2F7', border: true },
];

export const DIFFICULTY = {
  easy:   { slots: 4, numColours: 6, maxGuesses: 8,  totalTime: 90 },
  medium: { slots: 5, numColours: 6, maxGuesses: 10, totalTime: 75 },
  hard:   { slots: 6, numColours: 8, maxGuesses: 12, totalTime: 60 },
};
