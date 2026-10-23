import { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';
import MemberCard from '../components/MemberCard';
import BirthdayModal, { parseBirthday, getBirthdayWindowStatus } from '../components/BirthdayModal';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Cake, Search, X } from 'lucide-react';

import { defaultFamilyMembers } from '../data/defaultMembers';

export default function Home() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem('family_members_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return defaultFamilyMembers;
  });
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeGrandchildId, setActiveGrandchildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Birthday modal state
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const q = query(collection(db, 'members'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
          setMembers(data);
          try {
            localStorage.setItem('family_members_cache', JSON.stringify(data));
          } catch {
            // ignore storage quota issues
          }
        }
        setLoading(false);
      },
      (error) => {
        if (!isMounted) return;
        console.warn("Firestore Home onSnapshot Notice (quota/offline):", error);
        setLoading(false);
        if (error?.message?.includes('Quota') || error?.code === 'resource-exhausted') {
          window.dispatchEvent(new CustomEvent('firestore_quota_exceeded'));
        }
      }
    );
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const grandpas = useMemo(() => members.filter(m => m.type === 'grandpa'), [members]);
  const grandmas = useMemo(() => members.filter(m => m.type === 'grandma'), [members]);
  const sons = useMemo(() => members.filter(m => m.type === 'son'), [members]);
  const daughters = useMemo(() => members.filter(m => m.type === 'daughter'), [members]);
  const activeGrandchildren = useMemo(() => members.filter(m => m.type === 'grandchild' && m.parentId === activeParentId), [members, activeParentId]);

  // Compute upcoming/recent birthdays count in window (next 30 days & last 5 days)
  const upcomingCount = useMemo(() => {
    return members.filter(m => {
      const bday = parseBirthday(m.dob) || parseBirthday(m.birthYear);
      if (!bday) return false;
      const status = getBirthdayWindowStatus(bday.day, bday.month, bday.year);
      return status !== null;
    }).length;
  }, [members]);

  // Filter search results across Bangla and English text (including English name)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return members.filter(m => {
      const name = (m.name || '').toLowerCase();
      const nameEn = (m.nameEn || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      const bio = (m.bio || '').toLowerCase();
      const dob = (m.dob || '').toLowerCase();
      const birthYear = (m.birthYear || '').toLowerCase();
      return name.includes(q) || nameEn.includes(q) || role.includes(q) || bio.includes(q) || dob.includes(q) || birthYear.includes(q);
    });
  }, [members, searchQuery]);

  const handleParentClick = useCallback((id: string) => {
    setActiveParentId(prev => prev === id ? null : id);
    setActiveGrandchildId(null);
  }, []);

  const handleGrandchildClick = useCallback((id: string) => {
    setActiveGrandchildId(prev => prev === id ? null : id);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EAE6DF] border-t-[#1A3636]"></div>
      </div>
    );
  }

  const renderGreatChildren = (
    grandchildId: string, 
    parentPosition: 'left' | 'right' | 'middle' = 'middle'
  ) => {
    if (activeGrandchildId !== grandchildId) return null;
    
    const grandchildMember = members.find(m => m.id === grandchildId);
    const spouse = members.find(m => m.spouseId === grandchildId || (grandchildMember?.spouseId && m.id === grandchildMember.spouseId));
    
    const greatGrandchildren = members.filter(m => m.type === 'great-grandchild' && m.parentId === grandchildId);
    if (greatGrandchildren.length === 0 && !spouse) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ willChange: 'opacity, height' }}
        className="flex flex-col items-center overflow-visible w-full mt-2 relative z-30"
      >
        <div className="w-px h-6 bg-[#C19A6B]"></div>
        
        {spouse && (
          <div className="flex flex-col items-center mb-2 z-10">
            <div className="bg-[#EAE6DF] text-[#1A3636] px-3 py-0.5 rounded-full text-[9px] font-bold shadow-sm border border-[#d8d2c9] mb-2">
              {t('spouse')}
            </div>
            <MemberCard member={spouse} />
            {greatGrandchildren.length > 0 && <div className="w-px h-6 bg-[#C19A6B] mt-2 -mb-6"></div>}
          </div>
        )}

        {greatGrandchildren.length > 0 && (
          <div 
            className="relative flex flex-col gap-8 w-max items-center transition-transform duration-300 [--card-half:1.9rem] sm:[--card-half:2.5rem] md:[--card-half:3rem]"
            style={{
              transform: parentPosition === 'left' && greatGrandchildren.length > 1
                ? 'translateX(calc(50% - var(--card-half)))'
                : parentPosition === 'right' && greatGrandchildren.length > 1
                ? 'translateX(calc(-50% + var(--card-half)))'
                : 'none',
              maxWidth: 'calc(100vw - 1.5rem)'
            }}
          >
            <div className="inline-flex gap-1 sm:gap-4 relative w-max pt-6">
              {greatGrandchildren.length > 1 && (
                <div className="absolute top-0 left-0 right-0 px-[1.9rem] sm:px-[2.5rem] md:px-[3rem] -z-10">
                  <div className="h-px bg-[#C19A6B] w-full"></div>
                </div>
              )}
              
              {greatGrandchildren.map(ggc => {
                const greatGreatGrandchildren = members.filter(m => m.type === 'great-great-grandchild' && m.parentId === ggc.id);
                const ggcSpouse = members.find(m => m.spouseId === ggc.id || (ggc.spouseId && m.id === ggc.spouseId));
                
                return (
                  <div key={ggc.id} className="flex flex-col items-center relative">
                    <div className="w-px h-6 bg-[#C19A6B] absolute -top-6 -z-10"></div>
                    <MemberCard member={ggc} />
                    
                    {(ggcSpouse || greatGreatGrandchildren.length > 0) && (
                      <div className="flex flex-col items-center mt-2 relative w-full z-10">
                        <div className="w-px h-6 bg-[#C19A6B]"></div>
                        
                        {ggcSpouse && (
                          <div className="flex flex-col items-center mb-2 z-10">
                            <div className="bg-[#EAE6DF] text-[#1A3636] px-3 py-0.5 rounded-full text-[9px] font-bold shadow-sm border border-[#d8d2c9] mb-2">
                              {t('spouse')}
                            </div>
                            <MemberCard member={ggcSpouse} />
                            {greatGreatGrandchildren.length > 0 && <div className="w-px h-6 bg-[#C19A6B] mt-2 -mb-8"></div>}
                          </div>
                        )}

                        {greatGreatGrandchildren.length > 0 && (
                          <div className="flex gap-2 sm:gap-4 relative pt-6">
                            {greatGreatGrandchildren.length > 1 && (
                              <div className="absolute top-0 left-0 right-0 px-[1.5rem] sm:px-[2rem] -z-10">
                                <div className="h-px bg-[#C19A6B] w-full"></div>
                              </div>
                            )}
                            {greatGreatGrandchildren.map(gggc => (
                              <div key={gggc.id} className="flex flex-col items-center relative">
                                <div className="w-px h-6 bg-[#C19A6B] absolute -top-6 -z-10"></div>
                                <MemberCard member={gggc} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderChildren = (parentId: string, parentType: string, parentName: string, index: number, total: number) => {
    const parentMember = members.find(m => m.id === parentId);
    const spouse = members.find(m => m.spouseId === parentId || (parentMember?.spouseId && m.id === parentMember.spouseId));
    
    if (activeParentId !== parentId || (activeGrandchildren.length === 0 && !spouse)) return null;
    
    let position: 'left' | 'right' | 'middle' = 'middle';
    if (total > 1) {
      if (index === 0) position = 'left';
      else if (index === total - 1) position = 'right';
    }

    const rows: Member[][] = [];
    const maxPerRow = 4;
    for (let i = 0; i < activeGrandchildren.length; i += maxPerRow) {
      rows.push(activeGrandchildren.slice(i, i + maxPerRow));
    }

    const isDaughter2 = parentType === 'daughter' && index === 1;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ willChange: 'opacity, height' }}
        className="flex flex-col items-center overflow-visible w-full mt-2 relative z-30"
      >
        <div className="w-px h-6 bg-[#C19A6B]"></div>
        
        {spouse && (
          <div className="flex flex-col items-center mb-2 z-10">
            <div className="bg-[#EAE6DF] text-[#1A3636] px-3 py-0.5 rounded-full text-[9px] font-bold shadow-sm border border-[#d8d2c9] mb-2">
              {t('spouse')}
            </div>
            <MemberCard member={spouse} />
            {activeGrandchildren.length > 0 && <div className="w-px h-6 bg-[#C19A6B] mt-2 -mb-8"></div>}
          </div>
        )}

        {activeGrandchildren.length > 0 && (
          <div 
            className="relative flex flex-col gap-8 w-max items-center transition-transform duration-300 [--card-half:1.9rem] sm:[--card-half:2.5rem] md:[--card-half:3rem] [--d2-shift:4.05rem] sm:[--d2-shift:6rem] md:[--d2-shift:7rem]"
            style={{
              transform: isDaughter2
                ? 'translateX(var(--d2-shift))'
                : position === 'left'
                ? 'translateX(calc(50% - var(--card-half)))'
                : position === 'right'
                ? 'translateX(calc(-50% + var(--card-half)))'
                : 'none',
              maxWidth: 'calc(100vw - 1.5rem)'
            }}
          >
            {rows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className={`inline-flex gap-1 sm:gap-4 relative w-max ${
                  rowIndex === 0 ? 'pt-6' : 'pt-4'
                }`}
              >
                {row.length > 1 && (
                  <div className="absolute top-0 left-0 right-0 px-[1.9rem] sm:px-[2.5rem] md:px-[3rem] -z-10">
                    <div className="h-px bg-[#C19A6B] w-full"></div>
                  </div>
                )}
                
                {rowIndex < rows.length - 1 && (
                  <div className={`w-px bg-[#C19A6B] absolute top-0 -z-20 ${
                    position === 'left' ? 'left-[1.9rem] sm:left-[2.5rem] md:left-[3rem]' :
                    position === 'right' ? 'right-[1.9rem] sm:right-[2.5rem] md:right-[3rem]' :
                    'left-1/2 -translate-x-1/2'
                  }`} style={{ height: 'calc(100% + 2rem)' }}></div>
                )}
                
                {row.map((gc, gcIndex) => {
                  const subPosition = isDaughter2 
                    ? (gcIndex >= 2 ? 'right' : gcIndex === 0 ? 'left' : 'middle')
                    : position;
                  return (
                    <div 
                      key={gc.id} 
                      className="flex flex-col items-center relative"
                    >
                      <div className="w-px h-6 bg-[#C19A6B] absolute -top-6 -z-10"></div>
                      <MemberCard 
                        member={gc} 
                        isActive={activeGrandchildId === gc.id}
                        onClick={() => handleGrandchildClick(gc.id)}
                      />
                      {activeGrandchildId === gc.id && (
                        <motion.button
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => navigate(`/member/${gc.id}`)}
                          className="mt-2 text-[10px] bg-[#C19A6B] text-white px-2 py-0.5 rounded-full shadow-sm hover:bg-[#a88358] transition-colors"
                        >
                          {t('viewDetails')}
                        </motion.button>
                      )}
                      <AnimatePresence>
                        {renderGreatChildren(gc.id, subPosition)}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-full pb-20 pt-2 sm:pt-4">
      {/* Top Banner: Upcoming Birthday Live Button + Title + Small Search Bar */}
      <div className="text-center mb-8 sm:mb-10 w-full max-w-xl px-4 flex flex-col items-center">
        {/* 1. Upcoming Birthday Live Badge above 'ফ্যামিলি চার্ট' */}
        {/* 1. Upcoming Birthday Live Badge: Ultra-premium compact luxury design with breathing glow animation */}
        <motion.button
          animate={{ 
            y: [0, -2.5, 0],
            boxShadow: [
              "0 2px 8px rgba(212,175,55,0.18)",
              "0 4px 16px rgba(212,175,55,0.38)",
              "0 2px 8px rgba(212,175,55,0.18)"
            ]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBirthdayModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1 rounded-full bg-gradient-to-r from-[#0d1e1e] via-[#1A3636] to-[#0d1e1e] border border-[#D4AF37]/65 hover:border-[#D4AF37] text-white text-xs mb-3 cursor-pointer group transition-all select-none backdrop-blur-xs shadow-xs"
        >
          <span 
            className="text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 drop-shadow-xs font-serif"
          >
            সামনে যাদের জন্মদিন
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-emerald-500 to-teal-300 shadow-[0_0_6px_#10b981]"></span>
          </span>
          {upcomingCount > 0 && (
            <span className="bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono shadow-xs">
              {upcomingCount}
            </span>
          )}
        </motion.button>

        {/* 2. Title: ফ্যামিলি চার্ট / Family Chart */}
        <Link to="/statistics" className="group inline-block">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            className="text-4xl sm:text-6xl font-serif font-bold text-[#1A3636] mb-1 drop-shadow-sm transition-transform cursor-pointer"
          >
            <motion.span
              animate={{ color: ['#1A3636', '#C19A6B', '#1A3636'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {t('familyChart')}
            </motion.span>
          </motion.h1>
        </Link>

        {/* 3. Small Search Bar (Replaces the line under ফ্যামিলি চার্ট) */}
        <div className="w-full max-w-sm mt-2 relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#C19A6B] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white/95 backdrop-blur-sm border border-[#C19A6B]/50 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C19A6B] text-[#1A3636] placeholder:text-gray-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-700 rounded-full"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Dropdown Results */}
          {searchQuery.trim() && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#EAE6DF] p-2 z-50 max-h-64 overflow-y-auto text-left"
            >
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                {t('searchResults')} ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">{t('noSearchResults')}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {searchResults.map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        navigate(`/member/${m.id}`);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#F7F5F0] cursor-pointer transition"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C19A6B] shrink-0 bg-[#EAE6DF]">
                        {m.photoUrl ? (
                          <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#1A3636]">
                            {m.name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1A3636] truncate">
                          {m.name}
                          {m.nameEn && <span className="text-stone-400 font-normal ml-1 font-sans">({m.nameEn})</span>}
                        </p>
                        <p className="text-[10px] text-[#C19A6B] truncate">
                          {m.role} {m.dob ? `• ${m.dob}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-6 flex flex-col items-center overflow-x-auto overflow-y-visible">
        {/* Top Level: Grandpa & Grandma */}
        <div className="flex gap-4 sm:gap-12 relative z-10">
          {grandpas.map(m => <MemberCard key={m.id} member={m} />)}
          {grandmas.map(m => <MemberCard key={m.id} member={m} />)}
        </div>

        {/* Connection Line */}
        <div className="flex flex-col items-center my-2 relative w-full">
          <div className="w-px h-6 bg-[#C19A6B]"></div>
          <div className="bg-[#EAE6DF] text-[#1A3636] px-4 py-1 rounded-full font-serif font-bold text-sm sm:text-base shadow-sm border border-[#d8d2c9] z-10">
            {t('sonAndDaughter')}
          </div>
          <div className="w-px h-6 bg-[#C19A6B]"></div>
          <div className="w-[80%] md:w-[60%] h-px bg-[#C19A6B] absolute bottom-0"></div>
        </div>

        {/* Middle Level: Sons */}
        <div className="w-full mt-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-px bg-[#C19A6B]/30 flex-grow max-w-[100px]"></div>
            <h3 className="text-center text-[#1A3636] font-serif font-bold text-2xl sm:text-3xl px-4">{t('sons')}</h3>
            <div className="h-px bg-[#C19A6B]/30 flex-grow max-w-[100px]"></div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-6 px-1 sm:px-4 w-full max-w-5xl mx-auto justify-items-center">
            {sons.map((m, index) => (
              <div key={m.id} className="flex flex-col items-center w-full">
                <div className="w-px h-4 sm:h-6 bg-[#C19A6B] mb-0"></div>
                <MemberCard 
                  member={m} 
                  isActive={activeParentId === m.id}
                  onClick={() => handleParentClick(m.id)}
                />
                {activeParentId === m.id && (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate(`/member/${m.id}`)}
                    className="mt-2 text-[10px] bg-[#C19A6B] text-white px-2 py-0.5 rounded-full shadow-sm hover:bg-[#a88358] transition-colors"
                  >
                    {t('viewDetails')}
                  </motion.button>
                )}
                <AnimatePresence>
                  {renderChildren(m.id, m.type, m.name, index, sons.length)}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Level: Daughters */}
        {daughters.length > 0 && (
          <div className="w-full mt-10">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px bg-[#C19A6B]/30 flex-grow max-w-[100px]"></div>
              <h3 className="text-center text-[#1A3636] font-serif font-bold text-2xl sm:text-3xl px-4">{t('daughters')}</h3>
              <div className="h-px bg-[#C19A6B]/30 flex-grow max-w-[100px]"></div>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-6 px-1 sm:px-4 w-full max-w-5xl mx-auto justify-items-center">
              {daughters.map((m, index) => (
                <div key={m.id} className="flex flex-col items-center w-full">
                  <div className="w-px h-4 sm:h-6 bg-[#C19A6B] mb-0"></div>
                  <MemberCard 
                    member={m} 
                    isActive={activeParentId === m.id}
                    onClick={() => handleParentClick(m.id)}
                  />
                  {activeParentId === m.id && (
                    <motion.button
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate(`/member/${m.id}`)}
                      className="mt-2 text-[10px] bg-[#C19A6B] text-white px-2 py-0.5 rounded-full shadow-sm hover:bg-[#a88358] transition-colors"
                    >
                      {t('viewDetails')}
                    </motion.button>
                  )}
                  <AnimatePresence>
                    {renderChildren(m.id, m.type, m.name, index, daughters.length)}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Birthday Greetings & Celebration Modal */}
      <AnimatePresence>
        {showBirthdayModal && (
          <BirthdayModal 
            members={members} 
            isOpen={showBirthdayModal} 
            onClose={() => setShowBirthdayModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
