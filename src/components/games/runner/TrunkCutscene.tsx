import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Key, Lock, Unlock, RotateCcw, ArrowLeft, Heart, Award } from 'lucide-react';
import { Member } from '../../../types';
import { sounds } from './soundEffects';

interface TrunkCutsceneProps {
  score: number;
  totalCoins: number;
  members: Member[];
  onPlayAgain: () => void;
  onBackToHub: () => void;
}

export const TrunkCutscene: React.FC<TrunkCutsceneProps> = ({
  totalCoins,
  members,
  onPlayAgain,
  onBackToHub,
}) => {
  const [stage, setStage] = useState<'merging' | 'unlocking' | 'opened'>('merging');

  // Trigger stage transitions, sound effects, and confetti
  useEffect(() => {
    sounds.playKeyPiece();

    const t1 = setTimeout(() => {
      setStage('unlocking');
      sounds.playTrunkUnlock();
    }, 2200);

    const t2 = setTimeout(() => {
      setStage('opened');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#F59E0B', '#10B981', '#FAF5FF'],
        });
      } catch {}
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Pick grandfather or eldest ancestor from members list
  const grandfather = members.find((m) => m.type === 'grandpa') || members[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative my-auto">
        
        {/* STAGE 1 & 2: Key Fragments Merging & Lock Opening Animation */}
        {stage !== 'opened' && (
          <div className="py-8">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636] mb-3">
              {stage === 'merging' ? 'চাবির ৪টি খণ্ড একত্রিত হচ্ছে...' : 'দাদার পুরনো সিন্দুক খোলা হচ্ছে...'}
            </h2>
            <p className="text-xs sm:text-sm text-[#40534C] mb-8">
              চার প্রজন্মের পথ পেরিয়ে হারিয়ে যাওয়া চাবিটি অবশেষে পূর্ণাঙ্গ রূপ পেল
            </p>

            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {stage === 'merging' ? (
                <>
                  {/* 4 floating fragments coming together */}
                  {[0, 1, 2, 3].map((idx) => {
                    const angles = [0, 90, 180, 270];
                    const angle = (angles[idx] * Math.PI) / 180;
                    const r = 50;
                    return (
                      <motion.div
                        key={idx}
                        initial={{
                          x: Math.cos(angle) * r,
                          y: Math.sin(angle) * r,
                          opacity: 0.8,
                          scale: 0.8,
                        }}
                        animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        transition={{ duration: 1.8, ease: 'easeInOut' }}
                        className="absolute w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-200 border-2 border-amber-300 flex items-center justify-center shadow-lg text-stone-900 font-bold text-xs"
                      >
                        <Key className="w-5 h-5 text-amber-900 rotate-45" />
                      </motion.div>
                    );
                  })}
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-16 h-16 rounded-full bg-amber-400/30 blur-lg"
                  />
                </>
              ) : (
                /* Unlocking Trunk */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 0] }}
                    transition={{ duration: 1.2 }}
                    className="w-24 h-24 rounded-3xl bg-[#1A3636] border-4 border-[#D6BD98] flex items-center justify-center text-4xl shadow-2xl mb-2 text-amber-300"
                  >
                    <Unlock className="w-12 h-12 text-amber-300" />
                  </motion.div>
                  <span className="text-xs font-mono font-bold text-amber-800 animate-pulse">
                    ক্লিক... তালা খুলে গেল!
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 3: Memory Unlocked Card */}
        {stage === 'opened' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>হারানো সিন্দুকের চাবি উদ্ধার সম্পন্ন!</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636] mb-1">
              উন্মোচিত হলো পারিবারিক অমূল্য স্মৃতি
            </h2>
            <p className="text-xs text-[#736B65] mb-5">
              দাদার পুরনো সিন্দুকের ভিতর থেকে খুঁজে পাওয়া স্মৃতিময় দলিল
            </p>

            {/* Antique Parchment Memory Card */}
            <div className="w-full bg-[#F5EFEB] border-2 border-[#D6BD98] rounded-2xl p-5 mb-5 text-left shadow-inner relative overflow-hidden">
              <div className="flex items-center gap-3 mb-3 border-b border-[#D6BD98]/60 pb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D6BD98] bg-white shrink-0">
                  {grandfather?.photoUrl ? (
                    <img
                      src={grandfather.photoUrl}
                      alt={grandfather.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1A3636] text-amber-200 text-lg">
                      👴
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#1A3636] text-sm">
                    {grandfather?.name || 'মরহুম হাজী আব্দুর রহমান'}
                  </h4>
                  <p className="text-[11px] text-amber-800 font-medium">
                    {grandfather?.role || 'পরিবারের প্রধান অভিভাবক ও প্রতিষ্ঠাতা'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-stone-800 leading-relaxed space-y-2 font-serif">
                <p>
                  "আমার প্রিয় সন্তান ও পরবর্তী প্রজন্ম,
                </p>
                <p>
                  এই সিন্দুকটি কোনো ধন-দৌলত দিয়ে ভরা নয়, এর মধ্যে রক্ষিত আছে আমাদের পারিবারিক বন্ধন, সততা ও পরম ভালোবাসা। যুগে যুগে পথঘাট বদলে গেছে, শহরের রূপান্তর ঘটেছে, কিন্তু আমাদের রক্তের আত্মীয়তার যে আন্তরিক মশাল তোমরা হাতে নিয়ে এগিয়ে যাচ্ছো—এটাই আমাদের আসল সম্পদ।"
                </p>
                <p className="text-right text-[11px] italic font-sans text-stone-600 pt-1">
                  — পারিবারিক স্মৃতিফলক থেকে সংগৃহীত
                </p>
              </div>
            </div>

            {/* Run Stats Summary */}
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              <div className="bg-[#1A3636] text-white p-3 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] uppercase text-[#D6BD98] font-bold block mb-0.5">
                  অর্জিত মুদ্রা
                </span>
                <span className="text-xl font-mono font-bold text-amber-300">
                  {totalCoins} টি
                </span>
              </div>
              <div className="bg-[#1A3636] text-white p-3 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] uppercase text-[#D6BD98] font-bold block mb-0.5">
                  অতিক্রান্ত যুগ
                </span>
                <span className="text-xl font-mono font-bold text-emerald-300">
                  ৪টি প্রজন্ম
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                onClick={onPlayAgain}
                className="inline-flex items-center justify-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white text-xs sm:text-sm font-bold py-3 px-6 rounded-full shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>আবার খেলুন</span>
              </button>
              <button
                onClick={onBackToHub}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-[#1A3636] border border-[#D6BD98] text-xs sm:text-sm font-bold py-3 px-6 rounded-full shadow-2xs transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ফ্যামিলি গেমসে ফিরুন</span>
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
