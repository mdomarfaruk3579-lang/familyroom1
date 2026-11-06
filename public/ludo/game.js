/**
 * LUDO ROYALE - Pure Vanilla JavaScript Engine
 * Supports 2 to 6 Players on a Programmatic Hexagonal 6-Arm Board.
 * Zero external dependencies. Works 100% offline.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION, CONSTANTS & DICTIONARY
  // ==========================================================================
  const ARMS_COUNT = 6;
  const SQUARES_PER_ARM = 13;
  const TRACK_LENGTH = ARMS_COUNT * SQUARES_PER_ARM; // 78 shared squares
  const HOME_COLUMN_LENGTH = 6; // 6 steps to center home
  const WINNING_POSITION = TRACK_LENGTH + HOME_COLUMN_LENGTH; // step 84

  const PLAYER_COLORS = [
    { id: 'red', nameEn: 'Red', nameBn: 'লাল', hex: '#ef4444', dark: '#b91c1c', light: '#fca5a5', mark: '●' },
    { id: 'green', nameEn: 'Green', nameBn: 'সবুজ', hex: '#10b981', dark: '#047857', light: '#6ee7b7', mark: '▲' },
    { id: 'yellow', nameEn: 'Yellow', nameBn: 'হলুদ', hex: '#f59e0b', dark: '#b45309', light: '#fde68a', mark: '★' },
    { id: 'blue', nameEn: 'Blue', nameBn: 'নীল', hex: '#3b82f6', dark: '#1d4ed8', light: '#93c5fd', mark: '◆' },
    { id: 'purple', nameEn: 'Purple', nameBn: 'বেগুনি', hex: '#a855f7', dark: '#7e22ce', light: '#d8b4fe', mark: '■' },
    { id: 'orange', nameEn: 'Orange', nameBn: 'কমলা', hex: '#f97316', dark: '#c2410c', light: '#fdba74', mark: '⬢' },
  ];

  const AVATARS = ['👑', '🦁', '🐯', '🐼', '🦊', '🦉', '🚀', '⭐', '💎', '🔥', '🧙‍♂️', '🦸‍♀️'];

  // Start square offset on shared track for each arm
  const ARM_START_OFFSETS = [0, 13, 26, 39, 52, 65];

  // Star / Safe squares: each arm's start square + offset 8 on each arm
  const SAFE_SQUARES = new Set([
    0, 8,
    13, 21,
    26, 34,
    39, 47,
    52, 60,
    65, 73,
  ]);

  // Multilingual Strings (English & বাংলা)
  const I18N = {
    en: {
      gameTitle: 'Ludo Royale',
      subtitle: 'Hexagonal 6-Player Board',
      playVsAi: 'Play vs Computer',
      passAndPlay: 'Play with Friends',
      continueGame: 'Continue Game',
      howToPlay: 'How to Play',
      settings: 'Settings',
      setupTitle: 'Game Setup',
      playerCount: 'Number of Players',
      startBtn: 'Start Game',
      rollPrompt: 'Roll the Dice',
      rolling: 'Rolling...',
      yourTurn: "'s Turn",
      aiThinking: 'is thinking...',
      rollSixMsg: 'Rolled a 6! Extra roll!',
      noMoves: 'No moves available.',
      captured: 'Captured! Bonus roll!',
      tokenHome: 'Token reached Home! 🏆',
      tripleSix: '3 consecutive 6s! Turn forfeited.',
      winnerTitle: 'Victory Celebration!',
      playAgain: 'Play Again',
      homeBtn: 'Main Menu',
      pauseTitle: 'Game Paused',
      resume: 'Resume',
      restart: 'Restart',
      quit: 'Quit to Menu',
      sound: 'Sound Effects',
      vibration: 'Vibration',
      colorblind: 'Colorblind Symbols',
      theme: 'Theme',
      lang: 'Language',
      rulesTitle: 'Custom Rules',
      ruleSixExit: 'Require 6 to exit base',
      ruleTripleSix: '3 consecutive 6s penalty',
      ruleBlockades: 'Token blockades on same color',
      ruleAutoMove: 'Auto-move when single choice',
      ruleAllRankings: 'Play until all players finish',
      easy: 'Easy',
      med: 'Medium',
      hard: 'Hard',
      human: 'Human',
      comp: 'Computer',
      confirmRestart: 'Restart current game?',
      confirmQuit: 'Quit current game and return to menu?',
    },
    bn: {
      gameTitle: 'লুডু রয়্যাল',
      subtitle: '৬ জনের ষড়ভুজ লুডু বোর্ড',
      playVsAi: 'কম্পিউটারের সাথে খেলুন',
      passAndPlay: 'বন্ধুদের সাথে খেলুন',
      continueGame: 'খেলা চালিয়ে যান',
      howToPlay: 'খেলার নিয়মাবলী',
      settings: 'সেটিংস',
      setupTitle: 'খেলোয়াড় নির্বাচন',
      playerCount: 'খেলোয়াড় সংখ্যা',
      startBtn: 'খেলা শুরু করুন',
      rollPrompt: 'ছক্কা ছুঁড়ুন',
      rolling: 'ঘুরছে...',
      yourTurn: '-এর চাল',
      aiThinking: 'চাল ভাবছে...',
      rollSixMsg: 'ছক্কা (৬) পড়েছে! বাড়তি চাল!',
      noMoves: 'কোনো চাল দেওয়ার সুযোগ নেই।',
      captured: 'বিপক্ষের ঘুঁটি কাটা গেছে! বাড়তি চাল!',
      tokenHome: 'ঘুঁটি হোমে পৌঁছেছে! 🏆',
      tripleSix: 'টানা ৩ বার ৬ পড়ায় চাল বাতিল!',
      winnerTitle: 'বিজয়ের মহা আনন্দ!',
      playAgain: 'আবার খেলুন',
      homeBtn: 'মেনু পেজ',
      pauseTitle: 'খেলা স্থগিত',
      resume: 'চালিয়ে যান',
      restart: 'নতুন করে শুরু',
      quit: 'মেনুতে ফিরুন',
      sound: 'শব্দ',
      vibration: 'ভাইব্রেশন',
      colorblind: 'কালারব্লাইন্ড চিহ্ন',
      theme: 'থিম',
      lang: 'ভাষা',
      rulesTitle: 'খেলার কাস্টম নিয়ম',
      ruleSixExit: 'ঘর থেকে বের হতে ৬ লাগবে',
      ruleTripleSix: 'টানা ৩টি ছক্কায় চাল বাতিল',
      ruleBlockades: 'একই রঙের ঘুঁটিতে ব্লকেড',
      ruleAutoMove: '১টি চাল থাকলে স্বয়ংক্রিয় চাল',
      ruleAllRankings: 'সব খেলোয়াড় শেষ না হওয়া পর্যন্ত খেলা',
      easy: 'সহজ',
      med: 'মাঝারি',
      hard: 'কঠিন',
      human: 'মানব',
      comp: 'রোবট',
      confirmRestart: 'বর্তমান খেলাটি পুনরায় শুরু করতে চান?',
      confirmQuit: 'খেলা বন্ধ করে মেনুতে ফিরে যাবেন?',
    },
  };

  // ==========================================================================
  // 2. SYNTHESIZED SOUND & VIBRATION (Web Audio API)
  // ==========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.vibrateEnabled = true;
    }

    init() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.15) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    }

    diceRoll() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.playTone(160 + Math.random() * 240, 0.05, 'triangle', 0.12);
        }, i * 65);
      }
      this.vibrate(30);
    }

    tokenHop() {
      this.playTone(520, 0.08, 'sine', 0.18);
    }

    tokenSpawn() {
      if (!this.enabled) return;
      [392, 523, 659].forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.1, 'sine', 0.18), idx * 70);
      });
      this.vibrate(50);
    }

    capture() {
      if (!this.enabled) return;
      this.playTone(280, 0.22, 'square', 0.22);
      this.vibrate([40, 30, 80]);
    }

    homeReached() {
      if (!this.enabled) return;
      [523, 659, 783, 1046].forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.18, 'triangle', 0.2), idx * 80);
      });
      this.vibrate([60, 40, 60]);
    }

    victory() {
      if (!this.enabled) return;
      const notes = [523, 523, 523, 659, 783, 1046];
      notes.forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.35, 'triangle', 0.25), idx * 140);
      });
      this.vibrate([100, 50, 100, 50, 200]);
    }

    vibrate(pattern) {
      if (this.vibrateEnabled && navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch (e) {}
      }
    }
  }

  const audio = new SoundEngine();

  // ==========================================================================
  // 3. PROGRAMMATIC BOARD GEOMETRY & SVG BUILDER
  // ==========================================================================
  // Generates coordinate paths for a pristine 6-Arm Hexagonal Ludo Board
  class BoardGeometry {
    constructor() {
      this.viewBoxSize = 1000;
      this.center = { x: 500, y: 500 };
      this.radius = 480;
    }

    // Map track position (0..77) and home columns to SVG (x, y) coordinates
    getSquareCoordinates(armIndex, type, index) {
      // 6 arms: 0° (top/arm 0), 60°, 120°, 180°, 240°, 300°
      const armAngle = (armIndex * 60 - 90) * (Math.PI / 180);
      const cosA = Math.cos(armAngle);
      const sinA = Math.sin(armAngle);
      const perpCos = Math.cos(armAngle + Math.PI / 2);
      const perpSin = Math.sin(armAngle + Math.PI / 2);

      if (type === 'homeBase') {
        // Yard center for arm
        const baseDist = 345;
        const bx = this.center.x + baseDist * cosA;
        const by = this.center.y + baseDist * sinA;
        // 4 slots in yard
        const slotOffsets = [
          { dx: -24, dy: -24 },
          { dx: 24, dy: -24 },
          { dx: -24, dy: 24 },
          { dx: 24, dy: 24 },
        ];
        const s = slotOffsets[index] || slotOffsets[0];
        return { x: bx + s.dx, y: by + s.dy };
      }

      if (type === 'homeCol') {
        // Steps 1 to 6 inside home column leading into center
        const startDist = 240;
        const stepDist = 32;
        const d = startDist - index * stepDist;
        return {
          x: this.center.x + d * cosA,
          y: this.center.y + d * sinA,
        };
      }

      if (type === 'homeCenter') {
        // Final central winning slot
        const d = 55;
        return {
          x: this.center.x + d * cosA,
          y: this.center.y + d * sinA,
        };
      }

      // Track square coordinates: perimeter loop around 6 arms
      const baseTrackDist = 275;
      const armTipDist = 445;
      const laneWidth = 32;

      // 13 squares per arm:
      // 0..4: right upward flank
      // 5: top-right corner
      // 6: top center tip
      // 7: top-left corner
      // 8..12: left downward flank
      let radialDist = baseTrackDist;
      let lateralOffset = 0;

      if (index <= 4) {
        radialDist = baseTrackDist + index * ((armTipDist - baseTrackDist) / 5);
        lateralOffset = laneWidth;
      } else if (index === 5) {
        radialDist = armTipDist;
        lateralOffset = laneWidth;
      } else if (index === 6) {
        radialDist = armTipDist + 16;
        lateralOffset = 0;
      } else if (index === 7) {
        radialDist = armTipDist;
        lateralOffset = -laneWidth;
      } else {
        const step = index - 7;
        radialDist = armTipDist - step * ((armTipDist - baseTrackDist) / 5);
        lateralOffset = -laneWidth;
      }

      const x = this.center.x + radialDist * cosA + lateralOffset * perpCos;
      const y = this.center.y + radialDist * sinA + lateralOffset * perpSin;
      return { x, y };
    }

    // Build the scalable SVG Board Markup
    buildSvgMarkup(activeArmIndices) {
      const activeSet = new Set(activeArmIndices);
      let svg = `<svg id="ludo-board-svg" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">`;

      // 1. Defs & Gradients
      svg += `
        <defs>
          <filter id="pawnShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,0.4)" />
          </filter>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8" />
            <stop offset="70%" stop-color="#d97706" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#1e1145" stop-opacity="0" />
          </radialGradient>
      `;

      PLAYER_COLORS.forEach(c => {
        svg += `
          <linearGradient id="grad_${c.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c.light}" />
            <stop offset="60%" stop-color="${c.hex}" />
            <stop offset="100%" stop-color="${c.dark}" />
          </linearGradient>
          <radialGradient id="pawnGrad_${c.id}" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="35%" stop-color="${c.light}" />
            <stop offset="80%" stop-color="${c.hex}" />
            <stop offset="100%" stop-color="${c.dark}" />
          </radialGradient>
        `;
      });
      svg += `</defs>`;

      // 2. Board Background Hexagon
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 - 30) * (Math.PI / 180);
        hexPoints.push(`${500 + 485 * Math.cos(ang)},${500 + 485 * Math.sin(ang)}`);
      }
      svg += `<polygon points="${hexPoints.join(' ')}" fill="#ffffff" stroke="#cbd5e1" stroke-width="4" />`;

      // 3. Render 6 Arms (Bases, Home Columns, Tracks)
      for (let arm = 0; arm < ARMS_COUNT; arm++) {
        const color = PLAYER_COLORS[arm];
        const isActive = activeSet.has(arm);
        const armFill = isActive ? color.hex : '#94a3b8';
        const armLight = isActive ? color.light : '#e2e8f0';

        // Arm Base Yard (Large Rounded Pill/Circle)
        const baseCenter = this.getSquareCoordinates(arm, 'homeBase', 0);
        const ang = (arm * 60 - 90) * (Math.PI / 180);
        const bx = 500 + 345 * Math.cos(ang);
        const by = 500 + 345 * Math.sin(ang);

        svg += `
          <g class="arm-base" data-arm="${arm}" opacity="${isActive ? '1' : '0.45'}">
            <circle cx="${bx}" cy="${by}" r="75" fill="url(#grad_${color.id})" stroke="#ffffff" stroke-width="4" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.15))" />
            <circle cx="${bx}" cy="${by}" r="55" fill="#ffffff" />
        `;

        // 4 Base Token Sockets
        for (let s = 0; s < 4; s++) {
          const pt = this.getSquareCoordinates(arm, 'homeBase', s);
          svg += `
            <circle cx="${pt.x}" cy="${pt.y}" r="16" fill="${armLight}" stroke="${armFill}" stroke-width="2.5" />
          `;
        }
        svg += `</g>`;

        // Home Column (6 steps)
        for (let step = 0; step < HOME_COLUMN_LENGTH; step++) {
          const pt = this.getSquareCoordinates(arm, 'homeCol', step);
          svg += `
            <rect x="${pt.x - 14}" y="${pt.y - 14}" width="28" height="28" rx="6"
                  fill="${isActive ? color.hex : '#cbd5e1'}" stroke="#ffffff" stroke-width="2" />
          `;
        }

        // Shared Track Squares for this arm (13 squares)
        for (let s = 0; s < SQUARES_PER_ARM; s++) {
          const globalTrackIdx = arm * SQUARES_PER_ARM + s;
          const pt = this.getSquareCoordinates(arm, 'track', s);
          const isStart = s === 0;
          const isStar = SAFE_SQUARES.has(globalTrackIdx);

          let tileFill = '#ffffff';
          if (isStart && isActive) tileFill = color.light;

          svg += `
            <g class="track-tile" data-track="${globalTrackIdx}">
              <rect x="${pt.x - 13}" y="${pt.y - 13}" width="26" height="26" rx="5"
                    fill="${tileFill}" stroke="#cbd5e1" stroke-width="1.8" />
          `;

          if (isStart && isActive) {
            svg += `<circle cx="${pt.x}" cy="${pt.y}" r="4" fill="${color.hex}" />`;
          }

          if (isStar) {
            svg += `
              <text x="${pt.x}" y="${pt.y + 4.5}" text-anchor="middle" font-size="14" fill="#f59e0b" font-weight="bold">★</text>
            `;
          }
          svg += `</g>`;
        }
      }

      // 4. Central Home Hexagon
      const centerHexPoints = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 - 30) * (Math.PI / 180);
        centerHexPoints.push(`${500 + 75 * Math.cos(ang)},${500 + 75 * Math.sin(ang)}`);
      }
      svg += `
        <polygon points="${centerHexPoints.join(' ')}" fill="#1e1145" stroke="#fbbf24" stroke-width="4" />
        <circle cx="500" cy="500" r="50" fill="url(#centerGlow)" />
        <text x="500" y="508" text-anchor="middle" font-size="28" fill="#fbbf24">👑</text>
      `;

      // 5. Dynamic Layer for Tokens & Highlights
      svg += `<g id="tokens-layer"></g>`;
      svg += `</svg>`;

      return svg;
    }
  }

  const boardGeo = new BoardGeometry();

  // ==========================================================================
  // 4. GAME STATE, PURE RULES & AI
  // ==========================================================================
  class GameState {
    constructor() {
      this.reset();
    }

    reset() {
      this.active = false;
      this.playerCount = 4;
      this.players = []; // { id, armIndex, name, isAi, aiDiff, color, avatar, finishedRank }
      this.activePlayerIndex = 0;
      this.diceValue = null;
      this.isRolling = false;
      this.hasRolled = false;
      this.consecutiveSixes = 0;
      this.rankings = []; // finished player IDs in order

      // Tokens: each player has 4 tokens
      // position: -1 = Yard, 0..77 = Shared track relative to player, 78..83 = Home column, 84 = Home!
      this.tokens = {}; // playerId -> [ { id: 0..3, step: -1 } ]

      // Rule Settings
      this.rules = {
        requireSixToExit: true,
        tripleSixPenalty: true,
        blockades: false,
        autoMoveSingle: true,
        playAllRankings: true,
      };

      this.pendingMoveTokens = [];
    }

    // Convert player-relative step to global shared track index (0..77)
    getGlobalTrackIndex(player, step) {
      if (step < 0 || step >= TRACK_LENGTH) return null;
      const startOffset = ARM_START_OFFSETS[player.armIndex];
      return (startOffset + step) % TRACK_LENGTH;
    }

    // Check legal moves for current player given a dice roll
    getLegalMoves(player, roll) {
      const pTokens = this.tokens[player.id];
      if (!pTokens) return [];

      const legal = [];
      pTokens.forEach(tok => {
        if (tok.step === WINNING_POSITION) return; // already in home

        if (tok.step === -1) {
          // Token in base
          if (!this.rules.requireSixToExit || roll === 6) {
            legal.push({ token: tok, toStep: 0, type: 'spawn' });
          }
          return;
        }

        const nextStep = tok.step + roll;
        if (nextStep > WINNING_POSITION) return; // must enter home on exact roll!

        // Blockade rule check
        if (this.rules.blockades && nextStep < TRACK_LENGTH) {
          const globalTarget = this.getGlobalTrackIndex(player, nextStep);
          // Check if another player has 2+ tokens on this square
          for (const otherPlayer of this.players) {
            if (otherPlayer.id === player.id) continue;
            const otherTokensHere = this.tokens[otherPlayer.id].filter(t => {
              if (t.step < 0 || t.step >= TRACK_LENGTH) return false;
              return this.getGlobalTrackIndex(otherPlayer, t.step) === globalTarget;
            });
            if (otherTokensHere.length >= 2) return; // blocked!
          }
        }

        legal.push({
          token: tok,
          toStep: nextStep,
          type: nextStep === WINNING_POSITION ? 'finish' : 'move',
        });
      });

      return legal;
    }

    // Computer AI decision engine (Easy, Medium, Hard)
    chooseAiMove(player, roll, legalMoves) {
      if (legalMoves.length === 0) return null;
      if (legalMoves.length === 1) return legalMoves[0];

      const diff = player.aiDiff || 'med';

      // 1. Easy: Random move
      if (diff === 'easy') {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }

      // Helper: score a move
      const scoreMove = (move) => {
        let score = 0;
        const targetStep = move.toStep;

        // Reach Home is huge
        if (targetStep === WINNING_POSITION) score += 1000;

        // Enter Home column is very safe and good
        if (targetStep >= TRACK_LENGTH) score += 300;

        // Exit Yard on 6
        if (move.type === 'spawn') score += 250;

        // Capture Opponent
        if (targetStep < TRACK_LENGTH) {
          const globalTarget = this.getGlobalTrackIndex(player, targetStep);
          const isSafe = SAFE_SQUARES.has(globalTarget);

          if (!isSafe) {
            for (const other of this.players) {
              if (other.id === player.id) continue;
              const victim = this.tokens[other.id].find(t => {
                if (t.step < 0 || t.step >= TRACK_LENGTH) return false;
                return this.getGlobalTrackIndex(other, t.step) === globalTarget;
              });
              if (victim) {
                score += 800; // Big capture reward!
              }
            }
          } else {
            score += 150; // Landing on safe square
          }

          // Hard AI: evaluate threat of being captured next turn
          if (diff === 'hard' && !isSafe) {
            for (const other of this.players) {
              if (other.id === player.id) continue;
              this.tokens[other.id].forEach(ot => {
                if (ot.step >= 0 && ot.step < TRACK_LENGTH) {
                  const otherGlobal = this.getGlobalTrackIndex(other, ot.step);
                  const dist = (globalTarget - otherGlobal + TRACK_LENGTH) % TRACK_LENGTH;
                  if (dist >= 1 && dist <= 6) {
                    score -= 400; // Dangerous spot!
                  }
                }
              });
            }
          }
        }

        // Advance furthest
        score += targetStep * 2;
        return score;
      };

      // Sort by best score
      legalMoves.sort((a, b) => scoreMove(b) - scoreMove(a));
      return legalMoves[0];
    }
  }

  const gameState = new GameState();

  // ==========================================================================
  // 5. APPLICATION CONTROLLER & UI BINDINGS
  // ==========================================================================
  class LudoApp {
    constructor() {
      this.lang = 'bn'; // Default to Bangla, toggles to 'en'
      this.theme = 'dark';
      this.colorblind = false;
      this.zoomLevel = 1;
      this.isAnimating = false;

      this.cacheDOMElements();
      this.bindEvents();
      this.loadSettings();
      this.checkSavedGame();

      // Show splash screen, then transition to home
      setTimeout(() => {
        this.fillSplashProgress();
      }, 300);
    }

    cacheDOMElements() {
      this.dom = {
        appContainer: document.getElementById('app-container'),
        // Screens
        screenSplash: document.getElementById('screen-splash'),
        screenHome: document.getElementById('screen-home'),
        screenSetup: document.getElementById('screen-setup'),
        screenGame: document.getElementById('screen-game'),
        // Modals
        modalWinner: document.getElementById('modal-winner'),
        modalPause: document.getElementById('modal-pause'),
        modalHowToPlay: document.getElementById('modal-howtoplay'),
        modalSettings: document.getElementById('modal-settings'),
        // Controls
        boardViewport: document.getElementById('board-viewport'),
        boardContainer: document.getElementById('board-container'),
        diceCube: document.getElementById('ludo-dice-cube'),
        diceContainer: document.getElementById('ludo-dice-container'),
        dicePromptText: document.getElementById('dice-prompt-text'),
        turnAvatar: document.getElementById('turn-avatar'),
        turnName: document.getElementById('turn-name'),
        turnDesc: document.getElementById('turn-desc'),
        toastBanner: document.getElementById('toast-banner'),
        seatsList: document.getElementById('seats-list'),
        playerCountChips: document.getElementById('player-count-chips'),
        confettiCanvas: document.getElementById('confetti-canvas'),
      };
    }

    bindEvents() {
      // Home Screen Buttons
      document.getElementById('btn-play-ai')?.addEventListener('click', () => this.openSetup(true));
      document.getElementById('btn-play-friends')?.addEventListener('click', () => this.openSetup(false));
      document.getElementById('btn-continue-game')?.addEventListener('click', () => this.continueSavedGame());
      document.getElementById('btn-how-to-play')?.addEventListener('click', () => this.openModal('modalHowToPlay'));
      document.getElementById('btn-settings')?.addEventListener('click', () => this.openModal('modalSettings'));

      // Setup Screen Buttons
      document.getElementById('btn-setup-back')?.addEventListener('click', () => this.showScreen('screenHome'));
      document.getElementById('btn-setup-start')?.addEventListener('click', () => this.startGameFromSetup());

      // In-Game Top Bar Buttons
      document.getElementById('btn-pause')?.addEventListener('click', () => this.openModal('modalPause'));
      document.getElementById('btn-quick-mute')?.addEventListener('click', () => this.toggleSound());
      document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.adjustZoom(0.15));
      document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.adjustZoom(-0.15));

      // Dice Click & Keyboard Spacebar
      this.dom.diceContainer?.addEventListener('click', () => this.handleUserDiceRoll());
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && this.dom.screenGame.classList.contains('active')) {
          e.preventDefault();
          this.handleUserDiceRoll();
        }
      });

      // Pause Modal Buttons
      document.getElementById('btn-pause-resume')?.addEventListener('click', () => this.closeModals());
      document.getElementById('btn-pause-restart')?.addEventListener('click', () => this.confirmRestart());
      document.getElementById('btn-pause-quit')?.addEventListener('click', () => this.confirmQuit());

      // Winner Modal Buttons
      document.getElementById('btn-winner-replay')?.addEventListener('click', () => this.restartGame());
      document.getElementById('btn-winner-home')?.addEventListener('click', () => {
        this.closeModals();
        this.showScreen('screenHome');
      });

      // Modal Close Buttons
      document.querySelectorAll('.btn-modal-close').forEach(btn => {
        btn.addEventListener('click', () => this.closeModals());
      });

      // Theme & Lang switches
      document.getElementById('select-lang')?.addEventListener('change', (e) => this.setLanguage(e.target.value));
      document.getElementById('toggle-sound')?.addEventListener('change', (e) => this.setSound(e.target.checked));
      document.getElementById('toggle-vibrate')?.addEventListener('change', (e) => this.setVibration(e.target.checked));
      document.getElementById('toggle-colorblind')?.addEventListener('change', (e) => this.setColorblind(e.target.checked));
      document.getElementById('toggle-theme')?.addEventListener('change', (e) => this.setTheme(e.target.checked ? 'light' : 'dark'));
    }

    fillSplashProgress() {
      const fill = document.getElementById('splash-loader-fill');
      if (fill) fill.style.width = '100%';
      setTimeout(() => {
        this.showScreen('screenHome');
      }, 700);
    }

    showScreen(screenKey) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const target = this.dom[screenKey];
      if (target) target.classList.add('active');
    }

    openModal(modalKey) {
      this.closeModals();
      const modal = this.dom[modalKey];
      if (modal) modal.classList.add('open');
    }

    closeModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    }

    showToast(messageKey, interpolations = '') {
      const text = (I18N[this.lang][messageKey] || messageKey) + (interpolations ? ' ' + interpolations : '');
      const toast = this.dom.toastBanner;
      if (!toast) return;

      toast.textContent = text;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2200);
    }

    // ========================================================================
    // SETUP SCREEN & PLAYER INITIALIZATION
    // ========================================================================
    openSetup(isVsAi) {
      this.isVsAiMode = isVsAi;
      this.selectedCount = 4;
      this.renderPlayerCountChips();
      this.renderSeatsList();
      this.showScreen('screenSetup');
    }

    renderPlayerCountChips() {
      const container = this.dom.playerCountChips;
      if (!container) return;
      container.innerHTML = '';
      [2, 3, 4, 5, 6].forEach(cnt => {
        const btn = document.createElement('button');
        btn.className = `chip-btn ${cnt === this.selectedCount ? 'active' : ''}`;
        btn.textContent = `${cnt} ${this.lang === 'bn' ? 'জন' : 'P'}`;
        btn.addEventListener('click', () => {
          this.selectedCount = cnt;
          this.renderPlayerCountChips();
          this.renderSeatsList();
        });
        container.appendChild(btn);
      });
    }

    // Determine balanced arm indices for 2 to 6 players
    getActiveArmIndices(count) {
      switch (count) {
        case 2: return [0, 3]; // Opposite seats (Red & Blue)
        case 3: return [0, 2, 4]; // Equilateral triangle
        case 4: return [0, 1, 3, 4]; // Balanced 4 seats
        case 5: return [0, 1, 2, 3, 4];
        case 6: return [0, 1, 2, 3, 4, 5];
        default: return [0, 1, 2, 3];
      }
    }

    renderSeatsList() {
      const container = this.dom.seatsList;
      if (!container) return;
      container.innerHTML = '';

      const activeArms = this.getActiveArmIndices(this.selectedCount);
      const activeArmSet = new Set(activeArms);

      for (let arm = 0; arm < ARMS_COUNT; arm++) {
        const color = PLAYER_COLORS[arm];
        const isActive = activeArmSet.has(arm);
        const seatIdx = activeArms.indexOf(arm);

        const row = document.createElement('div');
        row.className = `seat-row ${isActive ? '' : 'disabled'}`;
        row.dataset.arm = arm;

        const defaultName = isActive
          ? (this.lang === 'bn' ? `খেলোয়াড় ${seatIdx + 1}` : `Player ${seatIdx + 1}`)
          : color.nameEn;
        const defaultIsAi = this.isVsAiMode ? (seatIdx > 0) : false;
        const avatar = AVATARS[arm % AVATARS.length];

        row.innerHTML = `
          <div class="seat-swatch" style="background:${color.hex};"></div>
          <button class="seat-avatar-btn" type="button" title="Avatar">${avatar}</button>
          <input type="text" class="seat-name-input" value="${defaultName}" maxlength="18" ${isActive ? '' : 'disabled'} />
          <select class="seat-type-select" ${isActive ? '' : 'disabled'}>
            <option value="human" ${!defaultIsAi ? 'selected' : ''}>${I18N[this.lang].human}</option>
            <option value="ai" ${defaultIsAi ? 'selected' : ''}>${I18N[this.lang].comp}</option>
          </select>
          <select class="seat-diff-select" style="display:${defaultIsAi ? 'block' : 'none'};" ${isActive ? '' : 'disabled'}>
            <option value="easy">${I18N[this.lang].easy}</option>
            <option value="med" selected>${I18N[this.lang].med}</option>
            <option value="hard">${I18N[this.lang].hard}</option>
          </select>
        `;

        // Toggle difficulty visibility on type change
        const typeSelect = row.querySelector('.seat-type-select');
        const diffSelect = row.querySelector('.seat-diff-select');
        typeSelect.addEventListener('change', () => {
          diffSelect.style.display = typeSelect.value === 'ai' ? 'block' : 'none';
        });

        // Cycle avatar on tap
        const avBtn = row.querySelector('.seat-avatar-btn');
        avBtn.addEventListener('click', () => {
          let curr = AVATARS.indexOf(avBtn.textContent);
          curr = (curr + 1) % AVATARS.length;
          avBtn.textContent = AVATARS[curr];
        });

        container.appendChild(row);
      }
    }

    startGameFromSetup() {
      const activeArms = this.getActiveArmIndices(this.selectedCount);
      const rows = this.dom.seatsList.querySelectorAll('.seat-row');

      gameState.reset();
      gameState.playerCount = this.selectedCount;

      activeArms.forEach((arm, idx) => {
        const row = Array.from(rows).find(r => Number(r.dataset.arm) === arm);
        const name = row?.querySelector('.seat-name-input').value.trim() || `Player ${idx + 1}`;
        const isAi = row?.querySelector('.seat-type-select').value === 'ai';
        const aiDiff = row?.querySelector('.seat-diff-select').value || 'med';
        const avatar = row?.querySelector('.seat-avatar-btn').textContent || '👑';
        const color = PLAYER_COLORS[arm];

        const playerId = `p_${arm}`;
        gameState.players.push({
          id: playerId,
          armIndex: arm,
          name,
          isAi,
          aiDiff,
          color,
          avatar,
          finishedRank: null,
        });

        // 4 tokens in yard
        gameState.tokens[playerId] = [
          { id: 0, step: -1 },
          { id: 1, step: -1 },
          { id: 2, step: -1 },
          { id: 3, step: -1 },
        ];
      });

      gameState.active = true;
      gameState.activePlayerIndex = 0;
      this.initBoardAndGame();
    }

    // ========================================================================
    // GAME BOARD RENDERING & TOKEN ANIMATIONS
    // ========================================================================
    initBoardAndGame() {
      const activeArms = gameState.players.map(p => p.armIndex);
      this.dom.boardContainer.innerHTML = boardGeo.buildSvgMarkup(activeArms);

      this.renderTokensOnBoard();
      this.updateTurnUI();
      this.showScreen('screenGame');
      this.saveGameState();

      // Trigger AI if first player is computer
      this.checkAndTriggerAiTurn();
    }

    renderTokensOnBoard() {
      const layer = document.getElementById('tokens-layer');
      if (!layer) return;
      layer.innerHTML = '';

      // Collect tokens by coordinate to stack neatly
      const coordMap = new Map();

      gameState.players.forEach(p => {
        const pTokens = gameState.tokens[p.id];
        pTokens.forEach(tok => {
          let pt;
          if (tok.step === -1) {
            pt = boardGeo.getSquareCoordinates(p.armIndex, 'homeBase', tok.id);
          } else if (tok.step === WINNING_POSITION) {
            pt = boardGeo.getSquareCoordinates(p.armIndex, 'homeCenter', tok.id);
          } else if (tok.step >= TRACK_LENGTH) {
            const colIdx = tok.step - TRACK_LENGTH;
            pt = boardGeo.getSquareCoordinates(p.armIndex, 'homeCol', colIdx);
          } else {
            const globalTrack = gameState.getGlobalTrackIndex(p, tok.step);
            const arm = Math.floor(globalTrack / SQUARES_PER_ARM);
            const s = globalTrack % SQUARES_PER_ARM;
            pt = boardGeo.getSquareCoordinates(arm, 'track', s);
          }

          const key = `${Math.round(pt.x)},${Math.round(pt.y)}`;
          if (!coordMap.has(key)) coordMap.set(key, []);
          coordMap.get(key).push({ player: p, token: tok, basePt: pt });
        });
      });

      // Render stacked pawns with micro-offsets and badges
      coordMap.forEach(group => {
        const count = group.length;
        group.forEach((item, idx) => {
          const { player, token, basePt } = item;
          const offsetRadius = count > 1 ? 9 : 0;
          const offsetAngle = (idx * (360 / Math.max(1, count))) * (Math.PI / 180);
          const x = basePt.x + offsetRadius * Math.cos(offsetAngle);
          const y = basePt.y + offsetRadius * Math.sin(offsetAngle);

          const isMovable = gameState.pendingMoveTokens.some(m => m.token.id === token.id && player.id === gameState.players[gameState.activePlayerIndex]?.id);

          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('class', `ludo-pawn ${isMovable ? 'movable' : ''}`);
          g.setAttribute('data-player', player.id);
          g.setAttribute('data-token', token.id);
          g.setAttribute('transform', `translate(${x}, ${y})`);
          g.setAttribute('filter', 'url(#pawnShadow)');

          // Pawn Shape (Glossy 3D Head and Skirt)
          g.innerHTML = `
            <ellipse cx="0" cy="8" rx="13" ry="5" fill="${player.color.dark}" opacity="0.6" />
            <path d="M -9 8 Q 0 -6 9 8 Z" fill="url(#pawnGrad_${player.color.id})" />
            <circle cx="0" cy="-6" r="9.5" fill="url(#pawnGrad_${player.color.id})" stroke="#ffffff" stroke-width="1.4" />
          `;

          // Colorblind mark if enabled
          if (this.colorblind) {
            g.innerHTML += `
              <text class="colorblind-mark" x="0" y="-3" text-anchor="middle">${player.color.mark}</text>
            `;
          }

          // Count badge if 2+ tokens on same spot
          if (count > 1 && idx === 0) {
            g.innerHTML += `
              <circle cx="9" cy="-12" r="6" fill="#1e1145" stroke="#ffffff" stroke-width="1" />
              <text x="9" y="-9" text-anchor="middle" font-size="8" fill="#fbbf24" font-weight="bold">${count}</text>
            `;
          }

          // Tap pawn to move
          if (isMovable) {
            g.addEventListener('click', (e) => {
              e.stopPropagation();
              this.executeMove(token);
            });
          }

          layer.appendChild(g);
        });
      });
    }

    updateTurnUI() {
      const player = gameState.players[gameState.activePlayerIndex];
      if (!player) return;

      this.dom.turnAvatar.textContent = player.avatar;
      this.dom.turnAvatar.style.borderColor = player.color.hex;
      this.dom.turnName.textContent = player.name;
      this.dom.turnName.style.color = player.color.hex;

      const desc = player.isAi ? I18N[this.lang].aiThinking : (this.lang === 'bn' ? 'চাল দিন' : 'Your Turn');
      this.dom.turnDesc.textContent = desc;

      if (!gameState.hasRolled && !player.isAi) {
        this.dom.dicePromptText.textContent = I18N[this.lang].rollPrompt;
      }
    }

    // ========================================================================
    // DICE ROLLING & TURN EXECUTION
    // ========================================================================
    handleUserDiceRoll() {
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      if (!activePlayer || activePlayer.isAi || gameState.isRolling || gameState.hasRolled || this.isAnimating) {
        return;
      }
      this.rollDice();
    }

    rollDice() {
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      if (!activePlayer || gameState.isRolling || gameState.hasRolled) return;

      gameState.isRolling = true;
      audio.diceRoll();

      this.dom.diceCube.classList.add('rolling');
      this.dom.dicePromptText.textContent = I18N[this.lang].rolling;

      setTimeout(() => {
        this.dom.diceCube.classList.remove('rolling');
        const rollValue = Math.floor(Math.random() * 6) + 1;
        gameState.diceValue = rollValue;
        gameState.isRolling = false;
        gameState.hasRolled = true;

        this.setDiceFace(rollValue);

        // Check 3 consecutive 6s penalty
        if (rollValue === 6) {
          gameState.consecutiveSixes++;
          if (gameState.rules.tripleSixPenalty && gameState.consecutiveSixes >= 3) {
            this.showToast('tripleSix');
            setTimeout(() => this.passTurn(false), 1200);
            return;
          }
        } else {
          gameState.consecutiveSixes = 0;
        }

        // Evaluate legal moves
        const legal = gameState.getLegalMoves(activePlayer, rollValue);
        gameState.pendingMoveTokens = legal;

        if (legal.length === 0) {
          this.showToast('noMoves');
          setTimeout(() => this.passTurn(false), 1100);
        } else if (activePlayer.isAi) {
          // AI calculates decision after brief delay
          setTimeout(() => {
            const chosen = gameState.chooseAiMove(activePlayer, rollValue, legal);
            if (chosen) this.executeMove(chosen.token);
          }, 750);
        } else {
          // Human turn: auto-move if single choice setting enabled
          if (legal.length === 1 && gameState.rules.autoMoveSingle) {
            this.executeMove(legal[0].token);
          } else {
            this.dom.dicePromptText.textContent = `${this.lang === 'bn' ? 'ঘুঁটিতে ট্যাপ করুন' : 'Tap a Pawn'} (+${rollValue})`;
            this.renderTokensOnBoard();
          }
        }
      }, 700);
    }

    setDiceFace(value) {
      const rotMap = {
        1: 'rotateY(0deg)',
        2: 'rotateX(90deg)',
        3: 'rotateY(-90deg)',
        4: 'rotateY(90deg)',
        5: 'rotateX(-90deg)',
        6: 'rotateX(180deg)',
      };
      this.dom.diceCube.style.transform = rotMap[value] || 'rotateY(0deg)';
    }

    executeMove(token) {
      if (this.isAnimating) return;
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      const roll = gameState.diceValue;
      const move = gameState.pendingMoveTokens.find(m => m.token.id === token.id);
      if (!move) return;

      this.isAnimating = true;
      gameState.pendingMoveTokens = [];

      const startStep = token.step;
      const targetStep = move.toStep;

      if (startStep === -1) {
        // Exiting Base
        token.step = 0;
        audio.tokenSpawn();
        this.renderTokensOnBoard();
        this.isAnimating = false;
        this.postMoveCheck(activePlayer, roll === 6);
      } else {
        // Step-by-step hopping along path
        let current = startStep;
        const hopInterval = setInterval(() => {
          current++;
          token.step = current;
          audio.tokenHop();
          this.renderTokensOnBoard();

          if (current >= targetStep) {
            clearInterval(hopInterval);
            this.isAnimating = false;
            this.postMoveCheck(activePlayer, roll === 6);
          }
        }, 150);
      }
    }

    postMoveCheck(player, hadSixRoll) {
      let extraTurn = hadSixRoll;
      const targetStep = gameState.tokens[player.id].find(t => t.step >= 0)?.step;

      // 1. Capture Check (if on shared track)
      const lastMovedToken = gameState.tokens[player.id].find(t => t.step >= 0 && t.step < TRACK_LENGTH);
      if (lastMovedToken) {
        const globalSpot = gameState.getGlobalTrackIndex(player, lastMovedToken.step);
        const isSafe = SAFE_SQUARES.has(globalSpot);

        if (!isSafe) {
          for (const other of gameState.players) {
            if (other.id === player.id) continue;
            const victims = gameState.tokens[other.id].filter(t => {
              if (t.step < 0 || t.step >= TRACK_LENGTH) return false;
              return gameState.getGlobalTrackIndex(other, t.step) === globalSpot;
            });

            // Single victim captured!
            if (victims.length === 1) {
              const v = victims[0];
              v.step = -1; // back to base
              audio.capture();
              this.showToast('captured');
              extraTurn = true; // Bonus turn!
              this.renderTokensOnBoard();
              break;
            }
          }
        }
      }

      // 2. Token Reached Home Check
      const finishedTokens = gameState.tokens[player.id].filter(t => t.step === WINNING_POSITION);
      if (finishedTokens.length === 4 && !player.finishedRank) {
        audio.victory();
        gameState.rankings.push(player);
        player.finishedRank = gameState.rankings.length;
        this.showToast('tokenHome');

        // Check if game ends
        const activeUnfinished = gameState.players.filter(p => !p.finishedRank);
        if (!gameState.rules.playAllRankings || activeUnfinished.length <= 1) {
          this.showWinnerScreen();
          return;
        }
      }

      this.passTurn(extraTurn);
    }

    passTurn(extraTurn = false) {
      this.saveGameState();
      gameState.hasRolled = false;
      gameState.isRolling = false;
      gameState.diceValue = null;
      gameState.pendingMoveTokens = [];

      if (extraTurn) {
        this.updateTurnUI();
        this.renderTokensOnBoard();
        this.checkAndTriggerAiTurn();
        return;
      }

      // Next player (skip finished players)
      let nextIndex = gameState.activePlayerIndex;
      let count = 0;
      do {
        nextIndex = (nextIndex + 1) % gameState.players.length;
        count++;
      } while (gameState.players[nextIndex].finishedRank && count < gameState.players.length);

      gameState.activePlayerIndex = nextIndex;
      gameState.consecutiveSixes = 0;

      this.updateTurnUI();
      this.renderTokensOnBoard();
      this.checkAndTriggerAiTurn();
    }

    checkAndTriggerAiTurn() {
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      if (activePlayer && activePlayer.isAi && gameState.active && !gameState.isRolling && !gameState.hasRolled) {
        setTimeout(() => {
          this.rollDice();
        }, 850);
      }
    }

    // ========================================================================
    // WINNER MODAL & CONFETTI CELEBRATION
    // ========================================================================
    showWinnerScreen() {
      gameState.active = false;
      localStorage.removeItem('ludo_saved_game');

      const list = document.getElementById('winner-rankings-list');
      if (list) {
        list.innerHTML = '';
        gameState.rankings.forEach((p, idx) => {
          const item = document.createElement('div');
          item.className = 'ranking-item';
          const badgeClass = idx === 0 ? 'first' : idx === 1 ? 'second' : 'third';
          item.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="ranking-badge ${badgeClass}">#${idx + 1}</span>
              <span style="font-size:22px;">${p.avatar}</span>
              <span style="font-weight:700;color:${p.color.hex};">${p.name}</span>
            </div>
            <span style="font-size:12px;font-weight:700;color:#64748b;">${idx === 0 ? 'WINNER 🏆' : 'Finished'}</span>
          `;
          list.appendChild(item);
        });
      }

      this.openModal('modalWinner');
      this.launchConfetti();
    }

    launchConfetti() {
      const canvas = this.dom.confettiCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#f97316', '#fbbf24'];

      for (let i = 0; i < 120; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.4,
          vx: (Math.random() - 0.5) * 12,
          vy: Math.random() * -14 - 4,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 10,
        });
      }

      let frames = 0;
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // gravity
          p.rot += p.vrot;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });

        frames++;
        if (frames < 140) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      animate();
    }

    // ========================================================================
    // PAUSE, SAVE & SETTINGS
    // ========================================================================
    confirmRestart() {
      if (confirm(I18N[this.lang].confirmRestart)) {
        this.closeModals();
        this.restartGame();
      }
    }

    confirmQuit() {
      if (confirm(I18N[this.lang].confirmQuit)) {
        this.closeModals();
        gameState.reset();
        localStorage.removeItem('ludo_saved_game');
        this.checkSavedGame();
        this.showScreen('screenHome');
      }
    }

    restartGame() {
      this.closeModals();
      gameState.active = true;
      gameState.activePlayerIndex = 0;
      gameState.rankings = [];
      gameState.players.forEach(p => {
        p.finishedRank = null;
        gameState.tokens[p.id] = [
          { id: 0, step: -1 },
          { id: 1, step: -1 },
          { id: 2, step: -1 },
          { id: 3, step: -1 },
        ];
      });
      this.initBoardAndGame();
    }

    saveGameState() {
      if (!gameState.active) return;
      try {
        const payload = {
          players: gameState.players,
          playerCount: gameState.playerCount,
          activePlayerIndex: gameState.activePlayerIndex,
          tokens: gameState.tokens,
          rankings: gameState.rankings,
          rules: gameState.rules,
        };
        localStorage.setItem('ludo_saved_game', JSON.stringify(payload));
        this.checkSavedGame();
      } catch (e) {}
    }

    checkSavedGame() {
      const btn = document.getElementById('btn-continue-game');
      if (!btn) return;
      const saved = localStorage.getItem('ludo_saved_game');
      btn.style.display = saved ? 'block' : 'none';
    }

    continueSavedGame() {
      try {
        const data = JSON.parse(localStorage.getItem('ludo_saved_game'));
        if (data && data.players && data.tokens) {
          gameState.players = data.players;
          gameState.playerCount = data.playerCount;
          gameState.activePlayerIndex = data.activePlayerIndex;
          gameState.tokens = data.tokens;
          gameState.rankings = data.rankings || [];
          gameState.rules = data.rules || gameState.rules;
          gameState.active = true;
          this.initBoardAndGame();
        }
      } catch (e) {
        localStorage.removeItem('ludo_saved_game');
      }
    }

    adjustZoom(delta) {
      this.zoomLevel = Math.max(0.8, Math.min(1.8, this.zoomLevel + delta));
      this.dom.boardContainer.style.transform = `scale(${this.zoomLevel})`;
    }

    setLanguage(lang) {
      this.lang = lang;
      localStorage.setItem('ludo_lang', lang);
      this.applyTranslations();
    }

    setSound(enabled) {
      audio.enabled = enabled;
      localStorage.setItem('ludo_sound', String(enabled));
    }

    toggleSound() {
      audio.enabled = !audio.enabled;
      localStorage.setItem('ludo_sound', String(audio.enabled));
      const toggle = document.getElementById('toggle-sound');
      if (toggle) toggle.checked = audio.enabled;
      this.showToast(audio.enabled ? 'Sound On' : 'Sound Muted');
    }

    setVibration(enabled) {
      audio.vibrateEnabled = enabled;
      localStorage.setItem('ludo_vibrate', String(enabled));
    }

    setColorblind(enabled) {
      this.colorblind = enabled;
      localStorage.setItem('ludo_colorblind', String(enabled));
      this.renderTokensOnBoard();
    }

    setTheme(theme) {
      this.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('ludo_theme', theme);
    }

    loadSettings() {
      const sTheme = localStorage.getItem('ludo_theme') || 'dark';
      this.setTheme(sTheme);

      const sSound = localStorage.getItem('ludo_sound');
      if (sSound !== null) audio.enabled = sSound === 'true';

      const sVibrate = localStorage.getItem('ludo_vibrate');
      if (sVibrate !== null) audio.vibrateEnabled = sVibrate === 'true';

      const sColorblind = localStorage.getItem('ludo_colorblind');
      if (sColorblind !== null) this.colorblind = sColorblind === 'true';

      const sLang = localStorage.getItem('ludo_lang') || 'bn';
      this.lang = sLang;
      this.applyTranslations();
    }

    applyTranslations() {
      const dict = I18N[this.lang];
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.dataset.i18n;
        if (dict[k]) el.textContent = dict[k];
      });
    }
  }

  // Launch on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LudoApp());
  } else {
    new LudoApp();
  }
})();
