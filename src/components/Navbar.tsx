import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { LogOut, Settings, Users, Home, Image as ImageIcon, Info, ShieldCheck, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';
import { FamilyTreePdfDownloader, FamilyTreePdfDownloaderRef } from './FamilyTreePdfDownloader';

export default function Navbar() {
  const { isAdmin, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const downloaderRef = useRef<FamilyTreePdfDownloaderRef>(null);

  useEffect(() => {
    // Initial check from localStorage cache
    try {
      const cached = localStorage.getItem('family_members_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
        }
      }
    } catch {}

    const q = query(collection(db, 'members'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
          setMembers(data);
          try {
            localStorage.setItem('family_members_cache', JSON.stringify(data));
          } catch {}
        }
      },
      () => {
        // Suppress uncaught listener error on quota limit or offline
        try {
          const cached = localStorage.getItem('family_members_cache');
          if (cached) {
            setMembers(JSON.parse(cached));
          }
        } catch {}
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  const handleDirectPdfDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadSuccess(false);
    setToastMessage('পিডিএফ প্রস্তুত ও সরাসরি ডিভাইসে ডাউনলোড হচ্ছে...');

    try {
      // Small pause to allow DOM elements in hidden container to settle
      await new Promise(resolve => setTimeout(resolve, 150));
      const success = await downloaderRef.current?.downloadPdf();
      
      if (success) {
        setDownloadSuccess(true);
        setToastMessage('পিডিএফ ফাইলটি সফলভাবে আপনার ডিভাইসে ডাউনলোড হয়েছে!');
        setTimeout(() => {
          setDownloadSuccess(false);
          setToastMessage(null);
        }, 3500);
      } else {
        setToastMessage('পিডিএফ ডাউনলোডে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error during direct PDF download:', err);
      setToastMessage('পিডিএফ ডাউনলোডে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-[#1A3636]/95 backdrop-blur-md text-white shadow-lg border-b border-[#EAE6DF]/10 px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center sticky top-0 z-50"
      >
        {/* Left side: Logo (Navigates to /login) + Site Name (Navigates to Home) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            type="button"
            onClick={handleLogoClick}
            whileHover={{ scale: 1.1, rotate: 6 }}
            whileTap={{ scale: 0.95 }}
            title="অ্যাডমিন ভেরিফিকেশন পেজ"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-amber-400/20 text-[#D4AF37] border border-amber-400/20 hover:border-amber-400/50 transition-all cursor-pointer focus:outline-none flex items-center justify-center shadow-xs"
          >
            <Users className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </motion.button>

          <Link 
            to="/" 
            title="হোমে ফিরে যান"
            className="font-serif font-bold tracking-wide hover:text-amber-300 transition-colors text-base sm:text-2xl text-stone-100 flex items-center gap-2"
          >
            <span>{t('appTitle')}</span>
          </Link>
        </div>
        
        {/* Right side: Navigation, Direct PDF Download Button, Admin & Auth */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-5">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-5 font-medium text-xs sm:text-sm md:text-base">
            <Link to="/" className="flex items-center gap-1 hover:text-amber-300 transition-colors relative group py-1">
              <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-300 group-hover:text-amber-300" />
              <span className="hidden sm:inline">{t('home')}</span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/gallery" className="flex items-center gap-1 hover:text-amber-300 transition-colors relative group py-1">
              <ImageIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-300 group-hover:text-amber-300" />
              <span className="hidden sm:inline">{t('gallery')}</span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/about" className="flex items-center gap-1 hover:text-amber-300 transition-colors relative group py-1">
              <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-300 group-hover:text-amber-300" />
              <span className="hidden sm:inline">{t('about')}</span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/islamic" className="flex items-center gap-1 hover:text-amber-300 transition-colors relative group py-1">
              <span className="text-sm">🌙</span>
              <span className="hidden sm:inline">ইসলামিক</span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full"></span>
            </Link>

            {/* Direct PDF Download Button in Header: No Modal, Downloads Directly to Device */}
            <button
              type="button"
              onClick={handleDirectPdfDownload}
              disabled={downloading}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all shadow-xs active:scale-95 disabled:opacity-75 ${
                downloadSuccess 
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-400/60'
                  : downloading
                  ? 'bg-amber-400/30 text-amber-200 border-amber-400/60'
                  : 'bg-gradient-to-r from-amber-400/20 via-amber-300/25 to-amber-400/20 hover:from-amber-400/30 hover:to-amber-300/40 text-amber-200 hover:text-white border-amber-400/50'
              }`}
              title="ক্লিক করলেই সম্পূর্ণ ফ্যামিলি ট্রি PDF সরাসরি আপনার ডিভাইসে ডাউনলোড হবে"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span className="hidden sm:inline">ডাউনলোড হচ্ছে...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">সম্পন্ন!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">ট্রি PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Admin Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/admin" 
                  className="flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-400/30 transition-colors text-xs sm:text-sm font-semibold border border-amber-400/40"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t('admin')}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 text-stone-300 hover:text-red-300 transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
                title="অ্যাডমিন লগইন"
              >
                <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Direct Download Feedback Floating Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-16 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-2xl shadow-xl font-medium text-xs sm:text-sm flex items-center gap-2.5 border backdrop-blur-md ${
              downloadSuccess 
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' 
                : downloading
                ? 'bg-[#1A3636]/95 text-amber-200 border-amber-400/40'
                : 'bg-red-950/90 text-red-200 border-red-500/40'
            }`}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
            ) : downloadSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Family Tree PDF Generator (Direct Download Engine) */}
      <FamilyTreePdfDownloader 
        ref={downloaderRef} 
        members={members} 
      />
    </>
  );
}
