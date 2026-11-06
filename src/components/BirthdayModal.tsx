import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Member } from '../types';
import { useLanguage } from '../LanguageContext';
import { X, Gift, Download, Upload, Share2, Check, Cake, User, AlertCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import * as htmlToImage from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

interface BirthdayModalProps {
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  initialSelectedMember?: Member | null;
  defaultTab?: 'birthdays' | 'anniversaries';
}

const bnToEnMap: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

const enToBnMap: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

export function toBengaliNumeral(num: number | string): string {
  return String(num).replace(/[0-9]/g, d => enToBnMap[d] || d);
}

export function toBengaliOrdinal(num: number): string {
  const bn = toBengaliNumeral(num);
  if (num === 1) return `${bn}ম`;
  if (num === 2) return `${bn}য়`;
  if (num === 3) return `${bn}য়`;
  if (num === 4) return `${bn}র্থ`;
  return `${bn}তম`;
}

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

// Robust helper to parse DOB / Marriage Date
export function parseBirthday(dobStr?: string): { day: number; month: number; year?: number } | null {
  if (!dobStr || typeof dobStr !== 'string') return null;
  let str = dobStr.replace(/[০-৯]/g, d => bnToEnMap[d] || d).trim();
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');

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

  // 2. Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
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
export function getBirthdayWindowStatus(day: number, month: number, year?: number, eventType: 'birthday' | 'anniversary' = 'birthday'): BirthdayStatus | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const currentYear = now.getFullYear();

  const eventThisYear = new Date(currentYear, month - 1, day, 0, 0, 0, 0);
  const eventNextYear = new Date(currentYear + 1, month - 1, day, 0, 0, 0, 0);
  const eventLastYear = new Date(currentYear - 1, month - 1, day, 0, 0, 0, 0);

  const diffThis = Math.round((eventThisYear.getTime() - today.getTime()) / 86400000);
  const diffNext = Math.round((eventNextYear.getTime() - today.getTime()) / 86400000);
  const diffLast = Math.round((eventLastYear.getTime() - today.getTime()) / 86400000);

  let diff: number | null = null;
  if (diffThis >= -5 && diffThis <= 30) diff = diffThis;
  else if (diffNext >= -5 && diffNext <= 30) diff = diffNext;
  else if (diffLast >= -5 && diffLast <= 30) diff = diffLast;

  if (diff === null) return null;

  const isToday = diff === 0;
  const isPassed = diff < 0 && diff >= -5;
  const isUpcoming = diff > 0 && diff <= 30;

  const eventLabel = eventType === 'anniversary' ? 'বিবাহবার্ষিকী' : 'জন্মদিন';

  let statusText = '';
  if (isToday) {
    statusText = `আজকে ${eventLabel}! 🎉`;
  } else if (isPassed) {
    if (diff === -1) {
      statusText = `গতকাল ${eventLabel} ছিল`;
    } else {
      statusText = `${toBengaliNumeral(Math.abs(diff))} দিন আগে ${eventLabel} ছিল`;
    }
  } else {
    statusText = `আর ${toBengaliNumeral(diff)} দিন বাকি`;
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

export interface CoupleAnniversary {
  coupleKey: string;
  primaryMember: Member;
  spouseMember?: Member;
  marriageDateStr: string;
  parsedDate: { day: number; month: number; year?: number };
  status: BirthdayStatus;
  yearsCount?: number;
  milestoneText: string;
}

export default function BirthdayModal({
  members,
  isOpen,
  onClose,
  initialSelectedMember,
  defaultTab = 'birthdays',
}: BirthdayModalProps) {
  const { t, translateRole } = useLanguage();
  const [activeTab, setActiveTab] = useState<'birthdays' | 'anniversaries'>(defaultTab);

  // Birthday selection & card state
  const [selectedMember, setSelectedMember] = useState<Member | null>(initialSelectedMember || null);
  const [selectedCouple, setSelectedCouple] = useState<CoupleAnniversary | null>(null);

  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [senderName, setSenderName] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const anniversaryCardRef = useRef<HTMLDivElement>(null);

  // Compute all members with upcoming birthdays (next 30 days & last 5 days)
  const upcomingList = useMemo(() => {
    return members
      .map(m => {
        const bday = parseBirthday(m.dob) || parseBirthday(m.birthYear);
        if (!bday) return null;
        const status = getBirthdayWindowStatus(bday.day, bday.month, bday.year, 'birthday');
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
        if (a.status.isToday && !b.status.isToday) return -1;
        if (!a.status.isToday && b.status.isToday) return 1;
        if (a.status.isUpcoming && b.status.isUpcoming) {
          return a.status.daysDiff - b.status.daysDiff;
        }
        if (a.status.isUpcoming && a.status.daysDiff > 0 && b.status.isPassed) return -1;
        if (a.status.isPassed && b.status.isUpcoming && b.status.daysDiff > 0) return 1;
        return b.status.daysDiff - a.status.daysDiff;
      });
  }, [members]);

  // Compute upcoming wedding anniversaries (next 30 days & last 5 days)
  const upcomingAnniversaries = useMemo(() => {
    const seenCoupleKeys = new Set<string>();
    const list: CoupleAnniversary[] = [];
    const nowYear = new Date().getFullYear();

    members.forEach(m => {
      // Check if member or their spouse has marriageDate
      const spouse = members.find(
        other => other.id !== m.id && (other.id === m.spouseId || other.spouseId === m.id)
      );

      const marriageDateStr = m.marriageDate || spouse?.marriageDate;
      if (!marriageDateStr) return;

      const coupleKey = [m.id, spouse?.id].filter(Boolean).sort().join('_');
      if (seenCoupleKeys.has(coupleKey)) return;
      seenCoupleKeys.add(coupleKey);

      const parsed = parseBirthday(marriageDateStr);
      if (!parsed) return;

      const status = getBirthdayWindowStatus(parsed.day, parsed.month, parsed.year, 'anniversary');
      if (!status) return;

      const yearsCount = parsed.year ? Math.max(1, nowYear - parsed.year) : undefined;
      const milestoneText = yearsCount ? `${toBengaliOrdinal(yearsCount)} বিবাহবার্ষিকী` : 'শুভ বিবাহবার্ষিকী';

      // Designate husband and wife
      const isFemale = m.type === 'daughter' || m.type === 'grandma' || (m.role && m.role.includes('মেয়ে'));
      const primary = isFemale && spouse ? spouse : m;
      const second = primary.id === m.id ? spouse : m;

      list.push({
        coupleKey,
        primaryMember: primary,
        spouseMember: second,
        marriageDateStr,
        parsedDate: parsed,
        status,
        yearsCount,
        milestoneText,
      });
    });

    return list.sort((a, b) => {
      if (a.status.isToday && !b.status.isToday) return -1;
      if (!a.status.isToday && b.status.isToday) return 1;
      if (a.status.isUpcoming && b.status.isUpcoming) {
        return a.status.daysDiff - b.status.daysDiff;
      }
      return b.status.daysDiff - a.status.daysDiff;
    });
  }, [members]);

  // All couples in family for fallback when none in window
  const allFamilyCouples = useMemo(() => {
    const seen = new Set<string>();
    const list: CoupleAnniversary[] = [];
    const nowYear = new Date().getFullYear();

    members.forEach(m => {
      const spouse = members.find(
        other => other.id !== m.id && (other.id === m.spouseId || other.spouseId === m.id)
      );
      if (!spouse && !m.marriageDate && m.maritalStatus !== 'married') return;

      const coupleKey = [m.id, spouse?.id].filter(Boolean).sort().join('_');
      if (seen.has(coupleKey)) return;
      seen.add(coupleKey);

      const marriageDateStr = m.marriageDate || spouse?.marriageDate || '01/01/2015';
      const parsed = parseBirthday(marriageDateStr) || { day: 1, month: 1, year: 2015 };
      const status = getBirthdayWindowStatus(parsed.day, parsed.month, parsed.year, 'anniversary') || {
        day: parsed.day,
        month: parsed.month,
        year: parsed.year,
        daysDiff: 999,
        isToday: false,
        isUpcoming: false,
        isPassed: false,
        statusText: `${toBengaliNumeral(parsed.day)}/${toBengaliNumeral(parsed.month)} তারিখে`,
      };

      const yearsCount = parsed.year ? Math.max(1, nowYear - parsed.year) : undefined;
      const milestoneText = yearsCount ? `${toBengaliOrdinal(yearsCount)} বিবাহবার্ষিকী` : 'শুভ বিবাহবার্ষিকী';

      list.push({
        coupleKey,
        primaryMember: m,
        spouseMember: spouse,
        marriageDateStr: m.marriageDate || spouse?.marriageDate || 'তারিখ সংরক্ষিত নেই',
        parsedDate: parsed,
        status,
        yearsCount,
        milestoneText,
      });
    });

    return list;
  }, [members]);

  // Default selection
  useEffect(() => {
    if (!selectedMember && upcomingList.length > 0) {
      setSelectedMember(upcomingList[0].member);
    } else if (!selectedMember && members.length > 0) {
      setSelectedMember(members[0]);
    }
  }, [selectedMember, upcomingList, members]);

  useEffect(() => {
    if (!selectedCouple && upcomingAnniversaries.length > 0) {
      setSelectedCouple(upcomingAnniversaries[0]);
    } else if (!selectedCouple && allFamilyCouples.length > 0) {
      setSelectedCouple(allFamilyCouples[0]);
    }
  }, [selectedCouple, upcomingAnniversaries, allFamilyCouples]);

  const triggerConfetti = () => {
    const end = Date.now() + 1000;
    const colors = ['#D4AF37', '#1A3636', '#FFDF73', '#FFFFFF', '#2E7D61', '#E11D48'];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 6,
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

  const handleSelectCouple = (c: CoupleAnniversary) => {
    setSelectedCouple(c);
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

  // Download card image
  const downloadCardImage = async () => {
    const targetRef = activeTab === 'birthdays' ? cardRef.current : anniversaryCardRef.current;
    if (!targetRef) return;

    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const dataUrl = await htmlToImage.toPng(targetRef, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
      });

      const baseName = activeTab === 'birthdays' 
        ? (selectedMember?.name || 'birthday') 
        : `${selectedCouple?.primaryMember.name || 'couple'}-anniversary`;
      const cleanName = baseName.trim().replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '-') || 'card';
      const fileName = `${activeTab === 'birthdays' ? 'Birthday' : 'Anniversary'}-Card-${cleanName}.png`;

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
      console.error("Failed to download card image:", err);
      try {
        const dataUrl = await htmlToImage.toPng(targetRef, {
          quality: 0.95,
          pixelRatio: 1.5,
          cacheBust: false,
        });

        const fileName = `${activeTab === 'birthdays' ? 'Birthday' : 'Anniversary'}-Card.png`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 1000);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } catch (fallbackErr: any) {
        setDownloadError("কার্ড ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        setTimeout(() => setDownloadError(null), 4000);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (activeTab === 'birthdays') {
      if (navigator.share && selectedMember) {
        try {
          await navigator.share({
            title: `${selectedMember.name} - শুভ জন্মদিন`,
            text: `পরিবারের পক্ষ থেকে ${selectedMember.name}-কে জন্মদিনের প্রাণঢালা শুভেচ্ছা ও ভালোবাসা! 🎉✨`,
            url: 'https://familyroom1.vercel.app/',
          });
        } catch {}
      } else {
        navigator.clipboard.writeText('https://familyroom1.vercel.app/');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      const coupleNames = selectedCouple
        ? `${selectedCouple.primaryMember.name} ও ${selectedCouple.spouseMember?.name || 'স্ত্রী/স্বামী'}`
        : 'দম্পতি';
      if (navigator.share && selectedCouple) {
        try {
          await navigator.share({
            title: `${coupleNames} - শুভ বিবাহবার্ষিকী`,
            text: `পরিবারের পক্ষ থেকে ${coupleNames}-এর বৈবাহিক জীবনের অব্যাহত সুখ ও বরকত কামনা করছি! 💍❤️`,
            url: 'https://familyroom1.vercel.app/',
          });
        } catch {}
      } else {
        navigator.clipboard.writeText('https://familyroom1.vercel.app/');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (!isOpen) return null;

  // Selected member's birthday status
  const selectedBday = selectedMember ? (parseBirthday(selectedMember.dob) || parseBirthday(selectedMember.birthYear)) : null;
  const selectedStatus = selectedBday ? getBirthdayWindowStatus(selectedBday.day, selectedBday.month, selectedBday.year, 'birthday') : null;

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center items-start pt-14 sm:pt-16 pb-10 px-3 sm:px-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-[#FAF9F6] w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Tab Navigation */}
        <div className="sticky top-0 z-30 bg-[#1A3636] text-white px-4 sm:px-6 py-3 flex flex-col gap-2.5 border-b border-amber-400/25 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeTab === 'birthdays' ? '🎂' : '💍'}</span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                {activeTab === 'birthdays' ? 'সামনে যাদের জন্মদিন' : 'সামনে যাদের বিবাহবার্ষিকী'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2 Primary Tabs: জন্মদিন vs বিবাহবার্ষিকী */}
          <div className="flex items-center gap-2 bg-stone-900/60 p-1 rounded-2xl border border-white/10 self-start">
            <button
              onClick={() => {
                setActiveTab('birthdays');
                setDownloadSuccess(false);
                setDownloadError(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'birthdays'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <span>🎂 জন্মদিন</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                {upcomingList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('anniversaries');
                setDownloadSuccess(false);
                setDownloadError(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'anniversaries'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <span>💍 বিবাহবার্ষিকী</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                {upcomingAnniversaries.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: BIRTHDAYS VIEW */}
        {activeTab === 'birthdays' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
            {/* Left Column: Birthdays List */}
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
                              {translateRole(m.role)} • {toBengaliNumeral(bday.day.toString().padStart(2, '0'))}/{toBengaliNumeral(bday.month.toString().padStart(2, '0'))}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {status.isToday ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse shadow-xs">
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

            {/* Right Column: Birthday Card Canvas */}
            <div className="w-full md:w-7/12 flex flex-col items-center">
              {selectedMember ? (
                <div className="flex flex-col items-center w-full">
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
                    <div className="absolute inset-3 rounded-2xl border border-amber-400/25 pointer-events-none" />
                    <div className="absolute top-4 left-4 text-amber-400/30 text-xs font-serif select-none pointer-events-none">✦</div>
                    <div className="absolute bottom-4 left-4 text-amber-400/30 text-xs font-serif select-none pointer-events-none">✦</div>
                    <div className="absolute bottom-4 right-4 text-amber-400/30 text-xs font-serif select-none pointer-events-none">✦</div>

                    {/* Top Header */}
                    <div className="relative z-20 flex items-start justify-between w-full pt-1 px-1">
                      <div className="text-left max-w-[65%] sm:max-w-[70%]">
                        <h4 className="font-serif font-extrabold text-[12px] sm:text-[14px] text-amber-300 tracking-wider uppercase leading-tight drop-shadow-sm">
                          Birthday greetings card
                        </h4>
                        <p className="text-[8.5px] sm:text-[9.5px] text-stone-200/90 font-mono tracking-wide mt-0.5">
                          by familyroom1.vercel.app
                        </p>
                      </div>

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

                    {/* Center: Portrait + Name */}
                    <div className="relative z-10 flex flex-col items-center justify-center my-auto px-2">
                      <div className="relative w-22 h-22 sm:w-26 sm:h-26 mb-2 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md"></div>
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-amber-400/90 relative shadow-xl bg-stone-900 flex items-center justify-center">
                          {(customPhoto || selectedMember.photoUrl) ? (
                            <img 
                              src={customPhoto || selectedMember.photoUrl} 
                              alt={selectedMember.name} 
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#204040] flex items-center justify-center text-3xl font-serif font-bold text-amber-300">
                              {selectedMember.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-300 tracking-wider drop-shadow-sm">
                        {selectedStatus?.isPassed ? 'শুভ জন্মদিন' : 'Happy Birthday'}
                      </h3>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide mt-0.5">
                        {selectedMember.name}
                      </h4>
                      <p className="text-[10.5px] sm:text-xs text-stone-200/90 italic mt-1 max-w-xs leading-relaxed px-2 font-serif">
                        {selectedStatus?.isPassed
                          ? '"দেরিতে হলেও পরিবারের পক্ষ থেকে জন্মদিনের প্রাণঢালা শুভেচ্ছা ও দীর্ঘায়ু কামনা করছি!"'
                          : '"Wishing you a blissful year ahead filled with good health, joy, and peace."'}
                      </p>
                    </div>

                    {/* Bottom: Sender Name */}
                    <div className="relative z-10 pb-0.5 flex flex-col items-center">
                      <div className="w-14 h-px bg-amber-400/35 mx-auto mb-1"></div>
                      <div className="text-xs sm:text-sm text-amber-200 font-semibold tracking-wide drop-shadow-xs font-serif">
                        {senderName.trim() ? senderName.trim() : 'শুভাকাঙ্ক্ষী'}
                      </div>
                      <div className="text-[7.5px] sm:text-[8px] text-stone-300/80 font-mono tracking-wider mt-0.5 select-none">
                        This app is developed and designed by Md omars
                      </div>
                    </div>
                  </div>

                  {/* Sender Name Input & Buttons */}
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

                  {downloadSuccess && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>কার্ডটি সফলভাবে ডাউনলোড হয়েছে!</span>
                    </motion.div>
                  )}

                  {downloadError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{downloadError}</span>
                    </motion.div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-[310px] sm:max-w-[370px] md:max-w-[390px]">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 cursor-pointer shadow-xs transition">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('customPhotoOptional')}</span>
                      <input type="file" accept="image/*" onChange={handleCustomPhotoUpload} className="hidden" />
                    </label>

                    <button
                      onClick={downloadCardImage}
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-500 text-stone-900 shadow-sm transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloading ? t('downloading') : t('downloadCard')}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1A3636] hover:bg-[#254d4d] text-white shadow-xs transition cursor-pointer"
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
        )}

        {/* TAB 2: WEDDING ANNIVERSARIES VIEW */}
        {activeTab === 'anniversaries' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
            {/* Left Column: Anniversaries List */}
            <div className="w-full md:w-5/12 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  বিবাহবার্ষিকী তালিকা ({upcomingAnniversaries.length})
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  (আগামী ৩০ দিন)
                </span>
              </div>

              {upcomingAnniversaries.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-stone-500 text-sm">
                  <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-60" />
                  <p className="font-medium text-stone-700">আগামী ৩০ দিনে কারো বিবাহবার্ষিকী নেই</p>
                  <p className="text-xs text-stone-400 mt-2">
                    কার্ড তৈরি করতে পরিবারের যেকোনো দম্পতিকে নির্বাচন করুন:
                  </p>
                  <div className="mt-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {allFamilyCouples.map(c => (
                      <button
                        key={c.coupleKey}
                        onClick={() => handleSelectCouple(c)}
                        className="p-2 text-xs rounded-xl bg-stone-50 hover:bg-amber-100 text-stone-800 font-medium transition text-left flex items-center justify-between"
                      >
                        <span className="truncate">
                          {c.primaryMember.name} ও {c.spouseMember?.name || 'দম্পতি'}
                        </span>
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          {c.milestoneText}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
                  {upcomingAnniversaries.map((c) => {
                    const isSelected = selectedCouple?.coupleKey === c.coupleKey;
                    const spouseName = c.spouseMember?.name || 'স্ত্রী / স্বামী';

                    return (
                      <div
                        key={c.coupleKey}
                        onClick={() => handleSelectCouple(c)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#1A3636] text-white border-amber-400/50 shadow-md ring-1 ring-amber-400/30' 
                            : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Interlocked Mini Avatars */}
                          <div className="relative flex items-center shrink-0">
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400/80 bg-stone-100 shadow-xs z-10">
                              {c.primaryMember.photoUrl ? (
                                <img src={c.primaryMember.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                  {c.primaryMember.name.slice(0, 1)}
                                </div>
                              )}
                            </div>
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400/80 bg-stone-200 shadow-xs -ml-3">
                              {c.spouseMember?.photoUrl ? (
                                <img src={c.spouseMember.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                  {spouseName.slice(0, 1)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-serif font-bold text-xs sm:text-sm leading-tight truncate max-w-[150px]">
                              {c.primaryMember.name} ও {spouseName}
                            </h4>
                            <p className={`text-[10px] ${isSelected ? 'text-amber-300' : 'text-stone-500'}`}>
                              💍 {c.milestoneText} • {toBengaliNumeral(c.parsedDate.day)}/{toBengaliNumeral(c.parsedDate.month)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {c.status.isToday ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse shadow-xs">
                              আজকে বিবাহবার্ষিকী! 💍
                            </span>
                          ) : (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isSelected ? 'bg-amber-400 text-stone-900 font-bold' : 'bg-stone-100 text-stone-700'
                            }`}>
                              {c.status.statusText}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Anniversary Card Canvas */}
            <div className="w-full md:w-7/12 flex flex-col items-center">
              {selectedCouple ? (
                <div className="flex flex-col items-center w-full">
                  {/* Romantic Love-Themed Wedding Anniversary Poster (1:1 Canvas) */}
                  <div 
                    ref={anniversaryCardRef}
                    className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[400px] md:h-[400px] rounded-3xl p-4 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden border-2 border-rose-300/60 select-none text-center"
                    style={{
                      background: 'radial-gradient(circle at 50% 25%, rgba(244, 63, 94, 0.35) 0%, transparent 65%), radial-gradient(circle at 85% 85%, rgba(217, 119, 6, 0.28) 0%, transparent 55%), linear-gradient(145deg, #1f030a 0%, #3d0718 45%, #180207 100%)',
                    }}
                  >
                    {/* Floating Romantic Bokeh Hearts in Background */}
                    <div className="absolute top-6 left-8 text-rose-400/20 text-xl pointer-events-none select-none">💖</div>
                    <div className="absolute top-12 right-12 text-rose-300/25 text-lg pointer-events-none select-none">💕</div>
                    <div className="absolute bottom-16 left-6 text-amber-300/20 text-sm pointer-events-none select-none">✨</div>
                    <div className="absolute bottom-12 right-8 text-rose-400/25 text-xl pointer-events-none select-none">💝</div>

                    {/* Rose Gold Double Filigree Border */}
                    <div className="absolute inset-2.5 rounded-2xl border border-rose-400/30 pointer-events-none" />
                    <div className="absolute inset-3.5 rounded-2xl border border-dashed border-amber-300/25 pointer-events-none" />

                    {/* Corner Heart Accents */}
                    <div className="absolute top-3.5 left-3.5 text-rose-300/60 text-xs font-serif select-none pointer-events-none">❦</div>
                    <div className="absolute top-3.5 right-3.5 text-rose-300/60 text-xs font-serif select-none pointer-events-none">❦</div>
                    <div className="absolute bottom-3.5 left-3.5 text-rose-300/60 text-xs font-serif select-none pointer-events-none">❦</div>
                    <div className="absolute bottom-3.5 right-3.5 text-rose-300/60 text-xs font-serif select-none pointer-events-none">❦</div>

                    {/* Top Header */}
                    <div className="relative z-20 flex items-start justify-between w-full pt-0.5 px-1">
                      <div className="text-left max-w-[68%]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-rose-400 text-xs">❤</span>
                          <h4 
                            className="font-serif font-extrabold text-[12px] sm:text-[14px] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-300 tracking-wider uppercase leading-tight drop-shadow-sm"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            Happy Wedding Anniversary
                          </h4>
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-rose-200/80 font-mono tracking-wider mt-0.5">
                          চিরন্তন ভালোবাসার পবিত্র বন্ধন • familyroom1
                        </p>
                      </div>

                      <div className="bg-white/95 p-1 rounded-xl shadow-md border border-rose-300/70 shrink-0">
                        <QRCodeSVG 
                          value="https://familyroom1.vercel.app/" 
                          size={32} 
                          level="H"
                          fgColor="#3D0718"
                          bgColor="#FFFFFF"
                        />
                      </div>
                    </div>

                    {/* Center: Paired Romantic Portraits & Names */}
                    <div className="relative z-10 flex flex-col items-center justify-center my-auto px-2">
                      
                      {/* Romantic Ribbon Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-600/80 via-amber-500/80 to-rose-600/80 border border-amber-300/60 shadow-md text-white font-bold text-[9.5px] sm:text-[10.5px] mb-2 tracking-wide">
                        <span>✦</span>
                        <span>{selectedCouple.milestoneText}</span>
                        <span>✦</span>
                      </div>

                      {/* Couple Avatars with Intertwined Heart / Ring Motif */}
                      <div className="relative flex items-center justify-center gap-2 sm:gap-3.5 mb-1.5">
                        {/* Husband Frame */}
                        <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-rose-400 to-amber-200 shadow-xl">
                          <div className="w-full h-full rounded-full overflow-hidden bg-stone-900 border-2 border-stone-950 flex items-center justify-center">
                            {selectedCouple.primaryMember.photoUrl ? (
                              <img 
                                src={selectedCouple.primaryMember.photoUrl} 
                                alt={selectedCouple.primaryMember.name}
                                crossOrigin="anonymous" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3d0718] flex items-center justify-center text-xl font-serif font-bold text-amber-200">
                                {selectedCouple.primaryMember.name.slice(0, 1)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Central Pulsing Ruby Love Heart */}
                        <div className="relative flex items-center justify-center z-20">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-rose-700 text-white flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.7)] text-sm sm:text-base border border-amber-300/70">
                            ❤️
                          </div>
                          {/* Mini intertwined rings badge */}
                          <span className="absolute -bottom-2 text-[10px] filter drop-shadow-sm">💍</span>
                        </div>

                        {/* Wife Frame */}
                        <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full p-0.5 bg-gradient-to-tr from-rose-400 via-amber-400 to-rose-200 shadow-xl">
                          <div className="w-full h-full rounded-full overflow-hidden bg-stone-900 border-2 border-stone-950 flex items-center justify-center">
                            {(customPhoto || selectedCouple.spouseMember?.photoUrl) ? (
                              <img 
                                src={customPhoto || selectedCouple.spouseMember?.photoUrl} 
                                alt={selectedCouple.spouseMember?.name || ''}
                                crossOrigin="anonymous" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3d0718] flex items-center justify-center text-xl font-serif font-bold text-rose-200">
                                {selectedCouple.spouseMember?.name ? selectedCouple.spouseMember.name.slice(0, 1) : '❤'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Couple Names Joined by Love */}
                      <h4 
                        className="text-base sm:text-lg font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-100 to-amber-200 tracking-wide mt-1 drop-shadow-sm"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {selectedCouple.primaryMember.name} <span className="text-rose-400 text-sm">❤</span> {selectedCouple.spouseMember?.name || 'স্ত্রী'}
                      </h4>

                      {/* Marriage Date */}
                      <p className="text-[9px] sm:text-[10px] text-amber-200/90 font-mono tracking-wide mt-0.5">
                        বিবাহের তারিখ: {selectedCouple.marriageDateStr}
                      </p>

                      {/* Heartfelt Romantic Blessing */}
                      <p 
                        className="text-[10px] sm:text-[11px] text-rose-100/90 italic mt-1.5 max-w-xs leading-relaxed px-1 font-serif"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        "আল্লাহ তায়ালা আপনাদের দাম্পত্য জীবনকে আজীবন অবিচ্ছেদ্য ভালোবাসা, পরম সুখ, শ্রদ্ধা ও অফুরন্ত শান্তিতে পরিপূর্ণ রাখুন।"
                      </p>
                    </div>

                    {/* Bottom: Sender Name & Developer Credit */}
                    <div className="relative z-10 pb-0.5 flex flex-col items-center">
                      <div className="w-16 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent mx-auto mb-1"></div>
                      <div 
                        className="text-xs sm:text-sm text-amber-200 font-semibold tracking-wide drop-shadow-xs font-serif"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {senderName.trim() ? senderName.trim() : 'শুভকামনায়: পরিবারের সকলে'}
                      </div>
                      <div className="text-[7.5px] sm:text-[8px] text-rose-200/70 font-mono tracking-wider mt-0.5 select-none">
                        This app is developed and designed by Md omars
                      </div>
                    </div>
                  </div>

                  {/* Sender Name Input & Buttons */}
                  <div className="w-full max-w-[310px] sm:max-w-[370px] md:max-w-[390px] mt-3">
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1 text-left flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>কার্ডে আপনার নাম লিখুন (কাস্টমাইজেশন):</span>
                    </label>
                    <input 
                      type="text" 
                      value={senderName} 
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="যেমন: মোঃ ওমর / পরিবারের সকলে..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800 placeholder:text-stone-400 shadow-2xs font-medium"
                      maxLength={50}
                    />
                  </div>

                  {downloadSuccess && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>বিবাহবার্ষিকী কার্ডটি সফলভাবে ডাউনলোড হয়েছে!</span>
                    </motion.div>
                  )}

                  {downloadError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{downloadError}</span>
                    </motion.div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-[310px] sm:max-w-[370px] md:max-w-[390px]">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 cursor-pointer shadow-xs transition">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>কাস্টম ছবি</span>
                      <input type="file" accept="image/*" onChange={handleCustomPhotoUpload} className="hidden" />
                    </label>

                    <button
                      onClick={downloadCardImage}
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-500 text-stone-900 shadow-sm transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloading ? 'ডাউনলোড হচ্ছে...' : 'কার্ড ডাউনলোড'}</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1A3636] hover:bg-[#254d4d] text-white shadow-xs transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-300" />}
                      <span>{copied ? 'কপি হয়েছে' : 'শেয়ার'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-stone-500">
                  <Heart className="w-12 h-12 text-rose-400/50 mb-3" />
                  <p className="font-serif text-base text-stone-800 font-semibold">
                    কার্ড দেখতে তালিকা থেকে একজন দম্পতি নির্বাচন করুন
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
