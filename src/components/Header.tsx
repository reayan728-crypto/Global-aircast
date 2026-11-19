import React, { useState } from 'react';
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
  HelpCircle
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
  onOpenHowItWorks
}) => {
  const { t, currentLanguage, setLanguage, selectedLanguageOption } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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

          {/* Page 1 / Page 2 Quick Switcher (Desktop) */}
          {onPageChange && (
            <div className="hidden md:inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold shrink-0">
              <button
                onClick={() => onPageChange(1)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentPage === 1
                    ? 'bg-white text-[#0c1d2d] shadow-xs'
                    : 'text-slate-600 hover:text-[#0c1d2d]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Page 1: Telemetry &amp; Air Clock</span>
              </button>
              <button
                onClick={() => onPageChange(2)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentPage === 2
                    ? 'bg-white text-[#0c1d2d] shadow-xs'
                    : 'text-slate-600 hover:text-[#0c1d2d]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Page 2: Diagnostics &amp; SHAP</span>
              </button>
            </div>
          )}

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
              onClick={onOpenVoiceAssistant}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/25 active:scale-95 cursor-pointer shadow-xs"
              title="Open Live Voice Assistant (gemini-3.8-live)"
            >
              <Mic className="w-3.5 h-3.5 text-[#00b050] animate-pulse" />
              <span>{t('liveVoice')}</span>
            </button>

            <button
              onClick={onStartGame}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-[#14202e] hover:bg-[#1f2d3d] text-white active:scale-95 cursor-pointer shadow-xs"
              title="Play Clean Air Pilot: Atmospheric Drone Dispatcher"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[#bfe3ff]" />
              <span>{t('cleanAirGame')}</span>
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
                  onChange={e => setLanguage(e.target.value as LanguageCode)}
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
                onChange={e => setLanguage(e.target.value as LanguageCode)}
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
              onClick={onOpenVoiceAssistant}
              className="p-2 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 cursor-pointer"
              aria-label="Open Voice Assistant"
            >
              <Mic className="w-4 h-4 text-[#00b050]" />
            </button>

            {/* The Three Dash Buttons (Hamburger Menu) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Open Navigation Menu"
              className="p-2 rounded-lg bg-[#14202e] text-white hover:bg-[#1f2d3d] transition-colors cursor-pointer flex items-center justify-center"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                onChange={e => setLanguage(e.target.value as LanguageCode)}
                className="w-full py-2.5 px-3 text-xs font-bold bg-white border border-[#14202e]/15 rounded-xl text-[#0c1d2d] focus:outline-none focus:ring-2 focus:ring-[#1f6feb] cursor-pointer"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName} - {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Page 1 / Page 2 Switcher */}
            {onPageChange && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onPageChange(1);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left border flex flex-col gap-1 transition-all cursor-pointer ${
                    currentPage === 1
                      ? 'bg-[#14202e] text-white border-[#14202e] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Page 1</span>
                  </div>
                  <span className={`text-[11px] ${currentPage === 1 ? 'text-slate-300' : 'text-slate-500'}`}>
                    Telemetry &amp; Air Clock
                  </span>
                </button>

                <button
                  onClick={() => {
                    onPageChange(2);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl text-left border flex flex-col gap-1 transition-all cursor-pointer ${
                    currentPage === 2
                      ? 'bg-[#14202e] text-white border-[#14202e] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Page 2</span>
                  </div>
                  <span className={`text-[11px] ${currentPage === 2 ? 'text-slate-300' : 'text-slate-500'}`}>
                    Diagnostics &amp; SHAP
                  </span>
                </button>
              </div>
            )}

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

            {/* Quick Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenVoiceAssistant();
                }}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-[#00b050]" />
                <span>{t('liveVoice')}</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onStartGame();
                }}
                className="p-2.5 rounded-xl bg-[#14202e] hover:bg-[#1f2d3d] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 text-[#bfe3ff]" />
                <span>{t('cleanAirGame')}</span>
              </button>
            </div>

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
