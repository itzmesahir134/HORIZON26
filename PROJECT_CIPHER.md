# Project Cipher — Antigravity Dev Brief
> HORIZON'26 Frontend Hackathon · PS-07 · 6-hour build · Team Antigravity

---

## What We Are Building

A **Mastermind-variant deduction puzzle game** called **Project Cipher**.

A secret colour code is generated at the start. The player guesses the code row by row. After each guess, peg feedback is shown — black for exact position matches, white for right colour wrong position. The player wins by cracking the code within the guess limit before the timer runs out.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| Animation #1 | **GSAP** — timelines, confetti, screen transitions, win ceremony |
| Animation #2 | **React Spring** — physics springs: slot selection, colour picker, card reveals |
| Animation #3 | **Anime.js** — SVG stroke animation (countdown arc), peg stagger, row shake |
| AI Tooling | Stitch (MCP server) |
| Skills in use | `skill-creator`, `frontend-design` |
| Persistence | localStorage |
| Deployment | Vercel / Netlify |

---

## Skills Being Used

### `frontend-design`
Used for all visual and component work. This skill enforces:
- **Bold, intentional aesthetic direction** — not generic AI output
- Distinctive typography (no Inter, no Roboto, no system fonts)
- CSS variable-based theming for dark/light toggle
- High-impact motion: staggered reveals, hover states, micro-interactions
- Production-grade, functional code that is visually memorable

Every component Stitch generates must follow `frontend-design` principles. The aesthetic direction for Cipher is **dark-first, tactile, game-arcade** — heavy contrast, vivid colour fills, monospace or geometric display font for the title.

### `skill-creator`
Used if we need to create or refine new skills mid-hackathon. The workflow is:
1. Draft the skill
2. Write test prompts
3. Evaluate outputs qualitatively
4. Iterate until satisfied

---

## Game Constants

```js
// /src/constants.js

export const COLOURS = [
  { id: 'red',    hex: '#E53E3E' },
  { id: 'blue',   hex: '#3182CE' },
  { id: 'green',  hex: '#38A169' },
  { id: 'yellow', hex: '#D69E2E' },
  { id: 'orange', hex: '#DD6B20' },
  { id: 'purple', hex: '#805AD5' },
  { id: 'pink',   hex: '#D53F8C' },
  { id: 'white',  hex: '#EDF2F7', border: true },
]

export const DIFFICULTY = {
  easy:   { slots: 4, numColours: 6, maxGuesses: 8,  totalTime: 90 },
  medium: { slots: 5, numColours: 6, maxGuesses: 10, totalTime: 75 },
  hard:   { slots: 6, numColours: 8, maxGuesses: 12, totalTime: 60 },
}
```

---

## Game State Shape

```js
{
  screen:       'difficulty' | 'playing' | 'won' | 'lost' | 'leaderboard',
  difficulty:   'easy' | 'medium' | 'hard',
  secret:       [],          // array of colour ids
  guesses:      [],          // array of submitted guess arrays
  feedbacks:    [],          // array of { black, white }
  currentGuess: [],          // in-progress guess, nulls for empty slots
  timeElapsed:  0,           // seconds elapsed
  totalTime:    75,          // from difficulty config
}
```

---

## The Peg Algorithm — CRITICAL

This is the hardest correctness problem in the entire project. **Must be two-pass.** Single-pass implementations silently over-count white pegs on duplicate colours.

```js
// /src/utils/computeFeedback.js

export function computeFeedback(secret, guess) {
  const slots = secret.length
  const secretUsed = Array(slots).fill(false)
  const guessUsed  = Array(slots).fill(false)
  let black = 0, white = 0

  // Pass 1: exact position matches
  for (let i = 0; i < slots; i++) {
    if (guess[i] === secret[i]) {
      black++
      secretUsed[i] = true
      guessUsed[i]  = true
    }
  }

  // Pass 2: right colour, wrong position (unused slots only)
  for (let i = 0; i < slots; i++) {
    if (guessUsed[i]) continue
    for (let j = 0; j < slots; j++) {
      if (secretUsed[j]) continue
      if (guess[i] === secret[j]) {
        white++
        secretUsed[j] = true
        break
      }
    }
  }

  return { black, white }
}
```

**Mandatory verification before any UI work:**
```js
computeFeedback(['red','red','green','blue'], ['red','green','red','red'])
// → { black: 1, white: 2 }  ← if you get white: 3, algorithm is wrong

computeFeedback(['red','red','red','red'], ['red','red','blue','blue'])
// → { black: 2, white: 0 }
```

---

## Animation Library Ownership

Each library has a strict domain. Do not mix responsibilities.

### GSAP — sequenced timelines and DOM-burst effects
- Win ceremony: `.fromTo` timeline sequencing overlay → title → stats → buttons
- Confetti burst: spawn 60 divs, `gsap.to` with `stagger: { from: 'random' }`
- Screen transitions: `gsap.fromTo(ref.current, { opacity:0, y:28 }, { opacity:1, y:0 })`
- Board row entrance: staggered left-slide on new game start
- Loss ceremony: simpler timeline, no confetti

