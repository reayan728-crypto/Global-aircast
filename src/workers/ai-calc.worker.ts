// Web Worker for off-main-thread telemetry and respiratory risk calculations
// Offloads heavy math, dose estimations, and instantaneous intent parsing from the main UI thread.

export interface CalcRiskRequest {
  type: 'CALCULATE_RESPIRATORY_RISK';
  id: string;
  payload: {
    aqi: number;
    pm25: number;
    cohort?: string;
    symptoms?: string[];
    activityLevel?: 'resting' | 'walking' | 'cycling' | 'running';
  };
}

export interface VoiceQueryAnalysisRequest {
  type: 'ANALYZE_VOICE_QUERY';
  id: string;
  payload: {
    query: string;
    cityName: string;
    aqi: number;
    language?: string;
  };
}

export type WorkerMessage = CalcRiskRequest | VoiceQueryAnalysisRequest;

export interface CalcRiskResponse {
  type: 'CALCULATE_RESPIRATORY_RISK_RESULT';
  id: string;
  data: {
    alveolarDepositionUgHr: number;
    vulnerabilityScore: number; // 0 - 100
    clinicalRiskTier: 'Low Risk' | 'Mild Irritation' | 'Moderate Bronchial Strain' | 'Severe Alveolar Distress' | 'Critical Airway Emergency';
    hepaFiltrationHours: number;
    preTransitSabaMinutes: number;
    airwayInflammationRisk: 'Minimal' | 'Moderate' | 'High' | 'Severe';
    instantInsight: string;
  };
}

export interface VoiceQueryAnalysisResponse {
  type: 'ANALYZE_VOICE_QUERY_RESULT';
  id: string;
  data: {
    intent: 'exercise_safety' | 'mask_protocol' | 'symptom_alert' | 'airway_pathology' | 'general_telemetry';
    instantPreviewPrefix: string;
    urgencyLevel: 'low' | 'moderate' | 'high' | 'urgent';
    immediateDirective: string;
  };
}

// Ventilation rates in liters per minute by activity level
const VENTILATION_RATES: Record<string, number> = {
  resting: 7.5,
  walking: 15.0,
  cycling: 32.0,
  running: 45.0,
};

