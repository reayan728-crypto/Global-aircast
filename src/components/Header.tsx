import React, { useState, useEffect } from 'react';
import {
  Wind,
  Search,
  Radio,
  Sliders,
  Cpu,
  Activity,
  FileCode,
  Mic,
  Gamepad2,
  MapPin,
  Menu,
  X,
  Globe,
  ChevronDown,
  Layers,
  HelpCircle,
  MessageSquare,
  Accessibility
} from 'lucide-react';
import { CityData, CITIES } from '../data/cities';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorModal } from './modals/LanguageSelectorModal';
import { LANGUAGES, LanguageCode } from '../utils/i18n';
import { PWAInstallTopButton } from './PWAInstallTopButton';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSelectCity: (city: CityData) => void;
  selectedCity: CityData;
  onOpenApiModal: () => void;
  onOpenVoiceAssistant: () => void;
  onStartGame: () => void;
  currentPage?: 1 | 2;
  onPageChange?: (page: 1 | 2) => void;
  onOpenHowItWorks?: () => void;
  aqi?: number;
  category?: string;
  pm25?: number;
  bestHour?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onSelectCity,
  selectedCity,
  onOpenApiModal,
  onOpenVoiceAssistant,
  onStartGame,
  currentPage = 1,
  onPageChange,
  onOpenHowItWorks,
  aqi = 50,
  category = 'Good',
  pm25 = 15,
  bestHour = '11:00'
}) => {
  const { t, currentLanguage, setLanguage, selectedLanguageOption } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [deafActive, setDeafActive] = useState(false);
  const [blindActive, setBlindActive] = useState(false);

  // Sync jumping emoji animation on <html> when Deaf mode is active
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
      city: selectedCity.name,
      aqi,
      category,
      pm25
    })} ${t('a11ySummaryTemplate', {
      city: selectedCity.name,
      aqi,
      category,
      bestHour
    })} ${t(adviceKey)}`;
    window.AirCastA11y?.speak(summary, true);
  }, [blindActive, selectedCity.name, aqi, category, pm25, bestHour, t]);

  const handleDeafToggle = () => {
    const next = !deafActive;
    setDeafActive(next);
    window.AirCastA11y?.setOption?.('deaf', next);
    window.AirCastA11y?.setOption?.('sign', next);
    if (next && window.AirCastAnim) {
      const level = window.AirCastAnim.levelOf(aqi);
      window.AirCastAnim.popup(level, `${selectedCity.name}: AQI ${aqi} (${category})`);
    }
  };

  const handleDumbClick = () => {
    window.AirCastComm?.open();
  };

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    window.AirCastAssistant?.setLanguage?.(code);
  };

  const handleBlindToggle = () => {
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
        city: selectedCity.name,
        aqi,
        category,
        pm25
      })} ${t(adviceKey)}`;
      window.AirCastA11y?.speak(msg, true);
    }
  };

  const filteredCities = searchQuery.trim()
    ? CITIES.filter(
        c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.district && c.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
          c.regionTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.stationName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelect = (city: CityData) => {
    onSelectCity(city);
    setSearchQuery('');
    setShowSearchResults(false);
    setIsMobileMenuOpen(false);
  };

  const scrollTo = (id: string, tabName: string) => {
    onTabChange(tabName);
    setIsMobileMenuOpen(false);
    if (tabName === 'API & Research') {
      onOpenApiModal();
      return;
    }
    // Switch to page 1 for air clock or world map, or page 2 for simulator/shap/maps
    if ((id === 'air-clock-section' || id === 'global-world-map-section') && onPageChange && currentPage !== 1) {
      onPageChange(1);
    } else if ((id === 'what-if-section' || id === 'maps-grounding-section') && onPageChange && currentPage !== 2) {
      onPageChange(2);
    }
    setTimeout(() => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-[#14202e]/10 transition-colors shadow-xs">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Brand Zone */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <AppLogo size={36} animated={false} className="shadow-xs cursor-pointer hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-[16px] sm:text-[20px] tracking-tight text-[#0c1d2d] font-sans">
                  AirCast
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-[#4d5d70] border-l border-slate-300 pl-2">
                  Global Air Quality Intelligence
                </span>
                <span className="hidden xl:inline-block text-[9px] font-bold uppercase tracking-wider text-[#4d5d70] border border-[#14202e]/15 px-1.5 py-0.5 rounded ml-1">
                  24h AI
                </span>
                {/* Install App Option near AirCast */}
                <PWAInstallTopButton className="ml-0.5 sm:ml-1" />
              </div>
            </div>
          </div>

          {/* Deaf, Dumb & Blind Emoji Mode Bar (Top Center, replacing Page 1 / Page 2) */}
          <div
            className="hidden md:inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0"
            role="group"
            aria-label="Deaf, Dumb, and Blind Accessibility Modes"
          >
            <button
              type="button"
              onClick={handleDeafToggle}
              aria-pressed={deafActive}
              aria-label={t('deafModeLabel')}
              title={`${t('deafModeLabel')} — Jumping emojis & sign panel`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                deafActive
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-300'
                  : 'bg-white text-[#0c1d2d] hover:bg-amber-50'
              }`}
            >
              <span className={`text-base leading-none ${deafActive ? 'deaf-jump-emoji inline-block' : 'inline-block'}`} aria-hidden="true">
                🦻
              </span>
              <span>{t('deafModeLabel')}</span>
            </button>

            <button
              type="button"
              onClick={handleDumbClick}
              aria-label={t('nonSpeakingModeLabel')}
              title={`${t('nonSpeakingModeLabel')} — Ask questions & get instant answers`}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-white text-[#0c1d2d] hover:bg-blue-50 active:scale-95"
            >
              <span className="text-base leading-none" aria-hidden="true">🤐</span>
              <span>{t('nonSpeakingModeLabel')}</span>
            </button>

            <button
              type="button"
              onClick={handleBlindToggle}
              aria-pressed={blindActive}
              aria-label={t('blindModeLabel')}
              title={`${t('blindModeLabel')} — Hear live voice readout for all AQI levels`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                blindActive
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                  : 'bg-white text-[#0c1d2d] hover:bg-emerald-50'
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">🧑‍🦯</span>
              <span>{t('blindModeLabel')}</span>
            </button>
          </div>

          {/* Desktop Search bar */}
          <div className="hidden 2xl:flex items-center gap-2 flex-1 max-w-xs relative">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#75777c] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/80 border border-[#14202e]/15 rounded-lg text-[#0c1d2d] placeholder:text-[#75777c] focus:outline-none focus:ring-2 focus:ring-[#1f6feb] transition-all"
              />

              {showSearchResults && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#14202e]/15 rounded-xl shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                  <div className="p-1.5 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
                    {filteredCities.length} Cities, States &amp; Districts Found
                  </div>
                  {filteredCities.map(city => (
                    <button
                      key={city.id}
                      onClick={() => handleSelect(city)}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#eef4ff] border-b border-[#14202e]/5 last:border-b-0 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{city.flag}</span>
                        <div>
                          <div className="font-semibold text-[#0c1d2d]">{city.name}</div>
                          <div className="text-[10px] text-[#4d5d70]">
                            {city.district ? `${city.district}, ` : ''}{city.state}, {city.country}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {city.regionTag}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Right Side Navigation + Language Dropdown */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => window.AirCastComm?.open()}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer shadow-xs"
              title={t('communicationMode')}
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>{t('communicationMode')}</span>
            </button>

            {onOpenHowItWorks && (
              <button
                onClick={onOpenHowItWorks}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 active:scale-95 cursor-pointer shadow-xs"
                title="Plain Language Guide: How AirCast Works"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>How It Works</span>
              </button>
            )}

            {/* Language Dropdown (Desktop Right) */}
            <div className="relative">
              <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200/90 pl-2 pr-1 py-1 gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={currentLanguage}
                  onChange={e => handleLanguageChange(e.target.value as LanguageCode)}
                  aria-label="Select World Language"
                  className="bg-transparent text-xs font-bold text-[#0c1d2d] focus:outline-none cursor-pointer pr-1"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer text-[10px]"
                  title="Search All Languages in World Modal"
                >
                  <Search className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Header Actions (< lg) */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            {/* Quick Language Dropdown on mobile header */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={e => handleLanguageChange(e.target.value as LanguageCode)}
                aria-label="Select Language"
                className="bg-slate-100 border border-slate-200 text-xs font-bold text-[#0c1d2d] py-1 px-1.5 rounded-lg cursor-pointer focus:outline-none max-w-[80px]"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.AirCastComm?.open()}
              className="p-2 rounded-lg text-xs font-bold bg-blue-600 text-white cursor-pointer"
              aria-label={t('communicationMode')}
              title={t('communicationMode')}
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Always-Visible Mobile Top Bar: Deaf, Dumb & Blind Emoji Modes (Phone < md) */}
        <div
          className="md:hidden border-t border-[#14202e]/10 bg-slate-50/95 px-3 py-1.5"
          role="group"
          aria-label="Deaf, Dumb, and Blind Accessibility Modes"
        >
          <div className="grid grid-cols-3 gap-1.5 max-w-[1280px] mx-auto">
            <button
              type="button"
              onClick={handleDeafToggle}
              aria-pressed={deafActive}
              aria-label={t('deafModeLabel')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                deafActive
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs ring-2 ring-amber-300'
                  : 'bg-white text-[#0c1d2d] border-slate-200 hover:bg-amber-50'
              }`}
            >
              <span className={`text-base leading-none ${deafActive ? 'deaf-jump-emoji inline-block' : 'inline-block'}`} aria-hidden="true">
                🦻
              </span>
              <span className="truncate">{t('deafModeLabel')}</span>
            </button>

            <button
              type="button"
              onClick={handleDumbClick}
              aria-label={t('nonSpeakingModeLabel')}
              className="py-1.5 px-2 rounded-lg text-xs font-bold border border-slate-200 bg-white text-[#0c1d2d] hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span className="text-base leading-none" aria-hidden="true">🤐</span>
              <span className="truncate">{t('nonSpeakingModeLabel')}</span>
            </button>

            <button
              type="button"
              onClick={handleBlindToggle}
              aria-pressed={blindActive}
              aria-label={t('blindModeLabel')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                blindActive
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300'
                  : 'bg-white text-[#0c1d2d] border-slate-200 hover:bg-emerald-50'
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">🧑‍🦯</span>
              <span className="truncate">{t('blindModeLabel')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer (Inside the Three Dash Buttons) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#14202e]/10 bg-white/98 backdrop-blur-lg px-4 py-4 space-y-4 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
            {/* Language Selector Dropdown right inside the three-dash menu */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0c1d2d] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#1f6feb]" />
                  <span>Language Dropdown (All World Languages)</span>
                </span>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLanguageModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-[#1f6feb] underline cursor-pointer"
                >
                  Search list
                </button>
              </div>

              {/* Native Dropdown Selector for all languages in the world */}
              <select
                value={currentLanguage}
                onChange={e => handleLanguageChange(e.target.value as LanguageCode)}
                className="w-full py-2.5 px-3 text-xs font-bold bg-white border border-[#14202e]/15 rounded-xl text-[#0c1d2d] focus:outline-none focus:ring-2 focus:ring-[#1f6feb] cursor-pointer"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName} - {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Deaf / Dumb / Blind Emoji Bar */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleDeafToggle();
                  setIsMobileMenuOpen(false);
                }}
                aria-pressed={deafActive}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer transition-all ${
                  deafActive
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-white text-[#0c1d2d] border-slate-200'
                }`}
              >
                <span className={`text-xl ${deafActive ? 'deaf-jump-emoji inline-block' : ''}`} aria-hidden="true">🦻</span>
                <span>{t('deafModeLabel')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleDumbClick();
                }}
                className="p-2.5 rounded-xl border bg-white text-[#0c1d2d] border-slate-200 flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer transition-all hover:bg-blue-50"
              >
                <span className="text-xl" aria-hidden="true">🤐</span>
                <span>{t('nonSpeakingModeLabel')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleBlindToggle();
                  setIsMobileMenuOpen(false);
                }}
                aria-pressed={blindActive}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer transition-all ${
                  blindActive
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-[#0c1d2d] border-slate-200'
                }`}
              >
                <span className="text-xl" aria-hidden="true">🧑‍🦯</span>
                <span>{t('blindModeLabel')}</span>
              </button>
            </div>

            {/* Mobile Search input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#75777c] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#14202e]/15 rounded-xl text-[#0c1d2d] placeholder:text-[#75777c] focus:outline-none focus:ring-2 focus:ring-[#1f6feb]"
              />
              {showSearchResults && filteredCities.length > 0 && (
                <div className="mt-1 bg-white border border-[#14202e]/15 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                  {filteredCities.map(city => (
                    <button
                      key={city.id}
                      onClick={() => handleSelect(city)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#eef4ff] border-b border-[#14202e]/5 last:border-b-0 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{city.flag}</span>
                        <div>
                          <div className="font-semibold text-[#0c1d2d]">{city.name}</div>
                          <div className="text-[10px] text-[#4d5d70]">
                            {city.district ? `${city.district}, ` : ''}{city.state}, {city.country}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {city.regionTag}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Active Hub status */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-[#14202e]/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{selectedCity.flag}</span>
                <span className="w-2 h-2 rounded-full bg-[#00b050] live-pulse" />
                <span className="font-bold text-[#0c1d2d]">{selectedCity.name}</span>
                <span className="text-[10px] text-slate-500">
                  ({selectedCity.district || selectedCity.state})
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#4d5d70]">
                {selectedCity.regionTag}
              </span>
            </div>

            {/* Quick Action button: Communication Mode */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.AirCastComm?.open();
              }}
              className="w-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>{t('communicationMode')}</span>
            </button>

            {onOpenHowItWorks && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenHowItWorks();
                }}
                className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>How AirCast Works (Plain Language Guide)</span>
              </button>
            )}

            {/* In-App Mobile Install Option */}
            <div className="pt-1">
              <PWAInstallTopButton className="w-full justify-center py-2.5 text-xs rounded-xl" />
            </div>
          </div>
        )}
      </header>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </>
  );
};
