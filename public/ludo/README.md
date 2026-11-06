# Ludo Royale (লুডু রয়্যাল) — 2 to 6 Player Hexagonal Ludo

A complete, polished, playable 2 to 6 player Ludo game built with plain **HTML5**, **CSS3**, and **vanilla JavaScript** (no external libraries or build step).

---

## 🚀 How to Embed Into an Existing Web Page

### Method A: Responsive `<iframe>` (Recommended)
Add the following snippet anywhere on your website or blog. It automatically scales smoothly from small phones (360px) to desktop monitors:

```html
<!-- Responsive Ludo Embed -->
<div style="width: 100%; max-width: 900px; height: 86vh; min-height: 600px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
  <iframe
    src="/ludo/index.html"
    title="Ludo Royale Game"
    width="100%"
    height="100%"
    frameborder="0"
    allow="autoplay; vibration"
    style="display: block; border: none; width: 100%; height: 100%;"
  ></iframe>
</div>
```

*Note: Replace `/ludo/index.html` with your actual hosted path if deploying to a subfolder or CDN.*

---

### Method B: Direct Container Embedding (Single Page Application)
If you prefer not using an iframe:
1. Link `style.css` in your `<head>`:
   ```html
   <link rel="stylesheet" href="/ludo/style.css" />
   ```
2. Copy the inner contents of `#app-container` from `index.html` into your target page container.
3. Include `game.js` before `</body>`:
   ```html
   <script src="/ludo/game.js"></script>
   ```

---

## 🎨 Customization Guide

### 1. Customizing Player Colors & Arm Themes
Open `game.js` and locate the `ARM_CONFIG` array near the top:

```javascript
const ARM_CONFIG = [
  { id: 0, color: 'red',    name: 'লাল',    hex: '#EF4444', dark: '#991B1B', light: '#FEE2E2', angle: 0 },
  { id: 1, color: 'green',  name: 'সবুজ',   hex: '#10B981', dark: '#065F46', light: '#D1FAE5', angle: 60 },
  { id: 2, color: 'yellow', name: 'হলুদ',   hex: '#F59E0B', dark: '#92400E', light: '#FEF3C7', angle: 120 },
  { id: 3, color: 'blue',   name: 'নীল',    hex: '#3B82F6', dark: '#1E40AF', light: '#DBEAFE', angle: 180 },
  { id: 4, color: 'purple', name: 'বেগুনি', hex: '#8B5CF6', dark: '#5B21B6', light: '#EDE9FE', angle: 240 },
  { id: 5, color: 'orange', name: 'কমলা',   hex: '#F97316', dark: '#9A3412', light: '#FFEDD5', angle: 300 }
];
```
- Change `hex` to any color hex code (e.g. `#E11D48` for ruby or `#06B6D4` for cyan).
- Update `style.css` root variables if you want to alter the global theme background:
  ```css
  :root[data-theme="dark"] {
    --bg-base: #110C24;
    --card-bg: #1B1338;
    --accent: #FFD166;
  }
  ```

---

### 2. Customizing Game Rules
All rules are controlled via the `DEFAULT_RULES` object in `game.js`:

```javascript
const DEFAULT_RULES = {
  sixToExit: true,        // When false, rolling 1 or 6 releases a token from yard
  tripleSixCancel: true,  // Rolling 3 sixes cancels the turn
  bonusOnSix: true,       // Rolling a 6 gives another roll
  bonusOnCapture: true,   // Capturing an opponent gives another roll
  bonusOnHome: true,      // Reaching home gives another roll
  blockadesEnabled: false,// Two tokens of same color form an impenetrable block
  autoMoveSingle: true    // Automatically hops if only 1 valid move exists
};
```
Players can also toggle these before each match via the expandable **খেলার কাস্টম নিয়ম** drawer on the Setup screen.

---

### 3. Customizing Sound Effects (Web Audio API Synthesizer)
The game uses the native Web Audio API — **no external MP3/WAV files required**!
In `game.js`, locate `AudioSynth`:

- **Dice Roll sound:** Synthesized white-noise bursts (`createBufferSource`).
- **Pawn Hop sound:** Sine oscillator with pitch slides (`frequency.exponentialRampToValueAtTime`).
- **Capture sound:** Triangle wave with downward glissando.
- **Victory fanfare:** Pentatonic arpeggio chords (`[523.25, 659.25, 783.99, 1046.50]`).

To adjust volume or frequencies, simply edit the frequencies inside `AudioSynth.playTone(freq, type, duration)`.

---

### 4. Language & Translations (Bangla / English)
At the bottom of `game.js`, the `TRANSLATIONS` dictionary contains all strings in both Bengali and English. You can switch default language or add additional languages (e.g., Hindi, Arabic, Spanish).

---

## 🕹️ Board Architecture & Game Logic
- **Board Geometry:** 6-Arm Hexagonal Board generated programmatically via scalable SVG vectors.
- **Arm Mapping for Player Counts:**
  - **2 Players:** Arms 0 and 3 (diametrically opposite).
  - **3 Players:** Arms 0, 2, and 4 (equilateral triangle).
  - **4 Players:** Arms 0, 1, 3, and 4.
  - **5 Players:** Arms 0, 1, 2, 3, and 4.
  - **6 Players:** All 6 arms active.
  - *Unused arms are greyed out with 0 tokens.*
- **Step-by-Step Hopping:** Tokens hop cell-by-cell with audio feedback and smooth CSS transitions.
- **3-Tier AI Engine:**
  - **Easy:** Selects uniformly random valid moves.
  - **Medium:** Prioritizes captures and exiting the yard, then forward advancement.
  - **Hard:** Minimax heuristics evaluating distance to home, safe spot sheltering, opponent hunt vectors, and avoiding vulnerability.

---

## 📱 Mobile-First Features
- 44px+ touch targets on all buttons, chips, and tokens.
- Pinch-zoom and interactive pan controls (`+` and `−` buttons).
- Fullscreen toggle in the pause menu.
- Vibration API tactile feedback when capturing and rolling sixes.
