import React from 'react';
import { motion } from 'framer-motion';

interface ThreeDDiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled?: boolean;
  size?: number; // default 56px
}

// Target rotations for each face (1 to 6)
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 180, y: 0 },
};

// Render pips on a face
const renderPips = (faceNumber: number) => {
  const isOne = faceNumber === 1;
  const isRed = faceNumber === 1 || faceNumber === 4;
  const pipColor = isRed ? 'bg-rose-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' : 'bg-stone-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]';

  // Specific grid layouts for each face
  switch (faceNumber) {
    case 1:
      return (
        <div className="w-full h-full flex items-center justify-center">
          <span className={`w-4 h-4 rounded-full ${pipColor} ring-1 ring-rose-400/40`} />
        </div>
      );
    case 2:
      return (
        <div className="w-full h-full flex flex-col justify-between p-2">
          <div className="flex justify-start"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-end"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
        </div>
      );
    case 3:
      return (
        <div className="w-full h-full flex flex-col justify-between p-1.5">
          <div className="flex justify-start"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-center"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-end"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
        </div>
      );
    case 4:
      return (
        <div className="w-full h-full flex flex-col justify-between p-1.5">
          <div className="flex justify-between"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-between"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
        </div>
      );
    case 5:
      return (
        <div className="w-full h-full flex flex-col justify-between p-1.5">
          <div className="flex justify-between"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-center"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-between"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
        </div>
      );
    case 6:
      return (
        <div className="w-full h-full flex flex-col justify-between p-1.5">
          <div className="flex justify-between"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-between"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
          <div className="flex justify-between"><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /><span className={`w-2.5 h-2.5 rounded-full ${pipColor}`} /></div>
        </div>
      );
    default:
      return null;
  }
};

export const ThreeDDice: React.FC<ThreeDDiceProps> = ({
  value,
  isRolling,
  onRoll,
  disabled = false,
  size = 56,
}) => {
  const currentVal = value && value >= 1 && value <= 6 ? value : 1;
  const targetRot = FACE_ROTATIONS[currentVal];
  const halfSize = size / 2;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* 3D Dice Scene */}
      <div 
        style={{ 
          width: size + 16, 
          height: size + 16, 
          perspective: 600,
        }}
        className="flex items-center justify-center relative cursor-pointer"
        onClick={() => !disabled && !isRolling && onRoll()}
      >
        {/* Soft Dynamic Floor Shadow */}
        <motion.div
          animate={isRolling ? {
            scale: [1, 0.7, 1.1, 0.6, 1],
            opacity: [0.4, 0.2, 0.5, 0.2, 0.4],
          } : {
            scale: 1,
            opacity: 0.35,
          }}
          transition={isRolling ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          className="absolute bottom-1 w-12 h-3.5 bg-stone-950/40 rounded-full blur-xs pointer-events-none -z-0"
        />

        {/* 3D Cube */}
        <motion.div
          animate={isRolling ? {
            rotateX: [0, 180, 360, 540, 720],
            rotateY: [0, 270, 540, 810, 1080],
            rotateZ: [0, 45, 90, 135, 180],
            y: [-2, -18, -4, -14, 0],
          } : {
            rotateX: targetRot.x,
            rotateY: targetRot.y,
            rotateZ: 0,
            y: 0,
          }}
          transition={isRolling ? {
            duration: 0.6,
            repeat: Infinity,
            ease: 'linear',
          } : {
            type: 'spring',
            stiffness: 260,
            damping: 18,
          }}
          style={{
            width: size,
            height: size,
            transformStyle: 'preserve-3d',
          }}
          className={`relative ${!disabled && !isRolling ? 'hover:scale-105 active:scale-95' : ''}`}
        >
          {/* FACE 1 (Front: Z+) */}
          <div
            style={{
              width: size,
              height: size,
              transform: `rotateY(0deg) translateZ(${halfSize}px)`,
            }}
            className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF7] to-[#EFE8DA] rounded-xl border-2 border-stone-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)] backface-hidden"
          >
            {renderPips(1)}
          </div>

          {/* FACE 6 (Back: Z-) */}
          <div
            style={{
              width: size,
              height: size,
              transform: `rotateX(180deg) translateZ(${halfSize}px)`,
            }}
            className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF7] to-[#EFE8DA] rounded-xl border-2 border-stone-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)] backface-hidden"
          >
            {renderPips(6)}
          </div>

          {/* FACE 3 (Right: X+) */}
          <div
            style={{
              width: size,
              height: size,
              transform: `rotateY(90deg) translateZ(${halfSize}px)`,
            }}
            className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF7] to-[#EFE8DA] rounded-xl border-2 border-stone-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)] backface-hidden"
          >
            {renderPips(3)}
          </div>

          {/* FACE 4 (Left: X-) */}
          <div
            style={{
              width: size,
              height: size,
              transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
            }}
            className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF7] to-[#EFE8DA] rounded-xl border-2 border-stone-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)] backface-hidden"
          >
            {renderPips(4)}
          </div>

          {/* FACE 5 (Top: Y+) */}
          <div
            style={{
              width: size,
              height: size,
              transform: `rotateX(90deg) translateZ(${halfSize}px)`,
            }}
            className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF7] to-[#EFE8DA] rounded-xl border-2 border-stone-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)] backface-hidden"
          >
            {renderPips(5)}
          </div>

          {/* FACE 2 (Bottom: Y-) */}
          <div
            style={{
              width: size,
              height: size,
              transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
            }}
            className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF7] to-[#EFE8DA] rounded-xl border-2 border-stone-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1)] backface-hidden"
          >
            {renderPips(2)}
          </div>
        </motion.div>
      </div>

      {/* Tactile Roll Button */}
      <motion.button
        whileHover={!disabled && !isRolling ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isRolling ? { scale: 0.95 } : {}}
        disabled={disabled || isRolling}
        onClick={onRoll}
        className={`mt-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
          disabled
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
            : isRolling
            ? 'bg-amber-400 text-stone-950 animate-pulse'
            : 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-500 hover:to-amber-400 text-stone-950 ring-1 ring-amber-500/50'
        }`}
      >
        <span>{isRolling ? 'ঘুরছে...' : 'চাল দিন (Roll)'}</span>
      </motion.button>
    </div>
  );
};
