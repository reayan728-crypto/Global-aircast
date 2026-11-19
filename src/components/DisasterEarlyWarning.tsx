import React, { useEffect, useRef } from 'react';
import { AlertOctagon, Clock, ShieldAlert, CheckCircle2, CloudLightning } from 'lucide-react';
import { CityData } from '../data/cities';
import { HourlyForecastPoint, pm25ToAqi } from '../utils/aqi';
import { useLanguage } from '../context/LanguageContext';

interface DisasterEarlyWarningProps {
  selectedCity: CityData;
  forecast: HourlyForecastPoint[];
}

export const DisasterEarlyWarning: React.FC<DisasterEarlyWarningProps> = ({
  selectedCity,
  forecast
}) => {
  const { t } = useLanguage();
  const lastAnnouncedKeyRef = useRef<string>('');

  // Find if any point in the 24-hour forecast crosses Severe (>250 µg/m³ PM2.5 or >400 AQI)
  const severePoints = forecast.filter(p => p.medianPm25 >= 250 || pm25ToAqi(p.medianPm25).aqi >= 400);
  const isSevereForecast = severePoints.length > 0;
  const isCycloneRisk = selectedCity.baseWind >= 45;

  // Calculate predicted peak time window
  let peakWindowText = '22:00 – 06:00 (Nocturnal inversion lid)';
  if (severePoints.length > 0) {
    const firstSevere = severePoints[0].displayHour;
    const lastSevere = severePoints[severePoints.length - 1].displayHour;
    peakWindowText = `${firstSevere}:00 – ${lastSevere}:00 (Next 24h Horizon)`;
  }

  useEffect(() => {
    if (!isSevereForecast && !isCycloneRisk) {
      lastAnnouncedKeyRef.current = '';
      return;
    }
    const alertMessage = isSevereForecast
      ? t('disasterEarlyWarningSevere', { city: selectedCity.name })
      : t('disasterEarlyWarningCyclone', { city: selectedCity.name });
    const key = `${selectedCity.id}-${isSevereForecast ? 'sev' : 'cyc'}-${alertMessage}`;
    if (lastAnnouncedKeyRef.current !== key) {
      lastAnnouncedKeyRef.current = key;
      window.AirCastA11y?.announce(alertMessage, 'severe');
    }
  }, [isSevereForecast, isCycloneRisk, selectedCity.id, selectedCity.name, t]);

  // Only render if a real severe hazard is forecast
  if (!isSevereForecast && !isCycloneRisk) {
    return null;
  }

  return (
    <section
      className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 my-6 animate-fade-in"
      data-a11y-summary={
        isSevereForecast
          ? t('disasterEarlyWarningSevere', { city: selectedCity.name })
          : t('disasterEarlyWarningCyclone', { city: selectedCity.name })
      }
    >
      <div className="rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-red-950 via-[#7a1010] to-[#450a0a] text-white shadow-2xl border-2 border-red-500/80 relative overflow-hidden">
        {/* Pulsing hazard background orb */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider border border-white/30 backdrop-blur-md">
              <AlertOctagon className="w-4 h-4 text-red-200 animate-pulse" />
              <span>{t('disasterEarlyWarningTitle')}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-red-200 bg-black/40 px-3 py-1 rounded-xl border border-red-500/30 font-mono">
              <Clock className="w-3.5 h-3.5 text-red-300" />
              <span>{t('predictedPeakWindow', { window: peakWindowText })}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
              {isSevereForecast
                ? t('disasterEarlyWarningSevere', { city: selectedCity.name })
                : t('disasterEarlyWarningCyclone', { city: selectedCity.name })}
            </h3>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1">
              {t('recommendedImmediateActions')}
            </p>
          </div>

          {/* Actionable Protocol Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white leading-relaxed font-medium">
                {t('actionSealIndoors')}
              </p>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white leading-relaxed font-medium">
                {t('actionRespiratorOutdoors')}
              </p>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white leading-relaxed font-medium">
                {t('actionVulnerableShelter')}
              </p>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-white leading-relaxed font-medium">
                {t('actionCityAlert')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
