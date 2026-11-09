/* SAM SKIN — cookie consent (local only, no third-party tags) */
(function () {
  'use strict';

  var STORAGE_KEY = 'sam_skin_cookie_consent';
  var VERSION = 1;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== VERSION) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function write(consent) {
    var payload = {
      v: VERSION,
      essential: true,
      analytics: !!consent.analytics,
      experience: !!consent.experience,
      ts: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('sam:cookie-consent', { detail: payload }));
    return payload;
  }

  var root = document.getElementById('cookieConsent');
  if (!root) return;

  var card = root.querySelector('.ck__card');
  var prefs = document.getElementById('ckPrefs');
  var prefsOpen = document.getElementById('ckPrefsOpen');
  var btnAll = document.getElementById('ckAcceptAll');
  var btnEssential = document.getElementById('ckEssential');
  var btnSave = document.getElementById('ckSavePrefs');
  var toggleAnalytics = document.getElementById('ckToggleAnalytics');
  var toggleExperience = document.getElementById('ckToggleExperience');

  function setToggle(el, on) {
    if (!el) return;
    el.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function closeBanner() {
    root.classList.remove('is-visible');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-cookie-open');
    var hide = function () {
      root.hidden = true;
    };
    if (reduce) {
      hide();
      return;
    }
    setTimeout(hide, 650);
  }

  function openBanner() {
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-cookie-open');
    requestAnimationFrame(function () {
      root.classList.add('is-visible');
    });
  }

  function applyConsent(consent) {
    write(consent);
    if (prefs) prefs.hidden = true;
    if (prefsOpen) prefsOpen.setAttribute('aria-expanded', 'false');
    closeBanner();
  }

  if (btnAll) {
    btnAll.addEventListener('click', function () {
      applyConsent({ analytics: true, experience: true });
    });
  }

  if (btnEssential) {
    btnEssential.addEventListener('click', function () {
      applyConsent({ analytics: false, experience: false });
    });
  }

  if (prefsOpen && prefs) {
    prefsOpen.addEventListener('click', function () {
      var open = prefs.hidden;
      prefs.hidden = !open;
      prefsOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function wireToggle(btn) {
    if (!btn || btn.disabled) return;
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-checked') !== 'true';
      setToggle(btn, on);
    });
  }

  wireToggle(toggleAnalytics);
  wireToggle(toggleExperience);

  if (btnSave) {
    btnSave.addEventListener('click', function () {
      applyConsent({
        analytics: toggleAnalytics && toggleAnalytics.getAttribute('aria-checked') === 'true',
        experience: toggleExperience && toggleExperience.getAttribute('aria-checked') === 'true'
      });
    });
  }

  window.SamCookies = {
    getConsent: read,
    open: function () {
      var c = read();
      if (c) {
        setToggle(toggleAnalytics, !!c.analytics);
        setToggle(toggleExperience, !!c.experience);
      } else {
        setToggle(toggleAnalytics, false);
        setToggle(toggleExperience, false);
      }
      if (prefs) prefs.hidden = true;
      if (prefsOpen) prefsOpen.setAttribute('aria-expanded', 'false');
      openBanner();
    },
    reset: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) { /* ignore */ }
      setToggle(toggleAnalytics, false);
      setToggle(toggleExperience, false);
      openBanner();
    }
  };

  var ftCookie = document.getElementById('ftCookie');
  if (ftCookie) {
    ftCookie.addEventListener('click', function () {
      window.SamCookies.open();
    });
  }

  var existing = read();
  if (existing) {
    document.dispatchEvent(new CustomEvent('sam:cookie-consent', { detail: existing }));
    return;
  }

  setToggle(toggleAnalytics, false);
  setToggle(toggleExperience, false);

  function scheduleFirstShow() {
    var delay = reduce ? 0 : 380;
    var run = function () {
      setTimeout(openBanner, delay);
    };
    var loaderP = window.__samLoaderPromise;
    if (loaderP && typeof loaderP.then === 'function') loaderP.then(run);
    else run();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleFirstShow, { once: true });
  } else {
    scheduleFirstShow();
  }
})();
