import { Heart } from 'lucide-react';

export default function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#F7F5F0]">
      {/* Subtle static gradient blobs instead of heavy JS animations */}
      <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[#1A3636] opacity-[0.03] rounded-full blur-[120px]" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%] bg-[#C19A6B] opacity-[0.03] rounded-full blur-[120px]" />
      
      {/* Floating Hearts - Family Theme (Reduced count and using CSS for performance if possible, but for now we just render a few static ones for aesthetics, avoiding React re-renders) */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-[#C19A6B]/10 animate-pulse"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            transform: `scale(${Math.random() * 0.5 + 0.5}) rotate(${Math.random() * 45}deg)`,
            animationDuration: `${Math.random() * 3 + 3}s`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          <Heart size={24} fill="currentColor" />
        </div>
      ))}
    </div>
  );
}
