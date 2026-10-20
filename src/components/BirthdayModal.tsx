import React, { useState, useRef, useMemo } from 'react';
import { Member } from '../types';
import { useLanguage } from '../LanguageContext';
import { X, Gift, Download, Upload, Share2, Check, Cake, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import * as htmlToImage from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

interface BirthdayModalProps {
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  initialSelectedMember?: Member | null;
}

const bnToEnMap: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

const monthNamesMap: Record<string, number> = {
  'jan': 1, 'january': 1, 'জানুয়ারি': 1, 'জানুয়ারি': 1,
  'feb': 2, 'february': 2, 'ফেব্রুয়ারি': 2, 'ফেব্রুয়ারি': 2,
  'mar': 3, 'march': 3, 'মার্চ': 3,
  'apr': 4, 'april': 4, 'এপ্রিল': 4,
  'may': 5, 'মে': 5,
  'jun': 6, 'june': 6, 'জুন': 6,
  'jul': 7, 'july': 7, 'জুলাই': 7,
  'aug': 8, 'august': 8, 'আগস্ট': 8,
  'sep': 9, 'september': 9, 'সেপ্টেম্বর': 9,
  'oct': 10, 'october': 10, 'অক্টোবর': 10,
  'nov': 11, 'november': 11, 'নভেম্বর': 11,
  'dec': 12, 'december': 12, 'ডিসেম্বর': 12,
};

// Robust helper to parse DOB
// Supports DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, spaces, Bengali numerals & month names
export function parseBirthday(dobStr?: string): { day: number; month: number; year?: number } | null {
  if (!dobStr || typeof dobStr !== 'string') return null;
  let str = dobStr.replace(/[০-৯]/g, d => bnToEnMap[d] || d).trim();
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Check text with month names like "26 October 2004" or "২৬ অক্টোবর ২০০৪"
  const lowerStr = str.toLowerCase();
  for (const [mName, mNum] of Object.entries(monthNamesMap)) {
    if (lowerStr.includes(mName)) {
      const nums = str.match(/\d+/g);
      if (nums && nums.length >= 1) {
        const day = parseInt(nums[0], 10);
        const year = nums[1] ? parseInt(nums[1], 10) : undefined;
        if (day >= 1 && day <= 31) {
          return { day, month: mNum, year };
        }
      }
    }
  }

  // 1. Try YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/(?:^|[^\d])(\d{4})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})(?:$|[^\d])/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { day, month, year };
    }
  }

  // 2. Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (supports flexible spaces like "26 / 10 / 2004" or "26/10")
  const dmyMatch = str.match(/(?:^|[^\d])(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})(?:\s*[\/\-\.]\s*(\d{2,4}))?(?:$|[^\d])/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = dmyMatch[3] ? parseInt(dmyMatch[3], 10) : undefined;
    if (year && year < 100) year += 1900;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { day, month, year };
    }
  }

  return null;
}

export interface BirthdayStatus {
  day: number;
  month: number;
  year?: number;
  daysDiff: number; // -5 to 30
  isToday: boolean;
  isUpcoming: boolean;
  isPassed: boolean;
  statusText: string;
}

// Window check: within next 30 days (0 to 30) OR passed within last 5 days (-5 to -1)
export function getBirthdayWindowStatus(day: number, month: number, year?: number): BirthdayStatus | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const currentYear = now.getFullYear();

  const bdayThisYear = new Date(currentYear, month - 1, day, 0, 0, 0, 0);
  const bdayNextYear = new Date(currentYear + 1, month - 1, day, 0, 0, 0, 0);
  const bdayLastYear = new Date(currentYear - 1, month - 1, day, 0, 0, 0, 0);

  const diffThis = Math.round((bdayThisYear.getTime() - today.getTime()) / 86400000);
  const diffNext = Math.round((bdayNextYear.getTime() - today.getTime()) / 86400000);
  const diffLast = Math.round((bdayLastYear.getTime() - today.getTime()) / 86400000);

  let diff: number | null = null;
  if (diffThis >= -5 && diffThis <= 30) diff = diffThis;
  else if (diffNext >= -5 && diffNext <= 30) diff = diffNext;
  else if (diffLast >= -5 && diffLast <= 30) diff = diffLast;

  if (diff === null) return null;

  const isToday = diff === 0;
  const isPassed = diff < 0 && diff >= -5;
  const isUpcoming = diff > 0 && diff <= 30;

  let statusText = '';
  if (isToday) {
    statusText = 'আজকে জন্মদিন! 🎉';
  } else if (isPassed) {
    if (diff === -1) {
      statusText = 'গতকাল জন্মদিন ছিল';
    } else {
      statusText = `${Math.abs(diff)} দিন আগে জন্মদিন ছিল`;
    }
  } else {
    statusText = `আর ${diff} দিন বাকি`;
  }

  return {
    day,
    month,
    year,
    daysDiff: diff,
    isToday,
    isPassed,
    isUpcoming,
    statusText,
  };
}

