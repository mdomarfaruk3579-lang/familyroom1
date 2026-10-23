import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Search, Heart, Moon, Sparkles, BookOpen, 
  Compass, CheckCircle2, Circle, Plus, Trash2, Calendar, 
  UserCheck, Shield, ChevronDown, ChevronUp, Share2, 
  ExternalLink, Volume2, X, RefreshCw, Star
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';
import { useAuth } from '../AuthContext';
import { IslamicCgiBackground } from '../components/islamic/IslamicCgiBackground';
import { defaultMaghfiratDuas, DeceasedRecord } from '../data/islamic/cemeteryData';
import { authenticDuas, DUA_CATEGORIES, DuaItem } from '../data/islamic/duasData';
import { familyHadiths, HADITH_TOPICS, FamilyHadithItem } from '../data/islamic/familyHadithsData';
import { ramadanDuas, ramadanSurahs, ramadanHadiths } from '../data/islamic/ramadanData';
import { janazaSteps, childJanazaDuas, JanazaStep } from '../data/islamic/janazaGuideData';
import { burialSteps, graveHadiths } from '../data/islamic/burialGuideData';
import { allIslamicNames, generateBabyNamesFromParents, IslamicNameItem, GeneratedNameResult } from '../data/islamic/islamicNamesData';

type IslamicModuleId = 'hub' | 'cemetery' | 'duas' | 'hadith' | 'ramadan' | 'janaza' | 'burial' | 'names';

interface ModuleCardInfo {
  id: IslamicModuleId;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  gradient: string;
}

const MODULE_CARDS: ModuleCardInfo[] = [
  {
    id: 'cemetery',
    title: '১. কবরস্থান ও মরহুমদের স্মরণ',
    subtitle: 'মরহুম সদস্যদের তথ্য, কবর জিয়ারত ও মাগফিরাতের দোয়াসমূহ',
    icon: '🕊️',
    badge: 'মরহুম স্মরণ',
    gradient: 'from-emerald-950 via-teal-900 to-stone-900'
  },
  {
    id: 'duas',
    title: '২. দোয়া',
    subtitle: '২০০+ বিশুদ্ধ দোয়া: উচ্চারণ, বাংলা অর্থ ও সহীহ রেফারেন্সসহ',
    icon: '🤲',
    badge: '২০০+ দোয়া',
    gradient: 'from-emerald-900 via-teal-950 to-emerald-950'
  },
  {
    id: 'hadith',
    title: '৩. হাদিস',
    subtitle: 'পরিবার, পিতা-মাতা ও আত্মীয়তার সম্পর্ক নিয়ে ১০০+ বিশুদ্ধ হাদিস',
    icon: '📖',
    badge: '১০০+ হাদিস',
    gradient: 'from-teal-950 via-emerald-900 to-stone-900'
  },
  {
    id: 'ramadan',
    title: '৪. রমজান',
    subtitle: '৩০ দিনের রোজা ট্র্যাকার, রমজানের দোয়া, সূরা ও ফযীলতপূর্ণ হাদিস',
    icon: '🌙',
    badge: '৩০ দিন ট্র্যাকার',
    gradient: 'from-amber-950 via-emerald-950 to-teal-950'
  },
  {
    id: 'janaza',
    title: '৫. জানাজার নামাজ',
    subtitle: 'স্টেপ-বাই-স্টেপ ভিজ্যুয়াল নির্দেশনা, চার তাকবীর ও পূর্ণাঙ্গ দোয়া',
    icon: '🕌',
    badge: 'ভিজ্যুয়াল গাইড',
    gradient: 'from-emerald-950 via-stone-900 to-teal-950'
  },
  {
    id: 'burial',
    title: '৬. কবর',
    subtitle: 'মরহুমকে মাটি দেওয়া, ৩ অঞ্জলি মাটির দোয়া ও কবর সংক্রান্ত হাদিস',
    icon: '🌱',
    badge: 'দাফন ও দোয়া',
    gradient: 'from-stone-900 via-teal-950 to-emerald-950'
  },
  {
    id: 'names',
    title: '৭. ইসলামিক নাম',
    subtitle: '১০০০+ ছেলে ও মেয়ের ইসলামিক নাম ও পিতা-মাতার নাম মেলানো জেনারেটর',
    icon: '✨',
    badge: '১০০০+ নাম ও জেনারেটর',
    gradient: 'from-teal-900 via-emerald-950 to-amber-950'
  }
];

