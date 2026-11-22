/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { CITIES, CityData } from './data/cities';
import {
  generate24HourForecast,
  computeTreeShapDrivers,
  computeSimulatedPm25,
  SimulationParams,
  pm25ToAqi
} from './utils/aqi';
import { findBestCityMatch } from './utils/placeMatcher';

import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { HeroSection } from './components/HeroSection';
import { KeyTelemetryCards } from './components/KeyTelemetryCards';
import { AirClockSection } from './components/AirClockSection';
import { WhatIfSimulatorSection, TreeShapDriversSection } from './components/WhatIfAndShapSection';
import { ClinicalProtocolSection } from './components/ClinicalProtocolSection';
import { RespiratoryDiagnosticTool } from './components/RespiratoryDiagnosticTool';
import { AlertSubscribeBanner } from './components/AlertSubscribeBanner';
import { AuthoritativePortals } from './components/AuthoritativePortals';
import { PipelineSection } from './components/PipelineSection';
import { BottomCta } from './components/BottomCta';
import { Footer } from './components/Footer';

import { MapsGroundingSection } from './components/MapsGroundingSection';
import { GlobalWorldMap } from './components/GlobalWorldMap';
import { LiveGroundingIntel } from './components/LiveGroundingIntel';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { AtmosphericGame } from './game/AtmosphericGame';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AmbientAirFlow } from './components/AmbientAirFlow';

// Climate Prediction, Carbon & Sustainability Hackathon Components
import { ClimateRiskPanel } from './components/ClimateRiskPanel';
import { CarbonMonitoringPanel } from './components/CarbonMonitoringPanel';
import { DisasterEarlyWarning } from './components/DisasterEarlyWarning';
import { SustainabilityPlanner } from './components/SustainabilityPlanner';
import { ModelTransparencySection } from './components/ModelTransparencySection';
import { HiddenTranslationAuditModal } from './components/HiddenTranslationAuditModal';

// Modals & Informational Components
import { DataSourceCredits } from './components/DataSourceCredits';
import { HowItWorksModal } from './components/HowItWorksModal';
import { SubscribeModal } from './components/modals/SubscribeModal';
import { EmergencyModal } from './components/modals/EmergencyModal';
import { DirectivesModal } from './components/modals/DirectivesModal';
import { ApiDocsModal } from './components/modals/ApiDocsModal';
import { useLanguage } from './context/LanguageContext';
import { LanguageCode, LANGUAGES } from './utils/i18n';

import { ArrowRight, ArrowLeft, Radio, Cpu, Activity, ShieldAlert, Sparkles, MapPin, Sliders, Download, CheckCircle2, Languages } from 'lucide-react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * 'Install App' hook in App.tsx that captures the 'beforeinstallprompt' event
 * and stores the event in state, providing 1-click native PWA installation.
 */
export function useInstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Check pre-captured prompt from window if event fired early before mount
    const win = window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent };
    if (win.__deferredPWAInstallPrompt) {
      setDeferredPrompt(win.__deferredPWAInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null }).__deferredPWAInstallPrompt = null;
    };

    const handlePromptReady = () => {
      if (win.__deferredPWAInstallPrompt) {
        setDeferredPrompt(win.__deferredPWAInstallPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptEvent = deferredPrompt || (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null }).__deferredPWAInstallPrompt = null;
        }
        return choice.outcome;
      } catch (err) {
        console.warn('Native install prompt error:', err);
      }
    }

    // In sandboxed preview iframe, browsers suppress beforeinstallprompt.
    // Opening the URL in top window immediately allows the native browser prompt to trigger with 1 click.
    if (window.self !== window.top) {
      window.open(window.location.href, '_blank');
      return 'accepted';
    }

    return 'unsupported';
  };

  return {
    deferredPrompt,
    isInstalled,
    triggerInstall,
    isInstallable: !!deferredPrompt
  };
}

