import React, { useState } from 'react';
import { X, Globe, Check, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES, LanguageCode } from '../../utils/i18n';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = LANGUAGES.filter(
    l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#14202e]/15 relative max-h-[85vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close language selector"
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-[#14202e] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Globe className="w-5 h-5 text-[#bfe3ff]" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#14202e] bg-[#eef4ff] px-2 py-0.5 rounded border border-[#14202e]/10">
              GLOBAL LOCALIZATION
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0c1d2d] mt-0.5 leading-tight">
              {t('selectLanguage')}
            </h3>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-3.5">
          <Search className="w-4 h-4 text-[#75777c] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchLanguage')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#14202e]/15 rounded-xl text-[#0c1d2d] placeholder:text-[#75777c] focus:outline-none focus:ring-2 focus:ring-[#1f6feb] transition-all"
          />
        </div>

        {/* Languages Grid */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[50vh]">
          {filteredLanguages.map(item => {
            const isSelected = item.code === currentLanguage;
            return (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                className={`w-full p-2.5 sm:p-3 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-[#14202e] text-white border-[#14202e] shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-[#0c1d2d] border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl shrink-0" role="img" aria-label={item.name}>
                    {item.flag}
                  </span>
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                      <span>{item.nativeName}</span>
                      {item.isRtl && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          RTL
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] ${isSelected ? 'text-[#bbc7da]' : 'text-[#75777c]'}`}>
                      {item.name}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {item.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">
            {LANGUAGES.length} {t('worldStations')} &amp; Dialects Supported
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
