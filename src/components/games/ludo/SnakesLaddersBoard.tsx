import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LudoPlayer, SNAKES_AND_LADDERS, COLOR_CONFIGS, SnakeOrLadder } from './types';

interface SnakesLaddersBoardProps {
  players: LudoPlayer[];
  positions: Record<string, number>; // playerId -> 1..100
  activePlayer: LudoPlayer;
  lastClimbOrBite: { text: string; type: 'snake' | 'ladder'; item?: SnakeOrLadder } | null;
  diceValue?: number | null;
  pendingHumanMove?: boolean;
  onHumanMoveClick?: () => void;
  targetTile?: number | null;
}

// Convert tile number (1..100) to percentage coordinates on board (0..100%)
export function getTileCenter(tileNum: number): { x: number; y: number } {
  const clamped = Math.max(1, Math.min(100, tileNum));
  const row = Math.floor((clamped - 1) / 10); // 0 (bottom) to 9 (top)
  const rem = (clamped - 1) % 10;
  // Boustrophedon: row 0 left-to-right (0..9), row 1 right-to-left (9..0)
  const col = row % 2 === 0 ? rem : 9 - rem;

  const x = (col + 0.5) * 10; // 5% to 95%
  const y = ((9 - row) + 0.5) * 10; // 5% to 95%
  return { x, y };
}

