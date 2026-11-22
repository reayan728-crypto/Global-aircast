/* AirCast Bundle: 1) accessibility 2) communication 3) animations 4) voice assistant. Load once; order matters. */
/*!
 * AirCast Accessibility Module
 * Vanilla JS, no dependencies. Works with any framework (React, etc.).
 *
 * WHAT IT ADDS
 *  - Accessibility button + panel (deaf/HoH mode, voice navigation, high contrast,
 *    large text, reduce motion, sign-language panel)
 *  - Voice navigation (Web Speech API) and read-aloud (speech synthesis)
 *  - Visual alerts, captions and vibration for deaf / hard-of-hearing users
 *  - Sign-language clip panel (plays REAL pre-recorded clips you supply; never fakes signing)
 *  - Skip link, ARIA live regions, visible focus
 *
 * HOW TO CONNECT TO YOUR APP (3 calls)
 *  1) AirCastA11y.configure({ signClips: {...}, getSummary: () => '...' , getLang: () => 'hi' });
 *  2) AirCastA11y.setAqi(aqiNumber, 'Coimbatore')   // call whenever AQI changes
 *  3) AirCastA11y.announce('Severe smoke expected 22:00', 'severe')  // optional alerts
 *
 * Optional: add data-a11y-summary="..." attributes (or text) on key cards so
 * "read air quality" can read them.
 */
