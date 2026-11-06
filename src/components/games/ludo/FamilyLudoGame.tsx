import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Users, Bot, User, Play, Sparkles, Maximize2, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member } from '../../../types';
import { GameMode, LudoPlayer, ClassicToken, PlayerColor, SNAKES_AND_LADDERS, COLOR_CONFIGS, SnakeOrLadder } from './types';
import { ludoAudio } from './ludoAudio';
import { ClassicLudoBoard, SAFE_SPOTS_4, START_OFFSETS_4 } from './ClassicLudoBoard';
import { SnakesLaddersBoard } from './SnakesLaddersBoard';
import { ThreeDDice } from './ThreeDDice';

interface FamilyLudoGameProps {
  members?: Member[];
  onBackToHub: () => void;
}

const getAssignedColors = (count: number): PlayerColor[] => {
  if (count === 2) return ['red', 'yellow'];
  if (count === 3) return ['red', 'green', 'yellow'];
  if (count === 4) return ['red', 'green', 'yellow', 'blue'];
  if (count === 5) return ['red', 'green', 'yellow', 'blue', 'purple'];
  return ['red', 'green', 'yellow', 'blue', 'purple', 'orange'];
};

const COLOR_NAMES_BN: Record<PlayerColor, string> = {
  red: 'লাল',
  green: 'সবুজ',
  yellow: 'হলুদ',
  blue: 'নীল',
  purple: 'বেগুনি',
  orange: 'কমলা',
};

