import React from 'react';
import { X, Info, Shield, CheckCircle2 } from 'lucide-react';
import { CityData } from '../../data/cities';

interface DirectivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
}

export const DirectivesModal: React.FC<DirectivesModalProps> = ({
  isOpen,
  onClose,
  selectedCity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#14202e]/15 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#14202e] text-white flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-[#bfe3ff]" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#14202e] bg-[#eef4ff] px-2 py-0.5 rounded border border-[#14202e]/10">
              OFFICIAL EPISODIC PROTOCOL
            </span>
            <h3 className="text-base font-extrabold text-[#0c1d2d] mt-0.5">
              Atmospheric Advisory Directives
            </h3>
          </div>
        </div>

        <p className="text-xs text-[#44474c] mb-4 leading-relaxed">
          Standard operational directives for continuous ambient air management in <strong className="text-[#0c1d2d]">{selectedCity.name}</strong> under Stage-III/IV Graded Response Action Plan (GRAP).
        </p>

        <div className="space-y-3 mb-6 text-xs text-[#0c1d2d]">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-extrabold text-[#0c1d2d] mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#14202e]" />
              <span>Phase 1: Vulnerable Demographic Shielding</span>
            </div>
            <p className="text-[11px] text-[#4d5d70] leading-relaxed">
              Mandatory transition of primary school instruction (Grades Nursery to 5) to virtual/hybrid classrooms when AQI exceeds 300 for 48 consecutive hours.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-extrabold text-[#0c1d2d] mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phase 2: Indoor Air Sanitation</span>
            </div>
            <p className="text-[11px] text-[#4d5d70] leading-relaxed">
              Deploy HEPA H13 filtration devices in continuous recirculation mode. Avoid open flame combustion including mosquito spirals and incense.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-extrabold text-[#0c1d2d] mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#14202e]" />
              <span>Phase 3: Urban Transit &amp; Freight Curbs</span>
            </div>
            <p className="text-[11px] text-[#4d5d70] leading-relaxed">
              Entry ban on non-essential diesel medium/heavy goods vehicles (BS-IV or older). Strict odd-even registration compliance if nocturnal inversion lid persists.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#14202e] text-white text-xs font-bold hover:bg-[#000713] transition-colors"
        >
          Acknowledge &amp; Return
        </button>
      </div>
    </div>
  );
};
