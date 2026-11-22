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
  var CITY_RE = /(?:change city to|city|शहर बदलो|शहर|நகரம்)\s+(.+)/i;

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
  function locale() { var l = langCode(); return STR[l] ? (LOCALES[l] || 'en-IN') : 'en-IN'; }
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
      '.a11y-mic.on{display:block}.a11y-mic.live{background:#dc2626}',
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
    var tr = el('div', 'a11y-row');
    var tb = el('button', 'a11y-btn', '🔔 ' + t('testAlert'));
    tb.addEventListener('click', function () { window.AirCastA11y.announce('Test: severe air quality alert at 22:00. Stay indoors.', 'severe'); });
    var sb = el('button', 'a11y-btn', '🤟 ' + t('testSign'));
    sb.addEventListener('click', function () { setOption('sign', true); showSign('emergency', 'Test: emergency'); });
    tr.appendChild(tb); tr.appendChild(sb);
    els.panel.appendChild(tr);
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

  function setAqi(aqi, place) {
    if (typeof aqi !== 'number' || isNaN(aqi)) return;
    var level = levelFromAqi(aqi);
    var rose = lastLevel && RANK[level] > RANK[lastLevel] && RANK[level] >= 4;
    lastAqi = aqi; lastPlace = place || lastPlace;
    var changed = level !== lastLevel;
    lastLevel = level;
    if (changed && state.sign) showSign(level, statusText());
    if (rose) announce(statusText(), 'severe');
  }

  /* --------------------------- sign-language panel ----------------------- */
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
    els.signMsg = el('div'); els.signMsg.style.cssText = 'padding:6px 2px;min-height:40px';
    var bar = el('div', 'bar');
    var play = el('button', null, '▶/⏸'); play.setAttribute('aria-label', t('play') + ' / ' + t('pause'));
    play.addEventListener('click', function () { if (els.video.paused) els.video.play(); else els.video.pause(); });
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
    var url = levelKey && CONFIG.signClips[levelKey];
    var seq = levelKey && CONFIG.signSequences[levelKey];
    els.signMsg.textContent = caption || '';
    els.chips.innerHTML = '';
    els.video.onended = null; els.video.onerror = null;
    if (url) {
      els.video.style.display = 'block';
      if (els.video.getAttribute('src') !== url) els.video.src = url;
      els.video.playbackRate = signSpeeds[signSpeedIdx];
      var p = els.video.play(); if (p && p.catch) p.catch(function () { /* autoplay blocked: user taps play */ });
      return;
    }
    if (seq && seq.length) { playSequence(seq, caption, seqId); return; }
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
      if (!u) { setTimeout(next, 1200); return; }
      els.video.style.display = 'block';
      els.video.onended = next; els.video.onerror = next;
      els.video.src = u;
      els.video.playbackRate = signSpeeds[signSpeedIdx];
      var p = els.video.play(); if (p && p.catch) p.catch(function () { /* user taps play */ });
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
    var input = (CONFIG.selectors.searchInput && document.querySelector(CONFIG.selectors.searchInput)) ||
      document.querySelector('input[type=search]') ||
      Array.prototype.filter.call(document.querySelectorAll('input[type=text],input:not([type])'), function (i) { return /search|city|शहर|நகர/i.test(i.placeholder || ''); })[0];
    if (!input) return false;
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, city.replace(/[.,!?]+$/, '').trim());
    input.dispatchEvent(new Event('input', { bubbles: true }));
    var btn = CONFIG.selectors.searchButton && document.querySelector(CONFIG.selectors.searchButton);
    if (btn) { btn.click(); return true; }
    return clickByText(/^(find|search|खोज|தேடு)/i);
  }

  function handleCommand(raw) {
    var text = (raw || '').trim();
    if (!text) { speak(t('notFound')); return; }
    var city = text.match(CITY_RE);
    if (city && city[1]) { speak(t('opening') + ' ' + city[1]); if (!setCity(city[1])) speak(t('notFound')); return; }
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
      btn: 'Communication', title: 'Communication mode', type: 'Type a command', send: 'Send',
      placeholder: 'e.g. read air quality, page 2, change city to Chennai',
      quick: 'Quick actions', phrases: 'Phrase board', add: 'Add your own phrase', addBtn: 'Add',
      speak: 'Speak', show: 'Show', close: 'Close', tapClose: 'Tap anywhere to close',
      qRead: 'Air quality now', qForecast: 'Forecast', qAdvice: 'Health advice',
      qP1: 'Page 1', qP2: 'Page 2', qSim: 'Simulator', qPlan: 'Planner',
      p1: 'I cannot speak. Please read this screen.',
      p2: 'I am deaf. Please write or type your message.',
      p3: 'I need medical help. Please call 108.',
      p4: 'The air is unsafe here. I need to go indoors.',
      p5: 'Please help me find a clean-air hospital nearby.'
    },
    hi: {
      btn: 'संवाद', title: 'संवाद मोड', type: 'कमांड टाइप करें', send: 'भेजें',
      placeholder: 'जैसे: वायु गुणवत्ता पढ़ो, पेज 2, शहर बदलो चेन्नई',
      quick: 'त्वरित क्रियाएं', phrases: 'वाक्य बोर्ड', add: 'अपना वाक्य जोड़ें', addBtn: 'जोड़ें',
      speak: 'बोलें', show: 'दिखाएं', close: 'बंद करें', tapClose: 'बंद करने के लिए कहीं भी टैप करें',
      qRead: 'अभी की वायु गुणवत्ता', qForecast: 'पूर्वानुमान', qAdvice: 'स्वास्थ्य सलाह',
      qP1: 'पेज 1', qP2: 'पेज 2', qSim: 'सिम्युलेटर', qPlan: 'योजना',
      p1: 'मैं बोल नहीं सकता/सकती। कृपया यह स्क्रीन पढ़ें।',
      p2: 'मैं सुन नहीं सकता/सकती। कृपया लिखकर बताएं।',
      p3: 'मुझे चिकित्सा सहायता चाहिए। कृपया 108 पर कॉल करें।',
      p4: 'यहाँ की हवा असुरक्षित है। मुझे अंदर जाना है।',
      p5: 'कृपया पास में साफ़ हवा वाला अस्पताल खोजने में मदद करें।'
    },
    ta: {
      btn: 'தொடர்பு', title: 'தொடர்பு பயன்முறை', type: 'கட்டளையை தட்டச்சு செய்யுங்கள்', send: 'அனுப்பு',
      placeholder: 'எ.கா: காற்றின் தரத்தைப் படி, பக்கம் 2, நகரம் சென்னை',
      quick: 'விரைவு செயல்கள்', phrases: 'சொற்றொடர் பலகை', add: 'உங்கள் சொற்றொடரைச் சேர்க்கவும்', addBtn: 'சேர்',
      speak: 'பேசு', show: 'காட்டு', close: 'மூடு', tapClose: 'மூட எங்கும் தொடவும்',
      qRead: 'இப்போதைய காற்றுத் தரம்', qForecast: 'முன்னறிவிப்பு', qAdvice: 'சுகாதார ஆலோசனை',
      qP1: 'பக்கம் 1', qP2: 'பக்கம் 2', qSim: 'சிமுலேட்டர்', qPlan: 'திட்டம்',
      p1: 'என்னால் பேச முடியாது. தயவுசெய்து இந்தத் திரையைப் படிக்கவும்.',
      p2: 'எனக்குக் காது கேட்காது. தயவுசெய்து எழுதிக் காட்டவும்.',
      p3: 'எனக்கு மருத்துவ உதவி தேவை. தயவுசெய்து 108 ஐ அழைக்கவும்.',
      p4: 'இங்கு காற்று பாதுகாப்பற்றது. நான் உள்ளே செல்ல வேண்டும்.',
      p5: 'அருகில் தூய காற்று உள்ள மருத்துவமனையைக் கண்டுபிடிக்க உதவவும்.'
    }
  };
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
      '.cm-phrase{border:2px solid #cbd5e1;border-radius:12px;padding:10px;margin-bottom:8px}',
      '.cm-phrase p{margin:0 0 8px;font-weight:600}',
      '.cm-full{position:fixed;inset:0;z-index:100001;background:#000;color:#fff;display:none;align-items:center;justify-content:center;text-align:center;padding:24px;font:700 clamp(28px,9vw,56px)/1.25 system-ui,sans-serif;cursor:pointer;flex-direction:column}',
      '.cm-full small{font:500 16px system-ui,sans-serif;margin-top:24px;opacity:.7}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var fab, sheet, full, fullText, fullHint;

  function showFull(text) {
    fullText.textContent = text; fullHint.textContent = t('tapClose');
    full.style.display = 'flex';
  }
  function say(text) { var a = api(); if (a && a.speak) a.speak(text); }
  function cmd(text) { var a = api(); if (a && a.command) a.command(text); }

  function render() {
    fab.setAttribute('aria-label', t('btn'));
    sheet.setAttribute('aria-label', t('title'));
    sheet.innerHTML = '';
    sheet.appendChild(el('h2', null, t('title')));

    // 1) type a command
    sheet.appendChild(el('h3', null, t('type')));
    var row = el('div', 'cm-row');
    var input = document.createElement('input');
    input.type = 'text'; input.placeholder = t('placeholder'); input.setAttribute('aria-label', t('type'));
    var send = el('button', 'cm-btn pri', t('send'));
    function go() { var v = input.value.trim(); if (v) { cmd(v); input.value = ''; } }
    send.addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    row.appendChild(input); row.appendChild(send);
    sheet.appendChild(row);

    // 2) quick actions
    sheet.appendChild(el('h3', null, t('quick')));
    var chips = el('div', 'cm-chips');
    QUICK.forEach(function (q) {
      var b = el('button', 'cm-btn', t(q[0]));
      b.addEventListener('click', function () { cmd(q[1]); toggle(false); });
      chips.appendChild(b);
    });
    sheet.appendChild(chips);

    // 3) phrase board
    sheet.appendChild(el('h3', null, t('phrases')));
    var list = ['p1', 'p2', 'p3', 'p4', 'p5'].map(function (k) { return t(k); }).concat(custom());
    list.forEach(function (text) {
      var box = el('div', 'cm-phrase');
      box.appendChild(el('p', null, text));
      var r = el('div', 'cm-row');
      var sp = el('button', 'cm-btn', '🔊 ' + t('speak'));
      sp.addEventListener('click', function () { say(text); });
      var sh = el('button', 'cm-btn pri', '🖥 ' + t('show'));
      sh.addEventListener('click', function () { showFull(text); });
      r.appendChild(sp); r.appendChild(sh);
      box.appendChild(r);
      sheet.appendChild(box);
    });

    // 4) add own phrase
    sheet.appendChild(el('h3', null, t('add')));
    var ar = el('div', 'cm-row');
    var ai = document.createElement('input'); ai.type = 'text'; ai.setAttribute('aria-label', t('add'));
    var ab = el('button', 'cm-btn', t('addBtn'));
    ab.addEventListener('click', function () {
      var v = ai.value.trim(); if (!v) return;
      var c = custom(); c.push(v); saveCustom(c); render();
    });
    ar.appendChild(ai); ar.appendChild(ab);
    sheet.appendChild(ar);

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
    idleMinutes: 10,
    activeSeconds: 8, greetDelayMs: 800, showStatus: true, greet: true,
    endpointMs: 800,   // answer this long after you stop talking (faster than waiting for the browser's own final result)
    debug: false,      // true = log timings to the browser console
    setLanguage: null, // (code) => switch the app's own language when the visitor asks for one by voice
    getLang: null,     // () => the app's current language code
   
    wake: /(?:\b(?:air|ayr|aer|eyr)[\s\-]*(?:cast|cost|cas)\b|एयर[\s\-]*कास्ट|ஏர்[\s\-]*காஸ்ட்|ఎయిర్[\s\u200c\u200d]*కాస్ట్|ఏర్[\s\u200c\u200d]*కాస్ట్|ಏರ್[\s\u200c\u200d]*ಕಾಸ್ಟ್|എയർ[\s\u200c\u200d]*കാസ്റ്റ്)/i
  };
  var LOCALES = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', ur: 'ur-IN' };
  var STR = {
    en: {
      btn: 'AirCast voice assistant',
      on: 'AirCast is on. Say AirCast, then ask me anything about the air. Say stop to quiet me.',
      disclosure: 'Note: your browser speech service hears you, and your questions are sent to an AI to answer. This is general information, not medical advice.',
      off: 'AirCast is off.', unsupported: 'Voice is not supported in this browser. Please use Chrome.',
      denied: 'Microphone access was blocked. Please allow the microphone and try again.',
      noAi: 'The AI helper is not connected yet.', error: 'Sorry, I could not answer that. Please try again.',
      paused: 'AirCast is paused to save battery. Tap anywhere to wake me.',
      emergency: 'This may be an emergency. Call 108 now, or ask someone nearby to call. Do not wait for the app.',
      stOff: 'AirCast: off', stWait: 'Say “AirCast”', stListen: 'Listening…', stThink: 'Thinking…', stSpeak: 'Speaking…',
      gm: 'Good morning', ga: 'Good afternoon', ge: 'Good evening', gn: 'Hello',
      nice: 'Have a nice day.', nice2: 'Have a nice evening.', iam: 'I am AirCast.', tell: 'Tell me what you want.',
      intro: 'Say stop listening to turn me off.',
      help: 'I can tell you the air quality, if it is safe to go out, masks, the best time outdoors, and the forecast.',
      langSet: 'Speaking English.',
      langNo: 'Sorry, I can speak English, Hindi, Tamil, Telugu, Kannada and Malayalam.',
      langOffer: 'To change language, say Hindi, Tamil, Telugu, Kannada or Malayalam.'
    },
    hi: {
      btn: 'एयरकास्ट आवाज़ सहायक',
      on: 'एयरकास्ट चालू है। एयरकास्ट कहें, फिर हवा के बारे में कुछ भी पूछें। चुप कराने के लिए रुको कहें।',
      disclosure: 'ध्यान दें: आपकी आवाज़ ब्राउज़र की स्पीच सेवा सुनती है और आपके सवाल जवाब के लिए एआई को भेजे जाते हैं। यह सामान्य जानकारी है, चिकित्सा सलाह नहीं।',
      off: 'एयरकास्ट बंद है।', unsupported: 'इस ब्राउज़र में आवाज़ समर्थित नहीं है। कृपया क्रोम इस्तेमाल करें।',
      denied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया अनुमति दें और फिर कोशिश करें।',
      noAi: 'एआई सहायक अभी जुड़ा नहीं है।', error: 'क्षमा करें, मैं जवाब नहीं दे सका। कृपया फिर कोशिश करें।',
      paused: 'बैटरी बचाने के लिए एयरकास्ट रुका है। जगाने के लिए कहीं भी टैप करें।',
      emergency: 'यह आपातकाल हो सकता है। अभी 108 पर कॉल करें, या पास के किसी व्यक्ति से कॉल करवाएं। ऐप का इंतज़ार न करें।',
      gm: 'सुप्रभात', ga: 'नमस्कार', ge: 'शुभ संध्या', gn: 'नमस्कार',
      nice: 'आपका दिन शुभ हो।', nice2: 'आपकी शाम शुभ हो।', iam: 'मैं एयरकास्ट हूँ।', tell: 'बताइए, आपको क्या चाहिए?',
      intro: 'मुझे बंद करने के लिए सुनना बंद करो कहें।',
      help: 'मैं वायु गुणवत्ता, बाहर जाना सुरक्षित है या नहीं, मास्क, बाहर का सबसे अच्छा समय और पूर्वानुमान बता सकता हूँ।',
      langSet: 'अब मैं हिंदी में बोल रहा हूँ।',
      langNo: 'क्षमा करें, मैं अंग्रेज़ी, हिंदी, तमिल, तेलुगु, कन्नड़ और मलयालम बोल सकता हूँ।',
      langOffer: 'हिंदी के लिए, हिंदी कहें।'
    },
    ta: {
      btn: 'ஏர்காஸ்ட் குரல் உதவியாளர்',
      on: 'ஏர்காஸ்ட் இயக்கத்தில் உள்ளது. ஏர்காஸ்ட் என்று சொல்லி, காற்றைப் பற்றி எதுவும் கேளுங்கள். என்னை நிறுத்த நிறுத்து என்று சொல்லுங்கள்.',
      disclosure: 'கவனிக்கவும்: உங்கள் உலாவியின் பேச்சு சேவை உங்களைக் கேட்கும், உங்கள் கேள்விகள் பதிலுக்காக AI-க்கு அனுப்பப்படும். இது பொதுத் தகவல், மருத்துவ ஆலோசனை அல்ல.',
      off: 'ஏர்காஸ்ட் அணைக்கப்பட்டது.', unsupported: 'இந்த உலாவியில் குரல் ஆதரிக்கப்படவில்லை. குரோம் பயன்படுத்தவும்.',
      denied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. அனுமதி அளித்து மீண்டும் முயலவும்.',
      noAi: 'AI உதவியாளர் இன்னும் இணைக்கப்படவில்லை.', error: 'மன்னிக்கவும், பதில் அளிக்க முடியவில்லை. மீண்டும் முயலவும்.',
      paused: 'பேட்டரியைச் சேமிக்க ஏர்காஸ்ட் நிறுத்தப்பட்டது. என்னை எழுப்ப எங்கும் தொடவும்.',
      emergency: 'இது அவசரநிலையாக இருக்கலாம். இப்போதே 108 ஐ அழைக்கவும், அல்லது அருகிலுள்ளவரை அழைக்கச் சொல்லுங்கள். செயலிக்காகக் காத்திருக்க வேண்டாம்.',
      gm: 'காலை வணக்கம்', ga: 'மதிய வணக்கம்', ge: 'மாலை வணக்கம்', gn: 'வணக்கம்',
      nice: 'இனிய நாளாக அமையட்டும்.', nice2: 'இனிய மாலையாக அமையட்டும்.', iam: 'நான் ஏர்காஸ்ட்.', tell: 'உங்களுக்கு என்ன வேண்டும் என்று சொல்லுங்கள்.',
      intro: 'என்னை நிறுத்த கேட்பதை நிறுத்து என்று சொல்லுங்கள்.',
      help: 'காற்றுத் தரம், வெளியே செல்வது பாதுகாப்பானதா, முகக்கவசம், சிறந்த நேரம், முன்னறிவிப்பு ஆகியவற்றைச் சொல்ல முடியும்.',
      langSet: 'இப்போது தமிழில் பேசுகிறேன்.',
      langNo: 'மன்னிக்கவும், நான் ஆங்கிலம், இந்தி, தமிழ், தெலுங்கு, கன்னடம், மலையாளம் பேசுவேன்.',
      langOffer: 'தமிழுக்கு, தமிழ் என்று சொல்லுங்கள்.'
    },
    te: {
      gm: 'శుభోదయం', ga: 'శుభ మధ్యాహ్నం', ge: 'శుభ సాయంత్రం', gn: 'నమస్కారం',
      nice: 'మీ రోజు శుభంగా ఉండాలి.', nice2: 'మీ సాయంత్రం శుభంగా ఉండాలి.',
      iam: 'నేను ఎయిర్‌కాస్ట్.', tell: 'మీకు ఏం కావాలో చెప్పండి.',
      intro: 'నన్ను ఆపడానికి “వినడం ఆపు” అని చెప్పండి.',
      denied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.',
      unsupported: 'ఈ బ్రౌజర్‌లో వాయిస్ పనిచేయదు. దయచేసి క్రోమ్ వాడండి.',
      error: 'క్షమించండి, నేను సమాధానం ఇవ్వలేకపోయాను. మళ్లీ ప్రయత్నించండి.',
      paused: 'బ్యాటరీ ఆదా చేయడానికి ఎయిర్‌కాస్ట్ ఆగింది. నన్ను లేపడానికి ఎక్కడైనా తాకండి.',
      emergency: 'ఇది అత్యవసర పరిస్థితి కావచ్చు. వెంటనే 108కి కాల్ చేయండి, లేదా దగ్గరలో ఉన్నవారిని కాల్ చేయమని అడగండి.',
      help: 'నేను ప్రస్తుత గాలి నాణ్యత, బయటకు వెళ్లడం సురక్షితమా, మాస్క్, ఉత్తమ సమయం, అంచనా చెప్పగలను.',
      langSet: 'తెలుగులో మాట్లాడుతున్నాను.',
      langNo: 'క్షమించండి, నేను ఇంగ్లీష్, హిందీ, తమిళం, తెలుగు, కన్నడ, మలయాళం మాట్లాడగలను.',
      langOffer: 'తెలుగు కోసం, తెలుగు అని చెప్పండి.'
    },
    kn: {
      gm: 'ಶುಭೋದಯ', ga: 'ಶುಭ ಮಧ್ಯಾಹ್ನ', ge: 'ಶುಭ ಸಂಜೆ', gn: 'ನಮಸ್ಕಾರ',
      nice: 'ನಿಮ್ಮ ದಿನ ಶುಭವಾಗಿರಲಿ.', nice2: 'ನಿಮ್ಮ ಸಂಜೆ ಶುಭವಾಗಿರಲಿ.',
      iam: 'ನಾನು ಏರ್‌ಕಾಸ್ಟ್.', tell: 'ನಿಮಗೆ ಏನು ಬೇಕು ಹೇಳಿ.',
      intro: 'ನನ್ನನ್ನು ನಿಲ್ಲಿಸಲು “ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸು” ಎಂದು ಹೇಳಿ.',
      denied: 'ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಅನುಮತಿ ನೀಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
      unsupported: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬೆಂಬಲವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕ್ರೋಮ್ ಬಳಸಿ.',
      error: 'ಕ್ಷಮಿಸಿ, ನಾನು ಉತ್ತರಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
      paused: 'ಬ್ಯಾಟರಿ ಉಳಿಸಲು ಏರ್‌ಕಾಸ್ಟ್ ನಿಂತಿದೆ. ನನ್ನನ್ನು ಎಬ್ಬಿಸಲು ಎಲ್ಲಿಯಾದರೂ ಮುಟ್ಟಿ.',
      emergency: 'ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಾಗಿರಬಹುದು. ಈಗಲೇ 108ಕ್ಕೆ ಕರೆ ಮಾಡಿ, ಅಥವಾ ಹತ್ತಿರದವರಿಗೆ ಕರೆ ಮಾಡಲು ಹೇಳಿ.',
      help: 'ನಾನು ಈಗಿನ ಗಾಳಿಯ ಗುಣಮಟ್ಟ, ಹೊರಗೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ, ಮಾಸ್ಕ್, ಉತ್ತಮ ಸಮಯ ಮತ್ತು ಮುನ್ಸೂಚನೆ ಹೇಳಬಲ್ಲೆ.',
      langSet: 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ.',
      langNo: 'ಕ್ಷಮಿಸಿ, ನಾನು ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ತಮಿಳು, ತೆಲುಗು, ಕನ್ನಡ, ಮಲಯಾಳಂ ಮಾತನಾಡಬಲ್ಲೆ.',
      langOffer: 'ಕನ್ನಡಕ್ಕಾಗಿ, ಕನ್ನಡ ಎಂದು ಹೇಳಿ.'
    },
    ml: {
      gm: 'സുപ്രഭാതം', ga: 'ശുഭ ഉച്ച', ge: 'ശുഭ സായാഹ്നം', gn: 'നമസ്കാരം',
      nice: 'നിങ്ങളുടെ ദിവസം നല്ലതാകട്ടെ.', nice2: 'നിങ്ങളുടെ സായാഹ്നം നല്ലതാകട്ടെ.',
      iam: 'ഞാൻ എയർകാസ്റ്റ്.', tell: 'നിങ്ങൾക്ക് എന്താണ് വേണ്ടതെന്ന് പറയൂ.',
      intro: 'എന്നെ നിർത്താൻ “കേൾക്കുന്നത് നിർത്തൂ” എന്ന് പറയൂ.',
      denied: 'മൈക്രോഫോൺ അനുമതി നിഷേധിച്ചു. അനുമതി നൽകി വീണ്ടും ശ്രമിക്കൂ.',
      unsupported: 'ഈ ബ്രൗസറിൽ ശബ്ദം പിന്തുണയ്ക്കുന്നില്ല. ദയവായി ക്രോം ഉപയോഗിക്കൂ.',
      error: 'ക്ഷമിക്കണം, എനിക്ക് ഉത്തരം നൽകാനായില്ല. വീണ്ടും ശ്രമിക്കൂ.',
      paused: 'ബാറ്ററി ലാഭിക്കാൻ എയർകാസ്റ്റ് നിർത്തി. എന്നെ ഉണർത്താൻ എവിടെയെങ്കിലും തൊടൂ.',
      emergency: 'ഇത് അടിയന്തര സാഹചര്യമായിരിക്കാം. ഉടൻ 108 വിളിക്കൂ, അല്ലെങ്കിൽ അടുത്തുള്ളവരോട് വിളിക്കാൻ പറയൂ.',
      help: 'ഇപ്പോഴത്തെ വായു നിലവാരം, പുറത്തിറങ്ങുന്നത് സുരക്ഷിതമാണോ, മാസ്ക്, നല്ല സമയം, പ്രവചനം എന്നിവ എനിക്ക് പറയാനാകും.',
      langSet: 'മലയാളത്തിൽ സംസാരിക്കുന്നു.',
      langNo: 'ക്ഷമിക്കണം, എനിക്ക് ഇംഗ്ലീഷ്, ഹിന്ദി, തമിഴ്, തെലുങ്ക്, കന്നഡ, മലയാളം സംസാരിക്കാം.',
      langOffer: 'മലയാളത്തിന്, മലയാളം എന്ന് പറയൂ.'
    }
  };
  var EMERGENCY = /can'?t breathe|cannot breathe|difficulty breathing|trouble breathing|chest pain|heart attack|faint(?:ed|ing)?|unconscious|passed out|choking|asthma attack|सांस नहीं|सांस लेने में तकलीफ|सीने में दर्द|बेहोश|மூச்சு (?:விட|திணறல்)|நெஞ்சு வலி|மயக்கம்/i;
  var STOP = /^(?:stop|quiet|cancel|enough|be quiet|रुको|बस|चुप|நிறுத்து)\b/i;
  var STOPLISTEN = /\b(?:stop listening|go to sleep|goodbye|good bye|turn off|switch off)\b|सुनना बंद|अलविदा|बंद करो|கேட்பதை நிறுத்து/i;
  var CITY = /\b(?:change|set|switch)\s+(?:the\s+)?city\s+to\s+(.+)/i;
  var LOCAL_INTENTS = { page1: 1, page2: 1, simulator: 1, planner: 1, help: 1 };

  var st = { mode: 'active', rec: null, busy: false, woke: false, activeTimer: null, idleTimer: null, greeted: false, gestureArmed: false, resumeArmed: false, history: [], epTimer: null, epDone: false, fails: 0, sayId: 0 };
  var ui = {};
  var INTRO = 'aircast_assistant_intro';

  function langCode() {
    var l = st.lang || '';
    try { if (!l && CFG.getLang) l = CFG.getLang() || ''; } catch (e) { /* ignore */ }
    try { if (!l) l = localStorage.getItem('lang') || ''; } catch (e) { /* ignore */ }
    l = String(l || document.documentElement.lang || 'en').toLowerCase().split(/[-_]/)[0];
    return STR[l] ? l : 'en';   // languages without voice strings fall back to English
  }
  function locale() { return LOCALES[langCode()] || 'en-IN'; }
  function t(k) { var l = langCode(); return (STR[l] && STR[l][k]) || STR.en[k] || k; }
  function A() { return window.AirCastA11y || null; }

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
  var T0 = 0;
  function mark(m) { if (CFG.debug && window.console) console.log('[AirCast] ' + m + ' +' + Math.round(Date.now() - T0) + 'ms'); }
  // Prefer an on-device voice: network voices can take seconds to start speaking.
  function pickVoice(loc) {
    try {
      var vs = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
      var base = String(loc).slice(0, 2).toLowerCase();
      var exact = vs.filter(function (v) { return v.lang && v.lang.replace('_', '-').toLowerCase() === String(loc).toLowerCase(); });
      var same = exact.length ? exact : vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(base) === 0; });
      var local = same.filter(function (v) { return v.localService; });
      return local[0] || same[0] || null;
    } catch (e) { return null; }
  }
  // Speaks sentence by sentence (first audio starts sooner). done() runs once, when the last sentence ends.
  // text = "sentence" (in language `want`)  OR  [["sentence", "hi"], ["sentence", "ta"], ...] (each in its own voice).
  function say(text, want, done, onstart) {
    if (!('speechSynthesis' in window)) { done(); return; }
    var id = ++st.sayId, finished = false, items = [], total = 0;
    var src = Array.isArray(text) ? text : [[text, want]];
    src.forEach(function (pr) {
      var loc = LOCALES[pr[1]] || 'en-IN', voice = pickVoice(loc);
      (String(pr[0]).match(/[^.!?।]+[.!?।]*/g) || [String(pr[0])]).forEach(function (x) {
        x = x.trim(); if (x) { items.push({ t: x, loc: loc, voice: voice }); total += x.length; }
      });
    });
    var guard = setTimeout(fin, 4000 + total * 110);
    function fin() { if (finished || id !== st.sayId) return; finished = true; clearTimeout(guard); done(); }
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    setTimeout(function () {
      if (id !== st.sayId) return;
      items.forEach(function (it, i) {
        var u = new SpeechSynthesisUtterance(it.t);
        u.lang = it.loc; if (it.voice) u.voice = it.voice; u.rate = 1.05;
        if (i === 0) u.onstart = function () { mark('speech started'); if (onstart) onstart(); };
        if (i === items.length - 1) { u.onend = fin; u.onerror = fin; }
        try { window.speechSynthesis.speak(u); } catch (e) { fin(); }
      });
    }, 60);
  }
  function speak(text, lang) {
    if (!text) return;
    stopRec(); setStatus('stSpeak');
    var a = A(); if (a && a.caption) a.caption(Array.isArray(text) ? text.map(function (p) { return p[0]; }).join(' ') : text);
    say(text, lang || langCode(), function () { mark('speech ended'); resume(); });
  }
  function cancelSpeech() { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  // For speech started by aircast-accessibility.js (it gives no callback): wait until it has really finished.
  function waitQuiet(cb) {
    setTimeout(function () {
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        var speaking = 'speechSynthesis' in window && window.speechSynthesis.speaking;
        if (!speaking || tries > 450) { clearInterval(iv); setTimeout(cb, 80); }
      }, 100);
    }, 250);
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
    st.epDone = false;
    var r = new SR();
    r.lang = locale(); r.continuous = true; r.interimResults = true; r.maxAlternatives = 3;
    r.onresult = function (e) {
      st.fails = 0;
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var res = e.results[i];
        if (!res.isFinal) {
          // Interim results arrive fast: react to the wake word immediately and keep the listening window open.
          if (st.mode === 'active') startActiveTimer(6);
          else if (st.mode === 'standby' && !st.woke && CFG.wake.test(res[0].transcript)) { st.woke = true; cancelSpeech(); beep([880, 1175]); }
          scheduleEndpoint(res[0].transcript);
          continue;
        }
        clearTimeout(st.epTimer);
        if (st.epDone) { st.epDone = false; continue; }   // already handled from the interim text
        var already = st.woke; st.woke = false;
        var alts = [];
        for (var j = 0; j < res.length; j++) alts.push(res[j].transcript);
        heard(alts, already);
      }
    };
    r.onerror = function (ev) {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { goOff(); speak(t('denied')); }
      else if (ev.error === 'network') {
        st.fails++;
        var ca = A(); if (st.fails === 3 && ca && ca.caption) ca.caption('Voice service not reachable. Check your internet connection.');
      }
    };
    r.onend = function () {
      st.rec = null;
      if (st.mode !== 'off' && !st.busy && !(window.speechSynthesis && window.speechSynthesis.speaking)) setTimeout(startRec, st.fails ? Math.min(3000, 400 * st.fails) : 120);
    };
    try { r.start(); st.rec = r; } catch (e) { st.rec = null; }
    return true;
  }
  function stopRec() {
    var r = st.rec; st.rec = null;
    if (r) { r.onend = null; r.onresult = null; try { r.abort(); } catch (e) { /* ignore */ } }
  }
  // Don't wait for the browser to decide you're done: answer ~0.8s after the words stop changing.
  function scheduleEndpoint(txt) {
    clearTimeout(st.epTimer);
    if (!txt) return;
    st.epTimer = setTimeout(function () {
      if (st.mode === 'off' || st.busy) return;
      var already = st.woke; st.woke = false;
      st.epDone = true;
      T0 = Date.now(); mark('endpoint: ' + txt);
      heard([txt], already);
    }, CFG.endpointMs);
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
  /* ----------------------------- languages ------------------------------- */
  var ORDER = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];
  var LANGNAMES = [
    ['en', /\b(?:english|angrezi)\b|अंग्रेज़ी|अंग्रेजी|इंग्लिश|ஆங்கிலம்|ఇంగ్లీష్|ಇಂಗ್ಲಿಷ್|ഇംഗ്ലീഷ്/i],
    ['hi', /\bhindi\b|हिंदी|हिन्दी|இந்தி|హిందీ|ಹಿಂದಿ|ഹിന്ദി/i],
    ['ta', /\b(?:tamil|thamizh)\b|தமிழ்|तमिल|తమిళం|ತಮಿಳು|തമിഴ്/i],
    ['te', /\btelugu\b|తెలుగు|तेलुगु|தெலுங்கு|ತೆಲುಗು|തെലുങ്ക്/i],
    ['kn', /\bkannada\b|ಕನ್ನಡ|कन्नड़|कन्नड|கன்னடம்|కన్నడ|കന്നഡ/i],
    ['ml', /\bmalayalam\b|മലയാളം|मलयालम|மலையாளம்|మలయాళం|ಮಲಯಾಳಂ/i]
  ];
  var OTHER_LANGS = /\b(?:bengali|bangla|marathi|gujarati|punjabi|urdu|odia|oriya|assamese|spanish|french|german|arabic|chinese|japanese)\b|বাংলা|मराठी|ગુજરાતી|ਪੰਜਾਬੀ|اردو|ଓଡ଼ିଆ/i;
  var LANGWORD = /\blanguage\b|भाषा|மொழி|భాష|ಭಾಷೆ|ഭാഷ/i;
  function langRequest(q) {
    if (q.split(/\s+/).length > 7) return null;
    for (var i = 0; i < LANGNAMES.length; i++) if (LANGNAMES[i][1].test(q)) return LANGNAMES[i][0];
    if (OTHER_LANGS.test(q)) return 'other';
    if (LANGWORD.test(q)) return 'list';
    return null;
  }
  function offerParts() { return ORDER.map(function (c) { return [STR[c].langOffer, c]; }); }
  // Switches the assistant (voice + listening language) and the app's own language.
  function setLang(code, quiet) {
    if (!STR[code]) return;
    st.lang = code;
    try { localStorage.setItem('lang', code); localStorage.setItem('aircast_lang', code); } catch (e) { /* ignore */ }
    document.documentElement.lang = code;
    try { if (CFG.setLanguage) CFG.setLanguage(code); } catch (e) { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('aircast:language', { detail: { lang: code } })); } catch (e) { /* ignore */ }
    stopRec();   // listening restarts in the new language after the reply
    if (!quiet) speak(t('langSet') + ' ' + t('help'));
  }
  function handleLang(lg) {
    if (lg === 'other') { speak(t('langNo')); return; }
    if (lg === 'list') { speak(offerParts()); return; }
    setLang(lg);
  }

  function process(q) {
    q = (q || '').trim();
    if (!q) return;
    mark('process: ' + q);
    if (STOPLISTEN.test(q)) { goOff(); return; }
    if (STOP.test(q)) { cancelSpeech(); startActiveTimer(); return; }
    var lg = langRequest(q);
    if (lg) { handleLang(lg); return; }
    var a = A();
    if (EMERGENCY.test(q)) {
      if (a && a.announce) a.announce(t('emergency'), 'severe'); else speak(t('emergency'));
      stopRec(); waitQuiet(resume);
      return;
    }
    var city = q.match(CITY);
    if (city && a) { stopRec(); a.command('change city to ' + city[1]); waitQuiet(resume); return; }
    var id = a && a.intent ? a.intent(q) : null;
    var short = q.split(/\s+/).length <= 5;
    if (a && id && LOCAL_INTENTS[id] && short) { stopRec(); a.command(q); waitQuiet(resume); return; }
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
      good: 'గాలి నాణ్యత బాగుంది. అందరూ బయట కార్యకలాపాలు చేయవచ్చు.',
      satisfactory: 'గాలి నాణ్యత సంతృప్తికరం. చాలా సున్నితమైనవారు ఎక్కువసేపు కష్టమైన పని చేయకండి.',
      moderate: 'ఆస్తమా, గుండె లేదా ఊపిరితిత్తుల సమస్యలు ఉన్నవారు, పిల్లలు, వృద్ధులు బయట ఎక్కువసేపు లేదా కఠినమైన వ్యాయామం తగ్గించాలి.',
      poor: 'అందరూ బయట కఠినమైన వ్యాయామం తగ్గించాలి. సున్నితమైనవారు వీలైతే ఇంట్లోనే ఉండాలి. బయట సరిగ్గా సరిపోయే N95 మాస్క్ సహాయపడుతుంది.',
      veryPoor: 'బయట వ్యాయామం చేయకండి. కిటికీలు మూసి ఇంట్లో ఉండండి; తప్పనిసరిగా వెళ్ళాలంటే సరిగ్గా సరిపోయే N95 మాస్క్ ధరించండి.',
      severe: 'కిటికీలు మూసి ఇంట్లోనే ఉండండి, బయట కార్యకలాపాలన్నీ మానుకోండి. శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంటే 108కి కాల్ చేయండి.'
    },
    kn: {
      good: 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಚೆನ್ನಾಗಿದೆ. ಎಲ್ಲರೂ ಹೊರಗೆ ಚಟುವಟಿಕೆ ಮಾಡಬಹುದು.',
      satisfactory: 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಸಮಾಧಾನಕರ. ತುಂಬಾ ಸೂಕ್ಷ್ಮ ಜನರು ಹೆಚ್ಚು ಹೊತ್ತು ಕಠಿಣ ಶ್ರಮ ಮಾಡಬೇಡಿ.',
      moderate: 'ಆಸ್ತಮಾ, ಹೃದಯ ಅಥವಾ ಶ್ವಾಸಕೋಶದ ತೊಂದರೆ ಇರುವವರು, ಮಕ್ಕಳು ಮತ್ತು ವೃದ್ಧರು ಹೊರಗೆ ಹೆಚ್ಚು ಹೊತ್ತು ಅಥವಾ ಕಠಿಣ ವ್ಯಾಯಾಮ ಕಡಿಮೆ ಮಾಡಿ.',
      poor: 'ಎಲ್ಲರೂ ಹೊರಗೆ ಕಠಿಣ ವ್ಯಾಯಾಮ ಕಡಿಮೆ ಮಾಡಿ. ಸೂಕ್ಷ್ಮ ಜನರು ಸಾಧ್ಯವಾದರೆ ಮನೆಯೊಳಗೆ ಇರಿ. ಹೊರಗೆ ಸರಿಯಾಗಿ ಹೊಂದುವ N95 ಮಾಸ್ಕ್ ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
      veryPoor: 'ಹೊರಗೆ ವ್ಯಾಯಾಮ ಮಾಡಬೇಡಿ. ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿ ಮನೆಯೊಳಗೆ ಇರಿ; ಹೊರಗೆ ಹೋಗಲೇಬೇಕಾದರೆ ಸರಿಯಾಗಿ ಹೊಂದುವ N95 ಮಾಸ್ಕ್ ಧರಿಸಿ.',
      severe: 'ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿ ಮನೆಯೊಳಗೇ ಇರಿ, ಹೊರಗಿನ ಎಲ್ಲಾ ಚಟುವಟಿಕೆ ತಪ್ಪಿಸಿ. ಉಸಿರಾಟದ ತೊಂದರೆ ಇದ್ದರೆ 108ಕ್ಕೆ ಕರೆ ಮಾಡಿ.'
    },
    ml: {
      good: 'വായുവിന്റെ നിലവാരം നല്ലതാണ്. എല്ലാവർക്കും പുറത്ത് പ്രവർത്തനങ്ങൾ ചെയ്യാം.',
      satisfactory: 'വായുവിന്റെ നിലവാരം തൃപ്തികരമാണ്. വളരെ സെൻസിറ്റീവ് ആയവർ ദീർഘനേരം കഠിനാധ്വാനം ഒഴിവാക്കുക.',
      moderate: 'ആസ്ത്മ, ഹൃദയം അല്ലെങ്കിൽ ശ്വാസകോശ പ്രശ്നമുള്ളവർ, കുട്ടികൾ, മുതിർന്നവർ പുറത്ത് ദീർഘനേരമോ കഠിനമായതോ ആയ വ്യായാമം കുറയ്ക്കുക.',
      poor: 'എല്ലാവരും പുറത്ത് കഠിനമായ വ്യായാമം കുറയ്ക്കുക. സെൻസിറ്റീവ് ആയവർ കഴിയുമെങ്കിൽ വീടിനുള്ളിൽ തുടരുക. പുറത്ത് നന്നായി ഇണങ്ങുന്ന N95 മാസ്ക് സഹായിക്കും.',
      veryPoor: 'പുറത്ത് വ്യായാമം ചെയ്യരുത്. ജനലുകൾ അടച്ച് വീടിനുള്ളിൽ തുടരുക; പോകേണ്ടി വന്നാൽ നന്നായി ഇണങ്ങുന്ന N95 മാസ്ക് ധരിക്കുക.',
      severe: 'ജനലുകൾ അടച്ച് വീടിനുള്ളിൽ തന്നെ തുടരുക, പുറത്തുള്ള എല്ലാ പ്രവർത്തനങ്ങളും ഒഴിവാക്കുക. ശ്വസിക്കാൻ ബുദ്ധിമുട്ടുണ്ടെങ്കിൽ 108 വിളിക്കുക.'
    }
  };
  var MASK = {
    en: 'A well-fitted N95 or FFP2 respirator filters fine particles. Cloth or surgical masks do not filter them well. Wear one outdoors when the air is poor or worse.',
    hi: 'सही फिट वाला N95 या FFP2 मास्क महीन कणों को रोकता है। कपड़े या सर्जिकल मास्क इन्हें अच्छी तरह नहीं रोकते। हवा खराब हो तो बाहर इसे पहनें।',
    ta: 'சரியாகப் பொருந்தும் N95 அல்லது FFP2 முகக்கவசம் நுண்துகள்களை வடிகட்டும். துணி அல்லது அறுவை சிகிச்சை முகக்கவசங்கள் அவற்றை நன்றாக வடிகட்டாது. காற்று மோசமாக இருந்தால் வெளியே அணியுங்கள்.'
    ,
    te: 'సరిగ్గా సరిపోయే N95 లేదా FFP2 మాస్క్ సూక్ష్మ కణాలను అడ్డుకుంటుంది. బట్ట లేదా సర్జికల్ మాస్కులు వాటిని బాగా అడ్డుకోవు. గాలి చెడ్డగా ఉంటే బయట ధరించండి.',
    kn: 'ಸರಿಯಾಗಿ ಹೊಂದುವ N95 ಅಥವಾ FFP2 ಮಾಸ್ಕ್ ಸೂಕ್ಷ್ಮ ಕಣಗಳನ್ನು ತಡೆಯುತ್ತದೆ. ಬಟ್ಟೆ ಅಥವಾ ಸರ್ಜಿಕಲ್ ಮಾಸ್ಕ್ ಅವನ್ನು ಚೆನ್ನಾಗಿ ತಡೆಯುವುದಿಲ್ಲ. ಗಾಳಿ ಕೆಟ್ಟದಾಗಿದ್ದರೆ ಹೊರಗೆ ಧರಿಸಿ.',
    ml: 'നന്നായി ഇണങ്ങുന്ന N95 അല്ലെങ്കിൽ FFP2 മാസ്ക് സൂക്ഷ്മ കണങ്ങളെ തടയും. തുണി അല്ലെങ്കിൽ സർജിക്കൽ മാസ്കുകൾ അവയെ നന്നായി തടയില്ല. വായു മോശമാണെങ്കിൽ പുറത്ത് ധരിക്കുക.'
  };
  var FALLBACK = {
    en: 'I can tell you the air quality now, whether it is safe to go outside, masks, the best time outdoors, and the forecast. You can also say page 1, page 2, simulator or planner.',
    hi: 'मैं अभी की वायु गुणवत्ता, बाहर जाना सुरक्षित है या नहीं, मास्क, बाहर का सबसे अच्छा समय और पूर्वानुमान बता सकता हूँ। आप पेज 1, पेज 2, सिम्युलेटर या योजना भी बोल सकते हैं।',
    ta: 'தற்போதைய காற்றுத் தரம், வெளியே செல்வது பாதுகாப்பானதா, முகக்கவசம், வெளியே செல்ல சிறந்த நேரம், முன்னறிவிப்பு ஆகியவற்றைச் சொல்ல முடியும். பக்கம் 1, பக்கம் 2, சிமுலேட்டர் அல்லது திட்டம் என்றும் சொல்லலாம்.'
    ,
    te: 'నేను ప్రస్తుత గాలి నాణ్యత, బయటకు వెళ్లడం సురక్షితమా, మాస్క్, ఉత్తమ సమయం, అంచనా చెప్పగలను.',
    kn: 'ನಾನು ಈಗಿನ ಗಾಳಿಯ ಗುಣಮಟ್ಟ, ಹೊರಗೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ, ಮಾಸ್ಕ್, ಉತ್ತಮ ಸಮಯ ಮತ್ತು ಮುನ್ಸೂಚನೆ ಹೇಳಬಲ್ಲೆ.',
    ml: 'ഇപ്പോഴത്തെ വായു നിലവാരം, പുറത്തിറങ്ങുന്നത് സുരക്ഷിതമാണോ, മാസ്ക്, നല്ല സമയം, പ്രവചനം എന്നിവ എനിക്ക് പറയാനാകും.'
  };
  function levelOf(a) { return a <= 50 ? 'good' : a <= 100 ? 'satisfactory' : a <= 200 ? 'moderate' : a <= 300 ? 'poor' : a <= 400 ? 'veryPoor' : 'severe'; }
  function pick(tbl, l) { return tbl[l] ? { text: tbl[l], lang: l } : { text: tbl.en, lang: 'en' }; }

  // Returns { text, lang }. Hindi/Tamil are available for the core answers; other answers use English.
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
    if (/hospital|clinic|doctor|अस्पताल|மருத்துவமனை/.test(x))
      return en('Say page 2 and open the clean-air hospitals section. In an emergency, call 108.');
    if (/mask|n95|मास्क|முகக்கவசம்|మాస్క్|ಮಾಸ್ಕ್|മാസ്ക്/.test(x)) { var m = ADV[l] ? { text: MASK[l], lang: l } : en(MASK.en); return m; }
    if (/child|kid|baby|old age|elder|asthma|copd|pregnan|बच्च|बुज़ुर्ग|दमा|குழந்தை|ஆஸ்துமா|పిల్ల|ಮಕ್ಕಳ|കുട്ടി/.test(x))
      return have ? (function () { var r = advice(); if (r.lang === 'en') r.text += ' Keep any reliever medicine your doctor prescribed within reach.'; return r; })() : noData;
    if (/window|indoor|ventilat|खिड़की|ஜன்னல்/.test(x))
      return en('Keep windows closed when the air is poor or worse, and open them when it improves, usually around midday.');
    if (/best (?:time|hour)|cleanest|when (?:should|can|is).*(?:go|walk|run|outside|exercise)|सबसे अच्छा समय|சிறந்த நேரம்/.test(x))
      return ctx.bestHour ? en('The cleanest hour today is around ' + ctx.bestHour + '.' + (ctx.worstHour ? ' The worst is around ' + ctx.worstHour + '.' : '')) : en('I do not have the best hour yet. Open the hourly forecast on page 1.');
    if (/forecast|tomorrow|tonight|later|next|पूर्वानुमान|कल|முன்னறிவிப்பு/.test(x))
      return en(ctx.forecast || 'The forecast summary is not available yet. Open the hourly forecast on page 1.');
    if (/\bwhy\b|reason|cause|क्यों|ஏன்/.test(x))
      return ctx.topDriver ? en('The biggest factor right now is ' + ctx.topDriver + '.') : en('I do not have the main cause yet. Open the explanation chart on page 2.');
    if (/temperature|how hot|तापमान|வெப்பநிலை/.test(x) && ctx.temp != null) return en('The temperature is ' + ctx.temp + ' degrees Celsius.');
    if (/wind|हवा की गति|காற்றின் வேகம்/.test(x) && ctx.wind != null) return en('Wind speed is ' + ctx.wind + ' kilometres per hour.');
    if (/humid|नमी|ஈரப்பதம்/.test(x) && ctx.humidity != null) return en('Humidity is ' + ctx.humidity + ' percent.');
    if (/safe|go out|outside|walk|run|jog|exercise|play|cycle|bike|market|बाहर|टहल|दौड़|வெளியே|நடை|బయట|ಹೊರಗೆ|പുറത്ത്/.test(x))
      return have ? advice() : noData;
    if (/air quality|aqi|how(?:'s| is) the air|pollution|वायु|हवा|प्रदूषण|காற்று|காற்றின்|தரம்|గాలి|ಗಾಳಿ|വായു/.test(x)) {
      if (!have) return noData;
      var cat = ctx.category || '';
      var TT = { te: ['లో ', 'గాలి నాణ్యత సూచిక ', ', ఇది ', '.'], kn: ['ನಲ್ಲಿ ', 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ ', ', ಇದು ', '.'], ml: ['ൽ ', 'വായു നിലവാര സൂചിക ', ', ഇത് ', '.'] };
      if (TT[l]) return { text: (city ? city + TT[l][0] : '') + TT[l][1] + aqi + (cat ? TT[l][2] + cat : '') + TT[l][3], lang: l };
      if (l === 'hi') return { text: (city ? city + ' में ' : '') + 'वायु गुणवत्ता सूचकांक ' + aqi + ' है' + (cat ? ', जो ' + cat + ' है।' : '।'), lang: 'hi' };
      if (l === 'ta') return { text: (city ? city + '-ல் ' : '') + 'காற்றுத் தரக் குறியீடு ' + aqi + (cat ? ', இது ' + cat + '.' : '.'), lang: 'ta' };
      return en((city ? 'In ' + city + ', the' : 'The') + ' air quality index is ' + aqi + (cat ? ', which is ' + cat : '') + '.' + (ctx.pm25 != null ? ' PM2.5 is ' + ctx.pm25 + ' micrograms per cubic metre.' : ''));
    }
    return pick(FALLBACK, l);
  }
  function answerLocally(q) {
    var ctx = {};
    try { ctx = (CFG.getContext && CFG.getContext()) || {}; } catch (e) { ctx = {}; }
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
  function greetParts(first) {
    var l = langCode(), parts = [[greetText(first), l]];
    if (first) { parts.push([t('help'), l]); parts = parts.concat(offerParts()); }
    return parts;
  }
  var skipH = null, SKIPEV = ['pointerdown', 'keydown'];
  function clearSkip() { if (skipH) { SKIPEV.forEach(function (ev) { document.removeEventListener(ev, skipH, true); }); skipH = null; } }
  function armSkip() {   // a tap or key during the long first-visit speech skips it and starts listening
    clearSkip();
    var h = function () { clearSkip(); st.sayId++; cancelSpeech(); resume(); };
    skipH = h;
    setTimeout(function () { if (skipH === h) SKIPEV.forEach(function (ev) { document.addEventListener(ev, h, true); }); }, 800);
  }
  function greet() {
    if (st.greeted) return;
    if (!('speechSynthesis' in window)) { st.greeted = true; resume(); return; }
    var first = !seenIntro(), started = false, parts = greetParts(first);
    var a = A(); if (a && a.caption) a.caption(parts[0][0]);
    say(parts, langCode(), function () {
      clearSkip();
      if (started) resume(); else armGreetGesture();
    }, function () { started = true; st.greeted = true; markIntro(); setStatus('stSpeak'); if (first) armSkip(); });
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
    if (show) ui.pill.textContent = t(key);
  }
  function init() {
    try { window.speechSynthesis.getVoices(); } catch (e) { /* ignore */ }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var s = document.createElement('style');
    s.textContent = '.av-pill{position:fixed;left:50%;transform:translateX(-50%);top:8px;z-index:99970;background:#0f172a;color:#fff;border:2px solid #fff;border-radius:999px;padding:6px 14px;font:700 13px system-ui,sans-serif;display:none;pointer-events:none}';
    document.head.appendChild(s);
    ui.pill = document.createElement('div'); ui.pill.className = 'av-pill'; ui.pill.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ui.pill);
    try { var sl = localStorage.getItem('aircast_lang'); if (sl && STR[sl]) setLang(sl, true); } catch (e) { /* ignore */ }
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
    configure: function (o) { Object.keys(o || {}).forEach(function (k) { CFG[k] = o[k]; }); },
    start: function () { if (st.mode === 'off') { beep([880]); openActive(); } },
    stop: goOff,
    setLanguage: function (code) { if (STR[code]) { st.lang = code; stopRec(); if (st.mode !== 'off') startRec(); } },   // call when the app's own language dropdown changes
    ask: function (q) { if (st.mode === 'off') st.mode = 'active'; process(q); },
    greet: function () { st.greeted = false; greet(); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
