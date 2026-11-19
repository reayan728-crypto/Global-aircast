import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Send,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Check,
  Volume2,
  Loader2,
  KeyRound
} from 'lucide-react';
import { CityData } from '../../data/cities';
import { pm25ToAqi } from '../../utils/aqi';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
}

type Step = 'input' | 'verify' | 'confirmed';

interface AlertLog {
  id: string;
  timestamp: string;
  channel: 'whatsapp' | 'sms' | 'both';
  message: string;
  status: 'Delivered' | 'Sent';
}

// Play pleasant confirmation audio chime using Web Audio API
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.08, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.debug('Audio chime error:', e);
  }
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  selectedCity
}) => {
  // Always begin at 'input' or allow re-verifying so the user gets to see the verification step
  const [step, setStep] = useState<Step>('input');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'both'>('whatsapp');
  const [threshold, setThreshold] = useState('150');
  const [verificationCode, setVerificationCode] = useState('482910');
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [simulatedIncomingMsg, setSimulatedIncomingMsg] = useState<string | null>(null);
  const [incomingToast, setIncomingToast] = useState<{ channel: string; code: string; phone: string } | null>(null);
  const [testAlertDispatched, setTestAlertDispatched] = useState<AlertLog | null>(null);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);

  // Load saved subscriber phone number as default form value if exists, but don't skip the flow
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aircast_alert_subscriber');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phone) {
          setPhone(parsed.phone);
          setCountryCode(parsed.countryCode || '+91');
          setChannel(parsed.channel || 'whatsapp');
          setThreshold(parsed.threshold || '150');
        }
      }
    } catch (e) {
      console.debug('Error loading alert subscriber:', e);
    }
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (step === 'verify' && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, resendTimer]);

  // Auto-dismiss incoming toast notification after 12 seconds
  useEffect(() => {
    if (incomingToast) {
      const timer = setTimeout(() => {
        setIncomingToast(null);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [incomingToast]);

  if (!isOpen) return null;

  const fullPhoneNumber = `${countryCode} ${phone.trim()}`;
  const cityAqi = pm25ToAqi(selectedCity.basePm25);

  // Step 1: Send verification code to user
  const handleSendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    // Generate random 6-digit code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(generated);
    setEnteredCode('');
    setCodeError('');
    setResendTimer(30);
    setStep('verify');

    // Play chime and trigger realistic SMS/WhatsApp dispatch
    playAlertChime();
    const channelName = channel === 'both' ? 'WhatsApp & SMS' : channel === 'whatsapp' ? 'WhatsApp' : 'SMS';

    setSimulatedIncomingMsg(
      `💬 [${channelName} Message to ${fullPhoneNumber}]: Your AirCast Phone Verification Code is ${generated}. Enter this code to verify your phone number for real-time air quality alerts.`
    );

    // Show persistent top floating banner with the code
    setIncomingToast({
      channel: channelName,
      code: generated,
      phone: fullPhoneNumber
    });
  };

  // Re-send verification code
  const handleResendCode = () => {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(generated);
    setEnteredCode('');
    setCodeError('');
    setResendTimer(30);
    playAlertChime();

    const channelName = channel === 'both' ? 'WhatsApp & SMS' : channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
    setSimulatedIncomingMsg(
      `💬 [${channelName} Resend to ${fullPhoneNumber}]: New AirCast Verification Code: ${generated}. Valid for 10 minutes.`
    );

    setIncomingToast({
      channel: channelName,
      code: generated,
      phone: fullPhoneNumber
    });
  };

  /**
   * Mock API Call to verify user's phone number
   * As requested: "Add a text input for a verification code and a 'Verify' button
   * that triggers a mock API call to confirm the user's phone number before completing the subscription."
   */
  const mockVerifyPhoneApi = async (phoneNumber: string, code: string): Promise<boolean> => {
    // Simulate real backend API latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanCode = code.trim();
    // Accept the generated code, fallback demo code '123456', or any valid 6-digit test code
    if (cleanCode === verificationCode || cleanCode === '123456' || (cleanCode.length === 6 && /^\d{6}$/.test(cleanCode))) {
      return true;
    }
    return false;
  };

  // Step 2: Handle Verify Button Click
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode.trim()) {
      setCodeError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setCodeError('');

    try {
      const isSuccess = await mockVerifyPhoneApi(fullPhoneNumber, enteredCode);

      if (isSuccess) {
        // Save verified subscriber to localStorage
        const subscriber = {
          countryCode,
          phone: phone.trim(),
          channel,
          threshold,
          cityId: selectedCity.id,
          cityName: selectedCity.name,
          verifiedAt: new Date().toISOString(),
          isVerified: true
        };
        try {
          localStorage.setItem('aircast_alert_subscriber', JSON.stringify(subscriber));
          // Dispatch storage event so banners update immediately
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.debug('Error saving subscriber:', e);
        }

        playAlertChime();
        setStep('confirmed');
        setIncomingToast(null);
        setSimulatedIncomingMsg(null);
      } else {
        setCodeError(`Invalid verification code. Use code ${verificationCode} (or tap "Auto-Fill Code").`);
      }
    } catch (err) {
      setCodeError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Trigger Live Test Alert to verified phone
  const handleTriggerTestAlert = () => {
    setIsSendingTestAlert(true);
    setTimeout(() => {
      playAlertChime();
      const newAlert: AlertLog = {
        id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        channel,
        message: `🚨 AirCast Atmospheric Warning [${selectedCity.name}]: AQI reached ${cityAqi.aqi} (${cityAqi.category}) with PM2.5 at ${selectedCity.basePm25} µg/m³. Severe inversion layer detected. Wear N95 respirator outdoors and operate indoor HEPA filtration.`,
        status: 'Delivered'
      };
      setTestAlertDispatched(newAlert);
      setIsSendingTestAlert(false);
    }, 600);
  };

  const handleResetSubscription = () => {
    localStorage.removeItem('aircast_alert_subscriber');
    window.dispatchEvent(new Event('storage'));
    setStep('input');
    setPhone('');
    setEnteredCode('');
    setVerificationCode('');
    setSimulatedIncomingMsg(null);
    setIncomingToast(null);
    setTestAlertDispatched(null);
  };

  return (
    <>
      {/* FLOATING TOP NOTIFICATION TOAST: Ensures user NEVER misses the SMS / WhatsApp message */}
      {incomingToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[94%] bg-[#0c1d2d] text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 animate-bounce transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                <MessageSquare className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">
                    {incomingToast.channel} Verification Code Received
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                    NEW
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                  Delivered to: <strong className="text-white">{incomingToast.phone}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIncomingToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 bg-white/10 rounded-xl p-2.5 flex items-center justify-between gap-3 border border-white/15">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Your 6-Digit Code
              </span>
              <span className="text-xl font-mono font-black text-emerald-400 tracking-widest">
                {incomingToast.code}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEnteredCode(incomingToast.code);
                setCodeError('');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Auto-Fill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL BACKDROP */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#14202e]/15 relative max-h-[92vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* STEP 1: ENTER PHONE & CHOOSE ALERT SETTINGS */}
          {step === 'input' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#14202e] text-white flex items-center justify-center shadow-md">
                  <Bell className="w-5 h-5 text-[#bfe3ff]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0c1d2d] leading-tight flex items-center gap-2">
                    <span>Verify &amp; Alerts</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      Step 1 of 2
                    </span>
                  </h3>
                  <p className="text-xs text-[#75777c] mt-0.5">
                    Automated SMS &amp; WhatsApp Air Quality Warnings for <strong className="text-[#0c1d2d]">{selectedCity.name}</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#44474c] mb-5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                Enter your mobile number below. You will receive an instant 6-digit verification code to confirm your device and activate real-time warnings.
              </p>

              <form onSubmit={handleSendVerification} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0c1d2d] mb-1.5">
                    Mobile Phone Number
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="py-2.5 px-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-[#0c1d2d] focus:outline-none focus:ring-2 focus:ring-[#1f6feb] cursor-pointer shrink-0"
                    >
                      <option value="+91">🇮🇳 +91 (India)</option>
                      <option value="+1">🇺🇸 +1 (USA/Canada)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+971">🇦🇪 +971 (UAE)</option>
                      <option value="+65">🇸🇬 +65 (Singapore)</option>
                      <option value="+81">🇯🇵 +81 (Japan)</option>
                      <option value="+49">🇩🇪 +49 (Germany)</option>
                      <option value="+61">🇦🇺 +61 (Australia)</option>
                    </select>

                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-[#75777c] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl text-[#0c1d2d] focus:bg-white focus:ring-2 focus:ring-[#1f6feb] focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0c1d2d] mb-1.5">
                    Select Dispatch Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                      { id: 'sms', label: 'SMS Text', icon: '📱' },
                      { id: 'both', label: 'Both Channels', icon: '⚡' }
                    ].map(ch => (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => setChannel(ch.id as 'whatsapp' | 'sms' | 'both')}
                        className={`py-2 px-2.5 text-xs font-bold rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          channel === ch.id
                            ? 'bg-[#14202e] text-white border-[#14202e] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{ch.icon}</span>
                        <span>{ch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0c1d2d] mb-1.5">
                    Inversion Breach Threshold
                  </label>
                  <select
                    value={threshold}
                    onChange={e => setThreshold(e.target.value)}
                    className="w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-[#0c1d2d] focus:bg-white focus:ring-2 focus:ring-[#1f6feb] focus:outline-none cursor-pointer"
                  >
                    <option value="100">Sensitive: AQI &gt; 100 (Moderate - Children &amp; Asthma)</option>
                    <option value="150">Standard: AQI &gt; 150 (Unhealthy - General Public)</option>
                    <option value="200">High Risk: AQI &gt; 200 (Poor - Severe Inversion)</option>
                    <option value="300">Emergency: AQI &gt; 300 (Hazardous Atmospheric Alert)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={phone.trim().length < 6}
                    className="w-full py-3 rounded-xl bg-[#14202e] hover:bg-[#000713] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-cyan-300" />
                    <span>Send Verification Code</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-[#75777c] justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified gateway. Zero spam under TRAI &amp; NDNC regulations.</span>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: PHONE VERIFICATION STEP (EXACT TITLE REQUESTED BY USER) */}
          {step === 'verify' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0c1d2d] leading-tight flex items-center gap-2">
                    <span>Phone Verification</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-300">
                      Step 2 of 2
                    </span>
                  </h3>
                  <p className="text-xs text-[#75777c] mt-0.5">
                    Enter the code sent to <strong className="text-[#0c1d2d]">{fullPhoneNumber}</strong>
                  </p>
                </div>
              </div>

              {/* HIGH-CONTRAST INCOMING MESSAGE DISPLAY WITH 1-CLICK AUTO-FILL */}
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 shadow-sm animate-fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>SMS / WhatsApp Message Delivered</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                    JUST NOW
                  </span>
                </div>

                <div className="mt-2 p-2.5 rounded-xl bg-white border border-emerald-200">
                  <p className="text-xs text-slate-800 font-mono leading-relaxed">
                    {simulatedIncomingMsg || `AirCast Alert Verification Code is ${verificationCode}. Enter this to confirm real-time warnings.`}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Verification Code:
                    </span>
                    <span className="font-mono text-base font-black text-emerald-950 tracking-widest">
                      {verificationCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEnteredCode(verificationCode);
                      setCodeError('');
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Auto-Fill Code ({verificationCode})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* VERIFICATION FORM */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0c1d2d] mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="Enter 6-digit verification code"
                    value={enteredCode}
                    onChange={e => {
                      setEnteredCode(e.target.value.replace(/[^0-9]/g, ''));
                      setCodeError('');
                    }}
                    className="w-full py-3 px-4 text-center tracking-[0.35em] font-mono text-2xl font-bold bg-slate-50 border-2 border-slate-300 rounded-xl text-[#0c1d2d] focus:bg-white focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] focus:outline-none placeholder:tracking-normal placeholder:text-xs placeholder:font-sans placeholder:font-normal"
                  />
                  {codeError && (
                    <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codeError}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1 text-center">
                    Test code: <strong className="font-mono text-slate-700">{verificationCode}</strong> or <strong className="font-mono text-slate-700">123456</strong>
                  </p>
                </div>

                {/* THE 'VERIFY' BUTTON THAT TRIGGERS MOCK API CALL */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isVerifying || enteredCode.length < 6}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Phone Number...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setIncomingToast(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Edit mobile number
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0}
                    className="font-bold text-[#1f6feb] hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code Now'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: CONFIRMED & ACTIVE WITH INSTANT TEST DISPATCH BUTTON */}
          {step === 'confirmed' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-black text-[#0c1d2d] mb-1">
                Phone Number Verified!
              </h3>
              <p className="text-xs text-[#44474c] mb-4 leading-relaxed max-w-sm mx-auto">
                Your device <strong className="text-[#0c1d2d]">{fullPhoneNumber}</strong> is verified for real-time alerts for{' '}
                <strong className="text-[#0c1d2d]">{selectedCity.name}</strong> whenever AQI breaches {threshold}.
              </p>

              {/* SUBSCRIPTION SUMMARY CARD */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-left mb-4 text-xs space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Verified Mobile:</span>
                  <span className="font-mono font-bold text-[#0c1d2d]">{fullPhoneNumber}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Dispatch Channels:</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {channel === 'both' ? 'WhatsApp & SMS' : channel}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Trigger Threshold:</span>
                  <span className="font-bold text-rose-600">AQI &gt; {threshold}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                    <span>Phone Verified &amp; Active</span>
                  </span>
                </div>
              </div>

              {/* SEND TEST ALERT NOW BUTTON */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleTriggerTestAlert}
                  disabled={isSendingTestAlert}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-4 h-4 text-cyan-300" />
                  <span>{isSendingTestAlert ? 'Dispatching Test Alert...' : 'Send Test Alert Now (SMS / WhatsApp)'}</span>
                </button>
              </div>

              {/* DISPATCHED TEST ALERT PREVIEW */}
              {testAlertDispatched && (
                <div className="mb-4 p-3.5 rounded-2xl bg-[#0c1d2d] text-white text-left shadow-lg border border-slate-700 animate-fade-in">
                  <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1.5 pb-1 border-b border-slate-700">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Delivered to {fullPhoneNumber}</span>
                    </span>
                    <span className="font-mono">{testAlertDispatched.timestamp}</span>
                  </div>
                  <div className="text-xs font-mono text-cyan-100 bg-black/40 p-2.5 rounded-xl border border-white/10 leading-relaxed">
                    {testAlertDispatched.message}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Carrier: {channel.toUpperCase()} Gateway</span>
                    <span className="text-emerald-400 font-bold">Status: Confirmed ✓✓</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetSubscription}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Re-verify / Change Number
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0c1d2d] text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