// Listen for messages from main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;
  if (!message || !message.type) return;

  switch (message.type) {
    case 'CALCULATE_RESPIRATORY_RISK': {
      const { aqi, pm25, cohort, symptoms = [], activityLevel = 'walking' } = message.payload;

      // Inhaled particulate calculation:
      // Air volume inhaled per hour = ventilation rate (L/min) * 60 min / 1000 m3
      const ventRate = VENTILATION_RATES[activityLevel] || 15.0;
      const hourlyM3 = (ventRate * 60) / 1000; // m^3 of air inhaled per hour
      const totalInhaledPm25 = pm25 * hourlyM3; // microgram total
      // Sub-micron alveolar deposition fraction is ~65% to 75% for PM2.5 in human lungs
      const alveolarDepositionUgHr = Math.round(totalInhaledPm25 * 0.70 * 10) / 10;

      // Vulnerability scoring model (0 - 100)
      let baseScore = Math.min(60, (aqi / 400) * 60);

      // Cohort vulnerability multiplier
      const c = (cohort || '').toLowerCase();
      if (c.includes('asthma') || c.includes('copd')) baseScore += 25;
      else if (c.includes('pediatric') || c.includes('child')) baseScore += 20;
      else if (c.includes('elder') || c.includes('senior')) baseScore += 22;
      else if (c.includes('pregnant')) baseScore += 18;
      else baseScore += 5;

      // Active symptoms weight (up to +20)
      const symptomWeight = Math.min(20, symptoms.length * 6);
      const totalScore = Math.min(100, Math.round(baseScore + symptomWeight));

      let tier: CalcRiskResponse['data']['clinicalRiskTier'] = 'Low Risk';
      let inflammation: CalcRiskResponse['data']['airwayInflammationRisk'] = 'Minimal';
      let hepaHours = 4;
      let preTransitMinutes = 0;

      if (totalScore >= 80) {
        tier = 'Critical Airway Emergency';
        inflammation = 'Severe';
        hepaHours = 24;
        preTransitMinutes = 20;
      } else if (totalScore >= 60) {
        tier = 'Severe Alveolar Distress';
        inflammation = 'High';
        hepaHours = 18;
        preTransitMinutes = 15;
      } else if (totalScore >= 40) {
        tier = 'Moderate Bronchial Strain';
        inflammation = 'Moderate';
        hepaHours = 12;
        preTransitMinutes = 15;
      } else if (totalScore >= 20) {
        tier = 'Mild Irritation';
        inflammation = 'Minimal';
        hepaHours = 6;
        preTransitMinutes = 10;
      }

      const instantInsight = `Local Worker Engine: Estimated ${alveolarDepositionUgHr} µg/hr alveolar deposition at ${activityLevel} rate. Risk tier: ${tier} (${totalScore}/100).`;

      const response: CalcRiskResponse = {
        type: 'CALCULATE_RESPIRATORY_RISK_RESULT',
        id: message.id,
        data: {
          alveolarDepositionUgHr,
          vulnerabilityScore: totalScore,
          clinicalRiskTier: tier,
          hepaFiltrationHours: hepaHours,
          preTransitSabaMinutes: preTransitMinutes,
          airwayInflammationRisk: inflammation,
          instantInsight,
        },
      };

      self.postMessage(response);
      break;
    }

    case 'ANALYZE_VOICE_QUERY': {
      const { query, cityName, aqi } = message.payload;
      const q = (query || '').toLowerCase();

      let intent: VoiceQueryAnalysisResponse['data']['intent'] = 'general_telemetry';
      let urgency: VoiceQueryAnalysisResponse['data']['urgencyLevel'] = 'low';
      let immediateDirective = `AQI currently ${aqi} in ${cityName}.`;

      if (q.includes('cycl') || q.includes('run') || q.includes('jog') || q.includes('exercise') || q.includes('walk') || q.includes('outside')) {
        intent = 'exercise_safety';
        if (aqi > 150) {
          urgency = 'high';
          immediateDirective = `Outdoor aerobic exertion not advised under current AQI of ${aqi}. Shift training indoors.`;
        } else if (aqi > 100) {
          urgency = 'moderate';
          immediateDirective = `Moderate particulate levels (AQI ${aqi}). Limit vigorous sustained exertion outdoors.`;
        } else {
          urgency = 'low';
          immediateDirective = `Clean particulate window (AQI ${aqi}). Outdoor conditioning is safe.`;
        }
      } else if (q.includes('mask') || q.includes('n95') || q.includes('wear') || q.includes('filter')) {
        intent = 'mask_protocol';
        urgency = aqi > 120 ? 'high' : 'moderate';
        immediateDirective = aqi > 100 ? 'Certified N95 / FFP2 respirator recommended with airtight seal.' : 'Particulate levels are within acceptable thresholds.';
      } else if (q.includes('cough') || q.includes('wheez') || q.includes('chest') || q.includes('breath') || q.includes('asthma') || q.includes('symptom')) {
        intent = 'symptom_alert';
        urgency = 'urgent';
        immediateDirective = 'Bronchial irritation detected. Recommend remaining in HEPA-filtered indoor space and checking rescue inhaler availability.';
      }

      const instantPreviewPrefix = `[Telemetry: ${cityName} AQI ${aqi}]`;

      const voiceResponse: VoiceQueryAnalysisResponse = {
        type: 'ANALYZE_VOICE_QUERY_RESULT',
        id: message.id,
        data: {
          intent,
          instantPreviewPrefix,
          urgencyLevel: urgency,
          immediateDirective,
        },
      };

      self.postMessage(voiceResponse);
      break;
    }

    default:
      break;
  }
};
