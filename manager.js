// ==================== MANAGER STATE ====================
let currentManager = null;
let users = [];
let allFlyers = [];
let messages = [];
let settings = {};
let globalFlyerStyle = localStorage.getItem('wrzkk_global_style') || 'classic';

// ==================== MANAGER CLOUD (SUPABASE) ====================
const MANAGERS_API = '/api/managers';
const SUPER_ADMIN_EMAIL = 'innovatorsedvance@gmail.com';

// In-memory mirror of the server-side manager list
let managerList = [];

function normalizeEmail(e) {
    return String(e || '').toLowerCase().trim();
}

function isEmailAllowedAsManager(email) {
    const target = normalizeEmail(email);
    if (!target) return false;
    return managerList.some(m => normalizeEmail(m.email) === target && m.is_active !== false);
}

function isSuperAdminEmail(email) {
    return normalizeEmail(email) === SUPER_ADMIN_EMAIL;
}

async function fetchManagersFromCloud() {
    try {
        const res = await fetch(MANAGERS_API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        managerList = Array.isArray(rows) ? rows : [];
        console.log(`☁️ Loaded ${managerList.length} managers from cloud`);
        return managerList;
    } catch (err) {
        console.warn('⚠️ Manager cloud load failed, using local fallback:', err.message);
        // Local fallback so the app still works if backend is down
        managerList = [{
            id: 'local_super',
            email: SUPER_ADMIN_EMAIL,
            name: 'Super Administrator',
            role: 'super_admin',
            is_active: true
        }];
        return managerList;
    }
}

async function addManagerToCloud(email, name, password, role = 'manager') {
    const body = {
        email: normalizeEmail(email),
        name: name || email.split('@')[0],
        password,
        role,
        is_active: true
    };
    const res = await fetch(MANAGERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const text = await res.text();
    if (!res.ok) {
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch {}
        throw new Error(msg);
    }
    let saved;
    try { saved = JSON.parse(text); } catch { throw new Error('Invalid JSON from cloud'); }
    // Refresh mirror
    await fetchManagersFromCloud();
    return saved;
}

async function removeManagerFromCloud(email) {
    const target = normalizeEmail(email);
    if (isSuperAdminEmail(target)) throw new Error('Cannot remove super admin');
    const res = await fetch(`${MANAGERS_API}?email=${encodeURIComponent(target)}`, {
        method: 'DELETE'
    });
    const text = await res.text();
    if (!res.ok) {
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch {}
        throw new Error(msg);
    }
    await fetchManagersFromCloud();
    return true;
}

async function updateManagerInCloud(id, updates) {
    const res = await fetch(MANAGERS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
    });
    const text = await res.text();
    if (!res.ok) {
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch {}
        throw new Error(msg);
    }
    let saved;
    try { saved = JSON.parse(text); } catch { throw new Error('Invalid JSON from cloud'); }
    await fetchManagersFromCloud();
    return saved;
}

/**
 * Login check: fetch the manager row for this email and compare passwords.
 * Returns the manager row (without exposing it elsewhere) or null.
 */
async function verifyManagerCredentials(email, password) {
    const target = normalizeEmail(email);
    try {
        const res = await fetch(`${MANAGERS_API}?email=${encodeURIComponent(target)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        const found = Array.isArray(rows) && rows[0];
        if (!found) return null;
        if (found.is_active === false) return { inactive: true };
        if (found.password !== password) return null;
        return found;
    } catch (err) {
        console.warn('verifyManagerCredentials error:', err.message);
        return null;
    }
}

// ==================== IMAGE HELPERS (manager) ====================
const MANAGER_FLYER_IMAGE = { width: 800, height: 450, maxFileMB: 5, quality: 0.82 };

function managerIsDataImageUrl(url) {
    return typeof url === 'string' && url.startsWith('data:image/');
}

function managerOptimizeRemoteFlyerUrl(url) {
    if (typeof url !== 'string') return url;
    if (url.includes('images.unsplash.com') && !url.includes('w=')) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}w=${MANAGER_FLYER_IMAGE.width}&h=${MANAGER_FLYER_IMAGE.height}&fit=crop`;
    }
    return url;
}

function managerParseUrl(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) return null;
    try {
        const u = new URL(trimmed);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        return u.href;
    } catch { return null; }
}

function managerResizeImageForFlyer(file) {
    return new Promise((resolve, reject) => {
        if (!file?.type?.startsWith('image/')) return reject(new Error('invalid'));
        if (file.size > MANAGER_FLYER_IMAGE.maxFileMB * 1024 * 1024) return reject(new Error('large'));

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const tw = MANAGER_FLYER_IMAGE.width;
                const th = MANAGER_FLYER_IMAGE.height;
                const canvas = document.createElement('canvas');
                canvas.width = tw;
                canvas.height = th;
                const ctx = canvas.getContext('2d');
                const dstAspect = tw / th;
                const srcAspect = img.width / img.height;
                let sx, sy, sw, sh;

                if (srcAspect > dstAspect) {
                    sh = img.height;
                    sw = sh * dstAspect;
                    sx = (img.width - sw) / 2;
                    sy = 0;
                } else {
                    sw = img.width;
                    sh = sw / dstAspect;
                    sx = 0;
                    sy = (img.height - sh) / 2;
                }

                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
                resolve(canvas.toDataURL('image/jpeg', MANAGER_FLYER_IMAGE.quality));
            };
            img.onerror = () => reject(new Error('load'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
    });
}

function managerUpdateFlyerImagePreview(src) {
    const img = document.getElementById('managerFlyerImagePreviewImg');
    const preview = document.getElementById('managerFlyerImagePreview');
    if (!img || !preview) return;
    if (src) {
        img.src = src;
        preview.classList.add('has-image');
    } else {
        img.removeAttribute('src');
        preview.classList.remove('has-image');
    }
}

async function managerHandleFlyerImageFileChange() {
    const fileInput = document.getElementById('editFlyerImageFile');
    const urlInput = document.getElementById('editFlyerImage');
    const file = fileInput?.files?.[0];
    if (!file) return;

    try {
        const dataUrl = await managerResizeImageForFlyer(file);
        if (urlInput) urlInput.value = dataUrl;
        managerUpdateFlyerImagePreview(dataUrl);
        alert('✅ Ifoto yahinduwe!');
    } catch (err) {
        if (err.message === 'large') alert('⚠️ Ifoto irarenze 5MB. Hitamo indi.');
        else alert('⚠️ Dosiye si ifoto.');
    } finally {
        fileInput.value = '';
    }
}

async function managerApplyFlyerImageUrl() {
    const urlInput = document.getElementById('editFlyerImage');
    const parsed = managerParseUrl(urlInput?.value);
    if (!parsed) return alert('⚠️ Shyiramo link yemewe (http:// cyangwa https://).');
    const optimized = managerOptimizeRemoteFlyerUrl(parsed);
    managerUpdateFlyerImagePreview(optimized);
    urlInput.value = optimized;
}

function managerClearFlyerImage() {
    const urlInput = document.getElementById('editFlyerImage');
    if (urlInput) urlInput.value = '';
    managerUpdateFlyerImagePreview('');
}

// ==================== DATA LOAD ====================
async function loadData() {
    users = JSON.parse(localStorage.getItem('wrzkk_users')) || [];
    allFlyers = JSON.parse(localStorage.getItem('wrzkk_all_flyers')) || [];
    messages = JSON.parse(localStorage.getItem('wrzkk_messages')) || [];
    settings = JSON.parse(localStorage.getItem('wrzkk_settings')) || { autoApprove: true, notifyOnReport: false };
    globalFlyerStyle = localStorage.getItem('wrzkk_global_style') || 'classic';

    await fetchManagersFromCloud();

    console.log('📊 Manager Data Loaded:', {
        users: users.length,
        flyers: allFlyers.length,
        managers: managerList.length
    });
}

// ==================== MANAGER EMAIL MANAGEMENT ====================
function renderManagerEmailsList() {
    const tbody = document.getElementById('managerEmailsTableBody');
    if (!tbody) return;

    if (!managerList.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999;padding:20px;">Loading…</td></tr>`;
        fetchManagersFromCloud().then(renderManagerEmailsList);
        return;
    }

    tbody.innerHTML = managerList.map((m, idx) => {
        const isSuper = m.role === 'super_admin' || isSuperAdminEmail(m.email);
        const status = m.last_active
            ? `✅ ${new Date(m.last_active).toLocaleString()}`
            : '⏳ Ntabwo yinjiye';
        const active = m.is_active !== false;
        return `<tr>
            <td>${idx + 1}</td>
            <td>${m.email} ${isSuper ? '👑' : ''}</td>
            <td>${isSuper ? '<strong>Super Admin</strong>' : 'Manager'}</td>
            <td style="font-size:0.85rem;color:#666;">
                ${status}<br>
                <span style="color:${active ? '#2ecc71' : '#e74c3c'};">
                    ${active ? '● Irakora' : '● Yahagaritswe'}
                </span>
            </td>
            <td>
                ${isSuper
                    ? '<span style="color:#999;font-size:0.85rem;">Ntushobora kuyikuraho</span>'
                    : `
                        <button class="action-btn" style="background:#f39c12;" onclick="toggleManagerActive('${m.id}', ${!active})">
                            <i>${active ? '⏸️' : '▶️'}</i> ${active ? 'Hagarika' : 'Ongera ukoreshe'}
                        </button>
                        <button class="action-btn delete" onclick="removeManagerEmail('${m.email}')">
                            <i>🗑️</i> Kuraho
                        </button>`
                }
            </td>
        </tr>`;
    }).join('');
}

async function addManagerEmailFromInput() {
    const input = document.getElementById('newManagerEmail');
    const email = normalizeEmail(input?.value);
    if (!email) return alert('Andika imeyili');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Imeyili itemewe');
    if (isEmailAllowedAsManager(email)) return alert('Iyi imeyili isanzwe iri mu bafite uburenganzira');

    const tempPassword = prompt('Shyiramo ijambo ry\'ibanga ry\'agateganyo kuri uyu manager:', 'manager123');
    if (tempPassword === null) return;
    if (!tempPassword || tempPassword.length < 4) return alert('Ijambo ry\'ibanga rigomba kugira nibura inyuguti 4');

    try {
        await addManagerToCloud(email, email.split('@')[0], tempPassword, 'manager');
        if (input) input.value = '';
        renderManagerEmailsList();
        alert(`✅ ${email} yongewe ku bafite uburenganzira bwa manager.\n\nIjambo ry'ibanga ry'agateganyo: ${tempPassword}\n\nBwira uyu muntu kurihindura nyuma yo kwinjira.`);
    } catch (err) {
        alert(`⚠️ Ntibyakunze: ${err.message}`);
    }
}

async function removeManagerEmail(email) {
    const target = normalizeEmail(email);
    if (isSuperAdminEmail(target)) return alert('Ntushobora gukuraho super admin');
    if (!confirm(`Kuraho ${target} mu bafite uburenganzira?`)) return;
    try {
        await removeManagerFromCloud(target);
        renderManagerEmailsList();
        alert(`✅ ${target} yakuweho`);
    } catch (err) {
        alert(`⚠️ Ntibyakunze: ${err.message}`);
    }
}

async function toggleManagerActive(id, makeActive) {
    try {
        await updateManagerInCloud(id, { is_active: makeActive });
        renderManagerEmailsList();
        alert(makeActive ? '✅ Konti yongeye gukora' : '✅ Konti yahagaritswe');
    } catch (err) {
        alert(`⚠️ Ntibyakunze: ${err.message}`);
    }
}

// ==================== STYLE MANAGEMENT ====================
function setGlobalFlyerStyle(style) {
    globalFlyerStyle = style;
    localStorage.setItem('wrzkk_global_style', style);

    document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector(`.style-option[data-style="${style}"]`)?.classList.add('active');

    const styleNames = { classic: '📘 Classic', modern: '✨ Modern', elegant: '🌟 Elegant' };
    const display = document.getElementById('currentStyleDisplay');
    if (display) display.innerHTML = styleNames[style];

    alert(`✅ Imisusire yahinduwe! Uru rugero: ${styleNames[style]}`);
}

function applyStyleToAllFlyers() {
    if (allFlyers.length === 0) {
        alert('Nta tuzingo two guhindura imisusire!');
        return;
    }

    allFlyers.forEach(flyer => { flyer.style = globalFlyerStyle; });

    localStorage.setItem('wrzkk_all_flyers', JSON.stringify(allFlyers));
    localStorage.setItem('wrzkk_flyers', JSON.stringify(allFlyers));

    loadFlyersGrid();
    updateStats();

    const styleNames = { classic: 'Classic', modern: 'Modern', elegant: 'Elegant' };
    alert(`✅ Imisusire ${styleNames[globalFlyerStyle]} yashyizwe kuri utuzingo ${allFlyers.length} twose!`);

    syncFlyersWithUsers();
}

// ==================== DATA SYNC ====================
function refreshAllData() {
    console.log('🔄 Refreshing all data...');

    users = JSON.parse(localStorage.getItem('wrzkk_users')) || [];
    allFlyers = JSON.parse(localStorage.getItem('wrzkk_all_flyers')) || [];
    messages = JSON.parse(localStorage.getItem('wrzkk_messages')) || [];

    const userFlyers = JSON.parse(localStorage.getItem('wrzkk_flyers')) || [];
    if (userFlyers.length > 0) {
        const flyerMap = new Map();
        allFlyers.forEach(f => flyerMap.set(f.id, f));
        userFlyers.forEach(f => { if (!flyerMap.has(f.id)) flyerMap.set(f.id, f); });
        allFlyers = Array.from(flyerMap.values());
        localStorage.setItem('wrzkk_all_flyers', JSON.stringify(allFlyers));
    }

    updateStats();
    loadUsersTable();
    loadFlyersGrid();
    loadMessages();
    renderManagerEmailsList();

    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.innerHTML = `✅ Byavuguruwe! ${allFlyers.length} Utuzingo.`;
        setTimeout(() => { statusEl.innerHTML = '✅ Iringanisha rirakora'; }, 3000);
    }
}

function syncFlyersWithUsers() {
    console.log('🔄 Syncing flyer counts with users...');

    const flyerCounts = {};
    allFlyers.forEach(flyer => { flyerCounts[flyer.userId] = (flyerCounts[flyer.userId] || 0) + 1; });

    users.forEach(user => { user.flyerCount = flyerCounts[user.id] || 0; });
    localStorage.setItem('wrzkk_users', JSON.stringify(users));

    localStorage.setItem('wrzkk_flyers', JSON.stringify(allFlyers));
    localStorage.setItem('wrzkk_global_style', globalFlyerStyle);

    loadUsersTable();
    loadFlyersGrid();

    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.innerHTML = `✅ Amahinduka yahunganyijwe! Utuzingo ${allFlyers.length}`;
        setTimeout(() => { statusEl.innerHTML = '✅ Iringanisha rirakora'; }, 3000);
    }
}

