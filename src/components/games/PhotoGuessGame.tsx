import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ChevronRight, Award, Camera, Sparkles } from 'lucide-react';
import { Member } from '../../types';

interface PhotoGuessGameProps {
  members: Member[];
  onBackToHub: () => void;
}

interface PhotoRound {
  target: Member;
  photoUrl: string;
  options: Member[];
}

export const PhotoGuessGame: React.FC<PhotoGuessGameProps> = ({ members, onBackToHub }) => {
  const [rounds, setRounds] = useState<PhotoRound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Helper to get fallback avatar if member has no photoUrl
  const getPhotoForMember = (m: Member): string => {
    if (m.photoUrl && m.photoUrl.trim().length > 0) {
      return m.photoUrl;
    }
    const seed = encodeURIComponent(m.name || m.role || 'family');
    const style = m.gender === 'female' ? 'lorelei' : 'micah';
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=EAE6DF`;
  };

  // Generate 5 rounds of photo guessing
  const generateRounds = () => {
    if (!members || members.length === 0) return;

    // Filter members who have uploaded photoUrl first
    const membersWithPhoto = members.filter(m => m.photoUrl && m.photoUrl.trim().length > 0);
    
    // If not enough with photo, pool with other members so we always have at least 5
    let pool: Member[] = [...membersWithPhoto];
    if (pool.length < 5) {
      const remaining = members.filter(m => !membersWithPhoto.some(p => p.id === m.id));
      pool = [...pool, ...remaining];
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const chosenTargets = shuffled.slice(0, Math.min(5, shuffled.length));

    const newRounds: PhotoRound[] = chosenTargets.map(target => {
      // 3 wrong distractors
      const otherMembers = members.filter(m => m.id !== target.id);
      const shuffledOthers = [...otherMembers].sort(() => Math.random() - 0.5);
      const distractors = shuffledOthers.slice(0, 3);
      
      const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);

      return {
        target,
        photoUrl: getPhotoForMember(target),
        options: roundOptions
      };
    });

    setRounds(newRounds);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setScore(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    generateRounds();
  }, [members]);

  const handleSelectOption = (option: Member) => {
    if (isAnswered || !currentRound) return;
    setSelectedOptionId(option.id);
    setIsAnswered(true);

    if (option.id === currentRound.target.id) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextRound = () => {
    if (currentIndex + 1 < rounds.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    } else {
      setIsGameOver(true);
    }
  };

  const currentRound = rounds[currentIndex];

  // If loading or empty
  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#EAE6DF] border-t-[#1A3636] mb-4"></div>
        <p className="text-sm text-[#736B65]">ছবি প্রস্তুত করা হচ্ছে...</p>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (isGameOver) {
    const isPerfect = score === rounds.length;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 sm:p-8 text-center shadow-xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-4xl shadow-lg mb-4"
        >
          {isPerfect ? '🏆' : score >= 3 ? '🌟' : '👏'}
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636] mb-2">
          {isPerfect ? 'অসাধারণ পারদর্শিতা!' : score >= 3 ? 'দারুণ খেলেছেন!' : 'ভালো চেষ্টা করেছেন!'}
        </h2>

        <p className="text-xs sm:text-sm text-[#40534C] mb-6">
          {isPerfect 
            ? 'পরিবারের সবাইকে আপনি ছবির মতোই নিখুঁতভাবে চেনেন!' 
            : score >= 3 
            ? 'পরিবারের সদস্যদের সাথে আপনার পরিচিতি বেশ ভালো।' 
            : 'আবার চেষ্টা করুন এবং পরিবারের সবাইকে চিনে নিন!'}
        </p>

        {/* Score Card */}
        <div className="bg-[#1A3636] text-white rounded-2xl p-5 mb-6 shadow-md border border-[#D6BD98]/40">
          <p className="text-xs uppercase tracking-wider text-[#D6BD98] font-semibold mb-1">
            আপনার ফলাফল
          </p>
          <div className="text-4xl sm:text-5xl font-mono font-bold text-amber-300 mb-1">
            {score} <span className="text-2xl text-stone-300 font-sans">/ {rounds.length}</span>
          </div>
          <p className="text-[11px] text-stone-300">
            {Math.round((score / rounds.length) * 100)}% সঠিক উত্তর
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={generateRounds}
            className="inline-flex items-center justify-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>আবার খেলুন</span>
          </button>
          <button
            onClick={onBackToHub}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-[#1A3636] border border-[#D6BD98] px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ফ্যামিলি গেমে ফিরুন</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // ACTIVE ROUND SCREEN
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Top Bar: Back button, Progress & Score */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (currentIndex > 0 || isAnswered) {
              setShowQuitConfirm(true);
            } else {
              onBackToHub();
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A3636] hover:text-[#40534C] bg-white px-3 py-1.5 rounded-full border border-[#D6BD98]/60 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>বের হন</span>
        </button>

        {/* Round Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1A3636] bg-[#D6BD98]/30 border border-[#D6BD98] px-3 py-1 rounded-full">
            ছবি {currentIndex + 1} / {rounds.length}
          </span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
            পয়েন্ট: {score}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-5">
        <div 
          className="bg-gradient-to-r from-[#1A3636] via-[#40534C] to-[#D6BD98] h-full transition-all duration-300"
          style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / rounds.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-5 sm:p-7 shadow-lg"
      >
        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1A3636] bg-[#D6BD98]/20 px-3 py-1 rounded-full mb-1 border border-[#D6BD98]/50">
            <Camera className="w-3.5 h-3.5 text-[#1A3636]" />
            <span>ছবি দেখে বলুন</span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1A3636]">
            ছবিটি দেখে বলুন — ইনি কে?
          </h2>
        </div>

        {/* Member Photo in Nostalgic Album Frame */}
        <div className="relative mx-auto w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-stone-200 mb-6 group ring-2 ring-[#D6BD98]/70">
          <img
            src={currentRound.photoUrl}
            alt="Family Member"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none"></div>
        </div>

        {/* 4 Name Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4">
          {currentRound.options.map((option) => {
            const isCorrect = option.id === currentRound.target.id;
            const isSelected = option.id === selectedOptionId;

            let buttonStyle = "bg-white hover:bg-stone-50 border-[#D6BD98] text-[#1F2A28]";
            if (isAnswered) {
              if (isCorrect) {
                buttonStyle = "bg-emerald-600 border-emerald-600 text-white shadow-md font-bold";
              } else if (isSelected && !isCorrect) {
                buttonStyle = "bg-[#C85A38] border-red-500 text-white font-bold";
              } else {
                buttonStyle = "bg-stone-100 border-stone-200 text-stone-400 opacity-60";
              }
            }

            return (
              <motion.button
                key={option.id}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswered}
                className={`w-full p-3 sm:p-3.5 rounded-2xl border-2 text-left font-serif text-sm sm:text-base transition-all duration-200 flex items-center justify-between cursor-pointer ${buttonStyle}`}
              >
                <span className="truncate pr-2">{option.name}</span>
                {isAnswered && (
                  <span>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white shrink-0" />}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Answer Feedback / Explanation */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-[#D6BD98]/50"
            >
              <div className={`p-3.5 rounded-2xl mb-4 border ${
                selectedOptionId === currentRound.target.id 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  {selectedOptionId === currentRound.target.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>সঠিক উত্তর! চমৎকার!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-[#C85A38]" />
                      <span>সঠিক উত্তর: <strong>{currentRound.target.name}</strong></span>
                    </>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  ইনি হলেন <strong className="text-[#1A3636]">{currentRound.target.name}</strong> ({currentRound.target.role || 'পরিবারের সদস্য'})।
                  {currentRound.target.fatherName && ` পিতা: ${currentRound.target.fatherName}।`}
                  {currentRound.target.currentlyLiveIn && ` বর্তমান বাসস্থান: ${currentRound.target.currentlyLiveIn}।`}
                </p>
              </div>

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleNextRound}
                  className="inline-flex items-center gap-1.5 bg-[#1A3636] hover:bg-[#40534C] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  <span>{currentIndex + 1 < rounds.length ? 'পরবর্তী ছবি' : 'ফলাফল দেখুন'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quit Confirmation Dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <h3 className="text-lg font-serif font-bold text-[#1A3636] mb-1">
              খেলা থেকে বের হতে চান?
            </h3>
            <p className="text-xs text-[#736B65] mb-5">
              এখন বের হলে আপনার বর্তমান অগ্রগতি ও পয়েন্ট মুছে যাবে।
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
