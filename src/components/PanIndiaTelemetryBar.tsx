import React, { useState, useMemo } from 'react';
import { CityData, CITIES, INDIAN_STATES_HIERARCHY, StateHierarchy, DistrictStation, getDistrictAsCityData } from '../data/cities';
import { useLanguage } from '../context/LanguageContext';
import { Globe2, Search, MapPin, ChevronRight, Layers, Building2, Wind, Activity } from 'lucide-react';
import { pm25ToAqi } from '../utils/aqi';

interface PanIndiaTelemetryBarProps {
  selectedCity: CityData;
  onSelectCity: (city: CityData) => void;
}

type ViewMode = 'india-hierarchy' | 'world-grid';
type ZoneFilter = 'All Zones' | 'South' | 'North' | 'West' | 'East' | 'Central' | 'North-East' | 'Union Territory';
type WorldRegion = 'All' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Middle East & Africa';

export const PanIndiaTelemetryBar: React.FC<PanIndiaTelemetryBarProps> = ({
  selectedCity,
  onSelectCity
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('india-hierarchy');
  const [selectedZone, setSelectedZone] = useState<ZoneFilter>('All Zones');
  
  // Find which state the current selected city belongs to (default to Tamil Nadu or current city's state)
  const initialSelectedState = useMemo(() => {
    const match = INDIAN_STATES_HIERARCHY.find(s => s.state === selectedCity.state);
    return match ? match.state : 'Tamil Nadu';
  }, [selectedCity.state]);

  const [activeStateName, setActiveStateName] = useState<string>(initialSelectedState);
  const [filterQuery, setFilterQuery] = useState('');
  const [worldRegion, setWorldRegion] = useState<WorldRegion>('All');

  // Filter Indian states based on zone
  const filteredStates = useMemo(() => {
    return INDIAN_STATES_HIERARCHY.filter(s => {
      if (selectedZone === 'All Zones') return true;
      return s.zone === selectedZone;
    });
  }, [selectedZone]);

  // Current active state object
  const activeState = useMemo(() => {
    return (
      INDIAN_STATES_HIERARCHY.find(s => s.state === activeStateName) ||
      INDIAN_STATES_HIERARCHY[0]
    );
  }, [activeStateName]);

  // Filter districts within active state or via global search
  const displayedDistricts = useMemo(() => {
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      // Search across all states & districts
      const matches: DistrictStation[] = [];
      INDIAN_STATES_HIERARCHY.forEach(s => {
        s.districts.forEach(d => {
          if (
            d.name.toLowerCase().includes(q) ||
            d.district.toLowerCase().includes(q) ||
            d.state.toLowerCase().includes(q) ||
            d.stationName.toLowerCase().includes(q) ||
            d.regionTag.toLowerCase().includes(q)
          ) {
            matches.push(d);
          }
        });
      });
      return matches;
    }
    return activeState.districts;
  }, [activeState, filterQuery]);

  // World filtered cities
  const filteredWorldCities = useMemo(() => {
    return CITIES.filter(city => {
      if (worldRegion === 'Asia' && city.continent !== 'Asia') return false;
      if (worldRegion === 'Europe' && city.continent !== 'Europe') return false;
      if (worldRegion === 'North America' && city.continent !== 'North America') return false;
      if (worldRegion === 'South America' && city.continent !== 'South America') return false;
      if (worldRegion === 'Middle East & Africa' && city.continent !== 'Middle East' && city.continent !== 'Africa') return false;

      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        return (
          city.name.toLowerCase().includes(q) ||
          city.state.toLowerCase().includes(q) ||
          city.country.toLowerCase().includes(q) ||
          (city.district && city.district.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [worldRegion, filterQuery]);

  const handleSelectDistrict = (station: DistrictStation) => {
    // Check if there is an existing matching city in CITIES
    const foundInCities = CITIES.find(c => c.id === station.id || (c.name.toLowerCase() === station.name.toLowerCase() && c.state === station.state));
    if (foundInCities) {
      onSelectCity({ ...foundInCities, district: station.district });
    } else {
      onSelectCity(getDistrictAsCityData(station));
    }
  };

  const zones: ZoneFilter[] = ['All Zones', 'South', 'North', 'West', 'East', 'Central', 'North-East', 'Union Territory'];

  return (
    <section className="max-w-[1280px] mx-auto px-3 sm:px-6 mb-10">
      {/* Header zone with Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00b050] live-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4d5d70]">
              Pan-India State &amp; District Telemetry Network
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#0c1d2d] tracking-tight">
            Hierarchical District CAAQMS Air Quality Mesh
          </h3>
        </div>

        {/* View Mode Switcher + Global Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-white/80 rounded-xl border border-[#14202e]/15 shadow-xs">
            <button
              onClick={() => {
                setViewMode('india-hierarchy');
                setFilterQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'india-hierarchy'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0c1d2d]'
              }`}
            >
              <span>🇮🇳 Indian States &amp; Districts</span>
            </button>
            <button
              onClick={() => {
                setViewMode('world-grid');
                setFilterQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'world-grid'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0c1d2d]'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Global World Hubs</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={viewMode === 'india-hierarchy' ? 'Search states, districts, stations...' : 'Filter world cities & states...'}
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/90 border border-[#14202e]/15 rounded-xl text-[#0c1d2d] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1f6feb]"
            />
          </div>
        </div>
      </div>

      {viewMode === 'india-hierarchy' ? (
        <div className="space-y-4">
          {/* Breadcrumb Indicator */}
          <div className="glass-panel rounded-xl px-4 py-2.5 border border-[#14202e]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#4d5d70]">
              <span className="font-extrabold text-[#0c1d2d]">🇮🇳 India</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#0c1d2d] font-bold">{activeState.state}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-emerald-700 font-bold">
                {selectedCity.district || selectedCity.name} District
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1f6feb] font-mono font-medium">
                {selectedCity.stationName}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Zone: <strong className="text-slate-800">{activeState.zone} India</strong> • Capital: {activeState.capital}
            </span>
          </div>

          {/* Zone Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5" /> Zone:
            </span>
            {zones.map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedZone === z
                    ? 'bg-[#14202e] text-white shadow-xs'
                    : 'bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* States Carousel / Badges Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {filteredStates.map(st => {
              const isActive = st.state === activeState.state;
              return (
                <button
                  key={st.state}
                  onClick={() => {
                    setActiveStateName(st.state);
                    setFilterQuery('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                    isActive
                      ? 'bg-white text-[#0c1d2d] border-[#14202e] ring-2 ring-[#14202e] shadow-sm'
                      : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/90'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-[#1f6feb]' : 'text-slate-400'}`} />
                  <span>{st.state}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#14202e] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {st.districts.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Districts Grid for the Selected State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayedDistricts.map(dst => {
              const aqiInfo = pm25ToAqi(dst.basePm25);
              const isSelected = selectedCity.name === dst.name || selectedCity.district === dst.district;

              return (
                <div
                  key={dst.id}
                  onClick={() => handleSelectDistrict(dst)}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#14202e] shadow-md ring-2 ring-[#14202e]'
                      : 'glass-panel hover:bg-white hover:border-[#14202e]/25 shadow-xs'
                  }`}
                >
                  {/* Top: District Name + State Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <h4 className="font-extrabold text-sm text-[#0c1d2d] truncate">
                          {dst.name}
                        </h4>
                      </div>
                      <span
                        className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: aqiInfo.badgeBg,
                          color: aqiInfo.textColor
                        }}
                      >
                        AQI {aqiInfo.aqi}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 mb-2 truncate">
                      District: <strong className="text-slate-700">{dst.district}</strong> • {dst.state}
                    </div>

                    <div className="text-[11px] text-slate-600 line-clamp-1 mb-3 font-mono bg-slate-50 p-1 rounded border border-slate-100">
                      {dst.stationName}
                    </div>
                  </div>

                  {/* Telemetry Metrics Footer */}
                  <div className="pt-2 border-t border-[#14202e]/10 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        PM2.5: <strong className="text-[#0c1d2d] font-bold">{dst.basePm25}</strong>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>{dst.baseTemp}°C</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDistrict(dst);
                      }}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-[#14202e] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Active Hub' : 'Inspect'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Global World Grid View */
        <div className="space-y-3">
          {/* World Region Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setWorldRegion('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                worldRegion === 'All'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200/60'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>All Global Hubs ({CITIES.length})</span>
            </button>
            <button
              onClick={() => setWorldRegion('Asia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                worldRegion === 'Asia'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200/60'
              }`}
            >
              <span>🇮🇳 🇯🇵 🇨🇳 Asia &amp; India</span>
            </button>
            <button
              onClick={() => setWorldRegion('Europe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                worldRegion === 'Europe'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200/60'
              }`}
            >
              <span>🇬🇧 🇫🇷 🇩🇪 Europe</span>
            </button>
            <button
              onClick={() => setWorldRegion('North America')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                worldRegion === 'North America'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200/60'
              }`}
            >
              <span>🇺🇸 🇨🇦 🇲🇽 North America</span>
            </button>
            <button
              onClick={() => setWorldRegion('South America')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                worldRegion === 'South America'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200/60'
              }`}
            >
              <span>🇧🇷 🇦🇷 🇨🇱 South America</span>
            </button>
            <button
              onClick={() => setWorldRegion('Middle East & Africa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                worldRegion === 'Middle East & Africa'
                  ? 'bg-[#14202e] text-white shadow-xs'
                  : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200/60'
              }`}
            >
              <span>🇦🇪 🇪🇬 🇿🇦 Middle East &amp; Africa</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredWorldCities.map(city => {
              const isSelected = selectedCity.id === city.id;
              const aqiData = pm25ToAqi(city.basePm25);
              return (
                <button
                  key={city.id}
                  onClick={() => onSelectCity(city)}
                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-[#14202e] text-white shadow-sm ring-2 ring-[#14202e] border-[#14202e]'
                      : 'bg-white/80 hover:bg-white text-[#0c1d2d] border-[#14202e]/10 shadow-xs'
                  }`}
                >
                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-base">{city.flag}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase"
                        style={{
                          backgroundColor: aqiData.badgeBg,
                          color: aqiData.textColor
                        }}
                      >
                        AQI {aqiData.aqi}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs truncate">
                      {city.name}
                    </div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-[#bbc7da]' : 'text-[#75777c]'}`}>
                      {city.state}, {city.country}
                    </div>
                  </div>

                  <div className={`text-[10px] font-mono border-t pt-1 flex items-center justify-between ${
                    isSelected ? 'border-white/10 text-[#bbc7da]' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span>PM2.5</span>
                    <strong className={isSelected ? 'text-white' : 'text-[#0c1d2d]'}>{city.basePm25}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
