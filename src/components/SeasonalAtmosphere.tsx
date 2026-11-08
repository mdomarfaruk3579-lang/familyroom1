import React, { useEffect, useRef } from 'react';
import { useSeason, CurvedFlightInfo } from '../context/SeasonContext';

interface Particle {
  x: number;
  y: number;
  speedY: number;
  speedX: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  color?: string;
  type?: string;
}

export default function SeasonalAtmosphere() {
  const { timeOfDay, nightDarkness, dayBrightness, season, sunlight, activeFlights, playThunderSound } = useSeason();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lightningActiveRef = useRef(false);

  // Sync Night Mode class on body for full high-contrast dark theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('night-mode', timeOfDay === 'night');
    }
  }, [timeOfDay]);

  // -------------------------------------------------------------
  // Thunder & Lightning Loop for Rainy Season
  // -------------------------------------------------------------
  useEffect(() => {
    if (season !== 'rainy') {
      lightningActiveRef.current = false;
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const triggerLightningCycle = () => {
      lightningActiveRef.current = true;
      setTimeout(() => {
        lightningActiveRef.current = false;
        setTimeout(() => {
          lightningActiveRef.current = true;
          setTimeout(() => {
            lightningActiveRef.current = false;
            setTimeout(() => {
              playThunderSound();
            }, 300);
          }, 110);
        }, 90);
      }, 120);

      const nextDelay = Math.random() * 11000 + 9000;
      timeoutId = setTimeout(triggerLightningCycle, nextDelay);
    };

    timeoutId = setTimeout(triggerLightningCycle, 3500);

    return () => clearTimeout(timeoutId);
  }, [season, playThunderSound]);

  // -------------------------------------------------------------
  // Canvas Particles (Rain, Snow, Autumn Leaves, Night Stars)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const initParticles = () => {
      particlesRef.current = [];

      // Combine Season & Time of Day
      // Rain particles
      if (season === 'rainy') {
        const count = 130;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: Math.random() * (width + 200) - 100,
            y: Math.random() * height,
            speedY: Math.random() * 15 + 18,
            speedX: -2.8 - Math.random() * 2,
            size: Math.random() * 18 + 12,
            opacity: Math.random() * 0.45 + 0.3,
            rotation: 0,
            rotationSpeed: 0,
            wobble: 0,
            wobbleSpeed: 0,
            wobbleAmp: 0,
            type: 'rain',
          });
        }
      }

      // Snow particles (Winter)
      if (season === 'winter') {
        const count = 75;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            speedY: Math.random() * 0.9 + 0.5,
            speedX: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2.8 + 1.5,
            opacity: Math.random() * 0.45 + 0.35,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.01,
            wobbleAmp: Math.random() * 1.5 + 0.6,
            type: Math.random() > 0.65 ? 'snow-crystal' : 'snow-soft',
          });
        }
      }

      // Autumn falling leaves
      if (season === 'autumn') {
        const count = 35;
        const colors = ['#D97706', '#B45309', '#EA580C', '#C2410C', '#EAB308', '#9A3412'];
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            speedY: Math.random() * 1.3 + 0.8,
            speedX: Math.random() * 0.8 + 0.3,
            size: Math.random() * 11 + 9,
            opacity: Math.random() * 0.4 + 0.55,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.04,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.01,
            wobbleAmp: Math.random() * 2.6 + 1.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: 'leaf',
          });
        }
      }

      // Twinkling stars if timeOfDay is 'night'
      if (timeOfDay === 'night') {
        const starCount = 85;
        for (let i = 0; i < starCount; i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.85),
            speedY: 0,
            speedX: 0,
            size: Math.random() * 1.8 + 0.8,
            opacity: Math.random() * 0.7 + 0.25,
            rotation: 0,
            rotationSpeed: 0,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.04 + 0.01,
            wobbleAmp: 0.35,
            type: 'star',
          });
        }
      }
    };

    initParticles();

    // Leaf drawing
    const drawLeaf = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      angle: number,
      color: string,
      alpha: number
    ) => {
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.fillStyle = color;
      context.globalAlpha = alpha;

      context.beginPath();
      context.moveTo(0, -size);
      context.bezierCurveTo(size * 0.85, -size * 0.5, size * 0.9, size * 0.5, 0, size);
      context.bezierCurveTo(-size * 0.9, size * 0.5, -size * 0.85, -size * 0.5, 0, -size);
      context.fill();

      context.strokeStyle = 'rgba(70, 30, 10, 0.45)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, -size * 0.8);
      context.lineTo(0, size * 1.1);
      context.stroke();

      context.restore();
    };

    // Snowflake crystal
    const drawCrystal = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      angle: number,
      alpha: number
    ) => {
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      context.lineWidth = 1.3;
      context.lineCap = 'round';

      for (let i = 0; i < 6; i++) {
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -radius);
        const barbPos = -radius * 0.5;
        context.moveTo(-radius * 0.3, barbPos - radius * 0.2);
        context.lineTo(0, barbPos);
        context.lineTo(radius * 0.3, barbPos - radius * 0.2);
        context.stroke();
        context.rotate(Math.PI / 3);
      }
      context.restore();
    };

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      if (document.hidden) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Lightning screen flash
      if (lightningActiveRef.current) {
        ctx.fillStyle = 'rgba(235, 245, 255, 0.82)';
        ctx.fillRect(0, 0, width, height);
      }

      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.type === 'rain') {
          ctx.strokeStyle = `rgba(185, 220, 255, ${p.opacity})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2.2, p.y + p.size);
          ctx.stroke();

          p.y += p.speedY * (dt * 60);
          p.x += p.speedX * (dt * 60);

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * (width + 200) - 100;
          }
        } else if (p.type === 'leaf') {
          p.wobble += p.wobbleSpeed;
          p.rotation += p.rotationSpeed;
          const wobbleX = Math.sin(p.wobble) * p.wobbleAmp;

          p.x += (p.speedX + wobbleX) * (dt * 60);
          p.y += p.speedY * (dt * 60);

          drawLeaf(ctx, p.x, p.y, p.size, p.rotation, p.color || '#D97706', p.opacity);

          if (p.y > height + 30) {
            p.y = -30;
            p.x = Math.random() * width;
          }
        } else if (p.type === 'snow-crystal' || p.type === 'snow-soft') {
          p.wobble += p.wobbleSpeed;
          p.rotation += p.rotationSpeed;
          const wobbleX = Math.sin(p.wobble) * p.wobbleAmp;

          p.x += (p.speedX + wobbleX) * (dt * 60);
          p.y += p.speedY * (dt * 60);

          if (p.type === 'snow-crystal') {
            drawCrystal(ctx, p.x, p.y, p.size * 2, p.rotation, p.opacity);
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.shadowColor = 'rgba(215, 235, 255, 0.7)';
            ctx.shadowBlur = p.size * 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        } else if (p.type === 'star') {
          p.wobble += p.wobbleSpeed;
          const alpha = Math.max(0.12, Math.min(1.0, p.opacity + Math.sin(p.wobble) * p.wobbleAmp));

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.shadowColor = 'rgba(210, 235, 255, 0.9)';
          ctx.shadowBlur = p.size * 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [timeOfDay, season]);

  // Sun Position CSS classes for Day Mode
  const getSunPositionStyles = () => {
    switch (sunlight.position) {
      case 'top-left':
        return 'top-4 left-6 sm:left-12';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'sunset':
        return 'bottom-16 right-10 sm:right-24';
      case 'top-right':
      default:
        return 'top-4 right-6 sm:right-16';
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* Canvas Layer for Particles (Rain / Leaves / Snow / Stars)       */}
      {/* ------------------------------------------------------------- */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-20 select-none overflow-hidden"
      />

      {/* Dark Monsoon Clouds at Top (Rainy Season) */}
      {season === 'rainy' && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-48 pointer-events-none z-20 bg-gradient-to-b from-slate-900/50 via-slate-800/30 to-transparent blur-md"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TIME OF DAY: NIGHT MODE - Real Deep Night Backdrop & Moon     */}
      {/* ------------------------------------------------------------- */}
      {timeOfDay === 'night' && (
        <>
          {/* Deep nocturnal night atmospheric tint with adjustable darkness opacity */}
          <div
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none z-10 bg-gradient-to-b from-[#050B14] via-[#091122] to-[#040812] mix-blend-multiply transition-opacity duration-300"
            style={{ opacity: nightDarkness }}
          />

          {/* Glowing Crescent Moon */}
          <div
            aria-hidden="true"
            className="fixed top-6 right-8 sm:right-20 pointer-events-none z-20 flex flex-col items-center"
            style={{ opacity: Math.min(1.0, nightDarkness + 0.2) }}
          >
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-[0_0_45px_rgba(235,245,255,0.75)] bg-transparent">
              <div className="w-full h-full rounded-full shadow-[inset_-9px_5px_0_2px_#F8FAFC] drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]" />
              <div className="absolute inset-0 rounded-full bg-blue-100/10 blur-xl scale-150" />
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TIME OF DAY: DAY MODE - Glowing Sun with God Rays             */}
      {/* ------------------------------------------------------------- */}
      {timeOfDay === 'day' && (
        <div
          aria-hidden="true"
          className={`fixed pointer-events-none z-20 ${getSunPositionStyles()}`}
          style={{
            filter: `brightness(${0.7 + (dayBrightness || 1) * 0.4})`,
            opacity: Math.min(1.0, 0.4 + (dayBrightness || 1) * 0.6),
          }}
        >
          <div className="relative flex items-center justify-center">
            <div
              className={`rounded-full transition-all duration-700 ${
                season === 'summer'
                  ? 'w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 shadow-[0_0_75px_rgba(245,158,11,0.9)]'
                  : 'w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-amber-400 via-yellow-200 to-white shadow-[0_0_55px_rgba(251,191,36,0.8)]'
              }`}
            />
            <div
              className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-radial from-amber-300/30 via-yellow-200/15 to-transparent blur-md animate-spin"
              style={{ animationDuration: '45s' }}
            />
            <div
              className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full pointer-events-none opacity-60 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent blur-lg"
              style={{
                transform: `rotate(${sunlight.warmth * 45}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Winter Frost Top Rim */}
      {season === 'winter' && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-2.5 pointer-events-none z-30 bg-gradient-to-b from-sky-200/45 via-white/25 to-transparent blur-[1px]"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* CURVED OVERHEAD AIRCRAFT (Planes & Helicopters)               */}
      {/* "plane urar somoy detalis off koro" -> NO INTRUSIVE TEXT!    */}
      {/* ------------------------------------------------------------- */}
      {activeFlights.map(flight => (
        <CurvedAircraftFlight key={flight.id} flight={flight} />
      ))}
    </>
  );
}

