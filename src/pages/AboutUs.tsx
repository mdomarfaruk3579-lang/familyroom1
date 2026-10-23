import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DeveloperProfile } from '../types';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, Trash2, Image as ImageIcon, Save, X, Phone, Mail, 
  Globe, Briefcase, Code2, RotateCcw, CheckCircle2, Sparkles,
  Terminal, ShieldCheck, HeartHandshake, ExternalLink
} from 'lucide-react';

const DEFAULT_DEV_PROFILE: DeveloperProfile = {
  name: 'মো: ওমর ফারুক (Md. Omar Faruk)',
  title: 'ফুল-স্ট্যাক সফটওয়্যার ইঞ্জিনিয়ার ও প্রযুক্তি উদ্যোক্তা',
  bio: 'পারিবারিক ঐতিহ্য, দীর্ঘ বংশলতিকা এবং প্রজন্ম থেকে প্রজন্মে ছড়িয়ে থাকা অমূল্য স্মৃতিসমূহকে আধুনিক ক্লাউড প্রযুক্তির সাথে সমন্বয় করে এই পারিবারিক প্ল্যাটফর্মটি প্রস্তুত করা হয়েছে। দ্রুতগতির ব্রাউজিং, সর্বোচ্চ ডেটা সুরক্ষা এবং নান্দনিক ব্যবহারকারী অভিজ্ঞতার নিশ্চয়তা দেওয়াই আমাদের অন্যতম ব্রত। যেকোনো পরামর্শ বা কারিগরি সহায়তার জন্য নির্দ্বিধায় যোগাযোগ করুন।',
  photoUrl: '',
  phone: '+880 1700-000000',
  email: 'mdomarfaruk3579@gmail.com',
  socialLinks: {
    facebook: 'https://facebook.com',
    whatsapp: '+8801700000000',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    website: 'https://familyroom.app'
  }
};

