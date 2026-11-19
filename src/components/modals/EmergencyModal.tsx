import React from 'react';
import { X, PhoneCall, AlertTriangle, HeartPulse, Stethoscope, ShieldAlert } from 'lucide-react';
import { CityData } from '../../data/cities';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  selectedCity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ba1a1a] bg-red-50 px-2 py-0.5 rounded border border-red-200">
              NATIONAL EMERGENCY RESPONSE
            </span>
            <h3 className="text-base font-extrabold text-[#0c1d2d] mt-0.5">
              Cardiopulmonary &amp; Smog Triage (108)
            </h3>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#ba1a1a] mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Severe Atmospheric Inversion Alert: {selectedCity.name}</span>
          </div>
          <p className="text-[11px] text-[#570e0e] leading-relaxed">
            If you or a family member is suffering from acute dyspnea, wheezing unresponsive to bronchodilators,
            or pulse oximeter SpO2 &lt; 93%, dial 108 immediately for mobile oxygen support.
          </p>
        </div>

        <div className="space-y-3 mb-5 text-xs text-[#0c1d2d]">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <Stethoscope className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">1. Immediate First-Line Medical Action</strong>
              <span>Administer 2–4 puffs of prescribed Salbutamol (SABA) through a spacer. Keep the patient seated upright; do not lie flat.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <HeartPulse className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">2. Monitor Pulse Oximetry</strong>
              <span>Place probe on warm finger. If SpO2 drops below 92% (or 88% for severe COPD), initiate supplemental oxygen if prescribed.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">3. In-Transit Preparation</strong>
              <span>Ensure the patient wears a well-fitted N95 respirator during ambulance or private vehicular transfer.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:108"
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Dial National Emergency 108</span>
          </a>

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