// ==================== MANAGER LOGIN ====================
async function managerLogin() {
    const email = normalizeEmail(document.getElementById('managerEmail').value);
    const password = document.getElementById('managerPassword').value;

    if (!email || !password) {
        alert('Andika imeyili n\'ijambo ry\'ibanga');
        return;
    }

    // Whitelist gate (from cloud) — super admin always allowed even if mirror is stale
    if (!isEmailAllowedAsManager(email) && !isSuperAdminEmail(email)) {
        alert('❌ Iyi imeyili ntiyemewe nka manager.');
        return;
    }

    const found = await verifyManagerCredentials(email, password);

    if (!found) {
        alert('❌ Imeyili cyangwa ijambo ry\'ibanga si byo');
        return;
    }
    if (found.inactive) {
        alert('❌ Konti yawe yahagaritswe n\'umuyobozi mukuru');
        return;
    }

    currentManager = {
        id: found.id,
        email: found.email,
        name: found.name || found.email.split('@')[0],
        role: found.role,
        password: found.password,
        lastActive: new Date().toISOString()
    };

    // Sync last_active back to the cloud (best-effort)
    updateManagerInCloud(found.id, { last_active: currentManager.lastActive })
        .catch(err => console.warn('Could not update last_active:', err.message));

    localStorage.setItem('wrzkk_manager', JSON.stringify(currentManager));
    localStorage.setItem('wrzkk_manager_session', 'active');

    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';

    const styleNames = { classic: '📘 Classic', modern: '✨ Modern', elegant: '🌟 Elegant' };
    const display = document.getElementById('currentStyleDisplay');
    if (display) display.innerHTML = styleNames[globalFlyerStyle] || 'Classic';
    document.querySelector(`.style-option[data-style="${globalFlyerStyle}"]`)?.classList.add('active');

    refreshAllData();
}

