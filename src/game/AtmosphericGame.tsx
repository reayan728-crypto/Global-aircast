import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, X, Shield, Wind, Sparkles, Zap } from 'lucide-react';
import { sound } from './soundEffects';

interface AtmosphericGameProps {
  onExit: () => void;
  cityName: string;
  initialAqi: number;
}

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface AerosolEnemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'smog' | 'vortex' | 'pyro';
  telegraphTime: number; // windup telegraph
  pulsePhase: number;
  hp: number;
}

interface OxygenPickup {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const AtmosphericGame: React.FC<AtmosphericGameProps> = ({
  onExit,
  cityName,
  initialAqi
}) => {
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('aircast_high_score') || '0', 10);
  });
  const [filterHealth, setFilterHealth] = useState(100);
  const [combo, setCombo] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for pure 60fps loop decoupled from React state renders
  const logicRef = useRef({
    gameState: 'title' as GameState,
    score: 0,
    health: 100,
    combo: 1,
    lastTime: 0,
    keys: {} as Record<string, boolean>,
    justPressed: {} as Record<string, boolean>,
    hitstop: 0,
    screenShake: 0,
    // Player Drone state
    player: {
      x: 300,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 16,
      squashX: 1,
      squashY: 1,
      pulseCooldown: 0,
      invulnerable: 0,
    },
    enemies: [] as AerosolEnemy[],
    pickups: [] as OxygenPickup[],
    pulses: [] as PulseWave[],
    particles: [] as Particle[],
    spawnTimer: 0,
    pickupTimer: 0,
    difficultyMultiplier: 1.0,
    touch: {
      active: false,
      x: 300,
      y: 400,
    },
  });

  const toggleMute = () => {
    sound.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  const triggerPulse = () => {
    const l = logicRef.current;
    const p = l.player;
    if (l.gameState !== 'playing' || p.pulseCooldown > 0) return;

    p.pulseCooldown = 0.45;
    p.squashX = 1.35;
    p.squashY = 0.75;
    sound.playPulse();

    l.pulses.push({
      x: p.x,
      y: p.y,
      radius: 10,
      maxRadius: 180,
      alpha: 1.0
    });

    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      l.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0,
        maxLife: 0.35,
        color: '#00b050',
        size: 3
      });
    }
  };

  const startGame = () => {
    const l = logicRef.current;
    l.gameState = 'playing';
    l.score = 0;
    l.health = 100;
    l.combo = 1;
    l.enemies = [];
    l.pickups = [];
    l.pulses = [];
    l.particles = [];
    l.player.x = window.innerWidth / 2;
    l.player.y = window.innerHeight * 0.75;
    l.player.vx = 0;
    l.player.vy = 0;
    l.difficultyMultiplier = 1.0;
    l.screenShake = 0;
    l.hitstop = 0;
    l.touch.active = false;

    setScore(0);
    setFilterHealth(100);
    setCombo(1);
    setGameState('playing');
  };

  // Keyboard and window blur handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      if (!logicRef.current.keys[code]) {
        logicRef.current.justPressed[code] = true;
      }
      logicRef.current.keys[code] = true;

      // Handle State shortcuts
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (logicRef.current.gameState === 'playing') {
          logicRef.current.gameState = 'paused';
          setGameState('paused');
        } else if (logicRef.current.gameState === 'paused') {
          logicRef.current.gameState = 'playing';
          setGameState('playing');
        }
      }

      if (e.code === 'Enter' || e.code === 'Space') {
        if (logicRef.current.gameState === 'title') {
          startGame();
        } else if (logicRef.current.gameState === 'gameover') {
          startGame();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      logicRef.current.keys[e.code] = false;
    };

    const onBlur = () => {
      logicRef.current.keys = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Main 60fps Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    logicRef.current.lastTime = performance.now();

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - logicRef.current.lastTime) / 1000;
      logicRef.current.lastTime = currentTime;
      // Clamp delta time to 50ms to prevent spiral of death
      const dt = Math.min(rawDt, 0.05);

      const l = logicRef.current;

      // Hitstop delay
      if (l.hitstop > 0) {
        l.hitstop -= dt;
      } else {
        // Run update logic only when not hitstopped
        if (l.gameState === 'playing') {
          updateGame(dt, canvas.width, canvas.height);
        } else if (l.gameState === 'title') {
          updateTitleAnimation(dt, canvas.width, canvas.height);
        }
      }

      // Render
      render(ctx, canvas.width, canvas.height);

      // Reset edge-triggered justPressed keys
      l.justPressed = {};

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Title screen ambient background pan
  const updateTitleAnimation = (dt: number, width: number, height: number) => {
    const l = logicRef.current;
    // Ambient drift particles
    if (Math.random() < 0.2) {
      l.particles.push({
        x: Math.random() * width,
        y: height + 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -40 - Math.random() * 60,
        life: 0,
        maxLife: 4 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#00b050' : '#bfe3ff',
        size: 2 + Math.random() * 3
      });
    }

    for (let i = l.particles.length - 1; i >= 0; i--) {
      const p = l.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life >= p.maxLife) l.particles.splice(i, 1);
    }
  };

  // Main Simulation Step
  const updateGame = (dt: number, width: number, height: number) => {
    const l = logicRef.current;
    const p = l.player;

    // Movement Input: Touch Drag for Mobile vs WASD / Arrows for Laptop
    if (l.touch.active) {
      const dx = l.touch.x - p.x;
      const dy = l.touch.y - p.y;
      p.vx += (dx * 8 - p.vx) * 0.25;
      p.vy += (dy * 8 - p.vy) * 0.25;
    } else {
      let moveX = 0;
      let moveY = 0;
      if (l.keys['KeyW'] || l.keys['ArrowUp']) moveY -= 1;
      if (l.keys['KeyS'] || l.keys['ArrowDown']) moveY += 1;
      if (l.keys['KeyA'] || l.keys['ArrowLeft']) moveX -= 1;
      if (l.keys['KeyD'] || l.keys['ArrowRight']) moveX += 1;

      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      const speed = 420;
      p.vx += (moveX * speed - p.vx) * 0.18;
      p.vy += (moveY * speed - p.vy) * 0.18;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Bounds clamp
    p.x = Math.max(p.radius + 8, Math.min(width - p.radius - 8, p.x));
    p.y = Math.max(p.radius + 8, Math.min(height - p.radius - 8, p.y));

    // Squash & stretch recovery
    p.squashX += (1 - p.squashX) * 0.15;
    p.squashY += (1 - p.squashY) * 0.15;

    // Invulnerability timer
    if (p.invulnerable > 0) p.invulnerable -= dt;
    if (p.pulseCooldown > 0) p.pulseCooldown -= dt;

    // Space / Action: Trigger Atmospheric Ionizer Burst
    if ((l.justPressed['Space'] || l.justPressed['KeyJ']) && p.pulseCooldown <= 0) {
      triggerPulse();
    }

    // Update Pulses & Hit detection against Enemies
    for (let i = l.pulses.length - 1; i >= 0; i--) {
      const pulse = l.pulses[i];
      pulse.radius += (pulse.maxRadius - pulse.radius) * 12 * dt;
      pulse.alpha -= 1.8 * dt;

      // Disperse enemies touched by pulse wave
      for (let j = l.enemies.length - 1; j >= 0; j--) {
        const en = l.enemies[j];
        const dist = Math.hypot(en.x - pulse.x, en.y - pulse.y);
        if (dist <= pulse.radius + en.radius) {
          en.hp -= 1;
          if (en.hp <= 0) {
            // Dispersed!
            sound.playDisperse();
            l.score += 50 * l.combo;
            l.combo = Math.min(8, l.combo + 1);

            // Burst particles
            for (let k = 0; k < 12; k++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 40 + Math.random() * 90;
              l.particles.push({
                x: en.x,
                y: en.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 0,
                maxLife: 0.4,
                color: en.type === 'pyro' ? '#ff7f27' : '#8c6800',
                size: 3.5
              });
            }

            l.enemies.splice(j, 1);
          }
        }
      }

      if (pulse.alpha <= 0) {
        l.pulses.splice(i, 1);
      }
    }

    // Spawn Enemies
    l.spawnTimer += dt;
    l.difficultyMultiplier += 0.015 * dt;

    if (l.spawnTimer >= Math.max(0.45, 1.3 / l.difficultyMultiplier)) {
      l.spawnTimer = 0;
      const typeRand = Math.random();
      const type: AerosolEnemy['type'] =
        typeRand > 0.75 ? 'pyro' : typeRand > 0.45 ? 'vortex' : 'smog';

      const spawnX = Math.random() * (width - 60) + 30;
      l.enemies.push({
        x: spawnX,
        y: -30,
        vx: (Math.random() - 0.5) * 60,
        vy: 110 + Math.random() * 80 * l.difficultyMultiplier,
        radius: type === 'smog' ? 18 : type === 'vortex' ? 24 : 14,
        type,
        telegraphTime: 0.4,
        pulsePhase: Math.random() * Math.PI,
        hp: type === 'vortex' ? 2 : 1
      });
    }

    // Update Enemies & Player Collision
    for (let i = l.enemies.length - 1; i >= 0; i--) {
      const en = l.enemies[i];
      en.x += en.vx * dt;
      en.y += en.vy * dt;
      en.pulsePhase += dt * 4;

      // Player Collision
      if (p.invulnerable <= 0) {
        const d = Math.hypot(p.x - en.x, p.y - en.y);
        if (d <= p.radius + en.radius) {
          // Take damage!
          sound.playHit();
          l.hitstop = 0.06; // 60ms simulation hitstop
          l.screenShake = 16;
          p.invulnerable = 1.0;
          l.combo = 1;

          const dmg = en.type === 'pyro' ? 25 : 15;
          l.health = Math.max(0, l.health - dmg);

          setFilterHealth(l.health);
          setCombo(1);

          // Check Game Over
          if (l.health <= 0) {
            l.gameState = 'gameover';
            setGameState('gameover');
            if (l.score > highScore) {
              setHighScore(l.score);
              localStorage.setItem('aircast_high_score', l.score.toString());
            }
          }
        }
      }

      if (en.y > height + 40) {
        l.enemies.splice(i, 1);
      }
    }

    // Spawn Oxygen Pickups (Canisters)
    l.pickupTimer += dt;
    if (l.pickupTimer >= 2.2) {
      l.pickupTimer = 0;
      l.pickups.push({
        x: Math.random() * (width - 80) + 40,
        y: -20,
        radius: 12,
        pulsePhase: 0
      });
    }

    // Update Pickups & Collection
    for (let i = l.pickups.length - 1; i >= 0; i--) {
      const pk = l.pickups[i];
      pk.y += 90 * dt;
      pk.pulsePhase += dt * 5;

      const d = Math.hypot(p.x - pk.x, p.y - pk.y);
      if (d <= p.radius + pk.radius + 6) {
        // Collect!
        sound.playCollect();
        l.score += 120 * l.combo;
        l.health = Math.min(100, l.health + 10);
        setFilterHealth(l.health);

        // Pickup burst
        for (let k = 0; k < 8; k++) {
          const ang = Math.random() * Math.PI * 2;
          l.particles.push({
            x: pk.x,
            y: pk.y,
            vx: Math.cos(ang) * 70,
            vy: Math.sin(ang) * 70,
            life: 0,
            maxLife: 0.35,
            color: '#bfe3ff',
            size: 3
          });
        }

        l.pickups.splice(i, 1);
      } else if (pk.y > height + 30) {
        l.pickups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = l.particles.length - 1; i >= 0; i--) {
      const pt = l.particles[i];
      pt.life += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.life >= pt.maxLife) {
        l.particles.splice(i, 1);
      }
    }

    // Decay camera shake
    if (l.screenShake > 0) {
      l.screenShake = Math.max(0, l.screenShake - 24 * dt);
    }

    // Sync score periodically to UI
    setScore(l.score);
  };

  // Canvas Render Frame
  const render = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const l = logicRef.current;

    ctx.save();

    // Camera shake offset
    if (l.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * l.screenShake;
      const shakeY = (Math.random() - 0.5) * l.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Deep Atmospheric Inversion Canvas Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0c1d2d');
    bgGrad.addColorStop(0.5, '#14202e');
    bgGrad.addColorStop(1, '#223243');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle atmospheric flow grid lines
    ctx.strokeStyle = 'rgba(191, 227, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Particles
    for (const p of l.particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Pulses
    for (const pls of l.pulses) {
      ctx.strokeStyle = '#00b050';
      ctx.globalAlpha = pls.alpha;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(pls.x, pls.y, pls.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Draw Pickups (Oxygen Canisters)
    for (const pk of l.pickups) {
      const glow = Math.sin(pk.pulsePhase) * 2;
      ctx.fillStyle = '#bfe3ff';
      ctx.beginPath();
      ctx.arc(pk.x, pk.y, pk.radius + glow, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00b050';
      ctx.beginPath();
      ctx.arc(pk.x, pk.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Enemies (Aerosol Clusters)
    for (const en of l.enemies) {
      const pulse = Math.sin(en.pulsePhase) * 2.5;
      if (en.type === 'pyro') {
        ctx.fillStyle = '#ff7f27';
        ctx.strokeStyle = '#e53935';
      } else if (en.type === 'vortex') {
        ctx.fillStyle = '#7b1f1f';
        ctx.strokeStyle = '#ff7f27';
      } else {
        ctx.fillStyle = '#d48806';
        ctx.strokeStyle = '#ffd591';
      }

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.radius + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Core particulate dot
      ctx.fillStyle = '#0c1d2d';
      ctx.beginPath();
      ctx.arc(en.x, en.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Player Drone (Aero-Probe) if in playing or paused state
    if (l.gameState === 'playing' || l.gameState === 'paused') {
      const p = l.player;

      // Flashing when invulnerable
      if (p.invulnerable <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.squashX, p.squashY);

        // Outer ionizer shield aura
        ctx.strokeStyle = '#00b050';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();

        // Drone Body (Bespoke Sleek Craft)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius * 0.9, p.radius * 0.8);
        ctx.lineTo(0, p.radius * 0.4);
        ctx.lineTo(-p.radius * 0.9, p.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Cockpit light
        ctx.fillStyle = '#00b050';
        ctx.beginPath();
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#0c1d2d] overflow-hidden select-none font-sans">
      {/* 60fps Isolated Canvas with Touch & Mouse support */}
      <canvas
        ref={canvasRef}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) {
            logicRef.current.touch.active = true;
            logicRef.current.touch.x = t.clientX;
            logicRef.current.touch.y = t.clientY;
          }
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) {
            logicRef.current.touch.active = true;
            logicRef.current.touch.x = t.clientX;
            logicRef.current.touch.y = t.clientY;
          }
        }}
        onTouchEnd={() => {
          logicRef.current.touch.active = false;
        }}
        onTouchCancel={() => {
          logicRef.current.touch.active = false;
        }}
        className="absolute inset-0 w-full h-full block cursor-crosshair touch-none"
      />

      {/* World-Matched Low-Occlusion UI (<15% viewport occlusion, pointer-events-none on wrappers) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6">
        {/* Top Perimeter Status Cluster */}
        <div className="flex items-center justify-between w-full">
          {/* Health & City Metadata */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-white shadow-xs">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00b050]" />
              <div className="text-xs font-bold">
                Filter:{' '}
                <span className="font-mono tabular-nums text-[#00b050] font-black">
                  {filterHealth}%
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold">
              <Wind className="w-3.5 h-3.5 text-[#bfe3ff]" />
              <span>{cityName} Inversion Sector</span>
            </div>
          </div>

          {/* Score & Combo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <div className="text-[9px] sm:text-[10px] uppercase font-mono text-[#bbc7da] tracking-wider">
                Score
              </div>
              <div className="text-lg sm:text-2xl font-black font-sans text-white tabular-nums leading-none">
                {score}
              </div>
            </div>

            {combo > 1 && (
              <div className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-[11px] sm:text-xs font-black animate-pulse">
                {combo}×
              </div>
            )}

            {/* Utility Controls (Pause, Mute & Exit) */}
            <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2">
              {gameState === 'playing' && (
                <button
                  onClick={() => {
                    logicRef.current.gameState = 'paused';
                    setGameState('paused');
                  }}
                  aria-label="Pause Simulation"
                  className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={toggleMute}
                aria-label="Toggle Sound"
                className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onExit}
                aria-label="Exit Game"
                className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-red-500/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile On-Screen Floating Pulse Button */}
        {gameState === 'playing' && (
          <div className="pointer-events-auto self-end flex items-center gap-2 mb-2 sm:mb-4">
            <button
              onClick={triggerPulse}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00b050] hover:bg-[#009b46] active:scale-90 text-white shadow-2xl border-2 border-white/40 flex flex-col items-center justify-center cursor-pointer transition-transform select-none"
              title="Disperse Aerosol Pulse (Space / Tap)"
            >
              <Zap className="w-6 h-6 fill-current animate-pulse" />
              <span className="text-[9px] font-mono font-black tracking-widest uppercase mt-0.5">
                PULSE
              </span>
            </button>
          </div>
        )}

        {/* Bottom Flat Control Hint Line */}
        <div className="text-center text-[10px] sm:text-[11px] font-mono text-[#bbc7da]/80 tracking-wide pointer-events-none pb-1">
          <span className="hidden sm:inline">WASD / Arrow Keys Move · Space to Disperse Pulse · Esc / P Pause · </span>
          <span>Touch &amp; Drag Screen to Steer · Tap ⚡ Pulse to Disperse</span>
        </div>
      </div>

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#0c1d2d]/75 backdrop-blur-xs select-none">
          <div className="max-w-md w-full text-center">
            {/* Bespoke inline SVG Title Lockup */}
            <div className="flex justify-center mb-4">
              <svg width="84" height="84" viewBox="0 0 100 100" className="drop-shadow-md">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#00b050" strokeWidth="3" />
                <path
                  d="M 25 50 Q 50 20 75 50 T 25 50"
                  fill="none"
                  stroke="#bfe3ff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="8" fill="#ffffff" />
              </svg>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[#00b050] text-[11px] font-mono font-bold tracking-widest uppercase mb-3">
              Atmospheric Drone Dispatcher
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              AEROSOL INVERSION: Clean Air Pilot
            </h1>

            <p className="text-sm text-[#bbc7da] mb-7 leading-relaxed">
              Pilot the Aero-Probe drone across <strong className="text-white">{cityName}</strong>'s thermal
              inversion lid. Neutralize toxic particulate swarms with ion pulses and collect clean oxygen cells.
            </p>

            <button
              onClick={startGame}
              className="w-full py-3.5 px-6 rounded-xl bg-[#00b050] hover:bg-[#009b46] text-white font-black text-sm tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mb-3"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START DISPATCH (Space / Enter)</span>
            </button>

            <button
              onClick={onExit}
              className="w-full py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Return to Forecast Dashboard
            </button>

            <div className="mt-6 text-[11px] font-mono text-slate-400">
              High Score: <span className="text-white font-bold">{highScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Paused Modal */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-[#14202e] rounded-2xl p-6 max-w-sm w-full text-center border border-white/15 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-2">SIMULATION PAUSED</h2>
            <p className="text-xs text-[#bbc7da] mb-6">
              Drone engines on standby. Current Score: <strong className="text-white">{score}</strong>
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  logicRef.current.gameState = 'playing';
                  setGameState('playing');
                }}
                className="w-full py-2.5 rounded-xl bg-[#00b050] hover:bg-[#009b46] text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Resume Dispatch (Esc / P)
              </button>

              <button
                onClick={startGame}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Restart Flight
              </button>

              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
          <div className="bg-[#14202e] rounded-2xl p-6 sm:p-8 max-w-md w-full text-center border border-red-500/30 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Wind className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block mb-1">
              FILTER CAPACITY BREACHED
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Mission Concluded
            </h2>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 my-4 text-center">
              <div className="text-[11px] font-mono text-[#bbc7da]">Final Particulate Score</div>
              <div className="text-3xl font-black text-white tabular-nums my-1">{score}</div>
              {score >= highScore && score > 0 && (
                <div className="text-xs text-amber-300 font-bold flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NEW HIGH RECORD!</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-[#00b050] hover:bg-[#009b46] text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Launch New Probe (Space / Enter)</span>
              </button>

              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Return to AirCast Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
