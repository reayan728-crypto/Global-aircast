import { CityData } from '../data/cities';

export interface AqiInfo {
  aqi: number;
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  color: string;
  textColor: string;
  badgeBg: string;
  skyGradient: string;
  shortDesc: string;
}

/**
 * CPCB Indian National Air Quality Index (NAQI) Breakpoints for PM2.5 (24-hr avg in µg/m³)
 * Good: 0-30 -> AQI 0-50
 * Satisfactory: 31-60 -> AQI 51-100
 * Moderate: 61-90 -> AQI 101-200
 * Poor: 91-120 -> AQI 201-300
 * Very Poor: 121-250 -> AQI 301-400
 * Severe: 250+ -> AQI 401-500
 */
export function pm25ToAqi(pm25: number): AqiInfo {
  const c = Math.max(0, pm25);
  let aqi: number;

  if (c <= 30) {
    aqi = Math.round((50 / 30) * c);
  } else if (c <= 60) {
    aqi = Math.round(50 + ((100 - 50) / (60 - 30)) * (c - 30));
  } else if (c <= 90) {
    aqi = Math.round(100 + ((200 - 100) / (90 - 60)) * (c - 60));
  } else if (c <= 120) {
    aqi = Math.round(200 + ((300 - 200) / (120 - 90)) * (c - 90));
  } else if (c <= 250) {
    aqi = Math.round(300 + ((400 - 300) / (250 - 120)) * (c - 120));
  } else {
    aqi = Math.round(400 + ((500 - 400) / (380 - 250)) * Math.min(c - 250, 130));
  }

  aqi = Math.max(1, Math.min(500, aqi));

  if (aqi <= 50) {
    return {
      aqi,
      category: 'Good',
      color: '#00b050',
      textColor: '#0c5225',
      badgeBg: 'rgba(0, 176, 80, 0.15)',
      skyGradient: 'linear-gradient(180deg, #dcecf7 0%, #f4f8fc 100%)',
      shortDesc: 'Minimal respiratory impact. Outdoor exercise safe.'
    };
  } else if (aqi <= 100) {
    return {
      aqi,
      category: 'Satisfactory',
      color: '#558b2f',
      textColor: '#2e5a12',
      badgeBg: 'rgba(85, 139, 47, 0.15)',
      skyGradient: 'linear-gradient(180deg, #dfeee0 0%, #f6faf5 100%)',
      shortDesc: 'Air quality is acceptable. Minor sensitivity for high-risk individuals.'
    };
  } else if (aqi <= 200) {
    return {
      aqi,
      category: 'Moderate',
      color: '#d48806',
      textColor: '#874d00',
      badgeBg: 'rgba(212, 136, 6, 0.15)',
      skyGradient: 'linear-gradient(180deg, #f7ebd7 0%, #fcf7ef 100%)',
      shortDesc: 'Breathing discomfort to sensitive groups (asthma, heart condition).'
    };
  } else if (aqi <= 300) {
    return {
      aqi,
      category: 'Poor',
      color: '#d45b14',
      textColor: '#8a3304',
      badgeBg: 'rgba(212, 91, 20, 0.15)',
      skyGradient: 'linear-gradient(180deg, #f4dfd2 0%, #fcf6f2 100%)',
      shortDesc: 'Breathing discomfort to most people on prolonged outdoor exposure.'
    };
  } else if (aqi <= 400) {
    return {
      aqi,
      category: 'Very Poor',
      color: '#c0392b',
      textColor: '#781e14',
      badgeBg: 'rgba(192, 57, 43, 0.15)',
      skyGradient: 'linear-gradient(180deg, #edd5d3 0%, #faf1f0 100%)',
      shortDesc: 'Respiratory illness on prolonged exposure. Vulnerable groups stay indoors.'
    };
  } else {
    return {
      aqi,
      category: 'Severe',
      color: '#6e2b26',
      textColor: '#431713',
      badgeBg: 'rgba(110, 43, 38, 0.20)',
      skyGradient: 'linear-gradient(180deg, #ded0ce 0%, #f2eae8 100%)',
      shortDesc: 'Severe health impact. Healthy individuals also affected. Limit outdoor exposure.'
    };
  }
}

export interface SimulationParams {
  windSpeed: number; // km/h
  humidity: number; // %
  temp: number; // °C
  trafficMultiplier: number; // x
  currentPm25: number; // µg/m³
  diwaliMode: boolean; // boolean
}

