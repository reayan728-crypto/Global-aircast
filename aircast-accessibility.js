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
      noSummary: 'Air quality summary is not connected yet.'
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
      noSummary: 'वायु गुणवत्ता सारांश अभी जुड़ा नहीं है।'
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
      noSummary: 'காற்றுத் தரச் சுருக்கம் இன்னும் இணைக்கப்படவில்லை.'
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
      'html.a11y-large{font-size:125%!important}',
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
    els.sign.appendChild(head); els.sign.appendChild(els.video); els.sign.appendChild(els.signMsg); els.sign.appendChild(bar);
    document.body.appendChild(els.sign);
  }

  function showSign(levelKey, caption) {
    if (!els.sign) return;
    var url = levelKey && CONFIG.signClips[levelKey];
    els.signMsg.textContent = caption || '';
    if (url) {
      els.video.style.display = 'block';
      if (els.video.getAttribute('src') !== url) els.video.src = url;
      els.video.playbackRate = signSpeeds[signSpeedIdx];
      var p = els.video.play(); if (p && p.catch) p.catch(function () { /* autoplay blocked: user taps play */ });
    } else {
      els.video.pause(); els.video.removeAttribute('src'); els.video.style.display = 'none';
      els.signMsg.textContent = (caption ? caption + ' — ' : '') + t('noClip');
    }
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
        if (k === 'signClips' || k === 'selectors') {
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
    open: function () { togglePanel(true); },
    refresh: function () { renderPanel(); applyOptions(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
