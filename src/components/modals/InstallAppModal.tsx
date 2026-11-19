import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  Share,
  PlusSquare,
  Smartphone,
  Laptop,
  Sparkles,
  WifiOff,
  Zap,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [platformTab, setPlatformTab] = useState<'auto' | 'chrome' | 'ios' | 'android'>(
    isIOS ? 'ios' : 'auto'
  );
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallStatus('Installed successfully!');
        setTimeout(() => onClose(), 1500);
      } else {
        setInstallStatus('Installation was dismissed.');
      }
    } else {
      setInstallStatus('Use the browser address bar or menu to install.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        {/* Header with App Branding */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0c1d2d] to-[#14293f] text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 p-2 flex items-center justify-center shadow-inner">
              <img
                src="/favicon.svg"
                alt="AirCast"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="install-modal-title" className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Install AirCast App
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Global Air Quality Intelligence &amp; Respiratory Diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center">
              <Zap className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-[11px] font-bold text-[#0c1d2d]">Near-Instant</span>
              <span className="text-[9px] text-slate-500">Fast streaming launch</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center">
              <WifiOff className="w-4 h-4 text-emerald-500 mb-1" />
              <span className="text-[11px] font-bold text-[#0c1d2d]">Offline Ready</span>
              <span className="text-[9px] text-slate-500">Cached telemetry data</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center">
              <Smartphone className="w-4 h-4 text-blue-500 mb-1" />
              <span className="text-[11px] font-bold text-[#0c1d2d]">Full Screen</span>
              <span className="text-[9px] text-slate-500">Native app experience</span>
            </div>
          </div>

          {/* Direct Install Button if browser supports 1-click prompt */}
          {isInstallable && !isInstalled && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-xs font-bold text-blue-900 block">
                  Direct Installation Available
                </span>
                <span className="text-[11px] text-blue-700">
                  Ready to install instantly onto your desktop or home screen.
                </span>
              </div>
              <button
                onClick={handleTriggerInstall}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#1f6feb] hover:bg-[#1557bf] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>AirCast is already installed on this device and ready to launch in standalone mode!</span>
            </div>
          )}

          {installStatus && (
            <div className="text-xs text-center font-medium text-slate-700 bg-slate-100 p-2 rounded-lg">
              {installStatus}
            </div>
          )}

          {/* Platform Tab Switcher */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Installation Instructions</span>
              <span className="text-[10px] text-slate-500 font-normal">Choose your operating system</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPlatformTab('ios')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  platformTab === 'ios' ? 'bg-white text-[#0c1d2d] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setPlatformTab('android')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  platformTab === 'android' ? 'bg-white text-[#0c1d2d] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setPlatformTab('chrome')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  platformTab === 'chrome' || platformTab === 'auto'
                    ? 'bg-white text-[#0c1d2d] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-blue-600" />
                <span>Chrome / PC / Mac</span>
              </button>
            </div>
          </div>

          {/* Instructions details according to selected platform */}
          {platformTab === 'ios' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="font-bold text-[#0c1d2d] flex items-center gap-1.5">
                <Share className="w-4 h-4 text-blue-600" />
                <span>How to Install on iOS Safari:</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  Open this page in <strong>Safari</strong> on your iPhone or iPad.
                </li>
                <li className="flex items-start gap-1.5">
                  <span>Tap the</span>
                  <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                    <Share className="w-3 h-3 text-blue-600 inline" /> Share
                  </strong>
                  <span>button in the Safari bottom toolbar.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span>Scroll down and select</span>
                  <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                    <PlusSquare className="w-3 h-3 text-slate-700 inline" /> Add to Home Screen
                  </strong>
                </li>
                <li>
                  Confirm by tapping <strong>Add</strong> at top right. The AirCast app icon will appear directly on your home screen!
                </li>
              </ol>
            </div>
          )}

          {platformTab === 'android' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="font-bold text-[#0c1d2d] flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>How to Install on Android:</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  {isInstallable ? (
                    <span>
                      Tap the <strong>Install Now</strong> button above for 1-click install.
                    </span>
                  ) : (
                    <span>Tap the <strong>three vertical dots (⋮)</strong> in Chrome at top right.</span>
                  )}
                </li>
                <li>
                  Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                </li>
                <li>
                  Confirm the installation prompt. AirCast will launch as a standalone application.
                </li>
              </ol>
            </div>
          )}

          {(platformTab === 'chrome' || platformTab === 'auto') && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2.5">
              <div className="font-bold text-[#0c1d2d] flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>One-Click Desktop &amp; Browser Installation:</span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Click below to instantly install AirCast onto your desktop, dock, or home screen with full offline telemetry support and fast streaming.
              </p>
              <button
                onClick={handleTriggerInstall}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Trigger Instant Install</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PWA v1.0.0 &bull; Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
