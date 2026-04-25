export function computeFeedback(secret, guess) {
  const slots = secret.length;
  const secretUsed = Array(slots).fill(false);
  const guessUsed = Array(slots).fill(false);
  let black = 0, white = 0;

  // Pass 1: exact position matches
  for (let i = 0; i < slots; i++) {
    if (guess[i] === secret[i]) {
      black++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Pass 2: right colour, wrong position (unused slots only)
  for (let i = 0; i < slots; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < slots; j++) {
      if (secretUsed[j]) continue;
      if (guess[i] === secret[j]) {
        white++;
        secretUsed[j] = true;
        break;
      }
    }
  }

  return { black, white };
}
