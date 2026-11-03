import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, HelpCircle, Trophy, Sparkles, CheckCircle2, AlertTriangle, Layers, ChevronRight } from 'lucide-react';
import { Member } from '../../types';

interface FamilyTreePuzzleGameProps {
  members: Member[];
  onBackToHub: () => void;
}

type PuzzleLevel = 2 | 3 | 4;

interface PuzzleSlot {
  slotId: string;
  member: Member;
  level: PuzzleLevel;
  isInitialEmpty: boolean; // if true, card starts in the tray
  placedMemberId: string | null;
  x: number; // percentage
  y: number; // percentage
}

export const FamilyTreePuzzleGame: React.FC<FamilyTreePuzzleGameProps> = ({ members, onBackToHub }) => {
  const [level, setLevel] = useState<PuzzleLevel>(2);
  const [moves, setMoves] = useState(0);
  const [selectedTrayMember, setSelectedTrayMember] = useState<Member | null>(null);
  const [shakingSlotId, setShakingSlotId] = useState<string | null>(null);
  const [hintSlotId, setHintSlotId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Setup family members by generation for the puzzle
  const grandpas = useMemo(() => members.filter(m => m.type === 'grandpa'), [members]);
  const grandmas = useMemo(() => members.filter(m => m.type === 'grandma'), [members]);
  const sons = useMemo(() => members.filter(m => m.type === 'son').slice(0, 4), [members]);
  const daughters = useMemo(() => members.filter(m => m.type === 'daughter').slice(0, 3), [members]);
  const grandchildren = useMemo(() => members.filter(m => m.type === 'grandchild').slice(0, 4), [members]);
  const greatGrandchildren = useMemo(() => members.filter(m => m.type === 'great-grandchild' || m.type === 'great-great-grandchild').slice(0, 2), [members]);

  // Construct Slots based on selected level
  const [slots, setSlots] = useState<PuzzleSlot[]>([]);
  const [trayMembers, setTrayMembers] = useState<Member[]>([]);

  // Initialize Level
  const initLevel = (lvl: PuzzleLevel) => {
    setLevel(lvl);
    setMoves(0);
    setSelectedTrayMember(null);
    setShakingSlotId(null);
    setHintSlotId(null);
    setIsCompleted(false);

    const generatedSlots: PuzzleSlot[] = [];
    const missingMembers: Member[] = [];

    // Gen 1: Grandparents (Y: 14%)
    const gp = grandpas[0] || members[0];
    const gm = grandmas[0] || members[1];
    if (gp) {
      // In level 2, keep grandpa fixed, but empty grandma
      generatedSlots.push({
        slotId: 'slot-gp',
        member: gp,
        level: 2,
        isInitialEmpty: false,
        placedMemberId: gp.id,
        x: 42,
        y: 12
      });
    }
    if (gm) {
      generatedSlots.push({
        slotId: 'slot-gm',
        member: gm,
        level: 2,
        isInitialEmpty: true,
        placedMemberId: null,
        x: 58,
        y: 12
      });
      missingMembers.push(gm);
    }

    // Gen 2: Sons & Daughters (Y: 42%)
    // Distribute horizontally
    const gen2Pool = [...sons, ...daughters].slice(0, lvl === 2 ? 4 : 5);
    const stepX = 80 / (gen2Pool.length + 1);
    gen2Pool.forEach((child, idx) => {
      // Empty alternate children
      const shouldEmpty = idx % 2 === 1 || lvl >= 3;
      generatedSlots.push({
        slotId: `slot-gen2-${child.id}`,
        member: child,
        level: 2,
        isInitialEmpty: shouldEmpty,
        placedMemberId: shouldEmpty ? null : child.id,
        x: 10 + (idx + 1) * stepX,
        y: 42
      });
      if (shouldEmpty) {
        missingMembers.push(child);
      }
    });

    // Gen 3: Grandchildren (Y: 72%) (Only for Level 3 & 4)
    if (lvl >= 3) {
      const gen3Pool = grandchildren.slice(0, lvl === 3 ? 3 : 4);
      const stepX3 = 84 / (gen3Pool.length + 1);
      gen3Pool.forEach((gc, idx) => {
        generatedSlots.push({
          slotId: `slot-gen3-${gc.id}`,
          member: gc,
          level: 3,
          isInitialEmpty: true,
          placedMemberId: null,
          x: 8 + (idx + 1) * stepX3,
          y: 72
        });
        missingMembers.push(gc);
      });
    }

    // Gen 4: Great-grandchildren (Y: 90%) (Only for Level 4)
    if (lvl >= 4) {
      const gen4Pool = greatGrandchildren.slice(0, 2);
      const stepX4 = 50 / (gen4Pool.length + 1);
      gen4Pool.forEach((ggc, idx) => {
        generatedSlots.push({
          slotId: `slot-gen4-${ggc.id}`,
          member: ggc,
          level: 4,
          isInitialEmpty: true,
          placedMemberId: null,
          x: 25 + (idx + 1) * stepX4,
          y: 90
        });
        missingMembers.push(ggc);
      });
    }

    setSlots(generatedSlots);
    // Shuffle tray members
    setTrayMembers([...missingMembers].sort(() => 0.5 - Math.random()));
  };

  useEffect(() => {
    initLevel(level);
  }, [level]);

  // Check completion
  useEffect(() => {
    if (slots.length === 0) return;
    const allFilled = slots.every(s => s.placedMemberId !== null);
    if (allFilled && trayMembers.length === 0 && !isCompleted) {
      setIsCompleted(true);
    }
  }, [slots, trayMembers, isCompleted]);

  // Handle Placing card onto slot (supports tap-to-place & drop)
  const handlePlaceMember = (slot: PuzzleSlot, droppedMember?: Member) => {
    const memberToPlace = droppedMember || selectedTrayMember;
    if (!memberToPlace || slot.placedMemberId !== null) return;

    setMoves(prev => prev + 1);

    // Verify correct slot placement
    if (memberToPlace.id === slot.member.id) {
      // Correct! Snap in with gold glow
      setSlots(prev => prev.map(s => {
        if (s.slotId === slot.slotId) {
          return { ...s, placedMemberId: memberToPlace.id };
        }
        return s;
      }));

      // Remove from tray
      setTrayMembers(prev => prev.filter(m => m.id !== memberToPlace.id));
      setSelectedTrayMember(null);
      setHintSlotId(null);
    } else {
      // Wrong! Shake animation
      setShakingSlotId(slot.slotId);
      setTimeout(() => setShakingSlotId(null), 600);
      setSelectedTrayMember(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, member: Member) => {
    e.dataTransfer.setData('text/plain', member.id);
  };

  const handleDrop = (e: React.DragEvent, slot: PuzzleSlot) => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData('text/plain');
    const droppedMember = trayMembers.find(m => m.id === memberId);
    if (droppedMember) {
      handlePlaceMember(slot, droppedMember);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Hint button: Highlights first empty slot and its matching card
  const handleHint = () => {
    const emptySlot = slots.find(s => s.placedMemberId === null);
    if (emptySlot) {
      setHintSlotId(emptySlot.slotId);
      const matchingMember = trayMembers.find(m => m.id === emptySlot.member.id);
      if (matchingMember) {
        setSelectedTrayMember(matchingMember);
      }
      setTimeout(() => {
        setHintSlotId(null);
      }, 3000);
    }
  };

  const handleBackPress = () => {
    if (moves > 0 && !isCompleted) {
      setShowQuitConfirm(true);
    } else {
      onBackToHub();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 font-sans text-[#1F2A28]">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <button
          onClick={handleBackPress}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1A3636] hover:text-[#40534C] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> প্রস্থান
        </button>

        {/* Level Switcher */}
        <div className="flex items-center gap-1 bg-[#F7F3EA] p-1 rounded-full border border-[#D6BD98]">
          <button
            onClick={() => initLevel(2)}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${level === 2 ? 'bg-[#1A3636] text-white' : 'text-[#1A3636] hover:bg-[#D6BD98]/20'}`}
          >
            ২ প্রজন্ম
          </button>
          <button
            onClick={() => initLevel(3)}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${level === 3 ? 'bg-[#1A3636] text-white' : 'text-[#1A3636] hover:bg-[#D6BD98]/20'}`}
          >
            ৩ প্রজন্ম
          </button>
          <button
            onClick={() => initLevel(4)}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${level === 4 ? 'bg-[#1A3636] text-white' : 'text-[#1A3636] hover:bg-[#D6BD98]/20'}`}
          >
            ৪ প্রজন্ম
          </button>
        </div>

        {/* Controls: Moves, Hint, Reset */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-[#FAF9F6] border border-[#D6BD98] px-2.5 py-1 rounded-xl text-[#1A3636]">
            পদক্ষেপ: {moves}
          </span>
          <button
            onClick={handleHint}
            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-xl transition cursor-pointer"
            title="সাহায্য"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">সাহায্য</span>
          </button>
          <button
            onClick={() => initLevel(level)}
            className="p-1 rounded-xl border border-[#D6BD98] bg-white hover:bg-[#F7F3EA] text-[#1A3636] transition cursor-pointer"
            title="পুনরায় শুরু"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Puzzle Canvas with SVG Curved Connectors */}
      <div className={`relative w-full h-[360px] sm:h-[420px] bg-[#FAF9F6] rounded-3xl border-2 border-[#D6BD98] shadow-md overflow-hidden transition-all duration-700 ${
        isCompleted ? 'ring-4 ring-amber-400/80 shadow-2xl' : ''
      }`}>
        {/* SVG Connectors connecting grandparents to children to grandchildren */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#D6BD98] fill-none" strokeWidth="2.5">
          {/* Connector from Grandpa/Grandma (Y: 12%) down to middle horizontal bar (Y: 26%) */}
          <path d="M 50% 16% L 50% 28%" strokeDasharray="3 3" />
          {/* Horizontal line spreading to gen2 */}
          <path d="M 16% 28% L 84% 28%" />

          {/* Drops from horizontal bar to gen2 children slots */}
          {slots.filter(s => s.level === 2 && s.y > 20).map(s => (
            <path key={`conn-down-${s.slotId}`} d={`M ${s.x}% 28% L ${s.x}% ${s.y}%`} />
          ))}

          {/* Connectors to Level 3 & 4 */}
          {level >= 3 && (
            <>
              <path d="M 30% 48% L 30% 60% L 70% 60% L 70% 48%" strokeDasharray="2 2" />
              {slots.filter(s => s.level === 3).map(s => (
                <path key={`conn-g3-${s.slotId}`} d={`M ${s.x}% 60% L ${s.x}% ${s.y}%`} />
              ))}
            </>
          )}
        </svg>

        {/* Tree Circular Avatar Slots */}
        {slots.map(slot => {
          const isFilled = slot.placedMemberId !== null;
          const isShaking = shakingSlotId === slot.slotId;
          const isHinted = hintSlotId === slot.slotId;
          const isTargetSelected = selectedTrayMember !== null && !isFilled;

          return (
            <div
              key={slot.slotId}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, slot)}
              onClick={() => handlePlaceMember(slot)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all ${
                isShaking ? 'animate-bounce' : ''
              }`}
            >
              {/* Circular Avatar Node with Gold Ring */}
              <motion.div
                animate={{
                  scale: isFilled ? [1, 1.08, 1] : isHinted ? [1, 1.15, 1] : 1,
                  boxShadow: isFilled
                    ? '0 0 16px rgba(212, 175, 55, 0.45)'
                    : isHinted
                    ? '0 0 20px rgba(245, 158, 11, 0.7)'
                    : isTargetSelected
                    ? '0 0 10px rgba(26, 54, 54, 0.3)'
                    : 'none'
                }}
                transition={{ duration: 0.4 }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-0.5 border-2 transition-all relative ${
                  isFilled
                    ? 'border-[#D4AF37] bg-white'
                    : isHinted
                    ? 'border-amber-500 bg-amber-50 border-dashed animate-pulse'
                    : isTargetSelected
                    ? 'border-[#1A3636] bg-[#F7F3EA] border-dashed hover:scale-105'
                    : 'border-stone-300 bg-white/70 border-dashed'
                }`}
              >
                {isFilled ? (
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {slot.member.photoUrl ? (
                      <img src={slot.member.photoUrl} alt={slot.member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif font-bold text-xs sm:text-sm text-[#1A3636] bg-[#F7F3EA]">
                        {slot.member.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-1">
                    <span className="text-[10px] sm:text-xs text-stone-400 font-bold">?</span>
                  </div>
                )}
              </motion.div>

              {/* Slot Name Tag */}
              <div className="mt-1 px-2 py-0.5 rounded-full bg-white/90 border border-[#D6BD98]/60 shadow-2xs max-w-[90px] truncate text-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#1A3636] truncate block">
                  {isFilled ? slot.member.name : slot.member.role || 'সদস্য'}
                </span>
              </div>
            </div>
          );
        })}

        {/* Celebration Overlay on Completion */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-[#1A3636]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 z-30 text-center"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center text-3xl mb-3 shadow-lg"
              >
                🏆
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-200 mb-1">
                অভিনন্দন! বংশলতা পূর্ণ হয়েছে!
              </h3>
              <p className="text-xs sm:text-sm text-stone-200 mb-4 max-w-sm">
                আপনি {moves} পদক্ষেপে সফলভাবে {level} প্রজন্মের ফ্যামিলি ট্রি সাজিয়েছেন।
              </p>
              <div className="flex gap-2">
                {level < 4 ? (
                  <button
                    onClick={() => initLevel((level + 1) as PuzzleLevel)}
                    className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                  >
                    <span>পরবর্তী লেভেল ({level + 1} প্রজন্ম)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => initLevel(2)}
                    className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer"
                  >
                    <span>পুনরায় খেলুন</span>
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onBackToHub}
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  মেনুতে ফিরুন
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tray of Draggable Member Cards at the Bottom */}
      <div className="mt-4 bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📥</span>
            <span className="text-xs font-bold text-[#1A3636]">
              কার্ড ট্রে (বাকি: {trayMembers.length} টি)
            </span>
          </div>
          <span className="text-[11px] text-[#736B65]">
            কার্ডে ট্যাপ করে সঠিক স্থানে বসান, বা ড্র্যাগ করুন
          </span>
        </div>

        {trayMembers.length === 0 && !isCompleted ? (
          <p className="text-xs text-[#736B65] text-center py-4">সকল কার্ড সঠিকভাবে স্থাপন করা হয়েছে!</p>
        ) : (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
            {trayMembers.map(member => {
              const isSelected = selectedTrayMember?.id === member.id;
              return (
                <motion.div
                  key={member.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, member)}
                  onClick={() => setSelectedTrayMember(isSelected ? null : member)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`min-w-[120px] p-2.5 rounded-2xl border-2 bg-white flex items-center gap-2 cursor-pointer transition-all shadow-xs shrink-0 select-none ${
                    isSelected
                      ? 'border-[#1A3636] ring-2 ring-[#D6BD98] bg-[#F7F3EA] shadow-md'
                      : 'border-[#D6BD98] hover:border-[#1A3636]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D6BD98] shrink-0 bg-[#F7F3EA]">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#1A3636]">
                        {member.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-[#1A3636] truncate leading-tight">
                      {member.name}
                    </h5>
                    <p className="text-[9px] text-[#736B65] truncate mt-0.5">
                      {member.role || member.type}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quit Dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <h3 className="text-lg font-serif font-bold text-[#1A3636] mb-1">
              পাজল খেলা ছাড়তে চান?
            </h3>
            <p className="text-xs text-[#736B65] mb-5">
              এখন বের হলে আপনার বর্তমান পাজল স্কোর ও অগ্রগতি রিসেট হবে।
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-200 text-stone-800 hover:bg-stone-300 cursor-pointer"
              >
                খেলায় থাকুন
              </button>
              <button
                onClick={() => {
                  setShowQuitConfirm(false);
                  onBackToHub();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C85A38] text-white hover:bg-rose-700 cursor-pointer shadow-sm"
              >
                হ্যাঁ, বের হব
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
