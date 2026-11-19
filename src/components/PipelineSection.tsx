import React from 'react';
import { Globe, Cpu, BarChart3, Binary, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PipelineSection: React.FC = () => {
  const { t } = useLanguage();
  const steps = [
    {
      num: 1,
      icon: Globe,
      title: 'Planetary Ingestion',
      desc: 'Continuous streaming of Copernicus CAMS aerosol & ERA5 10m wind vector dynamics.',
      tag: '0.1° Grid Resolution'
    },
    {
      num: 2,
      icon: Binary,
      title: 'Feature Engineering',
      desc: 'Autoregressive 24h lags, rush-hour diurnal peaks, and nocturnal thermal trapping layers.',
      tag: 'Non-linear Interaction'
    },
    {
      num: 3,
      icon: BarChart3,
      title: 'LightGBM Quantiles',
      desc: '24 distinct hourly quantile models predict median and 10th-90th probability envelopes.',
      tag: '80% Range Enclosed'
    },
    {
      num: 4,
      icon: Cpu,
      title: 'TreeSHAP Physics',
      desc: 'Deconstructs hourly predictions into exact wind, humidity, and vehicular force contributions.',
      tag: 'Zero Black-Box Guessing'
    },
    {
      num: 5,
      icon: ShieldCheck,
      title: 'CPCB Health Guidance',
      desc: 'Converts microgram mass concentrations into standardized AQI alerts and outdoor exposure windows.',
      tag: 'Clean Window Dispatch'
    }
  ];

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-10">
      {/* Header */}
      <div className="mb-5">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4d5d70] block">
          {t('neuralArchitecture')}
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight font-sans">
          {t('fiveStepPipeline')}
        </h2>
      </div>

      {/* 5 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
        {steps.map(step => {
          const IconComp = step.icon;
          return (
            <div
              key={step.num}
              className="glass-panel rounded-2xl p-4 border border-[#14202e]/12 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-6 h-6 rounded-full bg-[#14202e] text-white text-[11px] font-mono font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                  <IconComp className="w-4 h-4 text-[#3f627a]" />
                </div>

                <h3 className="text-xs font-black text-[#0c1d2d] mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[11px] text-[#44474c] leading-relaxed mb-3">
                  {step.desc}
                </p>
              </div>

              <div className="text-[10px] font-mono font-semibold text-[#4d5d70] pt-2 border-t border-[#14202e]/8">
                {step.tag}
              </div>
            </div>
          );
        })}
      </div>

      {/* Held-Out Test Validation & Error Metrics */}
      <div className="glass-panel rounded-2xl p-5 border border-[#14202e]/15 flex flex-wrap items-center justify-between gap-6 shadow-xs">
        <div className="max-w-md">
          <div className="text-xs font-black text-[#0c1d2d] mb-1">
            {t('heldOutValidation')}
          </div>
          <div className="text-[11px] text-[#44474c] leading-relaxed">
            {t('heldOutDesc')}
          </div>
        </div>

        <div className="flex items-center gap-8 sm:gap-12">
          {/* KPI 1 */}
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl sm:text-3xl font-black text-[#00b050] tabular-nums font-sans">
                8.4
              </span>
              <span className="text-xs font-mono font-bold text-[#4d5d70]">µg/m³</span>
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#75777c] font-bold">
              Mean Test MAE (vs 19.8 baseline)
            </div>
          </div>

          {/* KPI 2 */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-[#0c1d2d] tabular-nums font-sans">
              0.81
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#75777c] font-bold">
              R² Explained Variance
            </div>
          </div>

          {/* KPI 3 */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-[#0c1d2d] tabular-nums font-sans">
              83%
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#75777c] font-bold">
              80% Interval Coverage
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
