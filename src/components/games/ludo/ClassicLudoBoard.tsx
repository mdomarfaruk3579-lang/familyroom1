import React from 'react';
import { motion } from 'framer-motion';
import { LudoPlayer, ClassicToken, PlayerColor, COLOR_CONFIGS } from './types';

interface ClassicLudoBoardProps {
  players: LudoPlayer[];
  tokens: ClassicToken[];
  activePlayer: LudoPlayer;
  diceValue: number | null;
  canMove: boolean;
  onTokenClick: (token: ClassicToken) => void;
  movableTokenIds: Set<number>;
}

// ----------------------------------------------------------------------
// 1. Standard 15x15 Ludo Track Coordinates (4 Players)
// ----------------------------------------------------------------------
export const TRACK_COORDINATES_4: Array<{ col: number; row: number }> = [
  { col: 1, row: 6 },  // 0: Red Start
  { col: 2, row: 6 },  // 1
  { col: 3, row: 6 },  // 2
  { col: 4, row: 6 },  // 3
  { col: 5, row: 6 },  // 4
  { col: 6, row: 5 },  // 5
  { col: 6, row: 4 },  // 6
  { col: 6, row: 3 },  // 7
  { col: 6, row: 2 },  // 8: Safe Spot (Star)
  { col: 6, row: 1 },  // 9
  { col: 6, row: 0 },  // 10
  { col: 7, row: 0 },  // 11
  { col: 8, row: 0 },  // 12
  { col: 8, row: 1 },  // 13: Green Start
  { col: 8, row: 2 },  // 14
  { col: 8, row: 3 },  // 15
  { col: 8, row: 4 },  // 16
  { col: 8, row: 5 },  // 17
  { col: 9, row: 6 },  // 18
  { col: 10, row: 6 }, // 19
  { col: 11, row: 6 }, // 20
  { col: 12, row: 6 }, // 21: Safe Spot (Star)
  { col: 13, row: 6 }, // 22
  { col: 14, row: 6 }, // 23
  { col: 14, row: 7 }, // 24
  { col: 14, row: 8 }, // 25
  { col: 13, row: 8 }, // 26: Yellow Start
  { col: 12, row: 8 }, // 27
  { col: 11, row: 8 }, // 28
  { col: 10, row: 8 }, // 29
  { col: 9, row: 8 },  // 30
  { col: 8, row: 9 },  // 31
  { col: 8, row: 10 }, // 32
  { col: 8, row: 11 }, // 33
  { col: 8, row: 12 }, // 34: Safe Spot (Star)
  { col: 8, row: 13 }, // 35
  { col: 8, row: 14 }, // 36
  { col: 7, row: 14 }, // 37
  { col: 6, row: 14 }, // 38
  { col: 6, row: 13 }, // 39: Blue Start
  { col: 6, row: 12 }, // 40
  { col: 6, row: 11 }, // 41
  { col: 6, row: 10 }, // 42
  { col: 6, row: 9 },  // 43
  { col: 5, row: 8 },  // 44
  { col: 4, row: 8 },  // 45
  { col: 3, row: 8 },  // 46
  { col: 2, row: 8 },  // 47: Safe Spot (Star)
  { col: 1, row: 8 },  // 48
  { col: 0, row: 8 },  // 49
  { col: 0, row: 7 },  // 50
  { col: 0, row: 6 },  // 51
];

export const HOME_COLUMNS_4: Record<string, Array<{ col: number; row: number }>> = {
  red: [
    { col: 1, row: 7 },
    { col: 2, row: 7 },
    { col: 3, row: 7 },
    { col: 4, row: 7 },
    { col: 5, row: 7 },
  ],
  green: [
    { col: 7, row: 1 },
    { col: 7, row: 2 },
    { col: 7, row: 3 },
    { col: 7, row: 4 },
    { col: 7, row: 5 },
  ],
  yellow: [
    { col: 13, row: 7 },
    { col: 12, row: 7 },
    { col: 11, row: 7 },
    { col: 10, row: 7 },
    { col: 9, row: 7 },
  ],
  blue: [
    { col: 7, row: 13 },
    { col: 7, row: 12 },
    { col: 7, row: 11 },
    { col: 7, row: 10 },
    { col: 7, row: 9 },
  ],
};