async function checkManagerAuth() {
    // 1. Prefer an existing site session if the email is an approved manager
    const siteRole  = localStorage.getItem('wrzkk_user_role');
    const siteEmail = (localStorage.getItem('wrzkk_user_email') || '').toLowerCase().trim();

    if (siteRole === 'registered' && siteEmail) {
        // Refresh the managers list from cloud so we have fresh approval data
        if (!managerList.length) await fetchManagersFromCloud();

        if (isEmailAllowedAsManager(siteEmail) || isSuperAdminEmail(siteEmail)) {
            // Adopt the site session as a manager session
            currentManager = {
                id: 'from_site_' + siteEmail,
                email: siteEmail,
                name: localStorage.getItem('wrzkk_user_name') || siteEmail.split('@')[0],
                role: isSuperAdminEmail(siteEmail) ? 'super_admin' : 'manager',
                password: '(from_site_session)',
                lastActive: new Date().toISOString()
            };
            localStorage.setItem('wrzkk_manager', JSON.stringify(currentManager));
            localStorage.setItem('wrzkk_manager_session', 'active');

            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            refreshAllData();
            console.log('✅ Manager session adopted from site login:', siteEmail);
            return true;
        }
    }

    // 2. Fall back to a stored manager session
    const session = localStorage.getItem('wrzkk_manager_session');
    const saved   = localStorage.getItem('wrzkk_manager');
    if (!session || !saved) return false;

    let m;
    try { m = JSON.parse(saved); } catch { return false; }

    if (!managerList.length) await fetchManagersFromCloud();

    if (!isEmailAllowedAsManager(m.email) && !isSuperAdminEmail(m.email)) {
        localStorage.removeItem('wrzkk_manager');
        localStorage.removeItem('wrzkk_manager_session');
        return false;
    }

    currentManager = m;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    refreshAllData();
    return true;
}

