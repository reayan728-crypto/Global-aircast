import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  CheckSquare,
  Square,
  Download,
  PhoneCall,
  Activity,
  AlertTriangle,
  Stethoscope,
  Sparkles,
  HeartPulse,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote,
  Zap,
  Info
} from 'lucide-react';
import { CityData } from '../data/cities';
import { HourlyForecastPoint } from '../utils/aqi';
import { useLanguage } from '../context/LanguageContext';
import { calculateRespiratoryRiskOffThread } from '../utils/aiWorkerClient';

interface RespiratoryDiagnosticToolProps {
  selectedCity: CityData;
  currentForecastPoint: HourlyForecastPoint;
  onOpenEmergency: () => void;
}

export type CohortType = 'healthy' | 'pediatric' | 'elderly' | 'asthma';

export const RespiratoryDiagnosticTool: React.FC<RespiratoryDiagnosticToolProps> = ({
  selectedCity,
  currentForecastPoint,
  onOpenEmergency
}) => {
  const { t, currentLanguage, selectedLanguageOption } = useLanguage();
  const [activeTab, setActiveTab] = useState<'triage' | 'medicalAi'>('triage');

  const [selectedCohort, setSelectedCohort] = useState<CohortType>('asthma');
  const [symptoms, setSymptoms] = useState<{ [key: string]: boolean }>({
    throat: true,
    chest: false,
    eyes: false,
    breath: false,
    headache: false
  });

  // --- MEDICAL AI PREVENTION QUESTION STATE & WORKER METRICS ---
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  // Initial guidance (no medication dosing; directs to doctor)
  useEffect(() => {
    setAiAnswer(
      `### Air Quality Guidance & Exposure Reduction: ${selectedCity.name}\n\n` +
      `**1. Current Airway Exposure:**\n` +
      `Under ambient AQI ${currentForecastPoint.aqi} (${currentForecastPoint.category}), fine combustion particles can irritate mucosal airways.\n\n` +
      `**2. Evidence-Based Protective Steps:**\n` +
      `• **Respirator Mask:** Certified N95 / FFP2 respirators are tested to filter at least 95% of airborne non-oil particulates when tightly fitted (Source: NIOSH / EN 149).\n` +
      `• **Indoor Air Cleaners:** Running a certified true HEPA filter helps reduce indoor particulate levels (Source: US EPA Guidance).\n` +
      `• **Saline Nasal Rinse:** Sterile saline rinses help wash away dust and particle residue from nasal passages.\n` +
      `• **Medications:** Discuss preventative inhalers and antioxidant supplements with your doctor. Always follow your doctor's personalized action plan.\n\n` +
      `**3. When to Seek Urgent Care:**\n` +
      `If you experience chest tightness, acute wheezing, or difficulty speaking in full sentences, seek immediate medical attention or call emergency services (108).`
    );
  }, [selectedCity.name, currentForecastPoint.aqi, currentForecastPoint.category]);

  const presetQuestions = [
    'What are safe ways to reduce pollution exposure at home?',
    'How can I protect my lungs during high smog days?',
    'When should I use my reliever inhaler before stepping outside?',
    'Which certified masks protect against PM2.5 particles?',
    'How does saline nasal wash help remove airborne particles?'
  ];

  const handleToggleSymptom = (key: string) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setSelectedCohort('healthy');
    setSymptoms({
      throat: false,
      chest: false,
      eyes: false,
      breath: false,
      headache: false
    });
  };

  // Cohort labels for explanation
  const cohortNames: Record<CohortType, string> = {
    healthy: 'Healthy Adult',
    pediatric: 'Pediatric (<12y)',
    elderly: 'Elderly (65y+)',
    asthma: 'Asthma / COPD'
  };

  const cohortWeights: Record<CohortType, number> = {
    healthy: 1,
    pediatric: 2,
    elderly: 2,
    asthma: 3
  };

  const symptomWeights: Record<string, number> = {
    throat: 1,
    chest: 2,
    eyes: 1,
    breath: 3,
    headache: 1
  };

  // Count active symptoms
  const activeSymptomsList = Object.keys(symptoms).filter(k => symptoms[k]);
  const activeCount = activeSymptomsList.length;

  let calculatedScore = cohortWeights[selectedCohort];
  activeSymptomsList.forEach(k => {
    calculatedScore += symptomWeights[k];
  });
  if (currentForecastPoint.aqi > 200) calculatedScore += 1;
  const score = Math.min(10, calculatedScore);

  // RULE OVERRIDE: If user ticks "chest constriction or tightness" OR "shortness of breath / wheezing",
  // ALWAYS show urgent result: "Seek medical care now / Call 108", regardless of score!
  const hasUrgentSymptom = symptoms.chest || symptoms.breath;

  let riskTier = 'Moderate Caution';
  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  let badgeLabel = 'Moderate Caution';
  let riskExplanation = '';

  if (hasUrgentSymptom) {
    riskTier = 'Seek medical care now / Call 108';
    badgeColor = 'bg-red-600 text-white border-red-700 animate-pulse';
    badgeLabel = 'URGENT MEDICAL ATTENTION';
    riskExplanation = `Urgent care recommended because you reported ${
      symptoms.chest && symptoms.breath
        ? 'chest tightness and shortness of breath'
        : symptoms.chest
        ? 'chest constriction or tightness'
        : 'shortness of breath or wheezing'
    }. Do not wait for AQI changes.`;
  } else if (score <= 3) {
    riskTier = 'Minimal Risk';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    badgeLabel = 'Low Risk';
    riskExplanation = `Low risk because you selected ${cohortNames[selectedCohort]} with ${
      activeCount === 0 ? 'no acute symptoms' : `${activeCount} mild symptom`
    }, while local AQI is ${currentForecastPoint.aqi} (${currentForecastPoint.category}).`;
  } else if (score <= 6) {
    riskTier = 'High Caution';
    badgeColor = 'bg-orange-100 text-orange-800 border-orange-300';
    badgeLabel = 'High Caution';
    riskExplanation = `High caution because you selected ${cohortNames[selectedCohort]} and ${activeCount} symptoms, even though AQI is ${currentForecastPoint.category}.`;
  } else {
    riskTier = 'Critical Inversion Warning';
    badgeColor = 'bg-red-100 text-red-800 border-red-300';
    badgeLabel = 'Critical Warning';
    riskExplanation = `Critical caution because you selected ${cohortNames[selectedCohort]} with ${activeCount} active symptoms during elevated AQI ${currentForecastPoint.aqi}.`;
  }

  const lastEmergencyAnnouncedRef = useRef<string>('');
  useEffect(() => {
    const isEmergency = hasUrgentSymptom || score > 6;
    if (!isEmergency) {
      lastEmergencyAnnouncedRef.current = '';
      return;
    }
    const announcement = t('a11yUrgentTriageAlert', {
      city: selectedCity.name,
      tier: riskTier,
      explanation: riskExplanation
    });
    const key = `${selectedCity.id}-${riskTier}-${activeSymptomsList.join(',')}`;
    if (lastEmergencyAnnouncedRef.current !== key) {
      lastEmergencyAnnouncedRef.current = key;
      window.AirCastA11y?.announce(announcement, 'severe');
    }
  }, [hasUrgentSymptom, score, selectedCity.id, selectedCity.name, riskTier, riskExplanation, activeSymptomsList, t]);

  // Handle Ask Medical AI question
  const handleAskMedicalAi = async (qText?: string) => {
    const question = (qText || userQuestion).trim();
    if (!question) return;

    setUserQuestion('');
    setIsAiLoading(true);
    setIsStreaming(true);
    setAiAnswer('');

    // Progressive response from server
    try {
      const response = await fetch('/api/medical/prevention-ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          cohort: selectedCohort,
          currentAqi: currentForecastPoint.aqi,
          cityName: selectedCity.name,
          country: selectedCity.country,
          symptoms: activeSymptomsList.join(', ') || 'None',
          language: selectedLanguageOption.name,
          languageCode: currentLanguage
        })
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      if (!response.body) throw new Error('ReadableStream not supported on response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setAiAnswer(accumulated);
      }
    } catch (err: any) {
      console.warn('Medical AI stream notice:', err.message);
      setAiAnswer(
        `### Air Pollution Guidance for ${selectedCity.name}\n\n` +
        `**Preventative Measures:**\n` +
        `• **Personal Mask:** Wear a certified, well-fitted N95 / FFP2 mask for outdoor trips. (Source: NIOSH / WHO)\n` +
        `• **Indoor Air:** Use a true HEPA air cleaner to lower particle exposure in living areas. (Source: US EPA)\n` +
        `• **Medications:** Ask your doctor about protective prescriptions or inhaler timing.\n` +
        `• **Emergency:** Seek medical care immediately if chest pain or severe wheezing develops.`
      );
    } finally {
      setIsAiLoading(false);
      setIsStreaming(false);
    }
  };

  // Download Clinical Log functionality
  const handleDownloadLog = () => {
    const timestamp = new Date().toISOString();
    const activeSymptomsText = activeSymptomsList.join(', ') || 'None reported';

    const logContent = `======================================================
AIRCAST RESPIRATORY TRIAGE & HEALTH GUIDANCE LOG
Generated: ${timestamp}
Location: ${selectedCity.stationName} (${selectedCity.state}, ${selectedCity.country})
Current AQI: ${currentForecastPoint.aqi} (${currentForecastPoint.category})
======================================================

PATIENT COHORT: ${selectedCohort.toUpperCase()}
OBSERVED SYMPTOMS: ${activeSymptomsText}

TRIAGE RESULT:
- Classification: ${riskTier}
- Composite Score: ${score} / 10
- Explanation: ${riskExplanation}

DISCLAIMER:
This is general information, not medical advice. Consult a doctor for any health concern.

EMERGENCY DIRECTIVES:
- If persistent chest tightness, severe shortness of breath, or SpO2 < 93% occurs, dial emergency response 108 immediately.
AirCast Global Air Quality Intelligence
======================================================`;

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AirCast_Respiratory_Log_${selectedCity.id}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="clinical-diagnostic-section" className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-12 font-sans">
      {/* Prominent Mandatory Medical Disclaimer */}
      <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-[13px] leading-relaxed">
          <strong className="font-bold">{t('medicalDisclaimer')}:</strong> {t('medicalDisclaimerText')}
        </div>
      </div>

      {/* Tabs Header to Shorten the Page */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#4d5d70]">
              {t('personalHealth')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0c1d2d] tracking-tight font-sans">
            {t('symptomCheckerTitle')}
          </h2>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'triage'
                ? 'bg-[#14202e] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#0c1d2d]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('symptomCheckerTab')}</span>
          </button>
          <button
            onClick={() => setActiveTab('medicalAi')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'medicalAi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('askMedicalAiTab')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SYMPTOM CHECKER & TRIAGE */}
      {activeTab === 'triage' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
            {/* Left Column: Input Selection */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-[#14202e]/15 flex flex-col justify-between shadow-sm bg-white/95">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('step1And2')}
                  </span>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('resetInputs')}</span>
                  </button>
                </div>

                {/* Cohort Selection */}
                <div className="mb-5">
                  <label className="block text-xs font-extrabold text-[#0c1d2d] uppercase tracking-wider mb-2">
                    {t('selectCohort')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'healthy', label: t('healthyAdult'), sub: t('standardRisk') },
                      { id: 'pediatric', label: t('pediatric'), sub: t('highVentilation') },
                      { id: 'elderly', label: t('elderly'), sub: t('cardiopulmonary') },
                      { id: 'asthma', label: t('asthmaCopd'), sub: t('hyperreactivity') }
                    ].map(cohort => {
                      const isSelected = selectedCohort === cohort.id;
                      return (
                        <button
                          key={cohort.id}
                          onClick={() => setSelectedCohort(cohort.id as CohortType)}
                          className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#14202e] text-white shadow-sm ring-2 ring-[#14202e]'
                              : 'bg-white hover:bg-slate-50 border border-slate-200 text-[#0c1d2d]'
                          }`}
                        >
                          <span className="font-extrabold text-xs">{cohort.label}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {cohort.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Acute Symptoms Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-[#0c1d2d] uppercase tracking-wider mb-2">
                    {t('checkSymptoms')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'throat', label: t('symptomThroat'), urgent: false },
                      { id: 'chest', label: t('symptomChest'), urgent: true },
                      { id: 'eyes', label: t('symptomEye'), urgent: false },
                      { id: 'breath', label: t('symptomWheeze'), urgent: true },
                      { id: 'headache', label: t('symptomHeadache'), urgent: false }
                    ].map(sym => {
                      const isChecked = symptoms[sym.id];
                      return (
                        <button
                          key={sym.id}
                          onClick={() => handleToggleSymptom(sym.id)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? sym.urgent
                                ? 'bg-red-50 text-red-900 border-red-400 font-bold'
                                : 'bg-[#14202e] text-white border-[#14202e]'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isChecked ? (
                              <CheckSquare className={`w-4 h-4 ${sym.urgent ? 'text-red-600' : 'text-emerald-400'} shrink-0`} />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-xs font-semibold">{sym.label}</span>
                          </div>
                          {sym.urgent && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-300 shrink-0">
                              {t('riskHigh')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Location: <strong>{selectedCity.name}</strong></span>
                <span>Current AQI: <strong className="text-[#0c1d2d]">{currentForecastPoint.aqi}</strong> ({currentForecastPoint.category})</span>
              </div>
            </div>

            {/* Right Column: Calculated Risk Assessment Card */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-[#14202e]/15 flex flex-col justify-between shadow-sm bg-white/95">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {t('triageClassification')}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeColor}`}>
                    {badgeLabel}
                  </span>
                </div>

                {/* Prominent Risk Result */}
                <div className="my-4">
                  <div className={`text-xl sm:text-2xl font-black tracking-tight ${hasUrgentSymptom ? 'text-red-600' : 'text-[#0c1d2d]'}`}>
                    {riskTier}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono font-semibold">
                    {t('compositeScore')}: <strong>{score}</strong> / 10
                  </div>
                </div>

                {/* Score progress meter */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      hasUrgentSymptom ? 'bg-red-600' : score <= 3 ? 'bg-emerald-500' : score <= 6 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${hasUrgentSymptom ? 100 : (score / 10) * 100}%` }}
                  />
                </div>

                {/* Required Explanation of WHY risk was given */}
                <div className="p-3.5 mb-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 leading-relaxed font-medium">
                  <strong className="font-bold block mb-0.5">{t('whyResultGiven')}</strong>
                  {riskExplanation}
                </div>

                {/* Safe Clinical Directive Points */}
                <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-800">
                      {t('relieverInhalerGuidance')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      {t('stayIndoorsHepa')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={handleDownloadLog}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#14202e] hover:bg-[#000713] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloadLog')}</span>
                </button>
                <button
                  onClick={onOpenEmergency}
                  className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-white" />
                  <span>{t('call108Emergency')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEDICAL AI CHAT & QUESTIONS */}
      {activeTab === 'medicalAi' && (
        <div className="animate-fade-in glass-panel rounded-3xl p-5 sm:p-7 border border-emerald-500/25 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20 shadow-md">
          {/* Medical AI Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#14202e] to-emerald-900 text-emerald-400 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0c1d2d]">
                  {t('medicalAiHeader')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('medicalAiSubtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-white/80 px-3 py-1 rounded-xl border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('generalInfoConsultDoctor')}</span>
            </div>
          </div>

          {/* Preset Questions */}
          <div className="mb-4">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('suggestedPreventionQuestions')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskMedicalAi(q)}
                  disabled={isAiLoading}
                  className="text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 shadow-2xs transition-all text-left cursor-pointer active:scale-95 disabled:opacity-50 font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box with Clearly Active Button & Full Placeholder */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAskMedicalAi();
            }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder={t('askAboutPollution')}
                value={userQuestion}
                onChange={e => setUserQuestion(e.target.value)}
                disabled={isAiLoading}
                className="w-full px-4 py-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-2xl text-[#0c1d2d] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isAiLoading || !userQuestion.trim()}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <span>{isAiLoading ? t('analyzing') : t('askMedicalAiBtn')}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* AI Response Display Area */}
          {aiAnswer && (
            <div className="bg-white rounded-2xl p-5 border border-emerald-500/30 shadow-sm transition-all">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="font-extrabold text-xs text-[#0c1d2d]">
                    {t('respiratoryGuidelines')} ({selectedCity.name})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {t('notMedicalAdvice')}
                </span>
              </div>

              <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap">
                {aiAnswer}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