export default function AboutUs() {
  const { isAdmin } = useAuth();
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile>(() => {
    try {
      const cached = localStorage.getItem('developer_profile_cache');
      if (cached) {
        return { ...DEFAULT_DEV_PROFILE, ...JSON.parse(cached) };
      }
    } catch {}
    return DEFAULT_DEV_PROFILE;
  });

  const [loading, setLoading] = useState(false);
  const [editingDevProfile, setEditingDevProfile] = useState<DeveloperProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [deleteDevConfirm, setDeleteDevConfirm] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Subscribe to Developer Profile from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'developer_profile', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as DeveloperProfile;
          const merged: DeveloperProfile = {
            ...DEFAULT_DEV_PROFILE,
            ...data,
            socialLinks: {
              ...DEFAULT_DEV_PROFILE.socialLinks,
              ...(data.socialLinks || {})
            }
          };
          setDeveloperProfile(merged);
          try {
            localStorage.setItem('developer_profile_cache', JSON.stringify(merged));
          } catch {}
        } else {
          setDeveloperProfile(DEFAULT_DEV_PROFILE);
        }
      },
      (err) => {
        console.warn("Could not load developer profile from Firestore, using cached/default:", err);
      }
    );
    return () => unsub();
  }, []);

  // Image upload handler with compression
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleDevImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'ছবি ৫ মেগাবাইটের কম হতে হবে', type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setEditingDevProfile(prev => prev ? ({ ...prev, photoUrl: compressed }) : null);
      setMessage({ text: 'ছবি আপলোড সম্পন্ন!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'ছবি আপলোডে সমস্যা হয়েছে', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Developer Profile Save & Delete Handlers
  const handleSaveDevProfile = async () => {
    if (!editingDevProfile?.name?.trim()) {
      setMessage({ text: 'ডেভেলপারের নাম আবশ্যক', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const dataToSave: DeveloperProfile = {
        name: editingDevProfile.name.trim(),
        title: (editingDevProfile.title || '').trim(),
        bio: (editingDevProfile.bio || '').trim(),
        photoUrl: editingDevProfile.photoUrl || '',
        phone: (editingDevProfile.phone || '').trim(),
        email: (editingDevProfile.email || '').trim(),
        socialLinks: {
          facebook: (editingDevProfile.socialLinks?.facebook || '').trim(),
          whatsapp: (editingDevProfile.socialLinks?.whatsapp || '').trim(),
          github: (editingDevProfile.socialLinks?.github || '').trim(),
          linkedin: (editingDevProfile.socialLinks?.linkedin || '').trim(),
          website: (editingDevProfile.socialLinks?.website || '').trim(),
        },
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'developer_profile', 'main'), dataToSave, { merge: true });
      setDeveloperProfile(dataToSave);
      try {
        localStorage.setItem('developer_profile_cache', JSON.stringify(dataToSave));
      } catch {}
      setEditingDevProfile(null);
      setMessage({ text: 'ডেভেলপার প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!', type: 'success' });
    } catch (error: any) {
      console.error("Error saving developer profile:", error);
      setMessage({ text: `সংরক্ষণে ত্রুটি: ${error.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDevProfile = async () => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'developer_profile', 'main'));
      setDeveloperProfile(DEFAULT_DEV_PROFILE);
      try {
        localStorage.removeItem('developer_profile_cache');
      } catch {}
      setEditingDevProfile(null);
      setDeleteDevConfirm(false);
      setMessage({ text: 'ডেভেলপার প্রোফাইল ডিফল্ট তথ্যে রিসেট করা হয়েছে', type: 'success' });
    } catch (error: any) {
      console.error("Error resetting developer profile:", error);
      setMessage({ text: `রিসেটে সমস্যা: ${error.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-6 sm:py-12 px-4 sm:px-6"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-2 border ${
              message.type === 'success' 
                ? 'bg-emerald-900/90 text-white border-emerald-500/30 backdrop-blur-md' 
                : 'bg-red-900/90 text-white border-red-500/30 backdrop-blur-md'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <X className="w-4 h-4 text-red-400" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEVELOPER PROFILE EXCLUSIVE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1a1a] via-[#1A3636] to-[#0f2424] text-white p-6 sm:p-12 border-2 border-amber-400/40 shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Badges & Admin Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 relative z-10 border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 via-amber-300/15 to-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ওয়েবসাইট ডেভেলপার পরিচিতি • Developer Profile</span>
          </div>

          {/* Admin Edit & Delete Buttons */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingDevProfile({ ...developerProfile })}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
                title="ডেভেলপার তথ্য পরিবর্তন ও সংরক্ষণ করুন"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>এডিট করুন</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteDevConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 font-medium text-xs rounded-full transition-all cursor-pointer"
                title="ডিফল্ট তথ্যে রিসেট / ডিলিট করুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>রিসেট / ডিলিট</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Content Body */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-12 relative z-10">
          {/* Developer Picture Frame with Radiant Ring */}
          <div className="relative group shrink-0">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full p-2 bg-gradient-to-tr from-amber-400 via-amber-200 to-emerald-400 shadow-2xl ring-4 ring-amber-400/25 group-hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-stone-900 border-2 border-white/90 flex items-center justify-center shadow-inner">
                {developerProfile.photoUrl ? (
                  <img 
                    src={developerProfile.photoUrl} 
                    alt={developerProfile.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#122b2b] to-stone-950 text-amber-200">
                    <Code2 className="w-14 h-14 text-amber-300 mb-1 opacity-90" />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold">DEVELOPER</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Developer Information */}
          <div className="flex-1 text-center md:text-left">
            {/* Premium Font Developer Name */}
            <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 drop-shadow-md mb-2">
              {developerProfile.name}
            </h1>

            {/* Title / Profession Badge */}
            {developerProfile.title && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-200 text-xs sm:text-sm font-semibold mb-5 shadow-xs">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>{developerProfile.title}</span>
              </div>
            )}

            {/* Details / Bio */}
            <p className="text-stone-200 text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line font-light">
              {developerProfile.bio}
            </p>

            {/* Quick Contact: Phone & Email */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              {developerProfile.phone && (
                <a
                  href={`tel:${developerProfile.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:scale-105 active:scale-95"
                  title="সরাসরি কল করুন"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">{developerProfile.phone}</span>
                </a>
              )}

              {developerProfile.email && (
                <a
                  href={`mailto:${developerProfile.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/40 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:scale-105 active:scale-95"
                  title="ইমেইল পাঠান"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono">{developerProfile.email}</span>
                </a>
              )}
            </div>

            {/* Social Accounts Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span className="text-xs text-stone-400 font-medium mr-1">সামাজিক যোগাযোগ:</span>

              {developerProfile.socialLinks?.facebook && (
                <a
                  href={developerProfile.socialLinks.facebook.startsWith('http') ? developerProfile.socialLinks.facebook : `https://${developerProfile.socialLinks.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#1877F2] text-white text-xs font-medium transition-all border border-white/20 shadow-xs hover:scale-105"
                  title="Facebook Profile"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </a>
              )}

              {developerProfile.socialLinks?.whatsapp && (
                <a
                  href={developerProfile.socialLinks.whatsapp.startsWith('http') ? developerProfile.socialLinks.whatsapp : `https://wa.me/${developerProfile.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#25D366] text-white text-xs font-medium transition-all border border-white/20 shadow-xs hover:scale-105"
                  title="WhatsApp"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 0C5.396 0 .016 5.38.016 12.015c0 2.118.552 4.187 1.6 6.012L0 24l6.166-1.618a11.97 11.97 0 0 0 5.865 1.528h.005c6.635 0 12.016-5.38 12.016-12.015C24.052 5.38 18.671 0 12.031 0zm-.005 21.99a9.96 9.96 0 0 1-5.078-1.385l-.364-.216-3.768.988 1.006-3.673-.238-.378a9.96 9.96 0 0 1-1.528-5.31c0-5.502 4.478-9.98 9.98-9.98 2.666 0 5.172 1.038 7.057 2.924a9.93 9.93 0 0 1 2.923 7.056c0 5.503-4.478 9.98-9.988 9.98z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              )}

              {developerProfile.socialLinks?.github && (
                <a
                  href={developerProfile.socialLinks.github.startsWith('http') ? developerProfile.socialLinks.github : `https://${developerProfile.socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-stone-800 text-white text-xs font-medium transition-all border border-white/20 shadow-xs hover:scale-105"
                  title="GitHub Profile"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </a>
              )}

              {developerProfile.socialLinks?.linkedin && (
                <a
                  href={developerProfile.socialLinks.linkedin.startsWith('http') ? developerProfile.socialLinks.linkedin : `https://${developerProfile.socialLinks.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#0A66C2] text-white text-xs font-medium transition-all border border-white/20 shadow-xs hover:scale-105"
                  title="LinkedIn Profile"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              )}

              {developerProfile.socialLinks?.website && (
                <a
                  href={developerProfile.socialLinks.website.startsWith('http') ? developerProfile.socialLinks.website : `https://${developerProfile.socialLinks.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-amber-400 hover:text-stone-950 text-white text-xs font-medium transition-all border border-white/20 shadow-xs hover:scale-105"
                  title="ওয়েবসাইট / পোর্টফোলিও"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
            <Terminal className="w-5 h-5 text-amber-400 mb-1" />
            <h4 className="text-xs font-bold text-amber-200">কাস্টম আর্কিটেকচার</h4>
            <p className="text-[11px] text-stone-300 font-light mt-0.5">রিয়েল-টাইম ক্লাউড সিঙ্ক ও দ্রুতগতির ইন্টারফেস</p>
          </div>

          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
            <h4 className="text-xs font-bold text-emerald-200">ডেটা সুরক্ষা ও নিরাপত্তা</h4>
            <p className="text-[11px] text-stone-300 font-light mt-0.5">অ্যাডমিন অ্যাক্সেস রুলস ও সুরক্ষিত রেকর্ড</p>
          </div>

          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
            <HeartHandshake className="w-5 h-5 text-rose-400 mb-1" />
            <h4 className="text-xs font-bold text-rose-200">পারিবারিক ঐতিহ্য সংরক্ষণ</h4>
            <p className="text-[11px] text-stone-300 font-light mt-0.5">প্রজন্ম থেকে প্রজন্মে অম্লান ভালোবাসার মেলবন্ধন</p>
          </div>
        </div>
      </div>

      {/* DEVELOPER PROFILE EDIT MODAL (Admin Only) */}
      <AnimatePresence>
        {editingDevProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
            onClick={() => setEditingDevProfile(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-6 border border-stone-200 max-h-[92vh] overflow-y-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
                <h3 className="text-xl font-serif font-bold text-[#1A3636] flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-600" />
                  <span>ডেভেলপার প্রোফাইল সম্পাদনা (Edit Profile)</span>
                </h3>
                <button 
                  onClick={() => setEditingDevProfile(null)}
                  className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Developer Picture Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400 bg-white shrink-0 shadow-sm">
                    {editingDevProfile.photoUrl ? (
                      <img src={editingDevProfile.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#1A3636] hover:bg-[#254d4d] text-white rounded-full text-xs font-semibold transition-colors shadow-xs">
                      <ImageIcon className="w-4 h-4 text-amber-300" />
                      <span>{uploading ? 'প্রসেস হচ্ছে...' : 'ছবি পরিবর্তন বা আপলোড করুন'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleDevImageUpload} disabled={uploading} />
                    </label>
                    <p className="text-[11px] text-stone-500 mt-1.5">স্পষ্ট পোর্ট্রেট ছবি আপলোড করুন (সর্বোচ্চ ৫ MB)</p>
                  </div>
                </div>

                {/* Name & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ডেভেলপারের নাম *</label>
                    <input 
                      type="text" 
                      value={editingDevProfile.name} 
                      onChange={e => setEditingDevProfile({ ...editingDevProfile, name: e.target.value })}
                      placeholder="মো: ওমর ফারুক"
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">পদবি / পেশা (Title / Role)</label>
                    <input 
                      type="text" 
                      value={editingDevProfile.title} 
                      onChange={e => setEditingDevProfile({ ...editingDevProfile, title: e.target.value })}
                      placeholder="সফটওয়্যার ডেভেলপার"
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                    />
                  </div>
                </div>

                {/* Bio / Details */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিস্তারিত বিবরণ (Details / Bio)</label>
                  <textarea 
                    value={editingDevProfile.bio} 
                    onChange={e => setEditingDevProfile({ ...editingDevProfile, bio: e.target.value })}
                    rows={4}
                    placeholder="ডেভেলপারের অভিজ্ঞতা, কাজের বিবরণ ও বার্তা..."
                    className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ফোন নম্বর (Phone)</label>
                    <input 
                      type="text" 
                      value={editingDevProfile.phone || ''} 
                      onChange={e => setEditingDevProfile({ ...editingDevProfile, phone: e.target.value })}
                      placeholder="+880 1XXXXXXXXX"
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ইমেইল (Email)</label>
                    <input 
                      type="email" 
                      value={editingDevProfile.email || ''} 
                      onChange={e => setEditingDevProfile({ ...editingDevProfile, email: e.target.value })}
                      placeholder="mdomarfaruk3579@gmail.com"
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">সোশ্যাল মিডিয়া ও লিংক (Social Links)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-stone-500 block mb-0.5">Facebook Profile</span>
                      <input 
                        type="text" 
                        value={editingDevProfile.socialLinks?.facebook || ''} 
                        onChange={e => setEditingDevProfile({ 
                          ...editingDevProfile, 
                          socialLinks: { ...editingDevProfile.socialLinks, facebook: e.target.value } 
                        })}
                        placeholder="https://facebook.com/..."
                        className="w-full p-2 text-xs border border-stone-300 rounded-xl outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-stone-500 block mb-0.5">WhatsApp Number / Link</span>
                      <input 
                        type="text" 
                        value={editingDevProfile.socialLinks?.whatsapp || ''} 
                        onChange={e => setEditingDevProfile({ 
                          ...editingDevProfile, 
                          socialLinks: { ...editingDevProfile.socialLinks, whatsapp: e.target.value } 
                        })}
                        placeholder="+8801700000000"
                        className="w-full p-2 text-xs border border-stone-300 rounded-xl outline-none font-mono"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-stone-500 block mb-0.5">GitHub Profile</span>
                      <input 
                        type="text" 
                        value={editingDevProfile.socialLinks?.github || ''} 
                        onChange={e => setEditingDevProfile({ 
                          ...editingDevProfile, 
                          socialLinks: { ...editingDevProfile.socialLinks, github: e.target.value } 
                        })}
                        placeholder="https://github.com/..."
                        className="w-full p-2 text-xs border border-stone-300 rounded-xl outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-stone-500 block mb-0.5">LinkedIn Profile</span>
                      <input 
                        type="text" 
                        value={editingDevProfile.socialLinks?.linkedin || ''} 
                        onChange={e => setEditingDevProfile({ 
                          ...editingDevProfile, 
                          socialLinks: { ...editingDevProfile.socialLinks, linkedin: e.target.value } 
                        })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full p-2 text-xs border border-stone-300 rounded-xl outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[11px] text-stone-500 block mb-0.5">Website / Portfolio Link</span>
                      <input 
                        type="text" 
                        value={editingDevProfile.socialLinks?.website || ''} 
                        onChange={e => setEditingDevProfile({ 
                          ...editingDevProfile, 
                          socialLinks: { ...editingDevProfile.socialLinks, website: e.target.value } 
                        })}
                        placeholder="https://..."
                        className="w-full p-2 text-xs border border-stone-300 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-stone-200 flex flex-wrap justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteDevConfirm(true)}
                  className="px-4 py-2 rounded-full border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                >
                  রিসেট / ডিফল্ট করুন
                </button>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditingDevProfile(null)}
                    className="px-5 py-2 border border-stone-300 rounded-full text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveDevProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-[#1A3636] hover:bg-[#254d4d] text-white rounded-full text-xs font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4 text-amber-300" />
                    )}
                    <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete / Reset Developer Profile Confirmation Modal */}
      <AnimatePresence>
        {deleteDevConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setDeleteDevConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#1A3636] mb-2">প্রোফাইল রিসেট নিশ্চিতকরণ</h3>
              <p className="text-stone-500 text-xs sm:text-sm mb-6">
                কাস্টম তথ্য মুছে ডেভেলপার প্রোফাইলটিকে পূর্বনির্ধারিত মূল ডিফল্ট তথ্যে ফিরিয়ে নেওয়া হবে।
              </p>
              
              <div className="flex gap-3 justify-center">
                <button 
                  type="button"
                  onClick={() => setDeleteDevConfirm(false)}
                  className="px-5 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteDevProfile}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  রিসেট করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
