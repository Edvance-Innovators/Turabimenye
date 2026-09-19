// account-bar.js — one account bar, one dropdown, used on every page.
(function () {
    'use strict';

    const ROLE_KEY   = 'wrzkk_user_role';
    const EMAIL_KEY  = 'wrzkk_user_email';
    const NAME_KEY   = 'wrzkk_user_name';
    const ID_KEY     = 'wrzkk_user_id';
    const AVATAR_KEY = 'wrzkk_user_avatar';
    const HIST_KEY   = 'wrzkk_search_history';
    const SAVED_KEY  = 'wrzkk_saved_matches';
    const MAX_HISTORY = 5;

    function role()  { return localStorage.getItem(ROLE_KEY)  || 'anonymous'; }
    function email() { return localStorage.getItem(EMAIL_KEY) || ''; }
    function name()  { return localStorage.getItem(NAME_KEY)  || ''; }
    function uid()   { return localStorage.getItem(ID_KEY)    || ''; }
    function isRegistered() { return role() === 'registered' && !!email(); }

    function label() {
        if (name()) return name();
        if (email()) return email().split('@')[0];
        return 'Uwihitira';
    }

    function initials() {
        return label().split(/\s+/).map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
    }

    // ---------- Avatar ----------
    function getAvatar() { return localStorage.getItem(AVATAR_KEY) || ''; }
    function setAvatar(url) {
        if (!url) localStorage.removeItem(AVATAR_KEY);
        else localStorage.setItem(AVATAR_KEY, url);
        paintAvatar();
    }
    function paintAvatar() {
        const el = document.getElementById('acctAvatar');
        if (!el) return;
        const url = getAvatar();
        if (url) {
            el.style.backgroundImage = `url(${url})`;
            el.textContent = '';
            el.classList.add('has-avatar');
        } else {
            el.style.backgroundImage = '';
            el.textContent = initials();
            el.classList.remove('has-avatar');
        }
    }
    function openAvatarPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            const file = input.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { alert('Ifoto ntarengwa 2MB.'); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = c.height = 128;
                    const ctx = c.getContext('2d');
                    const s = Math.min(img.width, img.height);
                    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
                    setAvatar(c.toDataURL('image/jpeg', 0.85));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    // ---------- History / Saved ----------
    function getHistory() {
        try { const r = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); return Array.isArray(r) ? r : []; }
        catch { return []; }
    }
    function pushHistory(entry) {
        if (!entry || !entry.query) return;
        const list = getHistory().filter(x =>
            !(x.type === entry.type && x.query.toLowerCase() === entry.query.toLowerCase()));
        list.unshift(entry);
        localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
        renderMenuLists();
    }
    function clearHistory() {
        localStorage.removeItem(HIST_KEY);
        renderMenuLists();
    }
    function getSaved() {
        try { const r = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); return Array.isArray(r) ? r : []; }
        catch { return []; }
    }
    function saveMatch(m) {
        if (!m || !m.target) return false;
        const list = getSaved();
        const id = `${m.type}:${m.target}:${m.source || ''}`;
        if (list.some(x => x.id === id)) return false;
        list.unshift({ ...m, id, savedAt: new Date().toISOString() });
        localStorage.setItem(SAVED_KEY, JSON.stringify(list));
        renderMenuLists();
        return true;
    }
    function removeSaved(id) {
        const list = getSaved().filter(m => m.id !== id);
        localStorage.setItem(SAVED_KEY, JSON.stringify(list));
        renderMenuLists();
    }

    // ---------- Logout ----------
    function logout() {
        if (!confirm('Ushaka gusohoka?')) return;
        [ROLE_KEY, EMAIL_KEY, NAME_KEY, ID_KEY, 'wrzkk_session'].forEach(k => localStorage.removeItem(k));
        window.location.href = 'index.html';
    }

    // ---------- Login / Register (relay to existing modal if present) ----------
    function openLogin() {
        if (typeof window.showLoginModal === 'function') { window.showLoginModal(); return; }
        // If the page has no login modal (numerology/manager), go back to index
        window.location.href = 'index.html';
    }

    // ---------- Render menu lists ----------
    function renderMenuLists() {
        const histEl  = document.getElementById('acctHistoryList');
        const savedEl = document.getElementById('acctSavedList');
        if (histEl) {
            const list = getHistory();
            histEl.innerHTML = list.length
                ? list.map(h => {
                    const ic = h.type === 'name' ? '👤' : h.type === 'word' ? '📖' : '📍';
                    return `<li><a href="${h.link || '#'}">${ic} ${h.query}</a></li>`;
                }).join('')
                : '<li class="acct-empty">Nta mashakiro.</li>';
        }
        if (savedEl) {
            const list = getSaved();
            savedEl.innerHTML = list.length
                ? list.map(m => `
                    <li>
                        <span class="saved-name">${m.source || m.target}</span>
                        <span class="saved-meta">${m.note || ''}</span>
                        <button type="button" class="saved-del" data-id="${m.id}" title="Kuraho">✕</button>
                    </li>
                `).join('')
                : '<li class="acct-empty">Nta byabitswe.</li>';
            savedEl.querySelectorAll('.saved-del').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    removeSaved(btn.dataset.id);
                };
            });
        }
    }

    // ---------- Build the bar ----------
    function build() {
        if (document.getElementById('acctBar')) return;

        const bar = document.createElement('div');
        bar.id = 'acctBar';
        bar.className = 'acct-bar';
        bar.innerHTML = `
            <button type="button" class="acct-avatar" id="acctAvatar" title="Hindura ifoto"></button>
            <div class="acct-info">
                <span class="acct-name">${label()}</span>
                <span class="acct-role">${isRegistered() ? 'Konti' : 'Uwihitira'}</span>
            </div>
            <button type="button" class="acct-caret" id="acctCaret" aria-label="Fungura menu">▾</button>

            <div class="acct-menu" id="acctMenu" hidden>
                <div class="acct-menu-head">
                    <div class="acct-menu-avatar" id="acctMenuAvatar"></div>
                    <div>
                        <strong>${label()}</strong>
                        <span>${isRegistered() ? email() : 'Nta konti'}</span>
                    </div>
                </div>

                <ul class="acct-menu-links">
                    <li><a href="index.html">🏠 Ahabanza</a></li>
                    <li><a href="index.html#saved">📁 Ibyabitswe (${getSaved().length})</a></li>
                </ul>

                <div class="acct-menu-section">
                    <div class="acct-menu-title">
                        <span>🕘 Amashakiro 5 ya nyuma</span>
                        <button type="button" class="acct-menu-clear" id="acctHistoryClear">Kuraho</button>
                    </div>
                    <ul id="acctHistoryList"></ul>
                </div>

                <div class="acct-menu-section">
                    <div class="acct-menu-title">
                        <span>💾 Ibyabitswe mu konti</span>
                    </div>
                    <ul id="acctSavedList"></ul>
                </div>

                <div class="acct-menu-footer">
                    ${isRegistered()
                        ? `<button type="button" class="acct-menu-logout" id="acctLogout">🚪 Sohoka</button>`
                        : `<button type="button" class="acct-menu-login" id="acctLogin">🔐 Injira</button>`}
                </div>
            </div>
        `;
        document.body.appendChild(bar);

        // Avatar in bar
        const avatar = document.getElementById('acctAvatar');
        paintAvatar();
        avatar.onclick = (e) => { e.stopPropagation(); openAvatarPicker(); };
        // Mirror in menu head
        const menuAvatar = document.getElementById('acctMenuAvatar');
        if (menuAvatar) {
            menuAvatar.textContent = initials();
            menuAvatar.style.backgroundImage = getAvatar() ? `url(${getAvatar()})` : '';
            if (getAvatar()) menuAvatar.classList.add('has-avatar');
        }

        // Toggle
        const menu = document.getElementById('acctMenu');
        const caret = document.getElementById('acctCaret');
        const toggle = (e) => {
            if (e) e.stopPropagation();
            menu.hidden = !menu.hidden;
            caret.classList.toggle('open', !menu.hidden);
            if (!menu.hidden) renderMenuLists();
        };
        caret.onclick = toggle;
        avatar.onclick = (e) => { e.stopPropagation(); toggle(); };

        document.addEventListener('click', (e) => {
            if (!menu.hidden && !menu.contains(e.target) && !bar.contains(e.target)) {
                menu.hidden = true;
                caret.classList.remove('open');
            }
        });

        document.getElementById('acctHistoryClear').onclick = (e) => {
            e.stopPropagation();
            clearHistory();
        };

        const logoutBtn = document.getElementById('acctLogout');
        if (logoutBtn) logoutBtn.onclick = logout;
        const loginBtn = document.getElementById('acctLogin');
        if (loginBtn) loginBtn.onclick = openLogin;

        renderMenuLists();
    }

    // ---------- Public API ----------
    window.AccountBar = {
        build,
        isRegistered,
        label,
        getAvatar,
        setAvatar,
        pushHistory,
        clearHistory,
        getHistory,
        getSaved,
        saveMatch,
        removeSaved,
        logout
    };

    document.addEventListener('DOMContentLoaded', build);
})();