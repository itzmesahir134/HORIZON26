# Project Cipher

Project Cipher is a modern, cyberpunk-themed logic puzzle game built with React, Vite, and TailwindCSS. Inspired by classic code-breaking games, Project Cipher introduces stunning neon visuals, dynamic animations, and multiple game modes.

## Game Modes

*   **Single Player**: Challenge the CPU by cracking a randomly generated code within a set time limit and maximum number of guesses. Select from Beginner, Skilled, or Expert difficulties.
*   **Pass & Play**: A local multiplayer mode on a single device. Player 1 sets a secret code, and Player 2 tries to break it. Then, the roles reverse! The player who guesses the code in fewer attempts or less time wins.
*   **Local Multiplayer (P2P)**: Play against a friend on a different computer over the internet without needing a dedicated backend server. Using WebRTC (via PeerJS), players can connect via a simple 4-digit room code, set codes for each other, and race to see who cracks their opponent's code first.

## Features

*   **Serverless Multiplayer**: True Peer-to-Peer browser communication via PeerJS.
*   **Cyberpunk UI/UX**: Custom neon aesthetics, glassmorphism effects, data-tickers, and glitch animations using GSAP, React Spring, and Anime.js.
*   **Responsive Design**: Fully playable on both desktop and mobile devices.
*   **Immersive Audio**: Integrated sound effects for interactions, success, failure, and ambient background music.

## Tech Stack

*   **Frontend**: React (Vite)
*   **Styling**: Tailwind CSS
*   **Animations**: GSAP, React Spring, Anime.js
*   **Networking (Multiplayer)**: PeerJS (WebRTC)

## Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd cipher
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the development server:
```bash
npm run dev
```

### Building for Production

To create a production build (compatible with static hosts like Vercel, Netlify, or GitHub Pages):
```bash
npm run build
```

## Deployment
Project Cipher is fully serverless. The built static files can be hosted on any standard web hosting provider. The Local Multiplayer functionality relies on PeerJS's public signaling servers to establish direct WebRTC connections between players, requiring zero backend maintenance.
