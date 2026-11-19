import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AuthoritativePortals: React.FC = () => {
  const { t } = useLanguage();
  const portals = [
    {
      title: 'CPCB AQI Portal',
      subtitle: 'National Air Quality Index (India)',
      url: 'https://cpcb.nic.in'
    },
    {
      title: 'WHO Air Quality',
      subtitle: 'Global Health Impact Guidelines',
      url: 'https://www.who.int/health-topics/air-pollution'
    },
    {
      title: 'SAFAR MoES',
      subtitle: 'System of Air Quality Forecasting',
      url: 'http://safar.tropmet.res.in'
    },
    {
      title: 'Copernicus CAMS & API',
      subtitle: 'ECMWF Atmospheric Mesh Data',
      url: 'https://atmosphere.copernicus.eu'
    }
  ];

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#0c1d2d]">
          <Globe className="w-4 h-4 text-[#3f627a]" />
          <span className="uppercase tracking-wider font-extrabold text-[11px]">
            {t('authoritativeStandards')}
          </span>
        </div>
        <span className="text-[11px] text-[#4d5d70]">
          {t('officialRealTimeMonitoring')}
        </span>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {portals.map((portal, i) => (
          <a
            key={i}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl glass-panel hover:bg-white/95 border-[#14202e]/12 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-[#0c1d2d] group-hover:text-[#1f6feb] transition-colors">
                {portal.title}
              </div>
              <div className="text-[11px] text-[#75777c]">
                {portal.subtitle}
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1f6feb] transition-colors shrink-0 ml-2" />
          </a>
        ))}
      </div>
    </section>
  );
};
