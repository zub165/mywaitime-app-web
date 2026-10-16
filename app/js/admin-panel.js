/**
 * Minimal Admin Panel controller for ER Wait Time.
 * Requires an authenticated admin session (is_staff / role=admin).
 */
(function () {
    const host = (typeof location !== 'undefined' && location.hostname) || '';
    const productionApi = host.includes('mywaitime.com') || host.includes('mywaittime.com') || host.includes('github.io');
    const API = productionApi ? 'https://api.mywaitime.com/api' : '/api';

    function getSession() {
        if (window.AuthService) return window.AuthService.getSession();
        try {
            return JSON.parse(localStorage.getItem('er-wait-user') || localStorage.getItem('user') || 'null');
        } catch (_) {
            return null;
        }
    }

    function authHeaders() {
        const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
        const token = localStorage.getItem('authToken');
        if (token) headers.Authorization = `Token ${token}`;
        return headers;
    }

    async function apiGet(path) {
        const res = await fetch(`${API}${path}`, { headers: authHeaders(), credentials: 'same-origin' });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    }

    async function apiPost(path, body) {
        const res = await fetch(`${API}${path}`, {
            method: 'POST',
            headers: authHeaders(),
            credentials: 'same-origin',
            body: JSON.stringify(body || {}),
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    }

    function requireAdmin() {
        const user = getSession();
        const isAdmin = user && (user.role === 'admin' || user.is_staff || user.is_superuser);
        if (!isAdmin) {
            alert('Admin login required.');
            window.location.href = 'smart-login.html';
            return null;
        }
        return user;
    }

    function showSection(name) {
        document.querySelectorAll('[id$="-section"]').forEach((el) => el.classList.add('hidden'));
        const target = document.getElementById(`${name}-section`);
        if (target) target.classList.remove('hidden');
        document.querySelectorAll('.sidebar-menu a').forEach((a) => {
            a.classList.toggle('active', a.getAttribute('data-section') === name);
        });
    }

    async function loadDashboard() {
        const stats = await apiGet('/admin/dashboard/stats/').catch(() => null);
        const alt = await apiGet('/dashboard/activity/').catch(() => null);
        const users = await apiGet('/admin/users/').catch(() => apiGet('/dashboard/users/'));

        const totalUsers = users?.data?.data?.length || users?.data?.users?.length ||
            users?.data?.count || document.getElementById('totalUsers')?.textContent || '-';

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val ?? '-';
        };

        const s = stats?.data?.data || stats?.data || {};
        setText('totalUsers', s.total_users ?? totalUsers);
        setText('totalDoctors', s.total_doctors ?? '-');
        setText('totalHospitals', s.total_hospitals ?? '-');
        setText('totalAdmins', s.total_admins ?? '-');

        if (alt?.data) {
            console.log('Dashboard activity', alt.data);
        }
    }

    async function loadUsersTable() {
        const table = document.querySelector('#usersTable tbody') || document.querySelector('#usersTable');
        if (!table) return;
        const { data, ok } = await apiGet('/admin/users/');
        const fallback = ok ? data : (await apiGet('/dashboard/users/')).data;
        const list = fallback?.data || fallback?.users || fallback || [];
        const rows = Array.isArray(list) ? list : [];
        const body = document.querySelector('#usersTable tbody');
        if (!body) return;
        body.innerHTML = rows.map((u) => `
            <tr>
                <td>${u.id || u.user_id || ''}</td>
                <td>${u.username || ''}</td>
                <td>${u.email || ''}</td>
                <td>${u.role || (u.is_staff ? 'admin' : 'user')}</td>
                <td>${u.is_active === false ? 'Inactive' : 'Active'}</td>
            </tr>
        `).join('') || '<tr><td colspan="5">No users found or API unavailable</td></tr>';
    }

    window.logout = function logout() {
        if (window.AuthService) window.AuthService.clearSession();
        else {
            ['er-wait-user', 'user', 'userRole', 'isAuthenticated', 'authToken'].forEach((k) => localStorage.removeItem(k));
        }
        fetch(`${API}/auth/logout/`, { method: 'POST', headers: authHeaders(), credentials: 'same-origin' }).catch(() => {});
        window.location.href = 'smart-login.html';
    };

    window.showAddDoctorModal = function () {
        alert('Use Smart Login → Doctor role, or Doctor Registration page, to add doctors.');
    };

    window.showAddAdminModal = async function () {
        const email = prompt('New admin email:');
        if (!email) return;
        const full_name = prompt('Full name:') || 'Admin';
        const password = prompt('Temporary password (min 8, mixed):') || 'Admin123!';
        const { data, ok } = await apiPost('/admin/create-admin/', { email, full_name, password });
        alert(ok && data.status === 'success'
            ? `Admin created: ${data.admin?.username || email}`
            : (data.message || 'Failed to create admin (superuser required)'));
    };

    window.exportData = async function (format, type) {
        const { data, ok } = await apiGet(`/admin/export/?format=${encodeURIComponent(format)}&type=${encodeURIComponent(type)}`);
        alert(ok ? 'Export requested. Check response in console.' : (data.message || 'Export failed'));
        console.log('Export result', data);
    };

    document.addEventListener('DOMContentLoaded', async () => {
        const user = requireAdmin();
        if (!user) return;

        const nameEl = document.getElementById('adminName');
        if (nameEl) nameEl.textContent = user.full_name || user.username || user.email || 'Admin';

        document.querySelectorAll('.sidebar-menu a').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const section = a.getAttribute('data-section') || 'dashboard';
                showSection(section);
                if (section === 'users') loadUsersTable();
                if (section === 'dashboard') loadDashboard();
            });
        });

        showSection('dashboard');
        await loadDashboard();
    });
})();
