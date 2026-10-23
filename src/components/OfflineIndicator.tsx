import React, { useEffect, useState } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQuota = () => setIsQuotaExceeded(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('firestore_quota_exceeded', handleQuota);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('firestore_quota_exceeded', handleQuota);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#1A3636] text-[#EAE6DF] border border-[#C19A6B]/50 px-3.5 py-2 text-xs font-medium shadow-xl">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>{lang === 'bn' ? 'অফলাইন মোড — ক্যাশ করা ডেটা দেখাচ্ছে' : 'Offline Mode — Showing cached data'}</span>
      </div>
    );
  }

  if (isQuotaExceeded) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-[#1A3636] text-[#EAE6DF] border border-amber-500/50 px-3.5 py-2.5 text-xs font-medium shadow-2xl animate-fade-in">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
        <div className="flex flex-col">
          <span className="font-semibold text-amber-300">
            {lang === 'bn' ? 'ফ্রি রিড লিমিট শেষ — সংরক্ষিত ডাটা দেখানো হচ্ছে' : 'Free Quota Reached — Showing cached data'}
          </span>
          <span className="text-[10px] text-stone-300">
            {lang === 'bn' ? 'আগামীকাল রিসেট হবে (অ্যাপ স্বাভাবিকভাবে চলবে)' : 'Resets tomorrow (app remains usable)'}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
