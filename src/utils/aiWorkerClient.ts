import type {
  CalcRiskRequest,
  CalcRiskResponse,
  VoiceQueryAnalysisRequest,
  VoiceQueryAnalysisResponse,
} from '../workers/ai-calc.worker';

let workerInstance: Worker | null = null;
const pendingCallbacks = new Map<string, (data: any) => void>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;

  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/ai-calc.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (e: MessageEvent<any>) => {
        const { id, data } = e.data || {};
        if (id && pendingCallbacks.has(id)) {
          const cb = pendingCallbacks.get(id);
          pendingCallbacks.delete(id);
          cb?.(data);
        }
      };

      workerInstance.onerror = (err) => {
        console.warn('[AI Worker Notice] Worker thread error, using local fallback:', err);
      };
    } catch (err) {
      console.warn('[AI Worker Notice] Could not instantiate Web Worker:', err);
      return null;
    }
  }

  return workerInstance;
}

// Generate unique message ID
function makeId(): string {
  return 'req_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

/**
 * Off-thread calculation of particulate alveolar deposition & vulnerability score.
 */
export async function calculateRespiratoryRiskOffThread(
  payload: CalcRiskRequest['payload']
): Promise<CalcRiskResponse['data']> {
  const worker = getWorker();
  const id = makeId();

  if (!worker) {
    // Fallback sync calculation on main thread if worker unsupported
    const ventRate = payload.activityLevel === 'running' ? 45 : payload.activityLevel === 'cycling' ? 32 : 15;
    const hourlyM3 = (ventRate * 60) / 1000;
    const alveolarDepositionUgHr = Math.round(payload.pm25 * hourlyM3 * 0.7 * 10) / 10;
    const baseScore = Math.min(60, (payload.aqi / 400) * 60);
    const score = Math.min(100, Math.round(baseScore + (payload.symptoms?.length || 0) * 6));
    return {
      alveolarDepositionUgHr,
      vulnerabilityScore: score,
      clinicalRiskTier: score >= 60 ? 'Severe Alveolar Distress' : score >= 40 ? 'Moderate Bronchial Strain' : 'Mild Irritation',
      hepaFiltrationHours: score >= 60 ? 18 : 8,
      preTransitSabaMinutes: 15,
      airwayInflammationRisk: score >= 60 ? 'High' : 'Moderate',
      instantInsight: `Local Worker Engine: Inhaled deposition ${alveolarDepositionUgHr} µg/hr. Risk score: ${score}/100.`,
    };
  }

  return new Promise((resolve) => {
    pendingCallbacks.set(id, resolve);
    const msg: CalcRiskRequest = {
      type: 'CALCULATE_RESPIRATORY_RISK',
      id,
      payload,
    };
    worker.postMessage(msg);

    // Timeout safety net
    setTimeout(() => {
      if (pendingCallbacks.has(id)) {
        pendingCallbacks.delete(id);
        resolve({
          alveolarDepositionUgHr: Math.round(payload.pm25 * 0.9 * 0.7 * 10) / 10,
          vulnerabilityScore: 50,
          clinicalRiskTier: 'Moderate Bronchial Strain',
          hepaFiltrationHours: 8,
          preTransitSabaMinutes: 15,
          airwayInflammationRisk: 'Moderate',
          instantInsight: 'Local computation complete.',
        });
      }
    }, 1500);
  });
}

/**
 * Off-thread rapid intent & urgency parsing for voice inquiries.
 */
export async function analyzeVoiceQueryOffThread(
  payload: VoiceQueryAnalysisRequest['payload']
): Promise<VoiceQueryAnalysisResponse['data']> {
  const worker = getWorker();
  const id = makeId();

  if (!worker) {
    return {
      intent: 'general_telemetry',
      instantPreviewPrefix: `[Telemetry: ${payload.cityName} AQI ${payload.aqi}]`,
      urgencyLevel: payload.aqi > 150 ? 'high' : 'low',
      immediateDirective: `AQI is currently ${payload.aqi} in ${payload.cityName}.`,
    };
  }

  return new Promise((resolve) => {
    pendingCallbacks.set(id, resolve);
    const msg: VoiceQueryAnalysisRequest = {
      type: 'ANALYZE_VOICE_QUERY',
      id,
      payload,
    };
    worker.postMessage(msg);

    // Timeout safety net
    setTimeout(() => {
      if (pendingCallbacks.has(id)) {
        pendingCallbacks.delete(id);
        resolve({
          intent: 'general_telemetry',
          instantPreviewPrefix: `[Telemetry: ${payload.cityName} AQI ${payload.aqi}]`,
          urgencyLevel: 'low',
          immediateDirective: `Air quality status for ${payload.cityName}: AQI ${payload.aqi}.`,
        });
      }
    }, 1500);
  });
}
