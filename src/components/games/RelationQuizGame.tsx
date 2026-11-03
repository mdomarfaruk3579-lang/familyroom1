import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Award, Star, CheckCircle2, XCircle, RotateCcw, AlertTriangle, UserCheck, ChevronRight } from 'lucide-react';
import { Member } from '../../types';
import { generateQuizQuestions, RelationQuestion } from '../../utils/familyRelations';

interface RelationQuizGameProps {
  members: Member[];
  onBackToHub: () => void;
}

export const RelationQuizGame: React.FC<RelationQuizGameProps> = ({ members, onBackToHub }) => {
  // Step 1: Always start fresh from "Me" selection screen every time user enters
  const [myMember, setMyMember] = useState<Member | null>(null);

  const [questions, setQuestions] = useState<RelationQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start game when "Me" is picked
  const handleStartGame = (selected: Member) => {
    setMyMember(selected);
    const generated = generateQuizQuestions(selected, members);
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);
    setIsGameOver(false);
  };

  const handleRestart = () => {
    if (!myMember) return;
    const generated = generateQuizQuestions(myMember, members);
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);
    setIsGameOver(false);
  };

  const handleChangeMe = () => {
    setMyMember(null);
    setQuestions([]);
    setIsGameOver(false);
  };

  // 15-second Ring Timer
  useEffect(() => {
    if (!myMember || questions.length === 0 || isGameOver || isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up! Count as wrong answer
          handleOptionClick(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isGameOver, myMember, questions.length]);

  const handleOptionClick = (option: string | null) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(option);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = option === currentQ.correctRelation;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setIsGameOver(true);
    }
  };

  const handleBackPress = () => {
    if (myMember && !isGameOver && currentIndex > 0) {
      setShowQuitConfirm(true);
    } else {
      try {
        localStorage.removeItem('family_game_selected_me_id');
      } catch {}
      setMyMember(null);
      onBackToHub();
    }
  };

  // Star rating calculation
  const getStars = () => {
    if (score >= 9) return 3;
    if (score >= 6) return 2;
    if (score >= 3) return 1;
    return 0;
  };

  // -----------------------------------------------------------------
  // VIEW A: Select "Me" Screen
  // -----------------------------------------------------------------
  if (!myMember) {
    return (
      <div className="w-full max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToHub}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A3636] hover:text-[#40534C] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> মেনুতে ফিরুন
          </button>
          <span className="text-xs font-semibold px-3 py-1 bg-[#D6BD98]/30 text-[#1A3636] rounded-full border border-[#D6BD98]">
            ধাপ ১: নিজের নাম নির্বাচন
          </span>
        </div>

        <div className="bg-[#FAF9F6] border border-[#D6BD98]/60 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#1A3636] text-[#D6BD98] mx-auto flex items-center justify-center text-3xl shadow-md mb-3">
            👤
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636] mb-2">
            আপনি কে? নিজের নামটি বেছে নিন
          </h2>
          <p className="text-xs sm:text-sm text-[#40534C] max-w-md mx-auto mb-6 leading-relaxed">
            আপনার নির্বাচন করা নামের সাপেক্ষে পরিবারের অন্য সকল সদস্যের সাথে সঠিক রক্ত ও বৈবাহিক সম্পর্ক স্বয়ংক্রিয়ভাবে হিসাব করা হবে।
          </p>

          {/* Members Grid for Me */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {members.map(m => (
              <motion.button
                key={m.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStartGame(m)}
                className="p-3 rounded-2xl bg-white border border-[#D6BD98]/40 hover:border-[#1A3636] hover:shadow-md transition text-left flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D6BD98] bg-[#F7F3EA] shrink-0">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#1A3636]">
                      {m.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#1A3636] truncate group-hover:text-[#40534C]">
                    {m.name}
                  </h4>
                  <p className="text-[10px] text-[#736B65] truncate">
                    {m.role || m.type}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW B: Game Over / Results Screen
  // -----------------------------------------------------------------
  if (isGameOver) {
    const stars = getStars();
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl mx-auto py-8 px-4 text-center"
      >
        <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Confetti celebration top accent */}
          <div className="text-5xl mb-3">🎉</div>

          <h2 className="text-3xl font-serif font-bold text-[#1A3636] mb-1">
            খেলা সম্পন্ন হয়েছে!
          </h2>
          <p className="text-xs sm:text-sm text-[#40534C] mb-6">
            খেলোয়াড়: <strong className="text-[#1A3636]">{myMember.name}</strong>
          </p>

          {/* Stars */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map(starNum => (
              <motion.div
                key={starNum}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: starNum * 0.2 }}
              >
                <Star
                  className={`w-10 h-10 ${
                    starNum <= stars
                      ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                      : 'text-stone-300'
                  }`}
                />
              </motion.div>
            ))}
          </div>

          {/* Score Card */}
          <div className="bg-[#1A3636] text-white p-5 rounded-2xl mb-6 shadow-inner">
            <span className="text-xs uppercase tracking-wider text-[#D6BD98] block mb-1">আপনার চূড়ান্ত স্কোর</span>
            <span className="text-4xl font-serif font-bold text-amber-200 font-mono">
              {score} / {questions.length}
            </span>
            <p className="text-xs text-stone-300 mt-2">
              {score >= 9 ? 'অসাধারণ! আপনি আপনার পরিবারের সম্পর্কগুলো গভীরভাবে চেনেন।' :
               score >= 6 ? 'খুব ভালো! পারিবারিক সম্পর্ক সম্পর্কে আপনার সুন্দর ধারণা আছে।' :
               'ভালো চেষ্টা! আবার খেলে সম্পর্কের বন্ধন আরও চিনে নিন।'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#D6BD98]" /> আবার খেলুন
            </button>
            <button
              onClick={handleChangeMe}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F7F3EA] text-[#1A3636] border border-[#D6BD98] font-bold text-sm px-5 py-3 rounded-xl transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#1A3636]" /> অন্য সদস্য নির্বাচন
            </button>
            <button
              onClick={onBackToHub}
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold text-[#40534C] hover:text-[#1A3636] py-3 cursor-pointer"
            >
              মেনুতে ফিরুন
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW C: Active Question Round
  // -----------------------------------------------------------------
  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#EAE6DF] border-t-[#1A3636] mb-3"></div>
        <p className="text-sm font-medium text-[#1A3636]">সম্পর্কের প্রশ্নগুলো তৈরি হচ্ছে...</p>
        <button
          onClick={handleChangeMe}
          className="mt-4 text-xs text-[#40534C] hover:underline cursor-pointer"
        >
          অন্য নাম নির্বাচন করুন
        </button>
      </div>
    );
  }

  // Ring timer circle calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 15) * circumference;

  return (
    <div className="w-full max-w-xl mx-auto py-4 px-4 font-sans text-[#1F2A28]">
      {/* Top Header: Back Button, Progress & Quit Dialog */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBackPress}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1A3636] hover:text-[#40534C] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> প্রস্থান
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold bg-[#F7F3EA] px-3 py-1 rounded-full border border-[#D6BD98]/60 text-[#1A3636]">
          <span>আমি: <strong>{myMember.name}</strong></span>
        </div>

        {/* 15-second Ring Timer */}
        <div className="relative flex items-center justify-center w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r={radius}
              stroke="#EAE6DF"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              stroke={timeLeft <= 4 ? '#C85A38' : '#2E7D61'}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className={`absolute text-xs font-bold font-mono ${timeLeft <= 4 ? 'text-[#C85A38] animate-pulse' : 'text-[#1A3636]'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EAE6DF] h-2 rounded-full overflow-hidden mb-5">
        <div 
          className="bg-[#1A3636] h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#736B65] mb-2 px-1">
        <span>প্রশ্ন: <strong className="text-[#1A3636] font-mono">{currentIndex + 1}</strong> / {questions.length}</span>
        <span>বর্তমান স্কোর: <strong className="text-[#1A3636] font-mono">{score}</strong></span>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 sm:p-8 shadow-md text-center"
      >
        {/* Target Member Avatar */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-[#D6BD98] mx-auto mb-4 bg-white shadow-md relative">
          {currentQ.targetMember.photoUrl ? (
            <img 
              src={currentQ.targetMember.photoUrl} 
              alt={currentQ.targetMember.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-serif text-2xl font-bold text-[#1A3636] bg-[#F7F3EA]">
              {currentQ.targetMember.name.slice(0, 1)}
            </div>
          )}
        </div>

        {/* Question Text */}
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1A3636] mb-1">
          {currentQ.targetMember.name}
        </h3>
        <p className="text-xs sm:text-sm text-[#40534C] font-medium mb-6">
          আপনার (<strong>{myMember.name}</strong>-এর) কী হন?
        </p>

        {/* 4 Multiple Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {currentQ.options.map((option, oIdx) => {
            const isChosen = selectedOption === option;
            const isCorrect = option === currentQ.correctRelation;

            let btnStyle = 'bg-white border-[#D6BD98] text-[#1A3636] hover:border-[#1A3636] hover:bg-[#F7F3EA]';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-[#2E7D61] text-white border-[#2E7D61] shadow-md font-bold';
              } else if (isChosen && !isCorrect) {
                btnStyle = 'bg-[#C85A38] text-white border-[#C85A38] shadow-md';
              } else {
                btnStyle = 'bg-white/50 border-stone-200 text-stone-400 opacity-60';
              }
            }

            return (
              <motion.button
                key={oIdx}
                whileTap={{ scale: 0.98 }}
                disabled={isAnswered}
                onClick={() => handleOptionClick(option)}
                className={`min-h-[48px] p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all flex items-center justify-between px-4 cursor-pointer text-left ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />}
                {isAnswered && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-white shrink-0 ml-2" />}
              </motion.button>
            );
          })}
        </div>

        {/* Instant Feedback Explanation Banner */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-[#D6BD98]/40 text-left"
            >
              <div className={`p-4 rounded-2xl mb-4 ${
                selectedOption === currentQ.correctRelation 
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' 
                  : 'bg-rose-50 border border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 mb-1 font-bold text-xs sm:text-sm">
                  {selectedOption === currentQ.correctRelation ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>সঠিক উত্তর! অভিনন্দন।</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>সঠিক উত্তর ছিল: <strong>{currentQ.correctRelation}</strong></span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-light leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="inline-flex items-center gap-1.5 bg-[#1A3636] hover:bg-[#40534C] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  <span>{currentIndex + 1 < questions.length ? 'পরবর্তী প্রশ্ন' : 'ফলাফল দেখুন'}</span>
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
                  try {
                    localStorage.removeItem('family_game_selected_me_id');
                  } catch {}
                  setMyMember(null);
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
