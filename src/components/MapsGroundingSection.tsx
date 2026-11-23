import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  MapPin,
  ExternalLink,
  Navigation,
  ShieldCheck,
  Search,
  Sparkles,
  TreePine,
  Hospital,
  Radio,
  Compass,
  Building2,
  PhoneCall,
  LocateFixed,
  Pill,
  Clock,
  AlertCircle,
  List,
  RefreshCw
} from 'lucide-react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMapsLibrary,
  useMap,
  useApiLoadingStatus,
  useAdvancedMarkerRef,
  APILoadingStatus
} from '@vis.gl/react-google-maps';
import { CityData } from '../data/cities';
import { getSanctuariesForCity, SanctuaryPlace } from '../data/citySanctuaries';

interface MapsGroundingSectionProps {
  selectedCity: CityData;
}

export interface LiveMedicalPlace {
  id: string;
  name: string;
  kind: 'hospital' | 'pharmacy';
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  openNow: boolean | null;
  phoneNumber: string | null;
  directionsUri: string;
  googleMapsUri: string;
  weekdayHours?: string[];
}

interface GooglePlaceLike {
  id?: string;
  displayName?: string | null;
  location?: {
    lat: number | (() => number);
    lng: number | (() => number);
  } | null;
  formattedAddress?: string | null;
  nationalPhoneNumber?: string | null;
  internationalPhoneNumber?: string | null;
  regularOpeningHours?: { weekdayDescriptions?: string[] } | null;
  googleMapsURI?: string | null;
  primaryType?: string | null;
  types?: string[] | null;
  isOpen?: () => Promise<boolean | undefined>;
}

interface GroundedSearchPlace {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

type FilterTab = 'medical' | 'hospitals' | 'pharmacies' | 'parks' | 'stations' | 'walking' | 'all';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildDirectionsUrl(lat: number, lng: number, name: string, placeId?: string): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${lat},${lng}`
  });
  if (placeId) {
    params.set('destination_place_id', placeId);
  } else if (name) {
    params.set('destination', `${name}, ${lat},${lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function classifyKind(primaryType?: string | null, types?: string[] | null, queryHint?: 'hospital' | 'pharmacy'): 'hospital' | 'pharmacy' {
  const all = [primaryType || '', ...(types || [])].join(' ').toLowerCase();
  if (all.includes('pharmacy') || all.includes('drugstore')) return 'pharmacy';
  if (all.includes('hospital') || all.includes('emergency') || all.includes('medical') || all.includes('doctor')) return 'hospital';
  return queryHint || 'hospital';
}

function isQuotaErrorLike(err: unknown): boolean {
  const msg = String((err as { message?: string; status?: string; code?: unknown })?.message || err || '').toLowerCase();
  const status = String((err as { status?: string; code?: unknown })?.status || (err as { code?: unknown })?.code || '').toLowerCase();
  return (
    status === '429' ||
    status === 'over_query_limit' ||
    status === 'resource_exhausted' ||
    msg.includes('429') ||
    msg.includes('over_query_limit') ||
    msg.includes('overquotamaperror') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota')
  );
}

interface LiveMarkerItemProps {
  place: LiveMedicalPlace;
  isSelected: boolean;
  onSelect: (place: LiveMedicalPlace) => void;
  onClose: () => void;
}

const LiveMarkerWithInfoWindow: React.FC<LiveMarkerItemProps> = ({
  place,
  isSelected,
  onSelect,
  onClose
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const isPharmacy = place.kind === 'pharmacy';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: place.lat, lng: place.lng }}
        title={`${place.name} (${place.distanceKm.toFixed(1)} km)`}
        onClick={() => onSelect(place)}
      >
        <Pin
          background={isPharmacy ? '#059669' : '#dc2626'}
          borderColor={isPharmacy ? '#065f46' : '#991b1b'}
          glyphColor="#ffffff"
          glyphText={isPharmacy ? 'Rx' : 'H'}
          scale={isSelected ? 1.25 : 1.0}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} onCloseClick={onClose} maxWidth={260}>
          <div className="text-slate-900 p-1 space-y-1.5 text-xs font-sans">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isPharmacy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isPharmacy ? 'Pharmacy' : 'Hospital'}
              </span>
              <span className="font-mono font-bold text-slate-700">{place.distanceKm.toFixed(1)} km</span>
            </div>
            <h4 className="font-extrabold text-sm leading-snug text-slate-950">{place.name}</h4>
            <p className="text-[11px] text-slate-600 leading-tight">{place.address}</p>
            <div className="text-[11px] font-semibold">
              {place.openNow === true && <span className="text-emerald-700">● Open now</span>}
              {place.openNow === false && <span className="text-rose-700">● Closed now</span>}
              {place.openNow === null && <span className="text-slate-500">Opening hours unverified</span>}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {place.phoneNumber && (
                <a
                  href={`tel:${place.phoneNumber}`}
                  className="px-2.5 py-1 rounded bg-slate-900 text-white font-bold text-[11px] no-underline hover:bg-slate-700"
                >
                  Call
                </a>
              )}
              <a
                href={place.directionsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] no-underline hover:bg-emerald-700"
              >
                Directions
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

