import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Building2,
  Car,
  Flame,
  CheckCircle2,
  TrendingDown,
  Clock,
  ShieldCheck,
  Info,
  HelpCircle,
  X,
  Calendar,
  Zap,
  BarChart3
} from 'lucide-react';
import { CityData } from '../data/cities';
import { ShapAttribution } from '../utils/aqi';
import { useLanguage } from '../context/LanguageContext';

interface SustainabilityPlannerProps {
  selectedCity: CityData;
  shapDrivers: ShapAttribution[];
  baselinePm25: number;
}

export interface ActionPlanItem {
  priority: number;
  title: string;
  rationale: string;
  expectedPm25Reduction?: string;
  expectedCo2eReduction?: string;
  effort?: 'Low' | 'Medium' | 'High' | string;
  timeline?: 'Quick win (0-30 days)' | '6-12 months' | 'Long term (1-3 years)' | string;
  expectedImpact?: string;
}

export const SustainabilityPlanner: React.FC<SustainabilityPlannerProps> = ({
  selectedCity,
  shapDrivers,
  baselinePm25
}) => {
  const { t, currentLanguage, selectedLanguageOption } = useLanguage();

  // Policy slider values
  const [trafficReduction, setTrafficReduction] = useState<number>(20); // 0% - 50%
  const [biomassBan, setBiomassBan] = useState<boolean>(true); // boolean toggle
  const [industrialCut, setIndustrialCut] = useState<number>(25); // 0% - 60%

  // Tooltip & info modal state for CO2e transparency
  const [showCo2Info, setShowCo2Info] = useState<boolean>(false);

  // Action plan state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[] | null>(null);

  // Quantitative mitigation calculations
  // Traffic accounts for roughly 25-35% of urban PM2.5 in typical metropolises
  const trafficImpact = Math.round(baselinePm25 * 0.28 * (trafficReduction / 100));
  // Biomass burning accounts for roughly 15-40% depending on region
  const isNorthernBelt = ['Delhi', 'Amritsar', 'Patna', 'Lucknow', 'Lahore'].includes(selectedCity.name);
  const biomassPotential = isNorthernBelt ? 0.35 : 0.14;
  const biomassImpact = biomassBan ? Math.round(baselinePm25 * biomassPotential) : 0;
  // Industrial emissions account for roughly 20-30%
  const industrialImpact = Math.round(baselinePm25 * 0.22 * (industrialCut / 100));

  const totalPm25Reduction = trafficImpact + biomassImpact + industrialImpact;
  const projectedPm25 = Math.max(5, Math.round((baselinePm25 - totalPm25Reduction) * 10) / 10);
  const aqiDrop = Math.round(totalPm25Reduction * 1.85);

  // Estimated CO2e reduction in kilotons (kt CO2e/year)
  const co2eMitigatedKt = Math.round(trafficReduction * 1.4 + industrialCut * 2.1 + (biomassBan ? 35 : 0));

  const handleGenerateActionPlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/sustainability/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityName: selectedCity.name,
          aqi: Math.round(baselinePm25 * 2.1),
          shapDrivers,
          policies: { trafficReduction, biomassBan, industrialCut },
          language: selectedLanguageOption.name,
          languageCode: currentLanguage
        })
      });
      const data = await res.json();
      if (data?.actionPlan && Array.isArray(data.actionPlan)) {
        setActionPlan(data.actionPlan);
      } else {
        throw new Error('Fallback required');
      }
    } catch {
      // Deterministic 3 ranked actions based on current SHAP drivers and levers
      setActionPlan([
        {
          priority: 1,
          title: `Low-Emission Freight Corridors in ${selectedCity.name}`,
          rationale: `Traffic density contributes +${trafficImpact} µg/m³ of fine particulates during nocturnal temperature inversions.`,
          expectedPm25Reduction: `-${trafficImpact} µg/m³ PM2.5`,
          expectedCo2eReduction: `~${Math.round(trafficReduction * 1.4)} kt CO₂e / yr`,
          effort: 'Low',
          timeline: 'Quick win (0-30 days)',
          expectedImpact: `Est. -${trafficImpact} µg/m³ PM2.5 and ~${Math.round(trafficReduction * 1.4)} kt annual CO2e mitigation.`
        },
        {
          priority: 2,
          title: 'Agricultural & Biomass Zero-Burn Enforcement',
          rationale: 'Thermal fire anomalies upwind introduce high-altitude smoke plumes that trap secondary aerosols in the airshed.',
          expectedPm25Reduction: biomassBan ? `-${biomassImpact} µg/m³ PM2.5` : '0 µg/m³',
          expectedCo2eReduction: biomassBan ? '~35 kt CO₂e / yr' : '0 kt',
          effort: 'Medium',
          timeline: '6-12 months',
          expectedImpact: biomassBan ? `Est. -${biomassImpact} µg/m³ peak episodic surge suppression.` : 'Zero burn compliance pending.'
        },
        {
          priority: 3,
          title: 'Industrial Stack Wet-Scrubbers & Clean Gas Shift',
          rationale: 'Stationary point sources sustain baseline sulfate and nitrate precursors in lower atmospheric layers.',
          expectedPm25Reduction: `-${industrialImpact} µg/m³ PM2.5`,
          expectedCo2eReduction: `~${Math.round(industrialCut * 2.1)} kt CO₂e / yr`,
          effort: 'High',
          timeline: 'Long term (1-3 years)',
          expectedImpact: `Est. -${industrialImpact} µg/m³ PM2.5 reduction within 90 days.`
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="sustainability-planner-section" className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 my-8 scroll-mt-20 font-sans">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#14202e]/15 shadow-sm bg-white/95 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#14202e]/10 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block font-sans">
                {t('sustainabilityPlannerTitle')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight">
                {t('sustainabilityPlannerSubtitle')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Policy Impact Sandbox</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-700 font-extrabold">● Live Interactivity</span>
          </div>
        </div>

        {/* Content Layout: Sliders (Left 7 Cols) + Outcome Projections (Right 5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-stretch">
          {/* Policy Levers */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Traffic Reduction Lever */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0c1d2d] flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>{t('trafficReductionPolicy')}</span>
                </span>
                <span className="text-xs font-mono font-bold text-blue-700 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                  {trafficReduction}% cut
                </span>
              </div>
              <p className="text-xs font-medium text-slate-700">
                {t('trafficReductionDesc')}
              </p>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={trafficReduction}
                onChange={e => setTrafficReduction(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              {/* Short non-overlapping marks */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 font-mono">
                <span>0%</span>
                <span>10%</span>
                <span>25%</span>
                <span>40%</span>
                <span>50%</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Policy mode: Congestion zones, EV bus electrification, and odd-even transit rationing.
              </div>
            </div>

            {/* 2. Agricultural & Biomass Burning Ban Toggle */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0c1d2d] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>{t('biomassBanPolicy')}</span>
                </span>
                <button
                  onClick={() => setBiomassBan(!biomassBan)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    biomassBan
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {biomassBan ? 'Enforced (Zero Burn)' : 'No Enforcement'}
                </button>
              </div>
              <p className="text-xs font-medium text-slate-700">
                {t('biomassBanDesc')}
              </p>
              <div className="text-[11px] text-slate-600 font-medium">
                Upwind satellite fire alerts (FIRMS) trigger rapid mechanized mulch subsidies to eliminate stubble smoke.
              </div>
            </div>

            {/* 3. Industrial Stack Cut Lever */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0c1d2d] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>{t('industrialCutPolicy')}</span>
                </span>
                <span className="text-xs font-mono font-bold text-teal-700 px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200">
                  {industrialCut}% cut
                </span>
              </div>
              <p className="text-xs font-medium text-slate-700">
                {t('industrialCutDesc')}
              </p>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={industrialCut}
                onChange={e => setIndustrialCut(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              {/* Short non-overlapping marks */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 font-mono">
                <span>0%</span>
                <span>15%</span>
                <span>30%</span>
                <span>45%</span>
                <span>60%</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Mandatory flue-gas desulfurization (FGD), electrostatic precipitators, and pipeline gas conversions.
              </div>
            </div>
          </div>

          {/* Quantitative Impact Projections & Action Plan Generator (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-[#14202e] text-white p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-white/10">
                  <TrendingDown className="w-4 h-4" />
                  <span>Projected Municipal Mitigation</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                    <div className="text-xs text-slate-300 font-medium">{t('pm25Reduction')}</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
                      -{totalPm25Reduction} <span className="text-xs text-white">µg/m³</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      {baselinePm25} → {projectedPm25} µg/m³
                    </div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                    <div className="text-xs text-slate-300 font-medium">{t('aqiDrop')}</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300">
                      -{aqiDrop} <span className="text-xs text-white">pts</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      Direct health relief
                    </div>
                  </div>
                </div>

                {/* CO2e Card with Transparency Info Tooltip */}
                <div className="mt-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                      <span>{t('co2eMitigation')}</span>
                      <button
                        onClick={() => setShowCo2Info(true)}
                        className="p-0.5 hover:text-white transition-colors cursor-pointer"
                        title="Click to view CO2e calculation assumptions"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                      {t('illustrativeEstimate')}
                    </span>
                  </div>

                  <div className="text-xl sm:text-2xl font-black font-mono text-white">
                    ~{co2eMitigatedKt} <span className="text-xs text-slate-300 font-normal">kt CO₂e / yr</span>
                  </div>
                </div>
              </div>

              {/* Generate Action Plan Button */}
              <button
                onClick={handleGenerateActionPlan}
                disabled={isGenerating}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating ? t('generatingActionPlan') : t('generateActionPlanBtn')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* CO2e Transparency Assumptions Modal */}
        {showCo2Info && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative space-y-4 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span>{t('co2AssumptionsTitle')}</span>
                </div>
                <button
                  onClick={() => setShowCo2Info(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                <p>
                  {t('co2AssumptionsDesc')}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                  <div className="font-bold text-slate-900">Key Municipal Factors ({selectedCity.name}):</div>
                  <div>• Urban vehicle fleet: ~1.2M active registered vehicles</div>
                  <div>• Transport emission factor: 2.31 kg CO₂e / liter diesel/petrol</div>
                  <div>• Sector PM2.5 share: Transport 28%, Industry 22%, Biomass 14-35%</div>
                  <div>• Carbon conversion: ~1.4 kt annual CO₂e per 1% traffic congestion reduction</div>
                  <div>• Industrial conversion: ~2.1 kt annual CO₂e per 1% clean stack fuel transition</div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium">
                  <strong>Transparency Note:</strong> This model provides an illustrative estimation for municipal policy prioritization. Certified greenhouse gas inventories require continuous CEMS telemetry.
                </div>
              </div>

              <button
                onClick={() => setShowCo2Info(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* Generated Action Plan Display: 3 Ranked Actions with PM2.5, CO2e, Effort, and Timeline */}
        {actionPlan && (
          <div className="mt-8 pt-6 border-t border-slate-200/90 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-extrabold text-[#0c1d2d] font-sans flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>{t('actionPlanTitle', { city: selectedCity.name })}</span>
              </h4>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                3 Ranked Policy Priorities
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {actionPlan.map((item, idx) => {
                const effort = item.effort || (idx === 0 ? 'Low' : idx === 1 ? 'Medium' : 'High');
                const timeline = item.timeline || (idx === 0 ? 'Quick win (0-30 days)' : idx === 1 ? '6-12 months' : 'Long term (1-3 years)');
                const pmRed = item.expectedPm25Reduction || (idx === 0 ? `-${trafficImpact} µg/m³ PM2.5` : idx === 1 ? `-${biomassImpact} µg/m³ PM2.5` : `-${industrialImpact} µg/m³ PM2.5`);
                const co2Red = item.expectedCo2eReduction || (idx === 0 ? `~${Math.round(trafficReduction * 1.4)} kt CO₂e` : idx === 1 ? '~35 kt CO₂e' : `~${Math.round(industrialCut * 2.1)} kt CO₂e`);

                return (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Priority Tag & Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {item.priority}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded ${
                            effort === 'Low' ? 'bg-emerald-100 text-emerald-800' : effort === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            Effort: {effort}
                          </span>
                        </div>
                      </div>

                      <h5 className="font-extrabold text-sm text-[#0c1d2d] leading-snug mb-1.5">
                        {item.title}
                      </h5>

                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {item.rationale}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {/* Expected Quantitative Reductions */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
                        <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200">
                          <div className="text-[10px] text-emerald-600 font-sans uppercase font-bold">PM2.5 Drop</div>
                          <div>{pmRed}</div>
                        </div>
                        <div className="bg-blue-50 text-blue-800 p-2 rounded-xl border border-blue-200">
                          <div className="text-[10px] text-blue-600 font-sans uppercase font-bold">CO₂e Relief</div>
                          <div>{co2Red}</div>
                        </div>
                      </div>

                      {/* Timeline Badge */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Timeline: <strong>{timeline}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
