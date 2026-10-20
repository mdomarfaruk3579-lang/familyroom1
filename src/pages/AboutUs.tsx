import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AboutPost, Member } from '../types';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, Save, X, Phone, Mail, 
  Globe, Briefcase, Award, Shield, Users, Heart, Share2, Search, Sparkles
} from 'lucide-react';

interface ParsedProfile {
  id: string;
  name: string;
  profession: string;
  details: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  socialLinks?: {
    facebook?: string;
    whatsapp?: string;
    website?: string;
  };
  createdAt: number;
  order: number;
  isCustom: boolean;
}

export default function AboutUs() {
  const { isAdmin } = useAuth();
  const { t, lang } = useLanguage();
  const [posts, setPosts] = useState<AboutPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit modal state
  const [editingProfile, setEditingProfile] = useState<{
    id?: string;
    name: string;
    profession: string;
    details: string;
    photoUrl?: string;
    phone: string;
    email: string;
    facebook: string;
    whatsapp: string;
    website: string;
    order: number;
    createdAt?: number;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Subscribe to about_posts
  useEffect(() => {
    const q = query(collection(db, 'about_posts'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AboutPost));
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to family members for fallback/initial rich showcase
  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(data);
    });
    return () => unsubscribe();
  }, []);

  // Parse about_posts (which may contain JSON structured data in content)
  const parsedProfiles: ParsedProfile[] = useMemo(() => {
    const customList = posts.map(post => {
      let profession = '';
      let details = post.content || '';
      let phone = '';
      let email = '';
      let socialLinks: any = {};

      try {
        if (post.content && post.content.trim().startsWith('{')) {
          const parsed = JSON.parse(post.content);
          profession = parsed.profession || '';
          details = parsed.details || '';
          phone = parsed.phone || '';
          email = parsed.email || '';
          socialLinks = parsed.socialLinks || {};
        }
      } catch (e) {
        // Fallback: standard plain text
      }

      return {
        id: post.id,
        name: post.title,
        profession,
        details,
        photoUrl: post.photoUrl,
        phone,
        email,
        socialLinks,
        createdAt: post.createdAt,
        order: post.order,
        isCustom: true,
      };
    });

    return customList;
  }, [posts]);

  // Combine custom profiles with featured members if no custom posts exist yet
  const displayProfiles = useMemo(() => {
    let list: ParsedProfile[] = [...parsedProfiles];

    // If few custom posts, highlight key family elders/leaders from members
    if (list.length === 0 && members.length > 0) {
      const featured = members
        .filter(m => m.type === 'grandpa' || m.type === 'grandma' || m.type === 'son')
        .slice(0, 6)
        .map(m => ({
          id: `member-${m.id}`,
          name: m.name,
          profession: m.role || 'পারিবারিক অভিভাবক',
          details: m.bio || 'পরিবারের অন্যতম দিকনির্দেশক ও প্রিয়জন। পরিবারের সংহতি ও ঐতিহ্যের ধারক।',
          photoUrl: m.photoUrl,
          phone: m.phone || '',
          email: m.email || '',
          socialLinks: m.socialLinks || {},
          createdAt: m.createdAt || Date.now(),
          order: m.order,
          isCustom: false,
        }));
      list = featured;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.profession.toLowerCase().includes(q) ||
      p.details.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  }, [parsedProfiles, members, searchQuery]);

  // Image upload handler with smart compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'ফাইলটি অনেক বড় (সর্বোচ্চ ৫ মেগাবাইট)', type: 'error' });
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          setUploadProgress(55);
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 900;
          const MAX_HEIGHT = 900;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          
          setEditingProfile(prev => {
            if (!prev) return prev;
            return { ...prev, photoUrl: dataUrl };
          });
          
          setUploading(false);
          setUploadProgress(100);
          setMessage({ text: 'ছবি সফলভাবে লোড হয়েছে!', type: 'success' });
          setTimeout(() => setUploadProgress(0), 1000);
        };
      };
    } catch (error) {
      console.error("Error processing image:", error);
      setMessage({ text: 'ছবি প্রসেস করতে সমস্যা হয়েছে', type: 'error' });
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingProfile?.name?.trim()) {
      setMessage({ text: 'সদস্যের নাম আবশ্যক', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const postRef = editingProfile.id && !editingProfile.id.startsWith('member-')
        ? doc(db, 'about_posts', editingProfile.id) 
        : doc(collection(db, 'about_posts'));
      
      // Store structured fields inside content JSON for full firestore.rules compatibility
      const contentPayload = JSON.stringify({
        profession: editingProfile.profession.trim(),
        details: editingProfile.details.trim(),
        phone: editingProfile.phone.trim(),
        email: editingProfile.email.trim(),
        socialLinks: {
          facebook: editingProfile.facebook.trim(),
          whatsapp: editingProfile.whatsapp.trim(),
          website: editingProfile.website.trim(),
        }
      });

      const dataToSave: any = {
        title: editingProfile.name.trim(),
        content: contentPayload,
        order: Number(editingProfile.order) || (posts.length + 1),
        createdAt: editingProfile.createdAt || Date.now(),
      };

      if (editingProfile.photoUrl) {
        dataToSave.photoUrl = editingProfile.photoUrl;
      }

      await setDoc(postRef, dataToSave, { merge: true });
      setEditingProfile(null);
      setMessage({ text: 'সদস্য পরিচিতি সফলভাবে সংরক্ষিত হয়েছে!', type: 'success' });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setMessage({ text: `সংরক্ষণে ত্রুটি: ${error.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'about_posts', id));
      setDeleteConfirmId(null);
      setMessage({ text: 'সদস্য পরিচিতি মুছে ফেলা হয়েছে', type: 'success' });
    } catch (error) {
      console.error("Error deleting post:", error);
      setMessage({ text: 'ডিলিট করতে সমস্যা হয়েছে', type: 'error' });
    }
  };

  const handleOpenEdit = (profile: ParsedProfile) => {
    setEditingProfile({
      id: profile.isCustom ? profile.id : undefined,
      name: profile.name,
      profession: profile.profession,
      details: profile.details,
      photoUrl: profile.photoUrl,
      phone: profile.phone || '',
      email: profile.email || '',
      facebook: profile.socialLinks?.facebook || '',
      whatsapp: profile.socialLinks?.whatsapp || '',
      website: profile.socialLinks?.website || '',
      order: profile.order || 0,
      createdAt: profile.createdAt,
    });
  };

  const handleOpenAdd = () => {
    setEditingProfile({
      name: '',
      profession: '',
      details: '',
      phone: '',
      email: '',
      facebook: '',
      whatsapp: '',
      website: '',
      order: posts.length + 1,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EAE6DF] border-t-[#1A3636]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6"
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
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prestigious Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1e1e] via-[#1A3636] to-[#122828] text-white p-6 sm:p-12 mb-10 border border-amber-400/20 shadow-2xl">
        {/* Decorative Golden Ambient Gradients */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-200 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>আমাদের বংশপরম্পরা ও গর্বের ইতিহাস</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 mb-4 tracking-tight drop-shadow-sm">
            আমাদের পরিবার ও ঐতিহ্য
          </h1>
          
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
            মরহুম হাজী মোঃ সামছুজ্জোহা ও কুতুরের নেসা-র আদর্শ, সততা ও পরম স্নেহে গড়ে ওঠা এক সুদৃঢ় পরিবারের বন্ধন। 
            প্রজন্ম থেকে প্রজন্মে ছড়িয়ে থাকা আমাদের কৃতি সন্তান ও প্রিয় মুখদের পরিচয় ও অবদানের সংকলন।
          </p>

          {/* Quick Stats Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 border-t border-white/10 text-xs sm:text-sm text-stone-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>ঐতিহ্যের বন্ধন</span>
            </div>
            <span className="text-amber-400/50 hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>৪ প্রজন্মের পরিবার</span>
            </div>
            <span className="text-amber-400/50 hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>চিরন্তন ঐক্য ও সম্প্রীতি</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Add New Showcase Member (for Admin) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#C19A6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="সদস্য, পেশা বা পরিচিতি খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#EAE6DF] rounded-full shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#C19A6B] text-[#1A3636] placeholder:text-stone-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isAdmin && (
          <button 
            onClick={handleOpenAdd}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1A3636] hover:bg-[#254d4d] text-amber-200 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 border border-amber-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সদস্য পরিচিতি যোগ করুন</span>
          </button>
        )}
      </div>

      {/* Elegant Member Showcase Grid */}
      {displayProfiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EAE6DF] shadow-2xs">
          <Users className="w-12 h-12 text-[#C19A6B] mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-serif font-bold text-[#1A3636] mb-1">কোনো সদস্য পাওয়া যায়নি</h3>
          <p className="text-stone-500 text-xs">অনুসন্ধান পরিবর্তন করুন অথবা অ্যাডমিন থেকে নতুন তথ্য যুক্ত করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayProfiles.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white/95 rounded-3xl p-6 sm:p-7 border border-[#EAE6DF] shadow-xs hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Admin Quick Action Buttons */}
              {isAdmin && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-full transition-colors border border-stone-200 shadow-2xs cursor-pointer"
                    title="Edit Member Showcase"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {p.isCustom && (
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-1.5 bg-stone-100 hover:bg-red-100 text-stone-700 hover:text-red-600 rounded-full transition-colors border border-stone-200 shadow-2xs cursor-pointer"
                      title="Delete Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div>
                {/* Photo & Portrait with Gold Accent */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-amber-200 to-emerald-400 shadow-md shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden bg-stone-100 border border-white">
                      {p.photoUrl ? (
                        <img 
                          src={p.photoUrl} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-serif font-bold text-[#1A3636] bg-[#EAE6DF]">
                          {p.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and Profession */}
                  <div className="flex-1 min-w-0 pr-12">
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-[#1A3636] truncate leading-tight group-hover:text-amber-800 transition-colors">
                      {p.name}
                    </h3>
                    {p.profession ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full mt-1.5 truncate max-w-full">
                        <Briefcase className="w-3 h-3 text-amber-700 shrink-0" />
                        <span className="truncate">{p.profession}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic mt-1">পারিবারিক সদস্য</p>
                    )}
                  </div>
                </div>

                {/* Details / Info paragraph */}
                {p.details && (
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-5 whitespace-pre-line line-clamp-4">
                    {p.details}
                  </p>
                )}
              </div>

              {/* Contact & Social Links Bar */}
              <div className="pt-4 border-t border-[#EAE6DF]/70 flex flex-wrap items-center justify-between gap-2 mt-auto">
                <div className="flex flex-wrap items-center gap-2">
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-mono font-medium transition-colors"
                      title="কল করুন"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{p.phone}</span>
                    </a>
                  )}

                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-xs font-medium transition-colors"
                      title="ইমেইল পাঠান"
                    >
                      <Mail className="w-3 h-3 text-blue-600" />
                      <span className="truncate max-w-[120px]">{p.email}</span>
                    </a>
                  )}
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {p.socialLinks?.facebook && (
                    <a
                      href={p.socialLinks.facebook.startsWith('http') ? p.socialLinks.facebook : `https://${p.socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-stone-100 hover:bg-[#1877F2]/10 text-stone-600 hover:text-[#1877F2] transition-colors border border-stone-200"
                      title="Facebook"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}

                  {p.socialLinks?.whatsapp && (
                    <a
                      href={p.socialLinks.whatsapp.startsWith('http') ? p.socialLinks.whatsapp : `https://wa.me/${p.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-stone-100 hover:bg-[#25D366]/10 text-stone-600 hover:text-[#25D366] transition-colors border border-stone-200"
                      title="WhatsApp"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.031 0C5.396 0 .016 5.38.016 12.015c0 2.118.552 4.187 1.6 6.012L0 24l6.166-1.618a11.97 11.97 0 0 0 5.865 1.528h.005c6.635 0 12.016-5.38 12.016-12.015C24.052 5.38 18.671 0 12.031 0zm-.005 21.99a9.96 9.96 0 0 1-5.078-1.385l-.364-.216-3.768.988 1.006-3.673-.238-.378a9.96 9.96 0 0 1-1.528-5.31c0-5.502 4.478-9.98 9.98-9.98 2.666 0 5.172 1.038 7.057 2.924a9.93 9.93 0 0 1 2.923 7.056c0 5.503-4.478 9.98-9.988 9.98z" />
                      </svg>
                    </a>
                  )}

                  {p.socialLinks?.website && (
                    <a
                      href={p.socialLinks.website.startsWith('http') ? p.socialLinks.website : `https://${p.socialLinks.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 transition-colors border border-stone-200"
                      title="Website / Portfolio"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Profile Modal (Admin Only) */}
      <AnimatePresence>
        {editingProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
            onClick={() => setEditingProfile(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8 text-left border border-stone-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#EAE6DF]">
                <h3 className="text-xl font-serif font-bold text-[#1A3636] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span>{editingProfile.id ? 'সদস্য পরিচিতি সম্পাদনা' : 'নতুন সদস্য পরিচিতি যোগ করুন'}</span>
                </h3>
                <button 
                  onClick={() => setEditingProfile(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Photo Upload & Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400 bg-white shrink-0 shadow-sm">
                    {editingProfile.photoUrl ? (
                      <img src={editingProfile.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#1A3636] hover:bg-[#254d4d] text-white rounded-full text-xs font-semibold transition-colors shadow-xs">
                      <ImageIcon className="w-4 h-4 text-amber-300" />
                      <span>{uploading ? 'আপলোড হচ্ছে...' : 'ছবি পরিবর্তন / আপলোড'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <p className="text-[11px] text-stone-500 mt-1.5">স্পষ্ট পোর্ট্রেট ছবি আপলোড করুন (সর্বোচ্চ ৫ MB)</p>
                  </div>
                </div>

                {/* Name & Profession */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">নাম *</label>
                    <input 
                      type="text" 
                      value={editingProfile.name} 
                      onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                      placeholder="সদস্যের নাম"
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">পেশা ও পদবি (Profession)</label>
                    <input 
                      type="text" 
                      value={editingProfile.profession} 
                      onChange={e => setEditingProfile({ ...editingProfile, profession: e.target.value })}
                      placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার, শিক্ষক..."
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                    />
                  </div>
                </div>

                {/* Details / Bio */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">পরিচয় ও বিবরণ (Details / Info)</label>
                  <textarea 
                    value={editingProfile.details} 
                    onChange={e => setEditingProfile({ ...editingProfile, details: e.target.value })}
                    rows={4}
                    placeholder="সদস্যের জীবন, অর্জন, শিক্ষা বা পারিবারিক অবদান সম্পর্কিত তথ্য..."
                    className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">মোবাইল নম্বর (Phone)</label>
                    <input 
                      type="text" 
                      value={editingProfile.phone} 
                      onChange={e => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                      placeholder="017xxxxxxxx"
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ইমেইল (Email)</label>
                    <input 
                      type="email" 
                      value={editingProfile.email} 
                      onChange={e => setEditingProfile({ ...editingProfile, email: e.target.value })}
                      placeholder="example@gmail.com"
                      className="w-full p-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ফেসবুক লিংক</label>
                    <input 
                      type="text" 
                      value={editingProfile.facebook} 
                      onChange={e => setEditingProfile({ ...editingProfile, facebook: e.target.value })}
                      placeholder="facebook.com/..."
                      className="w-full p-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">হোয়াটসঅ্যাপ নম্বর</label>
                    <input 
                      type="text" 
                      value={editingProfile.whatsapp} 
                      onChange={e => setEditingProfile({ ...editingProfile, whatsapp: e.target.value })}
                      placeholder="017xxxxxxxx"
                      className="w-full p-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ওয়েবসাইট / লিংক</label>
                    <input 
                      type="text" 
                      value={editingProfile.website} 
                      onChange={e => setEditingProfile({ ...editingProfile, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none"
                    />
                  </div>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ডিসপ্লে ক্রম (Order)</label>
                  <input 
                    type="number" 
                    value={editingProfile.order} 
                    onChange={e => setEditingProfile({ ...editingProfile, order: parseInt(e.target.value) || 0 })}
                    className="w-24 p-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#EAE6DF] flex justify-end gap-3">
                <button 
                  onClick={() => setEditingProfile(null)}
                  className="px-5 py-2 border border-stone-300 rounded-full text-xs sm:text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-[#1A3636] hover:bg-[#254d4d] text-white rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#1A3636] mb-2">আপনি কি নিশ্চিত?</h3>
              <p className="text-stone-500 text-xs sm:text-sm mb-6">এই সদস্যের পরিচিতি তথ্য সম্পূর্ণভাবে মুছে ফেলা হবে।</p>
              
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 py-2 rounded-full border border-stone-300 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-sm"
                >
                  মুছে ফেলুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
