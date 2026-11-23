import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallTopButtonProps {
  className?: string;
  variant?: 'brand' | 'nav' | 'compact';
}

export const PWAInstallTopButton: React.FC<PWAInstallTopButtonProps> = ({
  className = ''
}) => {
  const { isInstalled, install } = usePWAInstall();
  const [installSuccessToast, setInstallSuccessToast] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallSuccessToast(true);
        setTimeout(() => setInstallSuccessToast(false), 3000);
      }
    } catch (err) {
      console.warn('Install error:', err);
    }
  };

  // If already running in standalone/installed mode, show confirmed status badge
  if (isInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300/80 text-[11px] font-bold shadow-2xs select-none ${className}`}
        title="AirCast is installed in standalone mode"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Installed</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer bg-gradient-to-r from-[#1f6feb] to-[#0f53bb] hover:from-[#2a7bf8] hover:to-[#175ec9] text-white border border-blue-400/40 ring-1 ring-blue-500/20 hover:ring-blue-400/40 ${className}`}
        title="Install Global Air Quality Intelligence onto your device with 1 click"
        aria-label="Install AirCast application"
      >
        <div className="relative">
          <Download className="w-3.5 h-3.5 text-white group-hover:translate-y-0.5 transition-transform" />
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
        </div>
        <span className="tracking-tight whitespace-nowrap">Install App</span>
        <span className="hidden xl:inline-flex text-[9px] font-extrabold uppercase bg-white/20 px-1 py-0.2 rounded text-cyan-100">
          PWA
        </span>
      </button>

      {/* Instant Feedback Toast */}
      {installSuccessToast && (
        <div className="fixed top-20 right-4 z-50 pointer-events-none max-w-[calc(100vw-2rem)] whitespace-nowrap px-3 py-1.5 rounded-lg bg-emerald-900 text-white text-xs font-semibold shadow-xl border border-emerald-600 animate-fade-in flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>Installing AirCast...</span>
        </div>
      )}
    </div>
  );
};