export const FamilyLudoGame: React.FC<FamilyLudoGameProps> = ({ onBackToHub }) => {
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(4);

  // Initialize players
  const [players, setPlayers] = useState<LudoPlayer[]>(() => {
    const assigned = getAssignedColors(4);
    return assigned.map((c, i) => ({
      id: `player_${i}`,
      name: `খেলোয়াড় ${i + 1} (${COLOR_NAMES_BN[c]})`,
      color: c,
      isAi: i > 0, // Player 1 is Human, rest Robot AI
    }));
  });

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // Dice & Turn state
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [isMovingStep, setIsMovingStep] = useState(false);
  const [eventLog, setEventLog] = useState<string>('খেলা শুরু করতে ৩ডি ছক্কা ছুঁড়ুন!');
  const [isMuted, setIsMuted] = useState(() => ludoAudio.getIsMuted());

  // Classic Ludo tokens (4 per player)
  const [classicTokens, setClassicTokens] = useState<ClassicToken[]>([]);
  const [movableTokenIds, setMovableTokenIds] = useState<Set<number>>(new Set());

  // Snakes & Ladders positions (1 token per player, position 1..100)
  const [snakePositions, setSnakePositions] = useState<Record<string, number>>({});
  const [lastClimbOrBite, setLastClimbOrBite] = useState<{ text: string; type: 'snake' | 'ladder'; item?: SnakeOrLadder } | null>(null);
  const [pendingHumanMove, setPendingHumanMove] = useState(false);
  const [targetTile, setTargetTile] = useState<number | null>(null);

  // Winner state
  const [winner, setWinner] = useState<LudoPlayer | null>(null);

  // -------------------------------------------------------------
  // Mutex Locks and Synchronous State Mirrors (Zero-Race Guarantee)
  // -------------------------------------------------------------
  const isPlayingRef = useRef(false);
  const isRollingRef = useRef(false);
  const isMovingRef = useRef(false);
  const activePlayerIndexRef = useRef(0);
  const playersRef = useRef(players);
  const classicTokensRef = useRef<ClassicToken[]>([]);
  const snakePositionsRef = useRef<Record<string, number>>({});
  const movableTokenIdsRef = useRef<Set<number>>(new Set());

  // Dedicated Timers to completely prevent stomping or accidental cancellation
  const aiRollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiMoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (aiRollTimerRef.current) {
      clearTimeout(aiRollTimerRef.current);
      aiRollTimerRef.current = null;
    }
    if (aiMoveTimerRef.current) {
      clearTimeout(aiMoveTimerRef.current);
      aiMoveTimerRef.current = null;
    }
    if (turnAdvanceTimerRef.current) {
      clearTimeout(turnAdvanceTimerRef.current);
      turnAdvanceTimerRef.current = null;
    }
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  };

  // Synchronous mirror syncing
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    activePlayerIndexRef.current = activePlayerIndex;
  }, [activePlayerIndex]);

  useEffect(() => {
    classicTokensRef.current = classicTokens;
  }, [classicTokens]);

  useEffect(() => {
    snakePositionsRef.current = snakePositions;
  }, [snakePositions]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const getTrackLength = (count: number) => count > 4 ? count * 10 : 52;
  const getMaxSteps = (count: number) => count > 4 ? count * 10 + 5 : 57;

  // Update players list when playerCount changes in setup mode
  useEffect(() => {
    if (isPlaying) return;

    const assigned = getAssignedColors(playerCount);
    setPlayers(prev => {
      const list: LudoPlayer[] = [];
      for (let i = 0; i < playerCount; i++) {
        const color = assigned[i] || 'red';
        const existing = prev[i];
        list.push({
          id: `player_${i}`,
          name: existing?.name || `খেলোয়াড় ${i + 1} (${COLOR_NAMES_BN[color]})`,
          color,
          isAi: existing ? existing.isAi : i > 0,
        });
      }
      return list;
    });
  }, [playerCount, isPlaying]);

  // Guaranteed safe activePlayer object
  const activePlayer: LudoPlayer = players[activePlayerIndex] || players[0] || {
    id: 'player_0',
    name: 'খেলোয়াড় ১',
    color: 'red',
    isAi: false,
  };

  const isHumanTurn = !activePlayer.isAi;

  const handleToggleMute = () => {
    const next = ludoAudio.toggleMute();
    setIsMuted(next);
  };

  // -------------------------------------------------------------
  // Turn Advance Engine (Strict Mutex + Failsafe Transition)
  // -------------------------------------------------------------
  const nextTurn = useCallback((extraRoll = false) => {
    clearAllTimers();
    isRollingRef.current = false;
    isMovingRef.current = false;
    setIsRolling(false);
    setIsMovingStep(false);
    setHasRolled(false);
    setDiceValue(null);
    setMovableTokenIds(new Set());
    movableTokenIdsRef.current = new Set();
    setPendingHumanMove(false);
    setTargetTile(null);

    const currentPlayers = playersRef.current;
    if (currentPlayers.length === 0) return;

    if (extraRoll) {
      const currentPlayer = currentPlayers[activePlayerIndexRef.current] || currentPlayers[0];
      if (currentPlayer.isAi) {
        setEventLog(`🎲 ${currentPlayer.name} বাড়তি চাল পাওয়ায় রোবট আবার চাল দিচ্ছে...`);
        // Robot schedules its extra roll automatically
        aiRollTimerRef.current = setTimeout(() => {
          rollDiceCore(true);
        }, 850);
      } else {
        setEventLog(`🎉 বাড়তি চাল পেলেন! আবার ৩ডি ছক্কায় ট্যাপ করুন`);
        // Human must manually tap! No auto-play!
      }
      return;
    }

    const nextIndex = (activePlayerIndexRef.current + 1) % currentPlayers.length;
    activePlayerIndexRef.current = nextIndex;
    setActivePlayerIndex(nextIndex);

    const nextPlayer = currentPlayers[nextIndex] || currentPlayers[0];
    if (nextPlayer.isAi) {
      setEventLog(`🤖 ${nextPlayer.name}-এর চাল! রোবট চাল দিচ্ছে...`);
      // Robot schedules roll automatically
      aiRollTimerRef.current = setTimeout(() => {
        rollDiceCore(true);
      }, 850);
    } else {
      setEventLog(`👤 ${nextPlayer.name}-এর চাল! ৩ডি ছক্কায় ট্যাপ করুন`);
      // Human must tap!
    }
  }, []);

  // -------------------------------------------------------------
  // Snakes & Ladders: Step-by-Step Moving Logic
  // -------------------------------------------------------------
  const executeSnakesStepByStep = (startPos: number, roll: number) => {
    let finalTarget = startPos + roll;
    if (finalTarget > 100) {
      const currentPlayer = playersRef.current[activePlayerIndexRef.current] || activePlayer;
      setEventLog(`${currentPlayer.name}-এর ${roll} পড়েছে কিন্তু ১০০ অতিক্রম করায় চাল সম্ভব নয়`);
      turnAdvanceTimerRef.current = setTimeout(() => nextTurn(roll === 6), 1100);
      return;
    }

    isMovingRef.current = true;
    setIsMovingStep(true);
    setPendingHumanMove(false);
    let curr = startPos;
    let stepCount = 0;
    const currentPlayer = playersRef.current[activePlayerIndexRef.current] || activePlayer;

    stepIntervalRef.current = setInterval(() => {
      curr++;
      stepCount++;
      setSnakePositions(prev => {
        const next = { ...prev, [currentPlayer.id]: curr };
        snakePositionsRef.current = next;
        return next;
      });
      ludoAudio.playMove();
      setEventLog(`${currentPlayer.name}: ধাপ ${stepCount}/${roll} (ঘর ${curr})`);

      if (curr >= finalTarget) {
        if (stepIntervalRef.current) {
          clearInterval(stepIntervalRef.current);
          stepIntervalRef.current = null;
        }
        isMovingRef.current = false;
        setIsMovingStep(false);

        // Check ladder or snake
        const ladder = SNAKES_AND_LADDERS.find(s => s.type === 'ladder' && s.start === finalTarget);
        const snake = SNAKES_AND_LADDERS.find(s => s.type === 'snake' && s.start === finalTarget);

        if (ladder) {
          finalTarget = ladder.end;
          ludoAudio.playLadder();
          setLastClimbOrBite({
            text: `${currentPlayer.name} মই বেয়ে [${ladder.bengaliTitle}] অর্জন করে ${ladder.start} থেকে ${ladder.end}-এ পৌঁছেছেন!`,
            type: 'ladder',
            item: ladder,
          });
          setSnakePositions(prev => {
            const next = { ...prev, [currentPlayer.id]: finalTarget };
            snakePositionsRef.current = next;
            return next;
          });
          setEventLog(`🪜 ${currentPlayer.name} মই বেয়ে ${ladder.end}-এ উঠেছেন!`);
        } else if (snake) {
          finalTarget = snake.end;
          ludoAudio.playSnake();
          setLastClimbOrBite({
            text: `${currentPlayer.name} [${snake.bengaliTitle}] সাপের ছোবলে পড়ে ${snake.start} থেকে ${snake.end}-এ নেমে গেছেন!`,
            type: 'snake',
            item: snake,
          });
          setSnakePositions(prev => {
            const next = { ...prev, [currentPlayer.id]: finalTarget };
            snakePositionsRef.current = next;
            return next;
          });
          setEventLog(`🐍 ${currentPlayer.name} সাপের মুখে পড়ে ${snake.end}-এ নেমে গেছেন!`);
        } else {
          setLastClimbOrBite(null);
          setEventLog(`${currentPlayer.name} সফলভাবে ${roll} ঘর এগিয়ে ${finalTarget}-এ পৌঁছেছেন!`);
        }

        // Winner check
        if (finalTarget === 100) {
          ludoAudio.playVictory();
          setWinner(currentPlayer);
          confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
          return;
        }

        const hasBonus = roll === 6;
        turnAdvanceTimerRef.current = setTimeout(() => nextTurn(hasBonus), 1200);
      }
    }, 180);
  };

  const handleSnakesAfterRoll = (roll: number, player: LudoPlayer) => {
    const currentPos = snakePositionsRef.current[player.id] || 1;
    const target = currentPos + roll;

    if (target > 100) {
      setEventLog(`${player.name}-এর ${roll} পড়েছে কিন্তু ১০০ পার হওয়ায় এগোনো যাবে না`);
      turnAdvanceTimerRef.current = setTimeout(() => nextTurn(roll === 6), 1100);
      return;
    }

    if (player.isAi) {
      // Robot moves automatically
      setEventLog(`🤖 রোবট ${roll} ঘর এগিয়ে যাচ্ছে (ঘর ${currentPos} ➔ ${target})`);
      aiMoveTimerRef.current = setTimeout(() => {
        executeSnakesStepByStep(currentPos, roll);
      }, 700);
    } else {
      // Human must tap to move! Game completely waits for human!
      setPendingHumanMove(true);
      setTargetTile(target);
      setEventLog(`আপনার ছক্কায় পড়েছে: ${roll} ঘর! নিচে "ঘুঁটি এগিয়ে নিন" বাটনে ট্যাপ করুন`);
    }
  };

  const handleHumanSnakesMoveClick = () => {
    if (!pendingHumanMove || !diceValue || activePlayer.isAi || isMovingRef.current) return;
    const currentPos = snakePositionsRef.current[activePlayer.id] || 1;
    executeSnakesStepByStep(currentPos, diceValue);
  };

  // -------------------------------------------------------------
  // Classic Ludo: Step-by-Step Movement Engine
  // -------------------------------------------------------------
  const executeClassicStepMovement = (token: ClassicToken, roll: number) => {
    if (isMovingRef.current) return;
    isMovingRef.current = true;
    setIsMovingStep(true);
    setMovableTokenIds(new Set());
    movableTokenIdsRef.current = new Set();

    const totalPlayers = playersRef.current.length;
    const trackLen = getTrackLength(totalPlayers);
    const maxSteps = getMaxSteps(totalPlayers);
    const currentPlayer = playersRef.current[activePlayerIndexRef.current] || activePlayer;

    let extraTurn = roll === 6;

    if (token.position === -1) {
      // Exit yard directly to 0
      ludoAudio.playSpawn();
      setEventLog(`${currentPlayer.name} নতুন ঘুঁটি মাঠে নামিয়েছেন! (৬ পড়েছে)`);
      const updated = classicTokensRef.current.map(t => t.id === token.id ? { ...t, position: 0 } : t);
      classicTokensRef.current = updated;
      setClassicTokens(updated);
      isMovingRef.current = false;
      setIsMovingStep(false);
      turnAdvanceTimerRef.current = setTimeout(() => nextTurn(true), 700);
      return;
    }

    // Move step-by-step
    let currentStep = token.position;
    const finalStep = token.position + roll;
    let countedSteps = 0;

    stepIntervalRef.current = setInterval(() => {
      currentStep++;
      countedSteps++;
      setClassicTokens(prev => prev.map(t => t.id === token.id ? { ...t, position: currentStep } : t));
      ludoAudio.playMove();
      setEventLog(`${currentPlayer.name}: ঘুঁটি #${(token.id % 4) + 1} চলছে (${countedSteps}/${roll} ঘর) ➔ ঘর ${currentStep}`);

      if (currentStep >= finalStep) {
        if (stepIntervalRef.current) {
          clearInterval(stepIntervalRef.current);
          stepIntervalRef.current = null;
        }
        isMovingRef.current = false;
        setIsMovingStep(false);

        const hasFinished = finalStep >= maxSteps;
        if (hasFinished) {
          ludoAudio.playSpawn();
          extraTurn = true;
          setEventLog(`🎉 ${currentPlayer.name}-এর ঘুঁটি সফলভাবে হোমে পৌঁছেছে!`);
        }

        let updatedTokens = classicTokensRef.current.map(t => {
          if (t.id === token.id) {
            return { ...t, position: finalStep, hasFinished };
          }
          return t;
        });

        // Capture check (Universal for 2 to 6 players)
        if (finalStep >= 0 && finalStep < trackLen) {
          const myPIdx = playersRef.current.findIndex(p => p.id === currentPlayer.id);
          const myOffset = totalPlayers <= 4 ? (START_OFFSETS_4[currentPlayer.color] || 0) : (myPIdx * 10);
          const myAbsSquare = (myOffset + finalStep) % trackLen;

          const isSafe = totalPlayers <= 4
            ? SAFE_SPOTS_4.has(myAbsSquare)
            : (myAbsSquare % 10 === 0 || myAbsSquare % 10 === 5);

          if (!isSafe) {
            const captured = updatedTokens.find(t => {
              if (t.playerId === currentPlayer.id || t.hasFinished || t.position < 0 || t.position >= trackLen) return false;
              const oppIdx = playersRef.current.findIndex(p => p.id === t.playerId);
              const oppOffset = totalPlayers <= 4 ? (START_OFFSETS_4[playersRef.current[oppIdx]?.color || 'red'] || 0) : (oppIdx * 10);
              const oppAbsSquare = (oppOffset + t.position) % trackLen;
              return oppAbsSquare === myAbsSquare;
            });

            if (captured) {
              ludoAudio.playCapture();
              extraTurn = true;
              setEventLog(`⚔️ ${currentPlayer.name} বিপক্ষের ঘুঁটি কেটে দিয়েছেন! বাড়তি চাল পাচ্ছেন`);
              updatedTokens = updatedTokens.map(t => t.id === captured.id ? { ...t, position: -1 } : t);
            }
          }
        }

        classicTokensRef.current = updatedTokens;
        setClassicTokens(updatedTokens);

        // Victory check
        const myFinishedCount = updatedTokens.filter(t => t.playerId === currentPlayer.id && t.hasFinished).length;
        if (myFinishedCount === 4) {
          ludoAudio.playVictory();
          setWinner(currentPlayer);
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
          return;
        }

        turnAdvanceTimerRef.current = setTimeout(() => nextTurn(extraTurn), 650);
      }
    }, 150);
  };

  // -------------------------------------------------------------
  // Classic Ludo: Options Analysis & Smart AI Execution
  // -------------------------------------------------------------
  const handleClassicAfterRoll = (roll: number, player: LudoPlayer) => {
    const currentTokens = classicTokensRef.current;
    const myTokens = currentTokens.filter(t => t.playerId === player.id && !t.hasFinished);
    const movable = new Set<number>();
    const totalPlayers = playersRef.current.length;
    const maxSteps = getMaxSteps(totalPlayers);
    const trackLen = getTrackLength(totalPlayers);

    myTokens.forEach(t => {
      if (t.position === -1) {
        if (roll === 6) movable.add(t.id);
      } else if (t.position + roll <= maxSteps) {
        movable.add(t.id);
      }
    });

    setMovableTokenIds(movable);
    movableTokenIdsRef.current = movable;

    if (movable.size === 0) {
      setEventLog(`${player.name} কোনো ঘুঁটি সরাতে পারছেন না (পড়েছে: ${roll})`);
      turnAdvanceTimerRef.current = setTimeout(() => nextTurn(false), 1200);
      return;
    }

    if (player.isAi) {
      // ----------------------------------------------------------
      // SMART AI DECISION LOGIC: Select the best possible move
      // ----------------------------------------------------------
      setEventLog(`🤖 ${player.name} ঘুঁটি চালছে... (পড়েছে: ${roll})`);

      aiMoveTimerRef.current = setTimeout(() => {
        const myPIdx = playersRef.current.findIndex(p => p.id === player.id);
        const myOffset = totalPlayers <= 4 ? (START_OFFSETS_4[player.color] || 0) : (myPIdx * 10);
        const movableList = myTokens.filter(t => movable.has(t.id));

        let bestToken: ClassicToken | null = null;
        let bestScore = -999;

        for (const tok of movableList) {
          let score = 0;

          // Priority 1: Exit yard on 6
          if (tok.position === -1 && roll === 6) {
            score = 70;
          } else {
            const nextPos = tok.position + roll;

            // Priority 2: Reaching home
            if (nextPos >= maxSteps) {
              score = 100;
            } else if (nextPos < trackLen) {
              // Priority 3: Capturing opponent on track
              const nextAbsSquare = (myOffset + nextPos) % trackLen;
              const isSafe = totalPlayers <= 4
                ? SAFE_SPOTS_4.has(nextAbsSquare)
                : (nextAbsSquare % 10 === 0 || nextAbsSquare % 10 === 5);

              if (!isSafe) {
                const canCapture = currentTokens.some(other => {
                  if (other.playerId === player.id || other.hasFinished || other.position < 0 || other.position >= trackLen) return false;
                  const oppIdx = playersRef.current.findIndex(p => p.id === other.playerId);
                  const oppOffset = totalPlayers <= 4 ? (START_OFFSETS_4[playersRef.current[oppIdx]?.color || 'red'] || 0) : (oppIdx * 10);
                  const oppAbsSquare = (oppOffset + other.position) % trackLen;
                  return oppAbsSquare === nextAbsSquare;
                });

                if (canCapture) {
                  score = 120; // Maximum priority!
                }
              }

              // Priority 4: Reaching safe spot
              if (isSafe) {
                score += 30;
              }

              // Priority 5: Advance furthest token
              score += nextPos;
            } else {
              // Safe inside home column
              score += 40 + nextPos;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestToken = tok;
          }
        }

        const chosen = bestToken || movableList[0];
        if (chosen) {
          executeClassicStepMovement(chosen, roll);
        } else {
          nextTurn(roll === 6);
        }
      }, 700);
    } else {
      // Human turn: Waits completely for human to tap a highlighted token!
      setEventLog(`👤 আপনার পড়েছে: ${roll} ঘর! বোর্ডের যেকোনো একটি ঘুঁটিতে ট্যাপ করুন`);
    }
  };

  // -------------------------------------------------------------
  // Universal Dice Roll Core (Protected by isRollingRef Mutex)
  // -------------------------------------------------------------
  const rollDiceCore = (isFromAi = false) => {
    if (!isPlayingRef.current || isRollingRef.current || isMovingRef.current || winner) return;

    const currentPlayers = playersRef.current;
    const currentPlayer = currentPlayers[activePlayerIndexRef.current] || activePlayer;

    // Disallow human clicks during AI turn
    if (!isFromAi && currentPlayer.isAi) return;

    isRollingRef.current = true;
    setIsRolling(true);
    ludoAudio.playDiceRoll();

    turnAdvanceTimerRef.current = setTimeout(() => {
      isRollingRef.current = false;
      setIsRolling(false);
      setHasRolled(true);

      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);

      if (gameMode === 'snakes') {
        handleSnakesAfterRoll(roll, currentPlayer);
      } else {
        handleClassicAfterRoll(roll, currentPlayer);
      }
    }, 650);
  };

  // Human player token click handler
  const handleHumanTokenClick = (token: ClassicToken) => {
    if (isMovingRef.current || !hasRolled || !diceValue) return;
    const currentPlayer = playersRef.current[activePlayerIndexRef.current] || activePlayer;
    if (currentPlayer.isAi) return; // Disallow during AI turn
    if (token.playerId !== currentPlayer.id) return;
    if (!movableTokenIdsRef.current.has(token.id)) return;

    executeClassicStepMovement(token, diceValue);
  };

  // Start new game
  const handleStartGame = () => {
    clearAllTimers();
    isRollingRef.current = false;
    isMovingRef.current = false;

    setIsPlaying(true);
    isPlayingRef.current = true;
    activePlayerIndexRef.current = 0;
    setActivePlayerIndex(0);
    setDiceValue(null);
    setHasRolled(false);
    setIsMovingStep(false);
    setPendingHumanMove(false);
    setTargetTile(null);
    setWinner(null);
    setLastClimbOrBite(null);

    const firstPlayer = players[0] || { name: 'খেলোয়াড় ১', isAi: false };

    if (gameMode === 'classic') {
      const initialTokens: ClassicToken[] = [];
      players.forEach(p => {
        for (let t = 0; t < 4; t++) {
          initialTokens.push({
            id: initialTokens.length,
            playerId: p.id,
            position: -1, // in yard
            hasFinished: false,
          });
        }
      });
      classicTokensRef.current = initialTokens;
      setClassicTokens(initialTokens);
    } else {
      const initialPos: Record<string, number> = {};
      players.forEach(p => {
        initialPos[p.id] = 1;
      });
      snakePositionsRef.current = initialPos;
      setSnakePositions(initialPos);
    }

    if (firstPlayer.isAi) {
      setEventLog(`🤖 ${firstPlayer.name}-এর চাল! রোবট চাল দিচ্ছে...`);
      aiRollTimerRef.current = setTimeout(() => {
        rollDiceCore(true);
      }, 900);
    } else {
      setEventLog(`👤 ${firstPlayer.name}-এর চাল! ৩ডি ছক্কায় ট্যাপ করুন`);
    }
  };

  // ----------------------------------------------------
  // ----------------------------------------------------
  // View 1: Setup & Player Configuration
  // ----------------------------------------------------
  if (!isPlaying) {
    return (
      <div className="w-full max-w-[460px] mx-auto select-none px-2 pb-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToHub}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1A3636] hover:text-[#40534C] bg-white px-3.5 py-1.5 rounded-full border border-[#D6BD98]/60 shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>গেম মেনুতে ফিরুন</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-full bg-white border border-[#D6BD98]/60 text-stone-700 hover:text-stone-900 shadow-xs"
            title={isMuted ? 'সাউন্ড চালু করুন' : 'মিউট করুন'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1A3636] to-[#2D5A5A] text-amber-300 mx-auto flex items-center justify-center text-3xl shadow-lg mb-2 border border-amber-400/40">
            🎲
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636]">
            ফ্যামিলি লুডু
          </h2>
          <p className="text-xs text-[#40534C] mt-1 max-w-sm mx-auto">
            বাস্তব শারীরিক বোর্ডের মতো আনন্দ নিয়ে পরিবার বা বন্ধুদের সাথে খেলুন
          </p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white p-3.5 rounded-3xl border border-[#D6BD98]/70 shadow-xs mb-4">
          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2 text-center">
            গেমের ধরণ নির্বাচন করুন
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setGameMode('classic')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                gameMode === 'classic'
                  ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-400/30'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}
            >
              <span className="text-2xl mb-1">🎲</span>
              <span className="font-serif font-bold text-sm text-[#1A3636]">আসল লুডু</span>
              <span className="text-[10px] text-stone-500 mt-0.5 text-center">বাস্তব ৪-প্লেয়ার বোর্ড (২-৬ জন)</span>
            </button>

            <button
              onClick={() => setGameMode('snakes')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                gameMode === 'snakes'
                  ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-400/30'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}
            >
              <span className="text-2xl mb-1">🐍</span>
              <span className="font-serif font-bold text-sm text-[#1A3636]">সাপ লুডু</span>
              <span className="text-[10px] text-stone-500 mt-0.5 text-center">১-১০০ বাস্তব সাপ ও কাঠের মই</span>
            </button>
          </div>
        </div>

        {/* Player Count */}
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#D6BD98]/70 shadow-xs mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>খেলোয়াড় সংখ্যা:</span>
            </label>
            <span className="text-[11px] font-bold text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              {playerCount <= 4 ? `${playerCount} জন (আসল ৪-প্লেয়ার বোর্ড)` : `${playerCount} জন (বর্ধিত বোর্ড)`}
            </span>
          </div>

          <div className="flex gap-1.5 justify-center mb-3">
            {[2, 3, 4, 5, 6].map(count => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  playerCount === count
                    ? 'bg-[#1A3636] text-white border-[#1A3636] shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {count} জন
              </button>
            ))}
          </div>

          {/* Quick Player Slot Settings */}
          <div className="flex flex-col gap-2 max-h-[34vh] overflow-y-auto pr-1">
            {players.map((p, idx) => {
              const config = COLOR_CONFIGS[p.color] || COLOR_CONFIGS.red;
              return (
                <div
                  key={p.id}
                  className="p-2 sm:p-2.5 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-2 sm:gap-3"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-4 h-4 rounded-full shrink-0 shadow-2xs ring-1 ring-white" style={{ backgroundColor: config.hex }} />
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setPlayers(prev => prev.map((pl, i) => i === idx ? { ...pl, name: newName } : pl));
                      }}
                      className="text-xs font-bold bg-white px-2.5 py-1 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full max-w-[190px]"
                    />
                  </div>

                  {/* Human vs Computer AI Toggle */}
                  <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-xl border border-stone-200">
                    <button
                      onClick={() => {
                        setPlayers(prev => prev.map((pl, i) => i === idx ? { ...pl, isAi: false } : pl));
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        !p.isAi ? 'bg-amber-400 text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>মানব (Human)</span>
                    </button>
                    <button
                      onClick={() => {
                        setPlayers(prev => prev.map((pl, i) => i === idx ? { ...pl, isAi: true } : pl));
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        p.isAi ? 'bg-[#1A3636] text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Bot className="w-3 h-3" />
                      <span>রোবট (AI)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartGame}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1A3636] via-[#2A4D4D] to-[#1A3636] text-amber-200 font-serif font-bold text-base sm:text-lg border border-amber-400/50 shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:border-amber-300"
        >
          <Play className="w-5 h-5 fill-amber-300 text-amber-300" />
          <span>খেলা শুরু করুন</span>
        </motion.button>
      </div>
    );
  }

  // ----------------------------------------------------
  // View 2: Live Game Screen
  // ----------------------------------------------------
  const activeColorConfig = COLOR_CONFIGS[activePlayer.color] || COLOR_CONFIGS.red;

  return (
    <div className="w-full max-w-[430px] sm:max-w-[480px] mx-auto flex flex-col items-center select-none px-1.5 pb-6">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-2 px-0.5">
        <button
          onClick={() => setIsPlaying(false)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3636] bg-white px-3 py-1 rounded-full border border-[#D6BD98]/60 shadow-2xs hover:bg-stone-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>সেটিংস / বন্ধ</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-serif font-bold px-2.5 py-0.5 bg-amber-100 text-amber-950 rounded-full border border-amber-300 shadow-2xs">
            {gameMode === 'classic' ? '🎲 আসল লুডু' : '🐍 সাপ লুডু'}
          </span>
          <button
            onClick={handleToggleMute}
            className="p-1 rounded-full bg-white border border-[#D6BD98]/60 text-stone-700 shadow-2xs hover:bg-stone-50 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Turn Banner with Integrated 3D Cube Dice (Compact, zero overflow) */}
      <div className="w-full mb-2.5 p-2 sm:p-2.5 rounded-2xl bg-white border border-[#D6BD98]/80 shadow-md flex items-center justify-between gap-2 relative overflow-hidden">
        {/* Glow indicator based on active player's color */}
        <div
          className="absolute -top-10 -left-10 w-24 h-24 rounded-full blur-xl opacity-25 pointer-events-none"
          style={{ backgroundColor: activeColorConfig.hex }}
        />

        <div className="flex items-center gap-2 relative z-10 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ring-1 ring-white shrink-0"
            style={{ backgroundColor: activeColorConfig.hex }}
          >
            {activePlayer.name ? activePlayer.name.slice(0, 1) : '১'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1A3636] truncate max-w-[120px] sm:max-w-[160px]">
                {activePlayer.name}
              </h4>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                activePlayer.isAi ? 'bg-stone-100 text-stone-600 border border-stone-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {activePlayer.isAi ? '🤖 রোবট' : '👤 আপনি'}
              </span>
              {diceValue && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 shadow-2xs font-mono shrink-0">
                  {diceValue} ঘর
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-600 truncate mt-0.5 font-medium">
              {eventLog}
            </p>
          </div>
        </div>

        {/* Real 3D Cube Dice Controller */}
        <div className="shrink-0 relative z-10 pl-1">
          <ThreeDDice
            value={diceValue}
            isRolling={isRolling}
            onRoll={() => rollDiceCore(false)}
            disabled={!isHumanTurn || hasRolled || isMovingStep || pendingHumanMove || isRolling}
            size={46}
          />
        </div>
      </div>

      {/* Board Rendering */}
      {gameMode === 'classic' ? (
        <ClassicLudoBoard
          players={players}
          tokens={classicTokens}
          activePlayer={activePlayer}
          diceValue={diceValue}
          canMove={hasRolled && !isMovingStep && isHumanTurn}
          onTokenClick={handleHumanTokenClick}
          movableTokenIds={movableTokenIds}
        />
      ) : (
        <SnakesLaddersBoard
          players={players}
          positions={snakePositions}
          activePlayer={activePlayer}
          lastClimbOrBite={lastClimbOrBite}
          diceValue={diceValue}
          pendingHumanMove={pendingHumanMove && isHumanTurn}
          onHumanMoveClick={handleHumanSnakesMoveClick}
          targetTile={targetTile}
        />
      )}

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-amber-400 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-200 border-2 border-amber-500 mx-auto flex items-center justify-center text-3xl shadow-lg mb-3">
                🏆
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1A3636] mb-1">
                অভিনন্দন!
              </h3>
              <p className="text-base font-bold text-amber-700 mb-2">
                {winner.name} বিজয়ী হয়েছেন!
              </p>
              <p className="text-xs text-stone-500 mb-6">
                {gameMode === 'classic' ? '৪টি ঘুঁটি সফলভাবে হোমে পৌঁছেছেন।' : '১০০তম ঘরে সবার আগে পৌঁছে জয় অর্জন করেছেন।'}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleStartGame}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
                >
                  আবার খেলুন
                </button>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  সেটিংস পরিবর্তন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