// Backward compatibility helper
export function getDaysUntilBirthday(day: number, month: number): number {
  const status = getBirthdayWindowStatus(day, month);
  if (status && status.daysDiff >= 0) return status.daysDiff;
  return 999;
}

export default function BirthdayModal({ members, isOpen, onClose, initialSelectedMember }: BirthdayModalProps) {
  const { t, translateRole } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<Member | null>(initialSelectedMember || null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [senderName, setSenderName] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Compute all members in the window: upcoming within 30 days OR passed within last 5 days
  const upcomingList = useMemo(() => {
    return members
      .map(m => {
        const bday = parseBirthday(m.dob) || parseBirthday(m.birthYear);
        if (!bday) return null;
        const status = getBirthdayWindowStatus(bday.day, bday.month, bday.year);
        if (!status) return null;
        return {
          member: m,
          bday,
          status,
        };
      })
      .filter((item): item is { 
        member: Member; 
        bday: { day: number; month: number; year?: number }; 
        status: BirthdayStatus 
      } => item !== null)
      .sort((a, b) => {
        // 1. Today first
        if (a.status.isToday && !b.status.isToday) return -1;
        if (!a.status.isToday && b.status.isToday) return 1;
        // 2. Upcoming ascending (1, 2, 3...)
        if (a.status.isUpcoming && b.status.isUpcoming) {
          return a.status.daysDiff - b.status.daysDiff;
        }
        if (a.status.isUpcoming && a.status.daysDiff > 0 && b.status.isPassed) return -1;
        if (a.status.isPassed && b.status.isUpcoming && b.status.daysDiff > 0) return 1;
        // 3. Recently passed (-1, -2, -3...)
        return b.status.daysDiff - a.status.daysDiff;
      });
  }, [members]);

  // Set default selection if none
  React.useEffect(() => {
    if (!selectedMember && upcomingList.length > 0) {
      setSelectedMember(upcomingList[0].member);
    } else if (!selectedMember && members.length > 0) {
      setSelectedMember(members[0]);
    }
  }, [selectedMember, upcomingList, members]);

  const triggerConfetti = () => {
    const end = Date.now() + 1000;
    const colors = ['#D4AF37', '#1A3636', '#FFDF73', '#FFFFFF', '#2E7D61'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleSelectMember = (m: Member) => {
    setSelectedMember(m);
    setCustomPhoto(null);
    setDownloadSuccess(false);
    setDownloadError(null);
    triggerConfetti();
  };

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadCardImage = async () => {
    if (!cardRef.current || !selectedMember) return;
    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Generate pristine image via html-to-image (fully supports modern CSS / oklab / oklch)
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
      });

      const cleanName = selectedMember.name.trim().replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '-') || 'card';
      const fileName = `Birthday-Card-${cleanName}.png`;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to download card image with primary method:", err);
      // Fallback in case of strict cross-origin image policy
      try {
        const dataUrl = await htmlToImage.toPng(cardRef.current, {
          quality: 0.95,
          pixelRatio: 1.5,
          cacheBust: false,
        });

        const cleanName = selectedMember.name.trim().replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '-') || 'card';
        const fileName = `Birthday-Card-${cleanName}.png`;

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1000);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } catch (fallbackErr: any) {
        console.error("Fallback download error:", fallbackErr);
        setDownloadError("কার্ড ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        setTimeout(() => setDownloadError(null), 4000);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && selectedMember) {
      try {
        await navigator.share({
          title: `${selectedMember.name} - শুভ জন্মদিন`,
          text: `পরিবারের পক্ষ থেকে ${selectedMember.name}-কে জন্মদিনের প্রাণঢালা শুভেচ্ছা ও ভালোবাসা! 🎉✨`,
          url: 'https://familyroom1.vercel.app/',
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText('https://familyroom1.vercel.app/');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  // Selected member's birthday status
  const selectedBday = selectedMember ? (parseBirthday(selectedMember.dob) || parseBirthday(selectedMember.birthYear)) : null;
  const selectedStatus = selectedBday ? getBirthdayWindowStatus(selectedBday.day, selectedBday.month, selectedBday.year) : null;

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center items-start pt-16 sm:pt-20 pb-10 px-3 sm:px-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-[#FAF9F6] w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header - Always visible with safe spacing */}
        <div className="sticky top-0 z-30 bg-[#1A3636] text-white px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-amber-400/25 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Cake className="w-5 h-5 text-amber-300" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                সামনে যাদের জন্মদিন (আসন্ন ও সম্প্রতি শেষ হওয়া)
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          {/* Left Column: Birthdays List (Next 30 days & Last 5 days) */}
          <div className="w-full md:w-5/12 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                জন্মদিন তালিকা ({upcomingList.length})
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                (আগামী ৩০ দিন ও বিগত ৫ দিন)
              </span>
            </div>

            {upcomingList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-stone-500 text-sm">
                <Gift className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-stone-700">বর্তমানে কারো জন্মদিন আসন্ন বা সম্প্রতি শেষ হয়নি</p>
                <p className="text-xs text-stone-400 mt-2">
                  যেকোনো সদস্যের জন্মদিনের শুভেচ্ছা কার্ড দেখতে নির্বাচন করুন:
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center max-h-40 overflow-y-auto">
                  {members.slice(0, 10).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMember(m)}
                      className="px-2.5 py-1 text-xs rounded-full bg-stone-100 hover:bg-amber-100 text-stone-800 font-medium transition cursor-pointer"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
                {upcomingList.map(({ member: m, bday, status }) => {
                  const isSelected = selectedMember?.id === m.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMember(m)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-[#1A3636] text-white border-amber-400/50 shadow-md ring-1 ring-amber-400/30' 
                          : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/60 bg-stone-100 shrink-0">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-stone-700">
                              {m.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm leading-tight">{m.name}</h4>
                          <p className={`text-[11px] ${isSelected ? 'text-amber-300' : 'text-stone-500'}`}>
                            {translateRole(m.role)} • {bday.day.toString().padStart(2, '0')}/{bday.month.toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {status.isToday ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse shadow-xs">
                            আজকে জন্মদিন! 🎂
                          </span>
                        ) : status.isPassed ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {status.statusText}
                          </span>
                        ) : (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isSelected ? 'bg-amber-400 text-stone-900 font-bold' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {status.statusText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Unique Luxury Birthday Card (1:1 Instagram Post Canvas) */}
          <div className="w-full md:w-7/12 flex flex-col items-center">
            {selectedMember ? (
              <div className="flex flex-col items-center w-full">
                {/* 1:1 Instagram Post Card Canvas */}
                <div 
                  ref={cardRef}
                  className="w-[310px] h-[310px] sm:w-[370px] sm:h-[370px] md:w-[390px] md:h-[390px] rounded-3xl p-4 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden border border-amber-300/40 select-none text-center bg-[#1A3636]"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 50% 25%, rgba(212, 175, 55, 0.24) 0%, transparent 60%),
                      radial-gradient(circle at 10% 90%, rgba(46, 125, 97, 0.35) 0%, transparent 50%),
                      linear-gradient(145deg, #102424 0%, #1A3636 50%, #0c1c1c 100%)
                    `,
                  }}
                >
                  {/* Ornate Gold Filigree Inner Frame */}
                  <div className="absolute inset-3 rounded-2xl border border-amber-400/25 pointer-events-none" />
                  
                  {/* Corner accents */}
                  <div className="absolute top-4 left-4 text-amber-400/30 text-xs font-serif select-none pointer-events-none">✦</div>
                  <div className="absolute bottom-4 left-4 text-amber-400/30 text-xs font-serif select-none pointer-events-none">✦</div>
                  <div className="absolute bottom-4 right-4 text-amber-400/30 text-xs font-serif select-none pointer-events-none">✦</div>

                  {/* Top Header: Completely separated without overlap */}
                  <div className="relative z-20 flex items-start justify-between w-full pt-1 px-1">
                    {/* Top-Left: Bold Title + Slogan */}
                    <div className="text-left max-w-[65%] sm:max-w-[70%]">
                      <h4 
                        className="font-serif font-extrabold text-[12px] sm:text-[14px] text-amber-300 tracking-wider uppercase leading-tight drop-shadow-sm"
                        style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
                      >
                        Birthday greetings card
                      </h4>
                      <p className="text-[8.5px] sm:text-[9.5px] text-stone-200/90 font-mono tracking-wide mt-0.5">
                        by familyroom1.vercel.app
                      </p>
                    </div>

                    {/* Top-Right: ONLY QR Code in clean mini card */}
                    <div className="bg-white p-1 rounded-xl shadow-md border border-amber-300/60 shrink-0">
                      <QRCodeSVG 
                        value="https://familyroom1.vercel.app/" 
                        size={34} 
                        level="H"
                        fgColor="#1A3636"
                        bgColor="#FFFFFF"
                      />
                    </div>
                  </div>

                  {/* Center: Portrait + Name & Greetings with Luxury Typography */}
                  <div className="relative z-10 flex flex-col items-center justify-center my-auto px-2">
                    {/* Portrait container with clean border (avoid CSS maskImage for clean html2canvas export) */}
                    <div className="relative w-22 h-22 sm:w-26 sm:h-26 mb-2 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md"></div>
                      
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-amber-400/90 relative shadow-xl bg-stone-900 flex items-center justify-center">
                        {(customPhoto || selectedMember.photoUrl) ? (
                          <img 
                            src={customPhoto || selectedMember.photoUrl} 
                            alt={selectedMember.name} 
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#204040] flex items-center justify-center text-3xl font-serif font-bold text-amber-300">
                            {selectedMember.name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Happy Birthday Heading */}
                    <h3 
                      className="text-2xl sm:text-3xl font-serif font-bold text-amber-300 tracking-wider drop-shadow-sm"
                      style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                    >
                      {selectedStatus?.isPassed ? 'শুভ জন্মদিন' : 'Happy Birthday'}
                    </h3>

                    {/* Member Name */}
                    <h4 
                      className="text-base sm:text-lg font-serif font-bold text-white tracking-wide mt-0.5"
                      style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                    >
                      {selectedMember.name}
                    </h4>

                    {/* Personalized Wish */}
                    <p 
                      className="text-[10.5px] sm:text-xs text-stone-200/90 italic mt-1 max-w-xs leading-relaxed px-2"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {selectedStatus?.isPassed
                        ? '"দেরিতে হলেও পরিবারের পক্ষ থেকে জন্মদিনের প্রাণঢালা শুভেচ্ছা ও দীর্ঘায়ু কামনা করছি!"'
                        : '"Wishing you a blissful year ahead filled with good health, joy, and peace."'}
                    </p>
                  </div>

                  {/* Card Bottom: User Customized Name + App Developer Credit */}
                  <div className="relative z-10 pb-0.5 flex flex-col items-center">
                    <div className="w-14 h-px bg-amber-400/35 mx-auto mb-1"></div>
                    
                    {/* User Customized Name */}
                    <div 
                      className="text-xs sm:text-sm text-amber-200 font-semibold tracking-wide drop-shadow-xs"
                      style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
                    >
                      {senderName.trim() ? senderName.trim() : 'শুভাকাঙ্ক্ষী'}
                    </div>

                    {/* App Developer Credit */}
                    <div className="text-[7.5px] sm:text-[8px] text-stone-300/80 font-mono tracking-wider mt-0.5 select-none">
                      This app is developed and designed by Md omars
                    </div>
                  </div>
                </div>

                {/* User Customize Name Input */}
                <div className="w-full max-w-[310px] sm:max-w-[370px] md:max-w-[390px] mt-3">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1 text-left flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>কার্ডে আপনার নাম লিখুন (কাস্টমাইজেশন):</span>
                  </label>
                  <input 
                    type="text" 
                    value={senderName} 
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="যেমন: মোঃ ওমর / শুভাকাঙ্ক্ষী..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800 placeholder:text-stone-400 shadow-2xs font-medium"
                    maxLength={50}
                  />
                </div>

                {/* Feedback notifications */}
                {downloadSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>কার্ডটি সফলভাবে ডাউনলোড হয়েছে!</span>
                  </motion.div>
                )}

                {downloadError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{downloadError}</span>
                  </motion.div>
                )}

                {/* Card Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-[310px] sm:max-w-[370px] md:max-w-[390px]">
                  {/* Upload custom photo button */}
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 cursor-pointer shadow-xs transition">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('customPhotoOptional')}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleCustomPhotoUpload} 
                      className="hidden" 
                    />
                  </label>

                  {/* Download Card Button */}
                  <button
                    onClick={downloadCardImage}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-500 text-stone-900 shadow-sm transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloading ? t('downloading') : t('downloadCard')}</span>
                  </button>

                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1A3636] hover:bg-[#254d4d] text-white shadow-xs transition cursor-pointer"
                    title={t('shareCard')}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{copied ? 'কপি হয়েছে' : t('shareCard')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-stone-500">
                <Cake className="w-12 h-12 text-amber-500/50 mb-3" />
                <p className="font-serif text-base text-stone-800 font-semibold">
                  কার্ড দেখতে তালিকা থেকে একজন সদস্য নির্বাচন করুন
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
