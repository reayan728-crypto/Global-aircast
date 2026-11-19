import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, ShieldCheck, Smartphone, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AlertSubscribeBannerProps {
  onOpenSubscribe: () => void;
}

interface SubscriberData {
  phone: string;
  countryCode?: string;
  channel: 'whatsapp' | 'sms' | 'both';
  threshold: string;
  cityName: string;
}

export const AlertSubscribeBanner: React.FC<AlertSubscribeBannerProps> = ({
  onOpenSubscribe
}) => {
  const { t } = useLanguage();
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null);

  useEffect(() => {
    const checkSubscriber = () => {
      try {
        const saved = localStorage.getItem('aircast_alert_subscriber');
        if (saved) {
          setSubscriber(JSON.parse(saved));
        } else {
          setSubscriber(null);
        }
      } catch (e) {
        console.debug('Error reading subscriber:', e);
      }
    };

    checkSubscriber();
    window.addEventListener('storage', checkSubscriber);
    return () => window.removeEventListener('storage', checkSubscriber);
  }, []);

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-10">
      <div className="rounded-2xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-[#14202e]/15 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Left info */}
        <div className="flex items-center gap-3.5 flex-1 min-w-[280px]">
          <div className="w-10 h-10 rounded-xl bg-[#14202e] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-5 h-5 text-[#bfe3ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="text-sm font-black text-[#0c1d2d]">
                {t('verifyAndAlerts')}
              </h3>
              {subscriber ? (
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{t('phoneVerifiedActive')}</span>
                </span>
              ) : (
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                  {t('verificationRequired')}
                </span>
              )}
            </div>
            <p className="text-xs text-[#44474c] leading-tight">
              {subscriber ? (
                <span>
                  {t('activeAlertsSentVia', {
                    channel: subscriber.channel.toUpperCase(),
                    phone: `${subscriber.countryCode || '+91'} ${subscriber.phone}`,
                    threshold: subscriber.threshold
                  })}
                </span>
              ) : (
                t('alertBannerDesc')
              )}
            </p>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSubscribe}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 hover:translate-y-[-1px] cursor-pointer ${
              subscriber
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-[#14202e] hover:bg-[#000713] text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
            <span>{subscriber ? t('manageAlertsTest') : t('verifyAndSubscribe')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
