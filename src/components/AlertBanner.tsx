import React from 'react';
import { AlertTriangle, Bell, PhoneCall, Info, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AlertBannerProps {
  cityName: string;
  aqi: number;
  onOpenSubscribe?: () => void;
  onOpenEmergency?: () => void;
  onOpenDirectives?: () => void;
  onDismiss: () => void;
  isDismissed?: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  cityName,
  aqi,
  onOpenSubscribe,
  onOpenEmergency,
  onOpenDirectives,
  onDismiss,
  isDismissed = false
}) => {
  const { t } = useLanguage();

  // Only show alert banner when live AQI is strictly above 300 (Very Poor / Severe)
  if (isDismissed || aqi <= 300) return null;

  const categoryLabel = aqi > 400 ? t('aqiSevere') : t('aqiVeryPoor');

  return (
    <div className="w-full bg-[#ffdad6]/90 backdrop-blur-md border-b border-[#ba1a1a]/30 text-[#93000a] transition-all animate-fade-in">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Alert Information */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="w-6 h-6 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 alert-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="font-extrabold tracking-wide uppercase px-2 py-0.5 rounded bg-[#ba1a1a] text-white text-[10px] shrink-0 font-sans">
              {t('highEpisodicAlert')}
            </span>
            <span className="text-[#570e0e] font-semibold">
              {t('episodicAlertDesc', { city: cityName, aqi, category: categoryLabel })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSubscribe && (
            <button
              onClick={onOpenSubscribe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/70 hover:bg-white text-[#93000a] font-bold border border-[#ba1a1a]/20 shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t('smsWhatsappAlertsBtn')}</span>
            </button>
          )}

          {onOpenEmergency && (
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-200" />
              <span>{t('emergency108Btn')}</span>
            </button>
          )}

          {onOpenDirectives && (
            <button
              onClick={onOpenDirectives}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/70 hover:bg-white text-[#93000a] font-bold border border-[#ba1a1a]/20 transition-colors active:scale-95 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{t('advisoryDirectivesBtn')}</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            aria-label="Dismiss Alert"
            className="p-1 rounded-md hover:bg-black/5 text-[#93000a]/70 hover:text-[#93000a] transition-colors ml-1 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
