export interface AirCastA11ySignClips {
  good: string;
  satisfactory: string;
  moderate: string;
  poor: string;
  veryPoor: string;
  severe: string;
  emergency: string;
}

export interface AirCastA11ySignWords {
  air: string;
  good: string;
  okay: string;
  bad: string;
  'very-bad': string;
  careful: string;
  danger: string;
  mask: string;
  home: string;
  doctor: string;
  hospital: string;
  help: string;
}

export interface AirCastA11yConfig {
  getLang?: () => string;
  getSummary?: () => string;
  getForecast?: () => string;
  getAdvice?: () => string;
  t?: (key: string, vars?: Record<string, string | number>) => string;
  signClips?: Partial<AirCastA11ySignClips>;
  signWords?: Partial<AirCastA11ySignWords>;
  signSequences?: Record<string, string[]>;
  selectors?: {
    simulator?: string;
    planner?: string;
  };
}

export interface AirCastA11yAPI {
  configure: (config: AirCastA11yConfig) => void;
  setAqi: (aqi: number, city?: string) => void;
  announce: (text: string, level?: 'info' | 'severe') => void;
  speak: (text: string, priority?: boolean) => void;
  readPage: () => void;
  command: (cmd: string) => void;
  intent?: (text: string) => string | null;
  status?: () => { aqi: number | null; place: string; level: string | null };
  open: (open?: boolean) => void;
  refresh: () => void;
}

export interface AirCastCommAPI {
  open: () => void;
  show: (text: string, sub?: string) => void;
}

export interface AirCastAnimAPI {
  icon: (name: string, size?: number) => string;
  mount: (container: HTMLElement | null, aqi: number) => void;
  popup: (name: string, label?: string) => void;
  names: string[];
  levelOf: (aqi: number) => string;
}

export interface AirCastAssistantContext {
  city: string;
  aqi: number;
  category: string;
  pm25: number;
  bestHour: string;
  worstHour: string;
  forecast: string;
  topDriver: string;
  temp: number;
  wind: number;
  humidity: number;
}

export interface AirCastAssistantConfig {
  getContext?: () => AirCastAssistantContext;
  idleMinutes?: number;
}

export interface AirCastAssistantAPI {
  configure: (config: AirCastAssistantConfig) => void;
  start: () => void;
  stop: () => void;
  ask: (q: string) => void;
}

declare global {
  interface Window {
    AirCastA11y?: AirCastA11yAPI;
    AirCastComm?: AirCastCommAPI;
    AirCastAnim?: AirCastAnimAPI;
    AirCastAssistant?: AirCastAssistantAPI;
  }
}
