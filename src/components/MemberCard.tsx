import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Member } from '../types';
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

interface MemberCardProps {
  key?: React.Key;
  member: Member;
  onClick?: () => void;
  onInfoClick?: (e: React.MouseEvent) => void;
  isActive?: boolean;
}

const MemberCard = memo(function MemberCard({ member, onClick, onInfoClick, isActive }: MemberCardProps) {
  const navigate = useNavigate();
  const { translateRole } = useLanguage();
  const seed = encodeURIComponent(member.name || member.role || 'family');
  const avatarStyle = member.gender === 'female' ? 'lorelei' : 'micah';
  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=E3DCD2`;

  const handleCardClick = () => {
    if (onClick) onClick();
    else navigate(`/member/${member.id}`);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInfoClick) onInfoClick(e);
    else navigate(`/member/${member.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCardClick}
      style={{ willChange: 'transform' }}
      className={`
        relative flex flex-col items-center justify-center p-1 w-[3.8rem] sm:w-20 md:w-24 h-18 sm:h-24 md:h-28 
        rounded-xl cursor-pointer transition-all duration-300 group touch-manipulation
        ${isActive 
          ? 'bg-[#1A3636] text-[#F9F8F6] shadow-xl shadow-[#1A3636]/30 scale-105 border border-[#C19A6B]' 
          : 'bg-white text-[#2b2b2b] shadow-sm hover:shadow-md border border-[#EAE6DF]'
        }
      `}
    >
      <button 
        onClick={handleInfoClick}
        className={`absolute -top-2 -right-2 p-1.5 rounded-full transition-all z-20 shadow-md touch-manipulation
          ${isActive ? 'bg-[#C19A6B] text-white scale-110' : 'bg-white text-[#1A3636] border border-[#EAE6DF] hover:bg-[#F9F8F6]'}
        `}
        title="View Profile"
      >
        <Info className="w-4 h-4" />
      </button>

      <div className={`w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden mb-1 border-2 flex items-center justify-center transition-all duration-500 shadow-inner group-hover:border-[#C19A6B]
        ${isActive ? 'border-[#C19A6B] bg-[#F9F8F6]' : 'border-[#EAE6DF] bg-[#F9F8F6]'}
      `}>
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
        ) : (
          <img src={avatarUrl} alt="Avatar" loading="lazy" decoding="async" className="w-full h-full object-cover p-0.5 transition-transform duration-500 group-hover:scale-110" />
        )}
      </div>
      <h3 className="font-serif font-bold text-[10px] sm:text-xs md:text-sm text-center truncate w-full px-1">
        {member.name || translateRole(member.role)}
      </h3>
      <p className={`text-[8px] sm:text-[10px] md:text-xs mt-0.5 ${isActive ? 'text-[#EAE6DF]' : 'text-[#C19A6B]'} font-medium tracking-wide flex items-center justify-center gap-1`}>
        <span>{translateRole(member.role)}</span>
        {(member.isDeceased || member.deathYear) && (
          <span className={`text-[7px] sm:text-[8px] px-1 rounded-sm font-sans ${isActive ? 'bg-stone-700 text-stone-200' : 'bg-stone-200/90 text-stone-700'}`}>
            {member.gender === 'female' ? 'মরহুমা' : 'মরহুম'}
          </span>
        )}
      </p>
    </motion.div>
  );
});

export default MemberCard;
