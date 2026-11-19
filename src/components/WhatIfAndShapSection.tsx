import React, { useMemo, useState } from 'react';
import { Sliders, RotateCcw, Cpu, HelpCircle, CheckCircle2 } from 'lucide-react';
import { CityData } from '../data/cities';
import { SimulationParams, ShapAttribution, generate24HourForecast, pm25ToAqi, computeSimulatedPm25 } from '../utils/aqi';
import { useLanguage } from '../context/LanguageContext';

export interface WhatIfSimulatorProps {
  selectedCity: CityData;
  params: SimulationParams;
  onChangeParams: (newParams: SimulationParams) => void;
  onResetParams: () => void;
}

export const WhatIfSimulatorSection: React.FC<WhatIfSimulatorProps> = ({
  selectedCity,
  params,
  onChangeParams,
  onResetParams
}) => {
  const { t } = useLanguage();

  // Compute live updated simulated forecast result right next to sliders
  const simulatedForecast = useMemo(() => {
    return generate24HourForecast(selectedCity, params, new Date().getHours());
  }, [selectedCity, params]);

  const currentSimPoint = simulatedForecast[0];
  const simAqiData = pm25ToAqi(currentSimPoint.medianPm25);

  return (
    <section id="what-if-section" className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 my-8 scroll-mt-20 font-sans">
      <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-[#14202e]/15 shadow-sm bg-white/95">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#14202e]/10 mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Sliders className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block font-sans">
                Predictive Sensitivity Controls
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight">
                {t('whatIfHeading')}
              </h3>
            </div>
          </div>
          <button
            onClick={onResetParams}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#0c1d2d] bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-xs cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('resetInputs')}</span>
          </button>
        </div>

        {/* 2-Column Grid: Left Sliders, Right Live HUD & Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Sliders with Min/Max Labels */}
          <div className="lg:col-span-7 space-y-4">
            {/* Wind Speed Slider */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-extrabold mb-1">
                <span className="text-[#0c1d2d]">{t('windSpeed')}</span>
                <span className="font-mono text-xs font-bold text-[#0c1d2d] bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {params.windSpeed.toFixed(1)} km/h
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                step="0.5"
                value={params.windSpeed}
                onChange={e =>
                  onChangeParams({ ...params, windSpeed: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14202e]"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-700 mt-1 font-mono">
                <span>Min: 2 km/h</span>
                <span className="text-slate-500 font-normal">Baseline: {selectedCity.baseWind} km/h</span>
                <span>Max: 40 km/h</span>
              </div>
            </div>

            {/* Relative Humidity Slider */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-extrabold mb-1">
                <span className="text-[#0c1d2d]">{t('humidity')}</span>
                <span className="font-mono text-xs font-bold text-[#0c1d2d] bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {Math.round(params.humidity)} %
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="95"
                step="1"
                value={params.humidity}
                onChange={e =>
                  onChangeParams({ ...params, humidity: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14202e]"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-700 mt-1 font-mono">
                <span>Min: 15%</span>
                <span className="text-slate-500 font-normal">Baseline: {selectedCity.baseHumidity}%</span>
                <span>Max: 95%</span>
              </div>
            </div>

            {/* Surface Temperature Slider */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-extrabold mb-1">
                <span className="text-[#0c1d2d]">{t('surfaceTempLabel')}</span>
                <span className="font-mono text-xs font-bold text-[#0c1d2d] bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {Math.round(params.temp)} °C
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={params.temp}
                onChange={e =>
                  onChangeParams({ ...params, temp: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14202e]"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-700 mt-1 font-mono">
                <span>Min: 10°C</span>
                <span className="text-slate-500 font-normal">Baseline: {selectedCity.baseTemp}°C</span>
                <span>Max: 45°C</span>
              </div>
            </div>

            {/* Traffic Multiplier Slider */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-extrabold mb-1">
                <span className="text-[#0c1d2d]">{t('trafficMultiplier')}</span>
                <span className="font-mono text-xs font-bold text-[#0c1d2d] bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {params.trafficMultiplier.toFixed(1)} ×
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={params.trafficMultiplier}
                onChange={e =>
                  onChangeParams({ ...params, trafficMultiplier: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14202e]"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-700 mt-1 font-mono">
                <span>Min: 0.3×</span>
                <span className="text-slate-500 font-normal">Normal: 1.0×</span>
                <span>Max: 2.5×</span>
              </div>
            </div>

            {/* Baseline PM2.5 Slider */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-extrabold mb-1">
                <span className="text-[#0c1d2d]">{t('baselinePm25')}</span>
                <span className="font-mono text-xs font-bold text-[#0c1d2d] bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {params.currentPm25} µg/m³
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="280"
                step="2"
                value={params.currentPm25}
                onChange={e =>
                  onChangeParams({ ...params, currentPm25: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14202e]"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-700 mt-1 font-mono">
                <span>Min: 10 µg/m³</span>
                <span className="text-slate-500 font-normal">Live Station: {selectedCity.basePm25} µg/m³</span>
                <span>Max: 280 µg/m³</span>
              </div>
            </div>

            {/* Diwali / Festival Smoke Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-[#0c1d2d] block">
                  {t('diwaliMode')}
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {t('diwaliDesc')}
                </span>
              </div>
              <button
                onClick={() => onChangeParams({ ...params, diwaliMode: !params.diwaliMode })}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                  params.diwaliMode ? 'bg-[#ff7f27]' : 'bg-slate-300'
                }`}
                aria-label="Toggle firecracker smoke burst"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    params.diwaliMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: LIVE SIMULATION RESULT HUD */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-[#14202e] text-white p-6 rounded-3xl border border-white/10 shadow-xl space-y-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Simulation Output</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    {selectedCity.name}
                  </span>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-white/10 border border-white/10 space-y-3">
                  <div className="text-xs font-medium text-slate-300">
                    {t('simForecastResult')} ({selectedCity.name})
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black font-sans text-white tabular-nums tracking-tight">
                      AQI {simAqiData.aqi}
                    </span>
                    <span
                      className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg"
                      style={{
                        backgroundColor: simAqiData.badgeBg,
                        color: '#ffffff'
                      }}
                    >
                      {simAqiData.category}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Simulated PM2.5:</span>
                    <span className="text-emerald-400 font-black text-sm">
                      {currentSimPoint.medianPm25} µg/m³
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Baseline Ground Sensor:</span>
                    <span className="text-slate-200 font-semibold">
                      {selectedCity.basePm25} µg/m³
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/5">
                    <span className="text-slate-400">Net Physics Shift (Δ):</span>
                    <span className={`font-bold ${currentSimPoint.medianPm25 > selectedCity.basePm25 ? 'text-orange-400' : currentSimPoint.medianPm25 < selectedCity.basePm25 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {currentSimPoint.medianPm25 >= selectedCity.basePm25 ? '+' : ''}{(currentSimPoint.medianPm25 - selectedCity.basePm25).toFixed(1)} µg/m³
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white block mb-1">Dispersion Mechanics:</span>
                Changes applied here dynamically update the 24-hour neural forecast and feed into the Sustainability Policy Planner below.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export interface TreeShapDriversProps {
  selectedCity: CityData;
  params: SimulationParams;
  shapDrivers: ShapAttribution[];
}

export const TreeShapDriversSection: React.FC<TreeShapDriversProps> = ({
  selectedCity,
  params,
  shapDrivers
}) => {
  const { t } = useLanguage();
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);

  const simulatedPm = computeSimulatedPm25(selectedCity, params);
  const baselinePm = selectedCity.basePm25;
  const netDiff = Math.round((simulatedPm - baselinePm) * 10) / 10;
  const sumForces = Math.round(shapDrivers.reduce((acc, d) => acc + d.force, 0) * 10) / 10;

  // Maximum magnitude for centered SHAP scaling
  const maxAbsForce = Math.max(35, ...shapDrivers.map(d => Math.abs(d.force)));

  const positiveDrivers = [...shapDrivers].filter(d => d.force > 0).sort((a, b) => b.force - a.force);
  const negativeDrivers = [...shapDrivers].filter(d => d.force < 0).sort((a, b) => a.force - b.force);

  const primaryAccumulator = positiveDrivers[0] || shapDrivers[3];
  const primaryDisperser = negativeDrivers[0] || shapDrivers[0];

  const getDriverLabel = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wind')) return t('windDriver');
    if (lower.includes('humid')) return t('humidityDriver');
    if (lower.includes('temp')) return t('tempDriver');
    if (lower.includes('traffic')) return t('trafficDriver');
    if (lower.includes('night') || lower.includes('trap')) return t('nightTrappingDriver');
    if (lower.includes('fire') || lower.includes('diwali')) return t('firecrackersDriver');
    if (lower.includes('inert')) return t('inertiaDriver');
    return name;
  };

  const shapSummaryText = t('a11yShapChartSummary', {
    city: selectedCity.name,
    baseline: baselinePm,
    simulated: simulatedPm,
    topUp: primaryAccumulator ? getDriverLabel(primaryAccumulator.driver) : '',
    topDown: primaryDisperser ? getDriverLabel(primaryDisperser.driver) : ''
  });

  return (
    <section id="shap-drivers-section" className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 my-8 scroll-mt-20 font-sans">
      <div
        className="glass-panel rounded-3xl p-5 sm:p-7 border border-[#14202e]/15 shadow-sm bg-white/95"
        data-a11y-summary={shapSummaryText}
      >
        <p className="sr-only">{shapSummaryText}</p>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#14202e]/10 mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block font-sans">
                {t('shapDrivers')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight">
                {t('shapTitle')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Σ Forces: {sumForces > 0 ? `+${sumForces}` : sumForces} µg/m³</span>
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 hidden sm:inline">
              TreeSHAP v0.42
            </span>
          </div>
        </div>

        <p className="text-xs text-[#334155] mb-4 leading-relaxed font-normal">
          {t('shapAttributionDesc')} Each force mathematically resolves: <span className="font-mono font-bold text-slate-900">Baseline ({baselinePm} µg/m³) + Σ SHAP forces ({sumForces > 0 ? `+${sumForces}` : sumForces} µg/m³) = Simulated ({simulatedPm} µg/m³)</span>.
        </p>

        {/* Centered Scale Header Guide */}
        <div className="flex items-center justify-between text-xs font-mono font-bold px-3 py-1.5 mb-3 bg-slate-100 rounded-xl border border-slate-200">
          <span className="text-[#00b050] font-semibold">{t('negativeForcesVentilate')}</span>
          <span className="text-[#d45b14] font-semibold">{t('positiveForcesPush')}</span>
        </div>

        {/* SHAP Waterfall / Force Bar Rows on Centered Axis */}
        <div className="space-y-3">
          {shapDrivers.map((item, idx) => {
            const isNegative = item.force < 0;
            const isZero = item.force === 0;
            // Accurately scaled width percentage relative to max half-scale (48%)
            const barWidthPercent = isZero ? 0 : Math.min(48, (Math.abs(item.force) / maxAbsForce) * 48);

            return (
              <div
                key={idx}
                className="group relative p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                onMouseEnter={() => setHoveredDriver(item.driver)}
                onMouseLeave={() => setHoveredDriver(null)}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-extrabold text-[#0c1d2d] flex items-center gap-1.5 cursor-help">
                    <span>{getDriverLabel(item.driver)}</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </span>
                  <span
                    className={`font-mono font-black tabular-nums text-xs ${
                      isNegative
                        ? 'text-[#00b050]'
                        : isZero
                        ? 'text-slate-500'
                        : 'text-[#d45b14]'
                    }`}
                  >
                    {item.force > 0 ? `+${item.force.toFixed(1)}` : item.force.toFixed(1)} µg/m³
                  </span>
                </div>

                {/* Visual Force Track with Centered 50% Zero-Axis */}
                <div className="w-full h-4 bg-slate-200 rounded-full relative overflow-hidden flex items-center">
                  {/* Centered Zero Line Indicator */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-600 z-20 shadow-xs" />

                  {/* Negative Bar: Expands Leftwards from Center (50%) */}
                  {isNegative && (
                    <div
                      className="absolute top-0 bottom-0 bg-[#00b050] rounded-l-full transition-all duration-300"
                      style={{
                        right: '50%',
                        width: `${barWidthPercent}%`
                      }}
                    />
                  )}

                  {/* Positive Bar: Expands Rightwards from Center (50%) */}
                  {!isNegative && !isZero && (
                    <div
                      className="absolute top-0 bottom-0 bg-[#d45b14] rounded-r-full transition-all duration-300"
                      style={{
                        left: '50%',
                        width: `${barWidthPercent}%`
                      }}
                    />
                  )}
                </div>

                {/* Plain Language Tooltip for each Driver */}
                <div className={`mt-1.5 text-xs text-slate-700 transition-all ${
                  hoveredDriver === item.driver ? 'block font-semibold text-blue-950 bg-blue-50 p-2 rounded-xl border border-blue-200' : 'text-slate-600 font-medium'
                }`}>
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom SHAP Physical Summary */}
        <div className="mt-5 pt-4 border-t border-[#14202e]/10 text-xs text-slate-700">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed space-y-1">
            <div>
              <strong className="font-extrabold text-[#0c1d2d]">Physical Attribution Summary:</strong> Primary accumulation driver is{' '}
              <span className="font-bold text-[#d45b14]">{primaryAccumulator?.driver}</span>{' '}
              ({primaryAccumulator?.force > 0 ? `+${primaryAccumulator.force.toFixed(1)}` : primaryAccumulator?.force.toFixed(1)} µg/m³).{' '}
              Strongest clearing force is{' '}
              <span className="font-bold text-[#00b050]">{primaryDisperser?.driver}</span>{' '}
              ({primaryDisperser?.force.toFixed(1)} µg/m³).
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              Identity verified: Baseline {baselinePm} µg/m³ {netDiff >= 0 ? `+ ${netDiff}` : netDiff} µg/m³ = {simulatedPm} µg/m³ simulated concentration.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export interface WhatIfAndShapSectionProps {
  selectedCity: CityData;
  params: SimulationParams;
  onChangeParams: (newParams: SimulationParams) => void;
  onResetParams: () => void;
  shapDrivers: ShapAttribution[];
}

export const WhatIfAndShapSection: React.FC<WhatIfAndShapSectionProps> = ({
  selectedCity,
  params,
  onChangeParams,
  onResetParams,
  shapDrivers
}) => {
  return (
    <div className="w-full space-y-6">
      <WhatIfSimulatorSection
        selectedCity={selectedCity}
        params={params}
        onChangeParams={onChangeParams}
        onResetParams={onResetParams}
      />
      <TreeShapDriversSection
        selectedCity={selectedCity}
        params={params}
        shapDrivers={shapDrivers}
      />
    </div>
  );
};
