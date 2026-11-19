/*!
 * AirCast Voice Assistant ("Hey AirCast")
 * For blind and low-vision users: say "Hey AirCast", ask a question, hear the answer.
 *
 * HOW IT WORKS
 *  1. User taps the 🎙 button once (browsers require a tap before the mic or speech can start).
 *  2. It listens continuously for the wake phrase "Hey AirCast" (also "Hi/OK AirCast", Hindi and Tamil forms).
 *  3. After the wake phrase it beeps, listens, then:
 *       - short navigation commands ("page 2", "simulator", "planner", "change city to Chennai") -> handled by aircast-accessibility.js
 *       - everything else -> sent to YOUR AI function (AirCastAssistant.configure({ ask })) and the answer is spoken.
 *  4. Emergency phrases ("chest pain", "can't breathe"...) skip the AI and say "Call 108" immediately.
 *
 * LIMITS (be honest in your demo)
 *  - Works only while the page is open and the screen is on (not a background assistant like Siri).
 *  - Uses the browser's speech service (Chrome/Edge work best). Wake-word detection can mishear.
 *  - Load AFTER aircast-accessibility.js.
 *
 * CONNECT THE AI (required for open questions):
 *   AirCastAssistant.configure({
 *     ask: async (question, context, history) => "short spoken answer",   // call Gemini here
 *     getContext: () => ({ city:'Coimbatore', aqi:73, category:'Satisfactory', pm25:40.8, bestHour:'12:00', forecast:'...' })
 *   });
 */