export default function IslamicHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Active module view
  const currentTab = (searchParams.get('tab') as IslamicModuleId) || 'hub';
  const setActiveTab = (tab: IslamicModuleId) => {
    if (tab === 'hub') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Members data from Firestore/cache
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem('family_members_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
          setMembers(list);
          try {
            localStorage.setItem('family_members_cache', JSON.stringify(list));
          } catch {}
        }
      },
      () => {
        // quota limit/offline: keep cached
      }
    );
    return () => unsub();
  }, []);

  // -------------------------------------------------------------
  // Module 1: Cemetery & Deceased State
  // -------------------------------------------------------------
  const [customDeceased, setCustomDeceased] = useState<DeceasedRecord[]>(() => {
    try {
      const saved = localStorage.getItem('family_custom_deceased_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [newDeceasedName, setNewDeceasedName] = useState('');
  const [newDeceasedYear, setNewDeceasedYear] = useState('');
  const [newDeceasedRelation, setNewDeceasedRelation] = useState('');
  const [newDeceasedGraveyard, setNewDeceasedGraveyard] = useState('');
  const [newDeceasedDesc, setNewDeceasedDesc] = useState('');
  const [showAddDeceasedModal, setShowAddDeceasedModal] = useState(false);

  const handleAddCustomDeceased = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeceasedName.trim()) return;
    const newRecord: DeceasedRecord = {
      id: `custom-dec-${Date.now()}`,
      name: newDeceasedName.trim(),
      deathDateOrYear: newDeceasedYear.trim() || 'অজ্ঞাত',
      relation: newDeceasedRelation.trim() || 'পারিবারিক সদস্য',
      graveyardName: newDeceasedGraveyard.trim() || 'পারিবারিক কবরস্থান',
      description: newDeceasedDesc.trim(),
      isCustom: true
    };
    const updated = [newRecord, ...customDeceased];
    setCustomDeceased(updated);
    try {
      localStorage.setItem('family_custom_deceased_records', JSON.stringify(updated));
    } catch {}
    setNewDeceasedName('');
    setNewDeceasedYear('');
    setNewDeceasedRelation('');
    setNewDeceasedGraveyard('');
    setNewDeceasedDesc('');
    setShowAddDeceasedModal(false);
  };

  const handleDeleteCustomDeceased = (id: string) => {
    if (!window.confirm('আপনি কি এই মরহুমের রেকর্ডটি মুছে ফেলতে চান?')) return;
    const updated = customDeceased.filter(d => d.id !== id);
    setCustomDeceased(updated);
    try {
      localStorage.setItem('family_custom_deceased_records', JSON.stringify(updated));
    } catch {}
  };

  // Combine deceased members from tree + custom records
  const allDeceasedPersons = useMemo(() => {
    const fromTree: DeceasedRecord[] = members
      .filter(m => m.isDeceased || (m.deathYear && m.deathYear.trim().length > 0))
      .map(m => ({
        id: m.id,
        name: m.name,
        nameEn: m.nameEn,
        relation: m.role || m.type,
        deathDateOrYear: m.deathYear || 'অজ্ঞাত',
        description: m.bio || 'পরিবারের চিরস্মরণীয় শ্রদ্ধেয় সদস্য। আল্লাহ তাআলা উনাকে জান্নাতুল ফিরদাউস নসিব করুন।',
        graveyardName: 'পারিবারিক কবরস্থান',
        isCustom: false
      }));

    return [...fromTree, ...customDeceased];
  }, [members, customDeceased]);

  // -------------------------------------------------------------
  // Module 2: Duas State
  // -------------------------------------------------------------
  const [duaSearch, setDuaSearch] = useState('');
  const [selectedDuaCategory, setSelectedDuaCategory] = useState<string>('সকল দোয়া');
  const [expandedDuaId, setExpandedDuaId] = useState<string | null>(null);

  const filteredDuas = useMemo(() => {
    const q = duaSearch.trim().toLowerCase();
    return authenticDuas.filter(item => {
      const matchCat = selectedDuaCategory === 'সকল দোয়া' || item.category === selectedDuaCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.pronunciation.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q)
      );
    });
  }, [duaSearch, selectedDuaCategory]);

  // -------------------------------------------------------------
  // Module 3: Hadith State
  // -------------------------------------------------------------
  const [hadithSearch, setHadithSearch] = useState('');
  const [selectedHadithTopic, setSelectedHadithTopic] = useState<string>('সব হাদিস');

  const filteredHadiths = useMemo(() => {
    const q = hadithSearch.trim().toLowerCase();
    return familyHadiths.filter(item => {
      const matchTopic = selectedHadithTopic === 'সব হাদিস' || item.topic === selectedHadithTopic;
      if (!matchTopic) return false;
      if (!q) return true;
      return (
        item.textBn.toLowerCase().includes(q) ||
        item.narrator.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q)
      );
    });
  }, [hadithSearch, selectedHadithTopic]);

  // -------------------------------------------------------------
  // Module 4: Ramadan Tracker State
  // -------------------------------------------------------------
  interface RamadanDayTrack {
    day: number;
    fasted: boolean;
    sehri: boolean;
    iftar: boolean;
    taraweeh: boolean;
    quran: boolean;
  }

  const [ramadanDays, setRamadanDays] = useState<RamadanDayTrack[]>(() => {
    try {
      const saved = localStorage.getItem('family_ramadan_30_days_tracker');
      if (saved) return JSON.parse(saved);
    } catch {}
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      fasted: false,
      sehri: false,
      iftar: false,
      taraweeh: false,
      quran: false
    }));
  });

  const toggleRamadanField = (dayNum: number, field: keyof Omit<RamadanDayTrack, 'day'>) => {
    const updated = ramadanDays.map(d => {
      if (d.day === dayNum) {
        return { ...d, [field]: !d[field] };
      }
      return d;
    });
    setRamadanDays(updated);
    try {
      localStorage.setItem('family_ramadan_30_days_tracker', JSON.stringify(updated));
    } catch {}
  };

  const fastedCount = useMemo(() => ramadanDays.filter(d => d.fasted).length, [ramadanDays]);

  // -------------------------------------------------------------
  // Module 5: Janaza Interactive Step
  // -------------------------------------------------------------
  const [activeJanazaStep, setActiveJanazaStep] = useState<number>(1);
  const [childGenderTab, setChildGenderTab] = useState<'boy' | 'girl'>('boy');

  // -------------------------------------------------------------
  // Module 7: Islamic Names State & Generator
  // -------------------------------------------------------------
  const [nameGenderFilter, setNameGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [nameSearch, setNameSearch] = useState('');
  const [nameLetterFilter, setNameLetterFilter] = useState('');

  // Generator inputs
  const [genFatherName, setGenFatherName] = useState('');
  const [genMotherName, setGenMotherName] = useState('');
  const [genGenderPref, setGenGenderPref] = useState<'all' | 'boy' | 'girl'>('all');
  const [generatedResults, setGeneratedResults] = useState<GeneratedNameResult[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleRunGenerator = (e: React.FormEvent) => {
    e.preventDefault();
    const results = generateBabyNamesFromParents(genFatherName, genMotherName, genGenderPref);
    setGeneratedResults(results);
    setHasGenerated(true);
  };

  const filteredNames = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    return allIslamicNames.filter(item => {
      const matchGender = nameGenderFilter === 'all' || item.gender === nameGenderFilter;
      if (!matchGender) return false;
      const matchLetter = !nameLetterFilter || item.letter === nameLetterFilter;
      if (!matchLetter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.nameAr.includes(q) ||
        item.origin.toLowerCase().includes(q)
      );
    });
  }, [nameGenderFilter, nameLetterFilter, nameSearch]);

  const uniqueLetters = useMemo(() => {
    const set = new Set<string>();
    allIslamicNames.forEach(n => {
      if (n.letter) set.add(n.letter);
    });
    return Array.from(set).sort();
  }, []);

  return (
    <div className="min-h-screen text-amber-50 relative pb-28 pt-2 sm:pt-4">
      {/* Dynamic Ambient Islamic CGI Canvas Background */}
      <IslamicCgiBackground />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6">
        
        {/* Top Spiritual Header & Navigation */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10 pt-2">
          
          {/* Breadcrumb row: Back button on Left, Badge on Right */}
          <div className="w-full flex items-center justify-between flex-wrap gap-2 mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-amber-200/90 hover:text-amber-100 bg-emerald-950/70 hover:bg-emerald-900/80 px-3.5 py-1.5 rounded-full border border-amber-400/30 text-xs sm:text-sm font-medium transition backdrop-blur-md shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>ফ্যামিলি ট্রিতে ফিরে যান</span>
            </Link>

            {currentTab !== 'hub' && (
              <button
                onClick={() => setActiveTab('hub')}
                className="inline-flex items-center gap-1.5 text-xs bg-amber-400/20 text-amber-200 border border-amber-400/40 px-3 py-1.5 rounded-full hover:bg-amber-400/30 transition cursor-pointer backdrop-blur-md"
              >
                <span>মূল মেনুতে ফিরুন</span>
                <Compass className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}
          </div>

          {/* Bismillah Calligraphy Header with Soft Golden Radiance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-2"
          >
            <p className="font-serif text-lg sm:text-2xl text-amber-200/90 tracking-widest drop-shadow-md select-none font-medium">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-[11px] sm:text-xs text-amber-300/70 italic mt-0.5">
              পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে
            </p>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 drop-shadow-md mt-1 mb-2"
          >
            ফ্যামিলি ইসলামিক
          </motion.h1>

          <p className="max-w-xl text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
            পারিবারিক বরকত, কুরআন-সুন্নাহর বিশুদ্ধ হেদায়াত, দোয়াসমূহ ও নেককার পূর্বসূরিদের পুণ্যময় স্মরণ
          </p>

          {/* Quick Module Shortcut Pills (When inside a sub-tab) */}
          {currentTab !== 'hub' && (
            <div className="flex items-center justify-center flex-wrap gap-1.5 mt-4 max-w-3xl">
              {MODULE_CARDS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                    currentTab === m.id
                      ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold shadow-sm'
                      : 'bg-emerald-950/60 text-amber-100/80 border-amber-400/20 hover:bg-emerald-900/60'
                  }`}
                >
                  <span className="mr-1">{m.icon}</span>
                  {m.badge}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 0: MAIN HUB OVERVIEW (3 CARDS PER ROW GRID) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'hub' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* 3 cards per row responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {MODULE_CARDS.map((item, idx) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.025, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    relative group rounded-3xl p-6 sm:p-7 cursor-pointer transition-all duration-300
                    bg-gradient-to-br ${item.gradient} border border-amber-400/30 hover:border-amber-300/80
                    shadow-xl hover:shadow-2xl hover:shadow-amber-400/10 backdrop-blur-md flex flex-col justify-between
                    overflow-hidden
                  `}
                >
                  {/* Subtle inner background ornament */}
                  <div className="absolute -right-6 -bottom-6 text-7xl sm:text-8xl opacity-10 group-hover:opacity-20 transition-opacity select-none pointer-events-none">
                    {item.icon}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl sm:text-4xl p-2 rounded-2xl bg-white/10 border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <span className="text-[11px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/40 px-2.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 group-hover:text-amber-200 mb-2 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-light">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-amber-400/20 flex items-center justify-between text-xs font-medium text-amber-300 group-hover:text-amber-200">
                    <span>প্রবেশ করুন ও দেখুন</span>
                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODULE 1: কবরস্থান ও মরহুমদের স্মরণ */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'cemetery' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Header description */}
            <div className="bg-emerald-950/70 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🕊️</span>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                      কবরস্থান ও মরহুমদের স্মরণ
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300">
                      আমাদের পরিবারের যে শ্রদ্ধেয় প্রিয়জনেরা ইন্তেকাল করেছেন তাঁদের স্মৃতি ও তাঁদের জন্য মাগফিরাতের দোয়াসমূহ
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setShowAddDeceasedModal(true)}
                    className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 px-4 py-2 rounded-full font-semibold text-xs sm:text-sm transition cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>মরহুমের নতুন তথ্য যোগ করুন</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-amber-200/80 bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3">
                নবীজি (সা.) বলেছেন: <em>“মানুষ যখন মারা যায় তখন তার সব আমল বন্ধ হয়ে যায়; তবে তিনটি আমল জারি থাকে—সদকায়ে জাড়িয়াহ, উপকারী ইলম, এবং নেক সন্তান যে তার পিতামাতা ও মরহুমদের জন্য দোয়া করে।”</em> (সহীহ মুসলিম: ১৬৩১)
              </div>
            </div>

            {/* Deceased Members Grid */}
            <div>
              <h3 className="text-xl font-serif font-bold text-amber-200 mb-4 flex items-center gap-2">
                <span>স্মরণীয় মরহুম পরিবারবর্গ</span>
                <span className="text-xs font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  {allDeceasedPersons.length} জন
                </span>
              </h3>

              {allDeceasedPersons.length === 0 ? (
                <div className="bg-emerald-950/50 rounded-2xl p-8 text-center border border-amber-400/20">
                  <p className="text-stone-300 text-sm">বর্তমানে কোনো মরহুম সদস্যের তথ্য তালিকাভুক্ত নেই।</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddDeceasedModal(true)}
                      className="mt-3 text-xs bg-amber-400 text-stone-950 px-3.5 py-1.5 rounded-full font-semibold"
                    >
                      প্রথম মরহুমের নাম যোগ করুন
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {allDeceasedPersons.map((person) => (
                    <div
                      key={person.id}
                      className="bg-emerald-950/80 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-lg relative group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-lg sm:text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
                              <span>{person.name}</span>
                              <span className="text-[10px] bg-stone-800 text-amber-200/90 px-2 py-0.5 rounded-full border border-stone-700">
                                মরহুম / মরহুমা
                              </span>
                            </h4>
                            {person.nameEn && (
                              <p className="text-xs text-amber-300/70 font-sans italic">{person.nameEn}</p>
                            )}
                          </div>

                          {isAdmin && person.isCustom && (
                            <button
                              onClick={() => handleDeleteCustomDeceased(person.id)}
                              className="text-stone-400 hover:text-red-400 p-1 rounded-lg transition"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-300 mb-3">
                          {person.relation && (
                            <div>সম্পর্ক: <strong className="text-amber-200">{person.relation}</strong></div>
                          )}
                          <div>ইন্তেকাল / সাল: <strong className="text-amber-300 font-mono">{person.deathDateOrYear}</strong></div>
                          {person.graveyardName && (
                            <div>কবরস্থান: <strong className="text-emerald-300">{person.graveyardName}</strong></div>
                          )}
                        </div>

                        {person.description && (
                          <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-light border-t border-amber-400/10 pt-2.5">
                            {person.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-amber-400/10 flex items-center justify-between text-[11px] text-amber-300/80">
                        <span>রাহিমাহুল্লাহ (আল্লাহ উনার ওপর রহম করুন)</span>
                        <span className="font-arabic text-sm">اللَّهُمَّ اغْفِرْ لَهُ</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maghfirat & Grave Ziyarat Duas Section */}
            <div className="mt-10">
              <div className="mb-4">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-200 flex items-center gap-2">
                  <span>মাগফিরাত ও কবর জিয়ারতের বিশেষ দোয়াসমূহ</span>
                </h3>
                <p className="text-xs sm:text-sm text-stone-300">
                  কবরস্থানে দাঁড়িয়ে বা মরহুম পিতা-মাতা ও আত্মীয়দের জন্য ঘরে বসেই এই দোয়াগুলো নিয়মিত পাঠ করা সুন্নাত
                </p>
              </div>

              <div className="space-y-4">
                {defaultMaghfiratDuas.map((d, index) => (
                  <div
                    key={index}
                    className="bg-emerald-950/75 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-amber-400/30 shadow-lg"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <h4 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                        {d.title}
                      </h4>
                      <span className="text-[11px] font-mono bg-emerald-900/60 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                        {d.reference}
                      </span>
                    </div>

                    <p className="text-xl sm:text-2xl text-right font-arabic leading-loose text-amber-100 my-3 tracking-wide select-all">
                      {d.arabic}
                    </p>

                    <div className="bg-black/25 rounded-xl p-3 sm:p-4 my-2 border border-white/5 space-y-2">
                      <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
                        <strong className="text-amber-300">উচ্চারণ:</strong> {d.pronunciation}
                      </p>
                      <p className="text-xs sm:text-sm text-stone-200 font-light leading-relaxed">
                        <strong className="text-amber-300">বাংলা অর্থ:</strong> {d.meaning}
                      </p>
                    </div>

                    {d.context && (
                      <p className="text-[11px] text-stone-400 italic mt-2">
                        নোট: {d.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal for Admin to Add Custom Deceased */}
            {showAddDeceasedModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                <div className="bg-[#0b3329] border border-amber-400/50 rounded-3xl p-6 sm:p-7 max-w-lg w-full text-left text-amber-50 shadow-2xl relative">
                  <button
                    onClick={() => setShowAddDeceasedModal(false)}
                    className="absolute top-5 right-5 text-stone-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-xl font-serif font-bold text-amber-200 mb-1">
                    মরহুমের নতুন তথ্য সংরক্ষণ
                  </h3>
                  <p className="text-xs text-stone-300 mb-4">
                    পরিবারের প্রয়াত সদস্যের নাম, মৃত্যু সাল ও সংক্ষিপ্ত পরিচিতি দিন
                  </p>

                  <form onSubmit={handleAddCustomDeceased} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1">পূর্ণ নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="মরহুমের নাম"
                        value={newDeceasedName}
                        onChange={e => setNewDeceasedName(e.target.value)}
                        className="w-full bg-emerald-950 border border-amber-400/40 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-amber-200 mb-1">ইন্তেকাল / সাল</label>
                        <input
                          type="text"
                          placeholder="যেমন: 2018 বা 12 মার্চ"
                          value={newDeceasedYear}
                          onChange={e => setNewDeceasedYear(e.target.value)}
                          className="w-full bg-emerald-950 border border-amber-400/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-amber-200 mb-1">সম্পর্ক</label>
                        <input
                          type="text"
                          placeholder="যেমন: দাদা, চাচা, বড় খালা"
                          value={newDeceasedRelation}
                          onChange={e => setNewDeceasedRelation(e.target.value)}
                          className="w-full bg-emerald-950 border border-amber-400/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1">কবরস্থান (ঐচ্ছিক)</label>
                      <input
                        type="text"
                        placeholder="যেমন: পারিবারিক গোরস্থান, আজিমপুর ইত্যাদি"
                        value={newDeceasedGraveyard}
                        onChange={e => setNewDeceasedGraveyard(e.target.value)}
                        className="w-full bg-emerald-950 border border-amber-400/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1">সংক্ষিপ্ত বিবরণ ও নেক স্মৃতি</label>
                      <textarea
                        rows={3}
                        placeholder="মরহুমের জীবনের ভালো স্মৃতি বা দোয়ার কথা..."
                        value={newDeceasedDesc}
                        onChange={e => setNewDeceasedDesc(e.target.value)}
                        className="w-full bg-emerald-950 border border-amber-400/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-300"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddDeceasedModal(false)}
                        className="px-4 py-2 rounded-xl text-xs bg-stone-700 hover:bg-stone-600 text-white cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer shadow-md"
                      >
                        সংরক্ষণ করুন
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODULE 2: দোয়া (200+ Authentic Duas) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'duas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-emerald-950/70 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🤲</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                    বিশুদ্ধ দোয়ার ভাণ্ডার
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300">
                    দৈনন্দিন জীবন, নামাজ, রোগমুক্তি, বিপদ-আপদ ও পরিবারের জন্য ২০০+ নির্ভরযোগ্য সুন্নাহ ও কুরআনিক দোয়া
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-amber-300 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={duaSearch}
                  onChange={e => setDuaSearch(e.target.value)}
                  placeholder="যেকোনো দোয়ার শিরোনাম, উচ্চারণ, বাংলা অর্থ বা হাদিস দিয়ে খুঁজুন..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-black/40 border border-amber-400/40 rounded-full text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-300 font-medium"
                />
                {duaSearch && (
                  <button onClick={() => setDuaSearch('')} className="absolute right-3.5 top-3 text-stone-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {DUA_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDuaCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs shrink-0 cursor-pointer border transition ${
                      selectedDuaCategory === cat
                        ? 'bg-amber-400 text-stone-950 font-bold border-amber-300 shadow-sm'
                        : 'bg-emerald-900/50 text-amber-100/90 border-amber-400/20 hover:bg-emerald-800/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Duas List */}
            <div className="flex items-center justify-between text-xs text-stone-300 px-2">
              <span>মোট দোয়া প্রদর্শিত: <strong className="text-amber-300 font-mono">{filteredDuas.length}</strong> টি</span>
              <span className="text-stone-400">দোয়ায় ক্লিক করলেই আরবি, উচ্চারণ ও অর্থ উন্মুক্ত হবে</span>
            </div>

            <div className="space-y-3">
              {filteredDuas.map((dua) => {
                const isExpanded = expandedDuaId === dua.id;
                return (
                  <div
                    key={dua.id}
                    className="bg-emerald-950/75 backdrop-blur-md rounded-2xl border border-amber-400/25 hover:border-amber-400/50 transition-all shadow-md overflow-hidden"
                  >
                    {/* Header bar: click to expand */}
                    <button
                      onClick={() => setExpandedDuaId(isExpanded ? null : dua.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-amber-300 text-lg group-hover:scale-110 transition-transform">
                          {isExpanded ? '📖' : '📜'}
                        </span>
                        <div>
                          <h4 className="text-sm sm:text-base font-serif font-bold text-amber-100 group-hover:text-amber-200">
                            {dua.title}
                          </h4>
                          <span className="text-[10px] text-amber-300/80 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/20 mt-1 inline-block">
                            {dua.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-stone-400 hidden sm:inline">
                          {dua.reference}
                        </span>
                        <div className="p-1 rounded-full bg-white/5 group-hover:bg-amber-400/20 text-amber-300 transition">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {/* Expandable full content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 pb-5 sm:px-5 sm:pb-6 border-t border-amber-400/15 pt-4 space-y-3"
                        >
                          {/* Arabic Text */}
                          <div className="p-4 rounded-xl bg-black/35 border border-amber-400/20 text-right">
                            <p className="text-xl sm:text-2xl font-arabic text-amber-100 leading-loose select-all">
                              {dua.arabic}
                            </p>
                          </div>

                          {/* Pronunciation & Meaning */}
                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="bg-emerald-900/40 p-3 rounded-xl border border-white/5">
                              <span className="text-amber-300 font-semibold block mb-0.5">বাংলা উচ্চারণ:</span>
                              <p className="text-amber-100/90 font-medium">{dua.pronunciation}</p>
                            </div>

                            <div className="bg-emerald-900/40 p-3 rounded-xl border border-white/5">
                              <span className="text-amber-300 font-semibold block mb-0.5">বাংলা অর্থ:</span>
                              <p className="text-stone-200 leading-relaxed font-light">{dua.meaning}</p>
                            </div>
                          </div>

                          {/* Reference & Virtue Footer */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-[11px] text-stone-300 border-t border-white/10">
                            <div>
                              রেফারেন্স: <strong className="text-amber-300 font-mono">{dua.reference}</strong>
                            </div>
                            {dua.virtue && (
                              <div className="text-amber-200/90 italic">
                                ফযীলত: {dua.virtue}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODULE 3: হাদিস (100+ Authentic Family Hadiths) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'hadith' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-emerald-950/70 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">📖</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                    পারিবারিক বিশুদ্ধ হাদিস সংকলন
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300">
                    পরিবার, পিতা-মাতার অধিকার, দাম্পত্য সুখ ও আত্মীয়তার বন্ধন রক্ষার বিষয়ে ১০০+ নির্ভরযোগ্য সহীহ হাদিস
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-amber-300 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={hadithSearch}
                  onChange={e => setHadithSearch(e.target.value)}
                  placeholder="হাদিসের বিষয়, বর্ণনাকারী বা বক্তব্য দিয়ে খুঁজুন..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-black/40 border border-amber-400/40 rounded-full text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-300 font-medium"
                />
                {hadithSearch && (
                  <button onClick={() => setHadithSearch('')} className="absolute right-3.5 top-3 text-stone-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Topics */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {HADITH_TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setSelectedHadithTopic(topic)}
                    className={`px-3 py-1 rounded-full text-xs shrink-0 cursor-pointer border transition ${
                      selectedHadithTopic === topic
                        ? 'bg-amber-400 text-stone-950 font-bold border-amber-300 shadow-sm'
                        : 'bg-emerald-900/50 text-amber-100/90 border-amber-400/20 hover:bg-emerald-800/60'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-300 px-2">
              <span>মোট প্রদর্শিত হাদিস: <strong className="text-amber-300 font-mono">{filteredHadiths.length}</strong> টি</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHadiths.map(hadith => (
                <div
                  key={hadith.id}
                  className="bg-emerald-950/80 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                        {hadith.topic}
                      </span>
                      {hadith.grade && (
                        <span className="text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {hadith.grade}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-amber-200 mb-2">
                      বর্ণনায়: {hadith.narrator}
                    </p>

                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light">
                      “{hadith.textBn}”
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-400/15 flex items-center justify-between text-[11px] text-amber-300/80 font-mono">
                    <span>সহীহ রেফারেন্স:</span>
                    <span>{hadith.reference}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODULE 4: রমজান (Ramadan Hub & 30-Day Tracker) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'ramadan' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Top Interactive 30-Day Ramadan Tracker */}
            <div className="bg-gradient-to-br from-amber-950/70 via-emerald-950/80 to-teal-950/80 backdrop-blur-md rounded-3xl p-6 border border-amber-400/40 shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🌙</span>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                      রমজান ট্র্যাকার (৩০ দিনের আমলনামা)
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300">
                      প্রতিদিনের রোজা, সাহরী, ইফতার, তারাবীহ্ ও কুরআন তেলাওয়াত ট্র্যাক করুন (স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে)
                    </p>
                  </div>
                </div>

                <div className="bg-black/35 border border-amber-400/40 px-4 py-2 rounded-2xl text-center">
                  <span className="text-[10px] text-amber-300 block uppercase tracking-wider">রোজার অগ্রগতি</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-amber-200">
                    {fastedCount} / ৩০ <small className="text-xs font-normal">({Math.round((fastedCount / 30) * 100)}%)</small>
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-amber-400/30 mb-6">
                <div 
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(fastedCount / 30) * 100}%` }}
                />
              </div>

              {/* 30 Days Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
                {ramadanDays.map(item => (
                  <div
                    key={item.day}
                    className={`rounded-2xl p-3 border transition flex flex-col justify-between ${
                      item.fasted
                        ? 'bg-amber-400/20 border-amber-400/60 shadow-md'
                        : 'bg-black/25 border-white/10 hover:border-amber-400/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif font-bold text-xs sm:text-sm text-amber-200">
                        {item.day} রমজান
                      </span>
                      <button
                        onClick={() => toggleRamadanField(item.day, 'fasted')}
                        className="cursor-pointer"
                        title={item.fasted ? 'রোজা সম্পন্ন' : 'রোজা বাকি'}
                      >
                        {item.fasted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-500" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        onClick={() => toggleRamadanField(item.day, 'sehri')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition text-center ${item.sehri ? 'bg-emerald-600/40 text-emerald-300 font-bold' : 'bg-white/5 text-stone-400'}`}
                      >
                        সাহরী
                      </button>
                      <button
                        onClick={() => toggleRamadanField(item.day, 'iftar')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition text-center ${item.iftar ? 'bg-amber-500/40 text-amber-200 font-bold' : 'bg-white/5 text-stone-400'}`}
                      >
                        ইফতার
                      </button>
                      <button
                        onClick={() => toggleRamadanField(item.day, 'taraweeh')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition text-center ${item.taraweeh ? 'bg-teal-600/40 text-teal-300 font-bold' : 'bg-white/5 text-stone-400'}`}
                      >
                        তারাবীহ
                      </button>
                      <button
                        onClick={() => toggleRamadanField(item.day, 'quran')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition text-center ${item.quran ? 'bg-cyan-600/40 text-cyan-200 font-bold' : 'bg-white/5 text-stone-400'}`}
                      >
                        কুরআন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ramadan Duas */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-200 flex items-center gap-2">
                <span>রমজানের আবশ্যকীয় দোয়াসমূহ</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ramadanDuas.map(d => (
                  <div key={d.id} className="bg-emerald-950/80 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-lg">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-sm sm:text-base font-serif font-bold text-amber-200">{d.title}</h4>
                      <span className="text-[10px] font-mono text-stone-400 bg-black/30 px-2 py-0.5 rounded-full">{d.reference}</span>
                    </div>

                    <p className="text-lg sm:text-xl font-arabic text-right text-amber-100 my-2 leading-relaxed">
                      {d.arabic}
                    </p>

                    <div className="bg-black/25 rounded-xl p-3 my-2 border border-white/5 space-y-1.5 text-xs">
                      <p className="text-amber-200/90 font-medium"><strong>উচ্চারণ:</strong> {d.pronunciation}</p>
                      <p className="text-stone-300 font-light"><strong>অর্থ:</strong> {d.meaning}</p>
                    </div>

                    {d.instructions && (
                      <p className="text-[11px] text-amber-300/80 italic mt-2">
                        নিয়ম: {d.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ramadan Special Surahs */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-200">
                রমজানে তেলাওয়াতযোগ্য মহিমান্বিত সূরা
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ramadanSurahs.map(surah => (
                  <div key={surah.name} className="bg-emerald-950/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-amber-400/30 shadow-lg">
                    <div className="flex items-center justify-between border-b border-amber-400/20 pb-3 mb-4">
                      <div>
                        <h4 className="text-lg font-serif font-bold text-amber-100">{surah.nameBn}</h4>
                        <span className="text-xs text-amber-300/80 font-medium">{surah.meaningBn}</span>
                      </div>
                      <div className="text-right text-xs text-stone-400 font-mono">
                        <div>{surah.totalAyat} আয়াত</div>
                        <div>অবতীর্ণ: {surah.revealedIn}</div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {surah.verses.map(v => (
                        <div key={v.num} className="bg-black/30 p-3 rounded-xl border border-white/5">
                          <p className="text-right font-arabic text-lg text-amber-200 mb-1 leading-relaxed">
                            {v.arabic} <span className="text-amber-400/60 font-mono text-sm">({v.num})</span>
                          </p>
                          <p className="text-xs text-amber-300/90 font-medium">{v.pronunciation}</p>
                          <p className="text-xs text-stone-300 font-light">{v.meaning}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-stone-400 italic border-t border-white/10 pt-2">
                      তাৎপর্য: {surah.significance}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ramadan Virtues Hadiths */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-200">
                রমজানের ফযীলত ও পুরস্কারের সহীহ হাদিস
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ramadanHadiths.map(h => (
                  <div key={h.id} className="bg-emerald-950/80 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-md">
                    <h4 className="text-sm font-serif font-bold text-amber-200 mb-1">{h.title}</h4>
                    <p className="text-xs text-amber-300/70 mb-2">বর্ণনায়: {h.narrator}</p>
                    <p className="text-xs sm:text-sm text-stone-200 font-light leading-relaxed mb-3">“{h.textBn}”</p>
                    <div className="text-[11px] text-amber-300/80 font-mono border-t border-amber-400/15 pt-2">
                      সূত্র: {h.reference}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODULE 5: জানাজার নামাজ (Step-by-Step Visual Illustration & Audio/Text) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'janaza' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="bg-emerald-950/70 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🕌</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                    জানাজার নামাজ পড়ার পূর্ণাঙ্গ ভিজ্যুয়াল নিয়ম
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300">
                    জানাজায় কোনো রুকু ও সিজদা নেই; দাঁড়িয়ে ৪ তাকবীরের সাথে আদায় করতে হয়। নিচে পর্যায়ক্রমিক চিত্র ও দোয়াসমূহ দেওয়া হলো।
                  </p>
                </div>
              </div>

              {/* Step indicator buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                {janazaSteps.map(step => (
                  <button
                    key={step.stepNumber}
                    onClick={() => setActiveJanazaStep(step.stepNumber)}
                    className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                      activeJanazaStep === step.stepNumber
                        ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold shadow-lg scale-102'
                        : 'bg-black/30 text-amber-100/90 border-amber-400/20 hover:bg-emerald-900/40'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider opacity-80">ধাপ {step.stepNumber}</div>
                    <div className="text-xs font-serif truncate mt-0.5">{step.takbeerName}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Step Visual Showcase */}
            {(() => {
              const currentStepData = janazaSteps.find(s => s.stepNumber === activeJanazaStep) || janazaSteps[0];
              return (
                <div className="bg-emerald-950/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-2xl">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-400/20 pb-4 mb-6">
                    <div>
                      <span className="text-xs font-semibold bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                        {currentStepData.takbeerName}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 mt-2">
                        {currentStepData.actionTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={activeJanazaStep === 1}
                        onClick={() => setActiveJanazaStep(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl bg-black/40 border border-amber-400/30 text-xs disabled:opacity-40 cursor-pointer"
                      >
                        পূর্ববর্তী ধাপ
                      </button>
                      <button
                        disabled={activeJanazaStep === 4}
                        onClick={() => setActiveJanazaStep(p => Math.min(4, p + 1))}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-semibold text-xs disabled:opacity-40 cursor-pointer"
                      >
                        পরবর্তী ধাপ
                      </button>
                    </div>
                  </div>

                  {/* Body Posture Illustration Banner */}
                  <div className="bg-gradient-to-r from-emerald-900/60 via-teal-900/60 to-emerald-900/60 border border-amber-400/20 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-3xl shrink-0">
                      {activeJanazaStep === 1 ? '🙌' : activeJanazaStep === 4 ? '🕊️' : '🤲'}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-serif font-bold text-amber-200">
                        দৈহিক অবস্থান: {currentStepData.postureTitle}
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-300 font-light mt-1">
                        {currentStepData.postureDescription}
                      </p>
                    </div>
                  </div>

                  {/* Arabic Recitation */}
                  <div className="bg-black/35 rounded-2xl p-5 sm:p-6 border border-amber-400/20 text-right my-4">
                    <p className="text-xl sm:text-3xl font-arabic text-amber-100 leading-loose select-all">
                      {currentStepData.recitationArabic}
                    </p>
                  </div>

                  {/* Bengali Pronunciation and Meaning */}
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="bg-emerald-900/40 p-4 rounded-xl border border-white/5">
                      <span className="text-amber-300 font-bold block mb-1">উচ্চারণ:</span>
                      <p className="text-amber-100 leading-relaxed font-medium">{currentStepData.pronunciation}</p>
                    </div>

                    <div className="bg-emerald-900/40 p-4 rounded-xl border border-white/5">
                      <span className="text-amber-300 font-bold block mb-1">বাংলা অর্থ:</span>
                      <p className="text-stone-200 leading-relaxed font-light">{currentStepData.meaning}</p>
                    </div>
                  </div>

                  <p className="text-xs text-amber-300/80 italic mt-4 pt-3 border-t border-white/10">
                    ফেকহী নির্দেশনা: {currentStepData.instructions}
                  </p>
                </div>
              );
            })()}

            {/* Child Janaza Duas (নাবালক শিশুর জন্য দোয়া) */}
            <div className="bg-emerald-950/75 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-amber-200">
                    নাবালক শিশুর জানাজার বিশেষ দোয়া (৩য় তাকবীরে)
                  </h3>
                  <p className="text-xs text-stone-300">
                    মরহুম যদি অপ্রাপ্তবয়স্ক বালক বা বালিকা হয়, তবে ৩য় তাকবীরে প্রাপ্তবয়স্কদের দোয়ার পরিবর্তে এই দোয়া পড়তে হয়
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-amber-400/30 text-xs">
                  <button
                    onClick={() => setChildGenderTab('boy')}
                    className={`px-3 py-1 rounded-full cursor-pointer transition ${childGenderTab === 'boy' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-300'}`}
                  >
                    👦 ছেলে শিশু
                  </button>
                  <button
                    onClick={() => setChildGenderTab('girl')}
                    className={`px-3 py-1 rounded-full cursor-pointer transition ${childGenderTab === 'girl' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-300'}`}
                  >
                    👧 মেয়ে শিশু
                  </button>
                </div>
              </div>

              {(() => {
                const childDua = childGenderTab === 'boy' ? childJanazaDuas.boy : childJanazaDuas.girl;
                return (
                  <div className="space-y-3">
                    <div className="bg-black/30 p-4 rounded-xl border border-amber-400/20 text-right">
                      <p className="text-xl sm:text-2xl font-arabic text-amber-100 leading-loose">
                        {childDua.arabic}
                      </p>
                    </div>
                    <div className="bg-emerald-900/40 p-3.5 rounded-xl border border-white/5 space-y-1.5 text-xs sm:text-sm">
                      <p className="text-amber-200"><strong>উচ্চারণ:</strong> {childDua.pronunciation}</p>
                      <p className="text-stone-200 font-light"><strong>অর্থ:</strong> {childDua.meaning}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODULE 6: কবর (Burial Process, 3 Handfuls Soil & Hadiths) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'burial' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="bg-emerald-950/70 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🌱</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                    কবর খনন, মাটি দেওয়া ও দাফনের পূর্ণাঙ্গ সুন্নাত
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300">
                    মরহুমকে কবরে নামানো, ৩ অঞ্জলি মাটির কুরআনিক দোয়া এবং কবর সংক্রান্ত বিশুদ্ধ হাদিসসমূহ
                  </p>
                </div>
              </div>
            </div>

            {/* Step-by-step Burial Stages */}
            <div className="space-y-5">
              {burialSteps.map(step => (
                <div
                  key={step.step}
                  className="bg-emerald-950/80 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <span className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full">
                      ধাপ {step.step}
                    </span>
                    <span className="text-xs font-serif text-amber-200/80">{step.subtitle}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light mb-4">
                    {step.description}
                  </p>

                  {/* Dua if present */}
                  {step.arabic && (
                    <div className="bg-black/35 rounded-2xl p-4 sm:p-5 border border-amber-400/20 my-3">
                      <p className="font-arabic text-lg sm:text-2xl text-right text-amber-100 leading-loose whitespace-pre-line mb-3">
                        {step.arabic}
                      </p>
                      {step.pronunciation && (
                        <div className="bg-emerald-900/40 p-3 rounded-xl border border-white/5 text-xs text-amber-200 space-y-1">
                          <p className="whitespace-pre-line font-medium"><strong>উচ্চারণ:</strong> {step.pronunciation}</p>
                          <p className="text-stone-200 font-light whitespace-pre-line"><strong>অর্থ:</strong> {step.meaning}</p>
                        </div>
                      )}
                      {step.reference && (
                        <p className="text-[11px] font-mono text-amber-300/80 mt-2">রেফারেন্স: {step.reference}</p>
                      )}
                    </div>
                  )}

                  {/* Key points checklist */}
                  <div className="bg-emerald-900/30 rounded-xl p-3.5 border border-white/5 space-y-1.5 mt-3">
                    <span className="text-xs font-bold text-amber-300 block mb-1">গুরুত্বপূর্ণ সুন্নাত দিকনির্দেশনা:</span>
                    {step.keyPoints.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-stone-200">
                        <span className="text-emerald-400 mt-0.5">✔</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Grave Hadiths */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-200">
                কবর ও পরকাল সম্পর্কিত বিশুদ্ধ হাদিস
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {graveHadiths.map(gh => (
                  <div key={gh.id} className="bg-emerald-950/80 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-md flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-amber-200 mb-1">{gh.title}</h4>
                      <p className="text-xs text-amber-300/70 mb-2">বর্ণনায়: {gh.narrator}</p>
                      <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light">“{gh.textBn}”</p>
                    </div>
                    <div className="text-[11px] text-amber-300/80 font-mono border-t border-amber-400/15 pt-2 mt-3">
                      সূত্র: {gh.reference}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODULE 7: ইসলামিক নাম ও নাম জেনারেটর */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'names' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Baby Name Generator Section */}
            <div className="bg-gradient-to-br from-amber-950/70 via-emerald-950/85 to-teal-950/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-amber-400/40 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">✨</span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                    পিতা ও মাতার নাম সমন্বয়ে ‘বেবি নাম জেনারেটর’
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300">
                    স্বামী ও স্ত্রী তাঁদের নাম ইনপুট করলে দুজনের নামের সাথে সুর, বর্ণ ও ভাবার্থ মিলিয়ে বরকতময় ইসলামিক নাম সাজেস্ট করা হবে
                  </p>
                </div>
              </div>

              <form onSubmit={handleRunGenerator} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                      পিতার নাম (Father's Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ওমর ফারুক, আব্দুল্লাহ"
                      value={genFatherName}
                      onChange={e => setGenFatherName(e.target.value)}
                      className="w-full bg-black/40 border border-amber-400/40 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1.5">
                      মাতার নাম (Mother's Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ফাতিমা, আয়েশা"
                      value={genMotherName}
                      onChange={e => setGenMotherName(e.target.value)}
                      className="w-full bg-black/40 border border-amber-400/40 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-300"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-200 font-semibold">সন্তানের ধরণ:</span>
                    <button
                      type="button"
                      onClick={() => setGenGenderPref('all')}
                      className={`px-3 py-1 rounded-full cursor-pointer transition ${genGenderPref === 'all' ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-black/30 text-stone-300'}`}
                    >
                      উভয়
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenGenderPref('boy')}
                      className={`px-3 py-1 rounded-full cursor-pointer transition ${genGenderPref === 'boy' ? 'bg-blue-500 text-white font-bold' : 'bg-black/30 text-stone-300'}`}
                    >
                      ছেলে 👦
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenGenderPref('girl')}
                      className={`px-3 py-1 rounded-full cursor-pointer transition ${genGenderPref === 'girl' ? 'bg-rose-500 text-white font-bold' : 'bg-black/30 text-stone-300'}`}
                    >
                      মেয়ে 👧
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <Sparkles className="w-4 h-4 text-stone-950" />
                    <span>সুরেলা নাম জেনারেট করুন</span>
                  </button>
                </div>
              </form>

              {/* Generated Results Showcase */}
              {hasGenerated && (
                <div className="mt-8 pt-6 border-t border-amber-400/30">
                  <h3 className="text-lg font-serif font-bold text-amber-200 mb-3 flex items-center justify-between">
                    <span>
                      ‘{genFatherName}’ ও ‘{genMotherName}’ এর সাথে শ্রেষ্ঠ ম্যাচিং নামসমূহ
                    </span>
                    <span className="text-xs font-mono text-amber-300">{generatedResults.length} টি প্রস্তাবনা</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {generatedResults.map((res, rIdx) => (
                      <div
                        key={rIdx}
                        className="bg-emerald-950/80 rounded-2xl p-4 border border-amber-400/40 shadow-md flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-base sm:text-lg font-serif font-bold text-amber-100">
                              {res.babyName.name}
                            </span>
                            <span className="text-sm font-arabic text-amber-300">
                              {res.babyName.nameAr}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-amber-300/80 mb-2">
                            <span>{res.babyName.gender === 'boy' ? '👦 ছেলে' : '👧 মেয়ে'}</span>
                            <span>•</span>
                            <span>{res.babyName.origin}</span>
                          </div>

                          <p className="text-xs text-stone-200 leading-snug mb-2 font-medium">
                            অর্থ: <span className="text-amber-200">{res.babyName.meaning}</span>
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-stone-300/90 italic">
                          ম্যাচিং কারণ: {res.matchReason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 1000+ Islamic Names Comprehensive Library */}
            <div className="bg-emerald-950/70 backdrop-blur-md rounded-3xl p-6 border border-amber-400/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100">
                    ১০০০+ ছেলে ও মেয়ের ইসলামিক নামের সংগ্রহশালা
                  </h3>
                  <p className="text-xs text-stone-300">
                    অর্থসহ কুরআন, হাদিস, সাহাবী ও নেককার ব্যক্তিদের পুতপবিত্র নাম
                  </p>
                </div>

                {/* Gender Tabs */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-amber-400/30 text-xs">
                  <button
                    onClick={() => setNameGenderFilter('all')}
                    className={`px-3 py-1 rounded-full cursor-pointer transition ${nameGenderFilter === 'all' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-300'}`}
                  >
                    সকল নাম
                  </button>
                  <button
                    onClick={() => setNameGenderFilter('boy')}
                    className={`px-3 py-1 rounded-full cursor-pointer transition ${nameGenderFilter === 'boy' ? 'bg-blue-500 text-white font-bold' : 'text-stone-300'}`}
                  >
                    👦 ছেলেদের নাম
                  </button>
                  <button
                    onClick={() => setNameGenderFilter('girl')}
                    className={`px-3 py-1 rounded-full cursor-pointer transition ${nameGenderFilter === 'girl' ? 'bg-rose-500 text-white font-bold' : 'text-stone-300'}`}
                  >
                    👧 মেয়েদের নাম
                  </button>
                </div>
              </div>

              {/* Search & Letter Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-amber-300 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={nameSearch}
                    onChange={e => setNameSearch(e.target.value)}
                    placeholder="নামের অর্থ বা নাম দিয়ে খুঁজুন..."
                    className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-black/40 border border-amber-400/40 rounded-full text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-300"
                  />
                  {nameSearch && (
                    <button onClick={() => setNameSearch('')} className="absolute right-3.5 top-2.5 text-stone-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={nameLetterFilter}
                    onChange={e => setNameLetterFilter(e.target.value)}
                    className="w-full bg-black/40 border border-amber-400/40 rounded-full py-2 px-3 text-xs sm:text-sm text-amber-200 focus:outline-none focus:border-amber-300"
                  >
                    <option value="">সকল বর্ণ (অক্ষর ফিল্টার)</option>
                    {uniqueLetters.map(l => (
                      <option key={l} value={l}>‘{l}’ দিয়ে শুরু নাম</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-stone-300 pt-1">
                পাওয়া গেছে: <strong className="text-amber-300 font-mono">{filteredNames.length}</strong> টি নাম
              </div>

              {/* Names List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto pr-1">
                {filteredNames.slice(0, 300).map(item => (
                  <div
                    key={item.id}
                    className="bg-emerald-950/80 rounded-2xl p-3.5 border border-amber-400/25 hover:border-amber-400/60 transition shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-serif font-bold text-sm text-amber-100">{item.name}</span>
                        <span className="font-arabic text-xs text-amber-300">{item.nameAr}</span>
                      </div>
                      <p className="text-[11px] text-stone-200 leading-snug mb-1">
                        অর্থ: <strong className="text-amber-200">{item.meaning}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-white/10 pt-1.5 mt-2">
                      <span>{item.gender === 'boy' ? '👦 ছেলে' : '👧 মেয়ে'}</span>
                      <span className="text-amber-300/80 truncate max-w-[100px]">{item.origin}</span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredNames.length > 300 && (
                <p className="text-center text-xs text-amber-300/80 italic pt-2">
                  প্রথম ৩০০টি নাম প্রদর্শিত হচ্ছে। নির্দিষ্ট নামের জন্য উপরের সার্চ বক্স ব্যবহার করুন।
                </p>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
