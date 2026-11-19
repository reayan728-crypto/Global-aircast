import React, { useState } from 'react';
import {
  Clock,
  Shield,
  Home,
  HeartPulse,
  Activity,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Ban,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { CityData } from '../data/cities';
import { HourlyForecastPoint } from '../utils/aqi';
import { generatePdfReport } from '../utils/generatePdfReport';
import { useLanguage } from '../context/LanguageContext';

interface ClinicalProtocolSectionProps {
  selectedCity: CityData;
  currentForecastPoint: HourlyForecastPoint;
}

export const ClinicalProtocolSection: React.FC<ClinicalProtocolSectionProps> = ({
  selectedCity,
  currentForecastPoint
}) => {
  const { t } = useLanguage();
  const currentAqi = currentForecastPoint.aqi;
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      generatePdfReport(selectedCity, currentForecastPoint);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 mb-10 font-sans">
      {/* Prominent Mandatory Medical Disclaimer */}
      <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-[13px] leading-relaxed">
          <strong className="font-bold">{t('medicalDisclaimer')}:</strong> {t('medicalDisclaimerText')}
        </div>
      </div>

      {/* Header with Download Report Action & Collapsible Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#00b050]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#4d5d70]">
              {t('respiratoryGuidelines')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight font-sans">
            {t('aqiSafetyProtocol')}
          </h2>
          <p className="text-xs sm:text-[13px] text-[#44474c] mt-1 max-w-3xl leading-relaxed">
            {t('evidenceBasedPrecautions', {
              city: selectedCity.name,
              aqi: currentAqi,
              category: currentForecastPoint.category
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse/Expand Toggle to Shorten Page */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <span>{isExpanded ? t('collapseGuidelines') : t('viewGuidelines')}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Download Report Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14202e] hover:bg-[#000713] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{t('downloaded')}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-[#bfe3ff]" />
                <span>{isGenerating ? t('generatingActionPlan') : t('downloadReport')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="animate-fade-in space-y-6">
          {/* 3 Protocol Cards (Harmonized 6-Tier AQI Scale) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: AQI 0 - 100 (Good & Satisfactory) */}
            <div
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                currentAqi <= 100
                  ? 'bg-white shadow-md ring-2 ring-[#00b050] border-transparent'
                  : 'glass-panel border-[#14202e]/12'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#14202e]/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00b050]" />
                    <h3 className="text-sm font-extrabold text-[#0c1d2d]">
                      AQI 0 – 100
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {t('goodAndSatisfactory')}
                  </span>
                </div>

                <p className="text-xs text-[#44474c] mb-4 leading-relaxed font-normal">
                  Particulate concentrations remain low. Ideal for outdoor training and standard daily activities.
                </p>

                <ul className="space-y-3 text-xs text-[#0c1d2d]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00b050] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Outdoor Activity:</strong> Normal outdoor sports and exercise safe for all groups.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Wind className="w-4 h-4 text-[#00b050] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Home Ventilation:</strong> Open windows to circulate fresh ambient air and clear indoor carbon dioxide.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[#00b050] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Sensitive Groups:</strong> Standard medical maintenance plan is sufficient.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-[#14202e]/8 text-[11px] font-mono text-emerald-700 font-bold">
                {t('cleanAirWindow')}
              </div>
            </div>

            {/* Card 2: AQI 101 - 300 (Moderate & Poor) */}
            <div
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                currentAqi > 100 && currentAqi <= 300
                  ? 'bg-white shadow-md ring-2 ring-[#d45b14] border-transparent'
                  : 'glass-panel border-[#14202e]/12'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#14202e]/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d45b14]" />
                    <h3 className="text-sm font-extrabold text-[#0c1d2d]">
                      AQI 101 – 300
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                    {t('moderateAndPoor')}
                  </span>
                </div>

                <p className="text-xs text-[#44474c] mb-4 leading-relaxed font-normal">
                  Elevated particulate counts can cause airway irritation, coughing, and discomfort for vulnerable cohorts.
                </p>

                <ul className="space-y-3 text-xs text-[#0c1d2d]">
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#d45b14] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Timing:</strong> Schedule mandatory outdoor walks during afternoon solar apex (12:00–16:00) when air clears.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[#d45b14] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Mask Protection:</strong> Well-fitted N95 / FFP2 respirators filter at least 95% of non-oil particulates <span className="text-[10px] text-slate-500">(Source: NIOSH / EN 149)</span>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#d45b14] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Respiratory Cohorts:</strong> {t('relieverInhalerGuidance')}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-[#14202e]/8 text-[11px] font-mono text-amber-800 font-bold">
                {t('cautionSensitive')}
              </div>
            </div>

            {/* Card 3: AQI 301 - 500+ (Very Poor & Severe) */}
            <div
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                currentAqi > 300
                  ? 'bg-white shadow-md ring-2 ring-[#c0392b] border-transparent'
                  : 'glass-panel border-[#14202e]/12'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#14202e]/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c0392b] alert-pulse" />
                    <h3 className="text-sm font-extrabold text-[#0c1d2d]">
                      AQI 301 – 500+
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-800 uppercase tracking-wider">
                    {t('veryPoorAndSevere')}
                  </span>
                </div>

                <p className="text-xs text-[#44474c] mb-4 leading-relaxed font-normal">
                  Heavy surface temperature inversion locks combustion soot and fine particulate near the ground. Affects all citizens.
                </p>

                <ul className="space-y-3 text-xs text-[#0c1d2d]">
                  <li className="flex items-start gap-2">
                    <Ban className="w-4 h-4 text-[#c0392b] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Avoid Strenuous Cardio:</strong> Move workouts entirely indoors; avoid cycling or running along roadways.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Home className="w-4 h-4 text-[#c0392b] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Indoor Air Filtration:</strong> Run certified true HEPA filters indoors to reduce particulate exposure <span className="text-[10px] text-slate-500">(Source: US EPA Indoor Air Guidance)</span>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <HeartPulse className="w-4 h-4 text-[#c0392b] shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold">Medical Attention:</strong> {t('relieverInhalerGuidance')}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-[#14202e]/8 text-[11px] font-mono text-red-700 font-bold">
                {t('severeTrappingStatus')}
              </div>
            </div>
          </div>

          {/* 4 Micro-Guideline Practical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Outdoor Timing */}
            <div className="glass-panel rounded-2xl p-4 border border-[#14202e]/12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#3f627a]" />
                  <h4 className="text-xs font-extrabold text-[#0c1d2d]">
                    {t('dailyOutdoorTiming')}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Ground air traps smoke overnight and during early morning rush hours. Afternoon sunlight helps clear the lowest air layer.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#14202e]/8 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>{t('optimalWindow')}</span>
              </div>
            </div>

            {/* 2. Mask Standards */}
            <div className="glass-panel rounded-2xl p-4 border border-[#14202e]/12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#3f627a]" />
                  <h4 className="text-xs font-extrabold text-[#0c1d2d]">
                    {t('maskRecommendations')}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Certified N95 or FFP2 respirators fit snugly to filter sub-micron particles. Loose cloth masks leave side gaps where particles enter.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#14202e]/8 flex items-center gap-1.5 text-[11px] font-bold text-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>{t('n95StandardCertified')}</span>
              </div>
            </div>

            {/* 3. Indoor Air Protection */}
            <div className="glass-panel rounded-2xl p-4 border border-[#14202e]/12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-[#3f627a]" />
                  <h4 className="text-xs font-extrabold text-[#0c1d2d]">
                    {t('indoorProtection')}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Avoid burning candles, mosquito coils, or incense during high smog. Clean surfaces with a damp mop instead of dry sweeping.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#14202e]/8 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>{t('wetMopKitchen')}</span>
              </div>
            </div>

            {/* 4. Cohort Safety */}
            <div className="glass-panel rounded-2xl p-4 border border-[#14202e]/12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="w-4 h-4 text-[#3f627a]" />
                  <h4 className="text-xs font-extrabold text-[#0c1d2d]">
                    {t('doctorManagedPlan')}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Patients with asthma, heart illness, or elderly individuals should follow their physician's action plan and keep prescribed relievers accessible.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#14202e]/8 flex items-center gap-1.5 text-[11px] font-bold text-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span>{t('relieverInhalerReadiness')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
