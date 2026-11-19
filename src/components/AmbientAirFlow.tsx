import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wind, Play, Pause, Sparkles } from 'lucide-react';
import { CityData } from '../data/cities';

interface AmbientAirFlowProps {
  selectedCity: CityData;
}

interface Particle {
  x: number;
  y: number;
  baseVx: number;
  baseVy: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  alpha: number;
  hue: number; // 180 (cyan) to 150 (emerald)
  phase: number;
  waveSpeed: number;
  waveAmp: number;
}

export const AmbientAirFlow: React.FC<AmbientAirFlowProps> = ({ selectedCity }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [flowMode, setFlowMode] = useState<'subtle' | 'dynamic' | 'paused'>('subtle');
  const [showControl, setShowControl] = useState<boolean>(false);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const animFrameRef = useRef<number | null>(null);

  // Speed multiplier based on selected city's actual wind speed (km/h)
  const cityWindKmh = selectedCity.baseWind || 12;
  const speedScale = flowMode === 'dynamic' ? 1.6 : flowMode === 'subtle' ? 1.0 : 0;

  useEffect(() => {
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
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Handle mouse movement for aerodynamic vortex wake
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Check system prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setFlowMode('paused');
    }

    // Number of streamlines based on screen size
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const particles: Particle[] = [];

    // Base wind direction: predominantly East-Southeast flow with regional variance
    const angleRad = (25 * Math.PI) / 180; // 25 degrees drift
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const createParticle = (randomizePos = true): Particle => {
      const baseVelocity = (0.6 + Math.random() * 0.9) * (cityWindKmh / 12);
      // Alternate between cyan (#00e5ff: ~185) and emerald (#10b981: ~155)
      const isEmerald = Math.random() > 0.45;
      const hue = isEmerald ? 155 + Math.random() * 15 : 185 + Math.random() * 20;

      return {
        x: randomizePos ? Math.random() * width : -100,
        y: randomizePos ? Math.random() * height : Math.random() * height * 1.2 - height * 0.2,
        baseVx: baseVelocity * cosA,
        baseVy: baseVelocity * sinA,
        vx: baseVelocity * cosA,
        vy: baseVelocity * sinA,
        length: 30 + Math.random() * 55,
        width: 0.8 + Math.random() * 1.5,
        alpha: 0.12 + Math.random() * 0.18,
        hue,
        phase: Math.random() * Math.PI * 2,
        waveSpeed: 0.02 + Math.random() * 0.03,
        waveAmp: 0.3 + Math.random() * 0.6
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true));
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.67, 2.5); // normalized to 60fps
      lastTime = time;

      // Soft clear with slight fade for ultra-smooth laminar trails
      ctx.clearRect(0, 0, width, height);

      if (flowMode !== 'paused') {
        const mouse = mouseRef.current;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Sinusoidal wave turbulence
          p.phase += p.waveSpeed * delta;
          const waveOffsetY = Math.sin(p.phase) * p.waveAmp;
          const waveOffsetX = Math.cos(p.phase * 0.7) * (p.waveAmp * 0.5);

          // Interaction: mouse deflection eddy
          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const radiusSq = 140 * 140;

            if (distSq < radiusSq && distSq > 10) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / 140) * 1.8;
              // Tangential deflection (eddy swirl)
              p.vx += ((-dy / dist) * force + (dx / dist) * force * 0.5) * 0.15;
              p.vy += ((dx / dist) * force + (dy / dist) * force * 0.5) * 0.15;
            }
          }

          // Relax velocity back towards laminar base
          p.vx += (p.baseVx * speedScale - p.vx) * 0.04;
          p.vy += (p.baseVy * speedScale - p.vy) * 0.04;

          // Update position
          p.x += (p.vx + waveOffsetX) * delta;
          p.y += (p.vy + waveOffsetY) * delta;

          // Wrap around edges
          if (p.x > width + 100 || p.y > height + 100) {
            particles[i] = createParticle(false);
            continue;
          }

          // Draw the sleek aerodynamic streamline
          const tailX = p.x - (p.vx / (Math.hypot(p.vx, p.vy) || 1)) * p.length;
          const tailY = p.y - (p.vy / (Math.hypot(p.vx, p.vy) || 1)) * p.length;

          const grad = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
          grad.addColorStop(0, `hsla(${p.hue}, 85%, 55%, 0)`);
          grad.addColorStop(0.65, `hsla(${p.hue}, 85%, 55%, ${p.alpha * 0.6})`);
          grad.addColorStop(1, `hsla(${p.hue}, 90%, 65%, ${p.alpha})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          // Subtle curve to the streamline
          const ctrlX = (tailX + p.x) / 2 + waveOffsetX * 2;
          const ctrlY = (tailY + p.y) / 2 + waveOffsetY * 2;
          ctx.quadraticCurveTo(ctrlX, ctrlY, p.x, p.y);

          ctx.strokeStyle = grad;
          ctx.lineWidth = p.width;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Luminous streamlined particle head
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.width * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 95%, 75%, ${p.alpha * 1.2})`;
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cityWindKmh, speedScale, flowMode]);

  return (
    <>
      {/* FULL VIEWPORT AIR STREAM CANVAS (Always positioned behind DOM content, 100% click-through) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-80"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* COMPACT FLOATING AIR FLOW TELEMETRY & CONTROLLER (Bottom Left HUD) */}
      <aside aria-label="Ambient Air Flow Controls" className="fixed bottom-3 left-3 z-30 select-none">
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/90 shadow-md text-xs text-[#0c1d2d] transition-all hover:bg-white">
          <button
            onClick={() => {
              if (flowMode === 'subtle') setFlowMode('dynamic');
              else if (flowMode === 'dynamic') setFlowMode('paused');
              else setFlowMode('subtle');
            }}
            className="flex items-center gap-1.5 cursor-pointer font-bold group"
            title="Toggle Ambient Air Flow Simulation"
          >
            <div className="w-5 h-5 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <Wind className={`w-3 h-3 ${flowMode !== 'paused' ? 'animate-pulse text-cyan-600' : 'text-slate-400'}`} />
            </div>
            <span className="hidden sm:inline font-mono text-[11px]">
              {flowMode === 'paused' ? 'Air Flow: Paused' : `Air Flow: ${cityWindKmh} km/h`}
            </span>
            <span className="sm:hidden font-mono text-[10px]">
              {flowMode === 'paused' ? 'Paused' : `${cityWindKmh} km/h`}
            </span>
          </button>

          {/* Quick Cycle Mode Button */}
          <button
            onClick={() => {
              if (flowMode === 'subtle') setFlowMode('dynamic');
              else if (flowMode === 'dynamic') setFlowMode('paused');
              else setFlowMode('subtle');
            }}
            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
          >
            {flowMode === 'paused' ? 'Resume' : flowMode === 'subtle' ? 'Subtle' : 'Dynamic'}
          </button>
        </div>
      </aside>
    </>
  );
};
