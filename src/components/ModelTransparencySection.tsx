import React from 'react';
import { Database, Cpu, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ModelTransparencySection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="model-transparency-section" className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 my-8 font-sans">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#14202e]/15 shadow-sm bg-white/95 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#14202e]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block font-sans">
                {t('modelDataTitle')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight">
                {t('modelDataSubtitle')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            <span>AirCast-v2.8-Ensemble</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-700 font-extrabold">Open Science</span>
          </div>
        </div>

        {/* 3 Pillars: Data Provenance, Forecast Architecture, Empirical Validation Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Data Ingestion & Provenance */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-900">
              <Database className="w-4 h-4 text-blue-600" />
              <span>{t('dataProvenance')}</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-2.5 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Copernicus Sentinel-5P:</strong> TROPOMI ultraviolet/visible spectrometer measures total atmospheric column density (CO, NO₂, CH₄).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Ground CAAQMS:</strong> Central Pollution Control Board &amp; international optical/beta-attenuation monitors for real-time PM2.5 and PM10.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>NASA FIRMS:</strong> MODIS and VIIRS high-cadence satellite thermal fire radiometry detects active crop-residue and wildfire anomalies.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Copernicus CAMS:</strong> 0.1° ECMWF meteorological grid providing planetary wind advection, thermal boundaries, and aerosol reanalysis.</span>
              </li>
            </ul>
          </div>

          {/* 2. Forecast Methodology */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-900">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>{t('forecastMethodology')}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              AirCast employs a gradient-boosted decision tree ensemble trained on multi-year diurnal meteorology and aerosol transport physics.
            </p>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950 space-y-1.5 font-medium">
              <div><strong>TreeSHAP Explainability:</strong> Local Shapley force values decompose each hourly forecast into additive physical contributors (wind, humidity, inversion, traffic).</div>
              <div><strong>Quantile Regression:</strong> Computes Q10, Q50, and Q90 confidence intervals for risk bounds.</div>
            </div>
          </div>

          {/* 3. Validation Metrics & Persistence Baseline Comparison */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('validationMetrics')}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                vs Persistence
              </span>
            </div>

            {/* Comparison Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2">Metric</th>
                    <th className="p-2 text-emerald-700 font-extrabold">AirCast</th>
                    <th className="p-2 text-slate-500">Persistence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="p-2 font-bold font-sans">MAE</td>
                    <td className="p-2 text-emerald-700 font-extrabold">6.8 µg/m³</td>
                    <td className="p-2 text-slate-500">14.2 µg/m³</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold font-sans">RMSE</td>
                    <td className="p-2 text-emerald-700 font-extrabold">9.4 µg/m³</td>
                    <td className="p-2 text-slate-500">19.8 µg/m³</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold font-sans">R² Score</td>
                    <td className="p-2 text-emerald-700 font-extrabold">0.912</td>
                    <td className="p-2 text-slate-500">0.640</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-600 leading-normal border-t border-slate-200 pt-2 font-mono">
              *{t('illustrativeDemoValue')}
            </p>
          </div>
        </div>

        {/* Limitations & Scientific Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold block text-amber-900">{t('modelLimitations')}:</span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {t('limitationsText')} Satellite optical gas columns may experience cloud occlusion. Ground telemetry relies on national station reporting schedules. This is general environmental information, not medical advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
