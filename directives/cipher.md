# Project Cipher — Implementation Plan
> HORIZON'26 · PS-07 · Team Antigravity

---

## Architecture Layers (AGENTS.md)

| Layer | Role | Location |
|---|---|---|
| **Directive** | This document — what to do | `directives/cipher.md` |
| **Orchestration** | You (the AI) — decision-making | — |
| **Execution** | Deterministic scripts | `execution/` |

All intermediate files go into `.tmp/`. All deliverables go to cloud (Vercel/Netlify + GitHub).

---

## Pre-Work Checklist

- [x] Stitch project connected (`STITCH_PROJECT_ID=12107495533867782828` in `.env`)
- [x] `directives/`, `execution/`, `.tmp/` directories created
- [x] `.gitignore` configured (`.tmp/`, `.env`, `credentials.json`, `token.json`)
- [x] `directives/cipher.md` created (mirror of this plan, living document)
- [ ] Vite + React project scaffolded
- [ ] All npm dependencies installed

---

## Phase 0 — Scaffold & Dependencies

**Goal:** A running Vite + React app with all packages installed.

```bash
# In c:\Projects\HORIZON26\
npx -y create-vite@latest cipher --template react
cd cipher
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install gsap @react-spring/web animejs
```

**Tailwind v4 setup** (no config file): Add `@import "tailwindcss"` to `index.css`, add `@tailwindcss/vite` plugin to `vite.config.js`.

**Validation:** `npm run dev` shows the Vite welcome page at `localhost:5173`.

> [!IMPORTANT]
> Anime.js import gotcha: use `import anime from 'animejs/lib/anime.es.js'` if `anime is not a function` is thrown.

---

## Phase 1 — Core Algorithm (MUST PASS BEFORE UI WORK)

**File:** `src/utils/computeFeedback.js`

Implement the **two-pass** peg algorithm exactly as specified in `PROJECT_CIPHER.md`. Do not simplify — single-pass implementations silently over-count white pegs.

**Mandatory console.log verification:**
```js
computeFeedback(['red','red','green','blue'], ['red','green','red','red'])
// ✅ Must be: { black: 1, white: 2 } — NOT white: 3

computeFeedback(['red','red','red','red'], ['red','red','blue','blue'])
// ✅ Must be: { black: 2, white: 0 }
```

> [!CAUTION]
> **Do not proceed to Phase 2 until both test cases pass.** This is the hardest correctness problem in the project.

---

## Phase 2 — Constants & State Shape

**Files:** `src/constants.js`, `App.jsx`

### constants.js
- `COLOURS` array: 8 colours with hex values (include `border: true` on white)
- `DIFFICULTY` object: `easy`, `medium`, `hard` configs

### App.jsx — Global state shape
```js
{
  screen:       'difficulty' | 'playing' | 'won' | 'lost' | 'leaderboard',
  difficulty:   'easy' | 'medium' | 'hard',
  secret:       [],       // array of colour ids (generated on difficulty select)
  guesses:      [],       // array of submitted guess arrays
  feedbacks:    [],       // array of { black, white }
  currentGuess: [],       // in-progress guess, nulls for empty slots
  timeElapsed:  0,
  totalTime:    75,       // pulled from difficulty config
}
```

**Validation:** Import constants in App, log them, confirm shapes are correct.

---

## Phase 3 — DifficultyScreen Component

**File:** `src/components/DifficultyScreen.jsx`

### What to build:
- Three cards: **Easy / Medium / Hard**
- Each card shows: mode name, slot count, colour count, guess limit, time limit
- On click: sets `difficulty`, generates secret (randomly sample from `COLOURS`), transitions to `playing` screen

### Animations:
- **React Spring** — `useSpring` hover lift: `{ y: hovered ? -4 : 0, config: { tension: 300, friction: 20 } }`
- **GSAP** — entrance: `gsap.fromTo(containerRef, { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: 0.1 })`

### Stitch prompt to use:
> "Difficulty selection screen for a dark arcade puzzle game. Three tall cards side by side: Easy, Medium, Hard. Each shows slot count, guess limit, time in seconds. Dark-first, game-arcade aesthetic. Vivid colour fills, heavy contrast, monospace/geometric display font for the title 'PROJECT CIPHER'. React Spring hover lift effect on cards. No Inter, no Roboto."

**Validation:** Clicking a card logs the generated secret and transitions to `playing`.

---

## Phase 4 — GameBoard + ColourSlot + ColourPicker

Three tightly coupled components built together.

### ColourSlot — `src/components/ColourSlot.jsx`
- Renders a single slot in the current guess row
- **React Spring**: `useSpring({ scale: isSelected ? 1.18 : 1, config: { tension: 420, friction: 16 } })`
- On click: opens `ColourPicker`

