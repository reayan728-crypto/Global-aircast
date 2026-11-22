import { CITIES, CityData } from '../data/cities';

const PLACE_ALIASES: Record<string, string> = {
  // Countries (English abbreviations, common names & localized names)
  usa: 'united states',
  us: 'united states',
  'u s': 'united states',
  'u s a': 'united states',
  america: 'united states',
  'united states of america': 'united states',
  'अमेरिका': 'united states',
  'संयुक्त राज्य अमेरिका': 'united states',
  'அமெரிக்கா': 'united states',
  'అమెరికా': 'united states',
  'ಅಮೆರಿಕ': 'united states',
  'അമേരിക്ക': 'united states',

  uk: 'united kingdom',
  'u k': 'united kingdom',
  britain: 'united kingdom',
  'great britain': 'united kingdom',
  england: 'united kingdom',
  'ब्रिटेन': 'united kingdom',
  'इंग्लैंड': 'united kingdom',
  'இங்கிலாந்து': 'united kingdom',
  'பிரிட்டன்': 'united kingdom',
  'యూకే': 'united kingdom',

  bharat: 'india',
  hindustan: 'india',
  'भारत': 'india',
  'इंडिया': 'india',
  'இந்தியா': 'india',
  'பாரதம்': 'india',
  'ఇండియా': 'india',
  'భారతదేశం': 'india',
  'ಭಾರತ': 'india',
  'ಇಂಡಿಯಾ': 'india',
  'ഇന്ത്യ': 'india',
  'ഭാരതം': 'india',

  uae: 'united arab emirates',
  'u a e': 'united arab emirates',
  emirates: 'united arab emirates',
  dubai: 'united arab emirates',
  'दुबई': 'dubai',
  'துபாய்': 'dubai',

  korea: 'south korea',
  'दक्षिण कोरिया': 'south korea',
  'தென் கொரியா': 'south korea',

  saudi: 'saudi arabia',
  'सऊदी अरब': 'saudi arabia',
  'சவுதி அரேபியா': 'saudi arabia',

  rsa: 'south africa',
  'दक्षिण अफ्रीका': 'south africa',
  'தென் ஆப்பிரிக்கா': 'south africa',

  'जापान': 'japan',
  'ஜப்பான்': 'japan',
  'జపాన్': 'japan',
  'ಜಪಾನ್': 'japan',
  'ജപ്പാൻ': 'japan',

  'सिंगापुर': 'singapore',
  'சிங்கப்பூர்': 'singapore',
  'సింగపూర్': 'singapore',
  'ಸಿಂಗಾಪುರ': 'singapore',
  'സിംഗപ്പൂർ': 'singapore',

  'चीन': 'china',
  'சீனா': 'china',
  'ऑस्ट्रेलिया': 'australia',
  'ஆஸ்திரேலியா': 'australia',
  'फ्रांस': 'france',
  'பிரான்ஸ்': 'france',
  'जर्मनी': 'germany',
  'ஜெர்மனி': 'germany',
  'कनाडा': 'canada',
  'கனடா': 'canada',
  'इटली': 'italy',
  'இத்தாலி': 'italy',
  'स्पेन': 'spain',
  'ஸ்பெயின்': 'spain',
  'थाईलैंड': 'thailand',
  'தாய்லாந்து': 'thailand',
  'इंडोनेशिया': 'indonesia',
  'இந்தோனேசியா': 'indonesia',
  'मेक्सिको': 'mexico',
  'மெக்சிகோ': 'mexico',
  'मिस्र': 'egypt',
  'எகிப்து': 'egypt',
  'केन्या': 'kenya',
  'கென்யா': 'kenya',
  'नाइजीरिया': 'nigeria',
  'நைஜீரியா': 'nigeria',
  'ब्राजील': 'brazil',
  'பிரேசில்': 'brazil',
  'अर्जेंटीना': 'argentina',
  'அர்ஜென்டினா': 'argentina',
  'चिली': 'chile',
  'சிலி': 'chile',

  // World cities localized
  'टोक्यो': 'tokyo',
  'டோக்கியோ': 'tokyo',
  'लंदन': 'london',
  'லண்டன்': 'london',
  'पेरिस': 'paris',
  'பாரிஸ்': 'paris',
  'न्यूयॉर्क': 'new york',
  'நியூயார்க்': 'new york',

  // Indian cities & districts aliases / older names / localized names
  'new delhi': 'delhi ncr',
  delhi: 'delhi ncr',
  'नई दिल्ली': 'delhi ncr',
  'दिल्ली': 'delhi ncr',
  'புது தில்லி': 'delhi ncr',
  'டெல்லி': 'delhi ncr',
  'தில்லி': 'delhi ncr',
  'ఢిల్లీ': 'delhi ncr',
  'ದೆಹಲಿ': 'delhi ncr',
  'ഡൽഹി': 'delhi ncr',

  bangalore: 'bengaluru hub',
  bengaluru: 'bengaluru hub',
  'बेंगलुरु': 'bengaluru hub',
  'बैंगलोर': 'bengaluru hub',
  'பெங்களூரு': 'bengaluru hub',
  'பெங்களூர்': 'bengaluru hub',
  'బెంగళూరు': 'bengaluru hub',
  'ಬೆಂಗಳೂರು': 'bengaluru hub',
  'ബെംഗളൂരു': 'bengaluru hub',

  bombay: 'mumbai coast',
  mumbai: 'mumbai coast',
  'मुंबई': 'mumbai coast',
  'மும்பை': 'mumbai coast',
  'ముంబై': 'mumbai coast',
  'ಮುಂಬೈ': 'mumbai coast',
  'മുംബൈ': 'mumbai coast',

  calcutta: 'kolkata delta',
  kolkata: 'kolkata delta',
  'कोलकाता': 'kolkata delta',
  'கொல்கத்தா': 'kolkata delta',
  'కోల్ కతా': 'kolkata delta',
  'ಕೋಲ್ಕತ್ತಾ': 'kolkata delta',
  'കൊൽക്കത്ത': 'kolkata delta',

  madras: 'chennai',
  'चेन्नई': 'chennai',
  'சென்னை': 'chennai',
  'చెన్నై': 'chennai',
  'ಚೆನ್ನೈ': 'chennai',
  'ചെന്നൈ': 'chennai',

  kovai: 'coimbatore',
  'कोयंबटूर': 'coimbatore',
  'கோயம்புத்தூர்': 'coimbatore',
  'கோவை': 'coimbatore',
  'కోయంబత్తూరు': 'coimbatore',
  'ಕೊಯಮತ್ತೂರು': 'coimbatore',
  'കോയമ്പത്തൂർ': 'coimbatore',

  'मदुरै': 'madurai',
  'மதுரை': 'madurai',
  'మదురై': 'madurai',
  'ಮಧುರೈ': 'madurai',
  'മധുര': 'madurai',

  trichy: 'tiruchirappalli',
  'திருச்சி': 'tiruchirappalli',
  'திருச்சிராப்பள்ளி': 'tiruchirappalli',
  'சேலம்': 'salem',
  'ஈரோடு': 'erode',
  'வேலூர்': 'vellore',
  'திருநெல்வேலி': 'tirunelveli',
  'தஞ்சாவூர்': 'thanjavur',

  trivandrum: 'thiruvananthapuram',
  'तिरुवनंतपुरम': 'thiruvananthapuram',
  'திருவனந்தபுரம்': 'thiruvananthapuram',
  'തിരുവനന്തപുരം': 'thiruvananthapuram',

  cochin: 'kochi',
  'कोच्चि': 'kochi',
  'கொச்சி': 'kochi',
  'കൊച്ചി': 'kochi',

  'हैदराबाद': 'hyderabad',
  'ஹைதராபாத்': 'hyderabad',
  'హైదరాబాద్': 'hyderabad',
  'ಹೈದರಾಬಾದ್': 'hyderabad',
  'ഹൈദരാബാദ്': 'hyderabad',

  'अहमदाबाद': 'ahmedabad',
  'அகமதாபாத்': 'ahmedabad',
  poona: 'pune',
  'पुणे': 'pune',
  'புனே': 'pune',
  'जयपुर': 'jaipur',
  'ஜெய்ப்பூர்': 'jaipur',
  'लखनऊ': 'lucknow',
  'லக்னோ': 'lucknow',

  benares: 'varanasi',
  banaras: 'varanasi',
  baroda: 'vadodara',
  mysore: 'mysuru',
  'मैसूर': 'mysuru',
  'ಮೈಸೂರು': 'mysuru',
  mangalore: 'mangaluru',
  gauhati: 'guwahati',
  calicut: 'kozhikode',
  cawnpore: 'kanpur',

  // Indian States & UTs aliases / abbreviations / localized names
  tn: 'tamil nadu',
  tamilnadu: 'tamil nadu',
  'तमिलनाडु': 'tamil nadu',
  'தமிழ்நாடு': 'tamil nadu',
  'தமிழ் நாடு': 'tamil nadu',
  'తమిళనాడు': 'tamil nadu',
  'ತಮಿಳುನಾಡು': 'tamil nadu',
  'തമിഴ്നാട്': 'tamil nadu',

  'कर्नाटक': 'karnataka',
  'கர்நாடகா': 'karnataka',
  'கர்நாடகம்': 'karnataka',
  'కర్ణాటక': 'karnataka',
  'ಕರ್ನಾಟಕ': 'karnataka',
  'കർണാടക': 'karnataka',

  'केरल': 'kerala',
  'கேரளா': 'kerala',
  'கேரளம்': 'kerala',
  'కేరళ': 'kerala',
  'ಕೇರಳ': 'kerala',
  'കേരളം': 'kerala',

  ap: 'andhra pradesh',
  andhra: 'andhra pradesh',
  'आंध्र प्रदेश': 'andhra pradesh',
  'ஆந்திரப் பிரதேசம்': 'andhra pradesh',
  'ஆந்திரா': 'andhra pradesh',
  'ఆంధ్రప్రదేశ్': 'andhra pradesh',
  'ఆంధ్ర ప్రదేశ్': 'andhra pradesh',
  'ಆಂಧ್ರಪ್ರದೇಶ': 'andhra pradesh',
  'ആന്ധ്രാപ്രദേശ്': 'andhra pradesh',

  telengana: 'telangana',
  'तेलंगाना': 'telangana',
  'தெலுங்கானா': 'telangana',
  'தெலங்கானா': 'telangana',
  'తెలంగాణ': 'telangana',
  'ತೆಲಂಗಾಣ': 'telangana',
  'തെലങ്കാന': 'telangana',

  mh: 'maharashtra',
  'महाराष्ट्र': 'maharashtra',
  'மகாராஷ்டிரா': 'maharashtra',
  'మహారాష్ట్ర': 'maharashtra',

  up: 'uttar pradesh',
  'उत्तर प्रदेश': 'uttar pradesh',
  'உத்தரப் பிரதேசம்': 'uttar pradesh',
  'ఉత్తర ప్రదేశ్': 'uttar pradesh',

  mp: 'madhya pradesh',
  'मध्य प्रदेश': 'madhya pradesh',
  'மத்தியப் பிரதேசம்': 'madhya pradesh',

  wb: 'west bengal',
  bengal: 'west bengal',
  'पश्चिम बंगाल': 'west bengal',
  'மேற்கு வங்காளம்': 'west bengal',
  'மேற்கு வங்கம்': 'west bengal',

  hp: 'himachal pradesh',
  'हिमाचल प्रदेश': 'himachal pradesh',
  'राजस्थान': 'rajasthan',
  'ராஜஸ்தான்': 'rajasthan',
  'गुजरात': 'gujarat',
  'குஜராத்': 'gujarat',
  'पंजाब': 'punjab',
  'பஞ்சாப்': 'punjab',
  'हरियाणा': 'haryana',
  'ஹரியானா': 'haryana',
  'गोवा': 'goa',
  'கோவா': 'goa',
  'बिहार': 'bihar',
  'பீகார்': 'bihar',
  orissa: 'odisha',
  'ओडिशा': 'odisha',
  'ஒடிசா': 'odisha',
  uttaranchal: 'uttarakhand',
  'उत्तराखंड': 'uttarakhand',
  'झारखंड': 'jharkhand',
  'ஜார்க்கண்ட்': 'jharkhand',
  'छत्तीसगढ़': 'chhattisgarh',
  'சத்தீஸ்கர்': 'chhattisgarh',
  'असम': 'assam',
  'அசாம்': 'assam',
  'लद्दाख': 'ladakh',
  'चंडीगढ़': 'chandigarh',
  'சண்டிகர்': 'chandigarh',

  pondicherry: 'puducherry',
  'पुडुचेरी': 'puducherry',
  'புதுச்சேரி': 'puducherry',

  jk: 'jammu and kashmir',
  'j and k': 'jammu and kashmir',
  'j&k': 'jammu and kashmir',
  kashmir: 'jammu and kashmir',
  jammu: 'jammu and kashmir',
  'जम्मू कश्मीर': 'jammu and kashmir',
  andaman: 'andaman and nicobar islands',
  nicobar: 'andaman and nicobar islands',
  daman: 'dadra and nagar haveli and daman and diu',
  diu: 'dadra and nagar haveli and daman and diu',
  dadra: 'dadra and nagar haveli and daman and diu'
};

