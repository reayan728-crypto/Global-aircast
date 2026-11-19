import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  animated?: boolean;
}

/**
 * AppLogo: Bespoke Aerospheric Vortex & Isobar Engine Glyph
 * 
 * Distinctive, proprietary brand mark featuring:
 * - Triple aerodynamic laminar airfoils curling in a logarithmic vortex
 * - Concentric isobaric atmospheric calibration arcs
 * - Luminous cyan-to-emerald core telemetry nucleus
 * - Precision deep obsidian contrast base
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  animated = false
}) => {
  const pixelSize = typeof size === 'number'
    ? size
    : size === 'xs'
    ? 20
    : size === 'sm'
    ? 26
    : size === 'md'
    ? 36
    : size === 'lg'
    ? 48
    : 64;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label="Global Air Quality Intelligence Logo"
    >
      <svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Obsidian Capsule Base */}
          <linearGradient id="logoObsidianGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f1f33" />
            <stop offset="50%" stopColor="#081422" />
            <stop offset="100%" stopColor="#03080e" />
          </linearGradient>

          {/* Primary Laminar Streamline: Electric Cyan -> Bio Emerald */}
          <linearGradient id="logoPrimaryFoil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="55%" stopColor="#00b050" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          {/* Secondary Counter-Vortex: Pure Azure -> Mint */}
          <linearGradient id="logoSecondaryFoil" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>

          {/* Outer Isobaric Ring Gradient */}
          <linearGradient id="logoIsobarGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#1e3a5f" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00b050" stopOpacity="0.8" />
          </linearGradient>

          {/* Core Telemetry Sensor Glow */}
          <radialGradient id="logoCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="1" />
            <stop offset="45%" stopColor="#00b050" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#00e5ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>

          {/* Drop shadow filter */}
          <filter id="logoGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Squircle Background Base */}
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="26"
          fill="url(#logoObsidianGrad)"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="1.5"
        />

        {/* Calibrated Isobaric Latitude / Pressure Grid Ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="url(#logoIsobarGrad)"
          strokeWidth="1.2"
          strokeDasharray="4 3 12 3"
          opacity="0.6"
          className={animated ? 'animate-[spin_40s_linear_infinite]' : ''}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* Cardinal Micro-Ticks (North, South, East, West sensor gates) */}
        <line x1="50" y1="6" x2="50" y2="12" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
        <line x1="50" y1="88" x2="50" y2="94" stroke="#00b050" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
        <line x1="6" y1="50" x2="12" y2="50" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
        <line x1="88" y1="50" x2="94" y2="50" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />

        {/* Ambient Aerosphere Core Glow */}
        <circle cx="50" cy="50" r="28" fill="url(#logoCoreGlow)" />

        {/* ROTATING AIRFLOW VORTEX BLADES */}
        <g
          className={animated ? 'animate-[spin_24s_linear_infinite]' : ''}
          style={{ transformOrigin: '50px 50px' }}
        >
          {/* Foil 1: Primary Aerodynamic Blade */}
          <path
            d="M 50 18 C 66 18, 82 32, 82 50 C 82 60, 76 68, 67 69 C 58 70, 53 62, 57 54 C 61 46, 68 45, 66 38 C 64 31, 52 28, 43 32"
            fill="none"
            stroke="url(#logoPrimaryFoil)"
            strokeWidth="4.2"
            strokeLinecap="round"
            filter="url(#logoGlowFilter)"
          />

          {/* Foil 2: Secondary Interlocking Vortex */}
          <path
            d="M 50 82 C 34 82, 18 68, 18 50 C 18 40, 24 32, 33 31 C 42 30, 47 38, 43 46 C 39 54, 32 55, 34 62 C 36 69, 48 72, 57 68"
            fill="none"
            stroke="url(#logoSecondaryFoil)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          {/* Foil 3: Internal Micro-Current Streamline */}
          <path
            d="M 28 36 C 36 26, 60 25, 68 36 C 74 44, 69 55, 59 55 C 50 55, 47 48, 52 43 C 55 40, 60 41, 58 45"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>

        {/* Central Planetary Sensor Hub (Luminous Pulse) */}
        <circle cx="50" cy="50" r="6" fill="#0c1d2d" stroke="#00e5ff" strokeWidth="2" />
        <circle cx="50" cy="50" r="3.2" fill="#00e5ff" />
        <circle cx="48.5" cy="48.5" r="1.2" fill="#ffffff" />
      </svg>
    </div>
  );
};
