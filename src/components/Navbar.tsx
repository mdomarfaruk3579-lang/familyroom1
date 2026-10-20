import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { LogOut, Settings, Users, Home, Image as ImageIcon, Info, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { isAdmin, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
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
      
      {/* Right side: Navigation, Language Icon, PWA Install, Admin & Auth */}
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
  );
}
