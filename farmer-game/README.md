# Farm Harvest Game

A simple **top-down farming game** built with JavaScript and HTML5 Canvas.  
Control your farmer, collect crops, dodge scarecrows, and see how many levels you can reach!

---

## 🎮 Features
- **Farmer Sprite**: Animated farmer with directional walking.
- **Custom Background**: Minimal tilled-field background image.
- **Crops & Scoring**: Random crops spawn with unique point values.
- **Obstacles**: Scarecrows appear on the field as blockers.
- **Level System**:
  - **Level 1** starts at **50 points** with a **40-second timer**.
  - Each new level:
    - Increases goal by +30 points, +50 points after level 5, +100 points after level 10, and +150 points after level 15.
    - Reduces time by 5s (minimum 20s).
    - Speeds up crop spawn rate (down to 0.35s).
    - Adds more scarecrows (up to 6).
  - Levels advance automatically once you hit the goal.
- **Best Level Tracker**: Displays the highest level you’ve reached in the session.
- **Controls**:
  - Arrow keys: move farmer.
  - **P**: pause/resume.
  - **Start button**: begin the game.
  - **Reset button**: return to menu.

---

## 📖 How to Play
1. Use the arrow keys to move the farmer around the field.
2. Walk into crops to collect them and earn points.
3. Reach the required score before the timer runs out.
4. Each new level raises the challenge—less time, more crops needed, faster spawn rates, and more obstacles.
5. See if you can beat your **Best Level** in one session!

---

## 📂 File Structure
├── index.html   # Main page + UI
├── style.css    # Styling
├── main.js      # Entry point, initializes Game
├── Game.js      # Core game loop, states, levels, best level tracker
├── Farmer.js    # Player sprite and controls
├── Crop.js      # Crop entity and point values
├── Obstacle.js  # Scarecrow obstacle
├── Entity.js    # Utility functions (collision, clamp, etc.)
└── assets/
├── field.png        # Background
├── farmer.png       # Farmer sprite sheet
├── wheat.png        # Example crop icon
├── scarecrow.png    # Obstacle icon
└── …other assets

---

## 🚀 Running the Game
Run a local server from the project folder:
```bash
python3 -m http.server 8000
Then open: "http://localhost:8000" in your browser.