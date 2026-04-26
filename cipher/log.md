# Development Log

## Recent Updates

### LAN Multiplayer (Peer-to-Peer) Migration
*   **Architecture Shift**: Migrated the LAN multiplayer mode from a Node.js WebSocket backend to a serverless Peer-to-Peer (P2P) architecture using `peerjs` (WebRTC).
*   **Networking Changes**: 
    *   Removed `server/` directory and WebSocket dependencies.
    *   Added `peerjs` to handle direct browser-to-browser communication.
    *   Replaced manual IP address entry with automatically generated 4-digit room codes.
*   **Game Flow Synchronization**:
    *   Synchronized Lobby entry, Difficulty selection, and Secret Code setup between Host and Guest.
    *   Fixed bug where the Guest would get stuck in the Lobby due to an event mismatch (`select_difficulty` vs `difficulty_selected`).
    *   Added an auto-advance mechanism for the Guest from the Lobby.
*   **Disconnection Handling**:
    *   Added global listeners to gracefully handle opponent disconnections.
    *   When one player clicks "End Session", the WebRTC connection is severed, immediately redirecting both players to the Game Selection screen.

### Pass & Play Mode Implementation
*   **Core Mechanics**: Implemented a local Pass & Play multiplayer mode with role-swapping (Setter and Guesser).
*   **Screens Created**: 
    *   `PassAndPlayMaker`: For the Setter to create the secret pattern.
    *   `PassAndPlayTransition`: A blind transition screen to prevent the Guesser from seeing the secret code while passing the device.
    *   `PassAndPlayResult`: Shows round results and stats.
    *   `PassAndPlayWinner`: Compares Player 1 and Player 2 scores over two rounds and declares an overall winner.

### UI & UX Polish
*   **Consistent Aesthetics**: Maintained the established Cyberpunk UI (neon colors, glassmorphism, HUD elements) across all new multiplayer screens.
*   **UI Fixes**: 
    *   Added padding and a spacer to the `LanBoard` and `GameBoard` to prevent the first row of guesses from overlapping with the sticky headers.
    *   Aligned the `LanSecretMaker` UI to visually match the `PassAndPlayMaker` UI (using dark rounded containers, neon shadows, and bold typography).
*   **Game Loop**: Ensured that time, guesses, and local stats are properly tracked, displayed, and synced across all game modes.
