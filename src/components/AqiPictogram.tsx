import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface AqiPictogramProps {
  aqi: number;
  cityKey?: string;
  className?: string;
}

/**
 * Mounts animated pictograms from aircast-all-in-one.js (window.AirCastAnim.mount)
 * whenever AQI, city, or selected language changes.
 */
export const AqiPictogram: React.FC<AqiPictogramProps> = ({
  aqi,
  cityKey = '',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { currentLanguage, t } = useLanguage();

  useEffect(() => {
    const mountPictogram = () => {
      if (containerRef.current && window.AirCastAnim?.mount) {
        window.AirCastAnim.mount(containerRef.current, aqi);
        return true;
      }
      return false;
    };

    if (mountPictogram()) return;

    // Retry briefly in case deferred script is still initializing
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (mountPictogram() || attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 150);

    return () => window.clearInterval(timer);
  }, [aqi, cityKey, currentLanguage]);

  return (
    <div
      ref={containerRef}
      aria-label={t('a11yPictogramLabel')}
      className={`aircast-anim-host ${className}`}
    />
  );
};
