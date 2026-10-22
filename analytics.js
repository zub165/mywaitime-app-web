/* ER Wait Time — site analytics + store-link tagging.
   - Fires GA4 page_view and store_click events when a GA4 measurement ID is set.
   - Tags every outbound store link with UTM params so ad platforms can attribute installs.
   - Works without GA4: events are queued in localStorage and mirrored to
     window.ERW_TRACK_ENDPOINT when that endpoint is configured.
*/
(function () {
  'use strict';

  var CONFIG = window.ERW_ANALYTICS || {};
  var GA_ID = CONFIG.ga4Id || '';
  var ENDPOINT = CONFIG.endpoint || '';
  var STORE_LINKS = {
    play: 'https://play.google.com/store/apps/details?id=com.easytechnologiez.ERTime',
    apple: 'https://apps.apple.com/ca/app/er-wait-time-emergency-wait/id1477437465'
  };

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function platform() {
    if (isIos()) return 'ios';
    if (/android/i.test(navigator.userAgent)) return 'android';
    return 'web';
  }

  function storeUrl() {
    return platform() === 'ios' ? STORE_LINKS.apple : STORE_LINKS.play;
  }

  function utm(link) {
    try {
      var u = new URL(link.href, window.location.href);
      if (u.hostname.indexOf('play.google.com') === -1 && u.hostname.indexOf('apps.apple.com') === -1) return link.href;
      u.searchParams.set('utm_source', 'mywaitime_web');
      u.searchParams.set('utm_medium', 'organic');
      u.searchParams.set('utm_campaign', 'web_store_click');
      u.searchParams.set('utm_content', link.dataset.storeContent || 'unknown');
      return u.toString();
    } catch (e) {
      return link.href;
    }
  }

  function queue(event) {
    try {
      var key = 'erw_events';
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(event);
      localStorage.setItem(key, JSON.stringify(list.slice(-200)));
    } catch (e) { /* storage unavailable */ }
  }

  function post(event) {
    if (!ENDPOINT) return;
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, JSON.stringify(event));
      } else {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true
        });
      }
    } catch (e) { /* ignore */ }
  }

  function track(event, params) {
    var payload = Object.assign({
      event: event,
      page: window.location.pathname,
      platform: platform(),
      ts: new Date().toISOString()
    }, params || {});
    queue(payload);
    post(payload);
    if (GA_ID && window.gtag) {
      window.gtag('event', event, Object.assign({ platform: payload.platform }, params || {}));
    }
    if (window.dataLayer) window.dataLayer.push(payload);
  }

  function initGa() {
    if (!GA_ID) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  function tagStoreLinks() {
    var links = document.querySelectorAll('a[href*="play.google.com"], a[href*="apps.apple.com"]');
    Array.prototype.forEach.call(links, function (a) {
      if (a.hasAttribute('data-store-auto')) {
        a.href = storeUrl();
      }
      a.href = utm(a);
      a.addEventListener('click', function () {
        track('store_click', {
          store: a.href.indexOf('apps.apple.com') > -1 ? 'app_store' : 'google_play',
          content: a.dataset.storeContent || 'unknown',
          placement: a.dataset.storePlacement || 'unknown'
        });
      });
    });
  }

  function wireInstallButtons() {
    var buttons = document.querySelectorAll('[data-store-content]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        track('install_cta_click', {
          content: b.dataset.storeContent || 'unknown',
          placement: b.dataset.storePlacement || 'unknown'
        });
      });
    });
  }

  window.ERW_TRACK = { track: track, storeUrl: storeUrl, platform: platform, queue: queue };

  function boot() {
    initGa();
    tagStoreLinks();
    wireInstallButtons();
    track('page_view', { referrer: document.referrer || 'direct' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
