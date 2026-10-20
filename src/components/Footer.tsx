import { MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1A3636] text-[#EAE6DF] py-3.5 mt-auto border-t border-[#C19A6B]/25 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-between gap-3 text-xs">
        {/* Left: App Title */}
        <div className="flex items-center gap-2 font-serif text-amber-200/90 font-medium tracking-wide">
          <span>{t('appTitle')}</span>
        </div>

        {/* Center: Social & Location Hyperlinks */}
        <div className="flex items-center gap-3 sm:gap-4">
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
    </footer>
  );
}
