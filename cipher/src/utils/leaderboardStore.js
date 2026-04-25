const STORAGE_KEY = 'horizon_cipher_scores';

export function getScores(difficulty) {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const allScores = JSON.parse(data);
    return (allScores[difficulty] || []).sort((a, b) => {
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      return a.timeTaken - b.timeTaken;
    });
  } catch (e) {
    console.error('Failed to parse leaderboard data', e);
    return [];
  }
}

export function saveScore(difficulty, name, attempts, timeTaken) {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const allScores = data ? JSON.parse(data) : {};
    
    if (!allScores[difficulty]) {
      allScores[difficulty] = [];
    }
    
    allScores[difficulty].push({
      name,
      attempts,
      timeTaken,
      date: new Date().toISOString()
    });
    
    // Sort and keep top 10
    allScores[difficulty].sort((a, b) => {
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      return a.timeTaken - b.timeTaken;
    });
    
    allScores[difficulty] = allScores[difficulty].slice(0, 10);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allScores));
  } catch (e) {
    console.error('Failed to save leaderboard data', e);
  }
}
