import React from 'react';
import { Database, Satellite, ShieldCheck, ExternalLink } from 'lucide-react';

export const DataSourceCredits: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full py-3 px-4 rounded-2xl bg-white/70 backdrop-blur-md border border-[#14202e]/10 shadow-xs text-xs text-slate-700 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#1f6feb] shrink-0" />
          <span className="font-extrabold uppercase tracking-wider text-[#0c1d2d] text-[11px]">
            Verified Authoritative Data Sources:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-semibold text-[11px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
            <Satellite className="w-3.5 h-3.5 text-blue-600" />
            <span>Copernicus Atmosphere (CAMS)</span>
          </span>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Central Pollution Control Board (CAAQMS)</span>
          </span>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span>Argos Atlas Planetary Sensor Mesh</span>
          </span>
        </div>
      </div>
    </div>
  );
};
