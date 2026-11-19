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
