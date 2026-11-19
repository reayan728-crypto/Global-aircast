import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  MapPin,
  Compass,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Wind,
  Activity,
  Sparkles,
  Crosshair,
  Flame,
  Search,
  Check,
  Eye,
  Satellite,
  Mountain,
  Car,
  Factory,
  AlertTriangle,
  Radio,
  TrendingUp,
  Clock,
  Play,
  Pause,
  X,
  ExternalLink,
  Zap,
  Shield,
  ShieldCheck,
  Thermometer,
  Filter,
  Maximize2,
  Minimize2,
  CloudRain,
  CloudLightning,
  AlertCircle,
  ChevronRight,
  EyeOff
} from 'lucide-react';
import { CityData, CITIES } from '../data/cities';
import { pm25ToAqi } from '../utils/aqi';
import { useLanguage } from '../context/LanguageContext';

interface GlobalWorldMapProps {
  selectedCity: CityData;
  onSelectCity: (city: CityData) => void;
}

// Argos Atlas Base Modes
export type ArgosBaseMode = 'Satellite' | 'DarkTactical' | 'Terrain' | 'NightRadiance';
export type MapRegion = 'World' | 'India' | 'Asia' | 'Europe' | 'Americas' | 'MiddleEastAfrica';
export type StationDotMode = 'none' | 'selectedCountry' | 'selectedState' | 'onlyActive' | 'all';

