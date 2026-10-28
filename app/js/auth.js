/**
 * Shared authentication helpers for ER Wait Time.
 * Keeps localStorage keys consistent across index, smart-login, and doctor registration.
 */
(function (global) {
    function resolveApiBase() {
        const host = (global.location && global.location.hostname) || '';
        // GitHub Pages / production custom domain cannot use same-origin /api proxy
        if (host.includes('mywaitime.com') || host.includes('mywaittime.com') || host.includes('github.io')) {
            return 'https://api.mywaitime.com/api';
        }
        return '/api';
    }
    const API_BASE = resolveApiBase();
    const USER_KEY = 'er-wait-user';
    const LEGACY_USER_KEY = 'user';
    const ROLE_KEY = 'userRole';
    const AUTH_FLAG = 'isAuthenticated';
    const TOKEN_KEY = 'authToken';
    const ROLE_BY_EMAIL_KEY = 'er-wait-role-by-email';
    const PAID_KEY = 'er-wait-paid';

    function normalizeRole(role) {
        const r = String(role || 'user').toLowerCase().trim();
        if (r === 'patient' || r === 'member') return 'user';
        if (r === 'administrator' || r === 'superadmin' || r === 'super_admin') return 'admin';
        if (['user', 'doctor', 'admin'].includes(r)) return r;
        return 'user';
    }

    function rememberRoleForEmail(email, role) {
        if (!email || !role) return;
        try {
            const map = JSON.parse(localStorage.getItem(ROLE_BY_EMAIL_KEY) || '{}');
            map[String(email).toLowerCase()] = normalizeRole(role);
            localStorage.setItem(ROLE_BY_EMAIL_KEY, JSON.stringify(map));
        } catch (_) { /* ignore */ }
    }

    function recalledRoleForEmail(email) {
        if (!email) return null;
        try {
            const map = JSON.parse(localStorage.getItem(ROLE_BY_EMAIL_KEY) || '{}');
            return map[String(email).toLowerCase()] || null;
        } catch (_) {
            return null;
        }
    }

    function saveSession(user) {
        if (!user) return null;
        const role = normalizeRole(user.role || recalledRoleForEmail(user.email) || 'user');
        const payload = {
            id: user.id || user.user_id,
            user_id: user.user_id || user.id,
            username: user.username || '',
            email: user.email || '',
            full_name: user.full_name || user.fullName ||
                [user.first_name, user.last_name].filter(Boolean).join(' ') ||
                user.username || user.email || 'User',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            role,
            token: user.token || localStorage.getItem(TOKEN_KEY) || null,
            is_staff: Boolean(user.is_staff),
            is_superuser: Boolean(user.is_superuser),
        };

        localStorage.setItem(USER_KEY, JSON.stringify(payload));
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(payload));
        localStorage.setItem(ROLE_KEY, payload.role);
        localStorage.setItem(AUTH_FLAG, 'true');
        if (payload.token) {
            localStorage.setItem(TOKEN_KEY, payload.token);
        }
        if (payload.email) {
            rememberRoleForEmail(payload.email, payload.role);
        }
        return payload;
    }

    function clearSession() {
        [USER_KEY, LEGACY_USER_KEY, ROLE_KEY, AUTH_FLAG, TOKEN_KEY, PAID_KEY].forEach((k) => localStorage.removeItem(k));
    }

    function cachePaid(allowed) {
        try {
            localStorage.setItem(PAID_KEY, allowed ? 'true' : 'false');
        } catch (_) { /* ignore */ }
    }

    function authHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
        const session = getSession();
        const token = (session && session.token) || localStorage.getItem(TOKEN_KEY);
        if (token) headers.Authorization = `Token ${token}`;
        return headers;
    }

    async function apiAuth(path, { method = 'GET', body } = {}) {
        const response = await fetch(`${API_BASE}${path}`, {
            method,
            headers: authHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        let result = {};
        try {
            result = await response.json();
        } catch (_) {
            result = { status: 'error', message: `HTTP ${response.status}` };
        }
        return { ok: response.ok, status: response.status, result };
    }

    function userBypassesPaywall(user) {
        if (!user) return false;
        if (user.is_staff || user.is_superuser) return true;
        return normalizeRole(user.role) === 'admin';
    }

    async function getBillingStatus() {
        const { ok, result } = await apiAuth('/billing/status/');
        const data = (result && result.data) || {};
        const allowed = Boolean(ok && result.status === 'success' && data.access_allowed);
        cachePaid(allowed);
        return {
            success: ok && result.status === 'success',
            access_allowed: allowed,
            data,
            message: result.message,
        };
    }

    async function startCheckout() {
        const origin = (global.location && global.location.origin) || 'https://mywaitime.com';
        const pathPrefix = (global.location && (global.location.pathname || '').startsWith('/app')) ? '/app/' : '/';
        const base = `${origin}${pathPrefix}index.html`;
        const { ok, result } = await apiAuth('/billing/checkout/', {
            method: 'POST',
            body: {
                success_url: `${base}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${base}?checkout=cancel`,
            },
        });
        if (result && result.already_paid) {
            cachePaid(true);
            return { success: true, already_paid: true, data: result.data };
        }
        if (ok && result.status === 'success' && result.checkout_url) {
            return { success: true, checkout_url: result.checkout_url, session_id: result.session_id };
        }
        return { success: false, message: (result && result.message) || 'Could not start checkout' };
    }

    async function confirmCheckout(sessionId) {
        const { ok, result } = await apiAuth('/billing/confirm/', {
            method: 'POST',
            body: { session_id: sessionId },
        });
        const data = (result && result.data) || {};
        const allowed = Boolean(ok && result.status === 'success' && data.access_allowed);
        cachePaid(allowed);
        return {
            success: allowed,
            access_allowed: allowed,
            data,
            message: result.message,
        };
    }

    function getSession() {
        try {
            const raw = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
            if (!raw) return null;
            const user = JSON.parse(raw);
            if (!user || (!user.email && !user.username && !user.user_id && !user.id)) return null;
            return saveSession(user);
        } catch (_) {
            return null;
        }
    }

    async function apiPost(path, body) {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify(body || {}),
        });
        let result = {};
        try {
            result = await response.json();
        } catch (_) {
            result = { status: 'error', message: `HTTP ${response.status}` };
        }
        return { ok: response.ok, status: response.status, result };
    }

    async function login({ email, username, password }) {
        const identifier = (email || username || '').trim();
        if (!identifier || !password) {
            return { success: false, message: 'Email/username and password are required' };
        }

        const { result } = await apiPost('/auth/login/', {
            email: identifier.includes('@') ? identifier : undefined,
            username: identifier.includes('@') ? undefined : identifier,
            password,
        });

        if (result.status === 'success' && result.data) {
            const recalled = recalledRoleForEmail(result.data.email || identifier);
            const role = normalizeRole(
                result.data.role === 'user' && recalled ? recalled : (result.data.role || recalled || 'user')
            );
            const user = saveSession({ ...result.data, role });
            return { success: true, user, message: result.message || 'Login successful' };
        }
        return { success: false, message: result.message || 'Login failed', errors: result.errors };
    }

    async function registerAccount(data) {
        const role = normalizeRole(data.role || 'user');
        const email = (data.email || '').trim();
        const password = data.password || '';
        const fullName = (data.full_name || data.fullName || '').trim();
        const username = (data.username || '').trim() ||
            (email ? email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30) : '');

        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }
        if (role === 'admin') {
            return {
                success: false,
                message: 'Admin accounts cannot be self-registered. Ask an existing admin to create one.',
            };
        }

        // Prefer enhanced register (assigns doctor group + welcome email).
        let { result } = await apiPost('/auth/enhanced-register/', {
            email,
            password,
            full_name: fullName || username || email,
            role: role === 'user' ? 'patient' : role,
            phone: data.phone || undefined,
            license_number: data.license || data.license_number || undefined,
            years_experience: data.years_experience || undefined,
            medical_school: data.medical_school || undefined,
            specialty: data.specialty || undefined,
        });

        // Fall back to role register, then basic register.
        if (result.status !== 'success') {
            const roleReg = await apiPost('/auth/register/role/', {
                username: username || `user_${Date.now()}`,
                email,
                password,
                role,
                first_name: data.first_name || (fullName ? fullName.split(' ')[0] : ''),
                last_name: data.last_name || (fullName ? fullName.split(' ').slice(1).join(' ') : ''),
                phone: data.phone || undefined,
            });
            result = roleReg.result;
        }

        if (result.status !== 'success') {
            const basic = await apiPost('/auth/register/', {
                username: username || `user_${Date.now()}`,
                email,
                password,
                role,
                first_name: data.first_name || (fullName ? fullName.split(' ')[0] : ''),
                last_name: data.last_name || (fullName ? fullName.split(' ').slice(1).join(' ') : ''),
                phone: data.phone || undefined,
            });
            result = basic.result;
        }

        if (result.status === 'success') {
            rememberRoleForEmail(email, role);
            const payload = result.data || result.user || {};
            return {
                success: true,
                data: { ...payload, email: payload.email || email, role: normalizeRole(payload.role || role) },
                message: result.message || 'Registration successful',
            };
        }

        const errDetail = result.errors ? JSON.stringify(result.errors) : '';
        return {
            success: false,
            message: errDetail ? `${result.message || 'Registration failed'}: ${errDetail}` : (result.message || 'Registration failed'),
            errors: result.errors,
        };
    }

    async function verifyRegistrationEmail(email, code) {
        const { result } = await apiPost('/auth/verify-registration-email/', {
            email: (email || '').trim(),
            code: String(code || '').replace(/\D/g, ''),
        });
        return {
            success: result.status === 'success',
            message: result.message || 'Email verification failed',
            errors: result.errors,
        };
    }

    async function resendRegistrationVerification(email) {
        const { result } = await apiPost('/auth/resend-registration-verification/', {
            email: (email || '').trim(),
        });
        return {
            success: result.status === 'success',
            message: result.message || 'Could not resend verification code',
        };
    }

    async function requestPasswordReset(email) {
        const { result } = await apiPost('/auth/password-reset/', { email: (email || '').trim() });
        if (result.status === 'success') {
            return { success: true, message: result.message };
        }
        return { success: false, message: result.message || 'Password reset request failed', errors: result.errors };
    }

    async function confirmPasswordReset({ uid, token, new_password, email, code }) {
        const body = { new_password };
        if (uid) body.uid = uid;
        if (token) body.token = token;
        if (email) body.email = String(email).trim();
        if (code) body.code = String(code).replace(/\D/g, '');
        const { result } = await apiPost('/auth/reset-password/', body);
        if (result.status === 'success') {
            return { success: true, message: result.message || 'Password reset successfully' };
        }
        let msg = result.message || 'Password reset failed';
        if (result.errors && typeof result.errors === 'object') {
            const parts = [];
            Object.values(result.errors).forEach((v) => {
                if (Array.isArray(v)) parts.push(...v.map(String));
                else if (v) parts.push(String(v));
            });
            if (parts.length) msg = parts.join(' ');
        }
        return { success: false, message: msg, errors: result.errors };
    }

    function redirectAfterAuth(user, { isNewUser } = {}) {
        const role = normalizeRole(user && user.role);
        // Keep everyone in the main app tabs; admin panel is optional
        if (isNewUser && role === 'user') {
            window.location.href = 'index.html#registration';
            return;
        }
        window.location.href = 'index.html#er-wait';
    }

    global.AuthService = {
        API_BASE,
        USER_KEY,
        normalizeRole,
        saveSession,
        clearSession,
        getSession,
        login,
        registerAccount,
        verifyRegistrationEmail,
        resendRegistrationVerification,
        requestPasswordReset,
        confirmPasswordReset,
        rememberRoleForEmail,
        redirectAfterAuth,
        getBillingStatus,
        startCheckout,
        confirmCheckout,
        userBypassesPaywall,
        cachePaid,
        PAID_KEY,
    };
})(window);