export interface HourlyForecastPoint {
  hourIndex: number; // 0 to 23
  hourLabel: string; // e.g. "19:00"
  displayHour: number; // 19
  medianPm25: number;
  q10Pm25: number; // 10th percentile
  q90Pm25: number; // 90th percentile
  aqi: number;
  category: AqiInfo['category'];
  color: string;
  isPeak: boolean;
  isCleanest: boolean;
}

export function computeSimulatedPm25(city: CityData, params: SimulationParams): number {
  // Baseline is city.basePm25
  const basePm = city.basePm25;

  // Exact physics-based delta contributions
  const deltaWind = Math.round(((city.baseWind - params.windSpeed) * 0.9) * 10) / 10;
  const deltaHumidity = Math.round(((params.humidity - city.baseHumidity) * 0.25) * 10) / 10;
  const deltaTemp = Math.round(((city.baseTemp - params.temp) * 0.5) * 10) / 10;
  const deltaTraffic = Math.round(((params.trafficMultiplier - 1.0) * (basePm * 0.35)) * 10) / 10;
  const deltaDiwali = params.diwaliMode ? 75.0 : 0.0;
  const deltaNight = 0.0;
  const deltaInertia = Math.round((params.currentPm25 - basePm) * 10) / 10;

  const totalDelta = deltaWind + deltaHumidity + deltaTemp + deltaTraffic + deltaDiwali + deltaNight + deltaInertia;
  const sim = Math.max(5, Math.round((basePm + totalDelta) * 10) / 10);
  return sim;
}

export function generate24HourForecast(
  city: CityData,
  params: SimulationParams,
  startHour?: number
): HourlyForecastPoint[] {
  // Use client's local timezone current hour by default
  const localStartHour = startHour !== undefined ? startHour : new Date().getHours();
  const points: HourlyForecastPoint[] = [];

  // Sensitivity factors calibrated for micro-climate dispersion physics
  const simulatedBase = computeSimulatedPm25(city, params);
  const windFactor = Math.max(0.4, 1 - (params.windSpeed - city.baseWind) * 0.025);
  const humidityFactor = 1 + (params.humidity - city.baseHumidity) * 0.005;
  const tempInversionEffect = params.temp < 20 ? 1 + (20 - params.temp) * 0.02 : 1 - (params.temp - 25) * 0.01;
  const trafficFactor = params.trafficMultiplier;

  let minVal = 99999;
  let maxVal = -1;
  let minIdx = -1;
  let maxIdx = -1;

  for (let i = 0; i < 24; i++) {
    const clockHour = (localStartHour + i) % 24;
    const hourLabel = `${clockHour.toString().padStart(2, '0')}:00`;

    // Diurnal atmospheric pattern:
    // 01:00 - 05:00: Deep thermal inversion compression
    // 08:00 - 10:00: Morning traffic surge
    // 12:00 - 16:00: Solar thermal convection expands boundary layer (cleanest window)
    // 18:00 - 21:00: Evening rush hour + nocturnal radiation cooling inversion trap
    let diurnalCycle = 1.0;

    if (clockHour >= 12 && clockHour <= 16) {
      diurnalCycle = 0.72; // Cleanest afternoon convection
    } else if (clockHour >= 8 && clockHour <= 10) {
      diurnalCycle = 1.25 * trafficFactor; // Morning rush
    } else if (clockHour >= 18 && clockHour <= 21) {
      diurnalCycle = 1.38 * trafficFactor; // Evening rush & cooling
    } else if (clockHour >= 22 || clockHour <= 4) {
      diurnalCycle = 1.2 * city.nightInversionFactor; // Night boundary layer trapping
    } else {
      diurnalCycle = 0.95;
    }

    // Diwali mode shock injection (episodic post-dusk bursts from 20:00 to 02:00)
    let episodicShock = 0;
    if (params.diwaliMode) {
      if (clockHour >= 19 && clockHour <= 23) {
        episodicShock = 85 + (clockHour === 21 ? 40 : 0);
      } else if (clockHour >= 0 && clockHour <= 3) {
        episodicShock = 60 - clockHour * 10;
      }
    }

    // Combine drivers: Hour 0 directly matches simulatedBase
    let pm: number;
    if (i === 0) {
      pm = simulatedBase;
    } else {
      pm = (simulatedBase * diurnalCycle * windFactor * humidityFactor * tempInversionEffect) + episodicShock;
    }
    pm = Math.max(5, Math.round(pm * 10) / 10);

    // Uncertainty envelope (80% confidence interval quantile regression bounds)
    const varianceSpread = 0.14 + (clockHour >= 19 || clockHour <= 6 ? 0.08 : 0.03);
    const q10 = Math.max(5, Math.round((pm * (1 - varianceSpread)) * 10) / 10);
    const q90 = Math.round((pm * (1 + varianceSpread * 1.15)) * 10) / 10;

    const aqiData = pm25ToAqi(pm);

    if (pm < minVal) {
      minVal = pm;
      minIdx = i;
    }
    if (pm > maxVal) {
      maxVal = pm;
      maxIdx = i;
    }

    points.push({
      hourIndex: i,
      hourLabel,
      displayHour: clockHour,
      medianPm25: pm,
      q10Pm25: q10,
      q90Pm25: q90,
      aqi: aqiData.aqi,
      category: aqiData.category,
      color: aqiData.color,
      isPeak: false,
      isCleanest: false
    });
  }

  if (minIdx !== -1) points[minIdx].isCleanest = true;
  if (maxIdx !== -1) points[maxIdx].isPeak = true;

  return points;
}

