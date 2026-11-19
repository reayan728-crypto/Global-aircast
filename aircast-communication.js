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