### ColourPicker — `src/components/ColourPicker.jsx`
- Popover showing all available colours for the current difficulty
- **React Spring**:
  - Container: `useSpring` scaleY open/close
  - Colour circles: `useTrail` stagger-in
- On colour click: fills slot, closes picker

### GameBoard — `src/components/GameBoard.jsx`
- Renders all rows: past guesses (locked) + current active row + empty future rows
- Board entrance: GSAP staggered left-slide on new game
- Submit button with React Spring press scale: `useSpring({ scale: pressed ? 0.93 : 1 })`
- Submit disabled unless all slots filled

### Stitch prompts:
> "Game board component for a Mastermind/Cipher puzzle. Vertical list of rows. Past rows show locked colour pegs + feedback pegs (black/white dots). Active row has interactive colour slots (glowing border). Dark-first, arcade aesthetic. Vivid slot colours."

> "Colour picker popover that opens below a slot. Grid of coloured circles, smooth spring open/close animation. Dark background, neon-bordered selection state."

**Validation:** Can select colours, fill all 4 slots, submit button activates.

---

## Phase 5 — Submit Logic + PegDisplay

**Files:** `src/components/PegDisplay.jsx`, `App.jsx` (submit handler)

### Submit handler (App.jsx):
1. Call `computeFeedback(secret, currentGuess)` → get `{ black, white }`
2. Push to `guesses` and `feedbacks`
3. Check win: `black === slots` → transition to `won`
4. Check loss: `guesses.length >= maxGuesses` → transition to `lost`
5. Reset `currentGuess` to nulls

### PegDisplay — `src/components/PegDisplay.jsx`
- Renders peg grid: filled black circles for black pegs, outlined white circles for white pegs, empty grey for remaining
- **Anime.js stagger** — called inside `requestAnimationFrame` to ensure DOM flush:
```js
requestAnimationFrame(() => {
  anime({
    targets: `.row-${rowIndex} .peg`,
    scale: [0.1, 1],
    delay: anime.stagger(110),
    easing: 'easeOutBack',
  })
})
```

### Row shake on invalid submit:
```js
anime({ targets: `.row-${rowIndex}`, translateX: [0,-10,10,-7,7,-4,4,0] })
```

**Validation:** Submit fills peg row with correct counts and animates in.

---

## Phase 6 — TimerArc

**File:** `src/components/TimerArc.jsx`

- SVG circle with `strokeDasharray = CIRCUMFERENCE`, `strokeDashoffset` animates from 0 → CIRC over `totalTime` seconds
- **Anime.js**:
```js
timerRef.current = anime({
  targets: '#timer-arc',
  strokeDashoffset: [0, CIRCUMFERENCE],
  duration: totalTime * 1000,
  easing: 'linear',
  update: (anim) => {
    const pct = 1 - anim.progress / 100
    // Change colour: green → yellow → red
    arcRef.current.setAttribute('stroke', pct > 0.5 ? '#38A169' : pct > 0.25 ? '#D69E2E' : '#E53E3E')
  },
  complete: () => { /* trigger loss */ }
})
```
- Timer ref stored in `useRef` so it can be `.pause()`-d on win/loss

**Validation:** Arc depletes over the correct duration, colour shifts at 50% and 25%.

---

## Phase 7 — Win / Loss Detection

**In App.jsx submit handler (already wired in Phase 5):**
- On win: pause timer, set `screen: 'won'`
- On loss (guesses exhausted or timer complete): pause timer, set `screen: 'lost'`

Both win and loss screens receive: `{ secret, guesses.length, timeElapsed, difficulty }` as props.

---

## Phase 8 — WinScreen

**File:** `src/components/WinScreen.jsx`

### GSAP Win Timeline:
```js
const tl = gsap.timeline()
tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })
  .fromTo(titleRef.current,   { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.1')
  .fromTo(statsRef.current,   { y: 20, opacity: 0 },  { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
  .fromTo(buttonsRef.current, { y: 20, opacity: 0 },  { y: 0, opacity: 1, duration: 0.3 }, '-=0.1')
```

### GSAP Confetti Burst:
```js
// Spawn 60 divs absolutely positioned
gsap.to('.confetti-piece', {
  y: '+=300',
  x: 'random(-150, 150)',
  rotation: 'random(0, 360)',
  opacity: 0,
  duration: 1.2,
  stagger: { from: 'random', amount: 0.8 },
  ease: 'power2.in',
})
```

### React Spring — Secret Reveal:
- `useTrail` to reveal each colour slot with `tension: 280, friction: 14` (springy overshoot)

