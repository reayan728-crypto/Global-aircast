import React, { useState, useEffect } from 'react';
import { X, Code2, Copy, Check, Lock, Unlock, KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { CityData } from '../../data/cities';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
}

const API_AUTH_STORAGE_KEY = 'aircast_api_authenticated_v1';
const REQUIRED_PASSWORD = 'March21';

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({
  isOpen,
  onClose,
  selectedCity
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'json' | 'schema'>('curl');

  // Check saved session on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = sessionStorage.getItem(API_AUTH_STORAGE_KEY);
      if (stored === 'true') {
        setIsAuthenticated(true);
      }
      setErrorMessage('');
      setPasswordInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput.trim() === REQUIRED_PASSWORD) {
      setIsAuthenticated(true);
      setErrorMessage('');
      try {
        sessionStorage.setItem(API_AUTH_STORAGE_KEY, 'true');
      } catch {
        // Ignore storage errors if disabled
      }
    } else {
      setErrorMessage('Access denied. Incorrect authorization password.');
    }
  };

  const handleLockSession = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setErrorMessage('');
    try {
      sessionStorage.removeItem(API_AUTH_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const curlCommand = `curl -X GET "https://api.aircast.geo/v1/forecast/24h?station=${selectedCity.id}&quantiles=0.10,0.50,0.90&include_shap=true" \\
  -H "Authorization: Bearer aircast_live_token" \\
  -H "Accept: application/json"`;

  const jsonSample = `{
  "status": "success",
  "meta": {
    "station_id": "${selectedCity.id}",
    "station_name": "${selectedCity.stationName}",
    "coordinates": [${selectedCity.lat}, ${selectedCity.lng}],
    "cams_mesh_cycle": "2025-10-21T06:00:00Z",
    "calibration_model": "LightGBM-TreeSHAP-v2.4"
  },
  "current_telemetry": {
    "aqi": 96,
    "pm25_ug_m3": ${selectedCity.basePm25},
    "category": "Satisfactory",
    "boundary_layer_height_m": 420
  },
  "forecast_24h": [
    {
      "horizon_hour": "19:00",
      "median_pm25": 58.2,
      "quantile_10": 46.1,
      "quantile_90": 74.8,
      "aqi": 96,
      "shap_attributions": {
        "wind_dispersion": -0.8,
        "hygroscopic_humidity": +0.7,
        "rush_hour_traffic": +6.0,
        "nocturnal_inversion": +2.9
      }
    }
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-[#14202e]/15 relative max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-[#14202e] text-white flex items-center justify-center shrink-0 shadow-sm">
            {isAuthenticated ? (
              <Code2 className="w-5 h-5 text-[#bfe3ff]" />
            ) : (
              <Lock className="w-5 h-5 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isAuthenticated
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
                {isAuthenticated ? 'AUTHORIZED ACCESS' : 'RESTRICTED API'}
              </span>
              {isAuthenticated && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Session
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0c1d2d] mt-0.5 leading-tight">
              AirCast Developer &amp; Research API
            </h3>
          </div>
        </div>

        {/* Password Gate Screen if NOT Authenticated */}
        {!isAuthenticated ? (
          <div className="py-2 sm:py-4 flex-1 flex flex-col justify-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-[#0c1d2d]">Authorization Required</p>
                  <p className="leading-relaxed">
                    Access to developer credentials, live sensor endpoints, and machine learning TreeSHAP attribution matrices is restricted to authorized partners, municipal agencies, and credentialed researchers.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0c1d2d] mb-1.5">
                  Enter Developer Access Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter access passphrase"
                    autoFocus
                    className={`w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                      errorMessage
                        ? 'border-red-400 focus:ring-red-200 text-red-900'
                        : 'border-slate-300 focus:border-[#14202e] focus:ring-[#14202e]/10 text-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMessage && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium animate-shake">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#14202e] hover:bg-[#000713] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock API Access</span>
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Security Tier: L2 Sandbox &amp; Live Feeds</span>
              <span>Passphrase protected</span>
            </div>
          </div>
        ) : (
          /* Authenticated API Documentation */
          <>
            {/* Tab controls & Lock Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#14202e]/10 pb-2 mb-4 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'curl'
                      ? 'bg-[#14202e] text-white shadow-xs'
                      : 'text-[#44474c] hover:bg-slate-100'
                  }`}
                >
                  cURL Request
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'json'
                      ? 'bg-[#14202e] text-white shadow-xs'
                      : 'text-[#44474c] hover:bg-slate-100'
                  }`}
                >
                  JSON Response
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'schema'
                      ? 'bg-[#14202e] text-white shadow-xs'
                      : 'text-[#44474c] hover:bg-slate-100'
                  }`}
                >
                  Parameters &amp; Schema
                </button>
              </div>

              <button
                onClick={handleLockSession}
                title="Lock session and clear authorization"
                className="self-end sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 text-[11px] font-semibold border border-transparent hover:border-red-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock API</span>
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto mb-4 pr-1">
              {activeTab === 'curl' && (
                <div className="relative">
                  <pre className="p-3.5 sm:p-4 rounded-xl bg-[#0c1d2d] text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
                    {curlCommand}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCurl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'json' && (
                <pre className="p-3.5 sm:p-4 rounded-xl bg-[#0c1d2d] text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
                  {jsonSample}
                </pre>
              )}

              {activeTab === 'schema' && (
                <div className="space-y-2.5 text-xs text-[#0c1d2d]">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1f6feb]">station</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">required</span>
                    </div>
                    <span className="text-[11px] text-[#75777c] font-mono block mt-0.5">string</span>
                    <p className="text-[11px] text-[#4d5d70] mt-1">
                      Unique station ID or CPCB CAAQMS sensor identifier (e.g. <code className="bg-slate-200/50 px-1 rounded text-slate-800">coimbatore</code>, <code className="bg-slate-200/50 px-1 rounded text-slate-800">delhi</code>, <code className="bg-slate-200/50 px-1 rounded text-slate-800">mumbai</code>).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1f6feb]">quantiles</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">optional</span>
                    </div>
                    <span className="text-[11px] text-[#75777c] font-mono block mt-0.5">comma-separated floats</span>
                    <p className="text-[11px] text-[#4d5d70] mt-1">
                      Ensemble probability envelope bounds. Defaults to <code className="bg-slate-200/50 px-1 rounded text-slate-800">0.10,0.50,0.90</code> (80% confidence interval).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1f6feb]">include_shap</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">optional</span>
                    </div>
                    <span className="text-[11px] text-[#75777c] font-mono block mt-0.5">boolean (true | false)</span>
                    <p className="text-[11px] text-[#4d5d70] mt-1">
                      Returns local TreeSHAP attribution forces for wind advection, hygroscopic growth, and traffic load.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#14202e]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#75777c] text-[11px]">
                API Rate Limit: 10,000 requests/day on authorized tier.
              </span>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#14202e] text-white font-bold hover:bg-[#000713] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