export const SnakesLaddersBoard: React.FC<SnakesLaddersBoardProps> = ({
  players,
  positions,
  activePlayer,
  lastClimbOrBite,
  diceValue,
  pendingHumanMove,
  onHumanMoveClick,
  targetTile,
}) => {
  // Boustrophedon rows for tiles rendering
  const rows: number[][] = [];
  for (let r = 9; r >= 0; r--) {
    const start = r * 10 + 1;
    const end = start + 9;
    const rowNums: number[] = [];
    for (let n = start; n <= end; n++) {
      rowNums.push(n);
    }
    if (r % 2 === 1) {
      rowNums.reverse();
    }
    rows.push(rowNums);
  }

  // Active bite or climb cinematic trigger
  const [showCinematic, setShowCinematic] = useState<boolean>(false);

  useEffect(() => {
    if (lastClimbOrBite) {
      setShowCinematic(true);
      const timer = setTimeout(() => setShowCinematic(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [lastClimbOrBite]);

  const ladders = SNAKES_AND_LADDERS.filter(s => s.type === 'ladder');
  const snakes = SNAKES_AND_LADDERS.filter(s => s.type === 'snake');

  return (
    <div className="w-full max-w-[430px] sm:max-w-[480px] mx-auto bg-gradient-to-b from-[#F7F3EA] to-[#EFE8DA] p-2 sm:p-3 rounded-3xl border-2 border-[#D6BD98] shadow-2xl select-none relative">
      
      {/* Dramatic Cinematic Snake Bite / Ladder Climb Animation Modal */}
      <AnimatePresence>
        {showCinematic && lastClimbOrBite && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-50 rounded-3xl bg-stone-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center shadow-2xl overflow-hidden"
          >
            {lastClimbOrBite.type === 'snake' ? (
              <div className="flex flex-col items-center">
                {/* Animated Striking Realistic Snake */}
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1.15],
                    rotate: [0, -10, 8, -4, 0],
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="relative mb-3 flex items-center justify-center"
                >
                  {/* Glowing snake aura */}
                  <div className="absolute inset-0 bg-rose-600/30 blur-xl rounded-full scale-150 animate-pulse" />
                  <span className="text-6xl sm:text-7xl filter drop-shadow-[0_4px_16px_rgba(225,29,72,0.8)]">
                    🐍
                  </span>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white uppercase tracking-wider shadow-md mb-2 inline-block">
                    সাপের ছোবল! ⚡
                  </span>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-rose-200 mt-1 max-w-xs leading-snug">
                    {lastClimbOrBite.text}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 italic">
                    সাপের লেজ বেয়ে নিচে নেমে গেল ঘুঁটি!
                  </p>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Animated Golden Ascension Ladder */}
                <motion.div
                  animate={{
                    y: [10, -10, 0],
                    scale: [0.9, 1.15, 1],
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="relative mb-3 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-amber-400/30 blur-xl rounded-full scale-150 animate-pulse" />
                  <span className="text-6xl sm:text-7xl filter drop-shadow-[0_4px_16px_rgba(217,119,6,0.8)]">
                    🪜
                  </span>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white uppercase tracking-wider shadow-md mb-2 inline-block">
                    পারিবারিক মই বেয়ে আরোহণ! ✨
                  </span>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-amber-200 mt-1 max-w-xs leading-snug">
                    {lastClimbOrBite.text}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 italic">
                    মইয়ের প্রতিটি ধাপে রয়েছে পরিবারের সুশিক্ষা ও দোয়া!
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prominent Human Move Action Banner (Ensures Human explicitly triggers move) */}
      {pendingHumanMove && targetTile && diceValue && (
        <motion.button
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: [1, 1.025, 1], opacity: 1 }}
          transition={{ scale: { repeat: Infinity, duration: 1.2 } }}
          onClick={onHumanMoveClick}
          className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-stone-950 font-bold border-2 border-amber-500 shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏃</span>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-extrabold block">
                ঘুঁটি {diceValue} ঘর এগিয়ে নিন!
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-950/80 font-mono">
                ঘর {positions[activePlayer.id] || 1} ➔ ঘর {targetTile} (+{diceValue} ঘর চাল)
              </span>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-stone-950 text-amber-300 rounded-xl text-xs font-bold shadow-xs">
            ট্যাপ করুন ➔
          </span>
        </motion.button>
      )}

      {/* Main 100-tile Board Canvas with SVG Overlay */}
      <div className="relative aspect-square w-full rounded-2xl bg-[#FFFDF9] border-2 border-stone-800 shadow-inner overflow-hidden">
        
        {/* 1. Underlying 10x10 Grid Tiles */}
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
          {rows.flat().map((num) => {
            const isWinning = num === 100;
            const isStart = num === 1;
            const isEven = (Math.floor((num - 1) / 10) + ((num - 1) % 10)) % 2 === 0;
            const isTarget = targetTile === num;

            return (
              <div
                key={num}
                className={`relative border border-stone-300/60 p-0.5 flex flex-col justify-between items-start transition-colors ${
                  isWinning
                    ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 text-stone-950 font-bold'
                    : isStart
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : isTarget
                    ? 'bg-amber-100 border-2 border-amber-500 shadow-xs ring-1 ring-amber-400'
                    : isEven
                    ? 'bg-[#FDF9F2]'
                    : 'bg-white'
                }`}
              >
                {/* Target tile badge */}
                {isTarget && (
                  <div className="absolute inset-0 bg-amber-400/25 animate-pulse flex items-center justify-center z-10 pointer-events-none">
                    <span className="text-[6px] sm:text-[8px] font-bold bg-amber-400 text-stone-950 px-1 rounded shadow-2xs">
                      লক্ষ্য (+{diceValue})
                    </span>
                  </div>
                )}

                {/* Tile Number in Bengali font / small clean numeral */}
                <span className={`text-[8px] sm:text-[10.5px] font-mono leading-none ${
                  isWinning ? 'text-amber-950 font-extrabold' : 'text-stone-600 font-semibold'
                }`}>
                  {num}
                </span>

                {isWinning && (
                  <div className="w-full text-center leading-none text-xs sm:text-sm">
                    🏆
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. Realistic SVG Snakes & Ladders Drawn Over Board */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Wooden Ladder Gradient */}
            <linearGradient id="ladderRail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5C2E0B" />
              <stop offset="50%" stopColor="#B87333" />
              <stop offset="100%" stopColor="#3E1A04" />
            </linearGradient>

            <linearGradient id="ladderRung" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D27D2D" />
              <stop offset="100%" stopColor="#8B4513" />
            </linearGradient>

            {/* Snake Body Gradients */}
            <linearGradient id="snakeGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="35%" stopColor="#10B981" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>

            <linearGradient id="snakeRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BE123C" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>

            <linearGradient id="snakePython" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* Soft Shadow Filter */}
            <filter id="boardDropShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0.6" dy="1.2" stdDeviation="0.8" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* REAL WOODEN LADDERS */}
          {ladders.map((ladder, idx) => {
            const startPt = getTileCenter(ladder.start);
            const endPt = getTileCenter(ladder.end);

            const dx = endPt.x - startPt.x;
            const dy = endPt.y - startPt.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) return null;

            // Normalized perpendicular vector
            const perpX = -dy / dist;
            const perpY = dx / dist;
            const railWidth = 1.3;

            // Rail Left coordinates
            const rx1_a = startPt.x + perpX * railWidth;
            const ry1_a = startPt.y + perpY * railWidth;
            const rx1_b = endPt.x + perpX * railWidth;
            const ry1_b = endPt.y + perpY * railWidth;

            // Rail Right coordinates
            const rx2_a = startPt.x - perpX * railWidth;
            const ry2_a = startPt.y - perpY * railWidth;
            const rx2_b = endPt.x - perpX * railWidth;
            const ry2_b = endPt.y - perpY * railWidth;

            // Rungs count based on distance
            const numRungs = Math.max(3, Math.floor(dist / 3.8));
            const rungs = [];
            for (let i = 1; i <= numRungs; i++) {
              const t = i / (numRungs + 1);
              const px1 = rx1_a + (rx1_b - rx1_a) * t;
              const py1 = ry1_a + (ry1_b - ry1_a) * t;
              const px2 = rx2_a + (rx2_b - rx2_a) * t;
              const py2 = ry2_a + (ry2_b - ry2_a) * t;
              rungs.push({ x1: px1, y1: py1, x2: px2, y2: py2 });
            }

            return (
              <g key={`ladder_${idx}`} filter="url(#boardDropShadow)">
                {/* Left Rail */}
                <line
                  x1={rx1_a}
                  y1={ry1_a}
                  x2={rx1_b}
                  y2={ry1_b}
                  stroke="url(#ladderRail)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Right Rail */}
                <line
                  x1={rx2_a}
                  y1={ry2_a}
                  x2={rx2_b}
                  y2={ry2_b}
                  stroke="url(#ladderRail)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Wood Rungs */}
                {rungs.map((r, rIdx) => (
                  <line
                    key={rIdx}
                    x1={r.x1}
                    y1={r.y1}
                    x2={r.x2}
                    y2={r.y2}
                    stroke="url(#ladderRung)"
                    strokeWidth="1.1"
                    strokeLinecap="square"
                  />
                ))}
                {/* Gold start and end star accents */}
                <circle cx={startPt.x} cy={startPt.y} r="0.9" fill="#F59E0B" />
                <circle cx={endPt.x} cy={endPt.y} r="0.9" fill="#10B981" />
              </g>
            );
          })}

          {/* REAL ORGANIC COILED SNAKES */}
          {snakes.map((snake, idx) => {
            // Head is at start (higher number), Tail is at end (lower number)
            const headPt = getTileCenter(snake.start);
            const tailPt = getTileCenter(snake.end);

            const dx = tailPt.x - headPt.x;
            const dy = tailPt.y - headPt.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) return null;

            // Generate snake S-curves
            const perpX = -dy / dist;
            const perpY = dx / dist;

            // Alternate wave side
            const waveAmp = Math.min(10, Math.max(4, dist * 0.22));
            const sign = idx % 2 === 0 ? 1 : -1;

            const c1x = headPt.x + dx * 0.3 + perpX * waveAmp * sign;
            const c1y = headPt.y + dy * 0.3 + perpY * waveAmp * sign;

            const c2x = headPt.x + dx * 0.7 - perpX * waveAmp * sign;
            const c2y = headPt.y + dy * 0.7 - perpY * waveAmp * sign;

            const snakeGrad = idx % 3 === 0 ? 'url(#snakeRed)' : idx % 3 === 1 ? 'url(#snakeGreen)' : 'url(#snakePython)';
            const pathD = `M ${headPt.x} ${headPt.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tailPt.x} ${tailPt.y}`;

            // Calculate angle for snake head
            const angleDeg = (Math.atan2(c1y - headPt.y, c1x - headPt.x) * 180) / Math.PI;

            return (
              <g key={`snake_${idx}`} filter="url(#boardDropShadow)">
                {/* Snake Body Thickness Stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={snakeGrad}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Snake Belly Pattern Highlight */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FEF08A"
                  strokeWidth="0.7"
                  strokeDasharray="1.2 1.8"
                  opacity="0.85"
                />

                {/* Snake Tail (curled tip) */}
                <circle cx={tailPt.x} cy={tailPt.y} r="0.8" fill="#B45309" />

                {/* Snake Head with glowing reptilian eyes and forked tongue */}
                <g transform={`translate(${headPt.x}, ${headPt.y}) rotate(${angleDeg - 180})`}>
                  {/* Forked red tongue */}
                  <path
                    d="M 2.4 0 L 4.0 -0.8 M 2.4 0 L 4.0 0.8"
                    stroke="#EF4444"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                  />
                  {/* Viper Head */}
                  <ellipse cx="0" cy="0" rx="2.2" ry="1.6" fill={idx % 3 === 0 ? '#9F1239' : '#065F46'} />
                  {/* Eyes */}
                  <circle cx="-0.4" cy="-0.9" r="0.55" fill="#FBBF24" />
                  <circle cx="-0.4" cy="0.9" r="0.55" fill="#FBBF24" />
                  <circle cx="-0.4" cy="-0.9" r="0.25" fill="#000000" />
                  <circle cx="-0.4" cy="0.9" r="0.25" fill="#000000" />
                </g>
              </g>
            );
          })}
        </svg>

        {/* 3. Player Tokens Rendered at Precise Coordinates */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {players.map((p, pIdx) => {
            const tileNum = positions[p.id] || 1;
            const pt = getTileCenter(tileNum);
            const isTurn = activePlayer?.id === p.id;
            const config = COLOR_CONFIGS[p.color] || COLOR_CONFIGS.red;

            // Offset tokens when multiple players occupy the same tile
            const playersOnSameTile = players.filter(other => (positions[other.id] || 1) === tileNum);
            const slotIndex = playersOnSameTile.findIndex(other => other.id === p.id);
            const count = playersOnSameTile.length;
            const offsetRadius = count > 1 ? 2.2 : 0;
            const offsetAngle = (slotIndex * (360 / Math.max(1, count))) * (Math.PI / 180);
            const finalX = pt.x + (count > 1 ? offsetRadius * Math.cos(offsetAngle) : 0);
            const finalY = pt.y + (count > 1 ? offsetRadius * Math.sin(offsetAngle) : 0);

            return (
              <motion.div
                key={p.id}
                initial={false}
                animate={{
                  left: `${finalX}%`,
                  top: `${finalY}%`,
                  scale: isTurn ? [1, 1.25, 1] : 1,
                }}
                transition={{
                  left: { type: 'spring', stiffness: 220, damping: 20 },
                  top: { type: 'spring', stiffness: 220, damping: 20 },
                  scale: isTurn ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 },
                }}
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-auto"
              >
                <div
                  title={`${p.name || `খেলোয়াড় ${pIdx + 1}`} (ঘর ${tileNum})`}
                  className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[8px] sm:text-[10px] text-white shadow-md border-2 border-white transition-transform ${
                    isTurn ? 'ring-2 ring-amber-400 ring-offset-1 z-30' : 'z-20'
                  }`}
                  style={{ backgroundColor: config.hex }}
                >
                  {p.name ? p.name.slice(0, 1) : String(pIdx + 1)}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Players Progress Summary Strip */}
      <div className="mt-3 p-2.5 sm:p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
          <span>খেলোয়াড়দের অবস্থান (১ থেকে ১০০)</span>
          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ১০০-তে পৌঁছালেই জয়! 🏆
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {players.map((p, idx) => {
            const pos = positions[p.id] || 1;
            const config = COLOR_CONFIGS[p.color] || COLOR_CONFIGS.red;
            const isTurn = activePlayer?.id === p.id;

            return (
              <div
                key={p.id}
                className={`p-1.5 sm:p-2 rounded-xl border flex items-center justify-between transition-all ${
                  isTurn ? 'border-amber-400 bg-amber-50/70 shadow-xs ring-1 ring-amber-400' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: config.hex }} />
                  <span className="text-[11px] sm:text-xs font-bold text-stone-800 truncate max-w-[70px]">
                    {p.name || `খেলোয়াড় ${idx + 1}`}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] sm:text-xs font-bold font-mono text-stone-900 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                    {pos}/100
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
