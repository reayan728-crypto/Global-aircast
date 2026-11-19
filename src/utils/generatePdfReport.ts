import { jsPDF } from 'jspdf';
import { CityData } from '../data/cities';
import { HourlyForecastPoint, pm25ToAqi } from './aqi';

export function generatePdfReport(city: CityData, point: HourlyForecastPoint) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const aqiInfo = pm25ToAqi(point.medianPm25);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Printer-friendly margin & dimensions (210mm x 297mm)
  const leftMargin = 18;
  const rightEdge = 192;
  const contentWidth = rightEdge - leftMargin;
  let y = 18;

  // Header Bar (Clean Printer-friendly High-contrast)
  doc.setFillColor(20, 32, 46);
  doc.rect(leftMargin, y, contentWidth, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('AIRCAST ATMOSPHERIC HEALTH INTELLIGENCE', leftMargin + 4, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('CPCB NAQI CALIBRATED', rightEdge - 4, y + 9, { align: 'right' });

  y += 20;

  // Document Title & Subtitle
  doc.setTextColor(20, 32, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Clinical Respiratory Protocol & Air Quality Summary', leftMargin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 90, 100);
  doc.text(`Official Environmental Health Summary · Generated on ${dateStr} at ${timeStr}`, leftMargin, y);

  y += 8;
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, rightEdge, y);

  y += 6;

  // Location & Station Details Block
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(leftMargin, y, contentWidth, 20, 2, 2, 'F');

  doc.setTextColor(20, 32, 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MONITORING LOCATION:', leftMargin + 4, y + 6);
  doc.text('SENSOR STATION:', leftMargin + 65, y + 6);
  doc.text('COORDINATES:', leftMargin + 130, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 60, 75);
  doc.text(`${city.name}, ${city.state}`, leftMargin + 4, y + 13);
  doc.text(city.stationName, leftMargin + 65, y + 13);
  doc.text(`${city.lat.toFixed(2)}°N, ${city.lng.toFixed(2)}°E`, leftMargin + 130, y + 13);

  y += 26;

  // Current Metrics Box (Printer Friendly 3-Column Strip)
  doc.setDrawColor(20, 32, 46);
  doc.setLineWidth(0.5);
  doc.rect(leftMargin, y, contentWidth, 24, 'D');

  // Col 1: AQI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text('AIR QUALITY INDEX (AQI)', leftMargin + 6, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 32, 46);
  doc.text(point.aqi.toString(), leftMargin + 6, y + 17);

  // Col 2: Category & Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text('CATEGORY / HEALTH TIER', leftMargin + 60, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 32, 46);
  doc.text(point.category.toUpperCase(), leftMargin + 60, y + 16);

  // Col 3: PM2.5 Concentration
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text('PARTICULATE CONCENTRATION', leftMargin + 125, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 32, 46);
  doc.text(`${point.medianPm25} µg/m³ PM2.5`, leftMargin + 125, y + 16);

  y += 31;

  // Section: Clinical Directive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 32, 46);
  doc.text('RECOMMENDED RESPIRATORY MITIGATION PROTOCOL', leftMargin, y);

  y += 3;
  doc.setDrawColor(20, 32, 46);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, y, leftMargin + 50, y);

  y += 5;

  // Protocol items based on current AQI
  interface ProtocolItem {
    title: string;
    description: string;
  }

  let protocolItems: ProtocolItem[] = [];

  if (point.aqi <= 100) {
    protocolItems = [
      {
        title: 'Outdoor Physical Exercise',
        description: 'Unrestricted endurance sports, outdoor running, cycling, and children playground activities are safe for the general public.'
      },
      {
        title: 'Home & Workplace Ventilation',
        description: 'Full passive cross-ventilation encouraged. Open windows during daytime to flush stale indoor air and maintain optimal oxygenation.'
      },
      {
        title: 'Vulnerable Groups (Asthma / Pediatric / Elderly)',
        description: 'Baseline maintenance medication is sufficient. No special prophylactic restrictions required; monitor for unusual sensitivity.'
      },
      {
        title: 'Personal Filtration',
        description: 'Masks are optional for general outdoor transits under current satisfactory atmospheric dispersion.'
      }
    ];
  } else if (point.aqi <= 300) {
    protocolItems = [
      {
        title: 'Window Timing & Exercise Hours',
        description: 'Restrict vigorous cardio outdoors strictly to 12:30–16:00 (afternoon solar apex). Avoid outdoor workouts during 07:00–10:00 and 19:00–21:00 rush-hour peaks.'
      },
      {
        title: 'Personal Filtration Standards',
        description: 'Wear a certified NIOSH N95, FFP2, or KN95 respirator with airtight nose-bridge seal during commutes. Single-layer cloth masks offer negligible PM2.5 protection.'
      },
      {
        title: 'Indoor Air Defense & Cleaning',
        description: 'Keep doors and windows sealed during evening inversion hours. Strictly avoid burning incense, dhoop, mosquito coils, or candles. Wet-mop surfaces instead of dry brooming.'
      },
      {
        title: 'High-Risk Cohorts (Asthma / COPD / Pediatric)',
        description: 'Keep prescribed rescue bronchodilators (e.g. Salbutamol inhaler with spacer) accessible at all times. Minimize strenuous exertion outdoors.'
      }
    ];
  } else {
    protocolItems = [
      {
        title: 'Emergency Outdoor Curbs',
        description: 'Mandatory lockdown on outdoor physical fitness and athletic training. Schools and workplaces should transition sports regimens indoors.'
      },
      {
        title: 'Continuous Indoor Air Purification',
        description: 'Operate certified HEPA H13 air purifiers continuously on high/turbo mode (CADR ≥ 350 m³/h). Seal window perimeters and door bottoms with weatherstripping.'
      },
      {
        title: 'Strict Respiratory Protection',
        description: 'NIOSH N95 or FFP2 respirator mandatory for any unavoidable outdoor exposure. Ensure positive facial seal without air leakage.'
      },
      {
        title: 'Clinical Telemetry & Medical Alerts',
        description: 'Elderly and cardiopulmonary patients must regularly check pulse oximeter SpO2. If oxygen saturation falls below 93% or wheezing persists, seek emergency care immediately.'
      }
    ];
  }

  protocolItems.forEach(item => {
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(220, 225, 232);
    doc.setLineWidth(0.2);
    doc.roundedRect(leftMargin, y, contentWidth, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 32, 46);
    doc.text(`• ${item.title}:`, leftMargin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 70, 85);
    const splitLines = doc.splitTextToSize(item.description, contentWidth - 8);
    doc.text(splitLines, leftMargin + 3, y + 10);

    y += 19;
  });

  y += 3;

  // Emergency / Clinical Notice Block
  doc.setFillColor(255, 240, 240);
  doc.setDrawColor(220, 50, 50);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftMargin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 25, 25);
  doc.text('EMERGENCY CLINICAL DIRECTIVE (NATIONAL HELPLINE 108):', leftMargin + 3, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 20, 20);
  doc.text(
    'If patient experiences acute respiratory distress, severe stridor, or SpO2 drops below 93%, dial 108 for emergency oxygen transfer. Maintain patient seated in an upright posture.',
    leftMargin + 3,
    y + 11,
    { maxWidth: contentWidth - 6 }
  );

  y += 24;

  // Sign-off / Authentication box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text(
    `Report ID: ARC-${city.id.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)} · Calibrated against CPCB Central Pollution Control Board continuous monitor standards.`,
    leftMargin,
    y
  );

  y += 4;
  doc.text(
    'This document is generated for public health guidance and clinical atmospheric exposure management. Please consult your physician for individualized medical advice.',
    leftMargin,
    y,
    { maxWidth: contentWidth }
  );

  // Trigger download
  const filename = `AirCast_Respiratory_Summary_${city.name}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
