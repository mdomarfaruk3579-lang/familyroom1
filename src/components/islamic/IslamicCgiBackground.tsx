import React, { useEffect, useRef } from 'react';

export const IslamicCgiBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle system: Golden stardust, subtle geometric 8-point stars, and floating crescents
    const particleCount = Math.min(width < 768 ? 35 : 65, 75);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -Math.random() * 0.45 - 0.15,
      opacity: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      pulseVal: Math.random() * Math.PI,
      isStar: Math.random() > 0.75,
      isCrescent: Math.random() > 0.92
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Deep, soothing emerald-to-pine gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#041d17');
      bgGradient.addColorStop(0.5, '#072b22');
      bgGradient.addColorStop(1, '#051f18');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient glowing orbs
      const orb1X = width * 0.2 + Math.sin(time * 0.4) * 60;
      const orb1Y = height * 0.3 + Math.cos(time * 0.3) * 50;
      const gradOrb1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, width * 0.45);
      gradOrb1.addColorStop(0, 'rgba(212, 175, 55, 0.08)');
      gradOrb1.addColorStop(0.6, 'rgba(16, 185, 129, 0.05)');
      gradOrb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradOrb1;
      ctx.fillRect(0, 0, width, height);

      const orb2X = width * 0.8 + Math.cos(time * 0.5) * 60;
      const orb2Y = height * 0.7 + Math.sin(time * 0.4) * 50;
      const gradOrb2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, width * 0.4);
      gradOrb2.addColorStop(0, 'rgba(16, 185, 129, 0.07)');
      gradOrb2.addColorStop(0.7, 'rgba(212, 175, 55, 0.04)');
      gradOrb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradOrb2;
      ctx.fillRect(0, 0, width, height);

      // Render Islamic Particles & Shapes
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulseVal += p.pulseSpeed;

        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        const currentOpacity = p.opacity * (0.65 + 0.35 * Math.sin(p.pulseVal));

        if (p.isCrescent) {
          // Draw subtle crescent motif
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = `rgba(235, 205, 120, ${currentOpacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#072b22';
          ctx.beginPath();
          ctx.arc(p.size * 1.2, -p.size * 0.6, p.size * 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.isStar) {
          // Draw soft 8-pointed Islamic geometric star
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(time * 0.3 + p.pulseVal);
          ctx.fillStyle = `rgba(240, 215, 140, ${currentOpacity * 0.8})`;
          const r = p.size * 2.2;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const dist = i % 2 === 0 ? r : r * 0.45;
            const sx = Math.cos(angle) * dist;
            const sy = Math.sin(angle) * dist;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          // Ambient golden dust particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 195, 130, ${currentOpacity * 0.75})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.98 }}
    />
  );
};
