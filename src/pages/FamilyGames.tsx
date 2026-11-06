import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Users, Layers, Award, Play } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';
import { defaultFamilyMembers } from '../data/defaultMembers';
import { RelationQuizGame } from '../components/games/RelationQuizGame';
import { FamilyTreePuzzleGame } from '../components/games/FamilyTreePuzzleGame';
import { PhotoGuessGame } from '../components/games/PhotoGuessGame';
import { FamilyRunnerGame } from '../components/games/runner/FamilyRunnerGame';
import { FamilyLudoGame } from '../components/games/ludo/FamilyLudoGame';

type ActiveGame = 'menu' | 'quiz' | 'puzzle' | 'photo' | 'runner' | 'ludo';

export default function FamilyGames() {
  const [searchParams, setSearchParams] = useSearchParams();
  const gameParam = searchParams.get('play') as ActiveGame | null;
  const activeGame: ActiveGame = 
    gameParam === 'quiz' || gameParam === 'puzzle' || gameParam === 'photo' || gameParam === 'runner' || gameParam === 'ludo'
      ? gameParam 
      : 'menu';

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem('family_members_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultFamilyMembers;
  });

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
          setMembers(data);
          try {
            localStorage.setItem('family_members_cache', JSON.stringify(data));
          } catch {}
        }
      },
      () => {
        // quota fallback already loaded
      }
    );
    return () => unsub();
  }, []);

  const setGame = (game: ActiveGame) => {
    if (game === 'menu') {
      searchParams.delete('play');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ play: game });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#1F2A28] py-4 sm:py-8 px-3 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        {activeGame === 'menu' && (
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1A3636] hover:text-[#40534C] bg-white px-3.5 py-1.5 rounded-full border border-[#D6BD98]/60 shadow-2xs transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#1A3636]" />
              <span>হোমে ফিরে যান</span>
            </Link>

            <span className="text-xs font-semibold px-3 py-1 bg-[#D6BD98]/30 text-[#1A3636] rounded-full border border-[#D6BD98]">
              পারিবারিক বিনোদন
            </span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: Main Games Menu Hub */}
        {/* ------------------------------------------------------------- */}
        {activeGame === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            {/* Header: Title + One-line Tagline */}
            <div className="text-center mb-8 sm:mb-10">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-14 h-14 rounded-2xl bg-[#1A3636] text-[#D6BD98] mx-auto flex items-center justify-center text-2xl shadow-md mb-3"
              >
                🎮
              </motion.div>
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1A3636] mb-2 tracking-tight">
                ফ্যামিলি গেম
              </h1>
              <p className="text-sm sm:text-base text-[#40534C] font-normal max-w-lg mx-auto leading-relaxed">
                পারিবারিক বন্ধন ও বংশলতার সম্পর্ককে চেনার এক মননশীল ও আনন্দময় খেলাঘর
              </p>
              <div className="w-20 h-0.5 bg-[#D6BD98] mx-auto mt-4 rounded-full"></div>
            </div>

            {/* 4 Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
              
              {/* Card 1: ফ্যামিলি রানার (Featured 3D Runner) */}
              <motion.div
                whileHover={{ scale: 1.025, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-[#FAF9F6] to-[#F5EFEB] border-2 border-amber-500/80 rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1A3636] to-[#40534C] text-[#D6BD98] flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                      🏃
                    </span>
                    <span className="text-[10px] font-bold bg-amber-400 text-stone-950 px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
                      নতুন ৩ডি গেম
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A3636] mb-2 group-hover:text-[#40534C] transition-colors flex items-center gap-1.5">
                    <span>ফ্যামিলি রানার</span>
                    <span className="text-xs font-mono font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">3D</span>
                  </h3>

                  <p className="text-xs text-[#40534C] font-light leading-relaxed mb-5">
                    দাদার হারানো সিন্দুকের চাবি উদ্ধারে চার প্রজন্মের রোমাঞ্চকর রিলে রান। নিজের অবতার তৈরি করে ৪টি ঐতিহাসিক যুগে দৌড়ান।
                  </p>
                </div>

                <div className="pt-3.5 border-t border-[#D6BD98]/40 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-800">৪ প্রজন্মের রিলে</span>
                  <button
                    onClick={() => setGame('runner')}
                    className="inline-flex items-center gap-1.5 bg-[#1A3636] hover:bg-[#40534C] text-white font-bold text-xs px-5 py-2 rounded-full shadow-md group-hover:shadow-lg transition cursor-pointer"
                  >
                    <span>খেলুন</span>
                    <Play className="w-3 h-3 fill-white" />
                  </button>
                </div>
              </motion.div>

              {/* Card 2: কে কার কী? */}
              <motion.div
                whileHover={{ scale: 1.025, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-[#1A3636] text-[#D6BD98] flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      🤔
                    </span>
                    <span className="text-[10px] font-bold bg-[#D6BD98]/40 text-[#1A3636] px-2.5 py-1 rounded-full border border-[#D6BD98]">
                      ১০টি প্রশ্ন
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A3636] mb-2 group-hover:text-[#40534C] transition-colors">
                    কে কার কী?
                  </h3>

                  <p className="text-xs text-[#40534C] font-light leading-relaxed mb-5">
                    নিজের নাম নির্বাচন করুন এবং ছবির মানুষটি আপনার কী হন (চাচা, মামা, ফুফা, খালা) সঠিক সম্পর্ক বেছে নিন।
                  </p>
                </div>

                <div className="pt-3.5 border-t border-[#D6BD98]/40 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#736B65]">১৫ সেকেন্ড টাইমার</span>
                  <button
                    onClick={() => setGame('quiz')}
                    className="inline-flex items-center gap-1.5 bg-[#1A3636] hover:bg-[#40534C] text-white font-bold text-xs px-5 py-2 rounded-full shadow-md group-hover:shadow-lg transition cursor-pointer"
                  >
                    <span>খেলুন</span>
                    <Play className="w-3 h-3 fill-white" />
                  </button>
                </div>
              </motion.div>

              {/* Card 3: ছবি দেখে বলুন */}
              <motion.div
                whileHover={{ scale: 1.025, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-[#1A3636] text-[#D6BD98] flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      📸
                    </span>
                    <span className="text-[10px] font-bold bg-[#D6BD98]/40 text-[#1A3636] px-2.5 py-1 rounded-full border border-[#D6BD98]">
                      ৫ জনের ছবি
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A3636] mb-2 group-hover:text-[#40534C] transition-colors">
                    ছবি দেখে বলুন
                  </h3>

                  <p className="text-xs text-[#40534C] font-light leading-relaxed mb-5">
                    পরিবারের সদস্যদের ছবি দেখে তাঁদের সঠিক নাম বলুন। দৈবচয়নভাবে আসা ৫ জনের ছবি দেখে স্মৃতি পরীক্ষা করুন।
                  </p>
                </div>

                <div className="pt-3.5 border-t border-[#D6BD98]/40 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#736B65]">ছবি কুইজ</span>
                  <button
                    onClick={() => setGame('photo')}
                    className="inline-flex items-center gap-1.5 bg-[#1A3636] hover:bg-[#40534C] text-white font-bold text-xs px-5 py-2 rounded-full shadow-md group-hover:shadow-lg transition cursor-pointer"
                  >
                    <span>খেলুন</span>
                    <Play className="w-3 h-3 fill-white" />
                  </button>
                </div>
              </motion.div>

              {/* Card 4: বংশলতা পাজল */}
              <motion.div
                whileHover={{ scale: 1.025, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-[#1A3636] text-[#D6BD98] flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      🧩
                    </span>
                    <span className="text-[10px] font-bold bg-[#D6BD98]/40 text-[#1A3636] px-2.5 py-1 rounded-full border border-[#D6BD98]">
                      ২-৪ প্রজন্ম
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A3636] mb-2 group-hover:text-[#40534C] transition-colors">
                    বংশলতা পাজল
                  </h3>

                  <p className="text-xs text-[#40534C] font-light leading-relaxed mb-5">
                    বংশলতার শূন্যস্থানগুলোতে ড্র্যাগ অথবা ট্যাপ করে পরিবারের সদস্যদের সঠিক প্রজন্মের শাখায় স্থাপন করুন।
                  </p>
                </div>

                <div className="pt-3.5 border-t border-[#D6BD98]/40 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#736B65]">ইন্টারেক্টিভ ট্রি</span>
                  <button
                    onClick={() => setGame('puzzle')}
                    className="inline-flex items-center gap-1.5 bg-[#1A3636] hover:bg-[#40534C] text-white font-bold text-xs px-5 py-2 rounded-full shadow-md group-hover:shadow-lg transition cursor-pointer"
                  >
                    <span>খেলুন</span>
                    <Play className="w-3 h-3 fill-white" />
                  </button>
                </div>
              </motion.div>

              {/* Card 5: ফ্যামিলি লুডু (Classic & Snakes & Ladders, 2-6 players & AI) */}
              <motion.div
                whileHover={{ scale: 1.025, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-[#FAF9F6] to-[#F5EFEB] border-2 border-emerald-600/70 rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden md:col-span-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-amber-300 flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                      🎲
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold bg-amber-400 text-stone-950 px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
                        ২-৬ জন ও কম্পিউটার
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-700 text-white px-2.5 py-1 rounded-full shadow-xs">
                        সাপ লুডু সহ
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1A3636] mb-2 group-hover:text-[#40534C] transition-colors flex items-center gap-2">
                    <span>ফ্যামিলি লুডু</span>
                    <span className="text-xs font-mono font-normal text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Classic & Snakes</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-[#40534C] font-light leading-relaxed mb-5 max-w-2xl">
                    পরিবারের ২ থেকে ৬ জন সদস্য বা রোবট কম্পিউটারের সাথে ক্লাসিক লুডু ও ঐতিহ্যবাহী ১০০ ঘরের সাপ লুডু খেলুন। পাশা ঘোরান, ঘুঁটি চালান এবং পারিবারিক গুণ ও মই বেয়ে সবার আগে বিজয়ী হোন!
                  </p>
                </div>

                <div className="pt-3.5 border-t border-[#D6BD98]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <span>🎲 ক্লাসিক ৪ ঘুঁটি</span>
                    <span>•</span>
                    <span>🐍 সাপ ও পারিবারিক মই</span>
                  </div>
                  <button
                    onClick={() => setGame('ludo')}
                    className="inline-flex items-center gap-1.5 bg-[#1A3636] hover:bg-[#40534C] text-white font-bold text-xs px-5 py-2 rounded-full shadow-md group-hover:shadow-lg transition cursor-pointer"
                  >
                    <span>খেলুন</span>
                    <Play className="w-3 h-3 fill-white" />
                  </button>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: GAME 1 - ফ্যামিলি রানার (3D Runner) */}
        {/* ------------------------------------------------------------- */}
        {activeGame === 'runner' && (
          <FamilyRunnerGame
            members={members}
            onBackToHub={() => setGame('menu')}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: GAME 2 - কে কার কী? */}
        {/* ------------------------------------------------------------- */}
        {activeGame === 'quiz' && (
          <RelationQuizGame
            members={members}
            onBackToHub={() => setGame('menu')}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: GAME 3 - ছবি দেখে বলুন */}
        {/* ------------------------------------------------------------- */}
        {activeGame === 'photo' && (
          <PhotoGuessGame
            members={members}
            onBackToHub={() => setGame('menu')}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: GAME 4 - বংশলতা পাজল */}
        {/* ------------------------------------------------------------- */}
        {activeGame === 'puzzle' && (
          <FamilyTreePuzzleGame
            members={members}
            onBackToHub={() => setGame('menu')}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 6: GAME 5 - ফ্যামিলি লুডু (Classic & Snakes) */}
        {/* ------------------------------------------------------------- */}
        {activeGame === 'ludo' && (
          <FamilyLudoGame
            members={members}
            onBackToHub={() => setGame('menu')}
          />
        )}

      </div>
    </div>
  );
}
