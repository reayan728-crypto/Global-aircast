import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  ShieldCheck,
  AlertCircle,
  Info,
  AlertTriangle,
  Bell,
  PhoneCall,
  X
} from 'lucide-react';
import { CityData } from '../data/cities';
import { HourlyForecastPoint, AqiInfo, pm25ToAqi } from '../utils/aqi';
import { useLanguage } from '../context/LanguageContext';
import { AqiPictogram } from './AqiPictogram';

interface AirClockSectionProps {
  selectedCity: CityData;
  forecast: HourlyForecastPoint[];
  activeHourIndex: number;
  onSelectHour: (index: number) => void;
  onOpenSubscribe?: () => void;
  onOpenEmergency?: () => void;
  onOpenDirectives?: () => void;
  isAlertDismissed?: boolean;
  onDismissAlert?: () => void;
}

export const AirClockSection: React.FC<AirClockSectionProps> = ({
  selectedCity,
  forecast,
  activeHourIndex,
  onSelectHour,
  onOpenSubscribe,
  onOpenEmergency,
  onOpenDirectives,
  isAlertDismissed = false,
  onDismissAlert
}) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);

  // Active point
  const activePoint = forecast[activeHourIndex] || forecast[0];
  const aqiInfo: AqiInfo = pm25ToAqi(activePoint.medianPm25);

  // Play/Pause loop
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        onSelectHour((activeHourIndex + 1) % forecast.length);
      }, 750);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, activeHourIndex, forecast.length, onSelectHour]);

  // Synthesis metrics over 24 hours
  const synthesis = useMemo(() => {
    if (!forecast.length) return { avgAqi: 0, worstPoint: null, cleanestPoint: null, safeHours: 0 };
    const avgAqi = Math.round(forecast.reduce((acc, p) => acc + p.aqi, 0) / forecast.length);
    const worstPoint = [...forecast].sort((a, b) => b.aqi - a.aqi)[0];
    const cleanestPoint = [...forecast].sort((a, b) => a.aqi - b.aqi)[0];
    const safeHours = forecast.filter(p => p.aqi <= 100).length;
    return { avgAqi, worstPoint, cleanestPoint, safeHours };
  }, [forecast]);

  // Radial geometry helpers
  const cx = 175;
  const cy = 175;
  const innerRadius = 78;
  const baseOuterRadius = 125;
  const maxOuterRadius = 160;

  // Max PM2.5 in forecast for proportional radial height
  const maxForecastPm = Math.max(...forecast.map(p => p.medianPm25), 100);

  return (
    <section id="air-clock-section" className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 mb-10 scroll-mt-20">
      {/* Full-width Top Red Emergency Alert Bar: ONLY when AQI > 300 (Very Poor / Severe) */}
      {!isAlertDismissed && activePoint.aqi > 300 && (
        <div className="w-full mb-5 rounded-2xl bg-[#ffdad6]/90 backdrop-blur-md border border-[#ba1a1a]/30 text-[#93000a] p-3.5 shadow-sm transition-all overflow-hidden animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Alert Information */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 w-full lg:w-auto">
              <div className="w-6 h-6 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 alert-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <span className="font-extrabold tracking-wide uppercase px-2 py-0.5 rounded bg-[#ba1a1a] text-white text-[10px] shrink-0 font-sans">
                  {t('highEpisodicAlert')}
                </span>
                <span className="text-[#570e0e] font-semibold text-xs leading-tight">
                  {t('episodicAlertDesc', { city: selectedCity.name, aqi: activePoint.aqi, category: activePoint.category })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenSubscribe && (
                <button
                  onClick={onOpenSubscribe}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/85 hover:bg-white text-[#93000a] font-bold border border-[#ba1a1a]/20 shadow-xs transition-colors active:scale-95 cursor-pointer text-xs"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{t('subscribeAlerts')}</span>
                </button>
              )}

              {onOpenEmergency && (
                <button
                  onClick={onOpenEmergency}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold shadow-xs transition-colors active:scale-95 cursor-pointer text-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-red-200" />
                  <span>{t('emergency108Btn')}</span>
                </button>
              )}

              {onOpenDirectives && (
                <button
                  onClick={onOpenDirectives}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/85 hover:bg-white text-[#93000a] font-bold border border-[#ba1a1a]/20 transition-colors active:scale-95 cursor-pointer text-xs"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{t('advisoryDirectivesBtn')}</span>
                </button>
              )}

              {onDismissAlert && (
                <button
                  onClick={onDismissAlert}
                  aria-label="Dismiss Alert"
                  className="p-1 rounded-lg hover:bg-black/5 text-[#93000a]/70 hover:text-[#93000a] transition-colors ml-1 active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#4d5d70] block font-sans">
            {t('heroBadge')}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight font-sans">
            {t('airClockHeading')}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-[#4d5d70] font-semibold">
            {t('scrubHourHelp')}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14202e] hover:bg-[#000713] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play the Day</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Hourly Forecast Dial */}
        <div className="lg:col-span-5 flex flex-col">
          <div
            className="glass-panel rounded-2xl p-5 border border-[#14202e]/15 flex flex-col justify-between flex-1 shadow-sm"
            data-a11y-summary={t('a11yMainAqiCardSummary', {
              city: selectedCity.name,
              aqi: activePoint.aqi,
              category: activePoint.category,
              pm25: activePoint.medianPm25
            })}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#14202e]/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00b050]" />
                <h3 className="text-sm font-extrabold text-[#0c1d2d]">
                  {selectedCity.name} Hourly Forecast Dial
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/80 border border-[#14202e]/10 text-[#4d5d70]">
                Local Time Synced
              </span>
            </div>

            {/* SVG Radial Chronometer */}
            <div className="relative py-4 flex items-center justify-center">
              <svg
                id="dial"
                viewBox="0 0 350 350"
                className="w-full max-w-[280px] sm:max-w-[320px] aspect-square select-none overflow-visible"
              >
                {/* 24 Hour Radial Wedges */}
                {forecast.map((point, index) => {
                  const anglePerSegment = 360 / 24;
                  // Start at top (-90 degrees)
                  const startAngle = -90 + index * anglePerSegment;
                  const endAngle = startAngle + anglePerSegment;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  // Proportional radial height based on PM2.5
                  const outerRad =
                    baseOuterRadius +
                    ((point.medianPm25 / maxForecastPm) * (maxOuterRadius - baseOuterRadius));

                  const x1 = cx + innerRadius * Math.cos(startRad);
                  const y1 = cy + innerRadius * Math.sin(startRad);
                  const x2 = cx + outerRad * Math.cos(startRad);
                  const y2 = cy + outerRad * Math.sin(startRad);
                  const x3 = cx + outerRad * Math.cos(endRad);
                  const y3 = cy + outerRad * Math.sin(endRad);
                  const x4 = cx + innerRadius * Math.cos(endRad);
                  const y4 = cy + innerRadius * Math.sin(endRad);

                  const pathD = `M ${x1} ${y1} L ${x2} ${y2} A ${outerRad} ${outerRad} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`;

                  const isCurrentActive = index === activeHourIndex;

                  return (
                    <g key={point.hourIndex} className="cursor-pointer">
                      <path
                        d={pathD}
                        fill={point.color}
                        fillOpacity={isCurrentActive ? 1.0 : 0.8}
                        stroke={isCurrentActive ? '#14202e' : 'rgba(255,255,255,0.7)'}
                        strokeWidth={isCurrentActive ? 2.8 : 0.75}
                        onClick={() => onSelectHour(index)}
                        className="transition-all duration-150 hover:opacity-100 hover:brightness-105"
                      />
                    </g>
                  );
                })}

                {/* Hour cardinal marks (00, 06, 12, 18) */}
                <text x="175" y="16" textAnchor="middle" className="text-[10px] font-mono font-bold fill-[#4d5d70]">
                  00
                </text>
                <text x="340" y="179" textAnchor="middle" className="text-[10px] font-mono font-bold fill-[#4d5d70]">
                  06
                </text>
                <text x="175" y="344" textAnchor="middle" className="text-[10px] font-mono font-bold fill-[#4d5d70]">
                  12
                </text>
                <text x="10" y="179" textAnchor="middle" className="text-[10px] font-mono font-bold fill-[#4d5d70]">
                  18
                </text>

                {/* Inner White Hub Disc */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={innerRadius - 4}
                  fill="#ffffff"
                  stroke="rgba(20, 32, 46, 0.14)"
                  strokeWidth="1.5"
                  className="filter drop-shadow-sm"
                />

                {/* Center Readouts */}
                <foreignObject
                  x={cx - (innerRadius - 6)}
                  y={cy - (innerRadius - 6)}
                  width={(innerRadius - 6) * 2}
                  height={(innerRadius - 6) * 2}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 select-none">
                    <span className="text-[11px] font-bold text-[#4d5d70] leading-none mb-1">
                      {activePoint.hourLabel} {activeHourIndex === 0 ? '(Current)' : '(Forecast)'}
                    </span>
                    <span
                      key={`${selectedCity.id}-${activeHourIndex}-${activePoint.aqi}`}
                      className="text-[44px] font-black leading-none tracking-tight font-sans tabular-nums text-[#0c1d2d] animate-aqi-display"
                      style={{ color: '#0c1d2d' }}
                    >
                      {activePoint.aqi}
                    </span>
                    <span
                      className="text-[12px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 mb-0.5"
                      style={{
                        backgroundColor: aqiInfo.badgeBg,
                        color: aqiInfo.textColor
                      }}
                    >
                      {activePoint.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#75777c]">
                      {activePoint.medianPm25} µg/m³ PM2.5
                    </span>
                  </div>
                </foreignObject>
              </svg>
            </div>

            {/* One-line explanation if forecast differs from current station reading */}
            {(activeHourIndex !== 0 || Math.abs(activePoint.medianPm25 - selectedCity.basePm25) > 0.5) && (
              <div className="mt-2 text-center text-xs font-semibold text-slate-700 bg-slate-100/90 py-1.5 px-3 rounded-xl border border-slate-200 font-mono">
                {t('forecastVsLiveNote', { hour: activePoint.hourLabel, livePm: selectedCity.basePm25 })}
              </div>
            )}

            {/* Bottom Dial Legend */}
            <div className="pt-3 border-t border-[#14202e]/10 text-xs font-medium text-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700">Radial Height: PM2.5 (µg/m³)</span>
                <span className="flex items-center gap-1 font-bold text-[#0c1d2d]">
                  <span className="w-2 h-2 rounded-full bg-[#14202e]" />
                  Active Hour Highlight
                </span>
              </div>

              {/* Segmented color spectrum bar (Unified 6-Tier AQI Scale) */}
              <div className="w-full">
                <div className="h-2 rounded-full flex overflow-hidden border border-[#14202e]/15 mb-1.5 shadow-2xs">
                  <div className="flex-1 bg-[#00b050]" title="Good (0-50)" />
                  <div className="flex-1 bg-[#558b2f]" title="Satisfactory (51-100)" />
                  <div className="flex-1 bg-[#d48806]" title="Moderate (101-200)" />
                  <div className="flex-1 bg-[#d45b14]" title="Poor (201-300)" />
                  <div className="flex-1 bg-[#c0392b]" title="Very Poor (301-400)" />
                  <div className="flex-1 bg-[#6e2b26]" title="Severe (401+)" />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-700">
                  <span>Good</span>
                  <span>Satisf.</span>
                  <span>Mod.</span>
                  <span>Poor</span>
                  <span>V. Poor</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hourly Exposure Synthesis + Multi-Horizon Quantile Chart */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Hourly Exposure Synthesis Box */}
          <div
            className="glass-panel rounded-2xl p-5 border border-[#14202e]/15 shadow-sm"
            data-a11y-summary={t('a11yForecastTemplate', {
              city: selectedCity.name,
              avgAqi: synthesis.avgAqi,
              cleanestHour: synthesis.cleanestPoint?.hourLabel || activePoint.hourLabel,
              cleanestAqi: synthesis.cleanestPoint?.aqi ?? activePoint.aqi,
              worstHour: synthesis.worstPoint?.hourLabel || activePoint.hourLabel,
              worstAqi: synthesis.worstPoint?.aqi ?? activePoint.aqi
            })}
          >
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4d5d70] block mb-1">
              {t('exposureSynthesis')}
            </span>
            <p className="text-sm sm:text-[15px] text-[#0c1d2d] leading-relaxed mb-3">
              {t('exposureSynthesisTemplate', {
                hour: activePoint.displayHour,
                city: selectedCity.name,
                pm25: activePoint.medianPm25,
                aqi: activePoint.aqi,
                category: activePoint.category,
                ventilation: activePoint.medianPm25 < 60 ? t('clearing') : t('stagnant'),
                inversion: 450
              })}
            </p>

            {/* Advisory Directive banner */}
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
              aqiInfo.aqi <= 100
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : aqiInfo.aqi <= 200
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-red-50/80 border-red-200 text-red-900'
            }`}>
              {aqiInfo.aqi <= 100 ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <div className="font-bold mb-0.5">
                  {aqiInfo.aqi <= 100
                    ? t('inhalerAdvice')
                    : aqiInfo.aqi <= 200
                    ? t('recommendedTriage')
                    : t('urgentCareCall108')}
                </div>
                <div className="text-[11px] opacity-90">
                  {t('cleanestWindow')}: <span className="font-mono font-bold">{synthesis.cleanestPoint?.hourLabel}</span>.
                </div>
              </div>
            </div>

            {/* Animated Hourly Forecast Pictogram */}
            <AqiPictogram
              aqi={activePoint.aqi}
              cityKey={`${selectedCity.id}-${activeHourIndex}`}
              className="mt-3"
            />
          </div>

          {/* Multi-Horizon Quantile Distribution (80% Range) Chart */}
          <div
            className="glass-panel rounded-2xl p-5 border border-[#14202e]/15 flex-1 flex flex-col justify-between shadow-sm"
            data-a11y-summary={t('a11yChart24hSummary', {
              city: selectedCity.name,
              minPm: synthesis.cleanestPoint?.medianPm25 ?? activePoint.medianPm25,
              maxPm: synthesis.worstPoint?.medianPm25 ?? activePoint.medianPm25,
              cleanestHour: synthesis.cleanestPoint?.hourLabel || activePoint.hourLabel,
              worstHour: synthesis.worstPoint?.hourLabel || activePoint.hourLabel
            })}
          >
            <p className="sr-only">
              {t('a11yChart24hSummary', {
                city: selectedCity.name,
                minPm: synthesis.cleanestPoint?.medianPm25 ?? activePoint.medianPm25,
                maxPm: synthesis.worstPoint?.medianPm25 ?? activePoint.medianPm25,
                cleanestHour: synthesis.cleanestPoint?.hourLabel || activePoint.hourLabel,
                worstHour: synthesis.worstPoint?.hourLabel || activePoint.hourLabel
              })}
            </p>
            <div className="flex items-center justify-between pb-3 border-b border-[#14202e]/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1f6feb]" />
                <h3 className="text-sm font-extrabold text-[#0c1d2d]">
                  {t('confidenceEnvelope')}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold">
                TreeSHAP Calibrated
              </span>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="py-2 flex-1">
              <MultiHorizonChart
                forecast={forecast}
                activeHourIndex={activeHourIndex}
                onSelectHour={onSelectHour}
              />
            </div>

            {/* Chart Legend */}
            <div className="pt-2 border-t border-[#14202e]/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#4d5d70]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-4 h-0.5 bg-[#00b050]" />
                  <span>{t('pm25Mass')}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-4 h-2 bg-amber-500/25 border border-amber-500/40 rounded-xs" />
                  <span>{t('confidenceEnvelope')}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#75777c]">
                {t('scrubHourHelp')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Sub-component: High-precision SVG Chart for 80% Quantile Envelope and Median Forecast
interface ChartProps {
  forecast: HourlyForecastPoint[];
  activeHourIndex: number;
  onSelectHour: (index: number) => void;
}

const MultiHorizonChart: React.FC<ChartProps> = ({
  forecast,
  activeHourIndex,
  onSelectHour
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 640;
  const height = 240;
  const padding = { top: 24, right: 30, bottom: 38, left: 48 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Max scale calculation
  const maxVal = Math.max(...forecast.map(p => p.q90Pm25), 120);
  const yMax = Math.ceil(maxVal / 30) * 30;

  const getX = (index: number) => padding.left + (index / (forecast.length - 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - (val / yMax) * chartH;

  // Build polygon path for 80% Confidence Interval envelope (q10 to q90)
  const ciPolygonPoints = useMemo(() => {
    if (!forecast.length) return '';
    const upperPoints = forecast.map((p, i) => `${getX(i)},${getY(p.q90Pm25)}`).join(' ');
    const lowerPoints = [...forecast]
      .reverse()
      .map((p, i) => {
        const originalIndex = forecast.length - 1 - i;
        return `${getX(originalIndex)},${getY(p.q10Pm25)}`;
      })
      .join(' ');
    return `${upperPoints} ${lowerPoints}`;
  }, [forecast, yMax]);

  // Build polyline path for median predicted line
  const medianLinePoints = useMemo(() => {
    return forecast.map((p, i) => `${getX(i)},${getY(p.medianPm25)}`).join(' ');
  }, [forecast, yMax]);

  // Major time ticks for X-axis
  const xTickIndices = [0, 4, 8, 12, 16, 20, 23];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none overflow-visible"
      >
        <defs>
          <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7f27" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffc000" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Background AQI Threshold Bands */}
        {/* Good zone: 0 - 30 */}
        <rect
          x={padding.left}
          y={getY(30)}
          width={chartW}
          height={getY(0) - getY(30)}
          fill="#00b050"
          fillOpacity="0.08"
        />
        {/* Satisfactory zone: 30 - 60 */}
        <rect
          x={padding.left}
          y={getY(60)}
          width={chartW}
          height={getY(30) - getY(60)}
          fill="#558b2f"
          fillOpacity="0.08"
        />
        {/* Moderate zone: 60 - 90 */}
        <rect
          x={padding.left}
          y={getY(90)}
          width={chartW}
          height={getY(60) - getY(90)}
          fill="#d48806"
          fillOpacity="0.08"
        />
        {/* Poor zone: 90 - 120 */}
        <rect
          x={padding.left}
          y={getY(120)}
          width={chartW}
          height={getY(90) - getY(120)}
          fill="#d45b14"
          fillOpacity="0.08"
        />

        {/* Horizontal grid lines & Y labels */}
        {[0, 30, 60, 90, 120].filter(v => v <= yMax).map(val => (
          <g key={val}>
            <line
              x1={padding.left}
              y1={getY(val)}
              x2={width - padding.right}
              y2={getY(val)}
              stroke="rgba(20, 32, 46, 0.15)"
              strokeDasharray={val === 0 ? 'none' : '3 3'}
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={getY(val) + 4}
              textAnchor="end"
              className="text-[12px] font-mono font-bold fill-[#1e293b]"
            >
              {val}
            </text>
          </g>
        ))}

        {/* X-axis ticks & labels */}
        {xTickIndices.map(idx => {
          const point = forecast[idx];
          if (!point) return null;
          return (
            <g key={idx}>
              <line
                x1={getX(idx)}
                y1={padding.top}
                x2={getX(idx)}
                y2={padding.top + chartH}
                stroke="rgba(20, 32, 46, 0.1)"
                strokeWidth="1"
              />
              <text
                x={getX(idx)}
                y={padding.top + chartH + 20}
                textAnchor="middle"
                className="text-[12px] font-mono font-bold fill-[#0f172a]"
              >
                {point.hourLabel}
              </text>
            </g>
          );
        })}

        {/* 80% Confidence Interval Shaded Polygon */}
        <polygon
          points={ciPolygonPoints}
          fill="url(#ciGradient)"
          stroke="#ff7f27"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* Active Scrub Line (Vertical highlight) */}
        <line
          x1={getX(activeHourIndex)}
          y1={padding.top}
          x2={getX(activeHourIndex)}
          y2={padding.top + chartH}
          stroke="#14202e"
          strokeWidth="1.8"
          strokeDasharray="3 3"
        />

        {/* Median Predicted PM2.5 Polyline */}
        <polyline
          points={medianLinePoints}
          fill="none"
          stroke="#00b050"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Circular interactive data points */}
        {forecast.map((point, i) => {
          const isSelected = i === activeHourIndex;
          const isHovered = i === hoveredIndex;
          const cxPos = getX(i);
          const cyPos = getY(point.medianPm25);

          return (
            <g
              key={i}
              className="cursor-pointer"
              onClick={() => onSelectHour(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible larger hit target */}
              <circle cx={cxPos} cy={cyPos} r="10" fill="transparent" />

              {/* Halo ring for active/hovered */}
              {(isSelected || isHovered) && (
                <circle
                  cx={cxPos}
                  cy={cyPos}
                  r={isSelected ? '7' : '6'}
                  fill="none"
                  stroke="#14202e"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              )}

              {/* Solid point marker */}
              <circle
                cx={cxPos}
                cy={cyPos}
                r={isSelected ? '4.5' : '3'}
                fill={point.color}
                stroke="#ffffff"
                strokeWidth={isSelected ? '2' : '1.2'}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