(function () {
  'use strict';
  if (window.AirCastAssistant) return;

  var CFG = {
    ask: null,
    getContext: null,
    idleMinutes: 10,
    wake: /(?:hey|hi|ok|okay|hello|हे|हेलो|ஹே|ஹலோ)[\s,.\-]*(?:air[\s\-]*cast|aircast|air cost|एयर[\s\-]*कास्ट|ஏர்[\s\-]*காஸ்ட்)/i
  };
  var LOCALES = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', ur: 'ur-IN' };
  var STR = {
    en: {
      btn: 'Hey AirCast voice assistant',
      on: 'Hey AirCast is on. Say Hey AirCast, then ask me anything about the air. Say stop to quiet me.',
      disclosure: 'Note: your browser speech service hears you, and your questions are sent to an AI to answer. This is general information, not medical advice.',
      off: 'Hey AirCast is off.', unsupported: 'Voice is not supported in this browser. Please use Chrome.',
      denied: 'Microphone access was blocked. Please allow the microphone and try again.',
      noAi: 'The AI helper is not connected yet.', error: 'Sorry, I could not answer that. Please try again.',
      paused: 'Hey AirCast is paused to save battery. Tap the microphone button to resume.',
      emergency: 'This may be an emergency. Call 108 now, or ask someone nearby to call. Do not wait for the app.',
      stOff: 'Hey AirCast: off', stWait: 'Say “Hey AirCast”', stListen: 'Listening…', stThink: 'Thinking…', stSpeak: 'Speaking…'
    },
    hi: {
      btn: 'हे एयरकास्ट आवाज़ सहायक',
      on: 'हे एयरकास्ट चालू है। हे एयरकास्ट कहें, फिर हवा के बारे में कुछ भी पूछें। चुप कराने के लिए रुको कहें।',
      disclosure: 'ध्यान दें: आपकी आवाज़ ब्राउज़र की स्पीच सेवा सुनती है और आपके सवाल जवाब के लिए एआई को भेजे जाते हैं। यह सामान्य जानकारी है, चिकित्सा सलाह नहीं।',
      off: 'हे एयरकास्ट बंद है।', unsupported: 'इस ब्राउज़र में आवाज़ समर्थित नहीं है। कृपया क्रोम इस्तेमाल करें।',
      denied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया अनुमति दें और फिर कोशिश करें।',
      noAi: 'एआई सहायक अभी जुड़ा नहीं है।', error: 'क्षमा करें, मैं जवाब नहीं दे सका। कृपया फिर कोशिश करें।',
      paused: 'बैटरी बचाने के लिए हे एयरकास्ट रुका है। फिर शुरू करने के लिए माइक्रोफ़ोन बटन दबाएं।',
      emergency: 'यह आपातकाल हो सकता है। अभी 108 पर कॉल करें, या पास के किसी व्यक्ति से कॉल करवाएं। ऐप का इंतज़ार न करें।'
    },
    ta: {
      btn: 'ஹே ஏர்காஸ்ட் குரல் உதவியாளர்',
      on: 'ஹே ஏர்காஸ்ட் இயக்கத்தில் உள்ளது. ஹே ஏர்காஸ்ட் என்று சொல்லி, காற்றைப் பற்றி எதுவும் கேளுங்கள். என்னை நிறுத்த நிறுத்து என்று சொல்லுங்கள்.',
      disclosure: 'கவனிக்கவும்: உங்கள் உலாவியின் பேச்சு சேவை உங்களைக் கேட்கும், உங்கள் கேள்விகள் பதிலுக்காக AI-க்கு அனுப்பப்படும். இது பொதுத் தகவல், மருத்துவ ஆலோசனை அல்ல.',
      off: 'ஹே ஏர்காஸ்ட் அணைக்கப்பட்டது.', unsupported: 'இந்த உலாவியில் குரல் ஆதரிக்கப்படவில்லை. குரோம் பயன்படுத்தவும்.',
      denied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. அனுமதி அளித்து மீண்டும் முயலவும்.',
      noAi: 'AI உதவியாளர் இன்னும் இணைக்கப்படவில்லை.', error: 'மன்னிக்கவும், பதில் அளிக்க முடியவில்லை. மீண்டும் முயலவும்.',
      paused: 'பேட்டரியைச் சேமிக்க ஹே ஏர்காஸ்ட் நிறுத்தப்பட்டது. தொடர மைக்ரோஃபோன் பொத்தானைத் தட்டவும்.',
      emergency: 'இது அவசரநிலையாக இருக்கலாம். இப்போதே 108 ஐ அழைக்கவும், அல்லது அருகிலுள்ளவரை அழைக்கச் சொல்லுங்கள். செயலிக்காகக் காத்திருக்க வேண்டாம்.'
    }
  };
  var EMERGENCY = /can'?t breathe|cannot breathe|difficulty breathing|trouble breathing|chest pain|heart attack|faint(?:ed|ing)?|unconscious|passed out|choking|asthma attack|सांस नहीं|सांस लेने में तकलीफ|सीने में दर्द|बेहोश|மூச்சு (?:விட|திணறல்)|நெஞ்சு வலி|மயக்கம்/i;
  var STOP = /^(?:stop|quiet|cancel|enough|be quiet|रुको|बस|चुप|நிறுத்து)\b/i;
  var CITY = /\b(?:change|set|switch)\s+(?:the\s+)?city\s+to\s+(.+)/i;
  var LOCAL_INTENTS = { page1: 1, page2: 1, simulator: 1, planner: 1, help: 1 };

  var st = { on: false, rec: null, awake: false, busy: false, awakeTimer: null, idleTimer: null, history: [], ctx: null };
  var ui = {};
  var PREF = 'aircast_assistant_on';

  function langCode() {
    var l = '';
    try { l = localStorage.getItem('lang') || ''; } catch (e) { /* ignore */ }
    return String(l || document.documentElement.lang || 'en').toLowerCase().split(/[-_]/)[0];
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
  function speak(text) {
    if (!text) return;
    stopRec();
    setStatus('stSpeak');
    var a = A();
    if (a && a.speak) a.speak(text);
    else if ('speechSynthesis' in window) {
      var u = new SpeechSynthesisUtterance(text); u.lang = locale(); window.speechSynthesis.speak(u);
    }
    waitQuiet(function () { setStatus(st.on ? 'stWait' : 'stOff'); if (st.on) startRec(); });
  }
  function cancelSpeech() { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  function waitQuiet(cb) {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var speaking = 'speechSynthesis' in window && window.speechSynthesis.speaking;
      if (!speaking || tries > 150) { clearInterval(iv); setTimeout(cb, 350); }
    }, 300);
  }
  function clean(text) {
    var s = String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/https?:\/\/\S+/g, ' ')
      .replace(/[*#_`>|~]/g, ' ').replace(/\s+/g, ' ').trim();
    if (s.length > 700) { s = s.slice(0, 700); var i = Math.max(s.lastIndexOf('. '), s.lastIndexOf('। ')); if (i > 200) s = s.slice(0, i + 1); }
    return s;
  }

  /* ----------------------------- recognition ----------------------------- */
  function startRec() {
    if (!st.on || st.rec) return true;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { st.on = false; setUi(); speak(t('unsupported')); return false; }
    var r = new SR();
    r.lang = locale(); r.continuous = true; r.interimResults = false; r.maxAlternatives = 3;
    r.onresult = function (e) {
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        var alts = [];
        for (var j = 0; j < e.results[i].length; j++) alts.push(e.results[i][j].transcript);
        heard(alts);
      }
    };
    r.onerror = function (ev) {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { st.on = false; stopRec(); setUi(); speak(t('denied')); }
    };
    r.onend = function () { st.rec = null; if (st.on && !st.busy && !(window.speechSynthesis && window.speechSynthesis.speaking)) setTimeout(startRec, 300); };
    try { r.start(); st.rec = r; setStatus(st.awake ? 'stListen' : 'stWait'); } catch (e) { st.rec = null; }
    return true;
  }
  function stopRec() {
    var r = st.rec; st.rec = null;
    if (r) { r.onend = null; r.onresult = null; try { r.abort(); } catch (e) { /* ignore */ } }
  }

  function heard(alts) {
    resetIdle();
    var text = alts[0] || '';
    var wakeText = alts.filter(function (a) { return CFG.wake.test(a); })[0];
    if (st.awake && !wakeText) { endAwake(); process(text); return; }
    if (wakeText) {
      var m = wakeText.match(CFG.wake);
      var rest = wakeText.slice(m.index + m[0].length).replace(/^[\s,.!?\-]+/, '');
      cancelSpeech(); beep([880, 1175]);
      if (rest.length > 2) { endAwake(); process(rest); return; }
      st.awake = true; setStatus('stListen');
      clearTimeout(st.awakeTimer);
      st.awakeTimer = setTimeout(endAwake, 9000);
    }
  }
  function endAwake() { st.awake = false; clearTimeout(st.awakeTimer); setStatus(st.on ? 'stWait' : 'stOff'); }

  /* ------------------------------ understanding -------------------------- */
  function process(q) {
    q = (q || '').trim();
    if (!q) return;
    if (STOP.test(q)) { cancelSpeech(); return; }
    var a = A();
    if (EMERGENCY.test(q)) {
      if (a && a.announce) a.announce(t('emergency'), 'severe'); else speak(t('emergency'));
      stopRec(); waitQuiet(function () { if (st.on) startRec(); });
      return;
    }
    var city = q.match(CITY);
    if (city && a) { stopRec(); a.command('change city to ' + city[1]); waitQuiet(function () { if (st.on) startRec(); }); return; }
    var id = a && a.intent ? a.intent(q) : null;
    var short = q.split(/\s+/).length <= 5;
    if (a && id && (LOCAL_INTENTS[id] && short || !CFG.ask)) { stopRec(); a.command(q); waitQuiet(function () { if (st.on) startRec(); }); return; }
    if (!CFG.ask) { speak(t('noAi')); return; }
    ask(q);
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

  /* ------------------------------ on / off ------------------------------- */
  function resetIdle() {
    clearTimeout(st.idleTimer);
    if (!st.on || !CFG.idleMinutes) return;
    st.idleTimer = setTimeout(function () { turnOff(false); speak(t('paused')); }, CFG.idleMinutes * 60000);
  }
  function turnOn(first) {
    st.on = true; try { localStorage.setItem(PREF, '1'); } catch (e) { /* ignore */ }
    setUi(); resetIdle();
    speak(first === false ? t('on') : t('on') + ' ' + t('disclosure'));
  }
  function turnOff(say) {
    st.on = false; st.awake = false; stopRec(); cancelSpeech();
    try { localStorage.setItem(PREF, '0'); } catch (e) { /* ignore */ }
    clearTimeout(st.idleTimer); setUi();
    if (say !== false) speak(t('off'));
  }
  function toggle() { if (st.on) turnOff(); else turnOn(); }

  /* --------------------------------- UI ---------------------------------- */
  function setStatus(key) { if (ui.pill) ui.pill.textContent = t(key); }
  function setUi() {
    if (!ui.btn) return;
    ui.btn.setAttribute('aria-pressed', st.on ? 'true' : 'false');
    ui.btn.setAttribute('aria-label', t('btn') + ': ' + (st.on ? 'on' : 'off'));
    ui.btn.style.background = st.on ? '#16a34a' : '#0f172a';
    ui.pill.style.display = st.on ? 'block' : 'none';
    setStatus(st.on ? 'stWait' : 'stOff');
  }
  function init() {
    var s = document.createElement('style');
    s.textContent = '.av-btn{position:fixed;right:12px;bottom:276px;z-index:99990;width:52px;height:52px;border-radius:26px;border:2px solid #fff;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
      '.av-pill{position:fixed;left:50%;transform:translateX(-50%);top:8px;z-index:99970;background:#0f172a;color:#fff;border:2px solid #fff;border-radius:999px;padding:6px 14px;font:700 13px system-ui,sans-serif;display:none}';
    document.head.appendChild(s);
    ui.btn = document.createElement('button'); ui.btn.className = 'av-btn'; ui.btn.textContent = '🎙';
    ui.btn.addEventListener('click', toggle);
    ui.pill = document.createElement('div'); ui.pill.className = 'av-pill'; ui.pill.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ui.btn); document.body.appendChild(ui.pill);
    setUi();
    document.addEventListener('keydown', function (e) { if (e.altKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) toggle(); });
    // Returning users: browsers need one tap before audio/mic can start, so the first tap anywhere resumes the assistant.
    var was = ''; try { was = localStorage.getItem(PREF); } catch (e) { /* ignore */ }
    if (was === '1') {
      var resume = function (ev) {
        document.removeEventListener('pointerdown', resume, true); document.removeEventListener('keydown', resume, true);
        if (!st.on && ev.target !== ui.btn) turnOn(false);
      };
      document.addEventListener('pointerdown', resume, true); document.addEventListener('keydown', resume, true);
    }
    new MutationObserver(function () { setUi(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  window.AirCastAssistant = {
    configure: function (o) { Object.keys(o || {}).forEach(function (k) { CFG[k] = o[k]; }); },
    start: function () { if (!st.on) turnOn(); },
    stop: function () { if (st.on) turnOff(); },
    ask: function (q) { process(q); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