function managerLogout() {
    currentManager = null;
    localStorage.removeItem('wrzkk_manager');
    localStorage.removeItem('wrzkk_manager_session');
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

// ==================== DASHBOARD ====================
function updateStats() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalFlyers').textContent = allFlyers.length;
    document.getElementById('pendingMessages').textContent = messages.filter(m => !m.read).length;
    const today = new Date().toDateString();
    const activeToday = users.filter(u => u.lastActive && new Date(u.lastActive).toDateString() === today).length;
    document.getElementById('activeUsers').textContent = activeToday || 0;
}

function loadUsersTable(filter = '') {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    let filteredUsers = users;
    if (filter) {
        filteredUsers = users.filter(u =>
            (u.email && u.email.toLowerCase().includes(filter.toLowerCase())) ||
            (u.name && u.name.toLowerCase().includes(filter.toLowerCase()))
        );
    }

    tbody.innerHTML = filteredUsers.map(user => {
        const userFlyers = allFlyers.filter(f => f.userId === user.id);
        const roleLabel = user.role === 'manager' ? '👑 Manager' : user.role === 'registered' ? '📧 Yanditse' : '🕶️ Ingaruki';
        return `<tr>
            <td>${user.id ? user.id.substring(0, 8) : 'N/A'}...</td>
            <td><span class="user-badge ${user.role || 'anonymous'}">${roleLabel}</span></td>
            <td>${user.email || user.name || 'Nta izina'}</td>
            <td>${userFlyers.length}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
            <td>${user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A'}</td>
            <td>
                <button class="action-btn view" onclick="viewUserFlyers('${user.id}')"><i>👁️</i></button>
                <button class="action-btn message" onclick="openMessageModal('${user.id}')"><i>💬</i></button>
                ${user.role !== 'manager' ? `<button class="action-btn delete" onclick="deleteUser('${user.id}')"><i>🗑️</i></button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function viewUserFlyers(userId) {
    const user = users.find(u => u.id === userId);
    const userFlyers = allFlyers.filter(f => f.userId === userId);
    let msg = `📄 Utuzingo ya ${user?.email || 'Ingaruki'}:\n\n`;
    if (userFlyers.length === 0) msg += 'Nta tuzingo yanditse.';
    else userFlyers.forEach((flyer, i) => {
        msg += `${i+1}. ${flyer.title} (${new Date(flyer.createdAt).toLocaleDateString()})\n   ❤️ ${flyer.likes || 0} | 💬 ${flyer.comments?.length || 0}\n`;
    });
    alert(msg);
}

function loadFlyersGrid(filter = 'all', search = '') {
    const grid = document.getElementById('flyersManagerGrid');
    if (!grid) return;
    let filteredFlyers = [...allFlyers];

    if (filter !== 'all') {
        if (filter === 'anonymous') filteredFlyers = filteredFlyers.filter(f => { const u = users.find(u => u.id === f.userId); return u && u.role === 'anonymous'; });
        else if (filter === 'registered') filteredFlyers = filteredFlyers.filter(f => { const u = users.find(u => u.id === f.userId); return u && u.role === 'registered'; });
        else if (filter === 'reported') filteredFlyers = filteredFlyers.filter(f => f.reported);
        else if (filter === 'pending') filteredFlyers = filteredFlyers.filter(f => f.status === 'pending');
    }

    if (search) filteredFlyers = filteredFlyers.filter(f =>
        (f.title && f.title.toLowerCase().includes(search.toLowerCase())) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
    );

    if (filteredFlyers.length === 0) { grid.innerHTML = '<div class="no-results">📄 Nta maflyer abonetse</div>'; return; }

    grid.innerHTML = filteredFlyers.map(flyer => {
        const user = users.find(u => u.id === flyer.userId);
        const userName = user?.email || user?.name || 'Ingaruki';
        const userType = user?.role || 'anonymous';
        const styleClass = flyer.style ? `flyer-style-${flyer.style}` : 'flyer-style-classic';

        return `<div class="flyer-manager-card ${flyer.reported ? 'reported' : ''} ${flyer.status === 'pending' ? 'pending' : ''} ${styleClass}">
            <div class="user-info"><span><span class="user-badge ${userType}">${userType === 'registered' ? '📧' : '🕶️'}</span> ${userName}</span><span>${flyer.createdAt ? new Date(flyer.createdAt).toLocaleDateString() : 'N/A'}</span></div>
            <h4>${flyer.title || 'Nta mutwe'}</h4>
            <p>${flyer.previewDescription ? flyer.previewDescription.substring(0, 100) + '...' : (flyer.description ? flyer.description.substring(0, 100) + '...' : 'Nta bisobanuro')}</p>
            <div style="font-size: 0.85rem; color: #666; margin: 10px 0;">
                <span>❤️ ${flyer.likes || 0}</span>
                <span style="margin-left: 10px;">✅ ${flyer.knew || 0}</span>
                <span style="margin-left: 10px;">❓ ${flyer.didntKnow || 0}</span>
                <span style="margin-left: 10px;">💬 ${flyer.comments?.length || 0}</span>
                <span style="margin-left: 10px;">🎨 ${flyer.style || 'classic'}</span>
            </div>
            <div class="flyer-actions">
                <button class="action-btn view" onclick="previewFlyer('${flyer.id}')"><i>👁️</i> Reba</button>
                <button class="action-btn edit" onclick="openEditFlyerModal('${flyer.id}')" style="background:#f39c12;"><i>✏️</i> Hindura</button>
                <button class="action-btn message" onclick="openMessageModal('${flyer.userId}', '${flyer.id}')"><i>💬</i> Ubutumwa</button>
                ${flyer.status === 'pending' ? `<button class="action-btn" style="background:#2ecc71;" onclick="approveFlyer('${flyer.id}')"><i>✅</i> Emeza</button>` : ''}
                <button class="action-btn delete" onclick="deleteFlyer('${flyer.id}')"><i>🗑️</i> Siba</button>
            </div>
        </div>`;
    }).join('');
}

function previewFlyer(flyerId) {
    const flyer = allFlyers.find(f => f.id === flyerId);
    const user = users.find(u => u.id === flyer?.userId);
    if (!flyer) { alert('Flyer ntibonetse!'); return; }
    alert(`📌 ${flyer.title}\n👤 ${user?.email || 'Ingaruki'}\n📅 ${flyer.date || 'Tariki izwi'}\n📍 ${flyer.region || 'Ntaho'}\n🎨 Imisusire: ${flyer.style || 'classic'}\n\n📖 ${flyer.fullDescription || flyer.previewDescription}\n\n❤️ ${flyer.likes || 0} | ✅ ${flyer.knew || 0} | ❓ ${flyer.didntKnow || 0} | 💬 ${flyer.comments?.length || 0}`);
}

function approveFlyer(flyerId) {
    const flyer = allFlyers.find(f => f.id === flyerId);
    if (flyer) {
        flyer.status = 'approved';
        localStorage.setItem('wrzkk_all_flyers', JSON.stringify(allFlyers));
        loadFlyersGrid();
        updateStats();
        alert('✅ Akazingo kemejwe!');
    }
}

function deleteFlyer(flyerId) {
    if (confirm('Wibyare ko ushaka gusiba iri flyer?')) {
        allFlyers = allFlyers.filter(f => f.id !== flyerId);
        localStorage.setItem('wrzkk_all_flyers', JSON.stringify(allFlyers));
        localStorage.setItem('wrzkk_flyers', JSON.stringify(allFlyers));
        loadFlyersGrid();
        updateStats();
        alert('✅ Utuzingo twasibwe neza!');
    }
}

function deleteUser(userId) {
    if (confirm('Ibi bizasiba umukoresha N\'UTUZINGO TWE TWOSE. Emeza?')) {
        allFlyers = allFlyers.filter(f => f.userId !== userId);
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('wrzkk_all_flyers', JSON.stringify(allFlyers));
        localStorage.setItem('wrzkk_flyers', JSON.stringify(allFlyers));
        localStorage.setItem('wrzkk_users', JSON.stringify(users));
        loadUsersTable();
        loadFlyersGrid();
        updateStats();
        alert('✅ Umukoresha n\'utuzingo byasibwe!');
    }
}

function loadMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    if (messages.length === 0) { container.innerHTML = '<div class="no-results">💬 Nta ubutumwa</div>'; return; }

    container.innerHTML = messages.map(msg => {
        const user = users.find(u => u.id === msg.userId);
        const flyer = allFlyers.find(f => f.id === msg.flyerId);
        return `<div class="message-item ${!msg.read ? 'unread' : ''}">
            <div class="message-header"><span class="message-sender">Kuri: ${user?.email || 'Umukoresha'}</span><span class="message-date">${msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'N/A'}</span></div>
            <div class="message-flyer">Icyerekeye: ${flyer?.title || 'Flyer yasibwe'}</div>
            <div class="message-content">${msg.content}</div>
            <div class="message-actions"><button class="action-btn view" onclick="markMessageRead('${msg.id}')">✓ Meka nk'usomwe</button><button class="action-btn delete" onclick="deleteMessage('${msg.id}')">🗑️ Siba</button></div>
        </div>`;
    }).join('');
}

function openMessageModal(userId, flyerId = null) {
    const user = users.find(u => u.id === userId);
    const flyer = flyerId ? allFlyers.find(f => f.id === flyerId) : null;
    document.getElementById('messageRecipient').value = user?.email || 'Umukoresha';
    document.getElementById('messageFlyer').value = flyer?.title || 'Ubutumwa rusange';
    document.getElementById('messageText').value = '';
    document.getElementById('messageModal').dataset.userId = userId;
    document.getElementById('messageModal').dataset.flyerId = flyerId;
    document.getElementById('messageModal').style.display = 'flex';
}

function closeMessageModal() { document.getElementById('messageModal').style.display = 'none'; }

function sendUserMessage() {
    const userId = document.getElementById('messageModal').dataset.userId;
    const flyerId = document.getElementById('messageModal').dataset.flyerId;
    const content = document.getElementById('messageText').value;
    if (!content.trim()) { alert('Andika ubutumwa'); return; }

    messages.push({ id: 'msg_' + Date.now(), userId, flyerId, content, sentAt: new Date().toISOString(), read: false, from: 'manager' });
    localStorage.setItem('wrzkk_messages', JSON.stringify(messages));
    closeMessageModal();
    loadMessages();
    updateStats();
    alert('✅ Ubutumwa bwoherejwe!');
}

function markMessageRead(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (message) { message.read = true; localStorage.setItem('wrzkk_messages', JSON.stringify(messages)); loadMessages(); updateStats(); }
}

function deleteMessage(messageId) { messages = messages.filter(m => m.id !== messageId); localStorage.setItem('wrzkk_messages', JSON.stringify(messages)); loadMessages(); updateStats(); }

function openEditFlyerModal(flyerId) {
    const flyer = allFlyers.find(f => f.id === flyerId);
    if (!flyer) { alert('Flyer ntibonetse!'); return; }
    document.getElementById('editFlyerTitle').value = flyer.title || '';
    document.getElementById('editFlyerImage').value = flyer.image || '';
    document.getElementById('editFlyerDate').value = flyer.date || '';
    document.getElementById('editFlyerRegion').value = flyer.region || '';
    document.getElementById('editFlyerPreview').value = flyer.previewDescription || '';
    document.getElementById('editFlyerFull').value = flyer.fullDescription || '';
    document.getElementById('editFlyerStyle').value = flyer.style || 'classic';
    document.getElementById('editFlyerContinent').value = flyer.continent || 'worldwide';
    document.getElementById('editFlyerCategory').value = flyer.category || 'worldwide';
    document.getElementById('editFlyerKeywords').value = (flyer.keywords || []).join(', ');
    document.getElementById('editFlyerLikes').value = Number(flyer.likes || 0);
    document.getElementById('editFlyerKnew').value = Number(flyer.knew || 0);
    document.getElementById('editFlyerDidntKnow').value = Number(flyer.didntKnow || 0);
    document.getElementById('editFlyerModal').dataset.flyerId = flyerId;
    document.getElementById('editFlyerModal').style.display = 'flex';
    managerUpdateFlyerImagePreview(flyer.image || '');
    const fileInput = document.getElementById('editFlyerImageFile');
    if (fileInput && !fileInput.dataset.bound) {
        fileInput.addEventListener('change', managerHandleFlyerImageFileChange);
        fileInput.dataset.bound = '1';
    }
}

function closeEditFlyerModal() { document.getElementById('editFlyerModal').style.display = 'none'; }

function saveFlyerChanges() {
    const flyerId = document.getElementById('editFlyerModal').dataset.flyerId;
    const flyer = allFlyers.find(f => f.id === flyerId);
    if (!flyer) { alert('Flyer ntibonetse!'); return; }
    flyer.title = document.getElementById('editFlyerTitle').value.trim() || 'Nta mutwe';
    const rawImage = document.getElementById('editFlyerImage').value.trim() || '';
    flyer.image = managerIsDataImageUrl(rawImage) ? rawImage : (managerOptimizeRemoteFlyerUrl(rawImage) || '');
    flyer.date = document.getElementById('editFlyerDate').value.trim() || 'Tariki izwi';
    flyer.region = document.getElementById('editFlyerRegion').value.trim() || 'Ntaho';
    flyer.continent = document.getElementById('editFlyerContinent').value || flyer.continent || 'worldwide';
    flyer.category = document.getElementById('editFlyerCategory').value || flyer.category || 'worldwide';
    flyer.keywords = document.getElementById('editFlyerKeywords').value.split(',').map(k => k.trim()).filter(Boolean);
    flyer.likes = Math.max(0, Number(document.getElementById('editFlyerLikes').value || 0));
    flyer.knew = Math.max(0, Number(document.getElementById('editFlyerKnew').value || 0));
    flyer.didntKnow = Math.max(0, Number(document.getElementById('editFlyerDidntKnow').value || 0));
    flyer.previewDescription = document.getElementById('editFlyerPreview').value.trim() || '';
    flyer.fullDescription = document.getElementById('editFlyerFull').value.trim() || flyer.previewDescription;
    flyer.style = document.getElementById('editFlyerStyle').value;
    flyer.lastModified = new Date().toISOString();
    localStorage.setItem('wrzkk_all_flyers', JSON.stringify(allFlyers));
    localStorage.setItem('wrzkk_flyers', JSON.stringify(allFlyers));
    closeEditFlyerModal();
    loadFlyersGrid();
    updateStats();
    alert('✅ Amahinduka yabitswe!');
}

function switchManagerTab(tabName, evt) {
    const tabs = document.querySelectorAll('.manager-tab');
    const contents = document.querySelectorAll('.manager-tab-content');
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    // Use the passed event, or fallback to window.event
    const e = evt || window.event;
    const clicked = e?.currentTarget?.closest?.('.manager-tab')
                 || e?.target?.closest?.('.manager-tab');
    if (clicked) clicked.classList.add('active');

    document.getElementById(tabName + 'Tab')?.classList.add('active');
    if (tabName === 'managers') renderManagerEmailsList();
}

function searchUsers() { loadUsersTable(document.getElementById('userSearch').value); }
function filterFlyers() { loadFlyersGrid(document.getElementById('flyerFilter').value, document.getElementById('flyerSearch').value); }
function searchFlyers() { filterFlyers(); }

async function changeManagerPassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (!currentManager) return;
    if (current !== currentManager.password) { alert('Ijambo ry\'ibanga risanzwe si ryo'); return; }
    if (newPass !== confirm) { alert('Ijambo ry\'ibanga rishya ntirihuye'); return; }
    if (newPass.length < 6) { alert('Ijambo ry\'ibanga rigomba kugira byibura inyuguti 6'); return; }

    try {
        await updateManagerInCloud(currentManager.id, { password: newPass });
        currentManager.password = newPass;
        localStorage.setItem('wrzkk_manager', JSON.stringify(currentManager));
        alert('✅ Ijambo ry\'ibanga ryahinduwe (muri cloud no kuri iyi device)');
    } catch (err) {
        alert(`⚠️ Ntibyakunze: ${err.message}`);
    }
}

function saveSettings() {
    settings.autoApprove = document.getElementById('autoApprove').checked;
    settings.notifyOnReport = document.getElementById('notifyOnReport').checked;
    localStorage.setItem('wrzkk_settings', JSON.stringify(settings));
    alert('✅ Igenamiterere ryabitswe!');
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    if (!checkManagerAuth()) {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboardSection').style.display = 'none';
    }
});

