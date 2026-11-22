import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  LanguageCode,
  LanguageOption,
  LANGUAGES,
  TRANSLATIONS,
  getTranslation,
  formatTranslation,
  runTranslationAudit
} from '../utils/i18n';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  selectedLanguageOption: LanguageOption;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRtl: boolean;
  isTranslating: boolean;
  runAudit: () => ReturnType<typeof runTranslationAudit>;
}

const STORAGE_KEY = 'aircast_preferred_language_v2';
const CACHE_PREFIX = 'aircast_i18n_cache_v2_';

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  selectedLanguageOption: LANGUAGES[0],
  setLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => key,
  isRtl: false,
  isTranslating: false,
  runAudit: () => runTranslationAudit()
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'en';
  });

  const [dynamicDict, setDynamicDict] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${currentLanguage}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore
    }
    return {};
  });

  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const selectedLanguageOption = useMemo(() => {
    return LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];
  }, [currentLanguage]);

  const isRtl = Boolean(selectedLanguageOption.isRtl);

  // Sync HTML document direction and language attributes + aircast-all-in-one.js
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('lang', currentLanguage);
    } catch {
      // Ignore storage errors
    }
    if (isRtl) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    if (window.AirCastA11y?.refresh) {
      window.AirCastA11y.refresh();
    }
  }, [currentLanguage, isRtl]);

  // Load / Fetch missing translations for selected language
  useEffect(() => {
    // 1. Check local storage cache
    let cachedStrings: Record<string, string> = {};
    try {
      const stored = localStorage.getItem(`${CACHE_PREFIX}${currentLanguage}`);
      if (stored) {
        cachedStrings = JSON.parse(stored);
        setDynamicDict(cachedStrings);
      }
    } catch {
      // Ignore
    }

    if (currentLanguage === 'en') {
      return;
    }

    // 2. Identify missing keys in current language
    const enKeys = Object.keys(TRANSLATIONS.en);
    const existingDict = TRANSLATIONS[currentLanguage] || {};
    const missingKeys: string[] = [];

    for (const key of enKeys) {
      if (!existingDict[key] && !cachedStrings[key]) {
        missingKeys.push(key);
      }
    }

    // 3. Log console warning in development listing missing keys per language
    if (missingKeys.length > 0) {
      console.warn(`[i18n Audit] Language "${currentLanguage}" (${selectedLanguageOption.name}) has ${missingKeys.length} missing keys:`, missingKeys);
      
      // 4. Request Gemini API background translation batch for missing keys
      const stringsToTranslate: Record<string, string> = {};
      // Fetch up to 40 missing keys at a time
      missingKeys.slice(0, 45).forEach(k => {
        stringsToTranslate[k] = TRANSLATIONS.en[k];
      });

      if (Object.keys(stringsToTranslate).length > 0) {
        setIsTranslating(true);
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strings: stringsToTranslate,
            targetLanguage: selectedLanguageOption.name,
            targetLanguageCode: currentLanguage
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data?.translations && typeof data.translations === 'object') {
              const updated = { ...cachedStrings, ...data.translations };
              setDynamicDict(updated);
              try {
                localStorage.setItem(`${CACHE_PREFIX}${currentLanguage}`, JSON.stringify(updated));
              } catch {
                // Ignore storage errors
              }
            }
          })
          .catch(err => {
            console.debug('[i18n background fetch notice]', err);
          })
          .finally(() => {
            setIsTranslating(false);
          });
      }
    }
  }, [currentLanguage, selectedLanguageOption]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setCurrentLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem('lang', lang);
      const cached = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
      if (cached) {
        setDynamicDict(JSON.parse(cached));
      } else {
        setDynamicDict({});
      }
    } catch {
      // Ignore
    }
    if (window.AirCastAssistant?.setLanguage && window.AirCastAssistant.getLang?.() !== lang) {
      window.AirCastAssistant.setLanguage(lang);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const template = getTranslation(currentLanguage, key, dynamicDict);
      return formatTranslation(template, params);
    },
    [currentLanguage, dynamicDict]
  );

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        selectedLanguageOption,
        setLanguage,
        t,
        isRtl,
        isTranslating,
        runAudit: runTranslationAudit
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