export const SAFE_SPOTS_4 = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const START_OFFSETS_4: Record<string, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// ----------------------------------------------------------------------
// 2. 3D Realistic Pawn Component
// ----------------------------------------------------------------------
interface RealPawnProps {
  color: PlayerColor;
  isMovable: boolean;
  onClick?: () => void;
  label?: string | number;
  size?: 'sm' | 'md' | 'lg';
}

const RealPawn: React.FC<RealPawnProps> = ({
  color,
  isMovable,
  onClick,
  label,
  size = 'md',
}) => {
  const config = COLOR_CONFIGS[color] || COLOR_CONFIGS.red;
  const dims =
    size === 'sm'
      ? 'w-4 h-4 text-[8px]'
      : size === 'lg'
      ? 'w-7 h-7 sm:w-9 sm:h-9 text-xs'
      : 'w-5 h-5 sm:w-6 sm:h-6 text-[9px]';

  return (
    <motion.button
      type="button"
      whileHover={isMovable ? { scale: 1.18 } : undefined}
      whileTap={isMovable ? { scale: 0.9 } : undefined}
      onClick={isMovable ? onClick : undefined}
      disabled={!isMovable}
      className={`relative rounded-full flex items-center justify-center font-bold text-white transition-all select-none ${dims} ${
        isMovable
          ? 'ring-2 sm:ring-4 ring-amber-400 z-30 cursor-pointer animate-bounce shadow-lg scale-110'
          : 'cursor-default shadow-xs'
      }`}
      style={{
        background: `radial-gradient(circle at 35% 28%, ${config.lightHex} 0%, ${config.hex} 65%, ${config.darkHex} 100%)`,
        border: `1.5px solid ${config.darkHex}`,
        boxShadow: isMovable
          ? '0 0 12px rgba(245, 158, 11, 0.95), 0 3px 6px rgba(0,0,0,0.45)'
          : '0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      {/* 3D Specular Highlight */}
      <span className="absolute top-[8%] left-[18%] w-[35%] h-[35%] rounded-full bg-white/70 pointer-events-none blur-[0.3px]" />
      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
        {label || ''}
      </span>
    </motion.button>
  );
};

// ----------------------------------------------------------------------
// 3. Multi-Player (5 or 6 Players) Board Engine (SVG Track & Yards)
// ----------------------------------------------------------------------
// Real physical Hexagonal / Star Ludo board geometry with connected cells
function getMultiArmGeometry(playerCount: number) {
  const N = playerCount; // 5 or 6
  const center = { x: 500, y: 500 };
  const STEPS_PER_ARM = 10;
  const TOTAL_TRACK = N * STEPS_PER_ARM;

  // Arms angles
  const armAngles = Array.from({ length: N }).map((_, i) => (i * (2 * Math.PI / N) - Math.PI / 2));

  // 1. Yard Base centers
  const yardBases = armAngles.map((angle) => ({
    x: center.x + 380 * Math.cos(angle),
    y: center.y + 380 * Math.sin(angle),
  }));

  // 2. Home columns: 5 steps per arm leading into center
  const homeColumns = armAngles.map((angle) => {
    return [300, 255, 210, 165, 120].map((r) => ({
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    }));
  });

  // 3. Perimeter track cells (N * 10 cells)
  const trackCells: Array<{ x: number; y: number; isStart: boolean; isSafe: boolean; armIndex: number }> = [];

  for (let i = 0; i < N; i++) {
    const angleA = armAngles[i];
    const angleB = armAngles[(i + 1) % N];

    for (let s = 0; s < STEPS_PER_ARM; s++) {
      const frac = s / STEPS_PER_ARM;
      const angle = angleA + frac * (angleB - angleA);
      // Flank contour
      const r = s === 0 ? 300 : s <= 4 ? 330 : s <= 7 ? 350 : 310;
      const isStart = s === 0;
      const isSafe = s === 0 || s === 5;

      trackCells.push({
        x: center.x + r * Math.cos(angle),
        y: center.y + r * Math.sin(angle),
        isStart,
        isSafe,
        armIndex: i,
      });
    }
  }

  return { N, center, armAngles, yardBases, homeColumns, trackCells, TOTAL_TRACK };
}

// ----------------------------------------------------------------------
// 4. Main ClassicLudoBoard Component
// ----------------------------------------------------------------------
export const ClassicLudoBoard: React.FC<ClassicLudoBoardProps> = ({
  players,
  tokens,
  activePlayer,
  diceValue,
  canMove,
  onTokenClick,
  movableTokenIds,
}) => {
  const isMultiArm = players.length > 4;
  const isInteractive = canMove && !activePlayer.isAi;

  // --------------------------------------------------------------------
  // MULTI-PLAYER (5 or 6 PLAYERS) AUTHENTIC SVG BOARD
  // --------------------------------------------------------------------
  if (isMultiArm) {
    const geom = getMultiArmGeometry(players.length);

    // Map active tokens to locations on multi-arm board
    const cellTokensMap: Record<string, ClassicToken[]> = {};

    tokens.forEach(tok => {
      const pIdx = players.findIndex(p => p.id === tok.playerId);
      if (pIdx === -1) return;

      if (tok.position === -1) {
        // In Yard
        return;
      } else if (tok.position >= 0 && tok.position < geom.TOTAL_TRACK) {
        // Track cell
        const absIdx = (pIdx * 10 + tok.position) % geom.TOTAL_TRACK;
        const key = `track_${absIdx}`;
        cellTokensMap[key] = cellTokensMap[key] || [];
        cellTokensMap[key].push(tok);
      } else if (tok.position >= geom.TOTAL_TRACK && tok.position < geom.TOTAL_TRACK + 5) {
        // Home column
        const stepIdx = tok.position - geom.TOTAL_TRACK;
        const key = `home_${pIdx}_${stepIdx}`;
        cellTokensMap[key] = cellTokensMap[key] || [];
        cellTokensMap[key].push(tok);
      } else if (tok.position >= geom.TOTAL_TRACK + 5) {
        // Center Home
        const key = `center_${pIdx}`;
        cellTokensMap[key] = cellTokensMap[key] || [];
        cellTokensMap[key].push(tok);
      }
    });

    return (
      <div className="w-full max-w-[430px] sm:max-w-[480px] mx-auto select-none">
        {/* Wooden Bezel Frame */}
        <div className="bg-gradient-to-br from-[#2D1B10] via-[#3E2718] to-[#1E110A] p-2 sm:p-3 rounded-3xl border-2 sm:border-4 border-[#D6BD98] shadow-2xl">
          <div className="relative aspect-square w-full rounded-2xl bg-[#FFFDF8] border-2 border-stone-900 shadow-inner overflow-hidden">
            
            {/* SVG Real Multi-Player Track & Central Star */}
            <svg viewBox="0 0 1000 1000" className="w-full h-full">
              <defs>
                <filter id="pawnShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                </filter>
              </defs>

              {/* 1. Center Home Polygon with Colored Wedges */}
              {players.map((p, i) => {
                const angleA = geom.armAngles[i] - Math.PI / geom.N;
                const angleB = geom.armAngles[i] + Math.PI / geom.N;
                const r = 110;
                const x1 = 500 + r * Math.cos(angleA);
                const y1 = 500 + r * Math.sin(angleA);
                const x2 = 500 + r * Math.cos(angleB);
                const y2 = 500 + r * Math.sin(angleB);
                const config = COLOR_CONFIGS[p.color] || COLOR_CONFIGS.red;
                const doneTokens = cellTokensMap[`center_${i}`] || [];

                return (
                  <g key={`wedge_${p.id}`}>
                    <polygon
                      points={`500,500 ${x1},${y1} ${x2},${y2}`}
                      fill={config.hex}
                      stroke="#1C1917"
                      strokeWidth="2"
                    />
                    {/* Home Stars */}
                    {doneTokens.map((_, sIdx) => {
                      const starDist = 55 + sIdx * 12;
                      const sx = 500 + starDist * Math.cos(geom.armAngles[i]);
                      const sy = 500 + starDist * Math.sin(geom.armAngles[i]);
                      return (
                        <text
                          key={sIdx}
                          x={sx}
                          y={sy + 4}
                          fill="#FFF"
                          fontSize="14"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ★
                        </text>
                      );
                    })}
                  </g>
                );
              })}

              {/* Central Trophy Medallion */}
              <circle cx="500" cy="500" r="32" fill="#FBBF24" stroke="#B45309" strokeWidth="3" />
              <text x="500" y="508" fontSize="22" textAnchor="middle" fontWeight="bold">👑</text>

              {/* 2. Home Columns (5 cells per arm leading to center) */}
              {players.map((p, i) => {
                const config = COLOR_CONFIGS[p.color] || COLOR_CONFIGS.red;
                return geom.homeColumns[i].map((pt, sIdx) => {
                  const key = `home_${i}_${sIdx}`;
                  const cellTokens = cellTokensMap[key] || [];
                  const movableToken = isInteractive ? cellTokens.find(t => movableTokenIds.has(t.id) && t.playerId === activePlayer.id) : undefined;

                  return (
                    <g
                      key={key}
                      onClick={() => {
                        if (movableToken) onTokenClick(movableToken);
                      }}
                      className={movableToken ? 'cursor-pointer' : ''}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="18"
                        fill={config.hex}
                        stroke="#1C1917"
                        strokeWidth="1.5"
                      />
                      {/* Token on this Home Cell */}
                      {cellTokens.length > 0 && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="14"
                          fill={COLOR_CONFIGS[players.find(pl => pl.id === cellTokens[0].playerId)?.color || 'red'].hex}
                          stroke="#FFF"
                          strokeWidth="2"
                          className={movableToken ? 'animate-pulse' : ''}
                        />
                      )}
                    </g>
                  );
                });
              })}

              {/* 3. Perimeter Track Cells */}
              {geom.trackCells.map((pt, tIdx) => {
                const key = `track_${tIdx}`;
                const cellTokens = cellTokensMap[key] || [];
                const movableToken = isInteractive ? cellTokens.find(t => movableTokenIds.has(t.id) && t.playerId === activePlayer.id) : undefined;
                const armColor = players[pt.armIndex]?.color || 'red';
                const config = COLOR_CONFIGS[armColor];

                return (
                  <g
                    key={key}
                    onClick={() => {
                      if (movableToken) onTokenClick(movableToken);
                    }}
                    className={movableToken ? 'cursor-pointer' : ''}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="16"
                      fill={pt.isStart ? config.hex : '#FFFDF8'}
                      stroke={movableToken ? '#F59E0B' : '#292524'}
                      strokeWidth={movableToken ? '3.5' : '1.5'}
                    />
                    {/* Star or Arrow */}
                    {pt.isSafe && cellTokens.length === 0 && (
                      <text
                        x={pt.x}
                        y={pt.y + 4}
                        fill={pt.isStart ? '#FFF' : '#F59E0B'}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pt.isStart ? '➔' : '★'}
                      </text>
                    )}
                    {/* Token on Track */}
                    {cellTokens.length > 0 && (
                      <g filter="url(#pawnShadow)">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="13"
                          fill={COLOR_CONFIGS[players.find(pl => pl.id === cellTokens[0].playerId)?.color || 'red'].hex}
                          stroke="#FFF"
                          strokeWidth="2"
                          className={movableToken ? 'animate-bounce' : ''}
                        />
                        {cellTokens.length > 1 && (
                          <text x={pt.x + 8} y={pt.y - 6} fill="#000" fontSize="10" fontWeight="bold">
                            {cellTokens.length}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 4. Yard Bases (5 or 6 Players) */}
              {players.map((p, i) => {
                const b = geom.yardBases[i];
                const config = COLOR_CONFIGS[p.color] || COLOR_CONFIGS.red;
                const yardTokens = tokens.filter(t => t.playerId === p.id && t.position === -1);
                const isTurn = activePlayer.id === p.id;

                return (
                  <g key={`base_${p.id}`}>
                    {/* Outer Base Card */}
                    <rect
                      x={b.x - 55}
                      y={b.y - 40}
                      width="110"
                      height="80"
                      rx="14"
                      fill={config.hex}
                      stroke={isTurn ? '#FBBF24' : '#1C1917'}
                      strokeWidth={isTurn ? '3.5' : '2'}
                      filter="url(#pawnShadow)"
                    />
                    {/* Inner White Island */}
                    <rect
                      x={b.x - 48}
                      y={b.y - 33}
                      width="96"
                      height="54"
                      rx="10"
                      fill="#FFFDF8"
                    />
                    {/* Name */}
                    <text
                      x={b.x}
                      y={b.y + 32}
                      fill="#FFF"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.name.slice(0, 10)}
                    </text>

                    {/* 4 Pawn Pockets */}
                    {[
                      { dx: -24, dy: -10 },
                      { dx: 24, dy: -10 },
                      { dx: -24, dy: 10 },
                      { dx: 24, dy: 10 },
                    ].map((offset, slotIdx) => {
                      const tok = yardTokens[slotIdx];
                      const isMovable = isInteractive && tok ? movableTokenIds.has(tok.id) && tok.playerId === activePlayer.id : false;

                      return (
                        <g
                          key={slotIdx}
                          onClick={() => {
                            if (tok && isMovable) onTokenClick(tok);
                          }}
                          className={isMovable ? 'cursor-pointer' : ''}
                        >
                          <circle
                            cx={b.x + offset.dx}
                            cy={b.y + offset.dy}
                            r="10"
                            fill="#F5F5F4"
                            stroke={config.hex}
                            strokeWidth="1.2"
                          />
                          {tok && (
                            <circle
                              cx={b.x + offset.dx}
                              cy={b.y + offset.dy}
                              r="8"
                              fill={config.hex}
                              stroke="#FFF"
                              strokeWidth="1.5"
                              className={isMovable ? 'animate-bounce' : ''}
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Movable Tokens Quick Picker */}
        <div className="mt-2.5 p-2 bg-white rounded-2xl border border-amber-300 shadow-xs">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-xs font-bold text-stone-800 truncate">
              {activePlayer.isAi ? (
                <span className="text-indigo-600 font-bold">🤖 {activePlayer.name} (রোবট) চাল দিচ্ছে...</span>
              ) : (
                <span className="text-emerald-700 font-bold">👤 আপনার চাল! ঘুঁটিতে ট্যাপ করুন</span>
              )}
            </span>
            {diceValue && (
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-400 text-stone-950 font-mono">
                {diceValue} ঘর
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {tokens.filter(t => t.playerId === activePlayer.id).map((tok, idx) => {
              const isMovable = isInteractive && movableTokenIds.has(tok.id);
              const inYard = tok.position === -1;
              const isDone = tok.position >= geom.TOTAL_TRACK + 5;

              return (
                <button
                  key={tok.id}
                  disabled={!isMovable}
                  onClick={() => onTokenClick(tok)}
                  className={`p-1.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                    isMovable
                      ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400 cursor-pointer shadow-xs animate-pulse font-bold'
                      : 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="truncate">
                    ঘুঁটি {idx + 1}: {isDone ? 'হোমে 🏆' : inYard ? (isMovable ? 'মাঠে নামান (৬)' : 'ঘরে বন্দী') : `ঘর ${tok.position}`}
                  </span>
                  {isMovable && (
                    <span className="text-[9px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded font-bold">
                      ট্যাপ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // REAL AUTHENTIC 4-PLAYER CLASSIC LUDO BOARD (15x15 Grid)
  // --------------------------------------------------------------------
  const cellTokensMap: Record<string, ClassicToken[]> = {};

  tokens.forEach(tok => {
    const owner = players.find(p => p.id === tok.playerId);
    if (!owner) return;
    const color = owner.color;

    if (tok.position === -1) {
      return;
    } else if (tok.position >= 0 && tok.position <= 51) {
      const offset = START_OFFSETS_4[color] || 0;
      const absIdx = (offset + tok.position) % 52;
      const coord = TRACK_COORDINATES_4[absIdx];
      if (coord) {
        const key = `${coord.col}_${coord.row}`;
        cellTokensMap[key] = cellTokensMap[key] || [];
        cellTokensMap[key].push(tok);
      }
    } else if (tok.position >= 52 && tok.position <= 56) {
      const stepIdx = tok.position - 52;
      const homeCol = HOME_COLUMNS_4[color];
      const coord = homeCol ? homeCol[stepIdx] : null;
      if (coord) {
        const key = `${coord.col}_${coord.row}`;
        cellTokensMap[key] = cellTokensMap[key] || [];
        cellTokensMap[key].push(tok);
      }
    } else if (tok.position >= 57) {
      const key = `home_${color}`;
      cellTokensMap[key] = cellTokensMap[key] || [];
      cellTokensMap[key].push(tok);
    }
  });

  const renderYardBase = (color: PlayerColor, colSpan: string, rowSpan: string, borderClasses: string) => {
    const player = players.find(p => p.color === color);
    const config = COLOR_CONFIGS[color];
    const yardTokens = player ? tokens.filter(t => t.playerId === player.id && t.position === -1) : [];

    return (
      <div
        className={`${colSpan} ${rowSpan} p-2 sm:p-2.5 flex items-center justify-center ${borderClasses} relative overflow-hidden select-none`}
        style={{ backgroundColor: config.hex }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />

        <div className="relative w-full h-full bg-[#FFFDF8] rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 shadow-inner border border-stone-800/40 grid grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2.5 items-center justify-items-center">
          {[0, 1, 2, 3].map(pocketIdx => {
            const tok = yardTokens[pocketIdx];
            const isMovable = isInteractive && tok ? movableTokenIds.has(tok.id) && tok.playerId === activePlayer.id : false;

            return (
              <div
                key={pocketIdx}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-stone-100 border-2 border-stone-300 shadow-inner flex items-center justify-center relative"
                style={{ borderColor: config.hex }}
              >
                {tok ? (
                  <RealPawn
                    color={color}
                    isMovable={isMovable}
                    onClick={() => onTokenClick(tok)}
                    label={pocketIdx + 1}
                    size="md"
                  />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300/40" />
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-1 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[9px] sm:text-[10px] font-bold text-white max-w-[85%] truncate shadow-xs">
          {player ? player.name : config.nameBn}
        </div>
      </div>
    );
  };

  const renderTrackCell = (col: number, row: number) => {
    const key = `${col}_${row}`;
    const cellTokens = cellTokensMap[key] || [];

    const isRedStart = col === 1 && row === 6;
    const isGreenStart = col === 8 && row === 1;
    const isYellowStart = col === 13 && row === 8;
    const isBlueStart = col === 6 && row === 13;

    const isRedHome = row === 7 && col >= 1 && col <= 5;
    const isGreenHome = col === 7 && row >= 1 && row <= 5;
    const isYellowHome = row === 7 && col >= 9 && col <= 13;
    const isBlueHome = col === 7 && row >= 9 && row <= 13;

    const isSafeStar =
      (col === 6 && row === 2) ||
      (col === 12 && row === 6) ||
      (col === 8 && row === 12) ||
      (col === 2 && row === 8) ||
      isRedStart ||
      isGreenStart ||
      isYellowStart ||
      isBlueStart;

    let bgColor = 'bg-white';
    let starColor = 'text-amber-500';
    let arrowText = '';

    if (isRedStart) {
      bgColor = 'bg-rose-500';
      starColor = 'text-white';
      arrowText = '➔';
    } else if (isGreenStart) {
      bgColor = 'bg-emerald-500';
      starColor = 'text-white';
      arrowText = '➔';
    } else if (isYellowStart) {
      bgColor = 'bg-amber-400';
      starColor = 'text-stone-900';
      arrowText = '➔';
    } else if (isBlueStart) {
      bgColor = 'bg-blue-500';
      starColor = 'text-white';
      arrowText = '➔';
    } else if (isRedHome) {
      bgColor = 'bg-rose-500';
    } else if (isGreenHome) {
      bgColor = 'bg-emerald-500';
    } else if (isYellowHome) {
      bgColor = 'bg-amber-400';
    } else if (isBlueHome) {
      bgColor = 'bg-blue-500';
    }

    const movableToken = isInteractive ? cellTokens.find(t => movableTokenIds.has(t.id) && t.playerId === activePlayer.id) : undefined;

    return (
      <div
        key={key}
        style={{ gridColumn: col + 1, gridRow: row + 1 }}
        onClick={() => {
          if (movableToken) onTokenClick(movableToken);
        }}
        className={`border border-stone-800/30 flex items-center justify-center relative select-none ${bgColor} ${
          movableToken ? 'cursor-pointer ring-2 ring-amber-400 z-20' : ''
        }`}
      >
        {isSafeStar && cellTokens.length === 0 && (
          <span className={`text-[10px] sm:text-xs font-bold leading-none ${starColor} drop-shadow-xs`}>
            {arrowText ? `${arrowText}` : '★'}
          </span>
        )}

        {cellTokens.length > 0 && (
          <div className="relative flex items-center justify-center w-full h-full">
            {cellTokens.length === 1 ? (
              <RealPawn
                color={players.find(p => p.id === cellTokens[0].playerId)?.color || 'red'}
                isMovable={movableTokenIds.has(cellTokens[0].id) && cellTokens[0].playerId === activePlayer.id}
                onClick={() => onTokenClick(cellTokens[0])}
                size="sm"
              />
            ) : (
              <div className="relative flex items-center justify-center">
                <RealPawn
                  color={players.find(p => p.id === cellTokens[0].playerId)?.color || 'red'}
                  isMovable={Boolean(movableToken)}
                  onClick={() => {
                    if (movableToken) onTokenClick(movableToken);
                  }}
                  size="sm"
                />
                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-stone-900 text-white text-[8px] font-bold border border-white shadow-xs">
                  {cellTokens.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[420px] sm:max-w-[470px] mx-auto select-none">
      <div className="bg-gradient-to-br from-[#2D1B10] via-[#3E2718] to-[#1E110A] p-2 sm:p-3 rounded-3xl border-2 sm:border-4 border-[#D6BD98] shadow-2xl">
        <div
          className="relative aspect-square w-full rounded-2xl bg-[#FFFDF8] border-2 border-stone-900 shadow-inner overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
          }}
        >
          {/* 1. RED BASE (6x6) */}
          <div style={{ gridColumn: '1 / 7', gridRow: '1 / 7' }}>
            {renderYardBase('red', 'w-full h-full', '', 'border-r-2 border-b-2 border-stone-900')}
          </div>

          {/* 2. GREEN BASE (6x6) */}
          <div style={{ gridColumn: '10 / 16', gridRow: '1 / 7' }}>
            {renderYardBase('green', 'w-full h-full', '', 'border-l-2 border-b-2 border-stone-900')}
          </div>

          {/* 3. YELLOW BASE (6x6) */}
          <div style={{ gridColumn: '10 / 16', gridRow: '10 / 16' }}>
            {renderYardBase('yellow', 'w-full h-full', '', 'border-l-2 border-t-2 border-stone-900')}
          </div>

          {/* 4. BLUE BASE (6x6) */}
          <div style={{ gridColumn: '1 / 7', gridRow: '10 / 16' }}>
            {renderYardBase('blue', 'w-full h-full', '', 'border-r-2 border-t-2 border-stone-900')}
          </div>

          {/* 5. CENTER HOME TRIANGLES */}
          <div
            style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
            className="relative w-full h-full border border-stone-900 overflow-hidden bg-stone-950 flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <polygon points="0,0 50,50 0,100" fill="#E11D48" stroke="#1C1917" strokeWidth="0.8" />
              <polygon points="0,0 50,50 100,0" fill="#059669" stroke="#1C1917" strokeWidth="0.8" />
              <polygon points="100,0 50,50 100,100" fill="#D97706" stroke="#1C1917" strokeWidth="0.8" />
              <polygon points="0,100 50,50 100,100" fill="#2563EB" stroke="#1C1917" strokeWidth="0.8" />
            </svg>

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute left-1 flex flex-col gap-0.5">
                {(cellTokensMap['home_red'] || []).map((_, i) => (
                  <span key={i} className="text-[8px] sm:text-[10px] text-white">★</span>
                ))}
              </div>
              <div className="absolute top-1 flex gap-0.5">
                {(cellTokensMap['home_green'] || []).map((_, i) => (
                  <span key={i} className="text-[8px] sm:text-[10px] text-white">★</span>
                ))}
              </div>
              <div className="absolute right-1 flex flex-col gap-0.5">
                {(cellTokensMap['home_yellow'] || []).map((_, i) => (
                  <span key={i} className="text-[8px] sm:text-[10px] text-stone-950">★</span>
                ))}
              </div>
              <div className="absolute bottom-1 flex gap-0.5">
                {(cellTokensMap['home_blue'] || []).map((_, i) => (
                  <span key={i} className="text-[8px] sm:text-[10px] text-white">★</span>
                ))}
              </div>
            </div>

            <div className="relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border-2 border-amber-600 shadow-md flex items-center justify-center">
              <span className="text-xs sm:text-sm">👑</span>
            </div>
          </div>

          {/* 6. TRACK CELLS */}
          {Array.from({ length: 6 }).map((_, r) =>
            [6, 7, 8].map(c => renderTrackCell(c, r))
          )}
          {[6, 7, 8].map(r =>
            Array.from({ length: 6 }).map((_, i) => renderTrackCell(9 + i, r))
          )}
          {Array.from({ length: 6 }).map((_, i) =>
            [6, 7, 8].map(c => renderTrackCell(c, 9 + i))
          )}
          {[6, 7, 8].map(r =>
            Array.from({ length: 6 }).map((_, c) => renderTrackCell(c, r))
          )}
        </div>
      </div>

      {/* Movable Tokens Quick Picker */}
      <div className="mt-2.5 p-2.5 bg-white rounded-2xl border border-amber-300 shadow-xs">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLOR_CONFIGS[activePlayer.color]?.hex }}
            />
            <span className="text-[11px] sm:text-xs font-bold text-stone-800 truncate">
              {activePlayer.isAi ? (
                <span className="text-indigo-600 font-bold">🤖 {activePlayer.name} (রোবট) চাল দিচ্ছে...</span>
              ) : (
                <span className="text-emerald-700 font-bold">👤 আপনার চাল! ঘুঁটিতে ট্যাপ করুন</span>
              )}
            </span>
          </div>
          {diceValue && (
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-400 text-stone-950 font-mono shrink-0 shadow-2xs">
              চাল: {diceValue} ঘর
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {tokens
            .filter(t => t.playerId === activePlayer.id)
            .map((tok, idx) => {
              const isMovable = isInteractive && movableTokenIds.has(tok.id);
              const inYard = tok.position === -1;
              const isDone = tok.position >= 57;
              const target = inYard ? 0 : tok.position + (diceValue || 0);

              return (
                <button
                  key={tok.id}
                  disabled={!isMovable}
                  onClick={() => onTokenClick(tok)}
                  className={`p-1.5 sm:p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isMovable
                      ? 'border-amber-400 bg-amber-50 ring-1 sm:ring-2 ring-amber-400 cursor-pointer shadow-xs animate-pulse font-bold'
                      : isDone
                      ? 'border-emerald-200 bg-emerald-50 opacity-70 cursor-default'
                      : 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: COLOR_CONFIGS[activePlayer.color]?.hex }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-stone-800 truncate">
                      {isDone ? 'হোমে 🏆' : inYard ? (isMovable ? 'মাঠে নামান' : 'ঘরে বন্দী') : `ঘর ${tok.position} ➔ ${target}`}
                    </span>
                  </div>

                  {isMovable && (
                    <span className="text-[9px] font-bold bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded shrink-0 shadow-2xs">
                      ট্যাপ ➔
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