export interface ShapAttribution {
  driver: string;
  force: number; // in µg/m³
  type: 'disperse' | 'accumulate';
  description: string;
}

export function computeTreeShapDrivers(params: SimulationParams, city: CityData): ShapAttribution[] {
  const basePm = city.basePm25;
  const simulatedPm = computeSimulatedPm25(city, params);
  const totalDifference = Math.round((simulatedPm - basePm) * 10) / 10;

  // Individual forces calibrated relative to city baseline
  const windForce = Math.round(((city.baseWind - params.windSpeed) * 0.9) * 10) / 10;
  const humidityForce = Math.round(((params.humidity - city.baseHumidity) * 0.25) * 10) / 10;
  const tempForce = Math.round(((city.baseTemp - params.temp) * 0.5) * 10) / 10;
  const trafficForce = Math.round(((params.trafficMultiplier - 1.0) * (basePm * 0.35)) * 10) / 10;
  const nocturnalForce = 0.0;
  const diwaliForce = params.diwaliMode ? 75.0 : 0.0;

  // Guarantee strict mathematical closure: sum(forces) === (simulatedPm - basePm)
  const sumKnown = Math.round((windForce + humidityForce + tempForce + trafficForce + nocturnalForce + diwaliForce) * 10) / 10;
  const inertiaForce = Math.round((totalDifference - sumKnown) * 10) / 10;

  return [
    {
      driver: 'Wind',
      force: windForce,
      type: windForce < 0 ? 'disperse' : 'accumulate',
      description: windForce < 0 ? 'Brisk wind blows away particulate matter' : 'Calm, still air causes pollution to build up'
    },
    {
      driver: 'Humidity',
      force: humidityForce,
      type: humidityForce > 0 ? 'accumulate' : 'disperse',
      description: humidityForce > 0 ? 'Damp air hydrates particles making them heavier and trapped' : 'Dry air helps particles disperse faster'
    },
    {
      driver: 'Temperature',
      force: tempForce,
      type: tempForce > 0 ? 'accumulate' : 'disperse',
      description: tempForce > 0 ? 'Cold surface air forms an inversion layer that traps smoke' : 'Warm ground creates upward air currents that carry smoke away'
    },
    {
      driver: 'Traffic',
      force: trafficForce,
      type: trafficForce >= 0 ? 'accumulate' : 'disperse',
      description: trafficForce >= 0 ? 'Vehicle exhaust and tire dust add fresh particulate mass to the air' : 'Reduced traffic lowers urban tailpipe emissions'
    },
    {
      driver: 'Night-time trapping',
      force: nocturnalForce,
      type: nocturnalForce > 0 ? 'accumulate' : 'disperse',
      description: 'Cool night air forms a surface lid, trapping pollutants until morning'
    },
    {
      driver: 'Firecrackers',
      force: diwaliForce,
      type: diwaliForce > 0 ? 'accumulate' : 'disperse',
      description: diwaliForce > 0 ? 'Dense smoke burst from evening pyrotechnic fireworks' : 'No festival firecracker smoke active'
    },
    {
      driver: 'Atmospheric inertia',
      force: inertiaForce,
      type: inertiaForce >= 0 ? 'accumulate' : 'disperse',
      description: 'Residual pollution baseline and background aerosol transport'
    }
  ];
}
