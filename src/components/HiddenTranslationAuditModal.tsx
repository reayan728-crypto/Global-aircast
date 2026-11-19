import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Play, Globe, ShieldCheck } from 'lucide-react';
import { LANGUAGES, LanguageCode, runTranslationAudit } from '../utils/i18n';
import { useLanguage } from '../context/LanguageContext';

interface HiddenTranslationAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HiddenTranslationAuditModal: React.FC<HiddenTranslationAuditModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<ReturnType<typeof runTranslationAudit> | null>(null);

  if (!isOpen) return null;

  const handleRunAudit = () => {
    setIsRunning(true);
    setTimeout(() => {
      const audit = runTranslationAudit();
      setResults(audit);
      setIsRunning(false);
    }, 400);
  };

  const handleTestLanguage = (langCode: LanguageCode) => {
    setLanguage(langCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-extrabold text-[#0c1d2d]">
                Translation &amp; i18n Test Suite (37 Languages)
              </h3>
              <p className="text-xs text-slate-500">
                Audits all UI string keys, regional script fallbacks, and parameter interpolation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
            <div>
              <span className="font-bold text-blue-950">Active Language: </span>
              <span className="font-mono text-blue-800 font-extrabold uppercase">{currentLanguage}</span>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'Auditing...' : 'Run 37-Language Audit'}</span>
            </button>
          </div>

          {results && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-[11px] text-emerald-800">Total Key Strings Tested</div>
                  <div className="text-2xl font-black font-mono text-emerald-700">{results.totalKeys}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-[11px] text-blue-800">Languages Evaluated</div>
                  <div className="text-2xl font-black font-mono text-blue-700">{results.totalLanguages}</div>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 pt-2">
                Language Completeness Matrix &amp; Switcher:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                {LANGUAGES.map(lang => {
                  const data = results.report[lang.code] || { completenessPercent: 100, missing: 0 };
                  const isCurrent = currentLanguage === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleTestLanguage(lang.code)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <div>
                          <div className="font-bold leading-tight">{lang.name}</div>
                          <div className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                            {lang.nativeName} ({lang.code.toUpperCase()})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-emerald-300' : 'text-emerald-600'}`} />
                        <span>{data.completenessPercent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Click any language above to switch the entire application live.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
