import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake, Sliders, X, Check, Wind, Sparkles } from 'lucide-react';

type SnowIntensity = 'light' | 'medium' | 'dense';

interface Flake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  opacity: number;
  baseOpacity: number;
  layer: number; // 0: background, 1: midground, 2: foreground
  type: 'soft' | 'crystal' | 'sparkle';
  rotation: number;
  rotationSpeed: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

export default function WinterSnowfall() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('family_winter_snow_enabled');
      return saved !== null ? saved === 'true' : true; // Default ON for seasonal cheer
    } catch {
      return true;
    }
  });

  const [intensity, setIntensity] = useState<SnowIntensity>(() => {
    try {
      const saved = localStorage.getItem('family_winter_snow_intensity');
      return (saved as SnowIntensity) || 'medium';
    } catch {
      return 'medium';
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const animationFrameId = useRef<number | null>(null);
  const flakesRef = useRef<Flake[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const windRef = useRef<number>(0.2);

  const getFlakeCount = useCallback(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (intensity === 'light') return isMobile ? 25 : 45;
    if (intensity === 'dense') return isMobile ? 65 : 120;
    return isMobile ? 40 : 80; // medium
  }, [intensity]);

  const toggleSnow = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    try {
      localStorage.setItem('family_winter_snow_enabled', String(next));
    } catch {}
  };

  const handleIntensityChange = (newIntensity: SnowIntensity) => {
    setIntensity(newIntensity);
    try {
      localStorage.setItem('family_winter_snow_intensity', newIntensity);
    } catch {}
  };

  // Helper to draw a delicate 6-pointed hexagonal snowflake crystal
  const drawCrystalSnowflake = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, alpha: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    ctx.fillStyle = `rgba(240, 248, 255, ${alpha * 0.95})`;
    ctx.lineWidth = Math.max(1, radius * 0.22);
    ctx.lineCap = 'round';

    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -radius);
      ctx.stroke();

      // Delicate branchlets
      const branchPos = -radius * 0.55;
      const branchLen = radius * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, branchPos);
      ctx.lineTo(-branchLen, branchPos - branchLen * 0.6);
      ctx.moveTo(0, branchPos);
      ctx.lineTo(branchLen, branchPos - branchLen * 0.6);
      ctx.stroke();

      ctx.rotate(Math.PI / 3);
    }

    // Central tiny ice nucleus
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, radius * 0.25), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Helper to draw a glistening 4-point sparkle star
  const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, alpha: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.shadowColor = 'rgba(210, 235, 255, 0.8)';
    ctx.shadowBlur = radius * 2.5;

    ctx.beginPath();
    // 4-point diamond star
    ctx.moveTo(0, -radius * 1.5);
    ctx.quadraticCurveTo(0, 0, radius * 1.5, 0);
    ctx.quadraticCurveTo(0, 0, 0, radius * 1.5);
    ctx.quadraticCurveTo(0, 0, -radius * 1.5, 0);
    ctx.quadraticCurveTo(0, 0, 0, -radius * 1.5);
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    if (!isEnabled) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initFlakes();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Track pointer movement with gentle passive drift
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const totalFlakes = getFlakeCount();

    const createFlake = (initialY = -20): Flake => {
      // 3 depth layers: 0: background (50%), 1: midground (35%), 2: foreground (15%)
      const randLayer = Math.random();
      let layer = 0;
      let radius = Math.random() * 1.5 + 1; // background
      let speedY = Math.random() * 0.6 + 0.4;
      let baseOpacity = Math.random() * 0.4 + 0.25;

      if (randLayer > 0.85) {
        layer = 2; // foreground: bigger, faster, soft blur
        radius = Math.random() * 2.8 + 3.2;
        speedY = Math.random() * 1.1 + 1.2;
        baseOpacity = Math.random() * 0.35 + 0.55;
      } else if (randLayer > 0.5) {
        layer = 1; // midground: detailed crystals
        radius = Math.random() * 1.8 + 2.0;
        speedY = Math.random() * 0.8 + 0.7;
        baseOpacity = Math.random() * 0.4 + 0.45;
      }

      // Random flake type
      const typeRand = Math.random();
      let type: 'soft' | 'crystal' | 'sparkle' = 'soft';
      if (layer >= 1 && typeRand < 0.22) {
        type = 'crystal';
      } else if (typeRand < 0.38) {
        type = 'sparkle';
      }

      return {
        x: Math.random() * width,
        y: initialY === -20 ? Math.random() * height : initialY,
        radius,
        speedY,
        speedX: (Math.random() - 0.5) * 0.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.008,
        wobbleAmp: Math.random() * 1.2 + 0.6,
        opacity: baseOpacity,
        baseOpacity,
        layer,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.04 + 0.015,
      };
    };

    const initFlakes = () => {
      flakesRef.current = [];
      for (let i = 0; i < totalFlakes; i++) {
        flakesRef.current.push(createFlake());
      }
    };

    initFlakes();

    let lastTime = performance.now();
    let windAngle = 0;

    const render = (currentTime: number) => {
      // Pause loop if tab is in background to save 100% battery
      if (document.hidden) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Subtle dynamic winter breeze cycle (shifts slowly between left and right)
      windAngle += dt * 0.25;
      const ambientBreeze = Math.sin(windAngle) * 0.45 + 0.15;
      windRef.current = ambientBreeze;

      const flakes = flakesRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < flakes.length; i++) {
        const flake = flakes[i];

        // Wobble physics
        flake.wobble += flake.wobbleSpeed;
        flake.rotation += flake.rotationSpeed;
        flake.twinklePhase += flake.twinkleSpeed;

        const horizontalWobble = Math.sin(flake.wobble) * flake.wobbleAmp;

        // Interactive mouse wind push (very gentle displacement)
        let pushX = 0;
        let pushY = 0;
        if (mouse.active) {
          const dx = flake.x - mouse.x;
          const dy = flake.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 120;
          if (distSq < maxDist * maxDist && distSq > 4) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxDist) * 1.4;
            pushX = (dx / dist) * force;
            pushY = (dy / dist) * force * 0.5;
          }
        }

        // Apply velocities
        flake.x += (ambientBreeze * (flake.layer + 1) * 0.6 + flake.speedX + horizontalWobble + pushX) * (dt * 60);
        flake.y += (flake.speedY + pushY) * (dt * 60);

        // Twinkle alpha calculation
        const twinkleFactor = Math.sin(flake.twinklePhase) * 0.25;
        const currentAlpha = Math.max(0.1, Math.min(0.95, flake.baseOpacity + twinkleFactor));

        // Screen wrap
        if (flake.y > height + 15) {
          flakes[i] = createFlake(-15);
          flakes[i].x = Math.random() * width;
        }
        if (flake.x > width + 20) {
          flake.x = -15;
        } else if (flake.x < -20) {
          flake.x = width + 15;
        }

        // Draw Flake based on type
        if (flake.type === 'crystal') {
          drawCrystalSnowflake(ctx, flake.x, flake.y, flake.radius * 2.2, flake.rotation, currentAlpha);
        } else if (flake.type === 'sparkle') {
          drawSparkle(ctx, flake.x, flake.y, flake.radius * 1.5, flake.rotation, currentAlpha);
        } else {
          // Soft radial glow snowflake
          ctx.save();
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

          if (flake.layer === 2) {
            // Foreground bokeh flake with soft feathered gradient
            const grad = ctx.createRadialGradient(
              flake.x, flake.y, 0,
              flake.x, flake.y, flake.radius
            );
            grad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha})`);
            grad.addColorStop(0.6, `rgba(240, 248, 255, ${currentAlpha * 0.7})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
            ctx.shadowColor = 'rgba(220, 240, 255, 0.6)';
            ctx.shadowBlur = flake.radius * 1.5;
          }

          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isEnabled, intensity, getFlakeCount]);

  return (
    <>
      {/* Full-App High-Performance Canvas Snowfall Layer (Completely Click-Through) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden"
        style={{
          display: isEnabled ? 'block' : 'none',
          willChange: 'transform',
        }}
      />

      {/* Decorative Subtle Frosted Winter Crystal Rim at top of the app */}
      {isEnabled && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-1.5 pointer-events-none z-40 bg-gradient-to-b from-white/35 via-white/10 to-transparent blur-[0.5px]"
        />
      )}

      {/* Discreet Seasonal Floating Winter Snowflake Control Widget */}
      <div className="fixed bottom-4 right-4 z-40 select-none">
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.18 }}
              className="mb-2 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-xl text-stone-800 w-64 max-w-[calc(100vw-32px)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1A3636]">
                  <Snowflake className="w-4 h-4 text-sky-500 animate-spin" style={{ animationDuration: '9s' }} />
                  <span>শীতের তুষারপাত নিয়ন্ত্রণ</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="বন্ধ করুন"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggle On / Off */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">তুষারপাত আবহ:</span>
                <button
                  onClick={toggleSnow}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    isEnabled
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {isEnabled ? (
                    <>
                      <Check className="w-3 h-3" /> চালু
                    </>
                  ) : (
                    'বন্ধ'
                  )}
                </button>
              </div>

              {/* Intensity Presets */}
              {isEnabled && (
                <div className="mt-3 pt-2.5 border-t border-stone-100">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 mb-1.5">
                    <Sliders className="w-3 h-3 text-stone-400" />
                    <span>ঘনত্ব ও গতি:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'light', label: 'হালকা' },
                        { id: 'medium', label: 'মাঝারি' },
                        { id: 'dense', label: 'ঘন বরফ' },
                      ] as const
                    ).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleIntensityChange(item.id)}
                        className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          intensity === item.id
                            ? 'bg-[#1A3636] text-white shadow-xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-2.5 text-[9px] text-stone-400 text-center leading-tight">
                ❄️ শীতকালীন মনোরম আবহ পুরো অ্যাপে কার্যকর
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all cursor-pointer ${
            isEnabled
              ? 'bg-white/90 text-[#1A3636] border-sky-300/80 hover:bg-white hover:border-sky-400'
              : 'bg-stone-800/80 text-white border-stone-700/80 hover:bg-stone-800'
          }`}
          title="শীতকালীন তুষারপাত আবহ নিয়ন্ত্রণ"
        >
          <Snowflake
            className={`w-4 h-4 ${isEnabled ? 'text-sky-500 animate-spin' : 'text-stone-400'}`}
            style={{ animationDuration: '8s' }}
          />
          <span className="text-xs font-bold hidden sm:inline">
            {isEnabled ? 'শীতকালীন তুষারপাত' : 'তুষারপাত বন্ধ'}
          </span>
          {isEnabled && (
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping hidden sm:inline" />
          )}
        </motion.button>
      </div>
    </>
  );
}