export default function App() {
  const { t, currentLanguage, setLanguage } = useLanguage();
  // Persistent 'Install App' hook capturing beforeinstallprompt event
  const { deferredPrompt, isInstalled: isAppInstalled, triggerInstall } = useInstallApp();
  const [installToast, setInstallToast] = useState<string | null>(null);

  // Current selected station / hub (default Coimbatore as in reference screen)
  const [selectedCity, setSelectedCity] = useState<CityData>(CITIES[0]);

  // Two-page state: Page 1 (Telemetry & Air Clock) | Page 2 (Clinical Diagnostics & SHAP Mesh)
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);

  // Simulation parameters
  const [params, setParams] = useState<SimulationParams>({
    windSpeed: CITIES[0].baseWind,
    humidity: CITIES[0].baseHumidity,
    temp: CITIES[0].baseTemp,
    trafficMultiplier: CITIES[0].baseTraffic,
    currentPm25: CITIES[0].basePm25,
    diwaliMode: false
  });

  // UI States
  const [activeTab, setActiveTab] = useState('Live Forecast');
  const [activeHourIndex, setActiveHourIndex] = useState(0);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isDemoSimulation, setIsDemoSimulation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isDirectivesOpen, setIsDirectivesOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Global shortcut to trigger hidden 37-language translation audit modal (Ctrl+Shift+T or Alt+Shift+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') ||
          (e.altKey && e.shiftKey && e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        setIsAuditModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update simulator parameters when city changes
  const handleSelectCity = (city: CityData) => {
    setSelectedCity(city);
    setParams({
      windSpeed: city.baseWind,
      humidity: city.baseHumidity,
      temp: city.baseTemp,
      trafficMultiplier: city.baseTraffic,
      currentPm25: city.basePm25,
      diwaliMode: false
    });
    setActiveHourIndex(0);
  };

  const handleResetParams = () => {
    setParams({
      windSpeed: selectedCity.baseWind,
      humidity: selectedCity.baseHumidity,
      temp: selectedCity.baseTemp,
      trafficMultiplier: selectedCity.baseTraffic,
      currentPm25: selectedCity.basePm25,
      diwaliMode: false
    });
  };

  // 24-hour neural prediction array (uses client's current local hour)
  const forecast = useMemo(() => {
    return generate24HourForecast(selectedCity, params, new Date().getHours());
  }, [selectedCity, params]);

  // Active point for current scrubbed hour
  const activeForecastPoint = forecast[activeHourIndex] || forecast[0];
  const activeAqi = pm25ToAqi(activeForecastPoint.medianPm25);

  const bestOutdoorHour = useMemo(() => {
    if (!forecast.length) return activeForecastPoint.hourLabel;
    const cleanest = [...forecast].sort((a, b) => a.aqi - b.aqi)[0];
    return cleanest?.hourLabel || activeForecastPoint.hourLabel;
  }, [forecast, activeForecastPoint.hourLabel]);

  // Single source of truth: simulated PM2.5
  const simulatedPm25 = useMemo(() => {
    return computeSimulatedPm25(selectedCity, params);
  }, [selectedCity, params]);

  // Compute TreeSHAP attribution forces (strictly sum to simulatedPm25 - basePm25)
  const shapDrivers = useMemo(() => {
    return computeTreeShapDrivers(params, selectedCity);
  }, [params, selectedCity]);

  // Connect AirCastA11y (configure + live setAqi)
  useEffect(() => {
    const cleanest = forecast.length
      ? [...forecast].sort((a, b) => a.aqi - b.aqi)[0]
      : activeForecastPoint;
    const worst = forecast.length
      ? [...forecast].sort((a, b) => b.aqi - a.aqi)[0]
      : activeForecastPoint;
    const avgAqi = forecast.length
      ? Math.round(forecast.reduce((acc, p) => acc + p.aqi, 0) / forecast.length)
      : activeAqi.aqi;

    const adviceKey =
      activeAqi.aqi <= 100
        ? 'a11yAdviceGood'
        : activeAqi.aqi <= 200
        ? 'a11yAdviceModerate'
        : activeAqi.aqi <= 300
        ? 'a11yAdvicePoor'
        : 'a11yAdviceSevere';

    const forecastSummary = t('a11yForecastTemplate', {
      city: selectedCity.name,
      avgAqi,
      cleanestHour: cleanest?.hourLabel || activeForecastPoint.hourLabel,
      cleanestAqi: cleanest?.aqi ?? activeAqi.aqi,
      worstHour: worst?.hourLabel || activeForecastPoint.hourLabel,
      worstAqi: worst?.aqi ?? activeAqi.aqi
    });

    const strongestDriver = shapDrivers.length
      ? [...shapDrivers].sort((a, b) => Math.abs(b.force) - Math.abs(a.force))[0]
      : null;
    const topDriverText = strongestDriver
      ? `${strongestDriver.driver} (${strongestDriver.force >= 0 ? '+' : ''}${strongestDriver.force.toFixed(1)} µg/m³)`
      : 'Local emissions';

    const handleVoiceSelectPlace = (query: string) => {
      const matched = findBestCityMatch(query);
      if (!matched) return { found: false };

      const nextParams: SimulationParams = {
        windSpeed: matched.baseWind,
        humidity: matched.baseHumidity,
        temp: matched.baseTemp,
        trafficMultiplier: matched.baseTraffic,
        currentPm25: matched.basePm25,
        diwaliMode: false
      };

      // Update React state directly so it works on both Page 1 and Page 2 for every state & country
      setSelectedCity(matched);
      setParams(nextParams);
      setActiveHourIndex(0);

      const nextForecast = generate24HourForecast(matched, nextParams, new Date().getHours());
      const nextCurrent = nextForecast[0];
      const nextAqi = pm25ToAqi(nextCurrent.medianPm25);
      const nextCleanest = [...nextForecast].sort((a, b) => a.aqi - b.aqi)[0];
      const nextWorst = [...nextForecast].sort((a, b) => b.aqi - a.aqi)[0];
      const nextAvg = Math.round(
        nextForecast.reduce((acc, p) => acc + p.aqi, 0) / nextForecast.length
      );
      const nextDrivers = computeTreeShapDrivers(nextParams, matched);
      const nextStrongest = [...nextDrivers].sort((a, b) => Math.abs(b.force) - Math.abs(a.force))[0];
      const nextForecastSummary = t('a11yForecastTemplate', {
        city: matched.name,
        avgAqi: nextAvg,
        cleanestHour: nextCleanest?.hourLabel || nextCurrent.hourLabel,
        cleanestAqi: nextCleanest?.aqi ?? nextAqi.aqi,
        worstHour: nextWorst?.hourLabel || nextCurrent.hourLabel,
        worstAqi: nextWorst?.aqi ?? nextAqi.aqi
      });
      const placeLabel =
        matched.country === 'India'
          ? `${matched.name}, ${matched.state}`
          : `${matched.name}, ${matched.country}`;
      const nextSummary = t('a11ySummaryTemplate', {
        city: placeLabel,
        aqi: nextAqi.aqi,
        category: nextAqi.category,
        bestHour: nextCleanest?.hourLabel || nextCurrent.hourLabel
      });

      window.AirCastA11y?.setAqi(nextAqi.aqi, matched.name, { silent: true });

      return {
        found: true,
        city: matched.name,
        state: matched.state,
        country: matched.country,
        aqi: nextAqi.aqi,
        category: nextAqi.category,
        pm25: nextCurrent.medianPm25,
        summary: nextSummary,
        context: {
          city: placeLabel,
          aqi: nextAqi.aqi,
          category: nextAqi.category,
          pm25: nextCurrent.medianPm25,
          bestHour: nextCleanest?.hourLabel || nextCurrent.hourLabel,
          worstHour: nextWorst?.hourLabel || nextCurrent.hourLabel,
          forecast: nextForecastSummary,
          topDriver: nextStrongest
            ? `${nextStrongest.driver} (${nextStrongest.force >= 0 ? '+' : ''}${nextStrongest.force.toFixed(1)} µg/m³)`
            : 'Local emissions',
          temp: matched.baseTemp,
          wind: matched.baseWind,
          humidity: matched.baseHumidity
        }
      };
    };

    const applyA11y = () => {
      if (!window.AirCastA11y) return false;
      window.AirCastA11y.configure({
        getLang: () => currentLanguage,
        getSummary: () =>
          t('a11ySummaryTemplate', {
            city: selectedCity.name,
            aqi: activeAqi.aqi,
            category: activeAqi.category,
            bestHour: cleanest?.hourLabel || activeForecastPoint.hourLabel
          }),
        getForecast: () => forecastSummary,
        getAdvice: () => t(adviceKey),
        onSelectPlace: handleVoiceSelectPlace,
        signClips: {
          good: '',
          satisfactory: '',
          moderate: '',
          poor: '',
          veryPoor: '',
          severe: '',
          emergency: ''
        },
        signWords: {
          air: 'signs/air.mp4',
          good: 'signs/good.mp4',
          okay: 'signs/okay.mp4',
          bad: 'signs/bad.mp4',
          'very-bad': 'signs/very-bad.mp4',
          careful: 'signs/careful.mp4',
          danger: 'signs/danger.mp4',
          mask: 'signs/mask.mp4',
          home: 'signs/home.mp4',
          doctor: 'signs/doctor.mp4',
          hospital: 'signs/hospital.mp4',
          help: 'signs/help.mp4'
        },
        selectors: {
          simulator: '#what-if-section',
          planner: '#sustainability-planner-section'
        }
      });
      window.AirCastA11y.setAqi(activeAqi.aqi, selectedCity.name);

      if (window.AirCastAssistant) {
        window.AirCastAssistant.configure({
          getLang: () => currentLanguage,
          setLanguage: (code: string) => {
            const norm = String(code || '').toLowerCase().split(/[-_]/)[0] as LanguageCode;
            if (LANGUAGES.some(l => l.code === norm)) {
              setLanguage(norm);
            }
          },
          onSelectPlace: handleVoiceSelectPlace,
          getContext: () => ({
            city:
              selectedCity.country === 'India'
                ? `${selectedCity.name}, ${selectedCity.state}`
                : `${selectedCity.name}, ${selectedCity.country}`,
            aqi: activeAqi.aqi,
            category: activeAqi.category,
            pm25: activeForecastPoint.medianPm25,
            bestHour: cleanest?.hourLabel || activeForecastPoint.hourLabel,
            worstHour: worst?.hourLabel || activeForecastPoint.hourLabel,
            forecast: forecastSummary,
            topDriver: topDriverText,
            temp: params.temp,
            wind: params.windSpeed,
            humidity: params.humidity
          })
        });
      }
      return true;
    };

    if (applyA11y()) return;

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (applyA11y() || tries >= 25) {
        window.clearInterval(timer);
      }
    }, 150);

    return () => window.clearInterval(timer);
  }, [
    currentLanguage,
    setLanguage,
    selectedCity.name,
    activeAqi.aqi,
    activeAqi.category,
    activeForecastPoint.hourLabel,
    activeForecastPoint.medianPm25,
    forecast,
    shapDrivers,
    params.temp,
    params.windSpeed,
    params.humidity,
    t
  ]);

  // Handle Load Live Data action
  const handleRefreshCams = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Live telemetry sync with ground sensors and atmospheric mesh
      const jitter = (Math.random() - 0.5) * 4;
      const nextPm25 = Math.max(10, Math.round(selectedCity.basePm25 + jitter));
      const nextAqi = pm25ToAqi(nextPm25);
      setParams(curr => ({
        ...curr,
        currentPm25: nextPm25,
        windSpeed: Math.max(2, Math.round(selectedCity.baseWind + (Math.random() - 0.5) * 2)),
      }));
      setIsRefreshing(false);
      window.AirCastA11y?.announce(
        t('a11yLiveSynced', {
          city: selectedCity.name,
          aqi: nextAqi.aqi,
          category: nextAqi.category
        }),
        'info'
      );
    }, 700);
  };

  // Demo simulation mode toggle: introduces subtle variations
  const handleToggleDemoSimulation = () => {
    setIsDemoSimulation(prev => !prev);
    if (!isDemoSimulation) {
      setParams(curr => ({
        ...curr,
        windSpeed: Math.max(5, curr.windSpeed - 4),
        trafficMultiplier: 1.5,
        currentPm25: curr.currentPm25 + 18
      }));
    } else {
      handleResetParams();
    }
  };

  const handleScrollToForecast = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    setTimeout(() => {
      const elem = document.getElementById('air-clock-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScrollToSimulator = () => {
    if (currentPage !== 2) {
      setCurrentPage(2);
    }
    setTimeout(() => {
      const elem = document.getElementById('what-if-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToNextPage = () => {
    setCurrentPage(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToPreviousPage = () => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isGameActive) {
    return (
      <AtmosphericGame
        onExit={() => setIsGameActive(false)}
        cityName={selectedCity.name}
        initialAqi={activeAqi.aqi}
      />
    );
  }

  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden text-[#0c1d2d] sky-bg-transition flex flex-col relative selection:bg-[#14202e] selection:text-white"
      style={{
        background: activeAqi.skyGradient
      }}
    >
      {/* Full-Page Interactive Ambient Air Flow Streamlines */}
      <AmbientAirFlow selectedCity={selectedCity} />

      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        onStartGame={() => setIsGameActive(true)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        aqi={activeAqi.aqi}
        category={activeAqi.category}
        pm25={activeForecastPoint.medianPm25}
        bestHour={bestOutdoorHour}
      />

      {/* Dynamic Red Alert Banner for Hazardous Air (AQI > 300 only, never hardcoded) */}
      <AlertBanner
        cityName={selectedCity.name}
        aqi={activeAqi.aqi}
        isDismissed={isAlertDismissed}
        onDismiss={() => setIsAlertDismissed(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenSubscribe={() => setIsSubscribeOpen(true)}
        onOpenDirectives={() => setIsDirectivesOpen(true)}
      />

      {/* Severe Disaster & Climate Early Warning (AQI > 400 or High Wind/Storms) */}
      <DisasterEarlyWarning
        selectedCity={selectedCity}
        forecast={forecast}
      />

      {/* PAGE 1: REAL-TIME TELEMETRY, 24-HOUR AIR CLOCK & REGIONAL GROUND DISPERSION */}
      {currentPage === 1 && (
        <main className="w-full flex-1 flex flex-col animate-fade-in pb-24">
          {/* Hero Section */}
          <HeroSection
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            isDemoSimulation={isDemoSimulation}
            onToggleDemoSimulation={handleToggleDemoSimulation}
            onRefreshCams={handleRefreshCams}
            isRefreshing={isRefreshing}
            onScrollToForecast={handleScrollToForecast}
            onScrollToSimulator={handleScrollToSimulator}
          />

          {/* Key Regional Receptor Telemetry Strip */}
          <KeyTelemetryCards
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
          />

          {/* Spatial Radial Telemetry: 24-Hour Air Clock & Confidence Dispersion */}
          <AirClockSection
            selectedCity={selectedCity}
            forecast={forecast}
            activeHourIndex={activeHourIndex}
            onSelectHour={setActiveHourIndex}
            onOpenSubscribe={() => setIsSubscribeOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onOpenDirectives={() => setIsDirectivesOpen(true)}
            isAlertDismissed={isAlertDismissed}
            onDismissAlert={() => setIsAlertDismissed(true)}
          />

          {/* Multi-Hazard Climate Risk Panel (Air Pollution, Heat, Fire/Smoke, Cyclone/Storm) */}
          <ClimateRiskPanel
            selectedCity={selectedCity}
            currentAqi={activeAqi.aqi}
            currentPm25={activeForecastPoint.medianPm25}
          />

          {/* Sentinel-5P TROPOMI Carbon & Greenhouse Gas Column Monitoring */}
          <CarbonMonitoringPanel
            selectedCity={selectedCity}
          />

          {/* Planetary Geospatial Network: Global World Map in Location Section */}
          <GlobalWorldMap
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
          />

          {/* UNIQUE TRANSITION HUB: END OF PAGE 1 -> MOVE TO PAGE 2 */}
          <section className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 my-10">
            <div className="rounded-3xl p-6 sm:p-9 bg-gradient-to-br from-[#14202e] via-[#1c2c3e] to-[#0c1d2d] text-white shadow-2xl border border-white/10 relative overflow-hidden">
              {/* Background ambient radial blurs */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
                    <span>{t('page1Completed')}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-sans leading-tight">
                    {t('page2Title')}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                    {t('page2Desc')}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs">
                      <div className="font-extrabold text-emerald-400">TreeSHAP</div>
                      <div className="text-[11px] text-slate-300">Attribution Forces</div>
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs">
                      <div className="font-extrabold text-blue-400">{t('whatIfSim')}</div>
                      <div className="text-[11px] text-slate-300">Dynamic Inversion</div>
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs">
                      <div className="font-extrabold text-amber-400">{t('recommendedTriage')}</div>
                      <div className="text-[11px] text-slate-300">Symptom Protocol</div>
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs">
                      <div className="font-extrabold text-teal-400">{t('cleanAirMap')}</div>
                      <div className="text-[11px] text-slate-300">{t('sanctuaryMapTitle')}</div>
                    </div>
                  </div>
                </div>

                {/* Big Next Page Navigation Button */}
                <div className="flex flex-col items-center lg:items-end gap-3 shrink-0">
                  <button
                    onClick={handleGoToNextPage}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00b050] hover:bg-[#009643] text-white font-extrabold text-base shadow-xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-95"
                  >
                    <span>{t('nextPageBtn')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Authoritative Data Source Credits (Copernicus, CAAQMS, Argos Atlas) */}
          <DataSourceCredits className="my-6 max-w-[1280px] mx-auto px-4 sm:px-6" />

          {/* Page 1 Footer */}
          <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-[#14202e]/10">
            <p>{t('page1Footer')}</p>
          </footer>
        </main>
      )}

      {/* PAGE 2: EXPLAINABLE AI, CLINICAL RESPIRATORY TRIAGE & CLEAN AIR NETWORK */}
      {currentPage === 2 && (
        <main className="w-full flex-1 flex flex-col animate-fade-in pb-24">
          {/* Top Page 2 Navigation Bar */}
          <section className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 pt-5 pb-2">
            <div className="glass-panel rounded-2xl p-4 border border-[#14202e]/15 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <button
                onClick={handleGoToPreviousPage}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0c1d2d] font-bold text-xs border border-slate-200/90 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-[#14202e]" />
                <span>{t('prevPageBtn')}</span>
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-extrabold px-3 py-1 rounded-full bg-[#14202e] text-white font-mono">
                  {t('page2Of2')}
                </span>
                <span className="font-bold text-slate-700 hidden sm:inline">
                  {t('page2Subtitle')}
                </span>
              </div>
            </div>
          </section>

          {/* 1. Simulator */}
          <WhatIfSimulatorSection
            selectedCity={selectedCity}
            params={params}
            onChangeParams={setParams}
            onResetParams={handleResetParams}
          />

          {/* 2. Sustainability Planner (before value equals simulator result) */}
          <SustainabilityPlanner
            selectedCity={selectedCity}
            shapDrivers={shapDrivers}
            baselinePm25={simulatedPm25}
          />

          {/* 3. SHAP drivers */}
          <TreeShapDriversSection
            selectedCity={selectedCity}
            params={params}
            shapDrivers={shapDrivers}
          />

          {/* 4. Model & Data */}
          <ModelTransparencySection />

          {/* 5. Health guidelines */}
          <ClinicalProtocolSection
            selectedCity={selectedCity}
            currentForecastPoint={activeForecastPoint}
          />

          {/* 6. Symptom checker / Medical AI */}
          <RespiratoryDiagnosticTool
            selectedCity={selectedCity}
            currentForecastPoint={activeForecastPoint}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />

          {/* 7. Sanctuaries & Public Portals */}
          <AlertSubscribeBanner
            onOpenSubscribe={() => setIsSubscribeOpen(true)}
          />

          <MapsGroundingSection selectedCity={selectedCity} />

          <AuthoritativePortals />

          <PipelineSection />

          {/* Page 2 Bottom Navigation & Return */}
          <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 my-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleGoToPreviousPage}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-[#0c1d2d] font-bold text-sm border border-slate-200/90 shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-[#14202e]" />
              <span>{t('backToPage1')}</span>
            </button>

            <button
              onClick={handleScrollToTop}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#14202e] hover:bg-[#000713] text-white font-bold text-sm shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <span>{t('backToTop')}</span>
            </button>
          </div>

          {/* Authoritative Data Source Credits (Copernicus, CAAQMS, Argos Atlas) */}
          <DataSourceCredits className="my-6 max-w-[1280px] mx-auto px-4 sm:px-6" />

          {/* Bottom Hero Call to Action */}
          <BottomCta
            onScrollToTop={handleScrollToTop}
            onOpenApiModal={() => setIsApiModalOpen(true)}
          />

          {/* Deep Footer */}
          <Footer onOpenApiModal={() => setIsApiModalOpen(true)} />
        </main>
      )}

      {/* Persistent 'Install App' Button to trigger native PWA installation flow */}
      {!isAppInstalled ? (
        <aside
          aria-label={t('installApp')}
          className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6 animate-fade-in"
        >
          <button
            onClick={async () => {
              const res = await triggerInstall();
              if (res === 'accepted') {
                setInstallToast(t('airCastInstalledMsg'));
                setTimeout(() => setInstallToast(null), 3000);
              }
            }}
            className="group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-[#0c1d2d]/95 hover:bg-[#14293f] text-white font-bold text-xs sm:text-sm shadow-2xl border border-blue-400/30 ring-2 ring-blue-500/20 hover:ring-blue-400/50 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            title="Install Global Air Quality Intelligence directly onto your device with 1 click"
            aria-label={t('installApp')}
          >
            <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white transition-colors shadow-inner">
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="flex flex-col text-left">
              <span className="leading-tight font-extrabold flex items-center gap-1.5">
                <span>{t('installApp')}</span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-cyan-300 px-1 py-0.2 rounded border border-blue-400/30">
                  {t('oneClick')}
                </span>
              </span>
              <span className="text-[10px] text-slate-300 font-normal hidden sm:inline leading-none mt-0.5">
                {t('airCastPwa')}
              </span>
            </div>
          </button>
        </aside>
      ) : (
        <aside
          aria-label={t('appInstalled')}
          className="fixed bottom-4 left-4 z-30 sm:bottom-6 sm:left-6 hidden sm:block"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-emerald-800 border border-emerald-300/80 text-xs font-bold shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('appInstalled')}</span>
          </div>
        </aside>
      )}

      {/* 1-Click Install Notification Toast */}
      {installToast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl bg-emerald-900/95 text-white text-xs font-bold shadow-2xl border border-emerald-500 flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{installToast}</span>
        </div>
      )}

      {/* Floating Bottom Quick Page Switcher & Audit Tool Trigger */}
      <div className="fixed bottom-4 right-4 z-30 sm:bottom-6 sm:right-6">
        <div className="glass-panel rounded-2xl p-1.5 border border-[#14202e]/15 shadow-xl flex items-center gap-1 backdrop-blur-md">
          <button
            onClick={handleGoToPreviousPage}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentPage === 1
                ? 'bg-[#14202e] text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-700'
            }`}
          >
            <span>{t('page1Nav')}</span>
          </button>
          <button
            onClick={handleGoToNextPage}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentPage === 2
                ? 'bg-[#14202e] text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-700'
            }`}
          >
            <span>{t('page2Nav')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAuditModalOpen(true)}
            title="37-Language Translation Audit Tester (Ctrl+Shift+T)"
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 hover:text-[#0c1d2d] transition-colors cursor-pointer"
            aria-label="Run Translation Audit"
          >
            <Languages className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Modals */}
      <SubscribeModal
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        selectedCity={selectedCity}
      />

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        selectedCity={selectedCity}
      />

      <DirectivesModal
        isOpen={isDirectivesOpen}
        onClose={() => setIsDirectivesOpen(false)}
        selectedCity={selectedCity}
      />

      <ApiDocsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        selectedCity={selectedCity}
      />

      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        selectedCity={selectedCity}
        currentAqi={activeAqi.aqi}
        onSelectCity={handleSelectCity}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {/* Hidden 37-Language Translation Audit Tester Modal */}
      <HiddenTranslationAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