### Name Entry:
- Simple text input: on submit → write to leaderboard → show leaderboard screen

**Stitch prompt:**
> "Win screen for a dark arcade puzzle game. Victory headline, stats (guesses used, time taken), secret code reveal row with spring animation, name input for leaderboard, play again button. Dramatic, celebratory. GSAP confetti raining."

---

## Phase 9 — LossScreen

**File:** `src/components/LossScreen.jsx`

- Simpler GSAP timeline (same structure as win, no confetti)
- React Spring secret reveal (same `useTrail` as WinScreen)
- Shows: "Code was:" + secret reveal, "Try again" + "Leaderboard" buttons

**Stitch prompt:**
> "Loss screen for a dark arcade puzzle game. Subdued, tense mood. Shows the secret code reveal. 'The code was...' headline. Try Again and View Leaderboard buttons. Same dark arcade aesthetic."

---

## Phase 10 — Screen Transitions (GSAP Hook)

**File:** `src/hooks/useScreenEntrance.js`

```js
export function useScreenEntrance(ref) {
  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform' }
    )
  }, [])
}
```

Apply to: `DifficultyScreen`, `GameBoard`, `WinScreen`, `LossScreen`, `Leaderboard`.

> [!IMPORTANT]
> Use `clearProps: 'transform'` after entrance animations to prevent stale transforms on re-renders.

---

## Phase 11 — Leaderboard (localStorage)

**File:** `src/components/Leaderboard.jsx`

### Data Shape (key: `cipher_leaderboard`):
```js
{
  easy:   [ { name, guesses, time, date }, ... ],  // max 10 entries
  medium: [ ... ],
  hard:   [ ... ],
}
```

### Write logic (on win + name entry):
1. Parse existing leaderboard (or init empty)
2. Push new entry
3. Sort: ascending `guesses`, then ascending `time` as tiebreaker
4. Slice to `[0, 10]`
5. Stringify and save

### Leaderboard screen:
- Tab switcher: Easy / Medium / Hard (GSAP entrance on tab switch)
- Sorted table: Rank, Name, Guesses, Time, Date

**Stitch prompt:**
> "Leaderboard screen for a dark arcade puzzle game. Tab switcher for Easy/Medium/Hard. Ranked table with columns: Rank, Player, Guesses, Time, Date. Dark, sleek, game-ui aesthetic. Top 3 rows have distinct highlight styling."

---

## Phase 12 — Dark/Light Theme Toggle

- Tailwind `dark:` variant classes throughout
- Default: dark
- Toggle button in header
- Persist in `localStorage` key `cipher_theme`
- On mount: read `cipher_theme` → apply `document.documentElement.classList.toggle('dark')`

---

## Phase 13 — Mobile Layout (375px)

Check and fix at 375px viewport:
- [ ] DifficultyScreen cards stack vertically
- [ ] GameBoard rows are touch-friendly (min 44px tap targets)
- [ ] ColourPicker doesn't overflow viewport
- [ ] TimerArc scales correctly
- [ ] Win/Loss screens are readable

---

## Phase 14 — Build & Deploy

```bash
npm run build
# → dist/ folder created

# Deploy to Vercel:
npx vercel --prod

# OR deploy to Netlify:
npx netlify deploy --prod --dir=dist
```

**Validation:** Live URL accessible, all game flows functional on mobile and desktop.

---

## Bonus Features (time-permitting, in priority order)

| Priority | Feature | Notes |
|---|---|---|
| 1 | **Hint mechanism** | Reveals one correct slot. Adds `+2` to guess count on leaderboard. |
| 2 | **Accessibility mode** | Geometric symbol overlay (circle, triangle, square, etc.) for colour-blind users. |
| 3 | **Challenge mode** | Player A sets code → URL hash → Player B solves it. |

---

## Stitch Usage Notes

- Read `frontend-design` skill before every Stitch generation
- Commit to **dark-first, arcade-tactile** in every prompt
- Never ask Stitch to use CSS keyframes for anything an animation library handles
- Always specify: "No Inter, no Roboto, use a distinctive geometric or monospace display font"

---

## Execution Scripts (`execution/`)

| Script | Purpose |
|---|---|
| `verify_algorithm.js` | Runs `computeFeedback` test cases, exits with error if wrong |
| `generate_secret.js` | Utility: sample N random colours from a pool of K |

---

## Directives (`directives/`)

| Directive | Purpose |
|---|---|
| `cipher.md` | Mirror of this plan — the living SOP for this project |
| `stitch_prompts.md` | All approved Stitch prompts, keyed by component |

---

*Team Antigravity · HORIZON'26 · SVKM NMIMS*
