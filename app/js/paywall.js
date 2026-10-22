/**
 * ER Wait Time Premium — web paywall.
 *
 * Mirrors the in-app subscription (product `er_premium_monthly`, $3.99/month,
 * 7-day trial). The web app never takes payment: the primary button deep-links
 * to Google Play / the App Store so the purchase is handled by the store, and
 * the web app grants a matching 7-day trial so the feature stays usable.
 */

const PREMIUM_STATE_KEY = 'erw_premium_state';

const PREMIUM_DEFAULTS = {
    productId: 'er_premium_monthly',
    price: '$3.99',
    period: '/month',
    trialDays: 7,
    trialLabel: '7-day free trial',
    benefits: [
        'Ad-free experience',
        'Wait-time trends & alerts',
        'Unlimited favorites',
        'Export your data'
    ],
    storeLinks: {
        play: 'https://play.google.com/store/apps/details?id=com.easytechnologiez.ERTime',
        apple: 'https://apps.apple.com/ca/app/er-wait-time-emergency-wait/id1477437465'
    }
};

const PREMIUM_GATED_TABS = {
    records: {
        title: 'Medical Records is a Premium feature',
        body: 'Store and review your visit history, results and documents inside Premium.'
    }
};

class PremiumPaywall {
    constructor(config) {
        this.config = Object.assign({}, PREMIUM_DEFAULTS, config || {});
        this.overlay = null;
        this.onUnlock = null;
    }

    /**
     * Entitlement state (local): { active: bool, trialUntil: timestamp }
     */
    state() {
        try {
            return JSON.parse(localStorage.getItem(PREMIUM_STATE_KEY) || '{}') || {};
        } catch (e) {
            return {};
        }
    }

    saveState(state) {
        try {
            localStorage.setItem(PREMIUM_STATE_KEY, JSON.stringify(state));
        } catch (e) { /* storage unavailable */ }
    }

    isPremium() {
        const state = this.state();
        if (state.active) return true;
        return !!state.trialUntil && state.trialUntil > Date.now();
    }

    trialDaysLeft() {
        const state = this.state();
        if (!state.trialUntil) return 0;
        const left = Math.ceil((state.trialUntil - Date.now()) / 86400000);
        return left > 0 ? left : 0;
    }

    startTrial() {
        const state = this.state();
        state.trialUntil = Date.now() + this.config.trialDays * 86400000;
        this.saveState(state);
        this.track('paywall_trial_start', { trial_days: this.config.trialDays });
    }

    isGatedTab(tabName) {
        return Object.prototype.hasOwnProperty.call(PREMIUM_GATED_TABS, tabName);
    }

    /**
     * Returns true when the user may continue, false when the paywall was shown.
     */
    require(feature, options) {
        const opts = options || {};
        if (this.isPremium()) return true;
        this.show(feature, opts);
        return false;
    }

    open() {
        this.show('general', {});
    }

    platform() {
        if (window.ERW_TRACK && window.ERW_TRACK.platform) return window.ERW_TRACK.platform();
        const ua = navigator.userAgent || '';
        if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
        if (/android/i.test(ua)) return 'android';
        return 'web';
    }

    storeUrl(content) {
        const base = this.platform() === 'ios'
            ? this.config.storeLinks.apple
            : this.config.storeLinks.play;
        try {
            const url = new URL(base);
            url.searchParams.set('utm_source', 'mywaitime_web');
            url.searchParams.set('utm_medium', 'organic');
            url.searchParams.set('utm_campaign', 'paywall');
            url.searchParams.set('utm_content', content || 'paywall');
            return url.toString();
        } catch (e) {
            return base;
        }
    }

    track(event, params) {
        if (window.ERW_TRACK && window.ERW_TRACK.track) {
            window.ERW_TRACK.track(event, params || {});
        }
    }

    build(feature, options) {
        const opts = options || {};
        const gate = PREMIUM_GATED_TABS[feature] || {};
        const title = opts.title || gate.title || 'ER Wait Time Premium';
        const body = opts.body || gate.body || 'Go Premium to unlock the full ER Wait Time experience.';
        const benefits = this.config.benefits
            .map(item => '<li>' + item + '</li>')
            .join('');
        const trialLeft = this.trialDaysLeft();

        const overlay = document.createElement('div');
        overlay.className = 'erw-pw-overlay';
        overlay.innerHTML =
            '<div class="erw-pw-card" role="dialog" aria-modal="true">' +
            '<button class="erw-pw-close" aria-label="Close">&times;</button>' +
            '<span class="erw-pw-badge">Premium</span>' +
            '<h2 class="erw-pw-title">' + title + '</h2>' +
            '<p class="erw-pw-price"><strong>' + this.config.price + this.config.period + '</strong> · ' +
            this.config.trialLabel + (trialLeft > 0 ? ' (' + trialLeft + ' day' + (trialLeft === 1 ? '' : 's') + ' left)' : '') + '</p>' +
            '<p class="erw-pw-body">' + body + '</p>' +
            '<ul class="erw-pw-list">' + benefits + '</ul>' +
            '<a class="erw-pw-cta" id="erw-pw-subscribe" href="' + this.storeUrl(feature) + '" target="_blank" rel="noopener noreferrer">Subscribe in the app</a>' +
            '<button class="erw-pw-cta alt" id="erw-pw-trial">' + this.config.trialLabel + ' on the web</button>' +
            '<p class="erw-pw-note">Subscriptions are billed by Google Play or the App Store and can be cancelled there. ' +
            'Hospital searches and wait times stay free for everyone.</p>' +
            '</div>';

        overlay.querySelector('.erw-pw-close').addEventListener('click', () => this.close('close'));
        overlay.querySelector('#erw-pw-subscribe').addEventListener('click', () => {
            this.track('paywall_cta_click', { feature: feature, store: this.platform() === 'ios' ? 'app_store' : 'google_play' });
        });
        overlay.querySelector('#erw-pw-trial').addEventListener('click', () => {
            this.startTrial();
            this.close('trial');
            if (typeof this.onUnlock === 'function') this.onUnlock();
        });
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) this.close('backdrop');
        });

        return overlay;
    }

    show(feature, options) {
        if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
        this.onUnlock = (options && options.onUnlock) || null;
        this.overlay = this.build(feature, options);
        document.body.appendChild(this.overlay);
        this.track('paywall_view', { feature: feature });
    }

    close(reason) {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.track('paywall_dismiss', { reason: reason || 'close' });
    }
}

window.ERW_PAYWALL = new PremiumPaywall();