// Convert lat (-90 to 90) and lng (-180 to 180) to Equirectangular SVG coordinates (width: 1000, height: 500)
function projectCoords(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

// Convert SVG coords back to approximate lat/lng
function unprojectCoords(x: number, y: number): { lat: number; lng: number } {
  const lng = (x / 1000) * 360 - 180;
  const lat = 90 - (y / 500) * 180;
  return { lat, lng };
}

// --- ARGOS ATLAS DATA MODEL & LAYERS ---

export interface ArgosIndustrialPlant {
  id: string;
  name: string;
  category: 'Thermal Power' | 'Petrochemical Refinery' | 'Steel Smelter' | 'Cement Kiln';
  country: string;
  lat: number;
  lng: number;
  capacity: string;
  dailyPm25Tonnes: number;
  dailyCo2Tonnes: number;
  scrubberStatus: 'FGD Operational' | 'Partial Wet Scrubber' | 'Unscrubbed Bypass';
  plumeRadius: number;
}

export interface ArgosFireHotspot {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  frpMw: number; // Fire Radiative Power in MegaWatts
  satellite: 'VIIRS Suomi-NPP' | 'MODIS Terra' | 'Sentinel-3 SLSTR';
  confidence: number; // percentage
  smokeDispersionVector: string;
  hazardLevel: 'Extreme' | 'High' | 'Moderate';
}

export interface ArgosStormTrackPoint {
  hours: number;
  lat: number;
  lng: number;
  windKmh: number;
}

export interface ArgosStorm {
  id: string;
  name: string;
  classification: 'Severe Cyclonic Storm' | 'Super Typhoon' | 'Major Hurricane' | 'Deep Depression';
  basin: string;
  lat: number;
  lng: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  centralPressureHpa: number;
  category: string;
  heading: string;
  movementSpeedKmh: number;
  eyeDiameterKm: number;
  stormSurgeMeters: number;
  warningStatus: 'CRITICAL EVACUATION' | 'SEVERE STORM WARNING' | 'HIGH ALERT';
  impactZones: string;
  trackForecast: ArgosStormTrackPoint[];
}

// Critical Energy & Industrial Emitters
const ARGOS_PLANTS: ArgosIndustrialPlant[] = [
  {
    id: 'pl-vindhyachal',
    name: 'Vindhyachal Super Thermal Power Station',
    category: 'Thermal Power',
    country: 'India (Singrauli, MP)',
    lat: 24.10,
    lng: 82.67,
    capacity: '4,760 MW Coal-Fired',
    dailyPm25Tonnes: 46.2,
    dailyCo2Tonnes: 82000,
    scrubberStatus: 'Partial Wet Scrubber',
    plumeRadius: 38
  },
  {
    id: 'pl-mundra',
    name: 'Tata & Adani Mundra Ultra Mega Power Complex',
    category: 'Thermal Power',
    country: 'India (Kutch, Gujarat)',
    lat: 22.82,
    lng: 69.52,
    capacity: '8,620 MW Combined',
    dailyPm25Tonnes: 54.8,
    dailyCo2Tonnes: 110000,
    scrubberStatus: 'FGD Operational',
    plumeRadius: 42
  },
  {
    id: 'pl-jamnagar',
    name: 'Reliance Jamnagar Petrochemical Complex',
    category: 'Petrochemical Refinery',
    country: 'India (Gujarat)',
    lat: 22.35,
    lng: 69.87,
    capacity: '1,240,000 bpd (World Largest)',
    dailyPm25Tonnes: 28.4,
    dailyCo2Tonnes: 64000,
    scrubberStatus: 'FGD Operational',
    plumeRadius: 32
  },
  {
    id: 'pl-angul',
    name: 'Angul-Talcher Coal Basin & Smelter Belt',
    category: 'Steel Smelter',
    country: 'India (Odisha)',
    lat: 20.84,
    lng: 85.15,
    capacity: '3,000 MW + 12 MTPA Steel',
    dailyPm25Tonnes: 62.1,
    dailyCo2Tonnes: 94000,
    scrubberStatus: 'Unscrubbed Bypass',
    plumeRadius: 45
  },
  {
    id: 'pl-tangshan',
    name: 'Tangshan Heavy Industrial Smelting Cluster',
    category: 'Steel Smelter',
    country: 'China (Hebei)',
    lat: 39.63,
    lng: 118.18,
    capacity: '140 MTPA Steel',
    dailyPm25Tonnes: 115.0,
    dailyCo2Tonnes: 240000,
    scrubberStatus: 'Partial Wet Scrubber',
    plumeRadius: 65
  }
];

// Active Storms & Tropical Cyclones
const ARGOS_STORMS: ArgosStorm[] = [
  {
    id: 'storm-tej',
    name: 'Severe Cyclonic Storm TEJ',
    classification: 'Severe Cyclonic Storm',
    basin: 'North Indian Ocean (Arabian Sea)',
    lat: 16.8,
    lng: 61.2,
    windSpeedKmh: 155,
    windGustsKmh: 195,
    centralPressureHpa: 962,
    category: 'Category 3 Equivalent',
    heading: 'Northwest at 18 km/h',
    movementSpeedKmh: 18,
    eyeDiameterKm: 32,
    stormSurgeMeters: 3.8,
    warningStatus: 'CRITICAL EVACUATION',
    impactZones: 'Oman Coast, Yemen Socotra, Gujarat / Maharashtra Offshore Shipping',
    trackForecast: [
      { hours: 12, lat: 17.8, lng: 59.8, windKmh: 165 },
      { hours: 24, lat: 18.9, lng: 58.2, windKmh: 150 },
      { hours: 48, lat: 20.2, lng: 55.6, windKmh: 110 }
    ]
  },
  {
    id: 'storm-dep02b',
    name: 'Deep Depression 02B',
    classification: 'Deep Depression',
    basin: 'Bay of Bengal (Southwest Basin)',
    lat: 13.4,
    lng: 86.2,
    windSpeedKmh: 65,
    windGustsKmh: 85,
    centralPressureHpa: 998,
    category: 'Tropical Depression',
    heading: 'West-Northwest at 14 km/h',
    movementSpeedKmh: 14,
    eyeDiameterKm: 18,
    stormSurgeMeters: 1.5,
    warningStatus: 'HIGH ALERT',
    impactZones: 'North Tamil Nadu (Chennai-Ennore), South Andhra Pradesh, Coromandel Coast',
    trackForecast: [
      { hours: 12, lat: 13.9, lng: 84.4, windKmh: 75 },
      { hours: 24, lat: 14.5, lng: 82.3, windKmh: 85 },
      { hours: 48, lat: 15.2, lng: 80.5, windKmh: 70 }
    ]
  },
  {
    id: 'storm-malakas',
    name: 'Super Typhoon MALAKAS',
    classification: 'Super Typhoon',
    basin: 'Western Pacific (Philippine Sea)',
    lat: 21.5,
    lng: 131.0,
    windSpeedKmh: 215,
    windGustsKmh: 260,
    centralPressureHpa: 925,
    category: 'Category 4 Super Typhoon',
    heading: 'North-Northeast at 22 km/h',
    movementSpeedKmh: 22,
    eyeDiameterKm: 35,
    stormSurgeMeters: 5.2,
    warningStatus: 'SEVERE STORM WARNING',
    impactZones: 'Ryukyu Islands, East China Sea Maritime Belt, Southern Japan shipping',
    trackForecast: [
      { hours: 12, lat: 23.2, lng: 132.8, windKmh: 210 },
      { hours: 24, lat: 25.4, lng: 135.5, windKmh: 195 },
      { hours: 48, lat: 29.8, lng: 140.2, windKmh: 160 }
    ]
  },
  {
    id: 'storm-milton',
    name: 'Major Hurricane MILTON',
    classification: 'Major Hurricane',
    basin: 'Atlantic (Gulf of Mexico)',
    lat: 24.2,
    lng: -87.5,
    windSpeedKmh: 240,
    windGustsKmh: 285,
    centralPressureHpa: 915,
    category: 'Category 5 Major Hurricane',
    heading: 'East-Northeast at 26 km/h',
    movementSpeedKmh: 26,
    eyeDiameterKm: 28,
    stormSurgeMeters: 4.5,
    warningStatus: 'CRITICAL EVACUATION',
    impactZones: 'Florida West Coast, Tampa Bay, Yucatan Strait Shipping',
    trackForecast: [
      { hours: 12, lat: 25.6, lng: -85.1, windKmh: 230 },
      { hours: 24, lat: 27.2, lng: -82.8, windKmh: 215 },
      { hours: 48, lat: 29.1, lng: -77.5, windKmh: 155 }
    ]
  }
];

// NASA FIRMS Thermal Fire Hotspots
const ARGOS_FIRE_HOTSPOTS: ArgosFireHotspot[] = [
  {
    id: 'fire-punjab-stubble',
    name: 'Sangrur-Bathinda Stubble Fire Front',
    region: 'Malwa Plains, Punjab',
    country: 'India',
    lat: 30.25,
    lng: 75.35,
    frpMw: 348.5,
    satellite: 'VIIRS Suomi-NPP',
    confidence: 98,
    smokeDispersionVector: 'Southeast directly entering Delhi NCR troposphere',
    hazardLevel: 'Extreme'
  },
  {
    id: 'fire-haryana-stubble',
    name: 'Kaithal-Karnal Crop Residue Pyre',
    region: 'Karnal Basin, Haryana',
    country: 'India',
    lat: 29.80,
    lng: 76.40,
    frpMw: 212.0,
    satellite: 'MODIS Terra',
    confidence: 92,
    smokeDispersionVector: 'East-Southeast towards Panipat',
    hazardLevel: 'High'
  },
  {
    id: 'fire-sumatra-peat',
    name: 'Riau-Jambi Peatland Subsurface Fire',
    region: 'Sumatra Basin',
    country: 'Indonesia',
    lat: 0.53,
    lng: 101.44,
    frpMw: 490.2,
    satellite: 'Sentinel-3 SLSTR',
    confidence: 96,
    smokeDispersionVector: 'Northeast across Malacca Strait',
    hazardLevel: 'Extreme'
  }
];

export const GlobalWorldMap: React.FC<GlobalWorldMapProps> = ({
  selectedCity,
  onSelectCity
}) => {
  const { t } = useLanguage();

  // --- ARGOS ATLAS STATE CONFIGURATION ---
  const [baseMode, setBaseMode] = useState<ArgosBaseMode>('Satellite');
  const [activeRegion, setActiveRegion] = useState<MapRegion>('World');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFocusedOnSelected, setIsFocusedOnSelected] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Station Dots Visibility: Default to 'none' so global map has NO dots by default!
  // Dots only appear when user explicitly selects a Country, State, or City as requested!
  const [stationDotMode, setStationDotMode] = useState<StationDotMode>('none');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Layer switches (Argos Atlas Multi-Stream Toggle Deck)
  const [layerAirPlumes, setLayerAirPlumes] = useState(true);
  const [layerPlants, setLayerPlants] = useState(true);
  const [layerFires, setLayerFires] = useState(true);
  const [layerWeather, setLayerWeather] = useState(true);
  const [layerStorms, setLayerStorms] = useState(true);

  // Time scrubbing controller
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [isPlayingTime, setIsPlayingTime] = useState<boolean>(false);

  // Tactical Inspector Dossier
  type InspectedTarget =
    | { type: 'station'; data: CityData }
    | { type: 'plant'; data: ArgosIndustrialPlant }
    | { type: 'fire'; data: ArgosFireHotspot }
    | { type: 'storm'; data: ArgosStorm }
    | null;

  const [inspectedTarget, setInspectedTarget] = useState<InspectedTarget>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({ lat: 20.59, lng: 78.96 });
  const [utcTime, setUtcTime] = useState<string>('');
  const [millisecondTick, setMillisecondTick] = useState<string>('');

  // Location search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Escape key listener for immediate exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectedTarget) {
          setInspectedTarget(null);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, inspectedTarget]);

  // Clock ticker for tactical UTC display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
      setMillisecondTick(now.toISOString().replace('T', ' ').substring(0, 23) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  // Time scrubber playback interval
  useEffect(() => {
    let timer: number | null = null;
    if (isPlayingTime) {
      timer = window.setInterval(() => {
        setTimeOffsetHours(prev => {
          if (prev >= 24) return -24;
          return prev + 2;
        });
      }, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingTime]);

  // Selected city projected coords
  const selectedPos = useMemo(() => {
    return projectCoords(selectedCity.lat, selectedCity.lng);
  }, [selectedCity.lat, selectedCity.lng]);

  const selectedAqi = pm25ToAqi(selectedCity.basePm25);

  // SMART STATION DOTS FILTERING:
  // As requested ("remove dots in the map i want the dots whenver i select the country or city or states"):
  // When stationDotMode === 'none', ZERO dots appear on the world map, keeping it completely clean and uncluttered!
  // Dots ONLY appear when the user selects a Country, State, or City!
  const displayedStations = useMemo(() => {
    if (stationDotMode === 'none') {
      return [];
    }
    if (stationDotMode === 'onlyActive') {
      return [selectedCity];
    }
    if (stationDotMode === 'selectedState' && selectedCity.state) {
      return CITIES.filter(c => c.state.toLowerCase() === selectedCity.state?.toLowerCase());
    }
    if (stationDotMode === 'selectedCountry') {
      // Return stations for the selected city's country only
      return CITIES.filter(c => c.country.toLowerCase() === selectedCity.country.toLowerCase());
    }
    if (stationDotMode === 'all') {
      if (activeRegion === 'India') return CITIES.filter(c => c.country.toLowerCase() === 'india');
      if (activeRegion === 'Asia') return CITIES.filter(c => c.continent === 'Asia');
      if (activeRegion === 'Europe') return CITIES.filter(c => c.continent === 'Europe');
      if (activeRegion === 'Americas') return CITIES.filter(c => c.continent === 'North America' || c.continent === 'South America');
      return CITIES;
    }
    return [];
  }, [stationDotMode, selectedCity, activeRegion]);

  // Unique countries derived from CITIES dataset
  const availableCountries = useMemo(() => {
    const map = new Map<string, { country: string; flag: string; count: number }>();
    CITIES.forEach(c => {
      const existing = map.get(c.country);
      if (existing) {
        existing.count++;
      } else {
        map.set(c.country, { country: c.country, flag: c.flag || '📍', count: 1 });
      }
    });
    return Array.from(map.values());
  }, []);

  // Available states for the currently selected country
  const availableStatesForCountry = useMemo(() => {
    const states = new Set<string>();
    CITIES.filter(c => c.country.toLowerCase() === selectedCity.country.toLowerCase()).forEach(c => {
      if (c.state) states.add(c.state);
    });
    return Array.from(states);
  }, [selectedCity.country]);

  // Available cities for the currently selected country/state
  const availableCitiesForCountryOrState = useMemo(() => {
    if (stationDotMode === 'selectedState' && selectedCity.state) {
      return CITIES.filter(c => c.state.toLowerCase() === selectedCity.state?.toLowerCase());
    }
    return CITIES.filter(c => c.country.toLowerCase() === selectedCity.country.toLowerCase());
  }, [selectedCity.country, selectedCity.state, stationDotMode]);

  // Multi-entity search index
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();

    const cityMatches = CITIES.filter(
      c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)
    ).map(c => ({ type: 'station' as const, title: c.name, sub: `${c.state ? c.state + ', ' : ''}${c.country}`, data: c }));

    const stormMatches = ARGOS_STORMS.filter(
      s => s.name.toLowerCase().includes(q) || s.basin.toLowerCase().includes(q)
    ).map(s => ({ type: 'storm' as const, title: s.name, sub: `${s.category} [${s.windSpeedKmh} km/h]`, data: s }));

    const plantMatches = ARGOS_PLANTS.filter(
      p => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    ).map(p => ({ type: 'plant' as const, title: p.name, sub: `${p.category} · ${p.country}`, data: p }));

    return [...cityMatches, ...stormMatches, ...plantMatches].slice(0, 8);
  }, [searchQuery]);

  // ViewBox offset calculation
  const viewBox = useMemo(() => {
    if (isFocusedOnSelected) {
      const w = 110;
      const h = 70;
      const x = Math.max(0, Math.min(1000 - w, selectedPos.x - w / 2));
      const y = Math.max(0, Math.min(500 - h, selectedPos.y - h / 2));
      return `${x} ${y} ${w} ${h}`;
    }

    if (activeRegion === 'India') {
      return '676 138 102 96';
    }
    if (activeRegion === 'Europe') {
      return '440 65 150 120';
    }
    if (activeRegion === 'Americas') {
      return '110 60 270 240';
    }
    if (activeRegion === 'Asia') {
      return '580 85 300 215';
    }
    if (activeRegion === 'MiddleEastAfrica') {
      return '450 140 210 190';
    }

    if (zoomLevel === 1) {
      return '0 0 1000 500';
    }
    const w = 1000 / zoomLevel;
    const h = 500 / zoomLevel;
    const x = Math.max(0, Math.min(1000 - w, selectedPos.x - w / 2));
    const y = Math.max(0, Math.min(500 - h, selectedPos.y - h / 2));
    return `${x} ${y} ${w} ${h}`;
  }, [activeRegion, zoomLevel, selectedPos, isFocusedOnSelected]);

  const isIndiaView = activeRegion === 'India' || (isFocusedOnSelected && selectedCity.country.toLowerCase() === 'india');

  const handleZoomIn = () => {
    setIsFocusedOnSelected(false);
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setIsFocusedOnSelected(false);
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleReset = () => {
    setIsFocusedOnSelected(false);
    setActiveRegion('World');
    setZoomLevel(1);
    setSearchQuery('');
    setInspectedTarget(null);
  };

  const handleFocusSelected = () => {
    setIsFocusedOnSelected(true);
    if (selectedCity.country.toLowerCase() === 'india') {
      setActiveRegion('India');
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const vbParts = viewBox.split(' ').map(Number);
    const vbX = vbParts[0] + (clientX / rect.width) * vbParts[2];
    const vbY = vbParts[1] + (clientY / rect.height) * vbParts[3];

    const { lat, lng } = unprojectCoords(vbX, vbY);
    setCursorCoords({
      lat: Math.max(-90, Math.min(90, lat)),
      lng: Math.max(-180, Math.min(180, lng))
    });
  };

  const selectedCityAqi = pm25ToAqi(selectedCity.basePm25);
  const worldMapSummary = t('a11yWorldMapSummary', {
    city: selectedCity.name,
    country: selectedCity.country,
    aqi: selectedCityAqi.aqi,
    category: selectedCityAqi.category,
    stormCount: 4
  });

  return (
    <section
      id="global-world-map-section"
      data-a11y-summary={worldMapSummary}
      className={`w-full mx-auto mb-10 transition-all ${isFullscreen ? 'fixed inset-0 z-50 p-2 bg-[#050a12]' : 'max-w-[1280px] px-3 sm:px-6'}`}
    >
      <p className="sr-only">{worldMapSummary}</p>
      
      {/* PROMINENT EXIT FULLSCREEN BUTTON */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-[999] px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm border-2 border-white/40 shadow-2xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
          title="Exit Fullscreen (Esc)"
        >
          <X className="w-5 h-5 text-white stroke-[3]" />
          <span>{t('exitFullscreen')}</span>
        </button>
      )}

      <div className={`glass-panel rounded-2xl sm:rounded-3xl border border-cyan-500/25 shadow-2xl bg-[#070e1b]/98 text-slate-100 relative overflow-hidden flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
        
        {/* 1. ARGOS ATLAS TACTICAL HEADER & STATUS BAR */}
        <div className="p-3.5 sm:p-5 border-b border-cyan-500/20 bg-gradient-to-r from-[#0b1528] via-[#091222] to-[#0b1528]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Branding & Status */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  ARGOS ATLAS INTELLIGENCE
                </span>
                <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  PLANETARY SENSORS ACTIVE
                </span>
                <span className="text-[10px] font-mono text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full bg-amber-500/10 flex items-center gap-1">
                  <CloudLightning className="w-3 h-3 text-amber-400" />
                  <span>4 TROPICAL CYCLONES</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden xl:inline">
                  {utcTime}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
                  <Satellite className="w-4 h-4 animate-pulse" />
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight font-sans flex items-center gap-2">
                  <span>{t('planetaryMapTitle')}</span>
                  <span className="text-xs font-mono font-normal text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    argosatlas.com integration
                  </span>
                </h3>
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Full-domain planetary situational telemetry fusing Sentinel-5P tropospheric gas columns, NASA active fire radiometry, mega-emitter plants, and real-time cyclone radar.
              </p>
            </div>

            {/* Right: Search, Target Lock, Exit Option & Station Dots Mode */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              
              {/* Tactical Cursor Coordinates */}
              <div className="hidden md:flex items-center gap-2 bg-[#050a14] px-3 py-1.5 rounded-xl border border-cyan-500/20 text-xs font-mono">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">CURSOR:</span>
                <span className="text-cyan-300 font-bold">
                  {cursorCoords.lat >= 0 ? `${cursorCoords.lat.toFixed(2)}°N` : `${Math.abs(cursorCoords.lat).toFixed(2)}°S`},{' '}
                  {cursorCoords.lng >= 0 ? `${cursorCoords.lng.toFixed(2)}°E` : `${Math.abs(cursorCoords.lng).toFixed(2)}°W`}
                </span>
              </div>

              {/* Fast Location Finder */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('findPlacePlaceholder')}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#050a14] border border-cyan-500/30 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 font-mono"
                />

                {/* Dropdown Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#091322] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                    <div className="p-1.5 bg-[#050a14] text-[10px] font-mono uppercase text-cyan-300 border-b border-cyan-500/20 flex items-center justify-between">
                      <span>Argos Intelligence Index</span>
                      <button onClick={() => setShowSearchResults(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                    </div>
                    {searchResults.map((item, idx) => (
                      <button
                        key={`${item.type}-${idx}`}
                        onClick={() => {
                          if (item.type === 'station') {
                            onSelectCity(item.data);
                            setIsFocusedOnSelected(true);
                            setInspectedTarget({ type: 'station', data: item.data });
                          } else if (item.type === 'storm') {
                            setInspectedTarget({ type: 'storm', data: item.data });
                          } else if (item.type === 'plant') {
                            setInspectedTarget({ type: 'plant', data: item.data });
                          }
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-900/40 border-b border-white/5 last:border-b-0 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {item.type === 'station' && <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          {item.type === 'storm' && <CloudLightning className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          {item.type === 'plant' && <Factory className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          <div className="truncate">
                            <span className="font-bold text-white block">{item.title}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{item.sub}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 uppercase shrink-0">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters & Layers Toggle Button */}
              <button
                onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isFilterDrawerOpen
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-extrabold'
                    : 'bg-[#050a14] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40'
                }`}
                title="Toggle Layers & Filters Drawer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{isFilterDrawerOpen ? 'Hide Filters' : 'Filters & Layers'}</span>
              </button>

              {/* Pinpoint Current Station Lock Button */}
              <button
                onClick={handleFocusSelected}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isFocusedOnSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-extrabold'
                    : 'bg-[#050a14] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40'
                }`}
                title="Lock onto selected city receptor"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{t('lockTarget')}</span>
              </button>

              {/* Exit Map / Fullscreen Controls */}
              {isFullscreen ? (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Exit Fullscreen (Esc)"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>{t('exitFullscreen')}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const elem = document.getElementById('air-clock-section');
                      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#050a14] hover:bg-white/10 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                    title="Exit Map to Telemetry Dial"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                    <span>{t('exitMap')}</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 rounded-xl bg-[#050a14] border border-cyan-500/30 text-cyan-300 hover:text-white cursor-pointer"
                    title="Enter Fullscreen Argos Mode"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Storms Ticker Banner (No cutoff, scrollable with right-padding) */}
          <div className="mt-2.5 pt-2 border-t border-cyan-500/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 overflow-x-auto text-[11px] font-mono pb-1 pr-6">
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5">
                <CloudLightning className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>{t('stormDetection')}:</span>
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 pr-4 shrink-0">
              {ARGOS_STORMS.map(storm => (
                <button
                  key={storm.id}
                  onClick={() => {
                    setInspectedTarget({ type: 'storm', data: storm });
                  }}
                  className="px-3 py-1 rounded-lg bg-black/60 hover:bg-amber-950/80 border border-amber-500/35 text-amber-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="font-bold">{storm.name.split(' ')[storm.name.split(' ').length - 1]}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">({storm.windSpeedKmh} km/h)</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLLAPSIBLE FILTERS & LAYERS DRAWER */}
        {isFilterDrawerOpen && (
          <div className="animate-fade-in border-b border-cyan-500/20 bg-[#07101e]">
            {/* Top drawer strip: Base Modes, Feeds, and Region/Zoom */}
            <div className="px-3 py-2 border-b border-cyan-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Base Imagery Modes */}
              <div className="flex items-center gap-1 bg-[#040810] p-1 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] font-mono text-slate-400 px-1.5 font-bold">BASE:</span>
            {(['Satellite', 'DarkTactical', 'Terrain', 'NightRadiance'] as ArgosBaseMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setBaseMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  baseMode === mode
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode === 'DarkTactical' ? 'Dark Tactical' : mode === 'NightRadiance' ? t('nightLights') : mode === 'Satellite' ? t('naturalSatellite') : mode}
              </button>
            ))}
          </div>

          {/* Granular Intelligence Layer Switches */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 font-bold hidden sm:inline">FEEDS:</span>
            
            {/* Weather Radar Toggle */}
            <button
              onClick={() => setLayerWeather(!layerWeather)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                layerWeather
                  ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400/60 shadow-xs'
                  : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <CloudRain className="w-3 h-3 text-cyan-400" />
              <span>{t('weatherLayer')}</span>
            </button>

            {/* Storm & Cyclone Detection Toggle */}
            <button
              onClick={() => setLayerStorms(!layerStorms)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                layerStorms
                  ? 'bg-amber-950/80 text-amber-200 border-amber-400/60 shadow-xs'
                  : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <CloudLightning className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{t('stormDetection')}</span>
            </button>

            <button
              onClick={() => setLayerPlants(!layerPlants)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                layerPlants
                  ? 'bg-orange-950/70 text-orange-300 border-orange-500/50 shadow-xs'
                  : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Factory className="w-3 h-3 text-orange-400" />
              <span>{t('industrialPlants')}</span>
            </button>

            <button
              onClick={() => setLayerFires(!layerFires)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                layerFires
                  ? 'bg-red-950/80 text-red-300 border-red-500/50 shadow-xs'
                  : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>{t('activeFires')}</span>
            </button>

            {/* STATION DOTS FILTER CONTROLLER: REMOVE DOTS UNLESS SELECTED */}
            <div className="flex items-center gap-1 bg-[#040810] px-2 py-0.5 rounded-lg border border-cyan-500/30">
              <span className="text-[10px] text-slate-400 font-mono font-bold">DOTS:</span>
              <button
                onClick={() => setStationDotMode('none')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  stationDotMode === 'none' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Hide all station dots for a clean satellite earth map"
              >
                Off (0)
              </button>
              <button
                onClick={() => setStationDotMode('selectedCountry')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  stationDotMode === 'selectedCountry' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title={`Show dots only for selected country (${selectedCity.country})`}
              >
                {selectedCity.country.slice(0, 6)}
              </button>
              {selectedCity.state && (
                <button
                  onClick={() => setStationDotMode('selectedState')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    stationDotMode === 'selectedState' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Show dots only for selected state (${selectedCity.state})`}
                >
                  {t('showStateDots')}
                </button>
              )}
              <button
                onClick={() => setStationDotMode('onlyActive')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  stationDotMode === 'onlyActive' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Only show dot for active city"
              >
                {t('showCityDots')}
              </button>
            </div>
          </div>

          {/* Region Tabs & Zoom Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#040810] p-1 rounded-xl border border-cyan-500/20 text-xs font-mono">
              <button
                onClick={() => {
                  setActiveRegion('World');
                  setIsFocusedOnSelected(false);
                  setZoomLevel(1);
                }}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  activeRegion === 'World' && !isFocusedOnSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('allRegions')}
              </button>
              <button
                onClick={() => {
                  setActiveRegion('India');
                  setIsFocusedOnSelected(false);
                  setZoomLevel(1);
                }}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer font-bold ${
                  activeRegion === 'India' && !isFocusedOnSelected ? 'bg-cyan-500 text-slate-950' : 'text-emerald-400 hover:text-white'
                }`}
              >
                🇮🇳 India
              </button>
              <button
                onClick={() => {
                  setActiveRegion('Asia');
                  setIsFocusedOnSelected(false);
                  setZoomLevel(1);
                }}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  activeRegion === 'Asia' && !isFocusedOnSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Asia
              </button>
              <button
                onClick={() => {
                  setActiveRegion('Europe');
                  setIsFocusedOnSelected(false);
                  setZoomLevel(1);
                }}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  activeRegion === 'Europe' && !isFocusedOnSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Europe
              </button>
              <button
                onClick={() => {
                  setActiveRegion('Americas');
                  setIsFocusedOnSelected(false);
                  setZoomLevel(1);
                }}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  activeRegion === 'Americas' && !isFocusedOnSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Americas
              </button>
            </div>

            <div className="flex items-center bg-[#040810] rounded-xl border border-cyan-500/20 p-0.5">
              <button onClick={handleZoomIn} className="p-1 hover:bg-white/10 text-cyan-300 rounded cursor-pointer" title="Zoom In">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleZoomOut} className="p-1 hover:bg-white/10 text-cyan-300 rounded cursor-pointer" title="Zoom Out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleReset} className="p-1 hover:bg-white/10 text-cyan-300 rounded cursor-pointer" title="Reset View">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2B. ARGOS GEOGRAPHIC ENTITY EXPLORER: DOTS VISIBILITY BY COUNTRY / STATE / CITY */}
        <div className="px-3 py-2 bg-[#060e1a] border-b border-cyan-500/15 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 font-bold">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>STATION DOTS:</span>
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-1 bg-[#030712] px-2.5 py-1 rounded-lg border border-cyan-500/25">
              <span className="text-[10px] text-slate-400 font-mono">Country:</span>
              <select
                value={stationDotMode === 'none' ? 'none' : selectedCity.country}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'none') {
                    setStationDotMode('none');
                  } else {
                    const firstInCountry = CITIES.find(c => c.country.toLowerCase() === val.toLowerCase());
                    if (firstInCountry) {
                      onSelectCity(firstInCountry);
                    }
                    setStationDotMode('selectedCountry');
                    if (val.toLowerCase() === 'india') setActiveRegion('India');
                  }
                }}
                className="bg-transparent text-cyan-300 font-mono text-xs font-bold border-none outline-none cursor-pointer"
              >
                <option value="none" className="bg-[#0b1728] text-amber-300">🚫 Clean Map (No Dots)</option>
                {availableCountries.map(c => (
                  <option key={c.country} value={c.country} className="bg-[#0b1728] text-white">
                    {c.flag} {c.country} ({c.count} stations)
                  </option>
                ))}
              </select>
            </div>

            {/* State Selector (When country is active) */}
            {availableStatesForCountry.length > 0 && stationDotMode !== 'none' && (
              <div className="flex items-center gap-1 bg-[#030712] px-2.5 py-1 rounded-lg border border-cyan-500/25">
                <span className="text-[10px] text-slate-400 font-mono">State:</span>
                <select
                  value={stationDotMode === 'selectedState' ? selectedCity.state : 'all-states'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all-states') {
                      setStationDotMode('selectedCountry');
                    } else {
                      const firstInState = CITIES.find(c => c.state.toLowerCase() === val.toLowerCase() && c.country.toLowerCase() === selectedCity.country.toLowerCase());
                      if (firstInState) {
                        onSelectCity(firstInState);
                      }
                      setStationDotMode('selectedState');
                    }
                  }}
                  className="bg-transparent text-emerald-300 font-mono text-xs font-bold border-none outline-none cursor-pointer"
                >
                  <option value="all-states" className="bg-[#0b1728] text-slate-300">All States in {selectedCity.country}</option>
                  {availableStatesForCountry.map(s => (
                    <option key={s} value={s} className="bg-[#0b1728] text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* City Selector */}
            {stationDotMode !== 'none' && availableCitiesForCountryOrState.length > 0 && (
              <div className="flex items-center gap-1 bg-[#030712] px-2.5 py-1 rounded-lg border border-cyan-500/25">
                <span className="text-[10px] text-slate-400 font-mono">City:</span>
                <select
                  value={selectedCity.id}
                  onChange={(e) => {
                    const found = CITIES.find(c => c.id === e.target.value);
                    if (found) {
                      onSelectCity(found);
                      setStationDotMode('onlyActive');
                    }
                  }}
                  className="bg-transparent text-amber-300 font-mono text-xs font-bold border-none outline-none cursor-pointer"
                >
                  {availableCitiesForCountryOrState.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#0b1728] text-white">
                      {c.name} [AQI {pm25ToAqi(c.basePm25).aqi}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Clean Map / Remove Dots Button */}
            {stationDotMode !== 'none' && (
              <button
                onClick={() => setStationDotMode('none')}
                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Remove all station dots for a pristine clean satellite view"
              >
                <EyeOff className="w-3.5 h-3.5 text-red-400" />
                <span>Hide Dots</span>
              </button>
            )}
          </div>

          {/* Real-time Dot Status Indicator */}
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            {stationDotMode === 'none' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Clean Earth (0 dots) · Select Country or State to display stations</span>
              </span>
            ) : (
              <span className="text-cyan-300 flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Showing {displayedStations.length} dots for {stationDotMode === 'selectedState' ? selectedCity.state : stationDotMode === 'onlyActive' ? selectedCity.name : selectedCity.country}</span>
              </span>
            )}
          </div>
        </div>
        </div>
        )}

        {/* 3. ARGOS ATLAS MAP STAGE (SVG INTERACTIVE TACTICAL CANVAS - TALLER VIEWPORT) */}
        <div className={`relative w-full bg-[#02060e] overflow-hidden ${isFullscreen ? 'flex-1' : 'h-[580px] sm:h-[680px] lg:h-[760px]'}`}>
          
          {/* Top Left Live Target Pill */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-[#060e1d]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 text-white shadow-xl">
            <span className="text-base">{selectedCity.flag}</span>
            <div className="min-w-0">
              <div className="font-extrabold text-xs leading-none truncate max-w-[140px] sm:max-w-[210px] text-white">
                {selectedCity.name}
              </div>
              <div className="text-[9px] text-cyan-300 font-mono">
                {selectedCity.lat.toFixed(2)}°N, {selectedCity.lng.toFixed(2)}°E · {selectedCity.regionTag}
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-950 shrink-0 ml-1 shadow-sm font-mono"
              style={{ backgroundColor: selectedAqi.color }}
            >
              AQI {selectedAqi.aqi}
            </span>
          </div>

          {/* Compass & Tactical Scale (Bottom Right) */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none select-none">
            <div className="bg-[#060e1d]/90 backdrop-blur-md p-1.5 rounded-xl border border-cyan-500/30 text-white flex items-center gap-1 text-[10px] font-mono">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 font-bold">GRID N ↑</span>
            </div>
            <div className="bg-[#060e1d]/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
              <span>SCALE: 0 ── 2,000 KM</span>
            </div>
          </div>

          {/* THE SVG INTERACTIVE CANVAS */}
          <svg
            viewBox={viewBox}
            onMouseMove={handleSvgMouseMove}
            className="w-full h-full transition-all duration-700 ease-out select-none cursor-crosshair"
          >
            <defs>
              <filter id="argosGlowCyan" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={isIndiaView ? "0.8" : "2"} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="argosGlowAmber" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={isIndiaView ? "1.2" : "3"} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="stormEyeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="rainRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#eab308" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* BASE 1: SATELLITE OPTICAL IMAGE */}
            <image
              href="/assets/aistudio/world_map_fe0eb107.jpeg"
              x="0"
              y="0"
              width="1000"
              height="500"
              preserveAspectRatio="none"
              className={
                baseMode === 'DarkTactical'
                  ? 'brightness-35 contrast-150 saturate-30 hue-rotate-190'
                  : baseMode === 'Terrain'
                  ? 'brightness-85 contrast-130 sepia-[0.35]'
                  : baseMode === 'NightRadiance'
                  ? 'brightness-40 contrast-160 invert-[0.1]'
                  : 'brightness-100 contrast-105'
              }
            />

            {/* BASE 2: TACTICAL GRID OVERLAY */}
            <g stroke="rgba(0, 240, 255, 0.08)" strokeWidth="0.5" fill="none">
              {[-60, -30, 0, 30, 60].map(lat => (
                <line key={`lat-${lat}`} x1="0" y1={projectCoords(lat, 0).y} x2="1000" y2={projectCoords(lat, 0).y} strokeDasharray="4 4" />
              ))}
              {[-120, -60, 0, 60, 120].map(lng => (
                <line key={`lng-${lng}`} x1={projectCoords(0, lng).x} y1="0" x2={projectCoords(0, lng).x} y2="500" strokeDasharray="4 4" />
              ))}
            </g>

            {/* LAYER: WEATHER OVERLAY (ISOTHERMS, ISOBARS & PRECIPITATION DOPPLER RADAR) */}
            {layerWeather && (
              <g id="layer-weather-telemetry">
                <g fill="none" strokeWidth="0.8" opacity="0.65">
                  <path d="M 50 85 Q 250 80 500 82 T 950 85" stroke="#38bdf8" strokeDasharray="3 2" />
                  <path d="M 50 145 Q 260 140 480 135 T 950 140" stroke="#34d399" strokeDasharray="4 2" />
                  <path d="M 40 215 Q 280 225 500 210 T 960 215" stroke="#fbbf24" strokeDasharray="5 2" />
                  <path d="M 40 255 Q 320 260 550 250 T 960 255" stroke="#f87171" strokeDasharray="4 2" />
                </g>

                <g fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.5">
                  <ellipse cx="670" cy="205" rx="35" ry="20" stroke="#f43f5e" strokeWidth="0.9" strokeDasharray="2 1" />
                  <text x="668" y="207" fill="#f43f5e" fontSize="5" fontWeight="black" fontFamily="monospace">L</text>
                  <ellipse cx="740" cy="215" rx="30" ry="18" stroke="#fb923c" strokeWidth="0.8" strokeDasharray="3 2" />
                  <text x="738" y="217" fill="#fb923c" fontSize="4.5" fontWeight="black" fontFamily="monospace">L</text>
                  <ellipse cx="480" cy="140" rx="35" ry="20" stroke="#38bdf8" strokeWidth="0.8" />
                  <text x="478" y="142" fill="#38bdf8" fontSize="5" fontWeight="black" fontFamily="monospace">H</text>
                </g>

                <g opacity="0.45">
                  <path d="M 640 185 Q 670 195 690 220" fill="none" stroke="url(#rainRadarGrad)" strokeWidth="8" strokeLinecap="round" className="animate-pulse" />
                  <path d="M 720 200 Q 745 210 760 230" fill="none" stroke="url(#rainRadarGrad)" strokeWidth="6" strokeLinecap="round" className="animate-pulse" />
                </g>
              </g>
            )}

            {/* LAYER: ACTIVE STORMS & TROPICAL CYCLONES */}
            {layerStorms && (
              <g id="layer-active-cyclones">
                {ARGOS_STORMS.map(storm => {
                  const pos = projectCoords(storm.lat, storm.lng);
                  const radius = isIndiaView ? 16 : 30;

                  return (
                    <g
                      key={storm.id}
                      className="cursor-pointer group"
                      onClick={() => setInspectedTarget({ type: 'storm', data: storm })}
                    >
                      <g fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth={isIndiaView ? '0.6' : '1.2'} strokeDasharray="3 2">
                        {storm.trackForecast.map((tp, idx) => {
                          const tPos = projectCoords(tp.lat, tp.lng);
                          const prevPos = idx === 0 ? pos : projectCoords(storm.trackForecast[idx - 1].lat, storm.trackForecast[idx - 1].lng);
                          return (
                            <g key={`track-${idx}`}>
                              <line x1={prevPos.x} y1={prevPos.y} x2={tPos.x} y2={tPos.y} />
                              <circle cx={tPos.x} cy={tPos.y} r={isIndiaView ? 1.5 : 3} fill="#f59e0b" />
                            </g>
                          );
                        })}
                      </g>

                      <circle cx={pos.x} cy={pos.y} r={radius} fill="none" stroke="#f59e0b" strokeWidth={isIndiaView ? '0.6' : '1.4'} strokeDasharray="4 2" className="animate-ping" />

                      <g className="animate-spin" style={{ transformOrigin: `${pos.x}px ${pos.y}px`, animationDuration: '7s' }}>
                        <path d={`M ${pos.x - radius * 0.9} ${pos.y} Q ${pos.x} ${pos.y - radius * 0.7} ${pos.x + radius * 0.9} ${pos.y}`} fill="none" stroke="#ef4444" strokeWidth={isIndiaView ? '1.2' : '2.5'} strokeLinecap="round" opacity="0.85" />
                        <path d={`M ${pos.x} ${pos.y - radius * 0.9} Q ${pos.x + radius * 0.7} ${pos.y} ${pos.x} ${pos.y + radius * 0.9}`} fill="none" stroke="#f97316" strokeWidth={isIndiaView ? '1.2' : '2.5'} strokeLinecap="round" opacity="0.85" />
                      </g>

                      <circle cx={pos.x} cy={pos.y} r={isIndiaView ? 4.5 : 9} fill="url(#stormEyeGrad)" filter="url(#argosGlowAmber)" />
                      <circle cx={pos.x} cy={pos.y} r={isIndiaView ? 1.5 : 3.5} fill="#ffffff" />

                      <g transform={`translate(${pos.x}, ${pos.y - (isIndiaView ? 7 : 14)})`}>
                        <rect x={isIndiaView ? -18 : -36} y={isIndiaView ? -4 : -8} width={isIndiaView ? 36 : 72} height={isIndiaView ? 8 : 16} rx={isIndiaView ? 2 : 4} fill="#0f172a" stroke="#f59e0b" strokeWidth={isIndiaView ? '0.4' : '0.8'} />
                        <text x="0" y={isIndiaView ? 1.5 : 3} textAnchor="middle" fill="#fbbf24" fontSize={isIndiaView ? '2.4' : '5.5'} fontFamily="monospace" fontWeight="black">
                          ⚡ {storm.name.split(' ')[storm.name.split(' ').length - 1]}: {storm.windSpeedKmh}km/h
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            )}

            {/* LAYER: INDUSTRIAL MEGA EMITTERS */}
            {layerPlants && (
              <g id="layer-plants">
                {ARGOS_PLANTS.map(plant => {
                  const p = projectCoords(plant.lat, plant.lng);
                  return (
                    <g
                      key={plant.id}
                      transform={`translate(${p.x}, ${p.y})`}
                      className="cursor-pointer"
                      onClick={() => setInspectedTarget({ type: 'plant', data: plant })}
                    >
                      <rect
                        x={isIndiaView ? -2 : -4}
                        y={isIndiaView ? -2 : -4}
                        width={isIndiaView ? 4 : 8}
                        height={isIndiaView ? 4 : 8}
                        fill="#f97316"
                        stroke="#ffffff"
                        strokeWidth={isIndiaView ? "0.4" : "0.8"}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* LAYER: NASA FIRMS FIRES */}
            {layerFires && (
              <g id="layer-fires">
                {ARGOS_FIRE_HOTSPOTS.map(fire => {
                  const p = projectCoords(fire.lat, fire.lng);
                  return (
                    <g key={fire.id} transform={`translate(${p.x}, ${p.y})`} className="cursor-pointer" onClick={() => setInspectedTarget({ type: 'fire', data: fire })}>
                      <circle r={isIndiaView ? '4' : '8'} fill="#ef4444" opacity="0.4" className="animate-ping" />
                      <circle r={isIndiaView ? '2.2' : '4.5'} fill="#ef4444" stroke="#fef08a" strokeWidth={isIndiaView ? '0.5' : '1'} />
                    </g>
                  );
                })}
              </g>
            )}

            {/* LAYER: CAAQMS GROUND RECEPTOR PINS (ONLY FOR SELECTED COUNTRY/STATE/CITY) */}
            {displayedStations.map(city => {
              const pos = projectCoords(city.lat, city.lng);
              const aqi = pm25ToAqi(city.basePm25);
              const isCurrent = city.id === selectedCity.id;

              const outerRadius = isIndiaView ? (isCurrent ? '3.0' : '1.5') : (isCurrent ? '8' : '4');
              const innerRadius = isIndiaView ? (isCurrent ? '1.3' : '0.7') : (isCurrent ? '3.5' : '1.8');

              return (
                <g
                  key={city.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectCity(city);
                    setInspectedTarget({ type: 'station', data: city });
                  }}
                >
                  <circle r={isIndiaView ? '6' : '14'} fill="transparent" />
                  <circle
                    r={outerRadius}
                    fill={aqi.color}
                    stroke="#ffffff"
                    strokeWidth={isIndiaView ? '0.4' : '1'}
                    filter={isCurrent ? 'url(#argosGlowCyan)' : undefined}
                  />
                  <circle r={innerRadius} fill="#ffffff" />
                  {(isIndiaView || isCurrent) && (
                    <text
                      x="3.5"
                      y="1"
                      fill={isCurrent ? '#00f0ff' : '#ffffff'}
                      fontSize={isCurrent ? (isIndiaView ? '3.0' : '7.0') : (isIndiaView ? '1.8' : '4.5')}
                      fontWeight="bold"
                      fontFamily="monospace"
                      stroke="#000000"
                      strokeWidth={isIndiaView ? '0.4' : '0.8'}
                      paintOrder="stroke"
                      className="pointer-events-none drop-shadow-md select-none"
                    >
                      {city.name} {isCurrent ? `[AQI ${aqi.aqi}]` : ''}
                    </text>
                  )}
                </g>
              );
            })}

            {/* SATELLITE LOCATOR TARGET RETICLE (ONLY ACTIVE WHEN A TARGET OR COUNTRY/STATE IS SELECTED) */}
            {stationDotMode !== 'none' && (
              <g transform={`translate(${selectedPos.x}, ${selectedPos.y})`}>
                <circle
                  r={isIndiaView ? '7' : '20'}
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth={isIndiaView ? '0.7' : '1.8'}
                  className="animate-ping"
                />
                <circle
                  r={isIndiaView ? '4' : '12'}
                  fill="none"
                  stroke="#00e676"
                  strokeWidth={isIndiaView ? '0.8' : '2'}
                  strokeDasharray="2 1"
                />
                <line x1={isIndiaView ? '-6' : '-16'} y1="0" x2={isIndiaView ? '-2.5' : '-7'} y2="0" stroke="#00f0ff" strokeWidth={isIndiaView ? '0.8' : '2'} />
                <line x1={isIndiaView ? '2.5' : '7'} y1="0" x2={isIndiaView ? '6' : '16'} y2="0" stroke="#00f0ff" strokeWidth={isIndiaView ? '0.8' : '2'} />
                <line x1="0" y1={isIndiaView ? '-6' : '-16'} x2="0" y2={isIndiaView ? '-2.5' : '-7'} stroke="#00f0ff" strokeWidth={isIndiaView ? '0.8' : '2'} />
                <line x1="0" y1={isIndiaView ? '2.5' : '7'} x2="0" y2={isIndiaView ? '6' : '16'} stroke="#00f0ff" strokeWidth={isIndiaView ? '0.8' : '2'} />
              </g>
            )}
          </svg>

          {/* 4. ARGOS ATLAS TACTICAL INTELLIGENCE DOSSIER (FLOATING SIDE DRAWER) */}
          {inspectedTarget && (
            <div className="absolute top-3 right-3 bottom-3 z-30 w-[92%] sm:w-[380px] bg-[#071120]/95 backdrop-blur-md rounded-2xl border border-cyan-500/40 shadow-2xl p-4 text-white overflow-y-auto animate-fade-in flex flex-col justify-between">
              <div>
                {/* Header with Close */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {inspectedTarget.type === 'station' && <MapPin className="w-4 h-4" />}
                      {inspectedTarget.type === 'storm' && <CloudLightning className="w-4 h-4 text-amber-400" />}
                      {inspectedTarget.type === 'plant' && <Factory className="w-4 h-4" />}
                      {inspectedTarget.type === 'fire' && <Flame className="w-4 h-4" />}
                    </span>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-cyan-400 block font-bold">
                        ARGOS DOSSIER · {inspectedTarget.type.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {inspectedTarget.type === 'station' && inspectedTarget.data.name}
                        {inspectedTarget.type === 'storm' && inspectedTarget.data.name}
                        {inspectedTarget.type === 'plant' && inspectedTarget.data.name}
                        {inspectedTarget.type === 'fire' && inspectedTarget.data.name}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectedTarget(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    title={t('closeDossier')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Specific Telemetry Cards */}
                <div className="mt-3 space-y-2.5 text-xs">
                  {inspectedTarget.type === 'storm' && (
                    <>
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-extrabold text-[10px] uppercase font-mono tracking-wider">
                            {inspectedTarget.data.warningStatus}
                          </span>
                          <span className="text-[10px] text-slate-300 font-mono">
                            {inspectedTarget.data.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200 leading-tight">
                          Impact Zone: {inspectedTarget.data.impactZones}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-slate-400 block">{t('windSpeedKmh').toUpperCase()}</span>
                          <span className="text-base font-bold text-amber-300">
                            {inspectedTarget.data.windSpeedKmh} km/h
                          </span>
                          <span className="text-[9px] text-slate-400 block">Gusts: {inspectedTarget.data.windGustsKmh} km/h</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-slate-400 block">{t('centralPressure').toUpperCase()}</span>
                          <span className="text-base font-bold text-rose-300">
                            {inspectedTarget.data.centralPressureHpa} hPa
                          </span>
                          <span className="text-[9px] text-slate-400 block">Surge: {inspectedTarget.data.stormSurgeMeters}m</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Eye Diameter:</span>
                          <span className="font-mono text-cyan-300 font-bold">{inspectedTarget.data.eyeDiameterKm} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Movement Vector:</span>
                          <span className="font-mono text-white">{inspectedTarget.data.heading}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Atmospheric Basin:</span>
                          <span className="text-white">{inspectedTarget.data.basin}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {inspectedTarget.type === 'station' && (
                    <>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-slate-400 block">CURRENT AQI</span>
                          <span className="text-lg font-bold text-cyan-300">
                            {pm25ToAqi(inspectedTarget.data.basePm25).aqi} ({pm25ToAqi(inspectedTarget.data.basePm25).category})
                          </span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-slate-400 block">PM2.5 MASS</span>
                          <span className="text-lg font-bold text-emerald-300">
                            {inspectedTarget.data.basePm25} µg/m³
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Station Code:</span>
                          <span className="font-mono text-white">{inspectedTarget.data.stationName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Night Inversion Factor:</span>
                          <span className="font-mono text-amber-300">{inspectedTarget.data.nightInversionFactor}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Fleet Traffic Multiplier:</span>
                          <span className="font-mono text-rose-300">{inspectedTarget.data.baseTraffic}x</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-800/40">
                        {inspectedTarget.data.summaryNote}
                      </p>
                    </>
                  )}

                  {inspectedTarget.type === 'plant' && (
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capacity:</span>
                        <span className="font-mono text-amber-300 font-bold">{inspectedTarget.data.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Daily PM2.5 Tonnes:</span>
                        <span className="font-mono text-rose-300">{inspectedTarget.data.dailyPm25Tonnes} T/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Scrubber Status:</span>
                        <span className="text-emerald-300">{inspectedTarget.data.scrubberStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="pt-3 border-t border-cyan-500/20 mt-3 flex items-center gap-2">
                {inspectedTarget.type === 'station' ? (
                  <button
                    onClick={() => {
                      onSelectCity(inspectedTarget.data);
                      setInspectedTarget(null);
                    }}
                    className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Set Active Receptor Hub</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setInspectedTarget(null)}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer text-center font-mono"
                  >
                    {t('closeDossier')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. ARGOS ATLAS TIME HORIZON & SCRUBBING CONTROLLER (FOOTER BAR) */}
        <div className="p-3 bg-[#081220] border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Time scrubber controls */}
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <button
              onClick={() => setIsPlayingTime(!isPlayingTime)}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm font-mono"
            >
              {isPlayingTime ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlayingTime ? 'PAUSE' : 'PLAY 24H'}</span>
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                <span>-24h (Historical)</span>
                <span className="font-bold text-white bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {timeOffsetHours === 0 ? '● REAL-TIME LIVE' : timeOffsetHours > 0 ? `+${timeOffsetHours}h FORECAST` : `${timeOffsetHours}h HISTORICAL`}
                </span>
                <span>+24h (Forecast)</span>
              </div>
              <input
                type="range"
                min="-24"
                max="24"
                step="2"
                value={timeOffsetHours}
                onChange={e => setTimeOffsetHours(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Unified 6-Tier AQI Color Spectrum Legend */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300 overflow-x-auto shrink-0">
            <span className="text-cyan-400 font-bold mr-1">AQI SCALE:</span>
            <span className="px-1.5 py-0.5 rounded bg-[#00b050]/20 text-[#00e676] border border-[#00b050]/40">0-50 Good</span>
            <span className="px-1.5 py-0.5 rounded bg-[#558b2f]/20 text-[#8bc34a] border border-[#558b2f]/40">51-100 Satisfactory</span>
            <span className="px-1.5 py-0.5 rounded bg-[#d48806]/20 text-[#ffc107] border border-[#d48806]/40">101-200 Moderate</span>
            <span className="px-1.5 py-0.5 rounded bg-[#d45b14]/20 text-[#ff9800] border border-[#d45b14]/40">201-300 Poor</span>
            <span className="px-1.5 py-0.5 rounded bg-[#c0392b]/20 text-[#ff5252] border border-[#c0392b]/40">301-400 Very Poor</span>
            <span className="px-1.5 py-0.5 rounded bg-[#6e2b26]/30 text-[#ff8a80] border border-[#6e2b26]/50">401+ Severe</span>
          </div>
        </div>

        {/* Visible Satellite & Sensor Telemetry Credits */}
        <div className="px-4 py-2 bg-[#040810] border-t border-cyan-500/15 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">SOURCE CREDITS:</span>
            <span>Copernicus Atmosphere (CAMS) · CAAQMS Ground Nodes · Argos Atlas Planetary Mesh</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">
            High-Resolution Equirectangular Projection
          </span>
        </div>
      </div>

    </section>
  );
};
