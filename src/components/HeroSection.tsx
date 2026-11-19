import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowDown,
  Sliders,
  RefreshCw,
  Radio,
  Search,
  Globe,
  MapPin,
  Sparkles,
  ChevronRight,
  Layers,
  Compass
} from 'lucide-react';
import { CityData, CITIES, INDIAN_STATES_HIERARCHY } from '../data/cities';
import { useLanguage } from '../context/LanguageContext';
import { pm25ToAqi } from '../utils/aqi';
import { AqiPictogram } from './AqiPictogram';

export interface LiveTelemetryMeta {
  isLive: boolean;
  pm25: number;
  aqi: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  source: string;
  timestamp: string;
}

interface HeroSectionProps {
  selectedCity: CityData;
  onSelectCity: (city: CityData) => void;
  isDemoSimulation: boolean;
  onToggleDemoSimulation: () => void;
  onRefreshCams: () => void;
  isRefreshing: boolean;
  onScrollToForecast: () => void;
  onScrollToSimulator: () => void;
  liveData?: LiveTelemetryMeta | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedCity,
  onSelectCity,
  isDemoSimulation,
  onToggleDemoSimulation,
  onRefreshCams,
  isRefreshing,
  onScrollToForecast,
  onScrollToSimulator,
  liveData
}) => {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<string>(selectedCity.country);
  
  // Track selected Indian state when India is active
  const initialIndianState = useMemo(() => {
    const match = INDIAN_STATES_HIERARCHY.find(s => s.state === selectedCity.state);
    return match ? match.state : INDIAN_STATES_HIERARCHY[0].state;
  }, [selectedCity.state]);

  const [selectedIndianState, setSelectedIndianState] = useState<string>(initialIndianState);
  const [typeSearch, setTypeSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Synchronize country and Indian state when selectedCity prop updates (e.g. from map or header)
  useEffect(() => {
    setSelectedCountry(selectedCity.country);
    if (selectedCity.country === 'India' && selectedCity.state) {
      setSelectedIndianState(selectedCity.state);
    }
  }, [selectedCity.id, selectedCity.country, selectedCity.state]);

  // Extract unique countries with India prioritized at the top
  const countries = useMemo(() => {
    const list = Array.from(new Set(CITIES.map(c => c.country)));
    return ['India', ...list.filter(c => c !== 'India')];
  }, []);

  // Indian state hierarchy object
  const currentIndianStateObj = useMemo(() => {
    return (
      INDIAN_STATES_HIERARCHY.find(s => s.state === selectedIndianState) ||
      INDIAN_STATES_HIERARCHY[0]
    );
  }, [selectedIndianState]);

  // Cities/districts in active state or country
  const stateDistricts = useMemo(() => {
    return CITIES.filter(c => c.country === 'India' && c.state === selectedIndianState);
  }, [selectedIndianState]);

  const nonIndiaCities = useMemo(() => {
    return CITIES.filter(c => c.country === selectedCountry);
  }, [selectedCountry]);

  // Autocomplete search results
  const searchResults = useMemo(() => {
    if (!typeSearch.trim()) return [];
    const q = typeSearch.toLowerCase();
    return CITIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        c.stationName.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [typeSearch]);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    if (country === 'India') {
      const firstCity = stateDistricts[0] || CITIES.find(c => c.country === 'India');
      if (firstCity) onSelectCity(firstCity);
    } else {
      const firstCity = CITIES.find(c => c.country === country);
      if (firstCity) onSelectCity(firstCity);
    }
  };

  const handleIndianStateChange = (stateName: string) => {
    setSelectedIndianState(stateName);
    const citiesInState = CITIES.filter(c => c.country === 'India' && c.state === stateName);
    if (citiesInState.length > 0) {
      onSelectCity(citiesInState[0]);
    }
  };

  const handleQuickFind = () => {
    if (searchResults.length > 0) {
      const target = searchResults[0];
      setSelectedCountry(target.country);
      if (target.country === 'India') {
        setSelectedIndianState(target.state);
      }
      onSelectCity(target);
      setTypeSearch('');
      setShowSearchResults(false);
    }
  };

  const scrollToWorldMap = () => {
    const el = document.getElementById('global-world-map-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const aqiInfo = pm25ToAqi(selectedCity.basePm25);

  return (
    <section className="pt-6 pb-6 w-full max-w-[1280px] mx-auto px-3 sm:px-6">
      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Headline and Hero Proposition */}
        <div
          style={{ backgroundColor: '#e7dada' }}
          className="lg:col-span-7 flex flex-col justify-center rounded-3xl p-5 sm:p-8 border border-[#14202e]/10 shadow-xs"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#14202e] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#14202e]/10 shadow-2xs">
              {t('heroBadge')}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse" />
              <span>Live Search Grounding Active</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0c1d2d] tracking-tight leading-[1.15] mb-4 font-sans">
            {t('heroTitle')}
          </h1>

          <p className="text-sm sm:text-[17px] text-[#44474c] leading-relaxed mb-6 max-w-2xl font-normal">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onScrollToForecast}
              className="px-6 py-3 rounded-xl bg-[#00b050] hover:bg-[#009643] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-700/25 transition-all flex items-center gap-2 hover:translate-y-[-1px] active:scale-95 cursor-pointer ring-2 ring-emerald-400/40"
            >
              <span>{t('viewAirClock')}</span>
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToWorldMap}
              className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#14202e] font-bold text-xs sm:text-sm border border-[#14202e]/20 shadow-xs transition-all flex items-center gap-2 hover:translate-y-[-1px] active:scale-95 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#1f6feb]" />
              <span>{t('exploreWorldMapBtn')}</span>
            </button>
            <button
              onClick={onScrollToSimulator}
              className="px-4 py-3 rounded-xl bg-white/90 hover:bg-white text-[#14202e] font-bold text-xs sm:text-sm border border-[#14202e]/20 shadow-xs transition-all flex items-center gap-2 hover:translate-y-[-1px] active:scale-95 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-[#3f627a]" />
              <span>{t('runSimulation')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Global City, State & District Selector Card */}
        <div className="lg:col-span-5">
          <div
            className="glass-panel rounded-3xl p-5 sm:p-6 border border-[#14202e]/15 shadow-sm bg-white/95 relative"
            data-a11y-summary={t('a11yMainAqiCardSummary', {
              city: selectedCity.name,
              aqi: liveData?.isLive ? liveData.aqi : aqiInfo.aqi,
              category: aqiInfo.category,
              pm25: liveData?.isLive ? liveData.pm25 : selectedCity.basePm25
            })}
          >
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#14202e]/10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1f6feb]" />
                <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#0c1d2d]">
                  Global City, State &amp; District Selector
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#4d5d70] bg-[#eef4ff] px-2 py-0.5 rounded-full border border-[#14202e]/10 font-mono">
                {CITIES.length} CAAQMS Hubs
              </span>
            </div>

            <div className="space-y-3">
              {/* Country Picker */}
              <div>
                <label className="block text-[11px] font-bold text-[#44474c] mb-1">
                  {t('country')}
                </label>
                <select
                  value={selectedCountry}
                  onChange={e => handleCountryChange(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-2.5 bg-white border border-[#14202e]/15 rounded-xl text-[#0c1d2d] focus:ring-2 focus:ring-[#1f6feb] focus:outline-none cursor-pointer"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country === 'India' ? '🇮🇳 India (All 28 States & 8 UTs)' : country}
                    </option>
                  ))}
                </select>
              </div>

              {/* IF INDIA IS SELECTED: Dual Hierarchy: State/UT -> District/City */}
              {selectedCountry === 'India' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#44474c] mb-1">
                      Indian State / UT ({INDIAN_STATES_HIERARCHY.length})
                    </label>
                    <select
                      value={selectedIndianState}
                      onChange={e => handleIndianStateChange(e.target.value)}
                      className="w-full text-xs font-semibold py-2 px-2.5 bg-white border border-[#14202e]/15 rounded-xl text-[#0c1d2d] focus:ring-2 focus:ring-[#1f6feb] focus:outline-none cursor-pointer"
                    >
                      {INDIAN_STATES_HIERARCHY.map(s => (
                        <option key={s.state} value={s.state}>
                          {s.state} ({s.zone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#44474c] mb-1">
                      District / City Station
                    </label>
                    <select
                      value={selectedCity.id}
                      onChange={e => {
                        const found = CITIES.find(c => c.id === e.target.value);
                        if (found) {
                          onSelectCity(found);
                        }
                      }}
                      className="w-full text-xs font-semibold py-2 px-2.5 bg-white border border-[#14202e]/15 rounded-xl text-[#0c1d2d] focus:ring-2 focus:ring-[#1f6feb] focus:outline-none cursor-pointer"
                    >
                      {stateDistricts.map(station => (
                        <option key={station.id} value={station.id}>
                          {station.name} {station.district ? `(${station.district})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Non-India Country: Standard City Selector */
                <div>
                  <label className="block text-[11px] font-bold text-[#44474c] mb-1">
                    City &amp; Metropolitan Area
                  </label>
                  <select
                    value={selectedCity.id}
                    onChange={e => {
                      const found = CITIES.find(c => c.id === e.target.value);
                      if (found) {
                        setSelectedCountry(found.country);
                        onSelectCity(found);
                      }
                    }}
                    className="w-full text-xs font-semibold py-2 px-2.5 bg-white border border-[#14202e]/15 rounded-xl text-[#0c1d2d] focus:ring-2 focus:ring-[#1f6feb] focus:outline-none cursor-pointer"
                  >
                    {nonIndiaCities.map(station => (
                      <option key={station.id} value={station.id}>
                        {station.flag} {station.name} ({station.state})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Type Search with Autocomplete Dropdown */}
              <div className="relative pt-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-[#75777c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search city, district, or station..."
                      value={typeSearch}
                      onChange={e => {
                        setTypeSearch(e.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      onKeyDown={e => e.key === 'Enter' && handleQuickFind()}
                      className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-[#14202e]/15 rounded-xl text-[#0c1d2d] placeholder:text-[#75777c] focus:outline-none focus:ring-2 focus:ring-[#1f6feb]"
                    />
                  </div>
                  <button
                    onClick={handleQuickFind}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-[#14202e] text-white hover:bg-[#000713] transition-colors active:scale-95 cursor-pointer shrink-0"
                  >
                    Find
                  </button>
                  <button
                    onClick={onRefreshCams}
                    disabled={isRefreshing}
                    className="px-2.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Radio className={`w-3 h-3 text-[#00b050] ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? t('refreshing') : t('refreshData')}</span>
                  </button>
                </div>

                {/* Instant Autocomplete Suggestions */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#14202e]/15 rounded-2xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                    <div className="p-1.5 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100 flex items-center justify-between">
                      <span>Matching Locations ({searchResults.length})</span>
                      <button
                        onClick={() => setShowSearchResults(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {searchResults.map(city => (
                      <button
                        key={city.id}
                        onClick={() => {
                          setSelectedCountry(city.country);
                          if (city.country === 'India') {
                            setSelectedIndianState(city.state);
                          }
                          onSelectCity(city);
                          setTypeSearch('');
                          setShowSearchResults(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-b-0 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{city.flag}</span>
                          <div className="truncate">
                            <div className="font-semibold text-[#0c1d2d] truncate">{city.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {city.district ? `${city.district}, ` : ''}{city.state}, {city.country}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          AQI {pm25ToAqi(city.basePm25).aqi}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Location Telemetry HUD Pill */}
              <div className="mt-2 pt-2.5 border-t border-[#14202e]/8 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[#4d5d70]">
                  <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                    <span>{selectedCity.flag}</span>
                    <span className="font-bold text-[#0c1d2d]">{selectedCity.name},</span>
                    <span className="truncate">{selectedCity.state}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-white shadow-2xs font-mono"
                      style={{ backgroundColor: aqiInfo.color }}
                    >
                      AQI {liveData?.isLive ? liveData.aqi : aqiInfo.aqi}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {selectedCity.lat.toFixed(2)}°, {selectedCity.lng.toFixed(2)}°
                    </span>
                  </div>
                </div>

                {/* Animated AQI Pictogram */}
                <AqiPictogram
                  aqi={liveData?.isLive ? liveData.aqi : aqiInfo.aqi}
                  cityKey={selectedCity.id}
                  className="pt-1"
                />

                {/* Live World Data Sync Bar */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 live-pulse shrink-0" />
                    <span className="text-slate-700 font-medium">
                      {liveData?.isLive ? (
                        <>
                          <strong className="text-emerald-700 font-bold">LIVE TELEMETRY:</strong> {liveData.pm25} µg/m³ PM2.5 · {liveData.temp}°C · {liveData.windSpeed} km/h
                        </>
                      ) : (
                        'Copernicus CAMS & CAAQMS sensor telemetry synchronized'
                      )}
                    </span>
                  </div>

                  <button
                    onClick={onRefreshCams}
                    disabled={isRefreshing}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all text-xs"
                    title="Fetch live world air quality from Copernicus and ground sensor mesh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#1f6feb] ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
