import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorModal } from './modals/LanguageSelectorModal';
import { AppLogo } from './AppLogo';

interface FooterProps {
  onOpenApiModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenApiModal }) => {
  const { t, selectedLanguageOption } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);

  return (
    <>
      <footer className="w-full bg-white/70 backdrop-blur-md border-t border-[#14202e]/10 pt-12 pb-8 text-xs text-[#44474c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          {/* Top 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            {/* Brand info */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <AppLogo size={28} />
                <span className="font-extrabold text-base tracking-tight text-[#0c1d2d]">
                  AirCast
                </span>
              </div>
              <p className="text-[12px] text-[#4d5d70] leading-relaxed max-w-sm">
                {t('footerCredits')}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00b050]" />
                  <span>{t('whoStandardsValidated')}</span>
                </div>
                <button
                  onClick={() => setIsLangOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                >
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span>{selectedLanguageOption.flag} {selectedLanguageOption.nativeName}</span>
                </button>
              </div>
            </div>

            {/* Col 1: DATA INGESTION */}
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c1d2d] mb-3 font-sans">
                {t('dataIngestion')}
              </div>
              <ul className="space-y-2 text-[11px] text-[#4d5d70]">
                <li className="hover:text-[#0c1d2d] cursor-pointer">Copernicus Atmosphere Service (CAMS)</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">ECMWF ERA5 High-Res Reanalysis</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">US EPA &amp; AirNow Ground Network</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">CPCB &amp; Global CAAQMS Sensors</li>
              </ul>
            </div>

            {/* Col 2: MODEL TRANSPARENCY */}
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c1d2d] mb-3 font-sans">
                {t('modelTransparency')}
              </div>
              <ul className="space-y-2 text-[11px] text-[#4d5d70]">
                <li className="hover:text-[#0c1d2d] cursor-pointer">TreeSHAP Local Attributions</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">Temporal Ensemble Uncertainty Bounds</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">Boundary Layer Height Regression</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">Multi-city Weather Sensitivity Sim</li>
              </ul>
            </div>

            {/* Col 3: ARCHITECTURE */}
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c1d2d] mb-3 font-sans">
                {t('architecture')}
              </div>
              <ul className="space-y-2 text-[11px] text-[#4d5d70]">
                <li className="hover:text-[#0c1d2d] cursor-pointer">Spatio-Temporal GNN Core</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">Micro-climate Calibration V2</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">Real-time Inversion Telemetry</li>
                <li className="hover:text-[#0c1d2d] cursor-pointer">Global Multi-lingual API Mesh</li>
              </ul>
            </div>
          </div>

          {/* Bottom Sub-bar */}
          <div className="pt-6 border-t border-[#14202e]/10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#75777c]">
            <div>
              {t('copyrightText')}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onOpenApiModal}
                className="hover:text-[#0c1d2d] transition-colors cursor-pointer"
              >
                {t('apiDocLink')}
              </button>
              <span>·</span>
              <button
                onClick={() => setIsLangOpen(true)}
                className="hover:text-[#0c1d2d] cursor-pointer transition-colors"
              >
                {t('changeLanguage', { lang: selectedLanguageOption.name })}
              </button>
            </div>
          </div>
        </div>
      </footer>

      <LanguageSelectorModal
        isOpen={isLangOpen}
        onClose={() => setIsLangOpen(false)}
      />
    </>
  );
};