### React Spring — physics-feel interactive elements
- `ColourSlot`: `useSpring({ scale: isSelected ? 1.18 : 1, config: { tension: 420, friction: 16 } })`
- `ColourPicker` popover: `useSpring` scaleY open/close + `useTrail` for colour circles
- `SecretReveal` card: `useTrail` with `tension: 280, friction: 14` (springy overshoot)
- Difficulty cards: hover lift `useSpring({ y: hovered ? -4 : 0 })`
- Submit button: press scale `useSpring({ scale: pressed ? 0.93 : 1 })`

### Anime.js — SVG stroke and list stagger
- SVG countdown arc: `anime({ targets: '#timer-arc', strokeDashoffset: [0, CIRC], easing: 'linear' })`
- Arc colour update: in `update` callback, compute pct and set `stroke` attribute directly
- Peg stagger: `anime({ targets: '.row-N .peg', scale: [0.1,1], delay: anime.stagger(110), easing: 'easeOutBack' })`
- Row shake: `anime({ targets: '.row-N', translateX: [0,-10,10,-7,7,-4,4,0] })`

---

## Screens

| Screen | Key elements |
|---|---|
| `difficulty` | Three cards (Easy / Medium / Hard), React Spring hover lift, GSAP entrance |
| `playing` | Game board, Anime.js arc timer, React Spring slots, Anime.js peg stagger |
| `won` | GSAP win timeline, GSAP confetti burst, React Spring secret reveal, name entry |
| `lost` | GSAP loss timeline, React Spring secret reveal, no confetti |
| `leaderboard` | Tab switcher (Easy/Medium/Hard), sorted table, GSAP entrance |

---

## Leaderboard (localStorage)

```js
// Key: 'cipher_leaderboard'
// Shape:
{
  easy:   [ { name, guesses, time, date }, ... ],  // max 10 entries
  medium: [ ... ],
  hard:   [ ... ],
}
// Sort: guesses ascending, then time ascending as tiebreaker
// On win: check if qualifies → show name input → push → sort → slice(0,10) → save
```

---

## Folder Structure

```
src/
├── constants.js           ← COLOURS, DIFFICULTY
├── App.jsx                ← screen router, global state
├── components/
│   ├── DifficultyScreen.jsx
│   ├── GameBoard.jsx
│   ├── ColourSlot.jsx     ← React Spring
│   ├── ColourPicker.jsx   ← React Spring
│   ├── PegDisplay.jsx     ← Anime.js stagger target
│   ├── TimerArc.jsx       ← Anime.js SVG arc
│   ├── WinScreen.jsx      ← GSAP timeline + confetti
│   ├── LossScreen.jsx     ← GSAP timeline
│   └── Leaderboard.jsx
├── utils/
│   └── computeFeedback.js ← TWO-PASS algorithm
└── hooks/
    └── useScreenEntrance.js ← GSAP fromTo on mount
```

---

## Build Order (strictly follow this)

1. `computeFeedback()` → verify with console.log test cases → **do not proceed until correct**
2. Constants + state shape
3. `DifficultyScreen` (React Spring card hover)
4. `GameBoard` rows + `ColourSlot` (React Spring) + `ColourPicker` (React Spring)
5. Submit logic → `computeFeedback` → `PegDisplay` with Anime.js stagger → row shake
6. `TimerArc` with Anime.js SVG animation
7. Win/Loss detection
8. `WinScreen` GSAP timeline + GSAP confetti
9. `LossScreen` GSAP timeline
10. GSAP screen transitions (`useScreenEntrance` hook)
11. Leaderboard (localStorage read/write)
12. Dark/light theme toggle (Tailwind `dark:` variants, persist in `cipher_theme`)
13. Mobile layout check (375px viewport)
14. Build → Deploy

---

## Bonus Features (only if time allows, in priority order)

1. **Hint mechanism** — reveals one correct position, adds +2 to guess count on leaderboard scoring
2. **Symbol overlay accessibility mode** — substitutes colour fills with geometric patterns (circle, triangle, square, diamond, star, cross) for colour-blind users
3. **Challenge mode** — Player A sets a code → generates URL hash → Player B solves it

---

## Important Notes for Stitch

- When generating any component, read `frontend-design` skill first and commit to the **dark-first, arcade-tactile** aesthetic direction
- Never use CSS keyframes for anything an animation library can handle
- `@react-spring/web` is the correct import (not `@react-spring/three`)
- Anime.js v3: if `anime is not a function` error, use `import anime from 'animejs/lib/anime.es.js'`
- GSAP animations must use `clearProps: 'transform'` after entrance animations to avoid stale transforms
- Anime.js peg stagger must be called inside `requestAnimationFrame(() => { ... })` so React has flushed the DOM before Anime.js queries selectors
- Timer anime instance must be stored in a `useRef` so it can be `.pause()`-d on win/loss

---

*Built by Team Antigravity · HORIZON'26 · SVKM NMIMS*
