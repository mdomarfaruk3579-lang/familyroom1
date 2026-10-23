import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Member, TimelineItem } from '../types';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Plus, Edit2, Trash2, Image as ImageIcon, Save, X, ArrowUp, ArrowDown, Phone, Mail, Globe, Sparkles, Bold, Italic, Type, Calendar, HelpCircle, Search, Heart } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { COUNTRIES, getCountryDisplay } from '../data/countries';

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { t, lang, translateRole, translateType } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const addSpouseFor = searchParams.get('addSpouseFor');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    
    // Initial cache load
    try {
      const cached = localStorage.getItem('family_members_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
          setLoading(false);
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
        setLoading(false);
      },
      () => {
        // Quota or offline fallback
        try {
          const cached = localStorage.getItem('family_members_cache');
          if (cached) {
            setMembers(JSON.parse(cached));
          }
        } catch {}
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (members.length > 0) {
      if (editId) {
        const memberToEdit = members.find(m => m.id === editId);
        if (memberToEdit) {
          setEditingMember(memberToEdit);
        }
      } else if (addSpouseFor) {
        const targetMember = members.find(m => m.id === addSpouseFor);
        if (targetMember) {
          setEditingMember({
            role: 'স্ত্রী/স্বামী',
            type: 'spouse',
            spouseId: targetMember.id,
            gender: targetMember.gender === 'male' ? 'female' : 'male',
            order: targetMember.order + 1,
            currentlyLiveIn: targetMember.currentlyLiveIn || 'Bangladesh',
            timeline: [],
            socialLinks: {},
          });
        }
      }
    }
  }, [editId, addSpouseFor, members]);

  const handleAddNew = () => {
    setEditingMember({
      role: '',
      type: 'son',
      gender: 'male',
      order: members.length + 1,
      currentlyLiveIn: 'Bangladesh',
      timeline: [],
      socialLinks: {},
    });
  };

  const handleSave = async () => {
    if (!editingMember?.name || !editingMember?.role || !editingMember?.type) {
      setMessage({ text: lang === 'en' ? 'Name, Role, and Type are required' : 'নাম, ভূমিকা ও ধরণ দেওয়া আবশ্যক', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const memberRef = editingMember.id 
        ? doc(db, 'members', editingMember.id) 
        : doc(collection(db, 'members'));
      
      const { id, ...memberData } = editingMember;
      
      const dataToSave: any = {
        name: memberData.name.trim(),
        role: memberData.role.trim(),
        type: memberData.type,
        order: editingMember.order || (editingMember.id ? 0 : members.length + 1),
        createdAt: editingMember.createdAt || Date.now(),
        currentlyLiveIn: (memberData.currentlyLiveIn || 'Bangladesh').trim(),
      };

      if (memberData.dob) {
        const bnToEnMap: Record<string, string> = {
          '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
          '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
        };
        const normalizedDob = memberData.dob.replace(/[০-৯]/g, (d: string) => bnToEnMap[d] || d).trim();
        dataToSave.dob = normalizedDob;
        // Extract 4-digit year from dob for backward compatibility
        const yearMatch = normalizedDob.match(/\d{4}/);
        if (yearMatch) {
          dataToSave.birthYear = yearMatch[0];
        }
      }
      if (memberData.nameEn) dataToSave.nameEn = memberData.nameEn.trim();
      if (memberData.maritalStatus) dataToSave.maritalStatus = memberData.maritalStatus.trim();
      dataToSave.fatherId = memberData.fatherId || null;
      if (memberData.fatherName) dataToSave.fatherName = memberData.fatherName.trim();
      dataToSave.motherId = memberData.motherId || null;
      if (memberData.motherName) dataToSave.motherName = memberData.motherName.trim();
      if (!dataToSave.parentId && dataToSave.fatherId) {
        dataToSave.parentId = dataToSave.fatherId;
      }
      if (memberData.timelineEnded !== undefined) dataToSave.timelineEnded = Boolean(memberData.timelineEnded);
      if (memberData.isDeceased !== undefined) dataToSave.isDeceased = Boolean(memberData.isDeceased);
      if (memberData.deathYear) dataToSave.deathYear = memberData.deathYear.trim();
      if (memberData.phone) dataToSave.phone = memberData.phone.trim();
      if (memberData.email) dataToSave.email = memberData.email.trim();
      if (memberData.socialLinks) dataToSave.socialLinks = memberData.socialLinks;
      if (memberData.timeline && Array.isArray(memberData.timeline)) {
        dataToSave.timeline = memberData.timeline.filter(item => item.title && item.dateOrYear);
      }
      if (memberData.bio) dataToSave.bio = memberData.bio;
      if (memberData.photoUrl) dataToSave.photoUrl = memberData.photoUrl;
      if (memberData.gender) dataToSave.gender = memberData.gender;
      if (memberData.gallery) dataToSave.gallery = memberData.gallery;
      
      dataToSave.parentId = memberData.parentId || null;
      dataToSave.spouseId = memberData.spouseId || null;

      await setDoc(memberRef, dataToSave, { merge: true });
      setEditingMember(null);
      setMessage({ text: lang === 'en' ? 'Member saved successfully!' : 'সদস্যের তথ্য সফলভাবে সংরক্ষিত হয়েছে!', type: 'success' });
    } catch (error: any) {
      console.error("Error saving member:", error);
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'members', id));
      setDeleteConfirmId(null);
      setMessage({ text: lang === 'en' ? 'Member deleted successfully!' : 'সদস্য মুছে ফেলা হয়েছে!', type: 'success' });
    } catch (error) {
      console.error("Error deleting member:", error);
      setMessage({ text: 'Error deleting member', type: 'error' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'File is too large (max 5MB)', type: 'error' });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          setUploadProgress(50);
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
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setUploadProgress(100);

          if (field === 'photoUrl') {
            setEditingMember(prev => prev ? ({ ...prev, photoUrl: compressedDataUrl }) : null);
          } else {
            setEditingMember(prev => {
              if (!prev) return null;
              const currentGallery = prev.gallery || [];
              return { ...prev, gallery: [...currentGallery, compressedDataUrl] };
            });
          }
          setUploading(false);
        };
      };
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ text: 'Failed to process image', type: 'error' });
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setEditingMember(prev => {
      if (!prev || !prev.gallery) return prev;
      return { ...prev, gallery: prev.gallery.filter((_, i) => i !== index) };
    });
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const currentMember = members[index];
    const targetMember = members[targetIndex];

    try {
      await setDoc(doc(db, 'members', currentMember.id), { order: targetMember.order }, { merge: true });
      await setDoc(doc(db, 'members', targetMember.id), { order: currentMember.order }, { merge: true });
    } catch (error) {
      console.error("Error moving member:", error);
    }
  };

  // Rich Text helper for Bio
  const formatBioSelection = (tagOpen: string, tagClose: string) => {
    const textarea = bioTextareaRef.current;
    if (!textarea || !editingMember) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = editingMember.bio || '';
    const selected = current.substring(start, end);
    const textToWrap = selected || (lang === 'en' ? 'highlighted text' : 'টেক্সট');
    const replacement = `${tagOpen}${textToWrap}${tagClose}`;
    const updated = current.substring(0, start) + replacement + current.substring(end);
    
    setEditingMember({ ...editingMember, bio: updated });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, start + replacement.length - tagClose.length);
    }, 50);
  };

  // Timeline handlers
  const addTimelineEvent = () => {
    if (!editingMember) return;
    const currentTimeline = editingMember.timeline || [];
    const newEvent: TimelineItem = {
      dateOrYear: '',
      title: '',
      description: '',
    };
    setEditingMember({ ...editingMember, timeline: [...currentTimeline, newEvent] });
  };

  const updateTimelineEvent = (index: number, field: keyof TimelineItem, val: string) => {
    if (!editingMember || !editingMember.timeline) return;
    const updated = [...editingMember.timeline];
    updated[index] = { ...updated[index], [field]: val };
    setEditingMember({ ...editingMember, timeline: updated });
  };

  const removeTimelineEvent = (index: number) => {
    if (!editingMember || !editingMember.timeline) return;
    const updated = editingMember.timeline.filter((_, i) => i !== index);
    setEditingMember({ ...editingMember, timeline: updated });
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
      className="max-w-6xl mx-auto py-6 px-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A3636]">{t('adminDashboard')}</h1>
          <p className="text-stone-500 text-sm mt-1">
            {lang === 'en' ? 'Manage members, life milestones, photos, and relationships' : 'সদস্যদের তথ্য, জীবনের অধ্যায়, ছবি ও পারিবারিক সম্পর্ক নিয়ন্ত্রণ করুন'}
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-[#1A3636] hover:bg-[#254d4d] text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm transition-all text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('addMember')}
        </button>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl mb-6 shadow-sm border text-sm flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Edit/Add Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-100">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A3636]">
                  {editingMember.id ? t('editMember') : t('addMember')}
                </h2>
                <button 
                  onClick={() => setEditingMember(null)} 
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name (বাংলায়) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('name')} (বাংলায়) *
                  </label>
                  <input 
                    type="text" 
                    value={editingMember.name || ''} 
                    onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                    placeholder={lang === 'en' ? 'e.g. John Doe' : 'যেমন: মো: ওমর ফারুক'}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  />
                </div>

                {/* Name in English */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Name in English (ইংরেজিতে নাম)
                  </label>
                  <input 
                    type="text" 
                    value={editingMember.nameEn || ''} 
                    onChange={e => setEditingMember({...editingMember, nameEn: e.target.value})}
                    placeholder="e.g. Md. Omar Faruk"
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm font-sans"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('role')} *
                  </label>
                  <input 
                    type="text" 
                    value={editingMember.role || ''} 
                    onChange={e => setEditingMember({...editingMember, role: e.target.value})}
                    placeholder={lang === 'en' ? 'e.g. Eldest Son, Grandfather' : 'যেমন: বড় ছেলে, দাদা, মেজো মেয়ে'}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('type')} *
                  </label>
                  <select 
                    value={editingMember.type || 'son'} 
                    onChange={e => setEditingMember({...editingMember, type: e.target.value as any})}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  >
                    <option value="grandpa">Grandpa (দাদা/নানা)</option>
                    <option value="grandma">Grandma (দাদি/নানি)</option>
                    <option value="son">Son (ছেলে)</option>
                    <option value="daughter">Daughter (মেয়ে)</option>
                    <option value="spouse">Spouse (স্ত্রী/স্বামী)</option>
                    <option value="grandchild">Grandchild (নাতি/নাতনি)</option>
                    <option value="great-grandchild">Great Grandchild (প্রপৌত্র/প্রপৌত্রী)</option>
                    <option value="great-great-grandchild">Great-Great Grandchild</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('gender')}
                  </label>
                  <select 
                    value={editingMember.gender || 'male'} 
                    onChange={e => setEditingMember({...editingMember, gender: e.target.value as any})}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  >
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                  </select>
                </div>
                
                {/* Parent Selection if applicable */}
                {['grandchild', 'great-grandchild', 'great-great-grandchild'].includes(editingMember.type || '') && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                      {t('parent')}
                    </label>
                    <select 
                      value={editingMember.parentId || ''} 
                      onChange={e => setEditingMember({...editingMember, parentId: e.target.value})}
                      className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                    >
                      <option value="">Select Parent</option>
                      {members
                        .filter(m => {
                          if (editingMember.type === 'grandchild') return m.type === 'son' || m.type === 'daughter';
                          if (editingMember.type === 'great-grandchild') return m.type === 'grandchild';
                          if (editingMember.type === 'great-great-grandchild') return m.type === 'great-grandchild';
                          return false;
                        })
                        .map(m => (
                        <option key={m.id} value={m.id}>{m.name || m.role}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Spouse Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('spouse')}
                  </label>
                  <select 
                    value={editingMember.spouseId || ''} 
                    onChange={e => setEditingMember({...editingMember, spouseId: e.target.value})}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  >
                    <option value="">Select Spouse</option>
                    {members.filter(m => m.id !== editingMember.id).map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.role}</option>
                    ))}
                  </select>
                </div>

                {/* Date of Birth (DD/MM/YYYY) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('dateOfBirthLabel')}
                  </label>
                  <input 
                    type="text" 
                    placeholder={t('dobPlaceholder')}
                    value={editingMember.dob || ''} 
                    onChange={e => setEditingMember({...editingMember, dob: e.target.value})}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm font-mono"
                  />
                </div>

                {/* Currently Live In (Country Selection) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>currently live in - (বর্তমান বাসস্থান)</span>
                  </label>
                  <select 
                    value={editingMember.currentlyLiveIn || 'Bangladesh'} 
                    onChange={e => setEditingMember({...editingMember, currentlyLiveIn: e.target.value})}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.nameBn} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>marital status - বৈবাহিক অবস্থা</span>
                  </label>
                  <select 
                    value={editingMember.maritalStatus || ''} 
                    onChange={e => setEditingMember({...editingMember, maritalStatus: e.target.value})}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  >
                    <option value="">নির্বাচন করুন (Select)</option>
                    <option value="অবিবাহিত">অবিবাহিত (Unmarried / Single)</option>
                    <option value="বিবাহিত">বিবাহিত (Married)</option>
                    <option value="ডিভোর্সড / তালাকপ্রাপ্ত">ডিভোর্সড / তালাকপ্রাপ্ত (Divorced)</option>
                    <option value="বিপত্নীক / বিধবা">বিপত্নীক / বিধবা (Widowed)</option>
                    <option value="আলাদা বসবাসরত">আলাদা বসবাসরত (Separated)</option>
                    <option value="বাগদান সম্পন্ন">বাগদান সম্পন্ন (Engaged)</option>
                    <option value="অন্যান্য">অন্যান্য (Other)</option>
                  </select>
                </div>

                {/* Father Selection Dropdown (পিতা নির্বাচন) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                    <span>father - পিতা নির্বাচন করুন</span>
                    {editingMember.fatherName && (
                      <span className="text-[11px] text-amber-700 font-normal">বর্তমানে: {editingMember.fatherName}</span>
                    )}
                  </label>
                  <select 
                    value={editingMember.fatherId || (members.find(m => m.name === editingMember.fatherName)?.id || '')} 
                    onChange={e => {
                      const selectedId = e.target.value;
                      const selectedFather = members.find(m => m.id === selectedId);
                      setEditingMember({
                        ...editingMember,
                        fatherId: selectedId || null,
                        fatherName: selectedFather ? selectedFather.name : '',
                        parentId: selectedId || editingMember.parentId || null,
                      });
                    }}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  >
                    <option value="">-- পিতা নির্বাচন করুন (তালিকা থেকে) --</option>
                    {members
                      .filter(m => m.id !== editingMember.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role || m.type})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Mother Selection Dropdown (মাতা নির্বাচন) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                    <span>mother - মাতা নির্বাচন করুন</span>
                    {editingMember.motherName && (
                      <span className="text-[11px] text-rose-700 font-normal">বর্তমানে: {editingMember.motherName}</span>
                    )}
                  </label>
                  <select 
                    value={editingMember.motherId || (members.find(m => m.name === editingMember.motherName)?.id || '')} 
                    onChange={e => {
                      const selectedId = e.target.value;
                      const selectedMother = members.find(m => m.id === selectedId);
                      setEditingMember({
                        ...editingMember,
                        motherId: selectedId || null,
                        motherName: selectedMother ? selectedMother.name : '',
                      });
                    }}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm"
                  >
                    <option value="">-- মাতা নির্বাচন করুন (তালিকা থেকে) --</option>
                    {members
                      .filter(m => m.id !== editingMember.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role || m.type})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Deceased Status (মৃত/মরহুম) */}
                <div className="p-3 bg-stone-100 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                        <span>মৃত/মরহুম (Deceased)</span>
                      </span>
                      <p className="text-[11px] text-stone-500 mt-0.5">সদস্যটি মৃত্যুবরণ করে থাকলে এই অপশনটি অন রাখুন</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={Boolean(editingMember.isDeceased || (editingMember.deathYear && editingMember.deathYear.trim().length > 0))} 
                        onChange={e => setEditingMember({...editingMember, isDeceased: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A3636]"></div>
                    </label>
                  </div>
                </div>

                {/* Death Year (Optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('deathYear')}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2021"
                    value={editingMember.deathYear || ''} 
                    onChange={e => setEditingMember({
                      ...editingMember, 
                      deathYear: e.target.value,
                      isDeceased: e.target.value.trim().length > 0 ? true : editingMember.isDeceased
                    })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm font-mono"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('phone')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input 
                      type="tel" 
                      placeholder="+880 1XXXXXXXXX"
                      value={editingMember.phone || ''} 
                      onChange={e => setEditingMember({...editingMember, phone: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input 
                      type="email" 
                      placeholder="member@example.com"
                      value={editingMember.email || ''} 
                      onChange={e => setEditingMember({...editingMember, email: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Sorting Order */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {t('sortingOrder')}
                  </label>
                  <input 
                    type="number" 
                    value={editingMember.order || 0} 
                    onChange={e => setEditingMember({...editingMember, order: parseInt(e.target.value) || 0})}
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 text-sm font-mono"
                  />
                </div>

                {/* Social Links Section */}
                <div className="md:col-span-2 pt-2 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('socialMedia')}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">Facebook URL</label>
                      <input 
                        type="url"
                        placeholder="https://facebook.com/..."
                        value={editingMember.socialLinks?.facebook || ''}
                        onChange={e => setEditingMember({
                          ...editingMember,
                          socialLinks: { ...editingMember.socialLinks, facebook: e.target.value }
                        })}
                        className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-stone-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">WhatsApp Number / Link</label>
                      <input 
                        type="text"
                        placeholder="+88017... or link"
                        value={editingMember.socialLinks?.whatsapp || ''}
                        onChange={e => setEditingMember({
                          ...editingMember,
                          socialLinks: { ...editingMember.socialLinks, whatsapp: e.target.value }
                        })}
                        className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-stone-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">Instagram URL</label>
                      <input 
                        type="url"
                        placeholder="https://instagram.com/..."
                        value={editingMember.socialLinks?.instagram || ''}
                        onChange={e => setEditingMember({
                          ...editingMember,
                          socialLinks: { ...editingMember.socialLinks, instagram: e.target.value }
                        })}
                        className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-stone-50 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio / Info with Rich Text Formatting Toolbar */}
                <div className="md:col-span-2 pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                      {t('shortBio')}
                    </label>
                    <span className="text-[11px] text-stone-400">
                      {lang === 'en' ? 'Select text then click format buttons below' : 'টেক্সট সিলেক্ট করে নিচের ফরম্যাট বাটনে ক্লিক করুন'}
                    </span>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-100 rounded-t-xl border border-b-0 border-stone-200 text-xs">
                    <button
                      type="button"
                      onClick={() => formatBioSelection('<b>', '</b>')}
                      className="px-2 py-1 rounded bg-white hover:bg-stone-200 text-stone-800 font-bold border border-stone-300 shadow-2xs"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5 inline mr-1" /> Bold
                    </button>
                    <button
                      type="button"
                      onClick={() => formatBioSelection('<i>', '</i>')}
                      className="px-2 py-1 rounded bg-white hover:bg-stone-200 text-stone-800 italic border border-stone-300 shadow-2xs"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5 inline mr-1" /> Italic
                    </button>
                    <button
                      type="button"
                      onClick={() => formatBioSelection('<span class="text-base font-semibold">', '</span>')}
                      className="px-2 py-1 rounded bg-white hover:bg-stone-200 text-stone-800 border border-stone-300 shadow-2xs"
                      title="Large Text Size"
                    >
                      <Type className="w-3.5 h-3.5 inline mr-1" /> Large
                    </button>
                    <button
                      type="button"
                      onClick={() => formatBioSelection('<span class="text-xs">', '</span>')}
                      className="px-2 py-1 rounded bg-white hover:bg-stone-200 text-stone-800 border border-stone-300 shadow-2xs text-[11px]"
                      title="Small Text Size"
                    >
                      Small
                    </button>
                    <button
                      type="button"
                      onClick={() => formatBioSelection('<span class="font-serif">', '</span>')}
                      className="px-2 py-1 rounded bg-white hover:bg-stone-200 text-stone-800 font-serif border border-stone-300 shadow-2xs"
                      title="English Serif Font"
                    >
                      Serif Font
                    </button>
                    <button
                      type="button"
                      onClick={() => formatBioSelection('<span class="font-sans">', '</span>')}
                      className="px-2 py-1 rounded bg-white hover:bg-stone-200 text-stone-800 font-sans border border-stone-300 shadow-2xs"
                      title="Modern Sans Font"
                    >
                      Sans Font
                    </button>
                  </div>

                  <textarea 
                    ref={bioTextareaRef}
                    value={editingMember.bio || ''} 
                    onChange={e => setEditingMember({...editingMember, bio: e.target.value})}
                    placeholder={lang === 'en' ? 'Write biography, memories, family achievements...' : 'সদস্যের জীবনী, শিক্ষাজীবন, স্মৃতি বা পারিবারিক অবদান লিখুন...'}
                    className="w-full p-3 border border-stone-200 rounded-b-xl focus:ring-2 focus:ring-[#1A3636] outline-none bg-stone-50 h-28 text-sm"
                  />

                  {/* Bio Preview if has tags */}
                  {editingMember.bio && (editingMember.bio.includes('<') || editingMember.bio.includes('\n')) && (
                    <div className="mt-2 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs">
                      <div className="text-[10px] uppercase font-bold text-stone-400 mb-1">Preview:</div>
                      <div 
                        className="text-stone-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: editingMember.bio.replace(/\n/g, '<br/>') }}
                      />
                    </div>
                  )}
                </div>

                {/* Life Timeline Builder */}
                <div className="md:col-span-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t('timelineTitle')}</span>
                      </h4>
                      <p className="text-[11px] text-stone-400">{t('timelineHelper')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 border border-stone-200">
                        <input
                          type="checkbox"
                          checked={editingMember.timelineEnded || false}
                          onChange={e => setEditingMember({ ...editingMember, timelineEnded: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#1A3636] rounded"
                        />
                        <span>টাইমলাইন সমাপ্তি (End Timeline)</span>
                      </label>
                      <button
                        type="button"
                        onClick={addTimelineEvent}
                        className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 border border-amber-400/40 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('addEvent')}</span>
                      </button>
                    </div>
                  </div>

                  {(!editingMember.timeline || editingMember.timeline.length === 0) ? (
                    <div className="p-4 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-center text-xs text-stone-400">
                      {lang === 'en' ? 'No milestones added yet. Click "+ Add New Milestone" above.' : 'কোনো মাইলফলক যোগ করা হয়নি। উপরের বাটনে ক্লিক করে যোগ করতে পারেন।'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editingMember.timeline.map((event, index) => (
                        <div key={index} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                          <input 
                            type="text"
                            placeholder={t('eventDate')}
                            value={event.dateOrYear || ''}
                            onChange={e => updateTimelineEvent(index, 'dateOrYear', e.target.value)}
                            className="w-full sm:w-28 p-2 border border-stone-200 rounded-lg text-xs bg-white font-mono"
                          />
                          <input 
                            type="text"
                            placeholder={t('eventTitle')}
                            value={event.title || ''}
                            onChange={e => updateTimelineEvent(index, 'title', e.target.value)}
                            className="w-full sm:flex-1 p-2 border border-stone-200 rounded-lg text-xs bg-white font-medium"
                          />
                          <input 
                            type="text"
                            placeholder={t('eventDesc')}
                            value={event.description || ''}
                            onChange={e => updateTimelineEvent(index, 'description', e.target.value)}
                            className="w-full sm:flex-1 p-2 border border-stone-200 rounded-lg text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeTimelineEvent(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer"
                            title="Remove Milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Profile Photo */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-3">
                    {editingMember.photoUrl && (
                      <img src={editingMember.photoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-stone-200" referrerPolicy="no-referrer" />
                    )}
                    <label className="cursor-pointer bg-stone-100 text-stone-800 px-3.5 py-2 rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-2 text-xs font-medium border border-stone-200">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      <span>{uploading ? 'Processing...' : 'Upload Photo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'photoUrl')} disabled={uploading} />
                    </label>
                  </div>
                </div>

                {/* Gallery Photos */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Gallery Photos
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingMember.gallery?.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="Gallery" className="w-11 h-11 rounded-lg object-cover border border-stone-200" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="cursor-pointer bg-stone-100 text-stone-800 px-3.5 py-2 rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-2 text-xs font-medium border border-stone-200">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      <span>Add Photos</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'gallery')} disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-stone-100">
                <button 
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs sm:text-sm cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="px-6 py-2.5 rounded-full bg-[#1A3636] hover:bg-[#254d4d] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : t('saveMember')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <h3 className="text-lg font-bold text-stone-800 mb-2">{t('confirmDelete')}</h3>
              <p className="text-xs text-stone-500 mb-6">
                {lang === 'en' ? 'This action cannot be undone.' : 'এই কাজটি পরিবর্তন করা যাবে না।'}
              </p>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  {t('deleteMember')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Bar & Member Count */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-stone-200 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={adminSearchQuery}
            onChange={(e) => setAdminSearchQuery(e.target.value)}
            placeholder="সদস্যের নাম (বাংলা/ইংরেজি), সম্পর্ক, ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] focus:bg-white outline-none text-stone-800 placeholder:text-stone-400 transition-all"
          />
          {adminSearchQuery && (
            <button
              onClick={() => setAdminSearchQuery('')}
              className="absolute right-2.5 top-2 p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-stone-500 font-medium self-end sm:self-center">
          মোট সদস্য: <strong className="text-[#1A3636] font-mono">{members.length}</strong> জন
          {adminSearchQuery.trim() && (
            <span className="text-amber-800 ml-1.5 font-bold">
              (সার্চে পাওয়া গেছে: {members.filter(m => {
                const q = adminSearchQuery.toLowerCase();
                return (m.name || '').toLowerCase().includes(q) ||
                  (m.nameEn || '').toLowerCase().includes(q) ||
                  (m.role || '').toLowerCase().includes(q) ||
                  (m.dob || '').toLowerCase().includes(q) ||
                  (m.phone || '').toLowerCase().includes(q);
              }).length} জন)
            </span>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[#1A3636]">
                <th className="p-4 font-serif font-bold text-xs uppercase tracking-wider">Photo</th>
                <th className="p-4 font-serif font-bold text-xs uppercase tracking-wider">{t('name')}</th>
                <th className="p-4 font-serif font-bold text-xs uppercase tracking-wider">{t('role')}</th>
                <th className="p-4 font-serif font-bold text-xs uppercase tracking-wider">{t('dob')}</th>
                <th className="p-4 font-serif font-bold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members
                .filter(m => {
                  if (!adminSearchQuery.trim()) return true;
                  const q = adminSearchQuery.toLowerCase();
                  return (m.name || '').toLowerCase().includes(q) ||
                    (m.nameEn || '').toLowerCase().includes(q) ||
                    (m.role || '').toLowerCase().includes(q) ||
                    (m.dob || '').toLowerCase().includes(q) ||
                    (m.phone || '').toLowerCase().includes(q);
                })
                .map((member, index) => (
                <tr 
                  key={member.id} 
                  className="border-b border-stone-100 hover:bg-stone-50/80 transition-colors"
                >
                  <td className="p-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/40 bg-stone-100 flex items-center justify-center">
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="font-bold text-xs text-stone-600">
                          {member.name?.slice(0, 1)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-stone-900 text-sm">
                    <div>{member.name}</div>
                    {member.nameEn && (
                      <div className="text-xs text-stone-400 font-normal font-sans tracking-wide">
                        {member.nameEn}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-stone-600 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 font-medium">
                      {translateRole(member.role)}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-stone-500">
                    {member.dob || '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-stone-100 rounded-lg disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === members.length - 1}
                        className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-stone-100 rounded-lg disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingMember(member)}
                        className="p-1.5 text-stone-600 hover:text-[#1A3636] hover:bg-stone-100 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(member.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400 italic text-sm">
                    {lang === 'en' ? 'No family members found. Click "+ Add Family Member" to get started!' : 'কোনো সদস্য খুঁজে পাওয়া যায়নি। নতুন সদস্য যোগ করুন!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
