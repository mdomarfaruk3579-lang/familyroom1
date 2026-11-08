import { useState } from 'react';
import { MapPin, Sun, Moon, Snowflake, CloudRain, Wind, Flame, Volume2, VolumeX, Sliders, X, Plane, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../LanguageContext';
import { useSeason, TimeOfDay, SeasonType } from '../context/SeasonContext';

export default function Footer() {
  const { t } = useLanguage();
  const {
    timeOfDay,
    setTimeOfDay,
    nightDarkness,
    setNightDarkness,
    dayBrightness,
    setDayBrightness,
    season,
    setSeason,
    sunlight,
    updateSunlight,
    isSoundEnabled,
    toggleSound,
    isSkyTrafficEnabled,
    toggleSkyTraffic,
    triggerOverheadAircraft,
  } = useSeason();

  const [isOpen, setIsOpen] = useState(false);

  const seasonOptions: {
    id: SeasonType;
    label: string;
    sublabel: string;
    icon: typeof Snowflake;
    color: string;
    activeBorder: string;
  }[] = [
    {
      id: 'normal',
      label: 'স্বাভাবিক আবহ',
      sublabel: 'পরিষ্কার নির্মল আকাশ',
      icon: Wind,
      color: 'text-emerald-400',
      activeBorder: 'border-emerald-400 bg-emerald-500/15',
    },
    {
      id: 'winter',
      label: 'শীতকাল',
      sublabel: 'স্নিগ্ধ তুষারপাত ও বরফ কণা',
      icon: Snowflake,
      color: 'text-sky-400',
      activeBorder: 'border-sky-400 bg-sky-500/15',
    },
    {
      id: 'summer',
      label: 'গ্রীষ্মকাল',
      sublabel: 'উষ্ণ আবহ ও সোনালী রোদ',
      icon: Flame,
      color: 'text-amber-500',
      activeBorder: 'border-amber-500 bg-amber-500/15',
    },
    {
      id: 'rainy',
      label: 'বর্ষাকাল ও বজ্রপাত',
      sublabel: 'ঝুম বৃষ্টি, বিদ্যুৎ চমক ও বজ্রধ্বনি',
      icon: CloudRain,
      color: 'text-blue-400',
      activeBorder: 'border-blue-400 bg-blue-500/15',
    },
    {
      id: 'autumn',
      label: 'শরৎকাল',
      sublabel: 'ঝরে পড়া সোনালী ও চিনার পাতা',
      icon: Wind,
      color: 'text-orange-400',
      activeBorder: 'border-orange-400 bg-orange-500/15',
    },
  ];

  // Active label composition: e.g. "শীতের রাত" or "গ্রীষ্মের দিন"
  const getCombinedModeLabel = () => {
    const isNight = timeOfDay === 'night';
    switch (season) {
      case 'winter':
        return isNight ? '❄️🌙 শীতের রাত' : '❄️☀️ শীতের দিন';
      case 'summer':
        return isNight ? '🌴🌙 গ্রীষ্মের রাত' : '🌴☀️ গ্রীষ্মের দিন';
      case 'rainy':
        return isNight ? '⛈️🌙 বর্ষার রাত' : '⛈️☀️ বর্ষার দিন';
      case 'autumn':
        return isNight ? '🍂🌙 শরতের রাত' : '🍂☀️ শরতের দিন';
      case 'normal':
      default:
        return isNight ? '🌙 রাত মোড' : '☀️ দিন মোড';
    }
  };

  return (
    <footer className="bg-[#1A3636] text-[#EAE6DF] py-3 mt-auto border-t border-[#C19A6B]/25 shadow-inner relative z-30">
      <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-between gap-2 sm:gap-3 text-xs">
        {/* Left: App Title */}
        <div className="flex items-center gap-2 font-serif text-amber-200/90 font-medium tracking-wide">
          <span>{t('appTitle')}</span>
        </div>

        {/* Center: Social & Location Hyperlinks + Combined Mode Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Trigger Pill Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 hover:text-amber-100 transition-all border border-amber-400/30 hover:border-amber-400/60 shadow-xs cursor-pointer font-sans"
            title="দিন/রাত ও ঋতু নির্বাচন"
          >
            {timeOfDay === 'night' ? (
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="font-semibold text-[11px] sm:text-xs">
              {getCombinedModeLabel()}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
          </button>

          {/* Home Location */}
          <a
            href="https://maps.app.goo.gl/9eqfwDUnyMvgxEM29"
            target="_blank"
            rel="noopener noreferrer"
            title="Family Home Location"
            className="p-1.5 rounded-full bg-white/5 hover:bg-amber-400/20 text-[#D4AF37] hover:text-amber-300 transition-all border border-amber-400/20 hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
          >
            <MapPin className="w-4 h-4" />
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/mdomars2"
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook Profile"
            className="p-1.5 rounded-full bg-white/5 hover:bg-[#1877F2]/20 text-[#D4AF37] hover:text-[#1877F2] transition-all border border-amber-400/20 hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href="https://whatsapp.com/dl/"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="p-1.5 rounded-full bg-white/5 hover:bg-[#25D366]/20 text-[#D4AF37] hover:text-[#25D366] transition-all border border-amber-400/20 hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 0C5.396 0 .016 5.38.016 12.015c0 2.118.552 4.187 1.6 6.012L0 24l6.166-1.618a11.97 11.97 0 0 0 5.865 1.528h.005c6.635 0 12.016-5.38 12.016-12.015C24.052 5.38 18.671 0 12.031 0zm-.005 21.99a9.96 9.96 0 0 1-5.078-1.385l-.364-.216-3.768.988 1.006-3.673-.238-.378a9.96 9.96 0 0 1-1.528-5.31c0-5.502 4.478-9.98 9.98-9.98 2.666 0 5.172 1.038 7.057 2.924a9.93 9.93 0 0 1 2.923 7.056c0 5.503-4.478 9.98-9.988 9.98zm5.474-7.48c-.3-.15-1.776-.876-2.052-.976-.276-.1-.476-.15-.676.15-.2.3-.776.976-.95 1.176-.176.2-.35.226-.65.076-.3-.15-1.268-.468-2.416-1.492-.893-.797-1.496-1.782-1.672-2.082-.175-.3-.018-.462.132-.612.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.627-.925-2.228-.244-.585-.492-.506-.675-.515-.175-.009-.375-.011-.575-.011-.2 0-.525.075-.8.375-.275.3-1.05 1.026-1.05 2.502 0 1.476 1.075 2.899 1.225 3.1 1.05 1.406 2.476 2.463 3.926 3.037.45.178.8.284 1.075.372.45.143.86.123 1.183.075.36-.054 1.1-.45 1.256-.885.156-.435.156-.81.11-.885-.046-.075-.171-.125-.471-.275z" />
            </svg>
          </a>
        </div>

        {/* Right: 2026 */}
        <div className="text-amber-200/80 font-mono font-bold tracking-widest text-xs sm:text-sm">
          2026
        </div>
      </div>

      {/* Atmospheric Mode & Sunlight Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#1C2826] border border-[#C19A6B]/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-100 w-full max-w-lg max-h-[88vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-700">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌤️</span>
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-amber-200">
                      দিন/রাত ও ঋতু নিয়ন্ত্রণ
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      দিন বা রাতের সাথে যেকোনো ঋতু মিলিয়ে নিন এবং আলো ও অন্ধকার নিয়ন্ত্রণ করুন
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* SECTION 1: TIME OF DAY (Day / Night)                        */}
              {/* ----------------------------------------------------------- */}
              <div className="mt-4">
                <label className="text-xs font-bold text-amber-300 block mb-2">
                  ১. সময় নির্বাচন (Time of Day):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Day Button */}
                  <button
                    onClick={() => setTimeOfDay('day')}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      timeOfDay === 'day'
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-md'
                        : 'border-stone-700 bg-stone-800/60 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sun className="w-6 h-6 text-amber-400" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm">দিন মোড (Day)</div>
                        <div className="text-[10px] text-stone-400">উজ্জ্বল সূর্য ও সূর্যালোক এডিট</div>
                      </div>
                    </div>
                    {timeOfDay === 'day' && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs" />}
                  </button>

                  {/* Night Button */}
                  <button
                    onClick={() => setTimeOfDay('night')}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      timeOfDay === 'night'
                        ? 'border-indigo-400 bg-indigo-900/40 text-white shadow-md'
                        : 'border-stone-700 bg-stone-800/60 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-6 h-6 text-indigo-300" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm">রাত মোড (Night)</div>
                        <div className="text-[10px] text-stone-400">গভীর রাত, চাঁদ ও অপাসিটি স্লাইডার</div>
                      </div>
                    </div>
                    {timeOfDay === 'night' && <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-xs" />}
                  </button>
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* OPACITY SLIDERS (Night Darkness & Day Brightness)           */}
              {/* ----------------------------------------------------------- */}
              {timeOfDay === 'night' ? (
                <div className="mt-3.5 p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                  <div className="flex justify-between text-xs text-indigo-200 font-bold mb-1.5">
                    <span>🌙 রাতের অন্ধকারের গভীরতা (Night Darkness / Opacity):</span>
                    <span className="font-mono text-indigo-300">{Math.round(nightDarkness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="1.0"
                    step="0.05"
                    value={nightDarkness}
                    onChange={e => setNightDarkness(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>হালকা সন্ধ্যা (15%)</span>
                    <span>মাঝারি রাত (60%)</span>
                    <span>গভীর রাত (100%)</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex justify-between text-xs text-amber-200 font-bold mb-1.5">
                    <span>☀️ দিনের আলোর ব্রাইটনেস (Day Brightness / Opacity):</span>
                    <span className="font-mono text-amber-300">{Math.round(dayBrightness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.5"
                    step="0.05"
                    value={dayBrightness}
                    onChange={e => setDayBrightness(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>মৃদু আলো (30%)</span>
                    <span>স্বাভাবিক দিন (100%)</span>
                    <span>প্রখর রোদ (150%)</span>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* SECTION 2: SEASONS (Winter, Summer, Rainy, Autumn, Normal)  */}
              {/* ----------------------------------------------------------- */}
              <div className="mt-4">
                <label className="text-xs font-bold text-amber-300 block mb-2">
                  ২. ঋতু ও পরিবেশ নির্বাচন (Season):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {seasonOptions.map(opt => {
                    const Icon = opt.icon;
                    const isActive = season === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSeason(opt.id)}
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? `${opt.activeBorder} shadow-sm scale-102`
                            : 'border-stone-700 bg-stone-800/50 hover:bg-stone-800 text-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-4 h-4 ${opt.color}`} />
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-stone-100">{opt.label}</h4>
                          <p className="text-[9px] text-stone-400 line-clamp-1">{opt.sublabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* DAY MODE: Sunlight Edit Mode Controls                       */}
              {/* ----------------------------------------------------------- */}
              {timeOfDay === 'day' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30"
                >
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-amber-300">
                    <Sliders className="w-4 h-4" />
                    <span>সূর্যালোক নিয়ন্ত্রণ ও এডিট মোড (Sunlight Editor)</span>
                  </div>

                  {/* Intensity Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] text-stone-300 mb-1">
                      <span>আলোর তীব্রতা (Intensity):</span>
                      <span className="font-mono font-bold text-amber-300">
                        {Math.round(sunlight.intensity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.5"
                      step="0.05"
                      value={sunlight.intensity}
                      onChange={e => updateSunlight({ intensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  {/* Warmth Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] text-stone-300 mb-1">
                      <span>রোদ উষ্ণতা (Warmth):</span>
                      <span className="font-mono font-bold text-amber-300">
                        {Math.round(sunlight.warmth * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sunlight.warmth}
                      onChange={e => updateSunlight({ warmth: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                  </div>

                  {/* Sun Position */}
                  <div>
                    <label className="text-[11px] text-stone-300 block mb-1.5">
                      সূর্যের অবস্থান (Position):
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { id: 'top-left', label: 'বাম' },
                          { id: 'top-center', label: 'মাঝে' },
                          { id: 'top-right', label: 'ডান' },
                          { id: 'sunset', label: 'গোধূলি' },
                        ] as const
                      ).map(pos => (
                        <button
                          key={pos.id}
                          onClick={() => updateSunlight({ position: pos.id })}
                          className={`py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                            sunlight.position === pos.id
                              ? 'bg-amber-400 text-stone-900 shadow-xs'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* SECTION 3: SKY TRAFFIC (Plane / Helicopter Flight Control)  */}
              {/* ----------------------------------------------------------- */}
              <div className="mt-4 pt-3 border-t border-stone-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <span>✈️🚁 আকাশে বিমান ও হেলিকপ্টার উড্ডয়ন:</span>
                  </label>
                  {/* Master Toggle to turn off/on sky traffic */}
                  <button
                    onClick={toggleSkyTraffic}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      isSkyTrafficEnabled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>{isSkyTrafficEnabled ? 'চালু' : 'বন্ধ'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-stone-400 mb-2.5">
                  {isSkyTrafficEnabled
                    ? 'আকাশে স্বাভাবিকভাবে বিভিন্ন দেশি-বিদেশি বিমান ও হেলিকপ্টার উড়ে যাবে।'
                    : 'আকাশে বিমান ও হেলিকপ্টার ওড়া সম্পূর্ণ বন্ধ রয়েছে।'}
                </p>

                {/* Manual Launch and Sound Toggles */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Trigger Plane */}
                    <button
                      onClick={() => {
                        triggerOverheadAircraft('plane');
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      title="আকাশে বাঁকানো রুটে বিমান ওড়ান"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      <span>বিমান ওড়ান</span>
                    </button>

                    {/* Trigger Helicopter */}
                    <button
                      onClick={() => {
                        triggerOverheadAircraft('helicopter');
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      title="আকাশে হেলিকপ্টার ওড়ান"
                    >
                      <span className="text-xs">🚁</span>
                      <span>চপার ওড়ান</span>
                    </button>
                  </div>

                  {/* Sound Toggle */}
                  <button
                    onClick={toggleSound}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isSoundEnabled
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                    title="শব্দ চালু/বন্ধ"
                  >
                    {isSoundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>শব্দ চালু</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>শব্দ বন্ধ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}