interface MapsCanvasControllerProps {
  center: { lat: number; lng: number };
  anchorLabel: string;
  places: LiveMedicalPlace[];
  selectedPlaceId: string | null;
  onSelectPlace: (place: LiveMedicalPlace | null) => void;
  onPlacesLoaded: (places: LiveMedicalPlace[]) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string | null) => void;
  refreshNonce: number;
}

const MapsCanvasAndPlacesFetcher: React.FC<MapsCanvasControllerProps> = ({
  center,
  anchorLabel,
  places,
  selectedPlaceId,
  onSelectPlace,
  onPlacesLoaded,
  onLoadingChange,
  onError,
  refreshNonce
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const loadingStatus = useApiLoadingStatus();
  const cacheRef = useRef<Record<string, LiveMedicalPlace[]>>({});
  const lastCenteredKeyRef = useRef<string>('');

  // Keep map centered smoothly when anchor changes
  useEffect(() => {
    if (!map) return;
    const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)}`;
    if (lastCenteredKeyRef.current !== key) {
      lastCenteredKeyRef.current = key;
      map.panTo(center);
      map.setZoom(13);
    }
  }, [map, center.lat, center.lng]);

  // Trigger quota banner if Maps JS fails auth / quota
  useEffect(() => {
    if (loadingStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      onError('Google Maps authentication or quota limit was reached. Please check API access or retry later.');
    } else if (loadingStatus === APILoadingStatus.FAILED) {
      onError('Unable to load Google Maps JavaScript SDK. Please check network access.');
    }
  }, [loadingStatus, onError]);

  const fetchViaServerProxy = useCallback(async (lat: number, lng: number): Promise<LiveMedicalPlace[]> => {
    const res = await fetch('/api/maps/places-nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, types: ['hospital', 'pharmacy'], radiusMeters: 15000 })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 429 || data?.quotaExceeded) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      throw new Error(data?.error || `Places lookup failed (${res.status})`);
    }
    const rawPlaces: any[] = Array.isArray(data?.places) ? data.places : [];
    const results: LiveMedicalPlace[] = [];
    const seenIds: Record<string, boolean> = {};
    for (const p of rawPlaces) {
      const pLat = p?.location?.latitude;
      const pLng = p?.location?.longitude;
      if (typeof pLat !== 'number' || typeof pLng !== 'number') continue;
      const id = String(p.id || `${pLat},${pLng}`);
      if (seenIds[id]) continue;
      seenIds[id] = true;
      const name = p?.displayName?.text || 'Medical Facility';
      const dist = haversineKm(lat, lng, pLat, pLng);
      results.push({
        id,
        name,
        kind: classifyKind(p.primaryType, p.types),
        address: p.formattedAddress || anchorLabel,
        lat: pLat,
        lng: pLng,
        distanceKm: dist,
        openNow: typeof p?.currentOpeningHours?.openNow === 'boolean' ? p.currentOpeningHours.openNow : null,
        phoneNumber: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
        directionsUri: buildDirectionsUrl(pLat, pLng, name, p.id),
        googleMapsUri: p.googleMapsUri || buildDirectionsUrl(pLat, pLng, name, p.id),
        weekdayHours: p?.regularOpeningHours?.weekdayDescriptions
      });
    }
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results;
  }, [anchorLabel]);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${center.lat.toFixed(3)}_${center.lng.toFixed(3)}`;

    if (refreshNonce === 0 && cacheRef.current[cacheKey]) {
      onPlacesLoaded(cacheRef.current[cacheKey]);
      onError(null);
      return;
    }

    const loadNearbyHospitalsAndPharmacies = async () => {
      onLoadingChange(true);
      onError(null);

      try {
        if (placesLib?.Place && typeof placesLib.Place.searchNearby === 'function') {
          const { Place, SearchNearbyRankPreference } = placesLib;
          const fields = [
            'id',
            'displayName',
            'location',
            'formattedAddress',
            'nationalPhoneNumber',
            'internationalPhoneNumber',
            'regularOpeningHours',
            'googleMapsURI',
            'primaryType',
            'types'
          ];

          const [hospRes, pharmRes] = await Promise.allSettled([
            Place.searchNearby({
              fields,
              locationRestriction: { center, radius: 15000 },
              includedTypes: ['hospital'],
              maxResultCount: 10,
              rankPreference: SearchNearbyRankPreference.DISTANCE
            }),
            Place.searchNearby({
              fields,
              locationRestriction: { center, radius: 10000 },
              includedTypes: ['pharmacy'],
              maxResultCount: 10,
              rankPreference: SearchNearbyRankPreference.DISTANCE
            })
          ]);

          const combined: Array<{ place: GooglePlaceLike; hint: 'hospital' | 'pharmacy' }> = [];
          let sdkError: unknown = null;

          if (hospRes.status === 'fulfilled' && hospRes.value?.places) {
            (hospRes.value.places as unknown as GooglePlaceLike[]).forEach((p) =>
              combined.push({ place: p, hint: 'hospital' })
            );
          } else if (hospRes.status === 'rejected') {
            sdkError = hospRes.reason;
          }

          if (pharmRes.status === 'fulfilled' && pharmRes.value?.places) {
            (pharmRes.value.places as unknown as GooglePlaceLike[]).forEach((p) =>
              combined.push({ place: p, hint: 'pharmacy' })
            );
          } else if (pharmRes.status === 'rejected' && !sdkError) {
            sdkError = pharmRes.reason;
          }

          if (combined.length > 0) {
            const seen: Record<string, boolean> = {};
            const mapped = await Promise.all(
              combined.map(async ({ place, hint }) => {
                const loc = place.location;
                const pLat = typeof loc?.lat === 'function' ? loc.lat() : (loc as unknown as { lat?: number })?.lat;
                const pLng = typeof loc?.lng === 'function' ? loc.lng() : (loc as unknown as { lng?: number })?.lng;
                if (typeof pLat !== 'number' || typeof pLng !== 'number') return null;

                const id = place.id || `${pLat},${pLng}`;
                if (seen[id]) return null;
                seen[id] = true;

                let openNow: boolean | null = null;
                try {
                  if (typeof place.isOpen === 'function') {
                    const status = await place.isOpen();
                    openNow = typeof status === 'boolean' ? status : null;
                  }
                } catch {
                  openNow = null;
                }

                const name = place.displayName || 'Medical Center';
                return {
                  id,
                  name,
                  kind: classifyKind(place.primaryType, place.types, hint),
                  address: place.formattedAddress || anchorLabel,
                  lat: pLat,
                  lng: pLng,
                  distanceKm: haversineKm(center.lat, center.lng, pLat, pLng),
                  openNow,
                  phoneNumber: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
                  directionsUri: buildDirectionsUrl(pLat, pLng, name, place.id),
                  googleMapsUri: place.googleMapsURI || buildDirectionsUrl(pLat, pLng, name, place.id),
                  weekdayHours: place.regularOpeningHours?.weekdayDescriptions
                } as LiveMedicalPlace;
              })
            );

            const cleanList = mapped
              .filter((x): x is LiveMedicalPlace => x !== null)
              .sort((a, b) => a.distanceKm - b.distanceKm);

            if (!cancelled) {
              cacheRef.current[cacheKey] = cleanList;
              onPlacesLoaded(cleanList);
            }
            return;
          }

          if (sdkError && isQuotaErrorLike(sdkError)) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
            throw sdkError;
          }
        }

        // Server-side Places API (New) proxy fallback if Places JS library isn't active or returned error
        const proxyList = await fetchViaServerProxy(center.lat, center.lng);
        if (!cancelled) {
          cacheRef.current[cacheKey] = proxyList;
          onPlacesLoaded(proxyList);
        }
      } catch (err: unknown) {
        if (isQuotaErrorLike(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unable to fetch nearby hospitals and pharmacies from Google Maps.';
          onError(msg);
          onPlacesLoaded([]);
        }
      } finally {
        if (!cancelled) onLoadingChange(false);
      }
    };

    loadNearbyHospitalsAndPharmacies();
    return () => {
      cancelled = true;
    };
  }, [placesLib, center.lat, center.lng, anchorLabel, refreshNonce, fetchViaServerProxy, onError, onLoadingChange, onPlacesLoaded]);

  return (
    <div className="w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-white/15 bg-slate-900">
      <GoogleMap
        defaultCenter={center}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        gestureHandling="cooperative"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        onClick={() => onSelectPlace(null)}
      >
        <AdvancedMarker position={center} title={`Search Center: ${anchorLabel}`}>
          <Pin background="#2563eb" borderColor="#1d4ed8" glyphColor="#ffffff" glyphText="●" scale={1.1} />
        </AdvancedMarker>

        {places.map((p) => (
          <LiveMarkerWithInfoWindow
            key={p.id}
            place={p}
            isSelected={selectedPlaceId === p.id}
            onSelect={(pl) => onSelectPlace(pl)}
            onClose={() => onSelectPlace(null)}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export const MapsGroundingSection: React.FC<MapsGroundingSectionProps> = ({
  selectedCity
}) => {
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [keyChecked, setKeyChecked] = useState<boolean>(
    () => Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
  );

  // Visitor geolocation state (optional; falls back cleanly to selectedCity if denied)
  const [visitorCoords, setVisitorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [useVisitorLocation, setUseVisitorLocation] = useState<boolean>(true);
  const [geoStatusMessage, setGeoStatusMessage] = useState<string>(
    `Checking browser location permission (defaults to ${selectedCity.name} if unavailable)...`
  );

  // Tab & View state
  const [queryCategory, setQueryCategory] = useState<FilterTab>('medical');
  const [showPlainTextList, setShowPlainTextList] = useState<boolean>(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Live Google Places Hospitals & Pharmacies
  const [livePlaces, setLivePlaces] = useState<LiveMedicalPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  // Existing Sanctuary / Stations / Parks / Trails & Gemini Maps Grounding Search
  const [sanctuaryPlaces, setSanctuaryPlaces] = useState<SanctuaryPlace[]>([]);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [isGroundingLoading, setIsGroundingLoading] = useState<boolean>(false);
  const [groundedText, setGroundedText] = useState<string>('');
  const [groundedLinks, setGroundedLinks] = useState<GroundedSearchPlace[]>([]);
  const [groundingError, setGroundingError] = useState<string | null>(null);

  // Resolve runtime Google Maps API key if not in Vite build env
  useEffect(() => {
    if (mapsApiKey) {
      setKeyChecked(true);
      return;
    }
    let cancelled = false;
    fetch('/api/maps/config')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.apiKey) {
          setMapsApiKey(String(data.apiKey));
        }
      })
      .catch(() => {
        // handled cleanly below
      })
      .finally(() => {
        if (!cancelled) setKeyChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mapsApiKey]);

  const requestBrowserGeolocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setVisitorCoords(null);
      setUseVisitorLocation(false);
      setGeoStatusMessage(`Geolocation unsupported — showing results for ${selectedCity.name}.`);
      return;
    }

    setGeoStatusMessage('Requesting your current location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setVisitorCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setUseVisitorLocation(true);
        setGeoStatusMessage('Using your current location (allowed).');
      },
      () => {
        setVisitorCoords(null);
        setUseVisitorLocation(false);
        setGeoStatusMessage(`Location access denied — showing nearest results to ${selectedCity.name}.`);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
    );
  }, [selectedCity.name]);

  // Request visitor location gently once on mount; fallback automatically to selectedCity
  useEffect(() => {
    requestBrowserGeolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update fallback message when selectedCity changes and visitor location is off/denied
  useEffect(() => {
    if (!visitorCoords || !useVisitorLocation) {
      setGeoStatusMessage(
        visitorCoords
          ? `Showing nearest results to ${selectedCity.name} (selected city).`
          : `Location not shared — showing nearest results to ${selectedCity.name}.`
      );
    }
  }, [selectedCity.name, visitorCoords, useVisitorLocation]);

  // Active search anchor coordinates
  const activeCenter = useMemo(() => {
    if (useVisitorLocation && visitorCoords) {
      return visitorCoords;
    }
    return { lat: selectedCity.lat, lng: selectedCity.lng };
  }, [useVisitorLocation, visitorCoords, selectedCity.lat, selectedCity.lng]);

  const activeAnchorLabel = useMemo(() => {
    if (useVisitorLocation && visitorCoords) {
      return `Your Current Location (${visitorCoords.lat.toFixed(4)}, ${visitorCoords.lng.toFixed(4)})`;
    }
    return `${selectedCity.name}${selectedCity.state ? `, ${selectedCity.state}` : ''}, ${selectedCity.country}`;
  }, [useVisitorLocation, visitorCoords, selectedCity]);

  // Preserve existing sanctuaries for Parks, CAAQMS Stations, Walking Trails
  useEffect(() => {
    const cityData = getSanctuariesForCity(
      selectedCity.id,
      selectedCity.name,
      selectedCity.state,
      selectedCity.country,
      selectedCity.lat,
      selectedCity.lng
    );

    if (queryCategory === 'parks' || queryCategory === 'stations' || queryCategory === 'walking') {
      const filtered = cityData.places.filter((p) => p.category === queryCategory);
      setSanctuaryPlaces(filtered.length > 0 ? filtered : cityData.places);
    } else if (queryCategory === 'all') {
      setSanctuaryPlaces(cityData.places);
    } else {
      setSanctuaryPlaces([]);
    }

    setGroundedText(cityData.groundedSummary);
    setGroundedLinks([]);
    setGroundingError(null);
  }, [
    selectedCity.id,
    selectedCity.name,
    selectedCity.country,
    selectedCity.state,
    selectedCity.lat,
    selectedCity.lng,
    queryCategory
  ]);

  // Filter live Places API results by Hospitals / Pharmacies / All Medical and ensure strict distance ascending sort
  const filteredMedicalPlaces = useMemo(() => {
    const sorted = [...livePlaces].sort((a, b) => a.distanceKm - b.distanceKm);
    if (queryCategory === 'hospitals') {
      return sorted.filter((p) => p.kind === 'hospital');
    }
    if (queryCategory === 'pharmacies') {
      return sorted.filter((p) => p.kind === 'pharmacy');
    }
    return sorted;
  }, [livePlaces, queryCategory]);

  const isMedicalTab =
    queryCategory === 'medical' ||
    queryCategory === 'hospitals' ||
    queryCategory === 'pharmacies' ||
    queryCategory === 'all';

  const handleFetchGrounding = async (queryText?: string) => {
    const searchTarget = (queryText ?? customQuery).trim();
    if (!searchTarget) return;

    setIsGroundingLoading(true);
    setGroundingError(null);

    try {
      const response = await fetch('/api/maps/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${searchTarget} near ${activeAnchorLabel}`,
          lat: activeCenter.lat,
          lng: activeCenter.lng,
          cityName: activeAnchorLabel
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429 || data?.quotaExceeded) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        throw new Error(data?.error || `Maps grounding error (${response.status})`);
      }

      if (Array.isArray(data.places)) {
        setGroundedLinks(data.places);
      }
      if (data.text) {
        setGroundedText(data.text);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `Unable to fetch Maps Grounding results for ${selectedCity.name}.`;
      setGroundingError(msg);
      setGroundedLinks([]);
    } finally {
      setIsGroundingLoading(false);
    }
  };

  const tabs: Array<{ id: FilterTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'medical', label: 'Hospitals & Pharmacies', icon: Hospital },
    { id: 'hospitals', label: 'Hospitals Only', icon: Hospital },
    { id: 'pharmacies', label: 'Pharmacies Only', icon: Pill },
    { id: 'parks', label: 'Clean Air Parks & Canopy', icon: TreePine },
    { id: 'stations', label: 'CAAQMS Air Stations', icon: Radio },
    { id: 'walking', label: 'Low-Exposure Trails', icon: Compass },
    { id: 'all', label: 'All Verified Hubs', icon: Building2 }
  ];

  return (
    <section
      id="maps-grounding-section"
      aria-labelledby="clean-air-hospitals-heading"
      className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 py-6 sm:py-10"
    >
      <div className="bg-[#14202e] rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 border border-white/10 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00b050]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1f6feb]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-5 border-b border-white/10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#00b050]/20 border border-[#00b050]/40 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  Google Maps Platform Live
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-bold">
                  {useVisitorLocation && visitorCoords ? 'Your Current Location' : `${selectedCity.name}, ${selectedCity.country}`}
                </span>
              </div>
              <h2 id="clean-air-hospitals-heading" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Clean-Air Hospitals, Pharmacies &amp; Sanctuaries
              </h2>
              <p className="text-xs sm:text-sm text-[#bbc7da] max-w-2xl mt-1">
                Nearest hospitals and pharmacies sorted by distance from <strong>{activeAnchorLabel}</strong>, alongside clean-air sanctuaries and CAAQMS stations.
              </p>
            </div>

            {/* Visitor Location vs Selected City Controls */}
            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (visitorCoords) {
                      setUseVisitorLocation(true);
                    } else {
                      requestBrowserGeolocation();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    useVisitorLocation && visitorCoords
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'
                  }`}
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>Use My Location</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseVisitorLocation(false)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    !useVisitorLocation || !visitorCoords
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Use {selectedCity.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefreshNonce((n) => n + 1)}
                  title="Refresh nearby hospitals and pharmacies"
                  aria-label="Refresh nearby hospitals and pharmacies"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingPlaces ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-300" aria-live="polite">
                {geoStatusMessage}
              </p>
            </div>
          </div>

          {/* Mandatory Medical Safety Notice */}
          <div
            role="note"
            className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm font-bold">
              <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
              <span>Call ahead to confirm availability. In an emergency call 108.</span>
            </div>
            <a
              href="tel:108"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shrink-0 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 108 Emergency</span>
            </a>
          </div>

          {/* Filter Preset Tabs */}
          <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Filter nearby places">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = queryCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setQueryCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#00b050] text-white shadow-md'
                      : 'bg-white/5 text-[#bbc7da] hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Google Map & Live Nearby Hospitals / Pharmacies */}
          {isMedicalTab && (
            <div className="mb-7 space-y-5">
              {keyChecked && !mapsApiKey ? (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Google Maps API key is not active in this runtime yet.</p>
                    <p className="text-rose-200/80 mt-0.5">
                      Call ahead to confirm availability. In an emergency call 108. Use the Google Maps Grounding search below or select a sanctuary hub.
                    </p>
                  </div>
                </div>
              ) : !mapsApiKey ? (
                <div className="w-full h-[320px] sm:h-[380px] rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-xs text-slate-300 font-mono">
                  Initializing Google Maps...
                </div>
              ) : (
                <APIProvider apiKey={mapsApiKey} libraries={['places', 'marker']}>
                  <MapsCanvasAndPlacesFetcher
                    center={activeCenter}
                    anchorLabel={activeAnchorLabel}
                    places={filteredMedicalPlaces}
                    selectedPlaceId={selectedPlaceId}
                    onSelectPlace={(p) => setSelectedPlaceId(p?.id || null)}
                    onPlacesLoaded={setLivePlaces}
                    onLoadingChange={setIsLoadingPlaces}
                    onError={setPlacesError}
                    refreshNonce={refreshNonce}
                  />
                </APIProvider>
              )}

              {/* Places Fetch Error */}
              {placesError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{placesError}</span>
                </div>
              )}

              {/* Status & Screen-Reader Text List Toggle Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-300 font-mono" aria-live="polite">
                  {isLoadingPlaces ? (
                    <span>Searching Google Maps for nearest hospitals and pharmacies...</span>
                  ) : (
                    <span>
                      Showing <strong>{filteredMedicalPlaces.length}</strong> live Google Maps results sorted by distance
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlainTextList((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white cursor-pointer transition-colors"
                >
                  <List className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{showPlainTextList ? 'Hide Simple Text List' : 'Show Simple Text List'}</span>
                </button>
              </div>

              {/* Hospital & Pharmacy Visual Cards Grid */}
              {filteredMedicalPlaces.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMedicalPlaces.map((place) => {
                    const isPharmacy = place.kind === 'pharmacy';
                    const isSelected = selectedPlaceId === place.id;
                    return (
                      <article
                        key={place.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-400 shadow-lg'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isPharmacy
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {isPharmacy ? 'Pharmacy' : 'Hospital'}
                            </span>
                            <span className="text-xs font-mono font-bold text-cyan-300">
                              {place.distanceKm.toFixed(1)} km away
                            </span>
                          </div>

                          <div className="flex items-start gap-2.5 mb-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isPharmacy
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {isPharmacy ? <Pill className="w-4 h-4" /> : <Hospital className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPlaceId(place.id)}
                                className="text-left text-sm font-bold text-white hover:text-emerald-300 transition-colors leading-snug cursor-pointer"
                              >
                                {place.name}
                              </button>
                              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{place.address}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold mt-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {place.openNow === true && (
                              <span className="text-emerald-300">Open now</span>
                            )}
                            {place.openNow === false && (
                              <span className="text-rose-300">Closed now</span>
                            )}
                            {place.openNow === null && (
                              <span className="text-slate-400">Open status unavailable — call ahead</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                          {place.phoneNumber ? (
                            <a
                              href={`tel:${place.phoneNumber}`}
                              className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                              aria-label={`Call ${place.name} at ${place.phoneNumber}`}
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Call</span>
                            </a>
                          ) : (
                            <span className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/5 text-slate-400 font-semibold text-[11px]">
                              No phone listed
                            </span>
                          )}
                          <a
                            href={place.directionsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#00b050] hover:bg-[#009b46] text-white font-bold text-xs transition-colors"
                            aria-label={`Directions to ${place.name} on Google Maps`}
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Directions</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Simple Text List for Screen Readers (always in DOM sorted by distance; visually clear & accessible) */}
              <div
                role="region"
                aria-label="Nearest hospitals and pharmacies simple text list sorted by distance"
                className={showPlainTextList ? 'p-4 sm:p-5 rounded-2xl bg-[#0b131e] border border-white/15' : 'sr-only'}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <List className="w-4 h-4 text-emerald-400" />
                    <span>Accessible Text Directory (Sorted by Distance)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-amber-300">
                    Call ahead to confirm availability. In an emergency call 108.
                  </span>
                </div>

                {filteredMedicalPlaces.length === 0 ? (
                  <p className="text-xs text-slate-300">
                    {isLoadingPlaces
                      ? 'Loading nearest hospitals and pharmacies...'
                      : 'No nearby hospital or pharmacy listings loaded yet for this filter.'}
                  </p>
                ) : (
                  <ol className="space-y-2.5 text-xs sm:text-sm text-slate-100 list-decimal pl-5">
                    {filteredMedicalPlaces.map((place) => {
                      const openText =
                        place.openNow === true
                          ? 'Open now'
                          : place.openNow === false
                          ? 'Closed now'
                          : 'Hours unavailable';
                      const typeLabel = place.kind === 'pharmacy' ? 'Pharmacy' : 'Hospital';
                      return (
                        <li key={`list-${place.id}`} className="leading-relaxed">
                          <span className="font-bold text-white">{place.name}</span>
                          {' — '}
                          <span>{typeLabel}</span>
                          {', '}
                          <span>{place.distanceKm.toFixed(1)} kilometers away</span>
                          {', '}
                          <span
                            className={
                              place.openNow === true
                                ? 'text-emerald-300 font-semibold'
                                : place.openNow === false
                                ? 'text-rose-300 font-semibold'
                                : 'text-slate-300'
                            }
                          >
                            {openText}
                          </span>
                          {place.address ? `. Address: ${place.address}.` : '.'}{' '}
                          <span className="inline-flex flex-wrap items-center gap-2 ml-1">
                            {place.phoneNumber && (
                              <a
                                href={`tel:${place.phoneNumber}`}
                                className="underline text-cyan-300 hover:text-cyan-200 font-semibold"
                              >
                                Call ({place.phoneNumber})
                              </a>
                            )}
                            <a
                              href={place.directionsUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-emerald-300 hover:text-emerald-200 font-semibold"
                            >
                              Directions
                            </a>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          )}

          {/* Custom Gemini Maps Grounding Search Bar */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  aria-label={`Search Google Maps places near ${selectedCity.name}`}
                  placeholder={`Ask Google Maps Grounding: e.g. 24-hour pharmacies or pulmonary clinics near ${selectedCity.name}...`}
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFetchGrounding(customQuery);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00b050] transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => handleFetchGrounding(customQuery)}
                disabled={isGroundingLoading || !customQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#00b050] hover:bg-[#009b46] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isGroundingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching Google Maps...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Search via Maps Grounding</span>
                  </>
                )}
              </button>
            </div>

            {groundingError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{groundingError}</span>
              </div>
            )}

            {/* Preserved Sanctuary Hubs (Parks, CAAQMS Stations, Trails) */}
            {sanctuaryPlaces.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                {sanctuaryPlaces.map((place, idx) => {
                  const isHospital = place.category === 'hospitals';
                  const isPark = place.category === 'parks';
                  const isStation = place.category === 'stations';

                  return (
                    <a
                      key={`sanctuary-${idx}`}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00b050]/50 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-cyan-300">
                            {place.categoryLabel || place.category}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            ~{place.distanceKm} km away
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 mb-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isHospital
                                ? 'bg-rose-500/20 text-rose-400'
                                : isPark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isStation
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {isHospital ? (
                              <Hospital className="w-4 h-4" />
                            ) : isPark ? (
                              <TreePine className="w-4 h-4" />
                            ) : isStation ? (
                              <Radio className="w-4 h-4" />
                            ) : (
                              <Compass className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-[#00b050] transition-colors leading-snug">
                              {place.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{place.address}</p>
                          </div>
                        </div>

                        <p className="text-xs text-[#bbc7da] leading-relaxed line-clamp-3 mb-2">
                          {place.description}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-semibold text-slate-400 bg-black/40 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                          {place.badge}
                        </span>
                        <span className="text-[#00b050] group-hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors">
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Grounded Sources & Summary from Google Maps Grounding */}
            {groundedLinks.length > 0 && (
              <div className="mb-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                <h4 className="text-xs font-bold text-emerald-300 mb-2.5 uppercase tracking-wider">
                  Verified Google Maps Grounding Sources
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {groundedLinks.map((gPlace, idx) => (
                    <li key={`glink-${idx}`} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <a
                        href={gPlace.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:text-emerald-300 flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{gPlace.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      </a>
                      {gPlace.reviewSnippets && gPlace.reviewSnippets.length > 0 && (
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                          "{gPlace.reviewSnippets[0]}"
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {groundedText && (
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 text-xs text-[#bbc7da] leading-relaxed">
                <div className="flex items-center gap-2 text-white font-bold text-xs mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00b050]" />
                  <span>Geospatial Intelligence Summary • {selectedCity.name}, {selectedCity.country}</span>
                </div>
                <p className="whitespace-pre-line text-slate-300">{groundedText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
