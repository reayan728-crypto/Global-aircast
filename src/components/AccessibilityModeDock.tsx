import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface AccessibilityModeDockProps {
  cityName: string;
  aqi: number;
  category: string;
  pm25: number;
  bestHour: string;
}

/**
 * Floating Deaf, Blind, and Non-Speaking (Speech) accessibility mode buttons.
 * - Deaf icon (🦻): enables visual captions + sign panel and makes AQI emojis jump visibly.
 * - Blind icon (🧑‍🦯): immediately speaks full live air quality summary + advice aloud (for Good, Satisfactory, etc.) and keeps voice readout active.
 * - Non-speaking icon (🤐): opens Communication Mode (phrase board, full-screen text, quick actions).
 */
export const AccessibilityModeDock: React.FC<AccessibilityModeDockProps> = ({
  cityName,
  aqi,
  category,
  pm25,
  bestHour
}) => {
  const { t } = useLanguage();
  const [deafActive, setDeafActive] = useState(false);
  const [blindActive, setBlindActive] = useState(false);

  // Sync jumping emoji class on <html> when Deaf mode is toggled
  useEffect(() => {
    document.documentElement.classList.toggle('a11y-deaf-jump', deafActive);
    return () => {
      document.documentElement.classList.remove('a11y-deaf-jump');
    };
  }, [deafActive]);

  // Whenever Blind mode is active and city/AQI changes, speak full live readout (including Good & Satisfactory)
  useEffect(() => {
    if (!blindActive) return;
    const adviceKey =
      aqi <= 100
        ? 'a11yAdviceGood'
        : aqi <= 200
        ? 'a11yAdviceModerate'
        : aqi <= 300
        ? 'a11yAdvicePoor'
        : 'a11yAdviceSevere';
    const summary = `${t('a11yMainAqiCardSummary', {
      city: cityName,
      aqi,
      category,
      pm25
    })} ${t('a11ySummaryTemplate', {
      city: cityName,
      aqi,
      category,
      bestHour
    })} ${t(adviceKey)}`;
    window.AirCastA11y?.speak(summary, true);
  }, [blindActive, cityName, aqi, category, pm25, bestHour, t]);

  const handleDeafClick = () => {
    const next = !deafActive;
    setDeafActive(next);
    window.AirCastA11y?.setOption?.('deaf', next);
    window.AirCastA11y?.setOption?.('sign', next);
    if (next && window.AirCastAnim) {
      const level = window.AirCastAnim.levelOf(aqi);
      window.AirCastAnim.popup(level, `${cityName}: AQI ${aqi} (${category})`);
    }
  };

  const handleBlindClick = () => {
    const next = !blindActive;
    setBlindActive(next);
    window.AirCastA11y?.setOption?.('voice', next);
    if (next) {
      const adviceKey =
        aqi <= 100
          ? 'a11yAdviceGood'
          : aqi <= 200
          ? 'a11yAdviceModerate'
          : aqi <= 300
          ? 'a11yAdvicePoor'
          : 'a11yAdviceSevere';
      const msg = `${t('a11yMainAqiCardSummary', {
        city: cityName,
        aqi,
        category,
        pm25
      })} ${t(adviceKey)}`;
      window.AirCastA11y?.speak(msg, true);
    }
  };

  const handleNonSpeakingClick = () => {
    window.AirCastComm?.open();
  };

  return (
    <div
      className="a11y-mode-dock fixed right-3 bottom-[84px] z-[99990] flex flex-col gap-2"
      role="group"
      aria-label="Accessibility quick modes"
    >
      {/* Deaf Mode Icon (makes emojis jump + visual/sign mode) */}
      <button
        type="button"
        onClick={handleDeafClick}
        aria-pressed={deafActive}
        aria-label={t('deafModeLabel')}
        title={`${t('deafModeLabel')} — Jumping visual emojis & sign panel`}
        className={`w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xl cursor-pointer transition-transform active:scale-95 ${
          deafActive
            ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
            : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
        }`}
      >
        <span className={deafActive ? 'deaf-jump-emoji inline-block' : 'inline-block'} aria-hidden="true">
          🦻
        </span>
      </button>

      {/* Blind Mode Icon (speaks voice readout for all AQI levels including Good & Satisfactory) */}
      <button
        type="button"
        onClick={handleBlindClick}
        aria-pressed={blindActive}
        aria-label={t('blindModeLabel')}
        title={`${t('blindModeLabel')} — Hear voice readout for all AQI levels`}
        className={`w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xl cursor-pointer transition-transform active:scale-95 ${
          blindActive
            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
            : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
        }`}
      >
        <span aria-hidden="true">🧑‍🦯</span>
      </button>

      {/* Non-Speaking / Dumb Mode Icon (opens Communication Mode phrase board) */}
      <button
        type="button"
        onClick={handleNonSpeakingClick}
        aria-label={t('nonSpeakingModeLabel')}
        title={`${t('nonSpeakingModeLabel')} — Open Communication Mode`}
        className="w-12 h-12 rounded-full border-2 border-white bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-lg flex items-center justify-center text-xl cursor-pointer transition-transform active:scale-95"
      >
        <span aria-hidden="true">🤐</span>
      </button>
    </div>
  );
};
