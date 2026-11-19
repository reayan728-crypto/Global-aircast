import React from 'react';
import { X, Clock, MapPin, Droplets, Moon, Info, CheckCircle2 } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-[#14202e]/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1f6feb] flex items-center justify-center font-bold">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0c1d2d]">
                How AirCast Works
              </h3>
              <p className="text-xs text-slate-500">
                Plain-language explanations of atmospheric science &amp; data terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical terms in plain language */}
        <div className="space-y-4 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {/* Term 1: Hourly Forecast */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center gap-2 mb-1 text-[#0c1d2d] font-bold">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Hourly Forecast (formerly "Chronometer")</span>
            </div>
            <p className="text-slate-600">
              Pollution follows a daily rhythm. Afternoon sunlight creates rising warm air currents that dilute smoke (cleanest window), while evening traffic and nighttime cooling trap pollutants near the surface.
            </p>
          </div>

          {/* Term 2: Nearby Stations */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center gap-2 mb-1 text-[#0c1d2d] font-bold">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Nearby Stations (formerly "Planetary Mesh")</span>
            </div>
            <p className="text-slate-600">
              Continuous Ambient Air Quality Monitoring Stations (CAAQMS) use beta-attenuation monitors (BAM-1020) and optical laser sensors on the ground to measure exact micro-particulate mass in real time.
            </p>
          </div>

          {/* Term 3: Humidity */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center gap-2 mb-1 text-[#0c1d2d] font-bold">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span>Humidity (formerly "Hygroscopic Humidity")</span>
            </div>
            <p className="text-slate-600">
              When humidity is high, water vapor clings to microscopic combustion particles. This makes the particles swell in mass, causing haze to linger longer and penetrate deeper into airways.
            </p>
          </div>

          {/* Term 4: Night-time Air Trapping */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center gap-2 mb-1 text-[#0c1d2d] font-bold">
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Night-time Air Trapping (formerly "Nocturnal Boundary Inversion")</span>
            </div>
            <p className="text-slate-600">
              At night, the ground cools down faster than the air above it. This puts a "cold lid" over the city that prevents smoke and car exhaust from rising and dispersing, keeping pollution concentrated close to the ground until morning sunlight warms the surface.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#14202e] hover:bg-[#000713] text-white text-xs font-bold cursor-pointer transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
