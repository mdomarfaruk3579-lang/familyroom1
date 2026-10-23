import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Member } from '../types';
import { X, Calendar, Info, Image as ImageIcon, Cake, Phone, Mail, Globe, Sparkles, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { getCountryDisplay } from '../data/countries';

interface ProfileModalProps {
  member: Member | null;
  onClose: () => void;
}

export default function ProfileModal({ member, onClose }: ProfileModalProps) {
  const { t, lang, translateRole } = useLanguage();
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  if (!member) return null;

  const countryInfo = getCountryDisplay(member.currentlyLiveIn);

  const seed = encodeURIComponent(member.name || member.role || 'family');
  const avatarStyle = member.gender === 'female' ? 'lorelei' : 'micah';
  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=f9f6f0`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#FAF9F6] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-stone-200"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors z-10 text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-amber-400/30 shadow-md shrink-0 bg-stone-100">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover p-2" />
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636] mb-1.5">{member.name}</h2>
                <div className="inline-block px-3.5 py-1 bg-[#1A3636] text-amber-200 rounded-full font-medium mb-3.5 tracking-wide text-xs sm:text-sm shadow-xs">
                  {translateRole(member.role)}
                </div>
                
                {/* Dates & Core Info */}
                <div className="flex flex-col gap-1.5 mb-3 text-xs text-stone-600 items-center sm:items-start">
                  {member.dob && (
                    <div className="flex items-center gap-1.5 font-medium text-stone-800">
                      <Cake className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('dob')}: <strong className="font-mono text-amber-700">{member.dob}</strong></span>
                    </div>
                  )}

                  {/* currently live in - directly below Date of Birth */}
                  <div className="flex items-center gap-1.5 font-medium text-emerald-900 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs w-fit">
                    <span className="text-sm">{countryInfo.flag}</span>
                    <span>currently live in - <strong>{countryInfo.name}</strong></span>
                  </div>

                  {member.deathYear && (
                    <div className="flex items-center gap-1.5 text-stone-500 pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{t('died')}: {member.deathYear}</span>
                    </div>
                  )}
                </div>

                {/* Contact & Social Links */}
                {(member.phone || member.email || member.socialLinks?.facebook || member.socialLinks?.whatsapp || member.socialLinks?.instagram) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="Call phone"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span className="font-mono">{member.phone}</span>
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
                        title="Send email"
                      >
                        <Mail className="w-3 h-3 text-blue-600" />
                        <span>{member.email}</span>
                      </a>
                    )}
                    {member.socialLinks?.facebook && (
                      <a
                        href={member.socialLinks.facebook.startsWith('http') ? member.socialLinks.facebook : `https://${member.socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-stone-100 hover:bg-[#1877F2]/10 text-stone-700 hover:text-[#1877F2] transition-colors border border-stone-200"
                        title="Facebook Profile"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
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
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
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
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
                
                {/* Bio with compact 'See more' toggle */}
                {member.bio && (
                  <div className="mt-4 p-3.5 bg-white rounded-2xl border border-stone-200 text-xs sm:text-sm text-stone-700 leading-relaxed text-left shadow-2xs transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#1A3636]">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t('shortBio')}</span>
                      </div>
                      {member.bio.length > 100 && (
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
                        className={`whitespace-pre-line transition-all duration-300 ${
                          !isBioExpanded && member.bio.length > 100 ? 'max-h-18 sm:max-h-20 overflow-hidden' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: member.bio.replace(/\n/g, '<br/>') }}
                      />
                      {!isBioExpanded && member.bio.length > 100 && (
                        <div 
                          onClick={() => setIsBioExpanded(true)}
                          className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent cursor-pointer flex items-end justify-center pb-0.5"
                        >
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.2 rounded-full shadow-2xs border border-amber-200">
                            আরও পড়তে ক্লিক করুন...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Life Timeline Milestones */}
            {member.timeline && member.timeline.length > 0 && (
              <div className="mt-6 pt-5 border-t border-stone-200">
                <div className="flex items-center gap-2 font-serif font-bold text-base text-[#1A3636] mb-3">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>{t('timelineTitle')}</span>
                </div>
                <div className="relative pl-5 border-l-2 border-amber-400/40 ml-2 space-y-4">
                  {member.timeline.map((item, i) => (
                    <div key={i} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-xs" />
                      <div className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-0.5">
                        {item.dateOrYear}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-stone-900">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-stone-600 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {member.gallery && member.gallery.length > 0 && (
              <div className="mt-6 pt-5 border-t border-stone-200">
                <div className="flex items-center gap-2 font-semibold text-[#1A3636] mb-3">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span className="font-serif text-base">{t('familyGallery')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {member.gallery.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-xs border border-stone-200">
                      <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
