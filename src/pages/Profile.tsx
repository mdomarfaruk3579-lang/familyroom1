import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';
import { Calendar, Info, Image as ImageIcon, Edit, ArrowLeft, Heart, Plus, Cake, Phone, Mail, Globe, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import MemberCard from '../components/MemberCard';
import { motion } from 'framer-motion';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [spouse, setSpouse] = useState<Member | null>(null);
  const [children, setChildren] = useState<Member[]>([]);
  const { isAdmin } = useAuth();
  const { t, lang, translateRole } = useLanguage();
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const toggleTimelineEnd = async () => {
    if (!isAdmin || !member) return;
    try {
      await updateDoc(doc(db, 'members', member.id), {
        timelineEnded: !member.timelineEnded
      });
    } catch (err) {
      console.error('Error toggling timeline end:', err);
    }
  };

  useEffect(() => {
    if (!id) return;

    // Listen to main member
    const unsubMember = onSnapshot(doc(db, 'members', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Member;
        setMember(data);
        
        // Listen to spouse
        const qSpouse = query(collection(db, 'members'), where('spouseId', '==', id));
        const unsubSpouse1 = onSnapshot(qSpouse, (snap) => {
          if (!snap.empty) {
            setSpouse({ id: snap.docs[0].id, ...snap.docs[0].data() } as Member);
          } else if (data.spouseId) {
            const unsubSpouse2 = onSnapshot(doc(db, 'members', data.spouseId), (spouseDoc) => {
              if (spouseDoc.exists()) {
                setSpouse({ id: spouseDoc.id, ...spouseDoc.data() } as Member);
              }
            });
            return () => unsubSpouse2();
          } else {
            setSpouse(null);
          }
        });

        // Listen to children
        const qChildren = query(collection(db, 'members'), where('parentId', '==', id));
        const unsubChildren1 = onSnapshot(qChildren, (snap) => {
          let kids = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
          setChildren(kids.sort((a, b) => a.order - b.order));
        });

        return () => {
          unsubSpouse1();
          unsubChildren1();
        };
      }
    });

    return () => unsubMember();
  }, [id]);

  if (!member) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-[#1A3636]"></div>
      </div>
    );
  }

  const seed = encodeURIComponent(member.name || member.role || 'family');
  const avatarStyle = member.gender === 'female' ? 'lorelei' : 'micah';
  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=EAE6DF`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto py-8 px-4"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-[#1A3636] hover:text-amber-700 mb-6 font-medium transition-colors cursor-pointer">
        <ArrowLeft className="w-5 h-5" /> {t('backToFamilyTree')}
      </Link>

      <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 border border-stone-200 relative">
        {isAdmin && (
          <Link 
            to={`/admin?edit=${member.id}`}
            className="absolute top-6 right-6 flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-stone-900 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors shadow-xs text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Edit className="w-4 h-4" /> {t('editProfile')}
          </Link>
        )}

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-amber-400/30 shadow-md shrink-0 bg-stone-100"
          >
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover p-2" />
            )}
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A3636] mb-0.5">
              {member.name}
            </h1>
            {member.nameEn && (
              <p className="text-sm sm:text-base font-serif italic text-amber-800 font-medium mb-3 tracking-wide">
                {member.nameEn}
              </p>
            )}
            <div className="inline-block px-3.5 py-1 bg-[#1A3636] text-amber-200 rounded-full font-medium mb-4 tracking-wide text-xs sm:text-sm shadow-xs">
              {translateRole(member.role)}
            </div>
            
            {/* Dates */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs sm:text-sm text-stone-600 justify-center md:justify-start">
              {member.dob && (
                <div className="flex items-center gap-1.5 font-medium text-stone-900">
                  <Cake className="w-4 h-4 text-amber-600" />
                  <span>{t('dob')}: <strong className="font-mono text-amber-800">{member.dob}</strong></span>
                </div>
              )}
              {member.deathYear && (
                <div className="flex items-center gap-1.5 text-stone-500">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>{t('died')}: {member.deathYear}</span>
                </div>
              )}
            </div>

            {/* Contact & Social Links */}
            {(member.phone || member.email || member.socialLinks?.facebook || member.socialLinks?.whatsapp || member.socialLinks?.instagram) && (
              <div className="flex flex-wrap items-center gap-2 mb-4 justify-center md:justify-start">
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-mono">{member.phone}</span>
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{member.email}</span>
                  </a>
                )}
                {member.socialLinks?.facebook && (
                  <a
                    href={member.socialLinks.facebook.startsWith('http') ? member.socialLinks.facebook : `https://${member.socialLinks.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-[#1877F2]/10 text-stone-700 hover:text-[#1877F2] transition-colors border border-stone-200"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}
                {member.socialLinks?.whatsapp && (
                  <a
                    href={member.socialLinks.whatsapp.startsWith('http') ? member.socialLinks.whatsapp : `https://wa.me/${member.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-[#25D366]/10 text-stone-700 hover:text-[#25D366] transition-colors border border-stone-200"
                    title="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 0C5.396 0 .016 5.38.016 12.015c0 2.118.552 4.187 1.6 6.012L0 24l6.166-1.618a11.97 11.97 0 0 0 5.865 1.528h.005c6.635 0 12.016-5.38 12.016-12.015C24.052 5.38 18.671 0 12.031 0zm-.005 21.99a9.96 9.96 0 0 1-5.078-1.385l-.364-.216-3.768.988 1.006-3.673-.238-.378a9.96 9.96 0 0 1-1.528-5.31c0-5.502 4.478-9.98 9.98-9.98 2.666 0 5.172 1.038 7.057 2.924a9.93 9.93 0 0 1 2.923 7.056c0 5.503-4.478 9.98-9.988 9.98z" />
                    </svg>
                  </a>
                )}
                {member.socialLinks?.instagram && (
                  <a
                    href={member.socialLinks.instagram.startsWith('http') ? member.socialLinks.instagram : `https://instagram.com/${member.socialLinks.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-[#E1306C]/10 text-stone-700 hover:text-[#E1306C] transition-colors border border-stone-200"
                    title="Instagram"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
            
            {/* Bio with compact 'See more' toggle */}
            {member.bio && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#1A3636] text-xs sm:text-sm">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>{t('shortBio')}</span>
                  </div>
                  {member.bio.length > 120 && (
                    <button
                      type="button"
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                    >
                      <span>{isBioExpanded ? 'সংক্ষেপ করুন' : 'আরও দেখুন'}</span>
                      {isBioExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <div 
                    className={`text-stone-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line transition-all duration-300 ${
                      !isBioExpanded && member.bio.length > 120 ? 'max-h-20 sm:max-h-24 overflow-hidden' : ''
                    }`}
                    dangerouslySetInnerHTML={{ __html: member.bio.replace(/\n/g, '<br/>') }}
                  />
                  {!isBioExpanded && member.bio.length > 120 && (
                    <div 
                      onClick={() => setIsBioExpanded(true)}
                      className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent cursor-pointer flex items-end justify-center pb-0.5"
                    >
                      <span className="text-[10px] font-bold text-amber-800 bg-white/90 px-2 py-0.5 rounded-full shadow-2xs border border-amber-200">
                        আরও পড়তে ক্লিক করুন...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Life Timeline Milestones with Start & End Points */}
        {member.timeline && member.timeline.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stone-200">
            {/* Header with normal font & size matching other sections */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 font-bold text-[#1A3636] text-xs sm:text-sm">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>{t('timelineTitle')}</span>
              </div>

              {/* Admin Quick Toggle for Timeline End */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={toggleTimelineEnd}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                    member.timelineEnded 
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border-stone-300'
                  }`}
                  title="অ্যাডমিন হিসেবে টাইমলাইন সমাপ্তি চালু বা বন্ধ করুন"
                >
                  <CheckCircle2 className={`w-3 h-3 ${member.timelineEnded ? 'text-amber-800' : 'text-stone-400'}`} />
                  <span>টাইমলাইন সমাপ্তি: {member.timelineEnded ? 'অন (সমাপ্ত)' : 'অফ (চলমান)'}</span>
                </button>
              )}
            </div>

            <div className="relative pl-6 sm:pl-7 ml-3 sm:ml-4">
              {/* Connecting golden line that terminates strictly at the ending point dot */}
              <div 
                className="absolute left-0 top-2.5 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600"
                style={{
                  height: member.timelineEnded ? 'calc(100% - 14px)' : 'calc(100% - 24px)'
                }}
              />

              {/* 1. Timeline Start Point */}
              <div className="relative mb-3 -ml-[31px] sm:-ml-[35px] flex items-center gap-2 z-10">
                <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-xs flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-200/90 rounded-full text-[10px] sm:text-[11px] font-bold text-amber-900 shadow-2xs">
                  <span>যাত্রার সূচনা</span>
                  {member.dob && <span className="font-mono text-amber-700">({member.dob})</span>}
                </div>
              </div>

              {/* 2. Timeline Milestone Items (Compact & Unique Luxury UI) */}
              <div className="space-y-2.5 my-2.5">
                {member.timeline.map((item, i) => (
                  <div key={i} className="relative group">
                    {/* Compact Node Dot on the line */}
                    <div className="absolute -left-[29px] sm:-left-[33px] top-2.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow-xs ring-2 ring-amber-200/60 group-hover:scale-125 transition-transform z-10" />
                    
                    {/* Compact Unique Milestone Card */}
                    <div className="bg-gradient-to-br from-amber-50/25 via-stone-50/70 to-white hover:from-white hover:to-amber-50/40 p-2 sm:p-2.5 rounded-xl border border-amber-200/60 hover:border-amber-400/80 shadow-2xs transition-all">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.2 rounded-md">
                          <Clock className="w-2.5 h-2.5 text-amber-700" />
                          <span>{item.dateOrYear}</span>
                        </div>
                      </div>
                      <h4 className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed whitespace-pre-line">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 3. Timeline Ending Point (Line stops strictly right here, no line underneath) */}
              {member.timelineEnded && (
                <div className="relative mt-3 -ml-[31px] sm:-ml-[35px] flex items-center gap-2 z-10">
                  <div className={`w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center shrink-0 ${
                    member.deathYear
                      ? 'bg-stone-800 text-white' 
                      : 'bg-amber-600 text-white'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shadow-2xs border ${
                    member.deathYear
                      ? 'bg-stone-100 text-stone-800 border-stone-300' 
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3 text-amber-700" />
                    <span>{member.deathYear ? `জীবনাবসান (${member.deathYear})` : 'টাইমলাইন সমাপ্তি'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery */}
        {member.gallery && member.gallery.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="flex items-center gap-2 font-serif font-bold text-lg text-[#1A3636] mb-4">
              <ImageIcon className="w-5 h-5 text-amber-600" />
              <span>{t('familyGallery')}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {member.gallery.map((url, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-xs border border-stone-200">
                  <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Immediate Family Section */}
      {member.type !== 'grandpa' && member.type !== 'grandma' && (
        <div className="mt-12">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A3636] mb-6 flex items-center gap-2 border-b border-stone-200 pb-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" /> 
            <span>{lang === 'bn' ? 'নিকটাত্মীয়' : 'Immediate Family'}</span>
          </h2>
          
          <div className="flex flex-wrap gap-8 justify-center md:justify-start">
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-medium text-stone-500 mb-2">{t('spouse')}</span>
              {spouse ? (
                <MemberCard member={spouse} />
              ) : isAdmin ? (
                <Link to={`/admin?addSpouseFor=${member.id}`} className="w-20 sm:w-24 h-24 sm:h-28 rounded-2xl border-2 border-dashed border-amber-400 flex flex-col items-center justify-center text-amber-700 hover:bg-stone-50 transition-colors">
                  <Plus className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">{lang === 'bn' ? 'স্বামী/স্ত্রী যোগ করুন' : 'Add Spouse'}</span>
                </Link>
              ) : (
                <p className="text-stone-400 italic text-xs mt-4">{lang === 'bn' ? 'যোগ করা হয়নি' : 'Not added'}</p>
              )}
            </div>
            
            <div className="flex flex-col items-center md:items-start w-full md:w-auto mt-6 md:mt-0">
              <span className="text-xs sm:text-sm font-medium text-stone-500 mb-2">{t('children')}</span>
              {children.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {children.map(child => (
                    <MemberCard key={child.id} member={child} />
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic text-xs mt-4">{t('noChildren')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