const STOP_WORDS_RE =
  /\b(?:the|a|an|city|cities|state|states|country|countries|district|districts|place|places|location|region|province|hub|station|area|zone|please|kindly|now|today|tonight|tomorrow|currently|right|air|quality|aqi|pm25|pm2|weather|forecast|pollution|check|show|open|tell|explain|describe|simple|terms|me|my|our|your|us|this|that|about|in|for|of|at|to|from|into|as|by|with|on|or|and|is|are|was|were|be|will|would|could|should|can|do|does|did|have|has|need|want|like|wear|mask|n95|safe|outside|outdoor|indoors|exercise|walk|run|morning|evening|best|worst|hour|time|good|bad|change|changed|set|switch|switched|select|selected|choose|pick|move|moved|update|turn|make|go|visit|navigate|find)\b/gi;

const INDIC_FILLERS_RE =
  /(?:बदलो|बदलें|बदल|करो|करें|दिखाओ|दिखाएं|बताओ|बताएं|चुनो|चुनें|खोलो|खोलें|शहर|राज्य|प्रदेश|देश|जिला|स्थान|वायु|गुणवत्ता|हवा|कैसी|है|में|से|को|का|की|के|மாற்று|மாற்றுங்கள்|காட்டு|சொல்|திற|தேர்ந்தெடு|நகரம்|மாநிலம்|மாவட்டம்|நாடு|காற்று|தரம்|எப்படி|உள்ளது|இல்|க்கு|இருந்து|మార్చు|మార్చండి|చూపించు|చెప్పు|నగరం|రాష్ట్రం|దేశం|జిల్లా|గాలి|నాణ్యత|బదలాయించు|ಬದಲಿಸಿ|ತೋರಿಸು|ಹೇಳು|ನಗರ|ರಾಜ್ಯ|ದೇಶ|ಜಿಲ್ಲೆ|ಗಾಳಿ|ಗುಣಮಟ್ಟ|മാറ്റുക|കാണിക്കുക|പറയൂ|നഗരം|സംസ്ഥാനം|രാജ്യം|ജില്ല|വായു|ഗുണനിലവാരം)/g;