(function () {
  'use strict';
  if (window.AirCastA11y) return;

  /* ---------------------------- configuration ---------------------------- */
  var CONFIG = {
    // Put URLs of real sign-language video clips here (mp4/webm). Leave '' if none yet.
    signClips: {
      good: '', satisfactory: '', moderate: '', poor: '',
      veryPoor: '', severe: '', emergency: ''
    },
    // One short LOCAL clip per word, e.g. { air: 'signs/air.mp4', home: 'signs/home.mp4' } (files inside your app).
    signWords: {},
    // Which words are signed for each situation (edit freely; words must match signWords keys).
    signSequences: {
      good: ['air', 'good'], satisfactory: ['air', 'okay'], moderate: ['air', 'bad', 'careful'],
      poor: ['air', 'bad', 'mask'], veryPoor: ['air', 'very-bad', 'home', 'mask'],
      severe: ['air', 'danger', 'home', 'doctor'], emergency: ['help', 'doctor', 'hospital']
    },
    getLang: null,       // () => 'en' | 'hi' | 'ta' ...  (falls back to <html lang> / localStorage 'lang')
    getSummary: null,    // () => string spoken for "read air quality"
    getForecast: null,   // () => string spoken for "forecast"
    getAdvice: null,     // () => string spoken for "health advice"
    onSelectPlace: null, // (query) => { found, summary, context } direct app hook for all cities/states/countries
    t: null,             // (key, lang) => string  (use your own translations if you have them)
    selectors: {         // optional CSS selectors; otherwise text matching is used
      page1: '', page2: '', simulator: '', planner: '',
      searchInput: '', searchButton: ''
    }
  };

  /* ------------------------------ strings -------------------------------- */
  var STR = {
    en: {
      title: 'Accessibility', deaf: 'Deaf / hard-of-hearing mode', voice: 'Voice navigation',
      contrast: 'High contrast', large: 'Large text', motion: 'Reduce motion',
      sign: 'Sign language panel', readPage: 'Read this page', listening: 'Listening…',
      notSupported: 'Voice commands are not supported in this browser.', prototype: 'Prototype',
      noClip: 'No sign-language clip available yet. Showing text.', close: 'Close',
      play: 'Play', pause: 'Pause', speed: 'Speed', done: 'Done', opening: 'Opening',
      notFound: 'Sorry, I did not understand. Say help.',
      helpText: 'You can say: read air quality, forecast, health advice, page 1, page 2, simulator, planner, change city to, stop.',
      alertTitle: 'Air quality alert', mic: 'Speak a command', skip: 'Skip to content',
      noSummary: 'Air quality summary is not connected yet.',
      testAlert: 'Test alert', testSign: 'Test sign panel'
    },
    hi: {
      title: 'सुगम्यता', deaf: 'बधिर / कम सुनने वालों के लिए मोड', voice: 'आवाज़ से नेविगेशन',
      contrast: 'उच्च कंट्रास्ट', large: 'बड़े अक्षर', motion: 'एनिमेशन कम करें',
      sign: 'सांकेतिक भाषा पैनल', readPage: 'यह पेज पढ़ें', listening: 'सुन रहा हूँ…',
      notSupported: 'इस ब्राउज़र में आवाज़ कमांड समर्थित नहीं हैं।', prototype: 'प्रोटोटाइप',
      noClip: 'अभी सांकेतिक भाषा क्लिप उपलब्ध नहीं है। टेक्स्ट दिखाया जा रहा है।', close: 'बंद करें',
      play: 'चलाएं', pause: 'रोकें', speed: 'गति', done: 'हो गया', opening: 'खोल रहा हूँ',
      notFound: 'क्षमा करें, समझ नहीं आया। मदद बोलें।',
      helpText: 'आप बोल सकते हैं: वायु गुणवत्ता पढ़ो, पूर्वानुमान, स्वास्थ्य सलाह, पेज 1, पेज 2, सिम्युलेटर, योजना, शहर बदलो, रुको।',
      alertTitle: 'वायु गुणवत्ता चेतावनी', mic: 'कमांड बोलें', skip: 'मुख्य सामग्री पर जाएं',
      noSummary: 'वायु गुणवत्ता सारांश अभी जुड़ा नहीं है।',
      testAlert: 'टेस्ट अलर्ट', testSign: 'सांकेतिक पैनल टेस्ट'
    },
    ta: {
      title: 'அணுகல்தன்மை', deaf: 'காது கேளாதோர் பயன்முறை', voice: 'குரல் வழிசெலுத்தல்',
      contrast: 'அதிக மாறுபாடு', large: 'பெரிய எழுத்து', motion: 'அசைவுகளை குறை',
      sign: 'சைகை மொழி பலகம்', readPage: 'இந்தப் பக்கத்தைப் படி', listening: 'கேட்கிறேன்…',
      notSupported: 'இந்த உலாவியில் குரல் கட்டளைகள் ஆதரிக்கப்படவில்லை.', prototype: 'முன்மாதிரி',
      noClip: 'சைகை மொழி வீடியோ இன்னும் இல்லை. உரை காட்டப்படுகிறது.', close: 'மூடு',
      play: 'இயக்கு', pause: 'நிறுத்து', speed: 'வேகம்', done: 'முடிந்தது', opening: 'திறக்கிறேன்',
      notFound: 'மன்னிக்கவும், புரியவில்லை. உதவி என்று சொல்லுங்கள்.',
      helpText: 'நீங்கள் சொல்லலாம்: காற்றின் தரத்தைப் படி, முன்னறிவிப்பு, சுகாதார ஆலோசனை, பக்கம் 1, பக்கம் 2, சிமுலேட்டர், திட்டம், நகரத்தை மாற்று, நிறுத்து.',
      alertTitle: 'காற்றுத் தர எச்சரிக்கை', mic: 'கட்டளையைச் சொல்லுங்கள்', skip: 'முக்கிய உள்ளடக்கத்திற்குச் செல்',
      noSummary: 'காற்றுத் தரச் சுருக்கம் இன்னும் இணைக்கப்படவில்லை.',
      testAlert: 'சோதனை எச்சரிக்கை', testSign: 'சைகை பலகை சோதனை'
    }
  };

  var LOCALES = {
    en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN',
    bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', ur: 'ur-IN', es: 'es-ES',
    fr: 'fr-FR', de: 'de-DE', ar: 'ar-SA', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
    pt: 'pt-BR', ru: 'ru-RU'
  };

  // Voice intents. Order matters (first match wins). Extend with more languages as needed.
  var INTENTS = [
    { id: 'stop', words: ['stop', 'quiet', 'cancel', 'रुको', 'बंद', 'நிறுத்து'] },
    { id: 'help', words: ['help', 'commands', 'मदद', 'உதவி'] },
    { id: 'page2', words: ['page 2', 'page two', 'second page', 'clinical', 'पेज 2', 'दूसरा पेज', 'பக்கம் 2'] },
    { id: 'page1', words: ['page 1', 'page one', 'first page', 'telemetry', 'home', 'पेज 1', 'पहला पेज', 'பக்கம் 1'] },
    { id: 'simulator', words: ['simulator', 'simulation', 'what if', 'सिम्युलेटर', 'சிமுலேட்டர்'] },
    { id: 'planner', words: ['planner', 'policy', 'action plan', 'योजना', 'திட்டம்'] },
    { id: 'forecast', words: ['forecast', 'tomorrow', 'next 24', 'safest hour', 'पूर्वानुमान', 'முன்னறிவிப்பு'] },
    { id: 'advice', words: ['advice', 'health', 'safe', 'mask', 'सलाह', 'स्वास्थ्य', 'ஆலோசனை'] },
    { id: 'read', words: ['read', 'air quality', 'aqi', 'current', 'वायु', 'पढ़', 'காற்று', 'படி'] }
  ];
  var CITY_RE = /(?:(?:change|set|switch|select|open|show|move|navigate|go|visit|pick|choose|check|update)\s+(?:the\s+)?(?:(?:city|state|country|district|place|location|region|station)\s+)?(?:to|into|of|as|for)?\s*|(?:city|state|country|district|location|शहर बदलो|शहर|राज्य बदलो|राज्य|देश बदलो|देश|நகரம்|மாநிலம்|நாடு|నగరం|రాష్ట్రం|దేశం|ನಗರ|ರಾಜ್ಯ|ದೇಶ|നഗരം|സംസ്ഥാനം|രാജ്യം)\s+)(.+)/i;

  /* -------------------------------- state -------------------------------- */
  var KEY = 'aircast_a11y_v1';
  var state = load() || {
    deaf: false, voice: false, contrast: false, large: false, motion: false, sign: false, rate: 1
  };
  var els = {};
  var recognition = null, listening = false;
  var lastLevel = null, lastAqi = null, lastPlace = '';
  var signSpeeds = [0.5, 1, 1.5], signSpeedIdx = 1;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function langCode() {
    var l = '';
    try { l = (CONFIG.getLang && CONFIG.getLang()) || localStorage.getItem('lang') || ''; } catch (e) { /* ignore */ }
    l = l || document.documentElement.lang || 'en';
    return String(l).toLowerCase().split(/[-_]/)[0];
  }
  function locale() { return LOCALES[langCode()] || 'en-IN'; }
  function t(key) {
    var l = langCode();
    if (CONFIG.t) { var v = CONFIG.t(key, l); if (v) return v; }
    return (STR[l] && STR[l][key]) || STR.en[key] || key;
  }

  /* ------------------------------- styles -------------------------------- */
  function injectStyles() {
    var css = [
      ':focus-visible{outline:3px solid #f59e0b!important;outline-offset:2px!important}',
      'html.a11y-large body{zoom:1.2}',
      'html.a11y-rm *,html.a11y-rm *::before,html.a11y-rm *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}',
      'html.a11y-hc body,html.a11y-hc body *:not(img):not(video):not(canvas):not(svg):not(path){background-color:#000!important;color:#fff!important;border-color:#fff!important;text-shadow:none!important}',
      'html.a11y-hc a,html.a11y-hc button{text-decoration:underline!important}',
      '.a11y-skip{position:fixed;left:8px;top:-60px;z-index:100000;background:#111;color:#fff;padding:10px 14px;border-radius:8px;font:600 14px system-ui,sans-serif}',
      '.a11y-skip:focus{top:8px}',
      '.a11y-fab{position:fixed;right:12px;bottom:96px;z-index:99990;width:52px;height:52px;border-radius:26px;border:2px solid #fff;background:#0f172a;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
      '.a11y-mic{position:fixed;right:12px;bottom:156px;z-index:99990;width:52px;height:52px;border-radius:26px;border:2px solid #fff;background:#16a34a;color:#fff;font-size:22px;cursor:pointer;display:none;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
      '@keyframes a11yMicHaptic{0%,100%{transform:scale(1.05) translate3d(0,0,0)}25%{transform:scale(1.08) translate3d(-1.5px,0.5px,0)}50%{transform:scale(1.06) translate3d(1.5px,-0.5px,0)}75%{transform:scale(1.09) translate3d(-1px,-0.5px,0)}}',
      '.a11y-mic.on{display:block}.a11y-mic.live{background:#dc2626;animation:a11yMicHaptic 0.42s cubic-bezier(.36,.07,.19,.97) infinite}',
      '.a11y-panel{position:fixed;right:12px;bottom:156px;z-index:99995;width:min(320px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#fff;color:#0f172a;border:2px solid #0f172a;border-radius:16px;padding:14px;font:15px/1.4 system-ui,sans-serif;display:none;box-shadow:0 10px 30px rgba(0,0,0,.35)}',
      '.a11y-panel.open{display:block}',
      '.a11y-panel h2{margin:0 0 10px;font-size:18px}',
      '.a11y-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #e2e8f0}',
      '.a11y-sw{min-width:64px;min-height:44px;border-radius:22px;border:2px solid #0f172a;background:#e2e8f0;color:#0f172a;font-weight:700;cursor:pointer}',
      '.a11y-sw[aria-pressed=true]{background:#16a34a;color:#fff}',
      '.a11y-btn{min-height:44px;padding:8px 12px;border-radius:10px;border:2px solid #0f172a;background:#fff;color:#0f172a;font-weight:700;cursor:pointer}',
      '.a11y-caption{position:fixed;left:8px;right:8px;bottom:8px;z-index:99980;background:rgba(0,0,0,.88);color:#fff;border-radius:10px;padding:10px 14px;font:600 16px/1.4 system-ui,sans-serif;display:none}',
      '.a11y-banner{position:fixed;left:8px;right:8px;top:8px;z-index:99999;background:#b91c1c;color:#fff;border:3px solid #fff;border-radius:12px;padding:12px 14px;font:700 16px/1.4 system-ui,sans-serif;display:none}',
      '.a11y-sign{position:fixed;left:8px;bottom:96px;z-index:99985;width:230px;background:#0f172a;color:#fff;border:2px solid #fff;border-radius:14px;padding:8px;display:none;font:13px/1.35 system-ui,sans-serif}',
      '.a11y-sign video{width:100%;border-radius:8px;background:#000;display:none}',
      '.a11y-sign .tag{background:#f59e0b;color:#000;border-radius:6px;padding:1px 6px;font-weight:700;font-size:11px}',
      '.a11y-sign .bar{display:flex;gap:6px;margin-top:6px}',
      '.a11y-sign button{flex:1;min-height:40px;border-radius:8px;border:1px solid #fff;background:#1e293b;color:#fff;font-weight:700;cursor:pointer}',
      '.a11y-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
    ].join('\n');
    var s = document.createElement('style');
    s.id = 'a11y-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ------------------------------ UI building ---------------------------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build() {
    var main = document.querySelector('main,[role=main]') || document.getElementById('root') || document.body;
    if (!main.id) main.id = 'a11y-main';
    els.skip = el('a', 'a11y-skip', t('skip'));
    els.skip.href = '#' + main.id;
    document.body.insertBefore(els.skip, document.body.firstChild);

    els.polite = el('div', 'a11y-sr'); els.polite.setAttribute('aria-live', 'polite'); els.polite.setAttribute('role', 'status');
    els.assertive = el('div', 'a11y-sr'); els.assertive.setAttribute('aria-live', 'assertive'); els.assertive.setAttribute('role', 'alert');
    document.body.appendChild(els.polite); document.body.appendChild(els.assertive);

    els.banner = el('div', 'a11y-banner'); els.banner.setAttribute('role', 'alert');
    els.caption = el('div', 'a11y-caption'); els.caption.setAttribute('aria-hidden', 'true');
    document.body.appendChild(els.banner); document.body.appendChild(els.caption);

    els.fab = el('button', 'a11y-fab', '♿');
    els.fab.setAttribute('aria-haspopup', 'dialog');
    els.fab.addEventListener('click', function () { togglePanel(); });
    els.mic = el('button', 'a11y-mic', '🎤');
    els.mic.addEventListener('click', function () { toggleListening(); });
    document.body.appendChild(els.fab); document.body.appendChild(els.mic);

    els.panel = el('div', 'a11y-panel');
    els.panel.setAttribute('role', 'dialog');
    document.body.appendChild(els.panel);

    buildSign();
    renderPanel();
  }

  var TOGGLES = ['deaf', 'voice', 'contrast', 'large', 'motion', 'sign'];

  function renderPanel() {
    els.fab.setAttribute('aria-label', t('title'));
    els.mic.setAttribute('aria-label', t('mic'));
    els.panel.setAttribute('aria-label', t('title'));
    els.skip.textContent = t('skip');
    els.panel.innerHTML = '';
    els.panel.appendChild(el('h2', null, t('title')));
    TOGGLES.forEach(function (k) {
      var row = el('div', 'a11y-row');
      row.appendChild(el('span', null, t(k)));
      var b = el('button', 'a11y-sw', state[k] ? 'ON' : 'OFF');
      b.setAttribute('aria-pressed', state[k] ? 'true' : 'false');
      b.setAttribute('aria-label', t(k));
      b.addEventListener('click', function () { setOption(k, !state[k]); });
      row.appendChild(b);
      els.panel.appendChild(row);
    });
    var r = el('div', 'a11y-row');
    var rb = el('button', 'a11y-btn', '🔊 ' + t('readPage'));
    rb.addEventListener('click', function () { readPage(); });
    var hb = el('button', 'a11y-btn', '?');
    hb.setAttribute('aria-label', 'help');
    hb.addEventListener('click', function () { speak(t('helpText')); });
    r.appendChild(rb); r.appendChild(hb);
    els.panel.appendChild(r);
    var c = el('div', 'a11y-row');
    var cb = el('button', 'a11y-btn', t('close'));
    cb.addEventListener('click', function () { togglePanel(false); });
    c.appendChild(cb);
    els.panel.appendChild(c);
    if (els.signTag) els.signTag.textContent = t('prototype');
  }

  function togglePanel(force) {
    var open = typeof force === 'boolean' ? force : !els.panel.classList.contains('open');
    els.panel.classList.toggle('open', open);
    els.fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var f = els.panel.querySelector('button'); if (f) f.focus(); }
  }

  /* ------------------------------ options -------------------------------- */
  function applyOptions() {
    var h = document.documentElement.classList;
    h.toggle('a11y-hc', !!state.contrast);
    h.toggle('a11y-large', !!state.large);
    h.toggle('a11y-rm', !!state.motion);
    els.mic.classList.toggle('on', !!state.voice);
    els.sign.style.display = state.sign ? 'block' : 'none';
    if (state.sign) showSign(lastLevel, lastAqi != null ? statusText() : '');
    if (!state.deaf) { els.banner.style.display = 'none'; }
  }

  function setOption(k, v) {
    state[k] = v; save(); applyOptions(); renderPanel();
    if (k !== 'sign') notify(t(k) + ': ' + (v ? 'ON' : 'OFF'));
    if (k === 'voice' && !v && listening) stopListening();
    if (k === 'voice' && v && !(window.SpeechRecognition || window.webkitSpeechRecognition)) notify(t('notSupported'));
  }

  /* ------------------------------ speaking ------------------------------- */
  function speak(text) {
    if (!text) return;
    showCaption(text);
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = locale(); u.rate = state.rate || 1;
      u.onend = function () { hideCaptionSoon(); };
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  function stopSpeak() {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    hideCaptionSoon();
  }

  var capTimer = null;
  function showCaption(text) {
    els.caption.textContent = text;
    els.caption.style.display = 'block';
    clearTimeout(capTimer);
    capTimer = setTimeout(hideCaptionSoon, Math.min(15000, 3000 + text.length * 60));
  }
  function hideCaptionSoon() { clearTimeout(capTimer); capTimer = setTimeout(function () { els.caption.style.display = 'none'; }, 1500); }

  function notify(text) { els.polite.textContent = ''; setTimeout(function () { els.polite.textContent = text; }, 30); showCaption(text); }

  /* -------------------------------- alerts ------------------------------- */
  function announce(text, severity) {
    if (!text) return;
    var sev = severity === 'severe' || severity === 'emergency';
    var live = sev ? els.assertive : els.polite;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 30);
    if (state.deaf || sev) {
      els.banner.textContent = '⚠ ' + t('alertTitle') + ': ' + text;
      els.banner.style.display = 'block';
      clearTimeout(announce._t);
      announce._t = setTimeout(function () { els.banner.style.display = 'none'; }, sev ? 20000 : 8000);
    }
    if (state.deaf && navigator.vibrate) { try { navigator.vibrate(sev ? [300, 120, 300, 120, 600] : [150]); } catch (e) { /* ignore */ } }
    if (state.voice || sev) speak(text); else showCaption(text);
    if (state.sign) showSign(sev ? 'emergency' : lastLevel, text);
  }

  function levelFromAqi(a) {
    if (a <= 50) return 'good';
    if (a <= 100) return 'satisfactory';
    if (a <= 200) return 'moderate';
    if (a <= 300) return 'poor';
    if (a <= 400) return 'veryPoor';
    return 'severe';
  }
  var LEVEL_EN = {
    good: 'Good', satisfactory: 'Satisfactory', moderate: 'Moderate',
    poor: 'Poor', veryPoor: 'Very poor', severe: 'Severe'
  };
  var RANK = { good: 0, satisfactory: 1, moderate: 2, poor: 3, veryPoor: 4, severe: 5 };

  function statusText() { return (lastPlace ? lastPlace + ': ' : '') + 'AQI ' + lastAqi + ' - ' + LEVEL_EN[lastLevel]; }

  function setAqi(aqi, place, opts) {
    if (typeof aqi !== 'number' || isNaN(aqi)) return;
    var silent = !!(opts && opts.silent);
    var level = levelFromAqi(aqi);
    var hadPrev = lastLevel !== null;
    var placeChanged = !!(place && lastPlace && place !== lastPlace);
    var changed = level !== lastLevel;
    var isHigh = RANK[level] >= 4;
    var rose = hadPrev && RANK[level] > RANK[lastLevel] && isHigh;
    lastAqi = aqi;
    if (place) lastPlace = place;
    lastLevel = level;
    if ((changed || placeChanged) && state.sign) showSign(level, statusText());
    if (silent) return;
    if (rose || (placeChanged && isHigh)) {
      announce(statusText(), 'severe');
    } else if (hadPrev && (placeChanged || changed)) {
      // Speak aloud for Good, Satisfactory, Moderate, and Poor too — not only Very Poor/Severe
      var msg = '';
      try { msg = CONFIG.getSummary ? CONFIG.getSummary() : ''; } catch (e) { msg = ''; }
      speak(msg || statusText());
    }
  }

  /* --------------------------- sign-language panel ----------------------- */
  var clipAvailCache = {};
  function checkClipAvailable(url, cb) {
    if (!url) { cb(false); return; }
    if (Object.prototype.hasOwnProperty.call(clipAvailCache, url)) {
      cb(clipAvailCache[url]);
      return;
    }
    if (typeof fetch !== 'function') { cb(false); return; }
    fetch(url, { method: 'HEAD' })
      .then(function (res) {
        var ct = (res.headers && res.headers.get('content-type')) || '';
        var ok = !!(res.ok && (/^video\//i.test(ct) || /^application\/octet-stream/i.test(ct)));
        clipAvailCache[url] = ok;
        cb(ok);
      })
      .catch(function () {
        clipAvailCache[url] = false;
        cb(false);
      });
  }

  function safePlayVideo() {
    if (!els.video) return;
    var hasSrc = !!(els.video.getAttribute('src') || els.video.currentSrc);
    if (!hasSrc || els.video.style.display === 'none' || els.video.networkState === 3) {
      if (lastLevel) showSign(lastLevel, statusText());
      return;
    }
    try {
      var p = els.video.play();
      if (p && p.catch) p.catch(function () { /* ignore autoplay/source rejection */ });
    } catch (e) { /* ignore */ }
  }

  function buildSign() {
    els.sign = el('div', 'a11y-sign');
    els.sign.setAttribute('role', 'region');
    els.sign.setAttribute('aria-label', 'Sign language');
    var head = el('div'); head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px';
    head.appendChild(el('strong', null, '🤟 Sign'));
    els.signTag = el('span', 'tag', t('prototype'));
    head.appendChild(els.signTag);
    els.video = document.createElement('video');
    els.video.setAttribute('playsinline', ''); els.video.loop = false;
    els.video.style.display = 'none';
    els.signMsg = el('div'); els.signMsg.style.cssText = 'padding:6px 2px;min-height:40px';
    var bar = el('div', 'bar');
    var play = el('button', null, '▶/⏸'); play.setAttribute('aria-label', t('play') + ' / ' + t('pause'));
    play.addEventListener('click', function () {
      if (!els.video.getAttribute('src') || els.video.style.display === 'none') {
        if (lastLevel) showSign(lastLevel, statusText());
        return;
      }
      if (els.video.paused) safePlayVideo(); else els.video.pause();
    });
    var spd = el('button', null, '1x'); spd.setAttribute('aria-label', t('speed'));
    spd.addEventListener('click', function () {
      signSpeedIdx = (signSpeedIdx + 1) % signSpeeds.length;
      els.video.playbackRate = signSpeeds[signSpeedIdx];
      spd.textContent = signSpeeds[signSpeedIdx] + 'x';
    });
    var cls = el('button', null, '✕'); cls.setAttribute('aria-label', t('close'));
    cls.addEventListener('click', function () { setOption('sign', false); });
    bar.appendChild(play); bar.appendChild(spd); bar.appendChild(cls);
    els.chips = el('div'); els.chips.style.cssText = 'margin-top:6px';
    els.sign.appendChild(head); els.sign.appendChild(els.video); els.sign.appendChild(els.chips); els.sign.appendChild(els.signMsg); els.sign.appendChild(bar);
    document.body.appendChild(els.sign);
  }

  var seqId = 0;
  function showSign(levelKey, caption) {
    if (!els.sign) return;
    seqId++;
    var id = seqId;
    var url = levelKey && CONFIG.signClips[levelKey];
    var seq = levelKey && CONFIG.signSequences[levelKey];
    els.signMsg.textContent = caption || '';
    els.chips.innerHTML = '';
    els.video.onended = null; els.video.onerror = null;
    if (url) {
      checkClipAvailable(url, function (ok) {
        if (id !== seqId) return;
        if (!ok) {
          if (seq && seq.length) { playSequence(seq, caption, id); return; }
          els.video.pause(); els.video.removeAttribute('src'); els.video.style.display = 'none';
          els.signMsg.textContent = (caption ? caption + ' \u2014 ' : '') + t('noClip');
          return;
        }
        els.video.style.display = 'block';
        if (els.video.getAttribute('src') !== url) els.video.src = url;
        els.video.playbackRate = signSpeeds[signSpeedIdx];
        safePlayVideo();
      });
      return;
    }
    if (seq && seq.length) { playSequence(seq, caption, id); return; }
    els.video.pause(); els.video.removeAttribute('src'); els.video.style.display = 'none';
    els.signMsg.textContent = (caption ? caption + ' \u2014 ' : '') + t('noClip');
  }

  // Plays one short local clip per word (CONFIG.signWords) in order, highlighting the current word.
  // Words without a clip still appear as highlighted text pills, so the panel is useful before clips exist.
  function playSequence(seq, caption, id) {
    var chips = seq.map(function (w) {
      var c = el('span', null, w.replace(/-/g, ' '));
      c.style.cssText = 'display:inline-block;margin:2px;padding:4px 8px;border-radius:999px;border:1px solid #fff;font-weight:700;text-transform:uppercase;font-size:12px';
      els.chips.appendChild(c); return c;
    });
    var any = seq.some(function (w) { return CONFIG.signWords[w]; });
    if (!any) {
      els.video.pause(); els.video.removeAttribute('src'); els.video.style.display = 'none';
      els.signMsg.textContent = (caption ? caption + ' \u2014 ' : '') + t('noClip');
      return;
    }
    var cur = -1;
    function next() {
      if (id !== seqId) return;
      cur++;
      chips.forEach(function (c, j) { var on = j === cur; c.style.background = on ? '#f59e0b' : 'transparent'; c.style.color = on ? '#000' : '#fff'; });
      if (cur >= seq.length) return;
      var u = CONFIG.signWords[seq[cur]];
      if (!u) { setTimeout(next, 1100); return; }
      checkClipAvailable(u, function (ok) {
        if (id !== seqId) return;
        if (!ok) {
          els.video.pause();
          els.video.removeAttribute('src');
          els.video.style.display = 'none';
          setTimeout(next, 1100);
          return;
        }
        els.video.style.display = 'block';
        els.video.onended = next;
        els.video.onerror = function () {
          els.video.style.display = 'none';
          els.video.removeAttribute('src');
          setTimeout(next, 900);
        };
        els.video.src = u;
        els.video.playbackRate = signSpeeds[signSpeedIdx];
        safePlayVideo();
      });
    }
    next();
  }

  /* ----------------------------- reading text ---------------------------- */
  function summaryFromDom() {
    var nodes = document.querySelectorAll('[data-a11y-summary]');
    if (!nodes.length) return '';
    return Array.prototype.map.call(nodes, function (n) {
      return n.getAttribute('data-a11y-summary') || n.innerText;
    }).join('. ');
  }
  function getText(kind) {
    var fn = kind === 'forecast' ? CONFIG.getForecast : kind === 'advice' ? CONFIG.getAdvice : CONFIG.getSummary;
    var out = '';
    try { out = fn ? fn() : ''; } catch (e) { out = ''; }
    if (!out && kind === 'read' && lastAqi != null) out = statusText();
    if (!out) out = summaryFromDom();
    return out || t('noSummary');
  }
  function readPage() {
    var main = document.querySelector('main,[role=main]') || document.getElementById('root') || document.body;
    var txt = (main.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 1800);
    speak(txt || t('noSummary'));
  }

  /* --------------------------- voice navigation -------------------------- */
  function toggleListening() { if (listening) stopListening(); else startListening(); }

  function startListening() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { notify(t('notSupported')); return; }
    stopSpeak();
    try {
      recognition = new SR();
      recognition.lang = locale();
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = function () { listening = true; els.mic.classList.add('live'); notify(t('listening')); };
      recognition.onend = function () { listening = false; els.mic.classList.remove('live'); };
      recognition.onerror = function () { listening = false; els.mic.classList.remove('live'); };
      recognition.onresult = function (e) { handleCommand(e.results[0][0].transcript || ''); };
      recognition.start();
    } catch (e) { notify(t('notSupported')); }
  }
  function stopListening() { try { if (recognition) recognition.stop(); } catch (e) { /* ignore */ } listening = false; els.mic.classList.remove('live'); }

  function matchIntent(text) {
    var s = text.toLowerCase();
    for (var i = 0; i < INTENTS.length; i++) {
      for (var j = 0; j < INTENTS[i].words.length; j++) {
        if (s.indexOf(INTENTS[i].words[j].toLowerCase()) !== -1) return INTENTS[i].id;
      }
    }
    return null;
  }

  function clickByText(re) {
    var nodes = document.querySelectorAll('button,a,[role=button],[role=tab]');
    for (var i = 0; i < nodes.length; i++) {
      if (re.test((nodes[i].innerText || nodes[i].textContent || '').trim())) { nodes[i].click(); return true; }
    }
    return false;
  }
  function goTo(selKey, re) {
    var sel = CONFIG.selectors[selKey], target = null;
    if (sel) target = document.querySelector(sel);
    if (!target) {
      var hs = document.querySelectorAll('h1,h2,h3,h4,[aria-label]');
      for (var i = 0; i < hs.length; i++) {
        if (re.test(hs[i].innerText || hs[i].getAttribute('aria-label') || '')) { target = hs[i]; break; }
      }
    }
    if (!target) return false;
    target.scrollIntoView({ behavior: state.motion ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    return true;
  }
  function setCity(city) {
    var cleanPlace = String(city || '').replace(/[.,!?]+$/, '').trim();
    if (!cleanPlace) return false;
    if (typeof CONFIG.onSelectPlace === 'function') {
      var res = CONFIG.onSelectPlace(cleanPlace);
      if (res && res.found) return res;
    }
    var input = (CONFIG.selectors.searchInput && document.querySelector(CONFIG.selectors.searchInput)) ||
      document.querySelector('input[type=search]') ||
      Array.prototype.filter.call(document.querySelectorAll('input[type=text],input:not([type])'), function (i) { return /search|city|शहर|நகர/i.test(i.placeholder || ''); })[0];
    if (!input) return false;
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, cleanPlace);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function () {
      var btn = CONFIG.selectors.searchButton && document.querySelector(CONFIG.selectors.searchButton);
      if (btn) { btn.click(); return; }
      clickByText(/^(find|search|खोज|தேடு)/i);
    }, 60);
    return true;
  }

  function handleCommand(raw) {
    var text = (raw || '').trim();
    if (!text) { speak(t('notFound')); return; }
    var city = text.match(CITY_RE);
    if (city && city[1]) {
      var result = setCity(city[1]);
      if (result && typeof result === 'object' && result.summary) {
        speak(result.summary);
      } else if (result) {
        speak(t('opening') + ' ' + city[1]);
      } else {
        speak(t('notFound'));
      }
      return;
    }
    var id = matchIntent(text), ok = true;
    switch (id) {
      case 'stop': stopSpeak(); return;
      case 'help': speak(t('helpText')); return;
      case 'page1': ok = (CONFIG.selectors.page1 && clickSel(CONFIG.selectors.page1)) || clickByText(/P1|Page 1|Telemetry|पेज 1|பக்கம் 1/i); if (ok) speak(t('opening') + ' 1'); break;
      case 'page2': ok = (CONFIG.selectors.page2 && clickSel(CONFIG.selectors.page2)) || clickByText(/P2|Page 2|Clinical|पेज 2|பக்கம் 2/i); if (ok) speak(t('opening') + ' 2'); break;
      case 'simulator': ok = goTo('simulator', /simulator|what-?if|सिम्युलेटर|சிமுலேட்டர்/i); if (ok) speak(t('opening')); break;
      case 'planner': ok = goTo('planner', /planner|policy|योजना|திட்டம்/i); if (ok) speak(t('opening')); break;
      case 'forecast': speak(getText('forecast')); return;
      case 'advice': speak(getText('advice')); return;
      case 'read': speak(getText('read')); return;
      default: ok = false;
    }
    if (!ok) speak(t('notFound'));
  }
  function clickSel(sel) { var n = document.querySelector(sel); if (n) { n.click(); return true; } return false; }

  /* ------------------------------- bootstrap ----------------------------- */
  function init() {
    injectStyles();
    build();
    applyOptions();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') togglePanel(false);
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) { togglePanel(); }
      if (e.altKey && e.shiftKey && (e.key === 'M' || e.key === 'm') && state.voice) { toggleListening(); }
    });
    // re-render labels when the app changes <html lang>
    new MutationObserver(function () { renderPanel(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  window.AirCastA11y = {
    configure: function (opts) {
      opts = opts || {};
      Object.keys(opts).forEach(function (k) {
        if (k === 'signClips' || k === 'selectors' || k === 'signWords' || k === 'signSequences') {
          Object.keys(opts[k]).forEach(function (kk) { CONFIG[k][kk] = opts[k][kk]; });
        } else { CONFIG[k] = opts[k]; }
      });
      if (els.panel) renderPanel();
    },
    setAqi: setAqi,
    announce: announce,
    speak: speak,
    readPage: readPage,
    command: handleCommand,
    intent: matchIntent,
    caption: showCaption,
    status: function () { return { aqi: lastAqi, place: lastPlace, level: lastLevel }; },
    setOption: setOption,
    open: function () { togglePanel(true); },
    refresh: function () { renderPanel(); applyOptions(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/*!
 * AirCast Communication Mode (add-on for aircast-accessibility.js)
 * For deaf and speech-impaired (non-speaking) users who cannot use voice commands.
 *
 *  - Type a command instead of speaking it (same commands as voice navigation)
 *  - One-tap quick actions (no typing, no speaking needed)
 *  - Phrase board: tap to have the phone speak a phrase aloud, or show it
 *    full-screen in large text to someone nearby
 *
 * Load AFTER aircast-accessibility.js. No dependencies.
 */
(function () {
  'use strict';
  if (window.AirCastComm) return;

  var STR = {
    en: {
      btn: 'Communication', title: 'Communication mode', type: 'Type a question or command', send: 'Ask / Send',
      placeholder: 'e.g. Is it safe outside?, Do I need a mask?, Air quality in Chennai',
      questions: 'Tap a question for instant answer',
      answerTitle: 'AirCast Answer',
      quick: 'Quick actions', phrases: 'Phrase board (speak or show to others)', add: 'Add your own phrase', addBtn: 'Add',
      speak: 'Speak', show: 'Show', close: 'Close', tapClose: 'Tap anywhere to close',
      qRead: 'Air quality now', qForecast: 'Forecast', qAdvice: 'Health advice',
      qP1: 'Page 1', qP2: 'Page 2', qSim: 'Simulator', qPlan: 'Planner',
      askAir: '🌬️ How is the air quality now?',
      askSafe: '🚶 Is it safe to go outside?',
      askMask: '😷 Do I need a mask?',
      askBest: '⏰ Best time to go outside?',
      askForecast: '📈 What is the 24h forecast?',
      askWhy: '🔍 Why is pollution at this level?',
      askHospital: '🏥 Nearest clean-air hospital?',
      askWindow: '🪟 Should I close windows?',
      p1: 'I cannot speak. Please read this screen.',
      p2: 'I am deaf. Please write or type your message.',
      p3: 'I need medical help. Please call 108.',
      p4: 'The air is unsafe here. I need to go indoors.',
      p5: 'Please help me find a clean-air hospital nearby.'
    },
    hi: {
      btn: 'संवाद', title: 'संवाद मोड', type: 'सवाल या कमांड टाइप करें', send: 'पूछें / भेजें',
      placeholder: 'जैसे: क्या बाहर जाना सुरक्षित है?, मास्क चाहिए?, चेन्नई की हवा कैसी है?',
      questions: 'तुरंत उत्तर के लिए सवाल टैप करें',
      answerTitle: 'AirCast उत्तर',
      quick: 'त्वरित क्रियाएं', phrases: 'वाक्य बोर्ड (दूसरों को दिखाएं या बोलें)', add: 'अपना वाक्य जोड़ें', addBtn: 'जोड़ें',
      speak: 'बोलें', show: 'दिखाएं', close: 'बंद करें', tapClose: 'बंद करने के लिए कहीं भी टैप करें',
      qRead: 'अभी की वायु गुणवत्ता', qForecast: 'पूर्वानुमान', qAdvice: 'स्वास्थ्य सलाह',
      qP1: 'पेज 1', qP2: 'पेज 2', qSim: 'सिम्युलेटर', qPlan: 'योजना',
      askAir: '🌬️ अभी की हवा कैसी है?',
      askSafe: '🚶 क्या बाहर जाना सुरक्षित है?',
      askMask: '😷 क्या मुझे मास्क पहनना चाहिए?',
      askBest: '⏰ बाहर जाने का सबसे अच्छा समय?',
      askForecast: '📈 24 घंटे का पूर्वानुमान क्या है?',
      askWhy: '🔍 प्रदूषण का मुख्य कारण क्या है?',
      askHospital: '🏥 नजदीकी साफ़-हवा अस्पताल?',
      askWindow: '🪟 क्या खिड़कियां बंद रखनी चाहिए?',
      p1: 'मैं बोल नहीं सकता/सकती। कृपया यह स्क्रीन पढ़ें।',
      p2: 'मैं सुन नहीं सकता/सकती। कृपया लिखकर बताएं।',
      p3: 'मुझे चिकित्सा सहायता चाहिए। कृपया 108 पर कॉल करें।',
      p4: 'यहाँ की हवा असुरक्षित है। मुझे अंदर जाना है।',
      p5: 'कृपया पास में साफ़ हवा वाला अस्पताल खोजने में मदद करें।'
    },
    ta: {
      btn: 'தொடர்பு', title: 'தொடர்பு பயன்முறை', type: 'கேள்வி அல்லது கட்டளையை தட்டச்சு செய்யுங்கள்', send: 'கேள் / அனுப்பு',
      placeholder: 'எ.கா: வெளியே செல்வது பாதுகாப்பானதா?, முகக்கவசம் வேண்டுமா?, சென்னை காற்று',
      questions: 'உடனடி பதிலுக்கு கேள்வியைத் தொடவும்',
      answerTitle: 'AirCast பதில்',
      quick: 'விரைவு செயல்கள்', phrases: 'சொற்றொடர் பலகை', add: 'உங்கள் சொற்றொடரைச் சேர்க்கவும்', addBtn: 'சேர்',
      speak: 'பேசு', show: 'காட்டு', close: 'மூடு', tapClose: 'மூட எங்கும் தொடவும்',
      qRead: 'இப்போதைய காற்றுத் தரம்', qForecast: 'முன்னறிவிப்பு', qAdvice: 'சுகாதார ஆலோசனை',
      qP1: 'பக்கம் 1', qP2: 'பக்கம் 2', qSim: 'சிமுலேட்டர்', qPlan: 'திட்டம்',
      askAir: '🌬️ இப்போதைய காற்றுத் தரம் எப்படி?',
      askSafe: '🚶 வெளியே செல்வது பாதுகாப்பானதா?',
      askMask: '😷 எனக்கு முகக்கவசம் வேண்டுமா?',
      askBest: '⏰ வெளியே செல்ல சிறந்த நேரம் எது?',
      askForecast: '📈 24 மணி நேர முன்னறிவிப்பு என்ன?',
      askWhy: '🔍 மாசுபாட்டிற்கு முக்கிய காரணம் என்ன?',
      askHospital: '🏥 அருகிலுள்ள தூய காற்று மருத்துவமனை?',
      askWindow: '🪟 ஜன்னல்களை மூட வேண்டுமா?',
      p1: 'என்னால் பேச முடியாது. தயவுசெய்து இந்தத் திரையைப் படிக்கவும்.',
      p2: 'எனக்குக் காது கேட்காது. தயவுசெய்து எழுதிக் காட்டவும்.',
      p3: 'எனக்கு மருத்துவ உதவி தேவை. தயவுசெய்து 108 ஐ அழைக்கவும்.',
      p4: 'இங்கு காற்று பாதுகாப்பற்றது. நான் உள்ளே செல்ல வேண்டும்.',
      p5: 'அருகில் தூய காற்று உள்ள மருத்துவமனையைக் கண்டுபிடிக்க உதவவும்.'
    }
  };
  // One-tap Q&A items: [labelKey, querySentToAssistant]
  var QUESTIONS = [
    ['askAir', 'how is the air quality now'],
    ['askSafe', 'is it safe to go outside'],
    ['askMask', 'do I need a mask'],
    ['askBest', 'what is the best time to go outside'],
    ['askForecast', 'what is the forecast'],
    ['askWhy', 'why is the air pollution high'],
    ['askHospital', 'nearest clean air hospital'],
    ['askWindow', 'should I close windows']
  ];
  // Quick-action commands are sent in English keywords the voice handler understands.
  var QUICK = [
    ['qRead', 'read air quality'], ['qForecast', 'forecast'], ['qAdvice', 'health advice'],
    ['qP1', 'page 1'], ['qP2', 'page 2'], ['qSim', 'simulator'], ['qPlan', 'planner']
  ];
  var KEY = 'aircast_phrases_v1';

  function lang() {
    var l = '';
    try { l = localStorage.getItem('lang') || ''; } catch (e) { /* ignore */ }
    return String(l || document.documentElement.lang || 'en').toLowerCase().split(/[-_]/)[0];
  }
  function t(k) { var l = lang(); return (STR[l] && STR[l][k]) || STR.en[k] || k; }
  function custom() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function saveCustom(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, 12))); } catch (e) { /* ignore */ } }
  function api() { return window.AirCastA11y || null; }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.cm-fab{position:fixed;right:12px;bottom:216px;z-index:99990;width:52px;height:52px;border-radius:26px;border:2px solid #fff;background:#1d4ed8;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
      '.cm-sheet{position:fixed;left:8px;right:8px;bottom:8px;z-index:99996;max-height:78vh;overflow:auto;background:#fff;color:#0f172a;border:2px solid #0f172a;border-radius:16px;padding:14px;font:15px/1.4 system-ui,sans-serif;display:none;box-shadow:0 10px 30px rgba(0,0,0,.4)}',
      '.cm-sheet.open{display:block}',
      '.cm-sheet h2{margin:0 0 8px;font-size:18px}.cm-sheet h3{margin:14px 0 6px;font-size:15px}',
      '.cm-row{display:flex;gap:8px}.cm-row input{flex:1;min-height:44px;padding:8px 10px;border:2px solid #0f172a;border-radius:10px;font-size:16px;color:#0f172a;background:#fff}',
      '.cm-btn{min-height:44px;padding:8px 12px;border-radius:10px;border:2px solid #0f172a;background:#fff;color:#0f172a;font-weight:700;cursor:pointer}',
      '.cm-btn.pri{background:#1d4ed8;color:#fff;border-color:#1d4ed8}',
      '.cm-chips{display:flex;flex-wrap:wrap;gap:8px}',
      '.cm-qbtn{min-height:44px;padding:8px 12px;border-radius:10px;border:2px solid #1d4ed8;background:#eff6ff;color:#0f172a;font-weight:700;cursor:pointer;text-align:left}',
      '.cm-qbtn:hover{background:#dbeafe}',
      '.cm-answer{margin-top:12px;padding:12px 14px;border-radius:12px;border:2px solid #0f766e;background:#f0fdfa;color:#0f172a}',
      '.cm-answer-q{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:#0f766e;margin:0 0 4px}',
      '.cm-answer-a{font-size:16px;font-weight:700;line-height:1.45;margin:0 0 10px;color:#0f172a}',
      '.cm-phrase{border:2px solid #cbd5e1;border-radius:12px;padding:10px;margin-bottom:8px}',
      '.cm-phrase p{margin:0 0 8px;font-weight:600}',
      '.cm-full{position:fixed;inset:0;z-index:100001;background:#000;color:#fff;display:none;align-items:center;justify-content:center;text-align:center;padding:24px;font:700 clamp(28px,9vw,56px)/1.25 system-ui,sans-serif;cursor:pointer;flex-direction:column}',
      '.cm-full small{font:500 16px system-ui,sans-serif;margin-top:24px;opacity:.7}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var fab, sheet, full, fullText, fullHint, lastQA = null;

  function showFull(text) {
    fullText.textContent = text; fullHint.textContent = t('tapClose');
    full.style.display = 'flex';
  }
  function say(text) { var a = api(); if (a && a.speak) a.speak(text, true); }
  function cmd(text) { var a = api(); if (a && a.command) a.command(text); }

  function resolveAnswer(displayQuestion, query) {
    var q = (query || displayQuestion || '').trim();
    if (!q) return;
    // Navigation commands still navigate & also confirm in the answer box
    if (/^(?:page ?1|page ?2|simulator|planner|पेज|पக்கம்|सिम्युलेटर|சிமுலேட்டர்|योजना|திட்டம்)/i.test(q)) {
      cmd(q);
      lastQA = { q: displayQuestion || q, a: 'Opened: ' + q };
      render();
      return;
    }
    var ans = '';
    if (window.AirCastAssistant && typeof window.AirCastAssistant.getAnswer === 'function') {
      ans = window.AirCastAssistant.getAnswer(q) || '';
    }
    if (!ans) {
      var a = api();
      if (a && a.status) {
        var st = a.status();
        ans = (st.place ? st.place + ': ' : '') + (st.aqi != null ? 'AQI ' + st.aqi + ' (' + (st.level || '') + ').' : '');
      }
    }
    if (ans) {
      lastQA = { q: displayQuestion || q, a: ans };
      render();
      say(ans);
    } else {
      cmd(q);
    }
  }

  function render() {
    fab.setAttribute('aria-label', t('btn'));
    sheet.setAttribute('aria-label', t('title'));
    sheet.innerHTML = '';
    sheet.appendChild(el('h2', null, t('title')));

    // 1) type a question or command
    sheet.appendChild(el('h3', null, t('type')));
    var row = el('div', 'cm-row');
    var input = document.createElement('input');
    input.type = 'text'; input.placeholder = t('placeholder'); input.setAttribute('aria-label', t('type'));
    var send = el('button', 'cm-btn pri', t('send'));
    function go() { var v = input.value.trim(); if (v) { input.value = ''; resolveAnswer(v, v); } }
    send.addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    row.appendChild(input); row.appendChild(send);
    sheet.appendChild(row);

    // Live Answer Box (shown whenever a question is asked or tapped)
    if (lastQA && lastQA.a) {
      var ansBox = el('div', 'cm-answer');
      ansBox.setAttribute('role', 'status');
      ansBox.setAttribute('aria-live', 'polite');
      ansBox.appendChild(el('div', 'cm-answer-q', t('answerTitle') + ' — ' + lastQA.q));
      ansBox.appendChild(el('p', 'cm-answer-a', lastQA.a));
      var ansBtns = el('div', 'cm-row');
      var spA = el('button', 'cm-btn', '🔊 ' + t('speak'));
      spA.addEventListener('click', function () { say(lastQA.a); });
      var shA = el('button', 'cm-btn pri', '🖥 ' + t('show'));
      shA.addEventListener('click', function () { showFull(lastQA.a); });
      ansBtns.appendChild(spA); ansBtns.appendChild(shA);
      ansBox.appendChild(ansBtns);
      sheet.appendChild(ansBox);
    }

    // 2) One-tap Questions with Instant Answers
    sheet.appendChild(el('h3', null, t('questions')));
    var qChips = el('div', 'cm-chips');
    QUESTIONS.forEach(function (item) {
      var label = t(item[0]);
      var b = el('button', 'cm-qbtn', label);
      b.addEventListener('click', function () { resolveAnswer(label, item[1]); });
      qChips.appendChild(b);
    });
    sheet.appendChild(qChips);

    // 3) quick actions
    sheet.appendChild(el('h3', null, t('quick')));
    var chips = el('div', 'cm-chips');
    QUICK.forEach(function (q) {
      var b = el('button', 'cm-btn', t(q[0]));
      b.addEventListener('click', function () {
        if (q[1] === 'read air quality' || q[1] === 'forecast' || q[1] === 'health advice') {
          var mapped = q[1] === 'read air quality' ? 'how is the air quality now' : (q[1] === 'forecast' ? 'what is the forecast' : 'is it safe to go outside');
          resolveAnswer(t(q[0]), mapped);
        } else {
          cmd(q[1]);
          toggle(false);
        }
      });
      chips.appendChild(b);
    });
    sheet.appendChild(chips);

    var close = el('button', 'cm-btn', t('close'));
    close.style.marginTop = '12px';
    close.addEventListener('click', function () { toggle(false); });
    sheet.appendChild(close);
  }

  function toggle(force) {
    var open = typeof force === 'boolean' ? force : !sheet.classList.contains('open');
    sheet.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { render(); var i = sheet.querySelector('input'); if (i) i.focus(); }
  }

  function init() {
    css();
    fab = el('button', 'cm-fab', '💬');
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.addEventListener('click', function () { toggle(); });
    sheet = el('div', 'cm-sheet'); sheet.setAttribute('role', 'dialog');
    full = el('div', 'cm-full'); full.setAttribute('role', 'dialog');
    fullText = el('div'); fullHint = el('small');
    full.appendChild(fullText); full.appendChild(fullHint);
    full.addEventListener('click', function () { full.style.display = 'none'; });
    document.body.appendChild(fab); document.body.appendChild(sheet); document.body.appendChild(full);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { full.style.display = 'none'; toggle(false); }
    });
    new MutationObserver(function () { if (sheet.classList.contains('open')) render(); fab.setAttribute('aria-label', t('btn')); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    fab.setAttribute('aria-label', t('btn'));
  }

  window.AirCastComm = { open: function () { toggle(true); }, show: showFull };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/*!
 * AirCast Animation Pack: animated pictograms for deaf / hard-of-hearing users.
 * Visual-first: every message is an animated icon + short text (never colour alone).
 * No dependencies. Respects "Reduce motion" (OS setting and AirCastA11y option).
 * These are pictograms, NOT sign language. Use alongside real sign-language clips.
 *
 * API
 *   AirCastAnim.icon(name)            -> DOM element (animated icon + label)
 *   AirCastAnim.mount(container, aqi) -> shows the AQI face + recommended actions for that level
 *   AirCastAnim.popup(name, text, ms) -> animated alert card on screen
 *   AirCastAnim.names                 -> all icon names
 * If aircast-accessibility.js is loaded first, severe alerts also show a popup automatically.
 */
(function () {
  'use strict';
  if (window.AirCastAnim) return;

  var L = {
    en: { good: 'Good', satisfactory: 'Satisfactory', moderate: 'Moderate', poor: 'Poor', veryPoor: 'Very poor', severe: 'Severe',
      mask: 'Wear an N95 mask outside', indoors: 'Stay indoors, close windows', noRun: 'Avoid hard exercise outside',
      bell: 'Air quality alert', phone: 'Check your phone alerts', medical: 'Get medical help if breathing is hard',
      clock: 'Plan outdoor time for the cleanest hours' },
    hi: { good: 'अच्छा', satisfactory: 'संतोषजनक', moderate: 'मध्यम', poor: 'खराब', veryPoor: 'बहुत खराब', severe: 'गंभीर',
      mask: 'बाहर N95 मास्क पहनें', indoors: 'घर के अंदर रहें, खिड़कियां बंद करें', noRun: 'बाहर कठिन व्यायाम न करें',
      bell: 'वायु गुणवत्ता चेतावनी', phone: 'फ़ोन अलर्ट देखें', medical: 'सांस लेने में कठिनाई हो तो चिकित्सा सहायता लें',
      clock: 'सबसे साफ़ घंटों में बाहर का समय तय करें' },
    ta: { good: 'நல்லது', satisfactory: 'திருப்திகரம்', moderate: 'மிதமானது', poor: 'மோசம்', veryPoor: 'மிக மோசம்', severe: 'கடுமையானது',
      mask: 'வெளியே N95 முகக்கவசம் அணியுங்கள்', indoors: 'வீட்டிற்குள் இருங்கள், ஜன்னல்களை மூடுங்கள்', noRun: 'வெளியே கடினமான உடற்பயிற்சி வேண்டாம்',
      bell: 'காற்றுத் தர எச்சரிக்கை', phone: 'தொலைபேசி எச்சரிக்கைகளைப் பாருங்கள்', medical: 'மூச்சுத் திணறல் இருந்தால் மருத்துவ உதவி பெறுங்கள்',
      clock: 'தூய்மையான நேரங்களில் வெளியே செல்லத் திட்டமிடுங்கள்' }
  };
  var COLORS = { good: '#16a34a', satisfactory: '#65a30d', moderate: '#ca8a04', poor: '#ea580c', veryPoor: '#dc2626', severe: '#7f1d1d' };
  var MOUTH = { good: 'M30 60 Q50 80 70 60', satisfactory: 'M32 62 Q50 72 68 62', moderate: 'M33 66 L67 66',
    poor: 'M32 72 Q50 60 68 72', veryPoor: 'M30 74 Q50 56 70 74', severe: 'M28 76 Q50 54 72 76' };
  var REC = { good: ['clock'], satisfactory: ['clock'], moderate: ['clock', 'noRun'], poor: ['noRun', 'mask'],
    veryPoor: ['mask', 'indoors', 'noRun'], severe: ['indoors', 'mask', 'medical', 'bell'] };

  function face(k) {
    var c = COLORS[k];
    var eyes = k === 'severe'
      ? '<path d="M34 38l10 10M44 38L34 48M56 38l10 10M66 38L56 48" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'
      : '<g class="am-eyes"><circle cx="38" cy="42" r="5" fill="#fff"/><circle cx="62" cy="42" r="5" fill="#fff"/></g>';
    var drop = k === 'veryPoor' ? '<path class="am-drop" d="M78 30q6 9 0 13q-6-4 0-13z" fill="#bae6fd"/>' : '';
    var ring = (k === 'severe' || k === 'veryPoor') ? '<circle class="am-ring" cx="50" cy="50" r="44" fill="none" stroke="' + c + '" stroke-width="4"/>' : '';
    return ring + '<circle cx="50" cy="50" r="42" fill="' + c + '"/>' + eyes +
      '<path d="' + MOUTH[k] + '" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>' + drop;
  }

  var ICONS = {
    mask: '<circle cx="50" cy="50" r="42" fill="#2563eb"/><circle cx="50" cy="40" r="17" fill="#fde68a"/><rect x="33" y="44" width="34" height="18" rx="6" fill="#fff" stroke="#1e3a8a" stroke-width="3"/><path d="M33 50h-6M67 50h6" stroke="#fff" stroke-width="3"/><g class="am-wind" stroke="#bfdbfe" stroke-width="3" stroke-linecap="round"><path d="M10 72h18"/><path d="M14 82h22"/></g>',
    indoors: '<circle cx="50" cy="50" r="42" fill="#0d9488"/><path d="M24 52L50 28l26 24v22H24z" fill="#fff"/><rect x="43" y="58" width="14" height="16" fill="#0d9488"/><g class="am-puff" fill="#cbd5e1"><circle cx="12" cy="42" r="6"/><circle cx="10" cy="58" r="5"/></g>',
    noRun: '<circle cx="50" cy="50" r="42" fill="#ea580c"/><circle cx="58" cy="30" r="6" fill="#fff"/><path d="M54 38L46 56L34 62M46 56L56 68L52 82M54 40L68 48L76 42M54 40L42 46" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><g class="am-pulse"><circle cx="50" cy="50" r="36" fill="none" stroke="#fff" stroke-width="5"/><path d="M24 76L76 24" stroke="#fff" stroke-width="6"/></g>',
    bell: '<circle cx="50" cy="50" r="42" fill="#d97706"/><g class="am-shake"><path d="M50 22c-12 0-18 9-18 20v12l-6 8h48l-6-8V42c0-11-6-20-18-20z" fill="#fff"/><circle cx="50" cy="72" r="6" fill="#fff"/></g>',
    phone: '<circle cx="50" cy="50" r="42" fill="#7c3aed"/><g class="am-vib"><rect x="36" y="22" width="28" height="52" rx="6" fill="#fff"/><rect x="40" y="30" width="20" height="30" fill="#7c3aed"/></g><path class="am-wave" d="M24 38q-6 12 0 24M76 38q6 12 0 24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
    medical: '<circle class="am-ring" cx="50" cy="50" r="44" fill="none" stroke="#dc2626" stroke-width="4"/><circle cx="50" cy="50" r="42" fill="#dc2626"/><path d="M42 26h16v16h16v16H58v16H42V58H26V42h16z" fill="#fff"/>',
    clock: '<circle cx="50" cy="50" r="42" fill="#0369a1"/><circle cx="50" cy="50" r="28" fill="#fff"/><g class="am-spin"><path d="M50 50V30" stroke="#0369a1" stroke-width="5" stroke-linecap="round"/></g><circle cx="50" cy="50" r="4" fill="#0369a1"/>'
  };
  var NAMES = Object.keys(COLORS).concat(Object.keys(ICONS));

  function lang() {
    var l = '';
    try { l = localStorage.getItem('lang') || ''; } catch (e) { /* ignore */ }
    return String(l || document.documentElement.lang || 'en').toLowerCase().split(/[-_]/)[0];
  }
  function label(k) { var l = lang(); return (L[l] && L[l][k]) || L.en[k] || k; }
  function levelOf(a) { return a <= 50 ? 'good' : a <= 100 ? 'satisfactory' : a <= 200 ? 'moderate' : a <= 300 ? 'poor' : a <= 400 ? 'veryPoor' : 'severe'; }

  var cssDone = false;
  function css() {
    if (cssDone) return; cssDone = true;
    var s = document.createElement('style');
    s.textContent = [
      '.am-ico{display:inline-flex;flex-direction:column;align-items:center;gap:6px;text-align:center;max-width:120px;font:600 13px/1.3 system-ui,sans-serif}',
      '.am-ico svg{width:84px;height:84px;overflow:visible}',
      '.am-ico svg *{transform-box:fill-box;transform-origin:center}',
      '.am-ico svg .am-shake{transform-origin:50% 10%}',
      '.am-ico svg .am-spin{transform-box:view-box;transform-origin:50px 50px}',
      '@keyframes am-pulse{50%{transform:scale(1.12)}}',
      '@keyframes am-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}',
      '@keyframes am-ring{0%{transform:scale(.95);opacity:.9}100%{transform:scale(1.25);opacity:0}}',
      '@keyframes am-shake{0%,100%{transform:rotate(0)}20%{transform:rotate(14deg)}40%{transform:rotate(-14deg)}60%{transform:rotate(10deg)}80%{transform:rotate(-10deg)}}',
      '@keyframes am-vib{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}',
      '@keyframes am-wave{0%,100%{opacity:.2}50%{opacity:1}}',
      '@keyframes am-wind{0%{transform:translateX(-10px);opacity:0}50%{opacity:1}100%{transform:translateX(10px);opacity:0}}',
      '@keyframes am-puff{0%{transform:translateX(-4px);opacity:0}30%{opacity:1}100%{transform:translateX(24px);opacity:0}}',
      '@keyframes am-spin{to{transform:rotate(360deg)}}',
      '@keyframes am-drop{0%{transform:translateY(0);opacity:1}100%{transform:translateY(10px);opacity:0}}',
      '.am-eyes{animation:am-blink 4s infinite}.am-pulse{animation:am-pulse 1.6s ease-in-out infinite}',
      '.am-ring{animation:am-ring 1.4s ease-out infinite}.am-shake{animation:am-shake 1.2s ease-in-out infinite}',
      '.am-vib{animation:am-vib .35s linear infinite}.am-wave{animation:am-wave 1.2s ease-in-out infinite}',
      '.am-wind{animation:am-wind 1.8s ease-in-out infinite}.am-puff{animation:am-puff 2.2s ease-in infinite}',
      '.am-spin{animation:am-spin 6s linear infinite}.am-drop{animation:am-drop 1.6s ease-in infinite}',
      '@media (prefers-reduced-motion:reduce){.am-ico svg *{animation:none!important}}',
      'html.a11y-rm .am-ico svg *{animation:none!important}',
      '.am-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}',
      '.am-pop{position:fixed;left:8px;right:8px;top:8px;z-index:100000;display:flex;gap:12px;align-items:center;background:#111827;color:#fff;border:3px solid #fff;border-radius:14px;padding:12px;font:700 16px/1.35 system-ui,sans-serif;cursor:pointer}',
      '.am-pop .am-ico{color:#fff;max-width:96px}.am-pop .am-ico span{display:none}.am-pop .am-ico svg{width:64px;height:64px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function icon(name) {
    css();
    var w = document.createElement('div');
    w.className = 'am-ico'; w.setAttribute('role', 'img');
    var lbl = label(name);
    w.setAttribute('aria-label', lbl);
    w.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + (COLORS[name] ? face(name) : (ICONS[name] || '')) + '</svg>';
    var s = document.createElement('span'); s.textContent = lbl; w.appendChild(s);
    return w;
  }

  function mount(container, aqi) {
    css();
    var lvl = levelOf(Number(aqi) || 0);
    container.innerHTML = '';
    var row = document.createElement('div'); row.className = 'am-row';
    row.appendChild(icon(lvl));
    REC[lvl].forEach(function (n) { row.appendChild(icon(n)); });
    container.appendChild(row);
    return lvl;
  }

  var popEl = null, popTimer = null;
  function popup(name, text, ms) {
    css();
    if (popEl && popEl.parentNode) popEl.parentNode.removeChild(popEl);
    popEl = document.createElement('div'); popEl.className = 'am-pop'; popEl.setAttribute('role', 'alert');
    popEl.appendChild(icon(name));
    var t = document.createElement('div'); t.textContent = text || label(name); popEl.appendChild(t);
    popEl.addEventListener('click', function () { if (popEl.parentNode) popEl.parentNode.removeChild(popEl); });
    document.body.appendChild(popEl);
    clearTimeout(popTimer);
    popTimer = setTimeout(function () { if (popEl && popEl.parentNode) popEl.parentNode.removeChild(popEl); }, ms || 12000);
  }

  window.AirCastAnim = { icon: icon, mount: mount, popup: popup, names: NAMES, levelOf: levelOf };

  // Auto-hook: severe / emergency alerts from aircast-accessibility.js also show an animated popup.
  var A = window.AirCastA11y;
  if (A && A.announce && !A.announce._am) {
    var orig = A.announce;
    A.announce = function (text, sev) {
      orig.apply(A, arguments);
      if (sev === 'severe' || sev === 'emergency') popup(sev === 'emergency' ? 'medical' : 'bell', text);
    };
    A.announce._am = true;
  }
})();

/*!
 * AirCast Voice Assistant (wake word: just "AirCast", no button)
 * For blind and low-vision users (and anyone who prefers talking).
 *
 * FLOW
 *  1. When the site opens it greets: "Good morning! Have a nice day. I am AirCast. Tell me what you want."
 *     (Browsers block sound until the visitor touches the page once. If so, the greeting plays on the first
 *     tap, key press or screen-reader touch.)
 *  2. It listens for a few seconds. If the visitor says anything, it answers. After each answer it listens again.
 *  3. If nobody speaks, it goes to standby: it only listens for the word "AirCast" to wake up again.
 *  4. Saying "stop listening" or "goodbye" turns it fully off. After 10 quiet minutes it also turns off to save
 *     battery. Tapping the screen once turns it back on.
 *  There is NO mic button. Answers come from a built-in engine (no external AI, no API key).
 *
 * LIMITS: works only while the page is open and visible; uses the browser speech service (Chrome/Edge best).
 * Load AFTER aircast-accessibility.js.
 *
 * FEED IT YOUR LIVE DATA (AirCastA11y.setAqi(aqi, city) alone is enough for basic answers):
 *   AirCastAssistant.configure({
 *     getContext: () => ({ city:'Coimbatore', aqi:73, category:'Satisfactory', pm25:40.8,
 *       bestHour:'12:00', worstHour:'22:00', forecast:'Air improves after noon.',
 *       topDriver:'rush-hour traffic', temp:29, wind:12, humidity:62 })
 *   });
 */
(function () {
  'use strict';
  if (window.AirCastAssistant) return;

  var CFG = {
    ask: null,
    getContext: null,
    getLang: null,
    setLanguage: null,
    onSelectPlace: null,
    idleMinutes: 10,
    activeSeconds: 8, greetDelayMs: 800, showStatus: true, greet: true,
    wake: /(?:\b(?:air|ayr|aer|eyr)[\s\-]*(?:cast|cost|cas)\b|एयर[\s\-]*कास्ट|ஏர்[\s\-]*காஸ்ட்|ఎయిర్[\s\-]*కాస్ట్|ಏರ್[\s\-]*ಕಾಸ್ಟ್|എയർ[\s\-]*കാസ്റ്റ്)/i
  };
  var LOCALES = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', ur: 'ur-IN' };
  var STR = {
    en: {
      btn: 'AirCast voice assistant',
      on: 'AirCast is on. Say AirCast, then ask me anything about the air. Say stop to quiet me.',
      disclosure: 'Note: your browser speech service hears you. This is general information, not medical advice.',
      off: 'AirCast is off.', unsupported: 'Voice is not supported in this browser. Please use Chrome.',
      denied: 'Microphone access was blocked. Please allow the microphone and try again.',
      noAi: 'The helper is not connected yet.', error: 'Sorry, I could not answer that. Please try again.',
      paused: 'AirCast is paused to save battery. Tap anywhere to wake me.',
      emergency: 'This may be an emergency. Call 108 now, or ask someone nearby to call. Do not wait for the app.',
      stOff: 'AirCast: off', stWait: 'Say “AirCast”', stListen: 'Listening…', stThink: 'Thinking…', stSpeak: 'Speaking…',
      gm: 'Good morning', ga: 'Good afternoon', ge: 'Good evening', gn: 'Hello',
      nice: 'Have a nice day.', nice2: 'Have a nice evening.', iam: 'I am AirCast.', tell: 'Tell me what you want.',
      intro: 'I listen for my name, AirCast, using your browser speech service. Say stop listening to turn me off.',
      langSwitched: 'Switched language to English.',
      opening: 'Opening',
      placeSwitched: 'Switched to',
      placeNotFound: 'Sorry, I could not find that country, state, or city. Please try saying another location.'
    },
    hi: {
      btn: 'एयरकास्ट आवाज़ सहायक',
      on: 'एयरकास्ट चालू है। एयरकास्ट कहें, फिर हवा के बारे में कुछ भी पूछें। चुप कराने के लिए रुको कहें।',
      disclosure: 'ध्यान दें: आपकी आवाज़ ब्राउज़र की स्पीच सेवा सुनती है। यह सामान्य जानकारी है, चिकित्सा सलाह नहीं।',
      off: 'एयरकास्ट बंद है।', unsupported: 'इस ब्राउज़र में आवाज़ समर्थित नहीं है। कृपया क्रोम इस्तेमाल करें।',
      denied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया अनुमति दें और फिर कोशिश करें।',
      noAi: 'सहायक अभी जुड़ा नहीं है।', error: 'क्षमा करें, मैं जवाब नहीं दे सका। कृपया फिर कोशिश करें।',
      paused: 'बैटरी बचाने के लिए एयरकास्ट रुका है। जगाने के लिए कहीं भी टैप करें।',
      emergency: 'यह आपातकाल हो सकता है। अभी 108 पर कॉल करें, या पास के किसी व्यक्ति से कॉल करवाएं। ऐप का इंतज़ार न करें।',
      gm: 'सुप्रभात', ga: 'नमस्कार', ge: 'शुभ संध्या', gn: 'नमस्कार',
      nice: 'आपका दिन शुभ हो।', nice2: 'आपकी शाम शुभ हो।', iam: 'मैं एयरकास्ट हूँ।', tell: 'बताइए, आपको क्या चाहिए?',
      intro: 'मैं अपना नाम, एयरकास्ट, सुनने के लिए आपके ब्राउज़र की स्पीच सेवा इस्तेमाल करता हूँ। मुझे बंद करने के लिए सुनना बंद करो कहें।',
      langSwitched: 'भाषा हिंदी में बदल दी गई है।',
      opening: 'खोल रहा हूँ',
      placeSwitched: 'स्थान बदल दिया:',
      placeNotFound: 'क्षमा करें, वह देश, राज्य या शहर नहीं मिला। कृपया कोई दूसरा स्थान बोलें।'
    },
    ta: {
      btn: 'ஏர்காஸ்ட் குரல் உதவியாளர்',
      on: 'ஏர்காஸ்ட் இயக்கத்தில் உள்ளது. ஏர்காஸ்ட் என்று சொல்லி, காற்றைப் பற்றி எதுவும் கேளுங்கள். என்னை நிறுத்த நிறுத்து என்று சொல்லுங்கள்.',
      disclosure: 'கவனிக்கவும்: உங்கள் உலாவியின் பேச்சு சேவை உங்களைக் கேட்கும். இது பொதுத் தகவல், மருத்துவ ஆலோசனை அல்ல.',
      off: 'ஏர்காஸ்ட் அணைக்கப்பட்டது.', unsupported: 'இந்த உலாவியில் குரல் ஆதரிக்கப்படவில்லை. குரோம் பயன்படுத்தவும்.',
      denied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. அனுமதி அளித்து மீண்டும் முயலவும்.',
      noAi: 'உதவியாளர் இன்னும் இணைக்கப்படவில்லை.', error: 'மன்னிக்கவும், பதில் அளிக்க முடியவில்லை. மீண்டும் முயலவும்.',
      paused: 'பேட்டரியைச் சேமிக்க ஏர்காஸ்ட் நிறுத்தப்பட்டது. என்னை எழுப்ப எங்கும் தொடவும்.',
      emergency: 'இது அவசரநிலையாக இருக்கலாம். இப்போதே 108 ஐ அழைக்கவும், அல்லது அருகிலுள்ளவரை அழைக்கச் சொல்லுங்கள். செயலிக்காகக் காத்திருக்க வேண்டாம்.',
      gm: 'காலை வணக்கம்', ga: 'மதிய வணக்கம்', ge: 'மாலை வணக்கம்', gn: 'வணக்கம்',
      nice: 'இனிய நாளாக அமையட்டும்.', nice2: 'இனிய மாலையாக அமையட்டும்.', iam: 'நான் ஏர்காஸ்ட்.', tell: 'உங்களுக்கு என்ன வேண்டும் என்று சொல்லுங்கள்.',
      intro: 'என் பெயரான ஏர்காஸ்டைக் கேட்க உங்கள் உலாவியின் பேச்சு சேவையைப் பயன்படுத்துகிறேன். என்னை நிறுத்த கேட்பதை நிறுத்து என்று சொல்லுங்கள்.',
      langSwitched: 'மொழி தமிழுக்கு மாற்றப்பட்டது.',
      opening: 'திறக்கிறது',
      placeSwitched: 'மாற்றப்பட்டது:',
      placeNotFound: 'மன்னிக்கவும், அந்த நாடு, மாநிலம் அல்லது நகரத்தைக் கண்டுபிடிக்க முடியவில்லை. வேறு இடத்தைச் சொல்லுங்கள்.'
    },
    te: {
      btn: 'ఎయిర్‌కాస్ట్ వాయిస్ అసిస్టెంట్',
      on: 'ఎయిర్‌కాస్ట్ ఆన్‌లో ఉంది. ఎయిర్‌కాస్ట్ అని చెప్పి గాలి నాణ్యత గురించి అడగండి. ఆపడానికి ఆపు అని చెప్పండి.',
      disclosure: 'గమనిక: మీ బ్రౌజర్ స్పీచ్ సేవ మిమ్మల్ని వింటుంది. ఇది సాధారణ సమాచారం మాత్రమే, వైద్య సలహా కాదు.',
      off: 'ఎయిర్‌కాస్ట్ ఆఫ్‌లో ఉంది.', unsupported: 'ఈ బ్రౌజర్‌లో వాయిస్ సపోర్ట్ లేదు. దయచేసి క్రోమ్ వాడండి.',
      denied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.',
      noAi: 'సహాయకుడు ఇంకా కనెక్ట్ కాలేదు.', error: 'క్షమించండి, సమాధానం చెప్పలేకపోయాను. మళ్లీ ప్రయత్నించండి.',
      paused: 'బ్యాటరీని ఆదా చేయడానికి ఎయిర్‌కాస్ట్ ఆగింది. లేపడానికి ఎక్కడైనా ట్యాప్ చేయండి.',
      emergency: 'ఇది అత్యవసర పరిస్థితి కావచ్చు. వెంటనే 108కి కాల్ చేయండి.',
      gm: 'శుభోదయం', ga: 'శుభ మధ్యాహ్నం', ge: 'శుభ సాయంత్రం', gn: 'నమస్కారం',
      nice: 'మీ రోజు శుభప్రదంగా ఉండాలి.', nice2: 'మీ సాయంత్రం శుభప్రదంగా ఉండాలి.', iam: 'నేను ఎయిర్‌కాస్ట్.', tell: 'మీకు ఏమి కావాలో చెప్పండి.',
      intro: 'నా పేరు ఎయిర్‌కాస్ట్ వినడానికి మీ బ్రౌజర్ స్పీచ్ సేవను ఉపయోగిస్తాను. ఆపడానికి వినడం ఆపు అని చెప్పండి.',
      langSwitched: 'భాష తెలుగులోకి మార్చబడింది.',
      opening: 'తెరుస్తోంది',
      placeSwitched: 'మార్చబడింది:',
      placeNotFound: 'క్షమించండి, ఆ దేశం, రాష్ట్రం లేదా నగరం కనుగొనబడలేదు. దయచేసి మరో ప్రదేశం చెప్పండి.'
    },
    kn: {
      btn: 'ಏರ್‌ಕಾಸ್ಟ್ ಧ್ವನಿ ಸಹಾಯಕ',
      on: 'ಏರ್‌ಕಾಸ್ಟ್ ಆನ್ ಆಗಿದೆ. ಏರ್‌ಕಾಸ್ಟ್ ಎಂದು ಹೇಳಿ ಗಾಳಿಯ ಗುಣಮಟ್ಟದ ಬಗ್ಗೆ ಕೇಳಿ. ನಿಲ್ಲಿಸಲು ನಿಲ್ಲಿಸು ಎಂದು ಹೇಳಿ.',
      disclosure: 'ಸೂಚನೆ: ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ಸೇವೆ ನಿಮ್ಮನ್ನು ಕೇಳುತ್ತದೆ. ಇದು ಸಾಮಾನ್ಯ ಮಾಹಿತಿ, ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ.',
      off: 'ಏರ್‌ಕಾಸ್ಟ್ ಆಫ್ ಆಗಿದೆ.', unsupported: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬೆಂಬಲವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕ್ರೋಮ್ ಬಳಸಿ.',
      denied: 'ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಅನುಮತಿ ನೀಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
      noAi: 'ಸಹಾಯಕ ಇನ್ನೂ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ.', error: 'ಕ್ಷಮಿಸಿ, ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
      paused: 'ಬ್ಯಾಟರಿ ಉಳಿಸಲು ಏರ್‌ಕಾಸ್ಟ್ ವಿರಾಮದಲ್ಲಿದೆ. ಎಬ್ಬಿಸಲು ಎಲ್ಲಿಯಾದರೂ ಟ್ಯಾಪ್ ಮಾಡಿ.',
      emergency: 'ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಾಗಿರಬಹುದು. ತಕ್ಷಣ 108ಕ್ಕೆ ಕರೆ ಮಾಡಿ.',
      gm: 'ಶುಭೋದಯ', ga: 'ಶುಭ ಮಧ್ಯಾಹ್ನ', ge: 'ಶುಭ ಸಂಜೆ', gn: 'ನಮಸ್ಕಾರ',
      nice: 'ನಿಮ್ಮ ದಿನ ಶುಭವಾಗಲಿ.', nice2: 'ನಿಮ್ಮ ಸಂಜೆ ಶುಭವಾಗಲಿ.', iam: 'ನಾನು ಏರ್‌ಕಾಸ್ಟ್.', tell: 'ನಿಮಗೆ ಏನು ಬೇಕು ಎಂದು ಹೇಳಿ.',
      intro: 'ನನ್ನ ಹೆಸರು ಏರ್‌ಕಾಸ್ಟ್ ಕೇಳಲು ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ಸೇವೆಯನ್ನು ಬಳಸುತ್ತೇನೆ.',
      langSwitched: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.',
      opening: 'ತೆರೆಯುತ್ತಿದೆ',
      placeSwitched: 'ಬದಲಾಯಿಸಲಾಗಿದೆ:',
      placeNotFound: 'ಕ್ಷಮಿಸಿ, ಆ ದೇಶ, ರಾಜ್ಯ ಅಥವಾ ನಗರ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಸ್ಥಳವನ್ನು ಹೇಳಿ.'
    },
    ml: {
      btn: 'എയർകാസ്റ്റ് വോയ്‌സ് അസിസ്റ്റന്റ്',
      on: 'എയർകാസ്റ്റ് ഓണാണ്. എയർകാസ്റ്റ് എന്ന് പറഞ്ഞ് വായു ഗുണനിലവാരത്തെക്കുറിച്ച് ചോദിക്കുക. നിർത്താൻ നിർത്തുക എന്ന് പറയുക.',
      disclosure: 'കുറിപ്പ്: നിങ്ങളുടെ ബ്രൗസർ സ്പീച്ച് സേവനം നിങ്ങളെ കേൾക്കും. ഇത് പൊതുവായ വിവരമാണ്, വൈദ്യോപദേശമല്ല.',
      off: 'എയർകാസ്റ്റ് ഓഫാണ്.', unsupported: 'ഈ ബ്രൗസറിൽ വോയ്‌സ് പിന്തുണയില്ല. ദയവായി ക്രോം ഉപയോഗിക്കുക.',
      denied: 'മൈക്രോഫോൺ അനുമതി നിഷേധിച്ചു. അനുമതി നൽകി വീണ്ടും ശ്രമിക്കുക.',
      noAi: 'സഹായി ഇതുവരെ കണക്റ്റ് ചെയ്തിട്ടില്ല.', error: 'ക്ഷമിക്കണം, ഉത്തരം നൽകാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.',
      paused: 'ബാറ്ററി ലാഭിക്കാൻ എയർകാസ്റ്റ് താൽക്കാലികമായി നിർത്തി. ഉണർത്താൻ എവിടെയെങ്കിലും ടാപ്പ് ചെയ്യുക.',
      emergency: 'ഇതൊരു അടിയന്തര സാഹചര്യമായിരിക്കാം. ഉടൻ 108-ൽ വിളിക്കുക.',
      gm: 'സുപ്രഭാതം', ga: 'ശുഭ ഉച്ചയ്ക്ക്', ge: 'ശുഭ സായാഹ്നം', gn: 'നമസ്കാരം',
      nice: 'ശുഭദിനം ആശംസിക്കുന്നു.', nice2: 'ശുഭ സായാഹ്നം ആശംസിക്കുന്നു.', iam: 'ഞാൻ എയർകാസ്റ്റ് ആണ്.', tell: 'നിങ്ങൾക്ക് എന്താണ് വേണ്ടതെന്ന് പറയൂ.',
      intro: 'എന്റെ പേരായ എയർകാസ്റ്റ് കേൾക്കാൻ നിങ്ങളുടെ ബ്രൗസർ സ്പീച്ച് സേവനം ഉപയോഗിക്കുന്നു.',
      langSwitched: 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.',
      opening: 'തുറക്കുന്നു',
      placeSwitched: 'മാറ്റി:',
      placeNotFound: 'ക്ഷമിക്കണം, ആ രാജ്യം, സംസ്ഥാനം അല്ലെങ്കിൽ നഗരം കണ്ടെത്താനായില്ല. ദയവായി മറ്റൊരു സ്ഥലം പറയൂ.'
    }
  };
  var SUPPORTED_LANGS = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];
  var EMERGENCY = /can'?t breathe|cannot breathe|difficulty breathing|trouble breathing|chest pain|heart attack|faint(?:ed|ing)?|unconscious|passed out|choking|asthma attack|सांस नहीं|सांस लेने में तकलीफ|सीने में दर्द|बेहोश|மூச்சு (?:விட|திணறல்)|நெஞ்சு வலி|மயக்கம்|శ్వాస|ఛాతీ నొప్పి|ಉಸಿರು|ಎದೆ ನೋವು|ശ്വാസം|നെഞ്ച് വേദന/i;
  var STOP = /^(?:stop|quiet|cancel|enough|be quiet|रुको|बस|चुप|நிறுத்து|ఆపు|నెమ్మదిగా|ನಿಲ್ಲಿಸು|നിർത്തുക)\b/i;
  var STOPLISTEN = /\b(?:stop listening|go to sleep|goodbye|good bye|turn off|switch off)\b|सुनना बंद|अलविदा|बंद करो|கேட்பதை நிறுத்து|వినడం ఆపు|ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸು|കേൾക്കുന്നത് നിർത്തുക/i;
  var CITY = /\b(?:change|set|switch|select|open|show|move|navigate|go|visit|pick|choose|update)\s+(?:me\s+)?(?:the\s+)?(?:(?:city|state|country|district|location|place|region|station)\s+)?(?:(?:to|into|of|as|for)\s+)?(.+)/i;
  var INDIC_PLACE_CMD = /(?:देश|राज्य|प्रदेश|शहर|जिला|स्थान|நகரம்|மாநிலம்|நாடு|மாவட்டம்|నగరం|రాష్ట్రం|దేశం|ನಗರ|ರಾಜ್ಯ|ದೇಶ|നഗരം|സംസ്ഥാനം|രാജ്യം|बदलो|बदलें|दिखाओ|करो|माற்று|காட்டு|మార్చు|ಬದಲಿಸಿ|മാറ്റുക)/;
  var NON_PLACE_CMD = /^(?:the\s+)?(?:forecast|health\s+advice|advice|air\s+quality|aqi|weather|mask|hospitals?|simulator|planner|page\s*\d+|help|details?|summary|chart|map|this\s+page)$/i;
  var PLACE_IN_Q = /\b(?:in|for|of|at|to|from)\s+([a-zA-Z\u0900-\u0D7F][a-zA-Z\u0900-\u0D7F\s,.\-&]{1,50})$/i;
  var LOCAL_INTENTS = { page1: 1, page2: 1, simulator: 1, planner: 1, help: 1 };

  var st = { mode: 'active', rec: null, busy: false, woke: false, lang: '', activeTimer: null, idleTimer: null, greeted: false, gestureArmed: false, resumeArmed: false, history: [] };
  var ui = {};
  var INTRO = 'aircast_assistant_intro';

  function normLang(code) {
    return String(code || '').toLowerCase().trim().split(/[-_]/)[0];
  }
  function langCode() {
    var l = '';
    try { if (typeof CFG.getLang === 'function') l = CFG.getLang() || ''; } catch (e) { /* ignore */ }
    if (!l) l = st.lang || '';
    if (!l) { try { l = localStorage.getItem('lang') || ''; } catch (e) { /* ignore */ } }
    var c = normLang(l || document.documentElement.lang || 'en');
    return c || 'en';
  }
  function locale() { return LOCALES[langCode()] || 'en-IN'; }
  function t(k) { var l = langCode(); return (STR[l] && STR[l][k]) || STR.en[k] || k; }
  function A() { return window.AirCastA11y || null; }

  function detectLangCommand(q) {
    var s = String(q || '').toLowerCase().trim();
    if (!/(?:language|speak|talk|switch|change|hindi|tamil|telugu|kannada|malayalam|english|हिन्दी|हिंदी|தமிழ்|తెలుగు|ಕನ್ನಡ|മലയാളം)/i.test(s)) return null;
    if (/(?:\bhindi\b|हिन्दी|हिंदी)/i.test(s)) return 'hi';
    if (/(?:\btamil\b|தமிழ்)/i.test(s)) return 'ta';
    if (/(?:\btelugu\b|తెలుగు)/i.test(s)) return 'te';
    if (/(?:\bkannada\b|ಕನ್ನಡ)/i.test(s)) return 'kn';
    if (/(?:\bmalayalam\b|മലയാളം)/i.test(s)) return 'ml';
    if (/(?:\benglish\b)/i.test(s)) return 'en';
    return null;
  }

  function applyLanguage(code, fromVoice) {
    var next = normLang(code);
    if (!next) return;
    if (SUPPORTED_LANGS.indexOf(next) === -1 && !LOCALES[next]) next = 'en';
    var prev = st.lang || langCode();
    st.lang = next;
    try { localStorage.setItem('lang', next); } catch (e) { /* ignore */ }
    document.documentElement.lang = next;
    if (typeof CFG.setLanguage === 'function') {
      var curApp = '';
      try { curApp = typeof CFG.getLang === 'function' ? normLang(CFG.getLang()) : ''; } catch (e) { curApp = ''; }
      if (curApp !== next) {
        try { CFG.setLanguage(next); } catch (e) { /* ignore */ }
      }
    }
    var a = A();
    if (a && a.refresh) { try { a.refresh(); } catch (e) { /* ignore */ } }
    if (prev !== next) {
      stopRec();
      if (fromVoice) {
        speak(t('langSwitched'), next);
      } else {
        if (st.mode === 'active') setStatus('stListen');
        else if (st.mode === 'standby') setStatus('stWait');
        if (st.mode !== 'off' && !(window.speechSynthesis && window.speechSynthesis.speaking)) {
          setTimeout(startRec, 120);
        }
      }
    }
  }

  /* ------------------------------- sounds -------------------------------- */
  var ac = null;
  function beep(freqs) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var now = ac.currentTime;
      freqs.forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, now + i * 0.14);
        g.gain.exponentialRampToValueAtTime(0.25, now + i * 0.14 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.12);
        o.start(now + i * 0.14); o.stop(now + i * 0.14 + 0.13);
      });
    } catch (e) { /* ignore */ }
  }

  /* ------------------------------ speaking ------------------------------- */
  function speak(text, lang) {
    if (!text) return;
    stopRec();
    setStatus('stSpeak');
    var a = A(), want = lang || langCode();
    if (a && a.speak && want === langCode()) a.speak(text);
    else if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      var u = new SpeechSynthesisUtterance(text); u.lang = LOCALES[want] || 'en-IN'; window.speechSynthesis.speak(u);
    }
    waitQuiet(resume);
  }
  function cancelSpeech() { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  function waitQuiet(cb) {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var speaking = 'speechSynthesis' in window && window.speechSynthesis.speaking;
      if (!speaking || tries > 450) { clearInterval(iv); setTimeout(cb, 120); }
    }, 100);
  }
  function clean(text) {
    var s = String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/https?:\/\/\S+/g, ' ')
      .replace(/[*#_`>|~]/g, ' ').replace(/\s+/g, ' ').trim();
    if (s.length > 700) { s = s.slice(0, 700); var i = Math.max(s.lastIndexOf('. '), s.lastIndexOf('। ')); if (i > 200) s = s.slice(0, i + 1); }
    return s;
  }

  /* ----------------------------- recognition ----------------------------- */
  function startRec() {
    if (st.mode === 'off' || st.rec) return true;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { st.mode = 'off'; return false; }
    var r = new SR();
    r.lang = locale(); r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
    r.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var res = e.results[i];
        if (!res.isFinal) {
          // Interim results arrive fast: react to the wake word immediately and keep the listening window open.
          if (st.mode === 'active') startActiveTimer(6);
          else if (st.mode === 'standby' && !st.woke && CFG.wake.test(res[0].transcript)) { st.woke = true; cancelSpeech(); beep([880, 1175]); }
          continue;
        }
        var already = st.woke; st.woke = false;
        var alts = [];
        for (var j = 0; j < res.length; j++) alts.push(res[j].transcript);
        heard(alts, already);
      }
    };
    r.onerror = function (ev) {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { goOff(); speak(t('denied')); }
    };
    r.onend = function () {
      st.rec = null;
      if (st.mode !== 'off' && !st.busy && !(window.speechSynthesis && window.speechSynthesis.speaking)) setTimeout(startRec, 200);
    };
    try { r.start(); st.rec = r; } catch (e) { st.rec = null; }
    return true;
  }
  function stopRec() {
    var r = st.rec; st.rec = null;
    if (r) { r.onend = null; r.onresult = null; try { r.abort(); } catch (e) { /* ignore */ } }
  }
  function stripWake(text) { return String(text || '').replace(CFG.wake, ' ').replace(/^[\s,.!?\-]+/, '').trim(); }

  function heard(alts, alreadyBeeped) {
    resetIdle();
    var text = alts[0] || '';
    var wakeAlt = alts.filter(function (a) { return CFG.wake.test(a); })[0];
    if (st.mode === 'standby') {
      if (!wakeAlt) return;
      if (!alreadyBeeped) { cancelSpeech(); beep([880, 1175]); }
      var rest = stripWake(wakeAlt);
      st.mode = 'active'; setStatus('stListen');
      if (rest.length > 2) process(rest); else startActiveTimer();
      return;
    }
    if (st.mode === 'active') {
      clearTimeout(st.activeTimer);
      var q = stripWake(wakeAlt || text);
      if (!q) { startActiveTimer(); return; }
      process(q);
    }
  }

  /* ------------------------------ listening modes ------------------------ */
  function openActive() {
    if (st.mode === 'off') return;
    st.mode = 'active'; st.busy = false;
    setStatus('stListen'); startRec(); startActiveTimer();
  }
  function startActiveTimer(sec) {
    clearTimeout(st.activeTimer);
    st.activeTimer = setTimeout(toStandby, (sec || CFG.activeSeconds) * 1000);
  }
  function toStandby() { if (st.mode !== 'active') return; st.mode = 'standby'; setStatus('stWait'); startRec(); }
  function resume() { if (st.mode !== 'off') openActive(); }
  function resetIdle() {
    clearTimeout(st.idleTimer);
    if (!CFG.idleMinutes) return;
    st.idleTimer = setTimeout(function () { if (st.mode === 'standby') goOff(); else resetIdle(); }, CFG.idleMinutes * 60000);
  }

  /* ------------------------------ understanding -------------------------- */
  function formatSwitchedReply(res, fallbackName) {
    if (!res) return t('placeNotFound');
    var hierarchy = [];
    if (res.city) hierarchy.push(res.city);
    if (res.state && res.state !== res.city) hierarchy.push(res.state);
    if (res.country) hierarchy.push(res.country);
    var label = hierarchy.length ? hierarchy.join(', ') : (fallbackName || '');
    var prefix = t('placeSwitched') + ' ' + label + '. ';
    return prefix + (res.summary || '');
  }
  function extractPlaceCommand(q) {
    var m = q.match(CITY);
    if (m && m[1]) {
      var cand = m[1].replace(/[.,!?]+$/, '').trim();
      if (cand && !NON_PLACE_CMD.test(cand)) return cand;
    }
    if (INDIC_PLACE_CMD.test(q)) {
      return q.replace(/[.,!?]+$/, '').trim();
    }
    var directRole = q.match(/^(?:country|state|city|district|location)\s+(?:is\s+|to\s+)?(.+)/i);
    if (directRole && directRole[1]) {
      return directRole[1].replace(/[.,!?]+$/, '').trim();
    }
    return '';
  }
  function process(q) {
    q = (q || '').trim();
    if (!q) return;
    if (STOPLISTEN.test(q)) { goOff(); return; }
    if (STOP.test(q)) { cancelSpeech(); startActiveTimer(); return; }
    var a = A();
    if (EMERGENCY.test(q)) {
      if (a && a.announce) a.announce(t('emergency'), 'severe'); else speak(t('emergency'));
      stopRec(); waitQuiet(resume);
      return;
    }
    var targetLang = detectLangCommand(q);
    if (targetLang) {
      applyLanguage(targetLang, true);
      return;
    }
    var id = a && a.intent ? a.intent(q) : null;
    var short = q.split(/\s+/).length <= 5;
    if (a && id && LOCAL_INTENTS[id] && short) { stopRec(); a.command(q); waitQuiet(resume); return; }
    var targetPlace = extractPlaceCommand(q);
    if (targetPlace) {
      if (typeof CFG.onSelectPlace === 'function') {
        var res = CFG.onSelectPlace(targetPlace);
        if (res && res.found) {
          var reply = formatSwitchedReply(res, targetPlace);
          st.history.push({ q: q, a: reply });
          speak(reply, langCode());
          return;
        }
        // Only treat missing match as notFound if user gave an explicit change/switch/country/state/city command
        if (/\b(?:change|switch|set|select|country|state|city|district|location)\b|देश|राज्य|शहर|बदलो|நாடு|மாநிலம்|நகரம்|மாற்று|దేశం|రాష్ట్రం|నగరం|మార్చు|ದೇಶ|ರಾಜ್ಯ|ನಗರ|ಬದಲಿಸಿ|രാജ്യം|സംസ്ഥാനം|നഗരം|മാറ്റുക/i.test(q)) {
          speak(t('placeNotFound'), langCode());
          return;
        }
      } else if (a) {
        stopRec(); a.command('change city to ' + targetPlace); waitQuiet(resume); return;
      }
    }
    if (CFG.ask) { ask(q); return; }
    answerLocally(q);
  }

  /* ---------------------- built-in answer engine (no AI) ------------------ */
  var ADV = {
    en: {
      good: 'The air is good. Outdoor activity is fine for everyone.',
      satisfactory: 'The air is acceptable. Very sensitive people should take it easy on long outdoor exertion.',
      moderate: 'People with asthma, heart or lung conditions, children and older adults should reduce long or hard outdoor exercise.',
      poor: 'Everyone should reduce hard outdoor exercise. Sensitive people should stay indoors if possible. A well-fitted N95 mask helps outdoors.',
      veryPoor: 'Avoid outdoor exercise. Stay indoors with windows closed, and wear a well-fitted N95 mask if you must go out.',
      severe: 'Stay indoors with windows closed and avoid all outdoor activity. If you have trouble breathing, call 108.'
    },
    hi: {
      good: 'हवा अच्छी है। सभी के लिए बाहर गतिविधि ठीक है।',
      satisfactory: 'हवा संतोषजनक है। बहुत संवेदनशील लोग लंबे समय तक कठिन परिश्रम से बचें।',
      moderate: 'दमा, हृदय या फेफड़ों की समस्या वाले लोग, बच्चे और बुज़ुर्ग बाहर लंबा या कठिन व्यायाम कम करें।',
      poor: 'सभी बाहर कठिन व्यायाम कम करें। संवेदनशील लोग हो सके तो घर के अंदर रहें। बाहर सही फिट वाला N95 मास्क मदद करता है।',
      veryPoor: 'बाहर व्यायाम न करें। खिड़कियां बंद करके घर के अंदर रहें, ज़रूरी हो तो सही फिट वाला N95 मास्क पहनकर निकलें।',
      severe: 'घर के अंदर खिड़कियां बंद रखें और बाहर की सभी गतिविधि से बचें। सांस लेने में तकलीफ हो तो 108 पर कॉल करें।'
    },
    ta: {
      good: 'காற்று நன்றாக உள்ளது. அனைவரும் வெளியே செயல்படலாம்.',
      satisfactory: 'காற்றின் தரம் திருப்திகரம். மிகவும் உணர்திறன் உள்ளவர்கள் நீண்ட கடின உழைப்பைத் தவிர்க்கவும்.',
      moderate: 'ஆஸ்துமா, இதயம் அல்லது நுரையீரல் பிரச்சினை உள்ளவர்கள், குழந்தைகள் மற்றும் முதியவர்கள் வெளியே நீண்ட அல்லது கடினமான உடற்பயிற்சியைக் குறைக்கவும்.',
      poor: 'அனைவரும் வெளியே கடினமான உடற்பயிற்சியைக் குறைக்கவும். உணர்திறன் உள்ளவர்கள் முடிந்தால் வீட்டிற்குள் இருக்கவும். வெளியே சரியாகப் பொருந்தும் N95 முகக்கவசம் உதவும்.',
      veryPoor: 'வெளியே உடற்பயிற்சி வேண்டாம். ஜன்னல்களை மூடி வீட்டிற்குள் இருங்கள்; வெளியே செல்ல வேண்டுமெனில் சரியாகப் பொருந்தும் N95 முகக்கவசம் அணியுங்கள்.',
      severe: 'ஜன்னல்களை மூடி வீட்டிற்குள் இருங்கள்; வெளிப்புற செயல்களைத் தவிர்க்கவும். மூச்சுத் திணறல் இருந்தால் 108 ஐ அழைக்கவும்.'
    },
    te: {
      good: 'గాలి చాలా బాగుంది. అందరూ బయట కార్యకలాపాలు చేసుకోవచ్చు.',
      satisfactory: 'గాలి నాణ్యత సంతృప్తికరంగా ఉంది. చాలా సున్నితమైన వారు ఎక్కువ సేపు కఠిన శ్రమ తగ్గించాలి.',
      moderate: 'ఆస్తమా, గుండె లేదా ఊపిరితిత్తుల సమస్యలు ఉన్నవారు, పిల్లలు మరియు వృద్ధులు బయట ఎక్కువ సమయం వ్యాయామం తగ్గించండి.',
      poor: 'అందరూ బయట కఠిన వ్యాయామాలు తగ్గించండి. సున్నితమైన వారు ఇంట్లోనే ఉండండి. బయటకు వెళితే N95 మాస్క్ ధరించండి.',
      veryPoor: 'బయట వ్యాయామం చేయకండి. కిటికీలు మూసి ఇంట్లోనే ఉండండి; బయటకు వెళ్లాల్సి వస్తే N95 మాస్క్ తప్పక ధరించండి.',
      severe: 'కిటికీలు మూసి ఇంట్లోనే ఉండండి. శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంటే 108కు కాల్ చేయండి.'
    },
    kn: {
      good: 'ಗಾಳಿ ಉತ್ತಮವಾಗಿದೆ. ಎಲ್ಲರೂ ಹೊರಗೆ ಹೋಗಬಹುದು.',
      satisfactory: 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ ತೃಪ್ತಿಕರವಾಗಿದೆ. ತುಂಬಾ ಸೂಕ್ಷ್ಮ ಆರೋಗ್ಯದವರು ದೀರ್ಘಕಾಲ ಶ್ರಮದ ಕೆಲಸವನ್ನು ಕಡಿಮೆ ಮಾಡಬೇಕು.',
      moderate: 'ಅಸ್ತಮಾ, ಹೃದಯ ಅಥವಾ ಶ್ವಾಸಕೋಶದ ಸಮಸ್ಯೆ ಇರುವವರು, ಮಕ್ಕಳು ಮತ್ತು ಹಿರಿಯರು ಹೊರಗೆ ದೀರ್ಘ ವ್ಯಾಯಾಮವನ್ನು ಕಡಿಮೆ ಮಾಡಿ.',
      poor: 'ಎಲ್ಲರೂ ಹೊರಗೆ ಕಠಿಣ ವ್ಯಾಯಾಮವನ್ನು ಕಡಿಮೆ ಮಾಡಿ. ಸೂಕ್ಷ್ಮ ವ್ಯಕ್ತಿಗಳು ಒಳಗೆ ಇರಿ. ಹೊರಗೆ N95 ಮಾಸ್ಕ್ ಧರಿಸಿ.',
      veryPoor: 'ಹೊರಗೆ ವ್ಯಾಯಾಮ ಮಾಡಬೇಡಿ. ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿ ಒಳಗೆ ಇರಿ; ಹೊರಗೆ ಹೋಗಲೇಬೇಕಾದರೆ N95 ಮಾಸ್ಕ್ ಧರಿಸಿ.',
      severe: 'ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿ ಒಳಗೆ ಇರಿ. ಉಸಿರಾಡಲು ತೊಂದರೆಯಾದರೆ 108ಕ್ಕೆ ಕರೆ ಮಾಡಿ.'
    },
    ml: {
      good: 'വായു നല്ലതാണ്. എല്ലാവർക്കും പുറത്തിറങ്ങാം.',
      satisfactory: 'വായു ഗുണനിലവാരം തൃപ്തികരമാണ്. കൂടുതൽ സംവേദനക്ഷമതയുള്ളവർ കഠിനമായ പുറം ജോലികൾ കുറയ്ക്കുക.',
      moderate: 'ആസ്ത്മ, ഹൃദയ അല്ലെങ്കിൽ ശ്വാസകോശ പ്രശ്നങ്ങൾ ഉള്ളവർ, കുട്ടികൾ, പ്രായമായവർ എന്നിവർ പുറത്തെ വ്യായാമം കുറയ്ക്കുക.',
      poor: 'എല്ലാവരും പുറത്തെ കഠിന വ്യായാമം കുറയ്ക്കുക. സംവേദനക്ഷമതയുള്ളവർ വീടിനുള്ളിൽ ഇരിക്കുക. പുറത്ത് N95 മാസ്ക് ധരിക്കുക.',
      veryPoor: 'പുറത്ത് വ്യായാമം ഒഴിവാക്കുക. ജനലുകൾ അടച്ച് വീടിനുള്ളിൽ തുടരുക; പുറത്തിറങ്ങണമെങ്കിൽ N95 മാസ്ക് ധരിക്കുക.',
      severe: 'ജനലുകൾ അടച്ച് വീടിനുള്ളിൽ തുടരുക. ശ്വാസതടസ്സം ഉണ്ടെങ്കിൽ 108-ൽ വിളിക്കുക.'
    }
  };
  var MASK = {
    en: 'A well-fitted N95 or FFP2 respirator filters fine particles. Cloth or surgical masks do not filter them well. Wear one outdoors when the air is poor or worse.',
    hi: 'सही फिट वाला N95 या FFP2 मास्क महीन कणों को रोकता है। कपड़े या सर्जिकल मास्क इन्हें अच्छी तरह नहीं रोकते। हवा खराब हो तो बाहर इसे पहनें।',
    ta: 'சரியாகப் பொருந்தும் N95 அல்லது FFP2 முகக்கவசம் நுண்துகள்களை வடிகட்டும். துணி அல்லது அறுவை சிகிச்சை முகக்கவசங்கள் அவற்றை நன்றாக வடிகட்டாது. காற்று மோசமாக இருந்தால் வெளியே அணியுங்கள்.',
    te: 'సరిగ్గా అమరే N95 లేదా FFP2 మాస్క్ సూక్ష్మ కణాలను ఆపుతుంది. గాలి నాణ్యత తక్కువగా ఉన్నప్పుడు బయట దీన్ని ధరించండి.',
    kn: 'ಸರಿಯಾಗಿ ಹೊಂದಿಕೊಳ್ಳುವ N95 ಅಥವಾ FFP2 ಮಾಸ್ಕ್ ಸೂಕ್ಷ್ಮ ಕಣಗಳನ್ನು ತಡೆಯುತ್ತದೆ. ಗಾಳಿ ಕಳಪೆಯಾಗಿದ್ದಾಗ ಹೊರಗೆ ಇದನ್ನು ಧರಿಸಿ.',
    ml: 'നന്നായി യോജിക്കുന്ന N95 അല്ലെങ്കിൽ FFP2 മാസ്ക് സൂക്ഷ്മ കണങ്ങളെ തടയും. വായു മോശമാകുമ്പോൾ പുറത്ത് ഇത് ധരിക്കുക.'
  };
  var FALLBACK = {
    en: 'I can tell you the air quality now, whether it is safe to go outside, masks, the best time outdoors, and the forecast. You can also say page 1, page 2, simulator or planner.',
    hi: 'मैं अभी की वायु गुणवत्ता, बाहर जाना सुरक्षित है या नहीं, मास्क, बाहर का सबसे अच्छा समय और पूर्वानुमान बता सकता हूँ। आप पेज 1, पेज 2, सिम्युलेटर या योजना भी बोल सकते हैं।',
    ta: 'தற்போதைய காற்றுத் தரம், வெளியே செல்வது பாதுகாப்பானதா, முகக்கவசம், வெளியே செல்ல சிறந்த நேரம், முன்னறிவிப்பு ஆகியவற்றைச் சொல்ல முடியும். பக்கம் 1, பக்கம் 2, சிமுலேட்டர் அல்லது திட்டம் என்றும் சொல்லலாம்.',
    te: 'ప్రస్తుత గాలి నాణ్యత, బయటకు వెళ్లడం సురక్షితమా, మాస్క్, బయటకు వెళ్లడానికి ఉత్తమ సమయం మరియు సూచన గురించి నేను చెప్పగలను.',
    kn: 'ಪ್ರಸ್ತುತ ಗಾಳಿಯ ಗುಣಮಟ್ಟ, ಹೊರಗೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ, ಮಾಸ್ಕ್, ಉತ್ತಮ ಸಮಯ ಮತ್ತು ಮುನ್ಸೂಚನೆಯನ್ನು ನಾನು ಹೇಳಬಲ್ಲೆ.',
    ml: 'ഇപ്പോഴത്തെ വായു ഗുണനിലവാരം, പുറത്തുപോകുന്നത് സുരക്ഷിതമാണോ, മാസ്ക്, ഏറ്റവും നല്ല സമയം, പ്രവചനം എന്നിവ എനിക്ക് പറയാൻ കഴിയും.'
  };
  function levelOf(a) { return a <= 50 ? 'good' : a <= 100 ? 'satisfactory' : a <= 200 ? 'moderate' : a <= 300 ? 'poor' : a <= 400 ? 'veryPoor' : 'severe'; }
  function pick(tbl, l) { return tbl[l] ? { text: tbl[l], lang: l } : { text: tbl.en, lang: 'en' }; }

  function localAnswer(q, ctx) {
    var l = langCode(), a = A(), s = (a && a.status && a.status()) || {};
    var aqi = ctx.aqi != null ? Number(ctx.aqi) : s.aqi;
    var city = ctx.city || s.place || '';
    var have = typeof aqi === 'number' && !isNaN(aqi);
    var lvl = have ? levelOf(aqi) : null;
    function en(text) { return { text: text, lang: 'en' }; }
    function advice() { var tbl = ADV[l] || ADV.en, lg = ADV[l] ? l : 'en'; return { text: tbl[lvl], lang: lg }; }
    var noData = en('Air quality data is not loaded yet. Please select a city first.');
    var x = q.toLowerCase();

    if (/what is (?:the )?(?:aqi|air quality index|pm ?2\.?5)/.test(x))
      return en('The air quality index is a number showing how clean or polluted the air is. Higher means worse. PM2.5 is fine dust small enough to reach deep into the lungs.');
    if (/hospital|clinic|doctor|अस्पताल|மருத்துவமனை|ఆసుపత్రి|ಆಸ್ಪತ್ರೆ|ആശുപത്രി/.test(x))
      return en('Say page 2 and open the clean-air hospitals section. In an emergency, call 108.');
    if (/mask|n95|मास्क|முகக்கவசம்|మాస్క్|ಮಾಸ್ಕ್|മാസ്ക്/.test(x)) { return pick(MASK, l); }
    if (/child|kid|baby|old age|elder|asthma|copd|pregnan|बच्च|बुज़ुर्ग|दमा|குழந்தை|ஆஸ்துமா|పిల్లలు|ఆస్తమా|ಮಕ್ಕಳು|ಅಸ್ತಮಾ|കുട്ടികൾ|ആസ്ത്മ/.test(x))
      return have ? (function () { var r = advice(); if (r.lang === 'en') r.text += ' Keep any reliever medicine your doctor prescribed within reach.'; return r; })() : noData;
    if (/window|indoor|ventilat|खिड़की|ஜன்னல்|కిటికీ|ಕಿಟಕಿ|ജനൽ/.test(x))
      return en('Keep windows closed when the air is poor or worse, and open them when it improves, usually around midday.');
    if (/best (?:time|hour)|cleanest|when (?:should|can|is).*(?:go|walk|run|outside|exercise)|सबसे अच्छा समय|சிறந்த நேரம்|ఉత్తమ సమయం|ಉತ್ತಮ ಸಮಯ|മികച്ച സമയം/.test(x))
      return ctx.bestHour ? en('The cleanest hour today is around ' + ctx.bestHour + '.' + (ctx.worstHour ? ' The worst is around ' + ctx.worstHour + '.' : '')) : en('I do not have the best hour yet. Open the hourly forecast on page 1.');
    if (/forecast|tomorrow|tonight|later|next|पूर्वानुमान|कल|முன்னறிவிப்பு|సూచన|ಮುನ್ಸೂಚನೆ|പ്രവചനം/.test(x))
      return en(ctx.forecast || 'The forecast summary is not available yet. Open the hourly forecast on page 1.');
    if (/\bwhy\b|reason|cause|क्यों|ஏன்|ఎందుకు|ಏಕೆ|എന്തുകൊണ്ട്/.test(x))
      return ctx.topDriver ? en('The biggest factor right now is ' + ctx.topDriver + '.') : en('I do not have the main cause yet. Open the explanation chart on page 2.');
    if (/temperature|how hot|तापमान|வெப்பநிலை|ఉష్ణోగ్రత|ತಾಪಮಾನ|താപനില/.test(x) && ctx.temp != null) return en('The temperature is ' + ctx.temp + ' degrees Celsius.');
    if (/wind|हवा की गति|காற்றின் வேகம்|గాలి వేగం|ಗಾಳಿಯ ವೇಗ|കാറ്റിന്റെ വേഗത/.test(x) && ctx.wind != null) return en('Wind speed is ' + ctx.wind + ' kilometres per hour.');
    if (/humid|नमी|ஈரப்பதம்|తేమ|ಆರ್ದ್ರತೆ|ഈർപ്പം/.test(x) && ctx.humidity != null) return en('Humidity is ' + ctx.humidity + ' percent.');
    if (/safe|go out|outside|walk|run|jog|exercise|play|cycle|bike|market|बाहर|टहल|दौड़|வெளியே|நடை|బయట|ಹೊರಗೆ|പുറത്ത്/.test(x))
      return have ? advice() : noData;
    if (/air quality|aqi|how(?:'s| is) the air|pollution|वायु|हवा|प्रदूषण|காற்று|గాలి|ಗಾಳಿ|വായു/.test(x)) {
      if (!have) return noData;
      var cat = ctx.category || '';
      if (l === 'hi') return { text: (city ? city + ' में ' : '') + 'वायु गुणवत्ता सूचकांक ' + aqi + ' है' + (cat ? ', जो ' + cat + ' है।' : '।'), lang: 'hi' };
      if (l === 'ta') return { text: (city ? city + '-ல் ' : '') + 'காற்றுத் தரக் குறியீடு ' + aqi + (cat ? ', இது ' + cat + '.' : '.'), lang: 'ta' };
      if (l === 'te') return { text: (city ? city + 'లో ' : '') + 'గాలి నాణ్యత సూచిక ' + aqi + (cat ? ', ఇది ' + cat + '.' : '.'), lang: 'te' };
      if (l === 'kn') return { text: (city ? city + 'ನಲ್ಲಿ ' : '') + 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ ' + aqi + (cat ? ', ಇದು ' + cat + '.' : '.'), lang: 'kn' };
      if (l === 'ml') return { text: (city ? city + '-ൽ ' : '') + 'വായു ഗുണനിലവാര സൂചിക ' + aqi + (cat ? ', ഇത് ' + cat + '.' : '.'), lang: 'ml' };
      return en((city ? 'In ' + city + ', the' : 'The') + ' air quality index is ' + aqi + (cat ? ', which is ' + cat : '') + '.' + (ctx.pm25 != null ? ' PM2.5 is ' + ctx.pm25 + ' micrograms per cubic metre.' : ''));
    }
    return pick(FALLBACK, l);
  }
  function answerLocally(q) {
    var ctx = {};
    try { ctx = (CFG.getContext && CFG.getContext()) || {}; } catch (e) { ctx = {}; }

    // If the user mentioned any city, state, or country in their question (e.g. "air quality in Tamil Nadu",
    // "how is Japan", or just "Kerala"), switch to that place and answer with its live data immediately.
    if (typeof CFG.onSelectPlace === 'function') {
      var inMatch = q.match(PLACE_IN_Q);
      var candidate = (inMatch ? inMatch[1] : q).replace(/[.,!?]+$/, '').trim();
      var switched = candidate ? CFG.onSelectPlace(candidate) : null;
      if (!switched || !switched.found) {
        switched = CFG.onSelectPlace(q.trim());
      }
      if (switched && switched.found) {
        if (switched.context) ctx = switched.context;
        var isQuestionWord = /forecast|tomorrow|tonight|mask|n95|safe|outside|walk|run|why|reason|cause|temp|wind|humid|hospital|doctor|best|cleanest|window|indoor|child|asthma/i.test(q);
        if (!isQuestionWord && switched.summary) {
          var reply = formatSwitchedReply(switched, candidate);
          st.history.push({ q: q, a: reply });
          speak(reply, langCode());
          return;
        }
      }
    }

    var r = localAnswer(q, ctx);
    st.history.push({ q: q, a: r.text });
    speak(r.text, r.lang);
  }

  function ask(q) {
    st.busy = true; stopRec(); setStatus('stThink'); beep([440]);
    var ctx = {};
    try { ctx = (CFG.getContext && CFG.getContext()) || {}; } catch (e) { ctx = {}; }
    ctx.language = langCode();
    var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 25000); });
    Promise.race([Promise.resolve(CFG.ask(q, ctx, st.history.slice(-6))), timeout])
      .then(function (ans) {
        var out = clean(ans);
        if (!out) throw new Error('empty');
        st.history.push({ q: q, a: out });
        st.busy = false; speak(out);
      })
      .catch(function () { st.busy = false; speak(t('error')); });
  }

  /* --------------------------- off / tap to resume ----------------------- */
  function goOff() {
    st.mode = 'off'; stopRec(); cancelSpeech();
    clearTimeout(st.activeTimer); clearTimeout(st.idleTimer);
    setStatus('stOff'); beep([520, 390]);
    armResume();
  }
  function armResume() {
    if (st.resumeArmed) return;
    st.resumeArmed = true;
    var go = function () {
      document.removeEventListener('pointerdown', go, true); document.removeEventListener('keydown', go, true);
      st.resumeArmed = false;
      if (st.mode !== 'off') return;
      beep([880]); resetIdle(); openActive();
    };
    setTimeout(function () { document.addEventListener('pointerdown', go, true); document.addEventListener('keydown', go, true); }, 600);
  }

  /* -------------------------------- greeting ----------------------------- */
  function seenIntro() { try { return localStorage.getItem(INTRO) === '1'; } catch (e) { return false; } }
  function markIntro() { try { localStorage.setItem(INTRO, '1'); } catch (e) { /* ignore */ } }
  function greetText(first) {
    var h = new Date().getHours();
    var part = h >= 5 && h < 12 ? 'gm' : h < 17 && h >= 12 ? 'ga' : h >= 17 && h < 21 ? 'ge' : 'gn';
    var nice = (part === 'ge' || part === 'gn') ? t('nice2') : t('nice');
    return t(part) + '! ' + nice + ' ' + t('iam') + ' ' + t('tell') + (first ? ' ' + t('intro') : '');
  }
  function armGreetGesture() {
    if (st.gestureArmed || st.greeted) return;
    st.gestureArmed = true;
    var evs = ['pointerdown', 'keydown', 'touchstart', 'click'];
    var go = function () {
      evs.forEach(function (ev) { document.removeEventListener(ev, go, true); });
      st.gestureArmed = false; greet();
    };
    evs.forEach(function (ev) { document.addEventListener(ev, go, true); });
  }
  function greet() {
    if (st.greeted) return;
    if (!('speechSynthesis' in window)) { st.greeted = true; resume(); return; }
    var text = greetText(!seenIntro()), started = false;
    var a = A(); if (a && a.caption) a.caption(text);
    var u = new SpeechSynthesisUtterance(text);
    u.lang = locale();
    u.onstart = function () { started = true; st.greeted = true; markIntro(); setStatus('stSpeak'); };
    u.onend = function () { if (started) waitQuiet(resume); };
    u.onerror = function () { if (!started) armGreetGesture(); };
    try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) { armGreetGesture(); return; }
    // If the browser blocked sound (no tap yet), wait for the first tap, key press or screen-reader touch.
    setTimeout(function () {
      if (!started && !st.greeted) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } armGreetGesture(); }
    }, 2500);
  }

  /* --------------------------------- UI ---------------------------------- */
  function setStatus(key) {
    if (!ui.pill) return;
    var show = CFG.showStatus && (key === 'stListen' || key === 'stThink' || key === 'stSpeak');
    ui.pill.style.display = show ? 'block' : 'none';
    ui.pill.classList.toggle('av-listening', key === 'stListen');
    if (show) ui.pill.textContent = t(key);
  }
  function init() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var s = document.createElement('style');
    s.textContent =
      '.av-pill{position:fixed;left:50%;transform:translateX(-50%);top:8px;z-index:99970;background:#0f172a;color:#fff;border:2px solid #fff;border-radius:999px;padding:6px 14px;font:700 13px system-ui,sans-serif;display:none;pointer-events:none}' +
      '@keyframes avPillHaptic{0%,100%{transform:translateX(-50%) scale(1.04)}25%{transform:translateX(calc(-50% - 1.5px)) scale(1.07)}50%{transform:translateX(calc(-50% + 1.5px)) scale(1.05)}75%{transform:translateX(calc(-50% - 1px)) scale(1.08)}}' +
      '.av-pill.av-listening{animation:avPillHaptic 0.42s cubic-bezier(.36,.07,.19,.97) infinite;background:#be123c}';
    document.head.appendChild(s);
    ui.pill = document.createElement('div'); ui.pill.className = 'av-pill'; ui.pill.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ui.pill);
    if (!SR) { st.mode = 'off'; return; }   // no voice support: stay silent, nothing to start
    document.addEventListener('keydown', function (e) {
      if (e.altKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) { if (st.mode === 'off') { beep([880]); openActive(); } else goOff(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stopRec(); cancelSpeech(); }
      else if (st.mode !== 'off' && st.greeted) { if (st.mode === 'active') openActive(); else startRec(); }
    });
    if (CFG.greet === false) { st.greeted = true; st.mode = 'standby'; startRec(); resetIdle(); }
    else { resetIdle(); setTimeout(greet, CFG.greetDelayMs); }
  }

  window.AirCastAssistant = {
    configure: function (o) {
      Object.keys(o || {}).forEach(function (k) { CFG[k] = o[k]; });
      if (typeof CFG.getLang === 'function') {
        var cur = normLang(CFG.getLang());
        if (cur && cur !== st.lang) {
          st.lang = cur;
        }
      }
    },
    getLang: langCode,
    setLanguage: function (code) { applyLanguage(code, false); },
    start: function () { if (st.mode === 'off') { beep([880]); openActive(); } },
    stop: goOff,
    ask: function (q) { if (st.mode === 'off') st.mode = 'active'; process(q); },
    getAnswer: function (q) {
      var ctx = {};
      try { ctx = (CFG.getContext && CFG.getContext()) || {}; } catch (e) { ctx = {}; }
      var raw = String(q || '').trim();
      if (typeof CFG.onSelectPlace === 'function') {
        var explicitPlace = extractPlaceCommand(raw);
        var inMatch = raw.match(PLACE_IN_Q);
        var candidate = (explicitPlace || (inMatch ? inMatch[1] : raw)).replace(/[.,!?]+$/, '').trim();
        var switched = candidate ? CFG.onSelectPlace(candidate) : null;
        if (!switched || !switched.found) {
          switched = CFG.onSelectPlace(raw);
        }
        if (switched && switched.found) {
          if (switched.context) ctx = switched.context;
          var isQ = /forecast|tomorrow|tonight|mask|n95|safe|outside|walk|run|why|reason|cause|temp|wind|humid|hospital|doctor|best|cleanest|window|indoor|child|asthma/i.test(raw);
          if (!isQ && switched.summary) return formatSwitchedReply(switched, candidate);
        }
      }
      var r = localAnswer(raw, ctx);
      return (r && r.text) || '';
    },
    greet: function () { st.greeted = false; greet(); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