// ==================== GLOBAL EXPORTS ====================
window.managerLogin = managerLogin;
window.managerLogout = managerLogout;
window.switchManagerTab = switchManagerTab;
window.searchUsers = searchUsers;
window.filterFlyers = filterFlyers;
window.searchFlyers = searchFlyers;
window.viewUserFlyers = viewUserFlyers;
window.openMessageModal = openMessageModal;
window.closeMessageModal = closeMessageModal;
window.sendUserMessage = sendUserMessage;
window.previewFlyer = previewFlyer;
window.approveFlyer = approveFlyer;
window.deleteFlyer = deleteFlyer;
window.deleteUser = deleteUser;
window.markMessageRead = markMessageRead;
window.deleteMessage = deleteMessage;
window.changeManagerPassword = changeManagerPassword;
window.saveSettings = saveSettings;
window.refreshAllData = refreshAllData;
window.syncFlyersWithUsers = syncFlyersWithUsers;
window.openEditFlyerModal = openEditFlyerModal;
window.closeEditFlyerModal = closeEditFlyerModal;
window.saveFlyerChanges = saveFlyerChanges;
window.managerApplyFlyerImageUrl = managerApplyFlyerImageUrl;
window.managerClearFlyerImage = managerClearFlyerImage;
window.setGlobalFlyerStyle = setGlobalFlyerStyle;
window.applyStyleToAllFlyers = applyStyleToAllFlyers;
window.addManagerEmailFromInput = addManagerEmailFromInput;
window.removeManagerEmail = removeManagerEmail;
window.toggleManagerActive = toggleManagerActive;