function stripAccents(str: string): string {
  // Keep Indic scripts intact (NFC preserves combined vowel signs) while stripping Latin diacritics
  return str
    .replace(/[\u00C0-\u024F]/g, ch => ch.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function extractTargetSegment(raw: string): string {
  // Handle "change country from India to Japan" -> "Japan"
  const fromTo = raw.match(/\bfrom\s+.+?\s+to\s+(.+)$/i);
  if (fromTo && fromTo[1]) return fromTo[1];
  const arrow = raw.match(/(?:->|=>)\s*(.+)$/);
  if (arrow && arrow[1]) return arrow[1];
  return raw;
}

function normalize(input: string): string {
  return stripAccents(extractTargetSegment(input))
    .toLowerCase()
    .replace(/['’.,!?/\\()\-_:;]+/g, ' ')
    .replace(STOP_WORDS_RE, ' ')
    .replace(INDIC_FILLERS_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveAlias(cleaned: string): string {
  if (!cleaned) return '';
  if (PLACE_ALIASES[cleaned]) return PLACE_ALIASES[cleaned];
  return cleaned;
}

const CITY_NAME_MAP = new Map<string, CityData>();
const DISTRICT_MAP = new Map<string, CityData>();
const STATE_MAP = new Map<string, CityData>();
const COUNTRY_MAP = new Map<string, CityData>();

for (const c of CITIES) {
  const nName = stripAccents(c.name).toLowerCase();
  const nId = stripAccents(c.id).toLowerCase();
  if (!CITY_NAME_MAP.has(nName)) CITY_NAME_MAP.set(nName, c);
  if (!CITY_NAME_MAP.has(nId)) CITY_NAME_MAP.set(nId, c);
  if (c.district) {
    const nDist = stripAccents(c.district).toLowerCase();
    if (!DISTRICT_MAP.has(nDist)) DISTRICT_MAP.set(nDist, c);
  }
  const nState = stripAccents(c.state).toLowerCase();
  if (!STATE_MAP.has(nState)) STATE_MAP.set(nState, c);
  const nCountry = stripAccents(c.country).toLowerCase();
  if (!COUNTRY_MAP.has(nCountry)) COUNTRY_MAP.set(nCountry, c);
}

interface TieredTerm {
  term: string;
  tier: 1 | 2 | 3; // 1 = city/district/city-alias, 2 = state, 3 = country
  city: CityData;
}

const TIERED_TERMS: TieredTerm[] = (() => {
  const list: TieredTerm[] = [];
  for (const c of CITIES) {
    list.push({ term: stripAccents(c.name).toLowerCase(), tier: 1, city: c });
    if (c.district) {
      list.push({ term: stripAccents(c.district).toLowerCase(), tier: 1, city: c });
    }
    list.push({ term: stripAccents(c.state).toLowerCase(), tier: 2, city: c });
    list.push({ term: stripAccents(c.country).toLowerCase(), tier: 3, city: c });
  }
  for (const [alias, target] of Object.entries(PLACE_ALIASES)) {
    const tNorm = stripAccents(target).toLowerCase();
    const cityMatch =
      CITY_NAME_MAP.get(tNorm) || DISTRICT_MAP.get(tNorm);
    if (cityMatch) {
      list.push({ term: stripAccents(alias).toLowerCase(), tier: 1, city: cityMatch });
      continue;
    }
    const stateMatch = STATE_MAP.get(tNorm);
    if (stateMatch) {
      list.push({ term: stripAccents(alias).toLowerCase(), tier: 2, city: stateMatch });
      continue;
    }
    const countryMatch = COUNTRY_MAP.get(tNorm);
    if (countryMatch) {
      list.push({ term: stripAccents(alias).toLowerCase(), tier: 3, city: countryMatch });
    }
  }
  // Tier 1 first, then Tier 2, then Tier 3; longest term first within each tier
  list.sort((a, b) => a.tier - b.tier || b.term.length - a.term.length);
  return list;
})();

/**
 * Matches any spoken or typed city, district, state/UT, or country across all CITIES.
 */
export function findBestCityMatch(rawQuery: string): CityData | null {
  if (!rawQuery || !rawQuery.trim()) return null;

  const basicRaw = stripAccents(extractTargetSegment(rawQuery))
    .toLowerCase()
    .replace(/['’.,!?/\\()\-_:;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleaned = normalize(rawQuery);
  const candidates = Array.from(
    new Set(
      [
        resolveAlias(cleaned),
        cleaned,
        resolveAlias(basicRaw),
        basicRaw
      ].filter(Boolean)
    )
  );

  // 1-4. Exact match hierarchy (city/id -> district -> state -> country)
  for (const q of candidates) {
    const exactCity = CITY_NAME_MAP.get(q);
    if (exactCity) return exactCity;

    const exactDistrict = DISTRICT_MAP.get(q);
    if (exactDistrict) return exactDistrict;

    const exactState = STATE_MAP.get(q);
    if (exactState) return exactState;

    const exactCountry = COUNTRY_MAP.get(q);
    if (exactCountry) return exactCountry;
  }

  // 5. Partial / startsWith / contains match (require >= 4 chars on cleaned query to avoid false positives like "can"/"go"/"man")
  for (const q of [resolveAlias(cleaned), cleaned].filter(Boolean)) {
    if (q.length < 4) continue;

    const startsCity = CITIES.find(
      c =>
        stripAccents(c.name).toLowerCase().startsWith(q) ||
        (c.district && stripAccents(c.district).toLowerCase().startsWith(q))
    );
    if (startsCity) return startsCity;

    const startsState = CITIES.find(c =>
      stripAccents(c.state).toLowerCase().startsWith(q)
    );
    if (startsState) return startsState;

    const startsCountry = CITIES.find(c =>
      stripAccents(c.country).toLowerCase().startsWith(q)
    );
    if (startsCountry) return startsCountry;

    const containsCityOrDistrict = CITIES.find(
      c =>
        stripAccents(c.name).toLowerCase().includes(q) ||
        (c.district && stripAccents(c.district).toLowerCase().includes(q))
    );
    if (containsCityOrDistrict) return containsCityOrDistrict;

    const containsStateOrCountry = CITIES.find(
      c =>
        stripAccents(c.state).toLowerCase().includes(q) ||
        stripAccents(c.country).toLowerCase().includes(q) ||
        stripAccents(c.stationName).toLowerCase().includes(q)
    );
    if (containsStateOrCountry) return containsStateOrCountry;
  }

  // 6. Tiered sub-phrase lookup in full cleaned & basic strings:
  //    Tier 1 (city/district) beats Tier 2 (state) beats Tier 3 (country), so
  //    "Chennai, Tamil Nadu" picks Chennai, while "Tamil Nadu" picks Tamil Nadu,
  //    and "United States" / "Japan" picks United States / Japan.
  const searchBuffers = [` ${cleaned} `, ` ${basicRaw} `].filter(s => s.trim().length > 0);
  for (const buf of searchBuffers) {
    for (const entry of TIERED_TERMS) {
      if (entry.term.length < 3) continue;
      // Avoid accidental 2-3 char English ambiguity like "us" inside general phrases unless matched strictly in steps 1-4
      if (entry.term === 'us' || entry.term === 'uk' || entry.term === 'tn' || entry.term === 'ap' || entry.term === 'up' || entry.term === 'mp' || entry.term === 'mh' || entry.term === 'wb' || entry.term === 'hp' || entry.term === 'jk') {
        continue;
      }
      if (buf.includes(` ${entry.term} `)) {
        return entry.city;
      }
    }
  }

  return null;
}
