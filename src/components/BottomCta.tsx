import React from 'react';
import { Eye, Code2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BottomCtaProps {
  onScrollToTop: () => void;
  onOpenApiModal: () => void;
}

export const BottomCta: React.FC<BottomCtaProps> = ({
  onScrollToTop,
  onOpenApiModal
}) => {
  const { t } = useLanguage();

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-12">
      <div className="rounded-2xl p-8 sm:p-10 bg-[#14202e] text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#bfe3ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono font-semibold text-[#bfe3ff] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#00b050] live-pulse" />
            <span>{t('autonomousDispatch')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 font-sans">
            {t('readyToTakeControl')}
          </h2>

          <p className="text-sm text-[#bbc7da] leading-relaxed mb-6 font-normal">
            {t('readyDesc')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onScrollToTop}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#f8f9ff] text-[#0c1d2d] font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:translate-y-[-1px] cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#14202e]" />
              <span>{t('inspectYourCityNow')}</span>
            </button>

            <button
              onClick={onOpenApiModal}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-[#bfe3ff]" />
              <span>{t('accessDeveloperApi')}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
