/* ER Wait Time — mobile install prompt (bottom sheet).
   Shows on phones/tablets only, once per 14 days, and never when the site is
   already running as an installed app. Uses ERW_TRACK for attribution.
*/
(function () {
  'use strict';

  var DISMISS_KEY = 'erw_install_dismissed_at';
  var DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
  var DELAY_MS = 6000;

  var PLAY = 'https://play.google.com/store/apps/details?id=com.easytechnologiez.ERTime';
  var IOS = 'https://apps.apple.com/ca/app/er-wait-time-emergency-wait/id1477437465';
  var ICON = '/icon-192.png';

  function isMobile() {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function dismissedRecently() {
    try {
      var at = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      return !!at && (Date.now() - at) < DISMISS_MS;
    } catch (e) {
      return false;
    }
  }

  function markDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* ignore */ }
  }

  function track(event, params) {
    if (window.ERW_TRACK && window.ERW_TRACK.track) window.ERW_TRACK.track(event, params || {});
  }

  function build() {
    var store = isIos() ? IOS : PLAY;
    var label = isIos() ? 'Download on the App Store' : 'Get it on Google Play';
    var wrap = document.createElement('div');
    wrap.id = 'erw-install-sheet';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Get the ER Wait Time app');
    wrap.innerHTML =
      '<div class="erw-install-inner">' +
      '<button class="erw-install-close" aria-label="Close">&times;</button>' +
      '<img class="erw-install-icon" src="' + ICON + '" alt="ER Wait Time">' +
      '<div class="erw-install-copy">' +
      '<strong>Get the ER Wait Time app</strong>' +
      '<span>Live ER wait times, ratings and reviews — with directions and offline access.</span>' +
      '</div>' +
      '<a class="erw-install-cta" href="' + store + '" data-store-content="install_sheet" data-store-placement="install_sheet" target="_blank" rel="noopener noreferrer">' + label + '</a>' +
      '</div>';
    document.body.appendChild(wrap);

    var close = function (reason) {
      wrap.classList.remove('erw-install-show');
      setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 300);
      markDismissed();
      track('install_prompt_dismissed', { reason: reason || 'close' });
    };

    wrap.querySelector('.erw-install-close').addEventListener('click', function () { close('close'); });
    wrap.querySelector('.erw-install-cta').addEventListener('click', function () { track('install_prompt_click', { content: 'install_sheet' }); });

    if (window.ERW_TRACK) {
      window.ERW_TRACK.track('install_prompt_shown', { content: 'install_sheet' });
    }

    requestAnimationFrame(function () { wrap.classList.add('erw-install-show'); });
  }

  function show() {
    if (!isMobile() || isStandalone() || dismissedRecently()) return;
    if (document.getElementById('erw-install-sheet')) return;
    build();
  }

  function boot() {
    if (!isMobile() || isStandalone() || dismissedRecently()) return;
    setTimeout(show, DELAY_MS);
    window.addEventListener('scroll', function onScroll() {
      var h = document.body.scrollHeight - window.innerHeight;
      if (h > 0 && (window.scrollY / h) > 0.55) {
        window.removeEventListener('scroll', onScroll);
        show();
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