// -------------------------------------------------------------
// Animated Curved / Wavy Flight Renderer Component
// -------------------------------------------------------------
function CurvedAircraftFlight({ flight }: { key?: string; flight: CurvedFlightInfo }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const durationMs = flight.durationSec * 1000;

    // Cubic Bezier Evaluation P(t)
    const getBezierPoint = (t: number) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const x =
        uuu * flight.startX +
        3 * uu * t * flight.controlX1 +
        3 * u * tt * flight.controlX2 +
        ttt * flight.endX;

      const y =
        uuu * flight.startY +
        3 * uu * t * flight.controlY1 +
        3 * u * tt * flight.controlY2 +
        ttt * flight.endY;

      // Derivative for heading / angle
      const dx =
        3 * uu * (flight.controlX1 - flight.startX) +
        6 * u * t * (flight.controlX2 - flight.controlX1) +
        3 * tt * (flight.endX - flight.controlX2);

      const dy =
        3 * uu * (flight.controlY1 - flight.startY) +
        6 * u * t * (flight.controlY2 - flight.controlY1) +
        3 * tt * (flight.endY - flight.controlY2);

      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      // CRITICAL FIX: Ensure helicopter and airplane NEVER fly upside down!
      // When moving leftwards (dx < 0), flip horizontally with scaleX(-1) and adjust pitch angle
      const isMovingLeft = dx < 0;
      let rotationAngle = angleDeg;
      let scaleX = 1;

      if (isMovingLeft) {
        scaleX = -1;
        rotationAngle = angleDeg >= 0 ? 180 - angleDeg : -180 - angleDeg;
      }

      // Dynamic banking roll in curves
      const bankDeg = (Math.sin(t * Math.PI) * flight.bankFactor);

      return { x, y, rotationAngle, scaleX, bankDeg };
    };

    const updateFrame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);

      if (containerRef.current) {
        const { x, y, rotationAngle, scaleX, bankDeg } = getBezierPoint(t);
        // Fade in at start and out at end
        let opacity = 1;
        if (t < 0.1) opacity = t / 0.1;
        else if (t > 0.88) opacity = (1 - t) / 0.12;

        containerRef.current.style.left = `${x}%`;
        containerRef.current.style.top = `${y}%`;
        containerRef.current.style.opacity = `${opacity}`;
        containerRef.current.style.transform = `translate(-50%, -50%) scaleX(${scaleX}) rotate(${rotationAngle}deg) rotateX(${bankDeg}deg)`;
      }

      if (t < 1) {
        animId = requestAnimationFrame(updateFrame);
      }
    };

    animId = requestAnimationFrame(updateFrame);

    return () => cancelAnimationFrame(animId);
  }, [flight]);

  return (
    <div
      ref={containerRef}
      className="fixed z-40 pointer-events-none select-none"
      style={{
        left: `${flight.startX}%`,
        top: `${flight.startY}%`,
        opacity: 0,
        willChange: 'transform, left, top',
      }}
    >
      {flight.kind === 'helicopter' ? (
        // -------------------------------------------------------------
        // HIGH REALISM 3D HELICOPTER
        // -------------------------------------------------------------
        <div className="relative flex items-center">
          <svg
            viewBox="0 0 140 100"
            className="w-16 h-12 sm:w-22 sm:h-16 drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
          >
            {/* Spinning Main Rotor Blur Disc */}
            <ellipse
              cx="70"
              cy="34"
              rx="55"
              ry="7"
              fill="rgba(15, 23, 42, 0.22)"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="0.8"
              className="animate-spin"
              style={{ animationDuration: '0.08s', transformOrigin: '70px 34px' }}
            />
            {/* Main Rotor Blades (high speed spinning) */}
            <line x1="16" y1="34" x2="124" y2="34" stroke="#0F172A" strokeWidth="2.5" />
            <line x1="70" y1="28" x2="70" y2="40" stroke="#0F172A" strokeWidth="2.5" />

            {/* Rotor Mast */}
            <rect x="68" y="34" width="4" height="8" fill="#475569" />

            {/* Fuselage Cabin */}
            <path
              d="M 60,42 C 85,42 108,46 112,58 C 114,68 95,74 65,74 C 45,74 38,68 40,58 C 42,46 48,42 60,42 Z"
              fill={flight.color}
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />

            {/* Cockpit Canopy Glass */}
            <path
              d="M 85,44 C 104,46 110,54 110,60 C 100,64 85,64 80,60 C 78,52 80,45 85,44 Z"
              fill="#38BDF8"
              opacity="0.85"
            />

            {/* Tail Boom */}
            <path
              d="M 45,55 L 8,58 L 7,62 L 45,63 Z"
              fill={flight.color}
            />

            {/* Vertical Tail Fin */}
            <path d="M 12,50 L 5,42 L 2,68 L 10,65 Z" fill={flight.accentColor} />

            {/* Tail Rotor (spinning) */}
            <circle cx="6" cy="54" r="9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1="6" y1="46" x2="6" y2="62" stroke="#1E293B" strokeWidth="1.5" />

            {/* Landing Skids */}
            <line x1="50" y1="78" x2="95" y2="78" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="58" y1="74" x2="55" y2="78" stroke="#475569" strokeWidth="2" />
            <line x1="88" y1="74" x2="85" y2="78" stroke="#475569" strokeWidth="2" />

            {/* Flashing Navigation Strobes */}
            <circle cx="108" cy="58" r="2.5" fill="#EF4444" className="animate-ping" />
            <circle cx="6" cy="42" r="2" fill="#FFFFFF" className="animate-pulse" />
          </svg>
        </div>
      ) : (
        // -------------------------------------------------------------
        // HIGH REALISM 3D PASSENGER JET WITH DUAL CONTRAILS
        // -------------------------------------------------------------
        <div className="relative flex items-center">
          {/* Dual Engine Contrail Smoke Trails */}
          <div
            aria-hidden="true"
            className="absolute right-full top-1/2 -translate-y-1/2 w-64 sm:w-96 pointer-events-none"
          >
            {/* Left Engine Smoke Trail */}
            <div
              className="h-2 rounded-full mb-2"
              style={{
                background: 'linear-gradient(to left, rgba(255,255,255,0.7), rgba(255,255,255,0.2) 60%, transparent)',
                filter: 'blur(1.5px)',
              }}
            />
            {/* Right Engine Smoke Trail */}
            <div
              className="h-2 rounded-full"
              style={{
                background: 'linear-gradient(to left, rgba(255,255,255,0.7), rgba(255,255,255,0.2) 60%, transparent)',
                filter: 'blur(1.5px)',
              }}
            />
          </div>

          <svg
            viewBox="0 0 120 120"
            className="w-16 h-16 sm:w-22 sm:h-22 drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
          >
            {/* Main Fuselage Body */}
            <path
              d="M 112,60 C 107,55 80,51 40,52 C 24,52.5 14,54 6,60 C 14,66 24,67.5 40,68 C 80,69 107,65 112,60 Z"
              fill="#FFFFFF"
              stroke="#D1D5DB"
              strokeWidth="1.2"
            />

            {/* Airline Color Stripe */}
            <path
              d="M 102,59 C 85,57 50,57 20,58 C 14,58.5 8,59.5 6,60 C 8,60.5 14,61.5 20,62 C 50,63 85,63 102,61 Z"
              fill={flight.color}
            />

            {/* Left Swept Wing */}
            <path
              d="M 68,53 L 36,8 C 33,6 30,7 31,11 L 52,53 Z"
              fill="#E5E7EB"
              stroke="#9CA3AF"
              strokeWidth="1"
            />
            {/* Left Engine Nacelle */}
            <ellipse cx="48" cy="34" rx="8" ry="3.8" fill="#4B5563" />
            <ellipse cx="54" cy="34" rx="2.5" ry="3.5" fill="#1F2937" />

            {/* Right Swept Wing */}
            <path
              d="M 68,67 L 36,112 C 33,114 30,113 31,109 L 52,67 Z"
              fill="#E5E7EB"
              stroke="#9CA3AF"
              strokeWidth="1"
            />
            {/* Right Engine Nacelle */}
            <ellipse cx="48" cy="86" rx="8" ry="3.8" fill="#4B5563" />
            <ellipse cx="54" cy="86" rx="2.5" ry="3.5" fill="#1F2937" />

            {/* Tail Horizontal Stabilizers */}
            <path d="M 22,54 L 6,30 C 4,29 3,30 4,32 L 14,55 Z" fill="#D1D5DB" />
            <path d="M 22,66 L 6,90 C 4,91 3,90 4,88 L 14,65 Z" fill="#D1D5DB" />

            {/* Vertical Tail Fin */}
            <path
              d="M 24,58 L 8,51 C 6,52 6,68 8,69 L 24,62 Z"
              fill={flight.color}
            />
            {/* Tail Accent Color Mark */}
            <path d="M 16,56 L 8,52 L 8,68 L 16,64 Z" fill={flight.accentColor} />

            {/* Cockpit Windshield */}
            <path
              d="M 104,57 C 106,58 108,59 109,60 C 108,61 106,62 104,63 Z"
              fill="#1E293B"
            />

            {/* Navigation Strobe Lights */}
            <circle cx="34" cy="9" r="2.5" fill="#EF4444" className="animate-ping" />
            <circle cx="34" cy="9" r="1.5" fill="#EF4444" />
            <circle cx="34" cy="111" r="2.5" fill="#10B981" className="animate-ping" />
            <circle cx="34" cy="111" r="1.5" fill="#10B981" />
            <circle cx="6" cy="60" r="2" fill="#FFFFFF" className="animate-pulse" />
          </svg>
        </div>
      )}
    </div>
  );
}
