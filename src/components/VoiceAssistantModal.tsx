import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquareQuote,
  Send,
  Search,
  Square,
  LogOut,
  Languages,
  Zap,
  Compass,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { CityData, CITIES } from '../data/cities';
import { pm25ToAqi } from '../utils/aqi';
import { LANGUAGES, LanguageCode } from '../utils/i18n';
import { useLanguage } from '../context/LanguageContext';
import { analyzeVoiceQueryOffThread } from '../utils/aiWorkerClient';
import {
  findBestCityMatch,
  findCountryMatch,
  findStateMatch,
  findCityInScope,
  isLocationChangeCommand,
  detectGuidedLocationTrigger
} from '../utils/placeMatcher';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
  currentAqi: number;
  onSelectCity?: (city: CityData) => void;
}

interface TranscriptEntry {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  location?: string;
  aqi?: number;
  language?: string;
  isStreaming?: boolean;
  workerDirectives?: string;
}

// Map app language code to BCP-47 speech synthesis & recognition tag
const getBcp47Tag = (code: string): string => {
  const map: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
    gu: 'gu-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    ur: 'ur-PK',
    or: 'or-IN',
    as: 'as-IN',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    ru: 'ru-RU',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    id: 'id-ID',
    tr: 'tr-TR',
    vi: 'vi-VN',
    fa: 'fa-IR',
    pl: 'pl-PL',
    uk: 'uk-UA',
    nl: 'nl-NL',
    th: 'th-TH',
    sw: 'sw-KE',
    el: 'el-GR',
    he: 'he-IL',
    sv: 'sv-SE',
    ms: 'ms-MY',
    tl: 'fil-PH'
  };
  return map[code] || 'en-US';
};

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  currentAqi,
  onSelectCity
}) => {
  type GuidedStep = 'idle' | 'country' | 'state' | 'city';

  const { currentLanguage, setLanguage } = useLanguage();
  const [activeCity, setActiveCity] = useState<CityData>(selectedCity);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<LanguageCode>(currentLanguage);
  const [inputText, setInputText] = useState<string>('');
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Voice Engine Ready');

  // Voice-Guided Location Selector state
  const [guidedStep, setGuidedStep] = useState<GuidedStep>('idle');
  const [guidedCountry, setGuidedCountry] = useState<string>(selectedCity.country);
  const [guidedState, setGuidedState] = useState<string>(selectedCity.state);
  const [guidedHint, setGuidedHint] = useState<string>('');

  const currentLangObj = LANGUAGES.find(l => l.code === selectedVoiceLang) || LANGUAGES[0];

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([
    {
      sender: 'assistant',
      text: `Hello! I am your AirCast Global Voice Assistant. I explain real-time air quality, PM2.5 levels, and can switch your Country, State, and City by voice. Tap Voice Location or say "Change country to Japan" or "Switch state to Kerala".`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: selectedCity.name,
      aqi: currentAqi,
      language: currentLangObj.name
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const transcriptsEndRef = useRef<HTMLDivElement | null>(null);
  const guidedStepRef = useRef<GuidedStep>('idle');
  const guidedCountryRef = useRef<string>(selectedCity.country);
  const guidedStateRef = useRef<string>(selectedCity.state);
  const micAutoTimerRef = useRef<number | null>(null);

  const setGuidedStepSynced = (step: GuidedStep) => {
    guidedStepRef.current = step;
    setGuidedStep(step);
  };

  const setGuidedCountrySynced = (country: string) => {
    guidedCountryRef.current = country;
    setGuidedCountry(country);
  };

  const setGuidedStateSynced = (state: string) => {
    guidedStateRef.current = state;
    setGuidedState(state);
  };

  // Unique country, state, and city lists for the guided selector
  const availableCountries = useMemo(() => {
    const list = Array.from(new Set(CITIES.map(c => c.country)));
    return ['India', ...list.filter(c => c !== 'India')];
  }, []);

  const availableStatesInCountry = useMemo(() => {
    return Array.from(
      new Set(CITIES.filter(c => c.country === guidedCountry).map(c => c.state))
    );
  }, [guidedCountry]);

  const availableCitiesInState = useMemo(() => {
    return CITIES.filter(c => c.country === guidedCountry && c.state === guidedState);
  }, [guidedCountry, guidedState]);

  // Sync with prop when selectedCity changes externally
  useEffect(() => {
    setActiveCity(selectedCity);
    if (guidedStepRef.current === 'idle') {
      setGuidedCountrySynced(selectedCity.country);
      setGuidedStateSynced(selectedCity.state);
    }
  }, [selectedCity]);

  // Sync voice language when global language changes
  useEffect(() => {
    setSelectedVoiceLang(currentLanguage);
  }, [currentLanguage]);

  // Scroll transcripts to bottom
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, isTalking]);

  const clearMicTimer = () => {
    if (micAutoTimerRef.current !== null) {
      window.clearTimeout(micAutoTimerRef.current);
      micAutoTimerRef.current = null;
    }
  };

  // Stop all voice processes and clean up
  const handleStopSpeaking = () => {
    clearMicTimer();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    }
    setIsTalking(false);
    setIsListening(false);
    setConnectionStatus('Voice stopped');
  };

  const cancelGuidedLocation = (announce = false) => {
    setGuidedStepSynced('idle');
    setGuidedHint('');
    if (announce) {
      const msg = 'Voice location selector closed.';
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: msg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: activeCity.name,
          language: currentLangObj.name
        }
      ]);
      speakText(msg, selectedVoiceLang);
    }
  };

  // Exit assistant completely
  const handleExit = () => {
    setGuidedStepSynced('idle');
    setGuidedHint('');
    handleStopSpeaking();
    onClose();
  };

  // Cleanup speech synthesis on unmount or close
  useEffect(() => {
    if (!isOpen) {
      setGuidedStepSynced('idle');
      setGuidedHint('');
      handleStopSpeaking();
    }
  }, [isOpen]);

  // Filter cities for quick selector
  const filteredCities = searchFilter.trim()
    ? CITIES.filter(
        c =>
          c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          c.country.toLowerCase().includes(searchFilter.toLowerCase()) ||
          c.state.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (c.district && c.district.toLowerCase().includes(searchFilter.toLowerCase()))
      ).slice(0, 8)
    : CITIES.slice(0, 8);

  // Speak aloud function using browser SpeechSynthesis with language matching & post-speech callback
  const speakText = (text: string, langCode: LanguageCode, onAfterSpeak?: () => void) => {
    clearMicTimer();
    let settled = false;
    const finishSpeech = () => {
      if (settled) return;
      settled = true;
      setIsTalking(false);
      setConnectionStatus('Ready');
      if (onAfterSpeak) {
        micAutoTimerRef.current = window.setTimeout(() => {
          onAfterSpeak();
        }, 160);
      }
    };

    if (isMuted || !('speechSynthesis' in window)) {
      finishSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const bcpTag = getBcp47Tag(langCode);
    utterance.lang = bcpTag;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick matching voice for the target language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find(v => v.lang.toLowerCase() === bcpTag.toLowerCase()) ||
      voices.find(v => v.lang.toLowerCase().startsWith(bcpTag.slice(0, 2).toLowerCase())) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    const safetyTimeoutMs = Math.max(4500, text.split(/\s+/).length * 480 + 2500);
    const safetyTimer = window.setTimeout(finishSpeech, safetyTimeoutMs);

    utterance.onstart = () => {
      setIsTalking(true);
      setConnectionStatus(`Speaking in ${currentLangObj.name}...`);
    };

    utterance.onend = () => {
      window.clearTimeout(safetyTimer);
      finishSpeech();
    };

    utterance.onerror = () => {
      window.clearTimeout(safetyTimer);
      finishSpeech();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start SpeechRecognition cleanly (prevents hearing itself)
  const beginRecognitionSession = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setConnectionStatus('Speech recognition unavailable. Type or tap an option below.');
      return;
    }

    clearMicTimer();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsTalking(false);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore stop error
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getBcp47Tag(selectedVoiceLang);

      recognition.onstart = () => {
        setIsListening(true);
        const step = guidedStepRef.current;
        if (step !== 'idle') {
          setConnectionStatus(`Listening for ${step}... Speak now.`);
        } else {
          setConnectionStatus(`Listening in ${currentLangObj.name}... Speak now.`);
        }
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results?.[0]?.[0]?.transcript;
        if (spokenText) {
          setInputText(spokenText);
          if (guidedStepRef.current !== 'idle') {
            handleGuidedLocationInput(spokenText);
          } else {
            handleAskAssistant(spokenText);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
        setConnectionStatus('Microphone closed. Tap mic or choose below.');
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Speech recognition init notice:', e.message);
      setIsListening(false);
    }
  };

  const formatFullLocationLabel = (city: CityData) => {
    const parts = [city.name];
    if (city.state && city.state !== city.name) parts.push(city.state);
    parts.push(city.country);
    return parts.join(', ');
  };

  // Start or jump to a step in Voice-Guided Location Selector
  const startGuidedLocationSelector = (startAt: 'country' | 'state' | 'city' = 'country') => {
    handleStopSpeaking();
    setShowCityPicker(false);

    if (startAt === 'country') {
      setGuidedStepSynced('country');
      const promptMsg =
        'Voice location selector active. Step 1: Say the country name, such as India, United States, Japan, or United Kingdom.';
      setGuidedHint('Say a country name (e.g. India, Japan, United States)');
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: promptMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: activeCity.name,
          language: currentLangObj.name
        }
      ]);
      speakText(promptMsg, selectedVoiceLang, beginRecognitionSession);
      return;
    }

    if (startAt === 'state') {
      const curCountry = guidedCountryRef.current || activeCity.country;
      setGuidedCountrySynced(curCountry);
      const statesInCountry = Array.from(
        new Set(CITIES.filter(c => c.country === curCountry).map(c => c.state))
      );
      const examples = statesInCountry.slice(0, 4).join(', ');
      setGuidedStepSynced('state');
      const promptMsg = `Step 2 for ${curCountry}: Say the state or region, for example ${examples}, or say skip.`;
      setGuidedHint(`Say a state or region in ${curCountry} (or say skip)`);
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: promptMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: curCountry,
          language: currentLangObj.name
        }
      ]);
      speakText(promptMsg, selectedVoiceLang, beginRecognitionSession);
      return;
    }

    const curCountry = guidedCountryRef.current || activeCity.country;
    const curState = guidedStateRef.current || activeCity.state;
    setGuidedCountrySynced(curCountry);
    setGuidedStateSynced(curState);
    const citiesInScope = CITIES.filter(c => c.country === curCountry && c.state === curState);
    const examples = citiesInScope.slice(0, 4).map(c => c.name).join(', ');
    setGuidedStepSynced('city');
    const promptMsg = `Step 3 for ${curState}, ${curCountry}: Say the city or district, for example ${examples}.`;
    setGuidedHint(`Say a city or district in ${curState}`);
    setTranscripts(prev => [
      ...prev,
      {
        sender: 'assistant',
        text: promptMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: curState,
        language: currentLangObj.name
      }
    ]);
    speakText(promptMsg, selectedVoiceLang, beginRecognitionSession);
  };

  // Complete location switch and speak final confirmation
  const completeGuidedLocation = (city: CityData, customPrefix?: string) => {
    setGuidedCountrySynced(city.country);
    setGuidedStateSynced(city.state);
    setActiveCity(city);
    onSelectCity?.(city);
    setGuidedStepSynced('idle');
    setGuidedHint('');

    const cityAqi = pm25ToAqi(city.basePm25);
    const fullLabel = formatFullLocationLabel(city);
    const confirmationText = `${customPrefix ? customPrefix + ' ' : ''}Location updated to ${fullLabel}. Current air quality is ${cityAqi.category} with AQI ${cityAqi.aqi} and PM2.5 ${city.basePm25} micrograms per cubic metre.`;

    setTranscripts(prev => [
      ...prev,
      {
        sender: 'assistant',
        text: confirmationText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: city.name,
        aqi: cityAqi.aqi,
        language: currentLangObj.name
      }
    ]);
    setConnectionStatus(`Updated to ${fullLabel}`);
    speakText(confirmationText, selectedVoiceLang);
  };

  // Process spoken or tapped choice inside Voice-Guided Location Selector
  const handleGuidedLocationInput = (rawText: string) => {
    const q = rawText.trim();
    if (!q) return;

    setInputText('');
    setTranscripts(prev => [
      ...prev,
      {
        sender: 'user',
        text: q,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: activeCity.name
      }
    ]);

    const lower = q.toLowerCase();
    if (/^(?:cancel|stop|exit|close|nevermind|never mind)$/i.test(lower)) {
      cancelGuidedLocation(true);
      return;
    }

    if (/^(?:skip|done|keep|confirm|finish)$/i.test(lower)) {
      const target =
        CITIES.find(
          c => c.country === guidedCountryRef.current && c.state === guidedStateRef.current
        ) || activeCity;
      completeGuidedLocation(target);
      return;
    }

    if (/^(?:back|previous|go back)$/i.test(lower)) {
      if (guidedStepRef.current === 'city') {
        startGuidedLocationSelector('state');
      } else {
        startGuidedLocationSelector('country');
      }
      return;
    }

    const step = guidedStepRef.current;

    if (step === 'country') {
      const matchedCountry = findCountryMatch(q);
      if (matchedCountry) {
        const countryCities = CITIES.filter(c => c.country === matchedCountry);
        const statesInCountry = Array.from(new Set(countryCities.map(c => c.state)));
        const defaultCity = countryCities[0] || activeCity;
        setGuidedCountrySynced(matchedCountry);
        setGuidedStateSynced(defaultCity.state);
        setActiveCity(defaultCity);
        onSelectCity?.(defaultCity);

        if (statesInCountry.length > 1) {
          const examples = statesInCountry.slice(0, 4).join(', ');
          const msg = `Country set to ${matchedCountry}. Step 2: Say the state or region, such as ${examples}, or say skip.`;
          setGuidedStepSynced('state');
          setGuidedHint(`Country: ${matchedCountry} · Say state or say skip`);
          setTranscripts(prev => [
            ...prev,
            {
              sender: 'assistant',
              text: msg,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              location: matchedCountry,
              language: currentLangObj.name
            }
          ]);
          speakText(msg, selectedVoiceLang, beginRecognitionSession);
        } else {
          completeGuidedLocation(defaultCity);
        }
        return;
      }

      // Allow jumping directly if user named a state or city on Step 1
      const directCity = findBestCityMatch(q);
      if (directCity) {
        const directStateMatch = findStateMatch(q);
        const citiesInState = CITIES.filter(
          c => c.country === directCity.country && c.state === directCity.state
        );
        if (directStateMatch && citiesInState.length > 1 && directStateMatch.toLowerCase() !== directCity.name.toLowerCase()) {
          setGuidedCountrySynced(directCity.country);
          setGuidedStateSynced(directCity.state);
          setActiveCity(directCity);
          onSelectCity?.(directCity);
          const examples = citiesInState.slice(0, 4).map(c => c.name).join(', ');
          const msg = `Selected ${directCity.state}, ${directCity.country}. Step 3: Say a city or district such as ${examples}, or say skip.`;
          setGuidedStepSynced('city');
          setGuidedHint(`State: ${directCity.state} · Say city or say skip`);
          setTranscripts(prev => [
            ...prev,
            {
              sender: 'assistant',
              text: msg,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              location: directCity.state,
              language: currentLangObj.name
            }
          ]);
          speakText(msg, selectedVoiceLang, beginRecognitionSession);
        } else {
          completeGuidedLocation(directCity);
        }
        return;
      }

      const retryMsg =
        'I did not catch that country. Please say a country like India, United States, Japan, or United Kingdom, or say cancel.';
      setGuidedHint('Try saying India, United States, Japan, or cancel');
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: retryMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: activeCity.name,
          language: currentLangObj.name
        }
      ]);
      speakText(retryMsg, selectedVoiceLang, beginRecognitionSession);
      return;
    }

    if (step === 'state') {
      const matchedState = findStateMatch(q, guidedCountryRef.current);
      if (matchedState) {
        const stateCities = CITIES.filter(c => c.state === matchedState);
        const primaryCity =
          stateCities.find(c => c.country === guidedCountryRef.current) || stateCities[0];
        if (primaryCity) {
          setGuidedCountrySynced(primaryCity.country);
          setGuidedStateSynced(primaryCity.state);
          setActiveCity(primaryCity);
          onSelectCity?.(primaryCity);

          const citiesInScope = CITIES.filter(
            c => c.country === primaryCity.country && c.state === primaryCity.state
          );
          if (citiesInScope.length > 1) {
            const examples = citiesInScope.slice(0, 4).map(c => c.name).join(', ');
            const msg = `State set to ${primaryCity.state}. Step 3: Say the city or district, such as ${examples}, or say skip.`;
            setGuidedStepSynced('city');
            setGuidedHint(`State: ${primaryCity.state} · Say city or district`);
            setTranscripts(prev => [
              ...prev,
              {
                sender: 'assistant',
                text: msg,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                location: primaryCity.state,
                language: currentLangObj.name
              }
            ]);
            speakText(msg, selectedVoiceLang, beginRecognitionSession);
          } else {
            completeGuidedLocation(primaryCity);
          }
          return;
        }
      }

      const directCity = findBestCityMatch(q);
      if (directCity) {
        completeGuidedLocation(directCity);
        return;
      }

      const fallbackStates = CITIES.filter(c => c.country === guidedCountryRef.current);
      const stateSamples = Array.from(new Set(fallbackStates.map(c => c.state)))
        .slice(0, 3)
        .join(', ');
      const retryMsg = `I did not find that state in ${guidedCountryRef.current}. Say a state such as ${stateSamples}, or say skip.`;
      setGuidedHint(`Try ${stateSamples}, or say skip`);
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: retryMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: guidedCountryRef.current,
          language: currentLangObj.name
        }
      ]);
      speakText(retryMsg, selectedVoiceLang, beginRecognitionSession);
      return;
    }

    if (step === 'city') {
      const matchedCity = findCityInScope(q, guidedCountryRef.current, guidedStateRef.current);
      if (matchedCity) {
        completeGuidedLocation(matchedCity);
        return;
      }

      const citySamples = CITIES.filter(
        c => c.country === guidedCountryRef.current && c.state === guidedStateRef.current
      )
        .slice(0, 3)
        .map(c => c.name)
        .join(', ');
      const retryMsg = `I could not match that city. Please say a city such as ${citySamples || activeCity.name}, or say cancel.`;
      setGuidedHint(`Try ${citySamples || activeCity.name}, or say cancel`);
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: retryMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: guidedStateRef.current,
          language: currentLangObj.name
        }
      ]);
      speakText(retryMsg, selectedVoiceLang, beginRecognitionSession);
    }
  };

  // Submit question for ANY city / state / country with direct voice location switching & stream telemetry
  const handleAskAssistant = async (questionText: string, targetCityData?: CityData) => {
    const q = questionText.trim();
    if (!q) return;

    if (!targetCityData && guidedStepRef.current !== 'idle') {
      handleGuidedLocationInput(q);
      return;
    }

    const guidedTrigger = !targetCityData ? detectGuidedLocationTrigger(q) : null;
    if (guidedTrigger) {
      setInputText('');
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'user',
          text: q,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: activeCity.name
        }
      ]);
      startGuidedLocationSelector(guidedTrigger);
      return;
    }

    const matchedPlace = !targetCityData ? findBestCityMatch(q) : null;
    const cityToQuery = targetCityData || matchedPlace || activeCity;
    if (matchedPlace && matchedPlace.id !== activeCity.id) {
      setActiveCity(matchedPlace);
      setGuidedCountrySynced(matchedPlace.country);
      setGuidedStateSynced(matchedPlace.state);
      onSelectCity?.(matchedPlace);
    }
    const cityAqi = pm25ToAqi(cityToQuery.basePm25);

    // Stop ongoing speech
    handleStopSpeaking();

    // If user issued a direct location switch (e.g. "Change country to Japan", "Switch state to Kerala", or "Madurai"),
    // update app state immediately and speak confirmation out loud without waiting on external streams.
    if (matchedPlace && isLocationChangeCommand(q)) {
      setInputText('');
      const fullLabel = formatFullLocationLabel(matchedPlace);
      const confirmationText = `Location changed to ${fullLabel}. Current air quality is ${cityAqi.category} with AQI ${cityAqi.aqi} and PM2.5 ${matchedPlace.basePm25} micrograms per cubic metre.`;
      setTranscripts(prev => [
        ...prev,
        {
          sender: 'user',
          text: q,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: matchedPlace.name
        },
        {
          sender: 'assistant',
          text: confirmationText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: matchedPlace.name,
          aqi: cityAqi.aqi,
          language: currentLangObj.name
        }
      ]);
      setConnectionStatus(`Switched to ${fullLabel}`);
      speakText(confirmationText, selectedVoiceLang);
      return;
    }

    if (matchedPlace && matchedPlace.id !== activeCity.id) {
      setConnectionStatus(
        `Switched location to ${formatFullLocationLabel(matchedPlace)}`
      );
    }

    // Append user message immediately
    const userEntry: TranscriptEntry = {
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: cityToQuery.name
    };
    setTranscripts(prev => [...prev, userEntry]);
    setInputText('');
    setIsLoading(true);

    // 1. Off-thread Web Worker calculations (< 2ms) for near-instant telemetry feedback
    let immediateDirective = '';
    try {
      const workerAnalysis = await analyzeVoiceQueryOffThread({
        query: q,
        cityName: cityToQuery.name,
        aqi: cityAqi.aqi,
        language: currentLangObj.name
      });
      immediateDirective = workerAnalysis.immediateDirective;
      setConnectionStatus(workerAnalysis.immediateDirective);
    } catch {
      setConnectionStatus(`Preparing telemetry for ${cityToQuery.name}...`);
    }

    // 2. Prepare initial streaming assistant bubble in transcript
    const initialAssistantEntry: TranscriptEntry = {
      sender: 'assistant',
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: cityToQuery.name,
      aqi: cityAqi.aqi,
      language: currentLangObj.name,
      isStreaming: true,
      workerDirectives: immediateDirective || undefined
    };
    setTranscripts(prev => [...prev, initialAssistantEntry]);

    // 3. Connect to streaming response handler endpoint
    try {
      const response = await fetch('/api/voice/assistant/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: q,
          selectedCity: cityToQuery,
          targetLocation: `${cityToQuery.name}, ${cityToQuery.state ? cityToQuery.state + ', ' : ''}${cityToQuery.country}`,
          currentAqi: cityAqi.aqi,
          language: currentLangObj.name,
          languageCode: selectedVoiceLang
        })
      });

      if (!response.ok) {
        throw new Error(`Voice streaming error (${response.status})`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedReply += chunk;

        // Progressive real-time token rendering
        setTranscripts(prev => {
          if (prev.length === 0) return prev;
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          if (copy[lastIdx].sender === 'assistant') {
            copy[lastIdx] = {
              ...copy[lastIdx],
              text: accumulatedReply,
              isStreaming: true
            };
          }
          return copy;
        });
      }

      // Stream complete
      setTranscripts(prev => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (copy[lastIdx].sender === 'assistant') {
          copy[lastIdx] = {
            ...copy[lastIdx],
            text: accumulatedReply || `In ${cityToQuery.name}, air quality is ${cityAqi.category} with AQI ${cityAqi.aqi}.`,
            isStreaming: false
          };
        }
        return copy;
      });

      // Speak out accumulated answer in target language
      if (accumulatedReply.trim()) {
        speakText(accumulatedReply.trim(), selectedVoiceLang);
      }
    } catch (err: any) {
      console.warn('Voice streaming fallback notice:', err.message);
      const fallbackReply = `In ${cityToQuery.name} (${cityToQuery.country}), current air quality is ${cityAqi.category} with AQI ${cityAqi.aqi} and PM2.5 of ${cityToQuery.basePm25} µg/m³. ${
        cityAqi.aqi > 150
          ? 'N95 respirator masks are strongly advised for outdoor transit.'
          : 'Particulate concentrations are within tolerable safety thresholds.'
      }`;

      setTranscripts(prev => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (copy[lastIdx].sender === 'assistant') {
          copy[lastIdx] = {
            ...copy[lastIdx],
            text: fallbackReply,
            isStreaming: false
          };
        }
        return copy;
      });

      speakText(fallbackReply, selectedVoiceLang);
    } finally {
      setIsLoading(false);
      setConnectionStatus(`Voice Engine Ready (${currentLangObj.name})`);
    }
  };

  // Toggle microphone dictation (Speech-to-Text) with language awareness
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setConnectionStatus('Speech recognition unavailable in this browser. Type your command below.');
      return;
    }

    if (isListening) {
      clearMicTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    beginRecognitionSession();
  };

  // Switch active city from picker and auto-explain
  const handleSelectCity = (city: CityData) => {
    setActiveCity(city);
    setGuidedCountrySynced(city.country);
    setGuidedStateSynced(city.state);
    onSelectCity?.(city);
    setShowCityPicker(false);
    handleAskAssistant(`Change location to ${city.name}, ${city.state ? city.state + ', ' : ''}${city.country}`);
  };

  // Handle language switch inside modal
  const handleLanguageChange = (code: LanguageCode) => {
    setSelectedVoiceLang(code);
    setLanguage(code);
    const lang = LANGUAGES.find(l => l.code === code);
    setConnectionStatus(`Voice language set to ${lang?.name || code}`);
  };

  // Dynamic suggestions for currently active city
  const activeCityAqi = pm25ToAqi(activeCity.basePm25);
  const suggestions = [
    `Change location`,
    `How is the air quality in ${activeCity.name} right now?`,
    `What mask is needed for ${activeCity.name} (AQI ${activeCityAqi.aqi})?`,
    `Is it safe for morning exercise in ${activeCity.name}?`
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md font-sans animate-fade-in pb-[env(safe-area-inset-bottom)]">
      <div className="bg-[#14202e] border border-white/20 rounded-2xl sm:rounded-3xl w-full max-w-xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* TOP HEADER WITH STOP & EXIT CONTROLS */}
        <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shrink-0">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  AirCast Voice Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00b050] border border-emerald-400/40 text-[9px] font-mono font-bold">
                  All Languages
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#bbc7da] truncate max-w-[200px] sm:max-w-none">
                Interactive voice responses in 38 world languages
              </p>
            </div>
          </div>

          {/* Top Quick Actions: Stop & Exit */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isTalking && (
              <button
                onClick={handleStopSpeaking}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border border-amber-400/50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Stop Speaking"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">Stop</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isTalking) handleStopSpeaking();
                setIsMuted(!isMuted);
              }}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                isMuted
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* EXIT BUTTON */}
            <button
              onClick={handleExit}
              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold border border-red-500/50 flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-all"
              title="Exit Voice Assistant"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* VOICE LANGUAGE SELECTOR & LOCATION STRIP */}
        <div className="px-4 py-3 bg-black/45 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Active Location Hierarchy (unboxed clean typography) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">{activeCity.flag}</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {activeCity.country} · {activeCity.state} · {activeCity.name}
              </div>
              <div className="text-[11px] text-slate-300 font-mono tabular-nums">
                AQI {activeCityAqi.aqi} · <strong style={{ color: activeCityAqi.color }}>{activeCityAqi.category}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (guidedStep !== 'idle') {
                  cancelGuidedLocation(false);
                } else {
                  startGuidedLocationSelector('country');
                }
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                guidedStep !== 'idle'
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-white/10 hover:bg-white/20 text-emerald-300 border-white/15'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>{guidedStep !== 'idle' ? 'Voice Active' : 'Voice Location'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Browse
            </button>

            {/* Language Dropdown */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-white/15">
              <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={selectedVoiceLang}
                onChange={e => handleLanguageChange(e.target.value as LanguageCode)}
                aria-label="Select Voice Language"
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-[#14202e] text-white">
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* VOICE-GUIDED LOCATION SELECTOR PANEL */}
        {guidedStep !== 'idle' && (
          <div
            role="region"
            aria-label="Voice-Guided Location Selector"
            className="px-4 py-3 bg-[#0d1824] border-b border-white/15 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white">
                  Voice-Guided Location Selector
                </h4>
                <p className="text-[11px] text-slate-300 truncate" aria-live="polite">
                  {guidedHint || 'Say Country, State, or City'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {guidedStep !== 'country' && (
                  <button
                    type="button"
                    onClick={() =>
                      startGuidedLocationSelector(guidedStep === 'city' ? 'state' : 'country')
                    }
                    className="min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => cancelGuidedLocation(true)}
                  className="min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/10 hover:bg-white/20 text-slate-300 border border-white/15 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* 3-Step Interactive Stepper: 01. Country -> 02. State -> 03. City */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => startGuidedLocationSelector('country')}
                className={`p-2 rounded-lg text-left border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  guidedStep === 'country'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white'
                    : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-mono">01. Country</div>
                <div className="text-xs font-semibold truncate">{guidedCountry}</div>
              </button>

              <button
                type="button"
                onClick={() => startGuidedLocationSelector('state')}
                className={`p-2 rounded-lg text-left border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  guidedStep === 'state'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white'
                    : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-mono">02. State</div>
                <div className="text-xs font-semibold truncate">{guidedState}</div>
              </button>

              <button
                type="button"
                onClick={() => startGuidedLocationSelector('city')}
                className={`p-2 rounded-lg text-left border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  guidedStep === 'city'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white'
                    : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-mono">03. City</div>
                <div className="text-xs font-semibold truncate">{activeCity.name}</div>
              </button>
            </div>

            {/* Step-specific voice/tap options */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {guidedStep === 'country' &&
                availableCountries.slice(0, 12).map(country => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleGuidedLocationInput(country)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 transition-colors ${
                      country === guidedCountry
                        ? 'bg-emerald-600/30 border-emerald-400 text-white'
                        : 'bg-white/5 hover:bg-white/15 border-white/15 text-slate-200'
                    }`}
                  >
                    <span>{country}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}

              {guidedStep === 'state' &&
                availableStatesInCountry.slice(0, 14).map(stName => (
                  <button
                    key={stName}
                    type="button"
                    onClick={() => handleGuidedLocationInput(stName)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 transition-colors ${
                      stName === guidedState
                        ? 'bg-emerald-600/30 border-emerald-400 text-white'
                        : 'bg-white/5 hover:bg-white/15 border-white/15 text-slate-200'
                    }`}
                  >
                    <span>{stName}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}

              {guidedStep === 'city' &&
                availableCitiesInState.slice(0, 14).map(cityObj => (
                  <button
                    key={cityObj.id}
                    type="button"
                    onClick={() => handleGuidedLocationInput(cityObj.name)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      cityObj.id === activeCity.id
                        ? 'bg-emerald-600/30 border-emerald-400 text-white'
                        : 'bg-white/5 hover:bg-white/15 border-white/15 text-slate-200'
                    }`}
                  >
                    {cityObj.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* CITY SEARCH QUICK PICKER */}
        {showCityPicker && (
          <div className="p-3 bg-[#0d1824] border-b border-white/15 animate-fade-in space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any global city, Indian state, or district..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/10 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
              {filteredCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  className={`p-1.5 rounded-lg text-left text-xs border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    city.id === activeCity.id
                      ? 'bg-emerald-600/30 border-emerald-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  <span className="text-sm">{city.flag}</span>
                  <div className="truncate">
                    <div className="truncate font-semibold">{city.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{city.country}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VOICE VISUALIZER RADAR */}
        <div className="p-3 sm:p-4 bg-radial from-slate-900/90 to-transparent flex flex-col items-center justify-center border-b border-white/5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-2">
            <div
              className={`absolute inset-0 rounded-full transition-transform duration-300 ${
                isListening
                  ? 'bg-rose-500/25 scale-125 animate-ping opacity-45'
                  : isTalking
                  ? 'bg-[#00b050]/20 scale-125 animate-ping opacity-35'
                  : 'bg-[#00b050]/20 scale-100 opacity-10'
              }`}
            />
            <div
              className={`absolute inset-1.5 rounded-full border-2 transition-all duration-300 ${
                isListening
                  ? 'border-rose-500 scale-110 shadow-[0_0_20px_rgba(244,63,94,0.65)]'
                  : isTalking
                  ? 'border-[#00b050] scale-110 shadow-[0_0_20px_#00b050]'
                  : 'border-[#00b050] scale-100 opacity-40'
              }`}
            />

            <button
              onClick={toggleSpeechRecognition}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isListening
                  ? 'bg-rose-600 text-white voice-haptic-listening shadow-[0_0_22px_rgba(225,29,72,0.7)] ring-2 ring-rose-300/80'
                  : isTalking
                  ? 'bg-[#00b050] text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title={isListening ? 'Listening... Tap to Stop' : `Tap to Speak in ${currentLangObj.name}`}
              aria-pressed={isListening}
            >
              {isListening ? (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : isTalking ? (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
              ) : (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              )}
            </button>
          </div>

          {/* Sound bars animation */}
          <div className="flex items-center gap-1 h-5 mb-1.5">
            {[30, 60, 95, 45, 100, 70, 85, 40, 80, 50, 90, 35].map((height, i) => (
              <div
                key={i}
                className="w-1 bg-[#00b050] rounded-full transition-all duration-150"
                style={{
                  height: isTalking || isListening
                    ? `${Math.max(6, height * (0.35 + Math.random() * 0.65))}%`
                    : '4px',
                  opacity: isTalking || isListening ? 0.9 : 0.3
                }}
              />
            ))}
          </div>

          <div className="text-[11px] font-mono text-[#bbc7da] text-center flex items-center justify-center gap-2">
            {isTalking && <span className="w-2 h-2 rounded-full bg-[#00b050] animate-ping" />}
            <span>{isTalking ? `Speaking in ${currentLangObj.name}...` : isListening ? `Listening in ${currentLangObj.name}...` : connectionStatus}</span>
            {isTalking && (
              <button
                onClick={handleStopSpeaking}
                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer hover:bg-amber-500/30"
              >
                Stop Voice
              </button>
            )}
          </div>
        </div>

        {/* TRANSCRIPT CONVERSATION FEED */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3 min-h-[140px] max-h-52 bg-black/25">
          {transcripts.map((t, idx) => (
            <div
              key={idx}
              className={`flex flex-col text-xs leading-relaxed ${
                t.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-1">
                {t.sender === 'user' ? (
                  <span className="text-cyan-300 font-bold">You</span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AirCast AI ({t.language || currentLangObj.name})
                  </span>
                )}
                <span>·</span>
                <span>{t.time}</span>
              </div>
              <div
                className={`p-3 rounded-2xl max-w-[88%] text-xs ${
                  t.sender === 'user'
                    ? 'bg-[#1f6feb] text-white rounded-tr-none shadow-sm'
                    : 'bg-white/10 text-[#f0f4f8] rounded-tl-none border border-white/10 shadow-sm leading-relaxed'
                }`}
              >
                {t.sender === 'assistant' && t.workerDirectives && (
                  <div className="mb-1.5 pb-1 border-b border-white/10 flex items-center gap-1.5 text-[10px] text-amber-300 font-mono">
                    <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span>Worker Thread: {t.workerDirectives}</span>
                  </div>
                )}
                {t.text ? (
                  <span>
                    {t.text}
                    {t.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-400 animate-pulse align-middle" />}
                  </span>
                ) : t.isStreaming ? (
                  <span className="flex items-center gap-1 text-slate-400 italic">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Streaming voice synthesis tokens...
                  </span>
                ) : null}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse p-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Generating spoken response in {currentLangObj.name}...</span>
            </div>
          )}

          <div ref={transcriptsEndRef} />
        </div>

        {/* SUGGESTED QUESTIONS CHIPS */}
        <div className="p-2 sm:p-2.5 bg-black/35 border-t border-white/10">
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <MessageSquareQuote className="w-3 h-3 text-[#00b050]" />
            <span>Tap to Ask in {currentLangObj.name}:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {suggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAskAssistant(q)}
                disabled={isLoading}
                className="text-[10px] sm:text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#bbc7da] hover:text-white border border-white/10 transition-colors whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* INTERACTIVE INPUT BAR WITH STOP & EXIT OPTIONS */}
        <div className="p-3 sm:p-4 bg-black/55 border-t border-white/10">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAskAssistant(inputText);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  guidedStep === 'country'
                    ? 'Say or type a country (e.g. India, Japan, United States)...'
                    : guidedStep === 'state'
                    ? `Say or type a state in ${guidedCountry} (or say skip)...`
                    : guidedStep === 'city'
                    ? `Say or type a city in ${guidedState}...`
                    : `Ask in ${currentLangObj.name} or say "Change country to Japan"...`
                }
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isLoading}
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-white/10 border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00b050] transition-all"
              />
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all cursor-pointer ${
                  isListening ? 'text-rose-400 voice-haptic-listening' : 'text-slate-400 hover:text-white'
                }`}
                title={`Speak in ${currentLangObj.name}`}
                aria-pressed={isListening}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#00b050] hover:bg-[#009b46] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <span>{guidedStep !== 'idle' ? 'Select' : 'Ask'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Footer Bar with Stop & Exit Controls */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStopSpeaking}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Voice</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExit}
              className="px-4 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              <span>Exit Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
