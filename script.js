// ==================== STATE MANAGEMENT ====================
let flyersCollection = [];
let extractedStories = [];
let expandedFlyers = new Set();
let expandedComments = new Set();

let sessionInteractions = {
    liked: new Set(),
    knew: new Set(),
    didntKnow: new Set()
};

let currentFilters = {
    continent: 'all',
    category: 'all',
    sort: 'newest',
    search: ''
};

let globalFlyerStyle = localStorage.getItem('wrzkk_global_style') || 'classic';

// ==================== SUPABASE REALTIME ====================
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
let realtimeChannel = null;

function startFlyerRealtime() {
    if (realtimeChannel) return;   // already started
    if (typeof supabase === 'undefined') {
        console.warn('Supabase SDK not loaded — realtime disabled');
        return;
    }
    try {
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        realtimeChannel = client
            .channel('flyers-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'flyers' },
                (payload) => {
                    console.log('🔔 Realtime change:', payload.eventType, payload.new?.title || payload.old?.title);
                    handleRealtimeChange(payload);
                }
            )
            .subscribe((status) => {
                console.log('Realtime status:', status);
            });
    } catch (err) {
        console.warn('Realtime setup failed:', err.message);
    }
}

function handleRealtimeChange(payload) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT' && newRow) {
        // New flyer created elsewhere
        const exists = flyersCollection.some(f => String(f.id) === String(newRow.id));
        if (!exists) {
            const newFlyer = rowToFlyer(newRow);
            flyersCollection.unshift(newFlyer);
            console.log('🆕 Flyer added:', newFlyer.title);
        }
    } else if (eventType === 'UPDATE' && newRow) {
        // Flyer edited elsewhere
        const idx = flyersCollection.findIndex(f => String(f.id) === String(newRow.id));
        if (idx !== -1) {
            // Preserve local mirror of the row
            flyersCollection[idx] = { ...flyersCollection[idx], ...rowToFlyer(newRow) };
            console.log('✏️ Flyer updated:', newRow.title);
        } else {
            flyersCollection.push(rowToFlyer(newRow));
        }
    } else if (eventType === 'DELETE' && oldRow) {
        // Flyer deleted elsewhere
        flyersCollection = flyersCollection.filter(f => String(f.id) !== String(oldRow.id));
        console.log('🗑️ Flyer deleted:', oldRow.id);
    }

    updateCollectionCount();
    displayFlyers();
    // Keep localStorage mirror in sync
    try {
        localStorage.setItem('wrzkk_flyers', JSON.stringify(flyersCollection));
    } catch {}
}

// ==================== CLOUD STORAGE (SUPABASE) ====================
const CLOUD_API = '/api/flyers';

function currentUserId() {
    const role = localStorage.getItem('wrzkk_user_role');
    const email = localStorage.getItem('wrzkk_user_email');
    if (role === 'registered' && email) {
        return email.toLowerCase().trim();
    }
    return localStorage.getItem('wrzkk_user_id') || 'anonymous';
}

function flyerToRow(flyer) {
    return {
        user_id: flyer.userId === 'system' ? 'system' : currentUserId(),
        title: flyer.title,
        preview_description: flyer.previewDescription || '',
        full_description: flyer.fullDescription || '',
        image: flyer.image || '',
        date: flyer.date || '',
        likes: flyer.likes || 0,
        comments: flyer.comments || [],
        knew: flyer.knew || 0,
        didnt_know: flyer.didntKnow || 0,
        keywords: flyer.keywords || [],
        continent: flyer.continent || 'worldwide',
        category: flyer.category || 'worldwide',
        region: flyer.region || ''
    };
}

function rowToFlyer(row) {
    return {
        id: row.id,
        title: row.title,
        previewDescription: row.preview_description,
        fullDescription: row.full_description,
        image: row.image,
        date: row.date,
        likes: row.likes,
        comments: row.comments || [],
        knew: row.knew,
        didntKnow: row.didnt_know,
        keywords: row.keywords || [],
        continent: row.continent,
        category: row.category,
        region: row.region,
        createdAt: row.created_at
    };
}

async function saveFlyerToCloud(flyer) {
    // 1. Update local mirror instantly
    let local = JSON.parse(localStorage.getItem('wrzkk_flyers')) || [];
    const idx = local.findIndex(f => f.id === flyer.id);
    if (idx === -1) local.unshift(flyer);
    else local[idx] = flyer;
    localStorage.setItem('wrzkk_flyers', JSON.stringify(local));

    // 2. Skip cloud for anonymous
    if (!currentUserId() || currentUserId() === 'anonymous') {
        return true;
    }

    // 3. Push to cloud
    try {
        const res = await fetch(CLOUD_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flyerToRow(flyer))
        });
        const rawText = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${rawText}`);
        let saved;
        try { saved = JSON.parse(rawText); }
        catch { throw new Error('Invalid JSON from cloud: ' + rawText); }
        console.log('☁️ Cloud save OK:', saved.title || flyer.title);
        if (saved.id && saved.id !== flyer.id) {
            const prevId = flyer.id;
            flyer.id = saved.id;
            let mirror = JSON.parse(localStorage.getItem('wrzkk_flyers')) || [];
            const i2 = mirror.findIndex(f => f.id === prevId);
            if (i2 !== -1) {
                mirror[i2].id = saved.id;
                localStorage.setItem('wrzkk_flyers', JSON.stringify(mirror));
            }
        }
        return true;
    } catch (err) {
        console.warn('⚠️ Cloud save failed:', err.message);
        return false;
    }
}

async function loadFlyersFromCloud() {
    try {
        const res = await fetch(CLOUD_API);   // global read — all users
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        console.log(`☁️ Loaded ${rows.length} flyers from cloud (all users)`);
        return rows.map(rowToFlyer);
    } catch (err) {
        console.warn('⚠️ Cloud load failed:', err.message);
        return null;
    }
}

function flyerIdKey(id) { return String(id); }

function normalizeFlyerImage(url, story) {
    if (!url || typeof url !== 'string') return getImageForStory(story || {});
    const trimmed = url.trim();
    if (trimmed.startsWith('data:image/')) return trimmed.replace(/'/g, '%27');
    if (trimmed.includes('postimg.cc/') && !trimmed.includes('i.postimg.cc')) {
        return getImageForStory(story || {});
    }
    return trimmed.replace(/'/g, '%27');
}

// ==================== CONSTANTS ====================
const RAPIDAPI_KEY = '1160bf36e3msh6729064f6829518p1e7b37jsne28423a56339';
const RAPIDAPI_HOST = 'free-google-translator.p.rapidapi.com';

const FLYER_IMAGE = { width: 800, height: 450, maxFileMB: 5, quality: 0.82 };
function isDataImageUrl(url) { return typeof url === 'string' && url.startsWith('data:image/'); }

let currentEditingStory = null;
let storyImageOverrides = {};

const CONTINENT_NAMES = {
    'africa': 'Afurika', 'asia': 'Aziya', 'europe': 'Uburayi',
    'north-america': 'Amerika ya Ruguru', 'south-america': 'Amerika y\'Epfo',
    'australia': 'Ositariya', 'antarctica': 'Antaragitika',
    'cosmic': 'Ikirere', 'worldwide': 'Isi Yose'
};

const CATEGORY_NAMES = {
    'continental': '🌍 Umugabane',
    'cosmic': '🚀 Ikirere',
    'worldwide': '🌐 Isi Yose'
};

const CLICK_TO_READ = '👇 Kanda usome byinshi';
const ADD_COMMENT_PLACEHOLDER = 'Andika igitekerezo...';
const POST_BUTTON = 'Ohereza';
const EDIT_BUTTON = 'Hindura';
const CREATE_FLYER_BUTTON = 'Kora Flyer';
const FLYER_PHOTO_LABEL = 'Ifoto ya Flyer';
const FLYER_PHOTO_PICK = 'Hitamo ifoto';
const FLYER_PHOTO_URL_PLACEHOLDER = 'https://...ifoto.jpg';
const FLYER_PHOTO_APPLY = 'Shyira link';
const FLYER_PHOTO_HINT = 'Hitamo ifoto 16:9 (urugero 800×450) cyangwa link — izafata ubuso bwose ku flyer.';
const FLYER_PHOTO_TOO_LARGE = 'Ifoto irarenze 5MB. Hitamo indi.';
const FLYER_PHOTO_INVALID = 'Dosiye si ifoto.';
const FLYER_PHOTO_SAVED = 'Ifoto yateguwe neza!';
const FLYER_PHOTO_URL_INVALID = 'Shyiramo link yemewe (http:// cyangwa https://).';
const FLYER_PHOTO_URL_FAILED = 'Ntitwabashije gufata iyo link. Reba ko iyo ifoto iboneka.';
const ALREADY_EXISTS = 'Iriho';
const DUPLICATE_WARNING = 'Inkuru imeze ityo iriho';
const NO_RESULTS = 'Nta flyer zihuje. Kora zimwe muri generator!';
const NO_STORIES = 'Nta nkuru ziboneka. Gerageza kwandika inkuru ndende.';
const LOADING = 'Irahindura...';
const TRANSLATION_SUCCESS = 'zahinduwe mu Kinyarwanda!';
const TRANSLATION_FAILED = 'Kutahindura byanze. Ongera ugerageze.';
const SAVED_TO_COLLECTION = 'Flyer yahinduwe neza! Reba muri collection.';
const FLYER_CREATED = 'Flyer nshya yakozwe neza! Yabitswe mu bubiko. Reba muri collection.';

// ==================== TRANSLATION ====================
async function translateWithRapidAPILang(text, from = 'en', to = 'rw') {
    if (!text || text.trim() === '') return text;
    const url = 'https://free-google-translator.p.rapidapi.com/external-api/free-google-translator';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            },
            body: new URLSearchParams({ from, to, query: text })
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        const data = await response.json();
        if (data && data.translation) return data.translation;
        return text;
    } catch (error) {
        console.error('RapidAPI translation error:', error);
        return null;
    }
}
async function translateWithRapidAPI(text) { return translateWithRapidAPILang(text, 'en', 'rw'); }

async function translateWithMyMemoryLang(text, from, to) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData?.translatedText) return data.responseData.translatedText;
    } catch (error) { console.error('MyMemory error:', error); }
    return null;
}

async function translateProverbLang(text, from, to) {
    const rapid = await translateWithRapidAPILang(text, from, to);
    if (rapid) return rapid;
    return translateWithMyMemoryLang(text, from, to);
}

async function translateToKinyarwanda(text) {
    if (!text || text.trim() === '') return text;
    const rapidResult = await translateWithRapidAPI(text);
    if (rapidResult) return rapidResult;
    return translateWithMyMemoryFallback(text);
}

async function translateWithMyMemoryFallback(text) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|rw&mt=1`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) return data.responseData.translatedText;
        return text + ' ⚠️';
    } catch (error) { return text + ' ⚠️'; }
}

async function translateLongText(text) {
    if (text.length < 500) return await translateToKinyarwanda(text);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let result = [];
    for (let i = 0; i < sentences.length; i++) {
        const translated = await translateToKinyarwanda(sentences[i]);
        result.push(translated);
        if (i < sentences.length - 1) await new Promise(r => setTimeout(r, 300));
    }
    return result.join(' ');
}

// ==================== COLOR CLASSES ====================
const COLOR_CLASSES = [
    'color-1','color-2','color-3','color-4','color-5',
    'color-6','color-7','color-8','color-9','color-10',
    'color-11','color-12','color-13','color-14','color-15'
];
function getRandomColorClass() {
    return COLOR_CLASSES[Math.floor(Math.random() * COLOR_CLASSES.length)];
}
function getFlyerNumber(flyer) {
    const index = flyersCollection.findIndex(f => f.id === flyer.id);
    return index !== -1 ? `#${index + 1}` : '#???';
}

// ==================== IMAGE HELPERS ====================
function clearStoryImages() { storyImageOverrides = {}; }

function getStoryImageForIndex(i) {
    const story = extractedStories[i];
    if (!story) return null;
    if (storyImageOverrides[i]) return storyImageOverrides[i];
    if (story.image) return normalizeFlyerImage(story.image, story);
    return getImageForStory(story);
}

function setStoryImage(i, src) {
    if (!extractedStories[i]) return;
    storyImageOverrides[i] = src;
    extractedStories[i].image = src;
    updateStoryImagePreview(i);
}

function resizeImageForFlyer(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) return reject(new Error('invalid'));
        if (file.size > FLYER_IMAGE.maxFileMB * 1024 * 1024) return reject(new Error('large'));
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const tw = FLYER_IMAGE.width, th = FLYER_IMAGE.height;
                const canvas = document.createElement('canvas');
                canvas.width = tw; canvas.height = th;
                const ctx = canvas.getContext('2d');
                const dstAspect = tw / th, srcAspect = img.width / img.height;
                let sx, sy, sw, sh;
                if (srcAspect > dstAspect) { sh = img.height; sw = sh * dstAspect; sx = (img.width - sw) / 2; sy = 0; }
                else { sw = img.width; sh = sw / dstAspect; sx = 0; sy = (img.height - sh) / 2; }
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
                resolve(canvas.toDataURL('image/jpeg', FLYER_IMAGE.quality));
            };
            img.onerror = () => reject(new Error('load'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
    });
}

function preloadImageUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('load'));
        img.src = url;
    });
}

function parseFlyerImageUrlInput(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) return null;
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
        return parsed.href;
    } catch { return null; }
}

function optimizeRemoteFlyerUrl(url) {
    if (url.includes('images.unsplash.com') && !url.includes('w=')) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}w=${FLYER_IMAGE.width}&h=${FLYER_IMAGE.height}&fit=crop`;
    }
    return url;
}

async function uploadFlyerPictureForStory(event, storyIndex) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const dataUrl = await resizeImageForFlyer(file);
        setStoryImage(storyIndex, dataUrl);
        const urlInput = document.getElementById(`flyer-image-url-${storyIndex}`);
        if (urlInput) urlInput.value = '';
        alert(`✅ ${FLYER_PHOTO_SAVED}`);
    } catch (err) {
        if (err.message === 'large') alert(`⚠️ ${FLYER_PHOTO_TOO_LARGE}`);
        else alert(`⚠️ ${FLYER_PHOTO_INVALID}`);
    }
    event.target.value = '';
}

function syncStoryImageFromUrlInput(i) {
    const current = getStoryImageForIndex(i);
    if (isDataImageUrl(current)) return;
    const input = document.getElementById(`flyer-image-url-${i}`);
    if (!input || !input.value.trim()) return;
    const parsed = parseFlyerImageUrlInput(input.value);
    if (!parsed) return;
    const optimized = optimizeRemoteFlyerUrl(parsed);
    setStoryImage(i, normalizeFlyerImage(optimized, extractedStories[i] || {}));
}

async function applyFlyerImageUrl(i) {
    const input = document.getElementById(`flyer-image-url-${i}`);
    if (!input) return;
    const parsed = parseFlyerImageUrlInput(input.value);
    if (!parsed) return alert(`⚠️ ${FLYER_PHOTO_URL_INVALID}`);
    const optimized = optimizeRemoteFlyerUrl(parsed);
    const normalized = normalizeFlyerImage(optimized, extractedStories[i] || {});
    try { await preloadImageUrl(normalized); }
    catch { if (!confirm(`⚠️ ${FLYER_PHOTO_URL_FAILED}\n\nKomeza?`)) return; }
    setStoryImage(i, normalized);
    input.value = normalized;
    alert(`✅ ${FLYER_PHOTO_SAVED}`);
}

function updateStoryImagePreview(i) {
    const el = document.getElementById(`story-image-preview-${i}`);
    if (!el) return;
    const src = getStoryImageForIndex(i);
    let img = el.querySelector('.flyer-image-picker-img');
    if (!img) {
        img = document.createElement('img');
        img.className = 'flyer-image-picker-img';
        img.alt = '';
        el.appendChild(img);
    }
    if (src && img) { img.src = src; el.classList.add('has-image'); }
    else if (img) { img.removeAttribute('src'); el.classList.remove('has-image'); }
}

function renderFlyerImageControls(i) {
    const src = getStoryImageForIndex(i) || '';
    const hasClass = src ? 'has-image' : '';
    const urlValue = src && src.startsWith('http') ? escapeHtml(src) : '';
    return `
        <div class="flyer-image-picker">
            <label class="flyer-image-picker-label">${FLYER_PHOTO_LABEL} <span class="image-dim-hint">(16:9 · ${FLYER_IMAGE.width}×${FLYER_IMAGE.height})</span></label>
            <div class="flyer-image-picker-preview ${hasClass}" id="story-image-preview-${i}" role="img" aria-label="Preview">
                <img class="flyer-image-picker-img" alt="">
            </div>
            <div class="flyer-image-picker-actions">
                <label class="flyer-image-file-btn">
                    📷 ${FLYER_PHOTO_PICK}
                    <input type="file" accept="image/*" onchange="uploadFlyerPictureForStory(event, ${i})">
                </label>
                <div class="flyer-image-url-row">
                    <input type="url" id="flyer-image-url-${i}" placeholder="${FLYER_PHOTO_URL_PLACEHOLDER}" value="${urlValue}">
                    <button type="button" class="flyer-image-url-btn" onclick="applyFlyerImageUrl(${i})">${FLYER_PHOTO_APPLY}</button>
                </div>
            </div>
            <p class="flyer-image-hint">${FLYER_PHOTO_HINT}</p>
        </div>
    `;
}

function uploadFlyerPicture(event) {
    if (currentEditingStory && currentEditingStory.index != null) {
        uploadFlyerPictureForStory(event, currentEditingStory.index);
    }
}

// ==================== COLLECTION INITIALIZATION ====================
function makeSeedFlyers(style) {
    return [
        {
            id: 'flyer_seed_1',
            title: "Ndabaga - Umukobwa w'intwari",
            previewDescription: "Umukobwa w'intwari wagiye ku rugamba",
            fullDescription: "Mu bihe bya kera, hari umukobwa witwaga Ndabaga wari uzwi ku butwari bwe...",
            image: "https://images.unsplash.com/photo-1590523277543-a94c2e4eb44b?w=400",
            date: "Igikorwa cy'ubutwari",
            likes: 0, comments: [], knew: 0, didntKnow: 0,
            keywords: ["Ubutwari", "Umukobwa", "Intambara"],
            continent: "africa", category: "continental",
            region: "Afurika y'Iburasirazuba",
            createdAt: new Date().toISOString(),
            colorClass: getRandomColorClass(),
            style,
            userId: 'system', userName: 'System', userType: 'system'
        },
        {
            id: 'flyer_seed_2',
            title: "Kugera ku Kwezi 1969",
            previewDescription: "Intambwe ikomeye y'ikiremwa muntu",
            fullDescription: "Ku wa 20 Nyakanga 1969, NASA yageze ku kwezi bwa mbere...",
            image: "https://images.unsplash.com/photo-1541873676-a18131494184?w=400",
            date: "Nyakanga 20, 1969",
            likes: 0, comments: [], knew: 0, didntKnow: 0,
            keywords: ["Ikirere", "Kwezi", "NASA"],
            continent: "cosmic", category: "cosmic",
            region: "Ikirere",
            createdAt: new Date().toISOString(),
            colorClass: getRandomColorClass(),
            style,
            userId: 'system', userName: 'System', userType: 'system'
        }
    ];
}

async function initializeCollection() {
    globalFlyerStyle = localStorage.getItem('wrzkk_global_style') || 'classic';

    const localFlyers = JSON.parse(localStorage.getItem('wrzkk_flyers')) || [];
    console.log(`💾 Local mirror: ${localFlyers.length} flyers`);

    const cloudFlyers = await loadFlyersFromCloud();

    let source;
    if (cloudFlyers === null) {
        source = localFlyers;
        console.log('↩️ Cloud unavailable — using local');
    } else if (cloudFlyers.length === 0) {
        console.log('🌱 Cloud empty — seeding global samples');
        source = makeSeedFlyers(globalFlyerStyle);
        for (const f of source) await saveFlyerToCloud(f);
    } else {
        const map = new Map();
        cloudFlyers.forEach(f => map.set(String(f.id), f));
        localFlyers.forEach(f => { if (!map.has(String(f.id))) map.set(String(f.id), f); });
        source = Array.from(map.values());
        console.log(`🔀 Merged: ${source.length} flyers (cloud=${cloudFlyers.length})`);
    }

    flyersCollection = source.map(f => {
        if (!f.colorClass) f.colorClass = getRandomColorClass();
        if (!f.style) f.style = globalFlyerStyle;
        f.image = normalizeFlyerImage(f.image, f);
        return f;
    });

    localStorage.setItem('wrzkk_flyers', JSON.stringify(flyersCollection));
    console.log(`✅ Collection ready: ${flyersCollection.length}`);
    updateCollectionCount();
    displayFlyers();
}

// ==================== FILE HANDLING ====================
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('fileInfo').innerHTML = `<i>📄</i> ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    const reader = new FileReader();
    reader.onload = function(e) { parseFileContent(e.target.result); };
    reader.readAsText(file);
}

function parseFileContent(content) {
    const stories = [];
    const flyerBlocks = content.split('---').filter(b => b.trim().length > 0);
    flyerBlocks.forEach((block, index) => {
        const lines = block.split('\n').filter(l => l.trim().length > 0);
        const story = { id: Date.now() + index, keywords: [] };
        lines.forEach(line => {
            if (line.startsWith('title:')) story.title = line.replace('title:', '').trim();
            else if (line.startsWith('description:')) story.previewDescription = line.replace('description:', '').trim();
            else if (line.startsWith('fullDescription:')) story.fullDescription = line.replace('fullDescription:', '').trim();
            else if (line.startsWith('date:')) story.date = line.replace('date:', '').trim();
            else if (line.startsWith('image:')) story.image = line.replace('image:', '').trim();
            else if (line.startsWith('continent:')) story.continent = line.replace('continent:', '').trim();
            else if (line.startsWith('category:')) story.category = line.replace('category:', '').trim();
            else if (line.startsWith('region:')) story.region = line.replace('region:', '').trim();
            else if (line.startsWith('keywords:')) story.keywords = line.replace('keywords:', '').split(',').map(k => k.trim());
        });
        story.previewDescription = story.previewDescription || (story.fullDescription ? story.fullDescription.substring(0, 150) + '...' : 'Nta bisobanuro');
        story.fullDescription = story.fullDescription || story.previewDescription;
        story.date = story.date || 'Tariki izwi';
        story.image = story.image || 'https://images.unsplash.com/photo-1544027993-37dbfe44362b?w=400';
        story.continent = story.continent || detectContinent(story.fullDescription);
        story.category = story.category || detectCategory(story.fullDescription);
        story.region = story.region || 'Ntaho igarukira';
        stories.push(story);
    });
    if (stories.length > 0) {
        clearStoryImages();
        extractedStories = stories;
        displayStoryPreviews(stories);
        alert(`✅ Twabonye inkuru ${stories.length} muri dosiye!`);
    }
}

// ==================== STORY EXTRACTION ====================
async function extractStories() {
    const extractBtn = document.getElementById('extractBtn');
    const originalText = extractBtn.innerHTML;
    extractBtn.innerHTML = `<i class="loading-spinner"></i> ${LOADING}`;
    extractBtn.disabled = true;
    const text = document.getElementById('historicalText').value.trim();
    if (!text) {
        alert('Andika inkuru mbere!');
        extractBtn.innerHTML = originalText;
        extractBtn.disabled = false;
        return;
    }
    try {
        const translatedText = await translateLongText(text);
        const stories = [];
        const paragraphs = translatedText.split(/\n\s*\n/);
        paragraphs.forEach((paragraph, index) => {
            if (paragraph.length < 50) return;
            const sentences = paragraph.split(/[.!?]+/);
            const title = sentences[0].substring(0, 50) + (sentences[0].length > 50 ? '...' : '');
            stories.push({
                id: Date.now() + index,
                title: title,
                previewDescription: paragraph.substring(0, 150) + '...',
                fullDescription: paragraph,
                keywords: extractKeywords(paragraph),
                date: extractDate(paragraph) || "Tariki izwi",
                continent: detectContinent(paragraph),
                category: detectCategory(paragraph),
                region: extractRegion(paragraph),
                translated: true
            });
        });
        clearStoryImages();
        extractedStories = stories;
        displayStoryPreviews(stories);
        if (stories.length === 0) alert(`⚠️ ${NO_STORIES}`);
        else alert(`✅ Inkuru ${stories.length} ${TRANSLATION_SUCCESS}`);
    } catch (error) {
        console.error('Translation error:', error);
        alert(TRANSLATION_FAILED);
    } finally {
        extractBtn.innerHTML = originalText;
        extractBtn.disabled = false;
    }
}

// ==================== HELPERS ====================
function extractKeywords(text) {
    const common = ['na','ya','mu','ku','ni','uko','kuko','cya','rya','muri','the','a','an','and','or'];
    const words = text.toLowerCase().split(/\W+/);
    const freq = {};
    words.forEach(w => { if (w.length > 3 && !common.includes(w)) freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,5).map(e => e[0]);
}
function extractDate(text) {
    const m = text.match(/\b(17|18|19|20)\d{2}\b/);
    return m ? m[0] : null;
}
function extractRegion(text) {
    const regions = {
        'Rwanda': ['rwanda','kigali'],
        'Kenya': ['kenya','nairobi'],
        'Tanzaniya': ['tanzania','dar'],
        'Uganda': ['uganda','kampala']
    };
    const lower = text.toLowerCase();
    for (const [region, kws] of Object.entries(regions)) {
        if (kws.some(k => lower.includes(k))) return region;
    }
    return 'Afurika';
}
function detectContinent(text) {
    const ck = {
        'africa': ['africa','afurika','rwanda','kenya','tanzania','congo'],
        'asia': ['asia','aziya','china','japan','india'],
        'europe': ['europe','uburayi','france','germany','italy'],
        'north-america': ['amerika ya ruguru','usa','canada'],
        'south-america': ['amerika y\'epfo','brazil','peru'],
        'cosmic': ['ikirere','kwezi','izuba','inyenyeri','space','moon'],
        'worldwide': ['isi yose','world','global']
    };
    const lower = text.toLowerCase();
    for (const [c, kws] of Object.entries(ck)) {
        if (kws.some(k => lower.includes(k))) return c;
    }
    return 'worldwide';
}
function detectCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('ikirere') || lower.includes('kwezi') || lower.includes('space')) return 'cosmic';
    if (lower.includes('afurika') || lower.includes('umugabane')) return 'continental';
    return 'worldwide';
}

function getContinentIcon(continent) {
    const icons = { 'africa':'🌍','asia':'🌏','europe':'🌍','north-america':'🌎','south-america':'🌎','cosmic':'🚀','worldwide':'🌐' };
    return icons[continent] || '🌍';
}
function getCategoryIcon(category) {
    const icons = { 'continental':'🌍','cosmic':'🚀','worldwide':'🌐' };
    return icons[category] || '📌';
}

function getImageForStory(story) {
    const images = {
        africa: 'https://images.unsplash.com/photo-1590523277543-a94c2e4eb44b?w=400',
        cosmic: 'https://images.unsplash.com/photo-1541873676-a18131494184?w=400',
        default: 'https://images.unsplash.com/photo-1544027993-37dbfe44362b?w=400'
    };
    return images[story.continent] || images.default;
}

// ==================== DISPLAY STORY PREVIEWS ====================
function displayStoryPreviews(stories) {
    const previewDiv = document.getElementById('storyPreview');
    if (!previewDiv) return;
    if (stories.length === 0) {
        previewDiv.innerHTML = `<p>${NO_STORIES}</p>`;
        previewDiv.style.display = 'block';
        return;
    }
    let html = '<h3>📖 Inkuru zabonetse (Zahinduwe mu Kinyarwanda):</h3>';
    stories.forEach((story, index) => {
        const isDuplicate = isDuplicateFlyer(story.title, story.fullDescription);
        const continentDisplay = CONTINENT_NAMES[story.continent] || story.continent;
        const categoryDisplay = CATEGORY_NAMES[story.category] || story.category;
        html += `
            <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 15px; border: 1px solid #e0e0e0;">
                <h4 style="color: #764ba2;">${story.title} <span style="background:#3498db; color:white; padding:2px 10px; border-radius:15px; font-size:0.7rem;"><i>🇷🇼</i> Kinyarwanda</span></h4>
                <p style="margin: 10px 0;">${story.previewDescription}</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0;">
                    ${(story.keywords || []).map(k => `<span style="background:#e0e0e0; padding:3px 12px; border-radius:20px; font-size:0.75rem;">#${k}</span>`).join('')}
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 10px; font-size:0.75rem;">
                    <span>${getContinentIcon(story.continent)} ${continentDisplay}</span>
                    <span>${getCategoryIcon(story.category)} ${categoryDisplay}</span>
                    ${story.region ? `<span>📍 ${story.region}</span>` : ''}
                </div>
                ${isDuplicate ? `<div style="color: #e74c3c; font-size:0.8rem;">⚠️ ${DUPLICATE_WARNING}</div>` : ''}
                ${renderFlyerImageControls(index)}
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
                    <button onclick="openEditor(${index})" style="background:#3498db; color:white; border:none; padding:8px 20px; border-radius:25px; cursor:pointer;">✏️ ${EDIT_BUTTON}</button>
                    <button onclick="generateFlyer(${index})" ${isDuplicate ? 'disabled' : ''} style="background:${isDuplicate ? '#ccc' : '#2ecc71'}; color:white; border:none; padding:8px 25px; border-radius:25px; cursor:${isDuplicate ? 'not-allowed' : 'pointer'};">🎨 ${isDuplicate ? ALREADY_EXISTS : CREATE_FLYER_BUTTON}</button>
                </div>
            </div>
        `;
    });
    previewDiv.innerHTML = html;
    previewDiv.style.display = 'block';
    stories.forEach((_, i) => updateStoryImagePreview(i));
}

// ==================== FLYER GENERATION ====================
async function generateFlyer(storyIndex) {
    syncStoryImageFromUrlInput(storyIndex);
    const story = extractedStories[storyIndex];
    if (isDuplicateFlyer(story.title, story.fullDescription)) return alert(`⚠️ ${DUPLICATE_WARNING}!`);
    const currentUser = getCurrentUser();
    const newFlyer = {
        id: 'flyer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: story.title,
        previewDescription: story.previewDescription,
        fullDescription: story.fullDescription,
        image: getStoryImageForIndex(storyIndex) || getImageForStory(story),
        date: story.date || "Tariki izwi",
        likes: 0, comments: [], knew: 0, didntKnow: 0,
        keywords: story.keywords || [],
        continent: story.continent || 'worldwide',
        category: story.category || 'worldwide',
        region: story.region || 'Ntaho igarukira',
        language: 'Kinyarwanda', translated: true,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email || 'Uwihitira',
        userType: currentUser.role || 'anonymous',
        createdAt: new Date().toISOString(),
        colorClass: getRandomColorClass(),
        style: globalFlyerStyle
    };
    flyersCollection.unshift(newFlyer);
    await saveFlyerToCloud(newFlyer);
    delete storyImageOverrides[storyIndex];
    updateCollectionCount();
    displayFlyers();
    alert(`✨ ${FLYER_CREATED}`);
    showTab('collection');
}

// ==================== EDITOR ====================
function openEditor(storyIndex) {
    const idx = storyIndex;
    currentEditingStory = { ...extractedStories[idx], index: idx };
    const modal = document.createElement('div');
    modal.id = 'editorModal';
    modal.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:2000;`;
    modal.innerHTML = `
        <div style="background:white; border-radius:20px; padding:30px; max-width:600px; width:90%; max-height:90vh; overflow-y:auto;">
            <h2 style="color:#764ba2;">✏️ Hindura Inkuru</h2>
            <div style="margin-bottom:15px;"><label>Umutwe:</label><input type="text" id="editTitle" value="${escapeHtml(currentEditingStory.title)}" style="width:100%; padding:10px; border-radius:10px;"></div>
            <div style="margin-bottom:15px;"><label>Incamake:</label><textarea id="editPreview" rows="3" style="width:100%; padding:10px; border-radius:10px;">${escapeHtml(currentEditingStory.previewDescription)}</textarea></div>
            <div style="margin-bottom:15px;"><label>Inkuru Yuzuye:</label><textarea id="editFull" rows="6" style="width:100%; padding:10px; border-radius:10px;">${escapeHtml(currentEditingStory.fullDescription)}</textarea></div>
            <div style="margin-bottom:15px;"><label>Itariki:</label><input type="text" id="editDate" value="${escapeHtml(currentEditingStory.date || '')}" style="width:100%; padding:10px;"></div>
            <div style="margin-bottom:15px;"><label>Akarere:</label><input type="text" id="editRegion" value="${escapeHtml(currentEditingStory.region || '')}" style="width:100%; padding:10px;"></div>
            <div style="margin-bottom:15px;"><label>Amagambo y'Ingenzi:</label><input type="text" id="editKeywords" value="${(currentEditingStory.keywords || []).join(', ')}" style="width:100%; padding:10px;"></div>
            ${renderFlyerImageControls(idx)}
            <div style="display:flex; gap:15px; justify-content:flex-end; margin-top:20px;">
                <button onclick="closeEditor()" style="background:#95a5a6; color:white; border:none; padding:10px 25px; border-radius:25px;">Guhagarika</button>
                <button onclick="saveEditedStory()" style="background:#2ecc71; color:white; border:none; padding:10px 25px; border-radius:25px;">Kubika</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    updateStoryImagePreview(idx);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : text;
    return div.innerHTML;
}

function closeEditor() {
    const savedIndex = currentEditingStory?.index;
    const modal = document.getElementById('editorModal');
    if (modal) modal.remove();
    currentEditingStory = null;
    if (savedIndex != null && extractedStories.length) displayStoryPreviews(extractedStories);
}

async function saveEditedStory() {
    if (!currentEditingStory) return;
    syncStoryImageFromUrlInput(currentEditingStory.index);
    const currentUser = getCurrentUser();
    const editedStory = {
        id: 'flyer_' + Date.now(),
        title: document.getElementById('editTitle').value.trim(),
        previewDescription: document.getElementById('editPreview').value.trim(),
        fullDescription: document.getElementById('editFull').value.trim(),
        date: document.getElementById('editDate').value.trim() || "Tariki izwi",
        region: document.getElementById('editRegion').value.trim() || "Ntaho igarukira",
        keywords: document.getElementById('editKeywords').value.split(',').map(k => k.trim()).filter(k => k),
        continent: currentEditingStory.continent || 'worldwide',
        category: currentEditingStory.category || 'worldwide',
        image: getStoryImageForIndex(currentEditingStory.index) || getImageForStory(currentEditingStory),
        likes: 0, comments: [], knew: 0, didntKnow: 0,
        language: 'Kinyarwanda', translated: true,
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email || 'Uwihitira',
        userType: currentUser.role || 'anonymous',
        colorClass: getRandomColorClass(),
        style: globalFlyerStyle
    };
    flyersCollection.unshift(editedStory);
    await saveFlyerToCloud(editedStory);
    delete storyImageOverrides[currentEditingStory.index];
    updateCollectionCount();
    closeEditor();
    alert(`✨ ${SAVED_TO_COLLECTION}`);
    showTab('collection');
    displayFlyers();
}

// ==================== COLLECTION FUNCTIONS ====================
function showTab(tabName) {
    const gen = document.getElementById('generatorTab');
    const col = document.getElementById('collectionTab');
    if (gen) gen.style.display = tabName === 'generator' ? 'block' : 'none';
    if (col) col.style.display = tabName === 'collection' ? 'block' : 'none';
    const tg = document.getElementById('tabGenerator');
    const tc = document.getElementById('tabCollection');
    if (tg) tg.classList.toggle('active', tabName === 'generator');
    if (tc) tc.classList.toggle('active', tabName === 'collection');
    if (tabName === 'collection') displayFlyers();
}

function updateCollectionCount() {
    const el = document.getElementById('collectionCount');
    if (el) el.textContent = flyersCollection.length;
}

function filterByContinent(continent) {
    currentFilters.continent = continent;
    displayFlyers();
    updateActiveFilters();
}

function filterByCategory(category) {
    currentFilters.category = category;
    displayFlyers();
    updateActiveFilters();
}

function sortBy(sortType) {
    currentFilters.sort = sortType;
    const names = { 'newest':'Ibiheruka','oldest':'Ibya Kera','most-liked':'Byakunzwe Cyane','most-commented':'Byaganweho Cyane' };
    const el = document.getElementById('selectedSort');
    if (el) el.textContent = names[sortType] || 'Ibiheruka';
    displayFlyers();
}

function clearAllFilters() {
    currentFilters = { continent:'all', category:'all', sort:'newest', search:'' };
    const el = document.getElementById('searchInput');
    if (el) el.value = '';
    displayFlyers();
    updateActiveFilters();
}

function updateActiveFilters() {
    const div = document.getElementById('activeFilters');
    if (!div) return;
    const filters = [];
    if (currentFilters.continent !== 'all') filters.push(`Umugabane: ${CONTINENT_NAMES[currentFilters.continent]}`);
    if (currentFilters.category !== 'all') filters.push(`Icyiciro: ${CATEGORY_NAMES[currentFilters.category]}`);
    if (currentFilters.search) filters.push(`Ushaka: "${currentFilters.search}"`);
    div.style.display = filters.length ? 'block' : 'none';
    div.innerHTML = filters.length ? `<div style="display:flex; gap:8px; flex-wrap:wrap;">${filters.map(f => `<span style="background:#764ba2; color:white; padding:4px 12px; border-radius:20px; font-size:0.75rem;">${f}</span>`).join('')}</div>` : '';
}

function isDuplicateFlyer(title, fullDescription) {
    const normTitle = (title || '').toLowerCase().trim();
    const normDesc = (fullDescription || '').toLowerCase().trim().substring(0, 100);
    if (!normTitle && !normDesc) return false;
    return flyersCollection.some(f => {
        const fTitle = (f.title || '').toLowerCase().trim();
        const fDesc = (f.fullDescription || '').toLowerCase().trim().substring(0, 100);
        if (normTitle && fTitle === normTitle) return true;
        if (normTitle && fTitle && Math.abs(fTitle.length - normTitle.length) < 5 &&
            (fTitle.includes(normTitle) || normTitle.includes(fTitle))) return true;
        if (normDesc && fDesc && fDesc === normDesc) return true;
        return false;
    });
}

// ==================== INTERACTION ====================
function toggleFlyerExpansion(id, e) {
    e.stopPropagation();
    if (e.target.closest('.interaction-btn') || e.target.closest('.comment-input button')) return;
    const k = flyerIdKey(id);
    expandedFlyers.has(k) ? expandedFlyers.delete(k) : expandedFlyers.add(k);
    displayFlyers();
}

async function handleLike(id, e) {
    e.stopPropagation();
    const k = flyerIdKey(id);
    if (sessionInteractions.liked.has(k)) return;
    const flyer = flyersCollection.find(f => flyerIdKey(f.id) === k);
    if (flyer) {
        flyer.likes = (flyer.likes || 0) + 1;
        sessionInteractions.liked.add(k);
        await saveFlyerToCloud(flyer);
        displayFlyers();
    }
}

async function handleKnew(id, e) {
    e.stopPropagation();
    const k = flyerIdKey(id);
    if (sessionInteractions.knew.has(k)) return;
    const flyer = flyersCollection.find(f => flyerIdKey(f.id) === k);
    if (flyer) {
        flyer.knew = (flyer.knew || 0) + 1;
        sessionInteractions.knew.add(k);
        await saveFlyerToCloud(flyer);
        displayFlyers();
    }
}

async function handleDidntKnow(id, e) {
    e.stopPropagation();
    const k = flyerIdKey(id);
    if (sessionInteractions.didntKnow.has(k)) return;
    const flyer = flyersCollection.find(f => flyerIdKey(f.id) === k);
    if (flyer) {
        flyer.didntKnow = (flyer.didntKnow || 0) + 1;
        sessionInteractions.didntKnow.add(k);
        await saveFlyerToCloud(flyer);
        displayFlyers();
    }
}

function toggleComments(id, e) {
    e.stopPropagation();
    const k = flyerIdKey(id);
    expandedComments.has(k) ? expandedComments.delete(k) : expandedComments.add(k);
    displayFlyers();
}

async function addComment(id, e) {
    e.stopPropagation();
    const input = document.getElementById(`comment-input-${id}`);
    if (!input) return;
    const text = input.value.trim();
    if (text) {
        const flyer = flyersCollection.find(f => String(f.id) === String(id));
        if (flyer) {
            if (!flyer.comments) flyer.comments = [];
            flyer.comments.push({
                author: getCurrentUser().name || "Uwihitira",
                text: text,
                time: new Date().toLocaleTimeString()
            });
            input.value = '';
            await saveFlyerToCloud(flyer);
            displayFlyers();
        }
    }
}

// ==================== DISPLAY FLYERS ====================
function displayFlyers() {
    let filtered = [...flyersCollection];
    if (currentFilters.search) {
        const s = currentFilters.search.toLowerCase();
        filtered = filtered.filter(f => f.title.toLowerCase().includes(s) || (f.previewDescription && f.previewDescription.toLowerCase().includes(s)));
    }
    if (currentFilters.continent !== 'all') filtered = filtered.filter(f => f.continent === currentFilters.continent);
    if (currentFilters.category !== 'all') filtered = filtered.filter(f => f.category === currentFilters.category);
    switch (currentFilters.sort) {
        case 'newest': filtered.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
        case 'oldest': filtered.sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); break;
        case 'most-liked': filtered.sort((a,b) => (b.likes || 0) - (a.likes || 0)); break;
        case 'most-commented': filtered.sort((a,b) => (b.comments?.length || 0) - (a.comments?.length || 0)); break;
    }
    const grid = document.getElementById('flyersGrid');
    if (!grid) return;
    if (!filtered.length) {
        grid.innerHTML = `<div class="no-results">📄 ${NO_RESULTS}</div>`;
        return;
    }
    grid.innerHTML = filtered.map((f, i) => createFlyerCard(f, i)).join('');
}

function createFlyerCard(f, displayIndex) {
    const k = flyerIdKey(f.id);
    const exp = expandedFlyers.has(k);
    const comExp = expandedComments.has(k);
    const liked = sessionInteractions.liked.has(k);
    const knew = sessionInteractions.knew.has(k);
    const didnt = sessionInteractions.didntKnow.has(k);
    const imageUrl = normalizeFlyerImage(f.image, f);
    const continentDisplay = CONTINENT_NAMES[f.continent] || f.continent;
    const flyerNumber = displayIndex + 1;
    if (!f.colorClass) f.colorClass = getRandomColorClass();
    const flyerStyle = f.style || globalFlyerStyle;
    const styleClass = `flyer-style-${flyerStyle}`;
    return `
        <div class="flyer-card ${exp ? 'expanded' : ''} ${styleClass} ${f.colorClass}" onclick="toggleFlyerExpansion('${f.id}', event)" style="position: relative;">
            <div class="flyer-number-tag" style="position: absolute; top: -8px; right: -8px; width: 38px; height: 38px; background: #f39c12; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.2); z-index: 10; border: 2px solid white;">
                ${flyerNumber}
            </div>
            <div class="flyer-image">
                <img class="flyer-image-photo" src="${imageUrl}" alt="" loading="lazy">
                <div class="flyer-image-badge" style="position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 10px; color: white; font-size: 0.55rem; font-weight: 500; z-index: 5; backdrop-filter: blur(2px);">
                    ${getContinentIcon(f.continent)} ${continentDisplay}
                </div>
            </div>
            <div class="flyer-content" style="padding: 12px;">
                <h3 class="flyer-title" style="margin-bottom: 6px; font-size: 0.95rem; padding-right: 25px;">
                    ${f.title}
                    <span class="translation-badge" style="background: #3498db; color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.55rem; margin-left: 6px;"><i>🇷🇼</i> Kinyarwanda</span>
                    <span class="expand-icon" style="cursor: pointer; float: right; font-size: 0.7rem;">${exp ? '▲' : '▼'}</span>
                </h3>
                ${exp ?
                    `<div class="flyer-description-full" style="margin-bottom: 10px; line-height: 1.4; font-size: 0.8rem;">${f.fullDescription || f.previewDescription}</div>` :
                    `<div class="flyer-description-preview" style="margin-bottom: 10px; font-size: 0.8rem;">${f.previewDescription || (f.fullDescription ? f.fullDescription.substring(0, 100) + '...' : 'Nta bisobanuro')}<div class="read-more-hint" style="color: #999; font-size: 0.6rem; margin-top: 3px;">👇 ${CLICK_TO_READ}</div></div>`
                }
                <div class="flyer-metadata" style="display: flex; gap: 10px; font-size: 0.65rem; color: #666; margin-bottom: 8px;">
                    <span><i>📅</i> ${f.date}</span>
                </div>
                <div class="interaction-bar" style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="interaction-btn ${liked ? 'liked' : ''}" onclick="handleLike('${f.id}', event)" ${liked ? 'disabled' : ''} style="background: ${liked ? '#e74c3c' : '#34495e'}; color: white; border: none; padding: 5px 10px; border-radius: 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem;">❤️ ${f.likes || 0}</button>
                    <button class="interaction-btn" onclick="toggleComments('${f.id}', event)" style="background: #34495e; color: white; border: none; padding: 5px 10px; border-radius: 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem;">💬 ${f.comments?.length || 0}</button>
                    <button class="interaction-btn ${knew ? 'knew-active' : ''}" onclick="handleKnew('${f.id}', event)" ${knew ? 'disabled' : ''} style="background: ${knew ? '#2ecc71' : '#34495e'}; color: white; border: none; padding: 5px 10px; border-radius: 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem;">✅ ${f.knew || 0}</button>
                    <button class="interaction-btn ${didnt ? 'didntknow-active' : ''}" onclick="handleDidntKnow('${f.id}', event)" ${didnt ? 'disabled' : ''} style="background: ${didnt ? '#e67e22' : '#34495e'}; color: white; border: none; padding: 5px 10px; border-radius: 20px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem;">❓ ${f.didntKnow || 0}</button>
                </div>
                ${comExp ? `
                    <div class="comments-section" onclick="event.stopPropagation()" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 8px;">
                        <div class="comment-input" style="display: flex; gap: 5px;">
                            <input type="text" id="comment-input-${f.id}" placeholder="${ADD_COMMENT_PLACEHOLDER}" style="flex: 1; padding: 5px 8px; border-radius: 20px; border: 1px solid #ddd; font-size: 0.7rem;">
                            <button onclick="addComment('${f.id}', event)" style="background: #764ba2; color: white; border: none; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-size: 0.65rem;">${POST_BUTTON}</button>
                        </div>
                        <div class="comment-list" style="margin-top: 6px; max-height: 100px; overflow-y: auto;">
                            ${(f.comments || []).map(c => `<div style="padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-size: 0.65rem;"><strong>${c.author}</strong>: ${c.text} <span style="color:#999; font-size:0.55rem;">${c.time}</span></div>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ==================== LOGIN ====================
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
    showLoginForm();
}
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}
function showLoginForm() {
    document.getElementById('modalTitle').innerHTML = '<i>🔐</i> Injira';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}
function showRegisterForm() {
    document.getElementById('modalTitle').innerHTML = '<i>📝</i> Iyandikishe';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return alert("Andika imeyili n'ijambo ry'ibanga!");
    const users = JSON.parse(localStorage.getItem('wrzkk_users')) || [];
    let user = users.find(u => u.email === email && u.password === password && u.role === 'registered');
    if (!user) {
        // Adopt identity on a new device — email IS the cloud key
        user = { id: email, role: 'registered', email, name: email.split('@')[0], password };
        users.push(user);
        localStorage.setItem('wrzkk_users', JSON.stringify(users));
    }
    const sessionId = Math.random().toString(36).substr(2, 16);
    user.sessionId = sessionId;
    user.lastActive = new Date().toISOString();
    localStorage.setItem('wrzkk_users', JSON.stringify(users));
    localStorage.setItem('wrzkk_session', sessionId);
    localStorage.setItem('wrzkk_user_id', user.id);
    localStorage.setItem('wrzkk_user_role', 'registered');
    localStorage.setItem('wrzkk_user_email', email);
    localStorage.setItem('wrzkk_user_name', user.name || email.split('@')[0]);
    hideLoginModal();
    updateUserStatus();
    alert('✅ Winjiye neza! ' + email);
    window.location.reload();
}

async function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    if (!name || !email || !password) return alert('Uzuza ibisabwa byose!');
    if (password.length < 6) return alert('Ijambo ry\'ibanga rigomba kugira byibura inyuguti 6');
    const users = JSON.parse(localStorage.getItem('wrzkk_users')) || [];
    if (users.find(u => u.email === email)) return alert('❌ Iyi imeyili isanzwe ikoreshwa');
    const sessionId = Math.random().toString(36).substr(2, 16);
    const newUser = {
        id: email,
        role: 'registered', email, password, name, sessionId,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        flyerCount: 0
    };
    users.push(newUser);
    localStorage.setItem('wrzkk_users', JSON.stringify(users));
    localStorage.setItem('wrzkk_session', sessionId);
    localStorage.setItem('wrzkk_user_id', newUser.id);
    localStorage.setItem('wrzkk_user_role', 'registered');
    localStorage.setItem('wrzkk_user_email', email);
    localStorage.setItem('wrzkk_user_name', name);
    hideLoginModal();
    updateUserStatus();
    alert('✅ Iyandikishya ryagenze neza! ' + name);
    window.location.reload();
}

function continueAsAnonymous() {
    let sessionId = localStorage.getItem('wrzkk_session');
    let users = JSON.parse(localStorage.getItem('wrzkk_users')) || [];
    if (!sessionId) {
        sessionId = Math.random().toString(36).substr(2, 16);
        const anonymousUser = {
            id: 'user_' + Date.now(),
            role: 'anonymous',
            sessionId,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            flyerCount: 0
        };
        users.push(anonymousUser);
        localStorage.setItem('wrzkk_users', JSON.stringify(users));
        localStorage.setItem('wrzkk_session', sessionId);
        localStorage.setItem('wrzkk_user_id', anonymousUser.id);
        localStorage.setItem('wrzkk_user_role', 'anonymous');
    }
    hideLoginModal();
    updateUserStatus();
    alert('🕶️ Ukomeza nk\'umugaruki');
}

function getCurrentUser() {
    const role = localStorage.getItem('wrzkk_user_role');
    const id = localStorage.getItem('wrzkk_user_id');
    const email = localStorage.getItem('wrzkk_user_email');
    const name = localStorage.getItem('wrzkk_user_name');
    if (role === 'registered' && email) {
        return { id: email.toLowerCase().trim(), role: 'registered', email, name };
    }
    return { id: id || 'anonymous_' + Date.now(), role: 'anonymous', name: 'Uwihitira' };
}

function updateUserStatus() {
    const role = localStorage.getItem('wrzkk_user_role');
    const email = localStorage.getItem('wrzkk_user_email');
    const name = localStorage.getItem('wrzkk_user_name');
    const badge = document.getElementById('userBadge');
    const authButton = document.getElementById('authButton');
    const nav = document.getElementById('numerologyNavBtn');
    if (role === 'registered' && email) {
        if (badge) { badge.className = 'user-badge registered'; badge.innerHTML = `📧 ${name || email.split('@')[0]}`; }
        if (authButton) { authButton.innerHTML = '👤 Konti yanjye'; authButton.onclick = showUserAccount; }
        if (nav) nav.style.display = 'inline-flex';
    } else {
        if (badge) { badge.className = 'user-badge anonymous'; badge.innerHTML = '🕶️ Uwihitira'; }
        if (authButton) { authButton.innerHTML = '🔐 Injira'; authButton.onclick = showLoginModal; }
        if (nav) nav.style.display = 'none';
    }
}

function showUserAccount() {
    const email = localStorage.getItem('wrzkk_user_email');
    const name = localStorage.getItem('wrzkk_user_name');
    if (confirm(`📧 ${email}\n👤 ${name}\n\n🔢 Jya kuri Numeroloji? (Cancel = gusohoka)`)) {
        window.location.href = 'numerology.html';
        return;
    }
    if (confirm('🐘 Ushaka gusohoka?')) {
        ['wrzkk_session','wrzkk_user_id','wrzkk_user_role','wrzkk_user_email','wrzkk_user_name']
            .forEach(k => localStorage.removeItem(k));
        continueAsAnonymous();
        window.location.reload();
    }
}

// ==================== COLOR REFRESH ====================
function addColorRefreshButton() {
    if (document.getElementById('colorRefreshBtn')) return;
    const filterSection = document.querySelector('.filter-section');
    if (!filterSection) return;
    const btn = document.createElement('button');
    btn.id = 'colorRefreshBtn';
    btn.className = 'clear-filter';
    btn.innerHTML = '<i>🎨</i> Hindura Amabara';
    btn.onclick = refreshAllColors;
    btn.style.cssText = 'background:#9b59b6; color:white; border:none; padding:6px 14px; border-radius:25px; cursor:pointer; margin-left:10px; font-size:0.8rem;';
    filterSection.appendChild(btn);
}

async function refreshAllColors() {
    if (!flyersCollection.length) return alert('Nta flyer zo guhindura amabara!');
    for (const flyer of flyersCollection) {
        flyer.colorClass = getRandomColorClass();
        await saveFlyerToCloud(flyer);
    }
    displayFlyers();
    alert('✅ Amabara yahinduwe neza!');
}

// ==================== PROVERBS (full set from local version + Bantu-first language pool) ====================
const rwandanProverbs = [
    { kinyarwanda: "Ababiri bagiye inama baruta umunani barasana.", translation: "Two who consult are better than eight who clash.", lesson: "Consultation leads to harmony; lack of it leads to conflict." },
    { kinyarwanda: "Ababiri bakika umwe.", translation: "Two break one.", lesson: "Unity or combined effort can overcome a single force." },
    { kinyarwanda: "Ababiri bateranya abeza.", translation: "Two gather the good ones.", lesson: "Collaboration helps select what is valuable." },
    { kinyarwanda: "Ababiri bica umwe.", translation: "Two kill one.", lesson: "Collective action can overpower an individual." },
    { kinyarwanda: "Ababiri ntibacibwa inka.", translation: "Two are not deprived of a cow.", lesson: "Unity prevents dispossession." },
    { kinyarwanda: "Abacuranye ubusa basangira ubundi.", translation: "Those who trade in vain share another (trade).", lesson: "Losses in one venture can be compensated by sharing in another." },
    { kinyarwanda: "Abadapfuye ntibabura kubonana.", translation: "The living never fail to meet again.", lesson: "Life brings people together repeatedly." },
    { kinyarwanda: "Abagabanye imbisi ntibagabana umufa.", translation: "Those who share raw meat do not share the broth.", lesson: "Sharing the primary gain does not guarantee sharing the secondary benefits." },
    { kinyarwanda: "Abagabo babiri ntibabana mu nzu imwe.", translation: "Two men do not live in one house.", lesson: "Too much male authority in one household breeds conflict." },
    { kinyarwanda: "Abagabo bararya imbwa zikishyura (zikaryora).", translation: "Men eat dogs that lick themselves.", lesson: "People benefit from those who serve or flatter them." },
    { kinyarwanda: "Abagira amenyo baraseka.", translation: "Those who have teeth laugh.", lesson: "Those with means or power enjoy life." },
    { kinyarwanda: "Abagira impingo ibigega biragwa.", translation: "Those who have backbones, their granaries fall.", lesson: "The strong or proud may still face ruin." },
    { kinyarwanda: "Abagira inyonjo bagira ibirori.", translation: "Those who have cleanliness have feasts.", lesson: "Cleanliness attracts abundance and celebration." },
    { kinyarwanda: "Abagiye inama Imana irabasanga.", translation: "Those who go to counsel, God finds them.", lesson: "God blesses those who seek advice." },
    { kinyarwanda: "Abahiga ubugabo baratabarana.", translation: "Those who hunt for manhood help each other.", lesson: "Those striving for maturity or courage support one another." },
    { kinyarwanda: "Abahigi benshi bayobya imbwa uburari.", translation: "Many hunters mislead the dog into the thicket.", lesson: "Too many leaders cause confusion." },
    { kinyarwanda: "Abahiniye hamwe bahima (bahenda) abari hanze.", translation: "Those who bend together drive away outsiders.", lesson: "United insiders exclude outsiders." },
    { kinyarwanda: "Abahizi babiri ntibanyura inzira imwe.", translation: "Two adulterers do not pass the same road.", lesson: "Accomplices in wrongdoing avoid being seen together." },
    { kinyarwanda: "Abajyanama babiri bishe umujyanama umwe.", translation: "Two advisors killed one advisor.", lesson: "A divided council can destroy a leader." },
    { kinyarwanda: "Abajyanama bacishije ukubiri ibyabo ntibishyika.", translation: "Advisors who hide their double intentions do not succeed.", lesson: "Duplicity in counsel leads to failure." },
    { kinyarwanda: "Abajyanama bishe imbwa y'umwami irahera.", translation: "Advisors killed the king's dog, it rots.", lesson: "Destroying a loyal servant of authority brings decay." },
    { kinyarwanda: "Abajya inama ari babiri banyaga inka z'abarasa munani.", translation: "Two who go to counsel stole the cows of eight strong men.", lesson: "Wise planning can overcome greater numbers." },
    { kinyarwanda: "Abajya impaka ari babiri umwe aba yigiza nkana.", translation: "Two who go to dispute, one becomes stubborn.", lesson: "In arguments, one party often becomes obstinate." },
    { kinyarwanda: "Abakingiranye inyegamo ntibakingirana ingabo.", translation: "Those who shield each other with a branch do not shield each other with shields.", lesson: "Small gestures of help do not equal full protection." },
    { kinyarwanda: "Abakiranye ntibahishana ibibuno.", translation: "Those who have reconciled do not hide their buttocks from each other.", lesson: "True reconciliation brings complete openness." },
    { kinyarwanda: "Abakobwa ni nyampinga.", translation: "Girls are beauties.", lesson: "Daughters are precious and valued." },
    { kinyarwanda: "Abakundanye barajyana.", translation: "Lovers accompany each other.", lesson: "Love fosters companionship." },
    { kinyarwanda: "Abakundanye ni bo bangana.", translation: "Those who love each other are equals.", lesson: "True love creates equality." },
    { kinyarwanda: "Abakunzi baza bishize.", translation: "Lovers come when it is late.", lesson: "Lovers arrive after the fact or belatedly." },
    { kinyarwanda: "Abakwe ni aba mbere; ibya nyuma bica amazuru.", translation: "Suitors come first; later events cut the noses.", lesson: "Early advantages may later become liabilities." },
    { kinyarwanda: "Abana ba Samusure bavukana isunzu.", translation: "Children of Samusure are born with a lock of hair.", lesson: "Some characteristics are inborn." },
    { kinyarwanda: "Abana basangira ibere ntibasangira umugisha.", translation: "Children who share the breast do not share the blessing.", lesson: "Early shared resources do not guarantee later shared blessings." },
    { kinyarwanda: "Abana ni babiri: Gahanwa na Gahannyi.", translation: "Children are two: the condemned and the condemner.", lesson: "In every situation there is the accused and the accuser." },
    { kinyarwanda: "Abana ni batatu: Uwibwira, Ubwirwa na Tereriyo.", translation: "Children are three: the thinker, the told, and Tereriyo.", lesson: "People have different roles: advisor, advised, and the listener." },
    { kinyarwanda: "Abahanga babiri ntibotsa igihaha.", translation: "Two experts do not brew sour beer.", lesson: "Too many experts spoil the task." },
    { kinyarwanda: "Abangana ubwenge basa ntibabana.", translation: "Those equal in intelligence do not live together.", lesson: "Equals in cleverness clash in close quarters." },
    { kinyarwanda: "Abantu n'ibintu ni magirirane.", translation: "People and things are mutual.", lesson: "People and possessions interact and affect each other." },
    { kinyarwanda: "Abaryi b'imigongo baribwire.", translation: "Eaters of backs should eat alone.", lesson: "Those who exploit others should not expect company." },
    { kinyarwanda: "Abasangira bashonje ntawe usigariza undi.", translation: "Those who share when hungry, none leaves for another.", lesson: "In real need, sharing is immediate and complete." },
    { kinyarwanda: "Abasangiye basigana imbyiro.", translation: "Those who shared leave each other the leftovers.", lesson: "Past sharing creates obligations for the future." },
    { kinyarwanda: "Abasangira ubusa bitana ibisambo.", translation: "Those who share emptiness call each other names.", lesson: "Sharing poverty leads to insults." },
    { kinyarwanda: "Abasangiye imfizi ntibasekana amahembe magufi.", translation: "Those who shared a bull do not laugh at short horns.", lesson: "Those who shared a resource do not mock its minor defects." },
    { kinyarwanda: "Abasa barasangira.", translation: "The similar share.", lesson: "Like attracts like and shares together." },
    { kinyarwanda: "Abaswa ntiberekwa imishinga.", translation: "The termite-ridden are not shown spears.", lesson: "Don't tempt those already vulnerable." },
    { kinyarwanda: "Abatanye badatata barasubirana.", translation: "Those who separated without fighting reconcile.", lesson: "Peaceful separation allows for later reunion." },
    { kinyarwanda: "Abateranye imigeri ntibahisha n'amabya.", translation: "Those who share a riverbank do not hide even the small stones.", lesson: "Close neighbors share everything openly." },
    { kinyarwanda: "Abaturanye babyarana abana basa.", translation: "Neighbors beget similar children.", lesson: "Neighbors influence each other's offspring." },
    { kinyarwanda: "Abatutira batongana batura ukubiri.", translation: "Those who insult each other and then reconcile become twice as close.", lesson: "Reconciliation after conflict strengthens bonds." },
    { kinyarwanda: "Abavandimwe iyo bavumbitse akarenge uvumburamo akawe.", translation: "When siblings dig up a foot, you dig up yours.", lesson: "Family members share both labor and discovery." },
    { kinyarwanda: "Abegereye uruganda ntibabura urwavumba.", translation: "Those near the forge lack no coal.", lesson: "Proximity to a resource ensures supply." },
    { kinyarwanda: "Aberekeranye ntibabura kwendana.", translation: "Those who show each other the way never fail to love each other.", lesson: "Mutual guidance fosters affection." },
    { kinyarwanda: "Abeza ba ruguru baseka ibimuga bishinyikiye mu kabande.", translation: "The good from above laugh at the cripples stuck in the ditch.", lesson: "The fortunate mock those trapped in misfortune." },
    { kinyarwanda: "Abibeshya b'i Mukarange bagira ngo Nyiraguheka ni nyirasenge.", translation: "The deceivers of Mukarange say Nyiraguheka is the paternal aunt.", lesson: "Lies create false kinship claims." },
    { kinyarwanda: "Abishunga b'i Mukarange bagira ngo Nyiraguheka ni nyinawabo.", translation: "Those who hide at Mukarange say Nyiraguheka is their sister.", lesson: "Refuge-seekers claim false kinship." },
    { kinyarwanda: "Ab'imbwa bifuza ko budacya.", translation: "Dog owners wish it would not dawn.", lesson: "Those with shameful secrets wish darkness would last." },
    { kinyarwanda: "Aboro babiri ntibasangira umwerera.", translation: "Two paupers do not share a single gown.", lesson: "The extremely poor cannot share even minimal resources." },
    { kinyarwanda: "Aboro basera guhanya.", translation: "Paupers laugh at division.", lesson: "The destitute mock even the idea of sharing." },
    { kinyarwanda: "Abo ntekera impengeri ni bo bantera amabuye.", translation: "Those for whom I weave a basket are the ones who throw stones at me.", lesson: "Those you help may turn against you." },
    { kinyarwanda: "Abonye isha itamba ata n'urwo yari yambaye.", translation: "He who found a louse without a head had nothing on.", lesson: "Finding a worthless thing shows one's own poverty." },
    { kinyarwanda: "Abotanye kera ntibahishanya amabya.", translation: "Those who interwove long ago do not hide pebbles from each other.", lesson: "Old friends share everything, even small things." },
    { kinyarwanda: "Abo umwami yahaye amata ni bo bamwimye amatwi.", translation: "Those to whom the king gave milk are the ones who refused him ears.", lesson: "Those you favor may later ignore you." },
    { kinyarwanda: "Abwirwa benshi akumva bene yo.", translation: "Many who are told, only one of them hears.", lesson: "Advice is given to many but heeded by few." },
    { kinyarwanda: "Acuritse inkanda ntacuritse umutima.", translation: "He who plaited a headpad did not plait the heart.", lesson: "Appearances do not reflect inner feelings." },
    { kinyarwanda: "Agaca amakungu ni ukwima uwarugendagamo.", translation: "Cutting the rope is to miss the one who walked with it.", lesson: "Breaking a bond leaves you longing for the missing partner." },
    { kinyarwanda: "Agaciro gake karuta akamaro gacye.", translation: "Small value is better than small usefulness.", lesson: "Intrinsic worth outweighs minor utility." },
    { kinyarwanda: "Agacumu gahabwa agahari, naho agahararutswe gahabwa agahini.", translation: "A spear is given to the present, but the one passed over is given to the bent-over.", lesson: "Rewards depend on position and posture." },
    { kinyarwanda: "Agacumu kazaguhorera (kazahorera umugabo) ntumenya uwagacuze.", translation: "The spear that will kill you – you don't know who forged it.", lesson: "The cause of your downfall may be unknown." },
    { kinyarwanda: "Agahana imbwa ni agashirira.", translation: "The one who feeds dogs is the one who calms them.", lesson: "He who provides controls." },
    { kinyarwanda: "Agahanga k'umugabo gahangurwa n'uwakaremye.", translation: "A man's destiny is awakened by his creator.", lesson: "God alone determines one's fate." },
    { kinyarwanda: "Agahanga k'umugabo gahuma katavuze.", translation: "A man's destiny becomes silent without speaking.", lesson: "Fate works silently." },
    { kinyarwanda: "Agahango gato karuta umugenderano.", translation: "A small promise is better than a long association.", lesson: "A kept small promise outweighs a prolonged but unreliable relationship." },
    { kinyarwanda: "Agahararo ntikabuza agahararuko.", translation: "A crowd does not lack a shout.", lesson: "Where there are many people, noise follows." },
    { kinyarwanda: "Agaharawe gahabwa agahari, naho agahararutswe gahabwa agahini.", translation: "The one given to is given to the present, the passed over is given to the bent.", lesson: "Rewards go to those present, not to the absent." },
    { kinyarwanda: "Agahimbaza umusyi kaba munsi y'ingasire.", translation: "The one who pleases the father-in-law sits under the granary.", lesson: "Honoring elders brings protection and provision." },
    { kinyarwanda: "Agahinda gahima indyarya kaba mu rutare kwa Rwirebe.", translation: "Sorrow divides the hypocrite and sits on the rock of Rwirebe.", lesson: "Hypocrites are split by grief." },
    { kinyarwanda: "Agahinda gashira akandi kari itumba.", translation: "One sorrow ends, another waits in the dark.", lesson: "Troubles follow one another." },
    { kinyarwanda: "Agahinda gashira bake.", translation: "Sorrow ends for few.", lesson: "Few people escape grief." },
    { kinyarwanda: "Agahinda k'inkoko kamenya inkike yatoyemo.", translation: "A hen's sorrow is known by the chick that was inside it.", lesson: "A mother's loss is felt by the child she carried." },
    { kinyarwanda: "Agahinda k'inkono kamenywa n'uwayiharuye.", translation: "A pot's sorrow is known by the one who scraped it.", lesson: "Only the user knows the wear and tear of a tool." },
    { kinyarwanda: "Agahinda ntigashira; gashira nyirako yapfuye.", translation: "Sorrow does not end; it ends when its owner dies.", lesson: "Grief lasts a lifetime." },
    { kinyarwanda: "Agahinda ntikajya ahabona.", translation: "Sorrow does not go where it can be seen.", lesson: "People hide their grief." },
    { kinyarwanda: "Agahinda ntikica kagira mubi.", translation: "Sorrow does not kill, it makes one evil.", lesson: "Prolonged grief can corrupt character." },
    { kinyarwanda: "Agahinda ni ukubura uwo ukunda.", translation: "Sorrow is lacking the one you love.", lesson: "Grief stems from the absence of a loved one." },
    { kinyarwanda: "Agahinda si uguhora urira.", translation: "Sorrow is not crying constantly.", lesson: "Grief is internal, not always visible." },
    { kinyarwanda: "Agahini gahima indyarya kaba mu rutare rwa Kirebe.", translation: "The bent one divides the hypocrite and sits on Kirebe's rock.", lesson: "Humility exposes hypocrisy." },
    { kinyarwanda: "Agahugu Imana yagusasiye ntukarenga.", translation: "The boundary God drew for you, do not cross.", lesson: "Respect divine limits." },
    { kinyarwanda: "Agahugu k'abagore ntikabura amazimwe.", translation: "Women's boundary never lacks tears.", lesson: "Women's lives are marked by sorrow." },
    { kinyarwanda: "Agahugu karimo indushyi, abapfu ntibabura amazu.", translation: "The boundary has graves, the dead never lack houses.", lesson: "Death claims everyone eventually." },
    { kinyarwanda: "Agahuru gakomeye kiyima umupfu.", translation: "A big granary denies itself flour.", lesson: "Great abundance can lead to waste or denial." },
    { kinyarwanda: "Agahuru gasabye umuntu inyama ntakarenga.", translation: "A granary that asks a person for meat does not exceed.", lesson: "Resources that demand more than they give are limited." },
    { kinyarwanda: "Agahuru kagusabye amaraso ntukarenga.", translation: "A granary that asks you for blood, do not exceed.", lesson: "Don't give more than you can afford to a demanding system." },
    { kinyarwanda: "Agahuru gahinyuza inkumi.", translation: "The granary humiliates the unmarried girl.", lesson: "Poverty or dependence shames the young." },
    { kinyarwanda: "Agahwa kari ku wundi karahandurika.", translation: "A thorn on another can be removed.", lesson: "It's easier to solve others' problems than your own." },
    { kinyarwanda: "Agakambye ugatega u Rwanda (ugatega iminsi).", translation: "The small frog that listens to Rwanda (listens to days).", lesson: "Timing and place are crucial for survival." },
    { kinyarwanda: "Agakara gasiga imbwa ntigasiga akako.", translation: "An old hand leaves a dog but does not leave a small hoe.", lesson: "One abandons what is less useful but keeps essential tools." },
    { kinyarwanda: "Agakecuru gakize ntikabura abuzukuru.", translation: "A rich old person does not lack grandchildren.", lesson: "Wealth attracts descendants and helpers." },
    { kinyarwanda: "Agakecuru gatanze akandi gushoka kagira ngo dore ubwo butama bwako.", translation: "An old person gave another and then said, 'Look at your sheep.'", lesson: "Gifts may come with strings attached." },
    { kinyarwanda: "Agakecuru karitse ntikabura abuzukuru.", translation: "An old person who eats alone does not lack grandchildren.", lesson: "Selfish elders still attract heirs due to their wealth." }
];

function cleanProverbText(text) {
    if (!text || typeof text !== 'string') return text || '';
    return text
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*\[[^\]]*\]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function normalizeProverb(proverb) {
    if (!proverb) return proverb;
    return {
        ...proverb,
        kinyarwanda: cleanProverbText(proverb.kinyarwanda),
        translation: cleanProverbText(proverb.translation),
        lesson: cleanProverbText(proverb.lesson)
    };
}

function getRandomLocalProverb() {
    const randomIndex = Math.floor(Math.random() * rwandanProverbs.length);
    return normalizeProverb({ ...rwandanProverbs[randomIndex] });
}

function getProverbOfTheDay() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const index = dayOfYear % rwandanProverbs.length;
    return { ...rwandanProverbs[index] };
}

// ==================== API CONFIGURATION (kept but disabled) ====================
const AFRICAN_PROVERBS_API = 'https://africanproverbs.vercel.app/api/getproverb';
const QUOTEVERSE_API = 'https://quoteverse-api.com/proverbs/african';
const USE_API = false;
const API_TIMEOUT = 5000;

function fetchWithTimeoutProverb(url, timeout = API_TIMEOUT) {
    return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API request timeout')), timeout)
        )
    ]);
}

async function fetchFromAfricanProverbsAPI() {
    try {
        const response = await fetchWithTimeoutProverb(AFRICAN_PROVERBS_API);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data && data.proverb) {
            return {
                kinyarwanda: data.proverb || data.quote || "Ubugeni bw'abanyarwanda",
                translation: data.meaning || data.english || "Wisdom from Africa",
                lesson: data.interpretation || data.lesson || `💡 ${data.meaning || "Amabwiriza y'ubugeni"}`,
                source: 'api'
            };
        }
        throw new Error('Invalid API response format');
    } catch (error) {
        console.warn('African Proverbs API failed:', error.message);
        return null;
    }
}

async function fetchFromQuoteVerseAPI() {
    try {
        const response = await fetchWithTimeoutProverb(QUOTEVERSE_API);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data && data.quote) {
            return {
                kinyarwanda: data.quote,
                translation: data.quote,
                lesson: `💡 ${data.author || 'African wisdom'} | ${data.tags?.join(', ') || ''}`,
                source: 'quoteverse'
            };
        }
        throw new Error('Invalid QuoteVerse response');
    } catch (error) {
        console.warn('QuoteVerse API failed:', error.message);
        return null;
    }
}

async function fetchProverbFromAPI() {
    if (!USE_API) return null;
    const primaryResult = await fetchFromAfricanProverbsAPI();
    if (primaryResult) return primaryResult;
    const secondaryResult = await fetchFromQuoteVerseAPI();
    if (secondaryResult) return secondaryResult;
    return null;
}

// ==================== DISPLAY FUNCTIONS ====================
let currentProverbData = null;
let proverbAnimTimer = null;

const PROVERB_ANIM_CLASSES = [
    'proverb-anim-glow',
    'proverb-anim-float',
    'proverb-anim-pulse',
    'proverb-anim-breathe',
    'proverb-anim-wave',
    'proverb-anim-drift',
    'proverb-anim-shimmer'
];

const PROVERB_COLORS = [
    '#FFE8A3', '#A8F0D8', '#FFB4C4', '#B8E4FF', '#FFD966',
    '#E8CCFF', '#FF9EC4', '#9EF5C8', '#FFC98A', '#D4F1FF',
    '#F5A962', '#C5F6FA', '#F9E79F', '#D7BDE2', '#AED6F1',
    '#FAD7A0', '#A9DFBF', '#F5B7B1', '#D6EAF8', '#F9E79F'
];

function pickRandomProverbItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function clearProverbAnimTimer() {
    if (proverbAnimTimer) {
        clearTimeout(proverbAnimTimer);
        proverbAnimTimer = null;
    }
}

function applyProverbVisualStyle(el) {
    if (!el) return;
    PROVERB_ANIM_CLASSES.forEach((cls) => el.classList.remove(cls));
    void el.offsetWidth;
    const animClass = pickRandomProverbItem(PROVERB_ANIM_CLASSES);
    const color = pickRandomProverbItem(PROVERB_COLORS);
    const duration = (2.5 + Math.random() * 5.5).toFixed(2);
    el.classList.add(animClass);
    el.style.setProperty('--proverb-anim-duration', `${duration}s`);
    el.style.color = color;
    el.style.textShadow = `0 1px 5px rgba(0,0,0,0.45), 0 0 14px ${color}55`;
}

function scheduleNextProverbAnim(el) {
    const delay = 3500 + Math.random() * 5500;
    proverbAnimTimer = setTimeout(() => {
        if (!document.getElementById('dailyProverb')) {
            clearProverbAnimTimer();
            return;
        }
        applyProverbVisualStyle(el);
        scheduleNextProverbAnim(el);
    }, delay);
}

function startProverbAnimCycle(el) {
    clearProverbAnimTimer();
    applyProverbVisualStyle(el);
    scheduleNextProverbAnim(el);
}

function stopProverbAnimCycle(el) {
    clearProverbAnimTimer();
    if (el) {
        PROVERB_ANIM_CLASSES.forEach((cls) => el.classList.remove(cls));
    }
}

// ============ LANGUAGE POOL — BANTU FIRST, THEN WIDER AFRICA, THEN WORLD ============
const PROVERB_LANG_POOL = [
    // --- Bantu languages (prioritised, guaranteed in each batch) ---
    { code: 'rw', label: 'Kinyarwanda' },
    { code: 'rn', label: 'Kirundi' },
    { code: 'sw', label: 'Kiswahili' },
    { code: 'lg', label: 'Luganda' },
    { code: 'ln', label: 'Lingala' },
    { code: 'ny', label: 'Chichewa' },
    { code: 'sn', label: 'Shona' },
    { code: 'zu', label: 'Zulu' },
    { code: 'xh', label: 'Xhosa' },
    { code: 'st', label: 'Sesotho' },
    { code: 'tn', label: 'Setswana' },
    { code: 'ts', label: 'Xitsonga' },
    // --- Other African languages ---
    { code: 'om', label: 'Oromo' },
    { code: 'so', label: 'Somali' },
    { code: 'am', label: 'Amharic' },
    { code: 'ha', label: 'Hausa' },
    { code: 'yo', label: 'Yoruba' },
    { code: 'ig', label: 'Igbo' },
    // --- Wider world ---
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'ar', label: 'العربية' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'hi', label: 'हिन्दी' }
];

/**
 * Always include 5 Bantu languages + 3 others (African or world).
 * Bantu guaranteed: at least 5 of the 8 picked.
 */
function pickRandomProverbLangs(count = 8) {
    const bantu = PROVERB_LANG_POOL.slice(0, 12);
    const african = PROVERB_LANG_POOL.slice(12, 18);
    const world = PROVERB_LANG_POOL.slice(18);

    const shuffledBantu = [...bantu].sort(() => Math.random() - 0.5);
    const rest = [...african, ...world].sort(() => Math.random() - 0.5);

    const bantuCount = Math.min(5, bantu.length);
    const restCount = Math.max(count - bantuCount, 0);

    return [
        ...shuffledBantu.slice(0, bantuCount),
        ...rest.slice(0, restCount)
    ];
}

// ==================== MANAGER LINK INJECTION ====================
async function injectManagerLink() {
    // Don't double-add
    if (document.getElementById('tabManager')) return;

    const navTabs = document.querySelector('.nav-tabs');
    if (!navTabs) return;

    // Check if the current user is an approved manager (from cloud)
    let allowed = false;
    try {
        const myEmail = (localStorage.getItem('wrzkk_user_email') || '').toLowerCase().trim();
        const SUPER_ADMIN_EMAIL = 'innovatorsedvance@gmail.com';

        // Super admin always sees it
        if (myEmail === SUPER_ADMIN_EMAIL) {
            allowed = true;
        } else if (myEmail) {
            const res = await fetch('/api/managers');
            if (res.ok) {
                const list = await res.json();
                allowed = list.some(m =>
                    (m.email || '').toLowerCase() === myEmail && m.is_active !== false
                );
            }
        }
    } catch { /* network down → don't show */ }

    if (!allowed) return;

    const a = document.createElement('a');
    a.className = 'nav-tab nav-tab-link';
    a.href = 'manager.html';
    a.id = 'tabManager';
    a.style.background = '#f39c12';
    a.style.color = 'white';
    a.innerHTML = '<i>👑</i> Igenzuriro';
    navTabs.appendChild(a);
}

// ==================== SUPABASE REALTIME ====================
const SUPABASE_URL = 'https://yfqmkbzvsxikopbysrep.supabase.co';   // ← FILL IN
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcW1rYnp2c3hpa29wYnlzcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNjg1ODMsImV4cCI6MjEwNTY0NDU4M30.2egjfNM0UpGjcn5kOFAWBIigTK85bW3icb_thoh0J5Y';                     // ← FILL IN
let realtimeChannel = null;

function startFlyerRealtime() {
    if (realtimeChannel) return;
    if (typeof supabase === 'undefined') {
        console.warn('Supabase SDK not loaded — realtime disabled');
        return;
    }
    try {
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        realtimeChannel = client
            .channel('flyers-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'flyers' },
                (payload) => {
                    console.log('🔔 Realtime change:', payload.eventType, payload.new?.title || payload.old?.id);
                    handleRealtimeChange(payload);
                }
            )
            .subscribe((status) => {
                console.log('Realtime status:', status);
            });
    } catch (err) {
        console.warn('Realtime setup failed:', err.message);
    }
}

function handleRealtimeChange(payload) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT' && newRow) {
        const exists = flyersCollection.some(f => String(f.id) === String(newRow.id));
        if (!exists) {
            flyersCollection.unshift(rowToFlyer(newRow));
            console.log('🆕 Flyer added:', newRow.title);
        }
    } else if (eventType === 'UPDATE' && newRow) {
        const idx = flyersCollection.findIndex(f => String(f.id) === String(newRow.id));
        if (idx !== -1) {
            flyersCollection[idx] = { ...flyersCollection[idx], ...rowToFlyer(newRow) };
            console.log('✏️ Flyer updated:', newRow.title);
        } else {
            flyersCollection.push(rowToFlyer(newRow));
        }
    } else if (eventType === 'DELETE' && oldRow) {
        flyersCollection = flyersCollection.filter(f => String(f.id) !== String(oldRow.id));
        console.log('🗑️ Flyer deleted:', oldRow.id);
    }

    updateCollectionCount();
    displayFlyers();
    try {
        localStorage.setItem('wrzkk_flyers', JSON.stringify(flyersCollection));
    } catch {}
}

function hideProverbTranslations(event) {
    if (event) event.stopPropagation();
    const overlay = document.getElementById('proverbTransOverlay');
    const panel = document.getElementById('proverbTranslations');
    if (overlay) overlay.style.display = 'none';
    if (panel) panel.innerHTML = '';
}

function showProverbLoading() {
    const kinyarwandaEl = document.getElementById('dailyProverb');
    if (kinyarwandaEl) {
        stopProverbAnimCycle(kinyarwandaEl);
        kinyarwandaEl.innerHTML = '<span class="loading-spinner"></span> Itegura...';
        kinyarwandaEl.classList.remove('proverb-error');
        kinyarwandaEl.style.color = 'rgba(255, 255, 255, 0.9)';
    }
}

function displayProverb(proverb) {
    const kinyarwandaEl = document.getElementById('dailyProverb');
    if (!kinyarwandaEl || !proverb?.kinyarwanda) return;

    currentProverbData = normalizeProverb(proverb);
    hideProverbTranslations();

    kinyarwandaEl.style.opacity = '0';
    setTimeout(() => {
        kinyarwandaEl.innerHTML = `“${currentProverbData.kinyarwanda}”`;
        kinyarwandaEl.classList.remove('proverb-error');
        kinyarwandaEl.style.opacity = '1';
        startProverbAnimCycle(kinyarwandaEl);
    }, 120);
}

// Works whether HTML calls toggleProverbTranslations or showProverbTranslations
async function toggleProverbTranslations(event) {
    if (event) event.stopPropagation();
    const overlay = document.getElementById('proverbTransOverlay');
    const panel = document.getElementById('proverbTranslations');
    if (!overlay || !panel || !currentProverbData) return;

    if (overlay.style.display === 'flex') {
        hideProverbTranslations();
        return;
    }

    overlay.style.display = 'flex';
    panel.innerHTML = '<div class="proverb-trans-loading"><span class="loading-spinner"></span> Birahindurwa...</div>';

    const baseEn = currentProverbData.translation
        || await translateProverbLang(currentProverbData.kinyarwanda, 'rw', 'en')
        || currentProverbData.kinyarwanda;

    const randomLangs = pickRandomProverbLangs(8);

    const lines = await Promise.all(randomLangs.map(async (lang) => {
        if (lang.code === 'rw') {
            return { label: lang.label, text: currentProverbData.kinyarwanda };
        }
        const text = lang.code === 'en'
            ? baseEn
            : (await translateProverbLang(baseEn, 'en', lang.code) || baseEn);
        return { label: lang.label, text: cleanProverbText(text) };
    }));

    panel.innerHTML = lines.map((item) => `
        <div class="proverb-lang-line">
            <span class="proverb-lang-name">${item.label}</span>
            <span class="proverb-lang-text">“${escapeHtml(item.text)}”</span>
        </div>
    `).join('');
}

async function loadProverb() {
    showProverbLoading();
    try {
        let proverb = null;
        if (USE_API) {
            proverb = await fetchProverbFromAPI();
        }
        if (!proverb) {
            proverb = getRandomLocalProverb();
        }
        displayProverb(proverb);
    } catch (error) {
        console.error('Unexpected error loading proverb:', error);
        displayProverb(getRandomLocalProverb());
    }
}

async function refreshProverb(event) {
    if (event) event.stopPropagation();
    hideProverbTranslations();
    const refreshBtn = document.querySelector('.proverb-refresh');
    if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            refreshBtn.style.transform = '';
        }, 500);
    }
    await loadProverb();
}

// ==================== LOGO COLOR CYCLE ====================
const LOGO_COLOR_PALETTES = [
    { stroke: 'rgba(255, 255, 255, 0.95)', fill: '#5B7A9D', bandStroke: '#1e2d3d' },
    { stroke: '#FFE8A3', fill: '#4ECDC4', bandStroke: '#1a4a44' },
    { stroke: '#FFD966', fill: '#B19CD9', bandStroke: '#3d2a5c' },
    { stroke: '#A8F0D8', fill: '#FF8B94', bandStroke: '#5c2a32' },
    { stroke: '#B8E4FF', fill: '#96CEB4', bandStroke: '#2a4a38' },
    { stroke: '#F5A962', fill: '#45B7D1', bandStroke: '#1e4a5c' },
    { stroke: '#E8CCFF', fill: '#FFB347', bandStroke: '#5c3d12' },
    { stroke: '#D4F1FF', fill: '#B83B5E', bandStroke: '#4a1528' }
];

let logoColorTimer = null;

function applyLogoPalette(palette) {
    const logo = document.getElementById('siteLogo');
    if (!logo || !palette) return;
    logo.style.setProperty('--logo-stroke', palette.stroke);
    logo.style.setProperty('--logo-band-fill', palette.fill);
    logo.style.setProperty('--logo-band-stroke', palette.bandStroke);
}

function startLogoColorCycle() {
    const logo = document.getElementById('siteLogo');
    if (!logo) return;
    if (logoColorTimer) clearInterval(logoColorTimer);
    let paletteIndex = 0;
    applyLogoPalette(LOGO_COLOR_PALETTES[paletteIndex]);
    logoColorTimer = setInterval(() => {
        paletteIndex = (paletteIndex + 1) % LOGO_COLOR_PALETTES.length;
        applyLogoPalette(LOGO_COLOR_PALETTES[paletteIndex]);
    }, 4200);
}

// ==================== QUOTE SCROLL ====================
const QUOTE_CATEGORY_COLORS = {
    'africa-indigenous': '#2ecc71',
    'africa-kings':      '#c9a227',
    'africa-warriors':   '#b83227',
    'africa-heroes':     '#16a085',
    'africa-wisemen':    '#7d5a2c',
    'worldwide-famous':       '#e91e63',
    'worldwide-continental':  '#3498db',
    'worldwide-popular':      '#f39c12',
    'worldwide-unpopular':    '#7f8c8d',
    'worldwide-trending':     '#8e44ad'
};

const QUOTE_AUTHORS_BY_CATEGORY = {
    'africa-indigenous': ['Mansa Musa', 'Shaka Zulu', 'Sundiata Keita', 'Queen Nzinga', 'Idris Alooma'],
    'africa-kings': ['Haile Selassie', 'Moshoeshoe I', 'Menelik II', 'Cetshwayo', 'Lobengula'],
    'africa-warriors': ['Shaka Zulu', 'Queen Amina', 'Samori Ture', 'Taharqa', 'Ahmed Baba'],
    'africa-heroes': ['Nelson Mandela', 'Patrice Lumumba', 'Samora Machel', 'Amílcar Cabral', 'Thomas Sankara'],
    'africa-wisemen': ['Chinua Achebe', 'Wole Soyinka', 'Ngũgĩ wa Thiong\'o', 'Cheikh Anta Diop', 'Ali Mazrui'],
    'worldwide-famous': ['Albert Einstein', 'Mahatma Gandhi', 'Martin Luther King Jr.', 'Winston Churchill', 'Nelson Mandela'],
    'worldwide-continental': ['Simón Bolívar', 'José Martí', 'Kwame Nkrumah', 'Jawaharlal Nehru', 'Sun Yat-sen'],
    'worldwide-popular': ['Leonardo da Vinci', 'Marie Curie', 'Carl Sagan', 'Stephen Hawking', 'Neil Armstrong'],
    'worldwide-unpopular': ['Niccolò Machiavelli', 'Friedrich Nietzsche', 'Karl Marx', 'Ayn Rand', 'Sun Tzu'],
    'worldwide-trending': ['Greta Thunberg', 'Malala Yousafzai', 'Yuval Noah Harari', 'Barack Obama', 'Yuval Harari']
};

const LOCAL_QUOTES_FALLBACK = {
    'africa-indigenous': [
        { quote: 'The strength of the crocodile is in the water.', author: 'Shaka Zulu' },
        { quote: 'A king is a king by his people, not by his throne.', author: 'Sundiata Keita' }
    ],
    'africa-kings': [
        { quote: 'Until the philosophy which holds one race superior and another inferior is finally and permanently discredited, everywhere is war.', author: 'Haile Selassie' },
        { quote: 'I am a king who rules with the help of my people.', author: 'Moshoeshoe I' }
    ],
    'africa-warriors': [
        { quote: 'A warrior does not give up because he is tired; he gives up because the fight is finished.', author: 'Shaka Zulu' },
        { quote: 'The woman who rules is the woman who fears no man.', author: 'Queen Amina' }
    ],
    'africa-heroes': [
        { quote: 'What counts in life is not the mere fact that we have lived. It is what difference we have made to the lives of others that determines the significance of the life we lead.', author: 'Nelson Mandela' },
        { quote: 'A man who has no enemies has no principles.', author: 'Patrice Lumumba' },
        { quote: 'Africa must unite, or it will perish.', author: 'Kwame Nkrumah' }
    ],
    'africa-wisemen': [
        { quote: 'If one finger brought oil it soiled all the others.', author: 'Chinua Achebe' },
        { quote: 'The man who is not afraid of death is already dead.', author: 'Wole Soyinka' },
        { quote: 'Until the lion learns how to write, every story will glorify the hunter.', author: 'Chinua Achebe' }
    ],
    'worldwide-famous': [
        { quote: 'Two things are infinite: the universe and human stupidity; and I\'m not sure about the universe.', author: 'Albert Einstein' },
        { quote: 'Injustice anywhere is a threat to justice everywhere.', author: 'Martin Luther King Jr.' },
        { quote: 'Never give in, never give in, never, never, never, never — in nothing, great or small, large or petty — never give in except to convictions of honour and good sense.', author: 'Winston Churchill' }
    ],
    'worldwide-continental': [
        { quote: 'All who have served the Revolution have plowed the sea.', author: 'Simón Bolívar' },
        { quote: 'A nation that has no faith in itself cannot inspire faith in others.', author: 'José Martí' }
    ],
    'worldwide-popular': [
        { quote: 'When once you have tasted flight, you will forever walk the earth with your eyes turned skyward.', author: 'Leonardo da Vinci' },
        { quote: 'The Cosmos is all that is or was or ever will be.', author: 'Carl Sagan' },
        { quote: 'However difficult life may seem, there is always something you can succeed at.', author: 'Stephen Hawking' }
    ],
    'worldwide-unpopular': [
        { quote: 'He who wishes to be obeyed must know how to command.', author: 'Niccolò Machiavelli' },
        { quote: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
        { quote: 'The supreme art of war is to subdue the enemy without fighting.', author: 'Sun Tzu' }
    ],
    'worldwide-trending': [
        { quote: 'You are never too small to make a difference.', author: 'Greta Thunberg' },
        { quote: 'One child, one teacher, one book, one pen can change the world.', author: 'Malala Yousafzai' },
        { quote: 'Change is the only constant.', author: 'Yuval Noah Harari' }
    ]
};

const QUOTE_FETCH_TIMEOUT_MS = 4000;
const PORTRAIT_FETCH_TIMEOUT_MS = 3500;

function fetchWithTimeoutQuote(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal, cache: 'no-store' })
        .finally(() => clearTimeout(timer));
}

function authorMatches(requested, returned) {
    if (!requested || !returned) return false;
    const norm = (s) => s
        .toLowerCase()
        .replace(/\b(jr|sr|ii|iii|iv)\.?\b/g, '')
        .replace(/[^a-zà-ÿ' ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const a = norm(requested);
    const b = norm(returned);
    if (!a || !b) return false;
    if (a === b) return true;
    const lastWord = a.split(' ').pop();
    if (lastWord.length >= 4 && b.includes(lastWord)) return true;
    const backWord = b.split(' ').pop();
    if (backWord.length >= 4 && a.includes(backWord)) return true;
    return false;
}

async function fetchFromQuoteGarden(author) {
    try {
        const url = `https://quote-garden.onrender.com/api/v3/quotes/random?author=${encodeURIComponent(author)}`;
        const res = await fetchWithTimeoutQuote(url, QUOTE_FETCH_TIMEOUT_MS);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json?.data;
        if (!data) throw new Error('empty');
        const first = Array.isArray(data) ? data[0] : data;
        if (!first?.quoteText) throw new Error('missing quoteText');
        if (!authorMatches(author, first.quoteAuthor)) {
            console.warn('[quote] Quote Garden returned a different author:',
                first.quoteAuthor, 'for request', author);
            return null;
        }
        return { quote: first.quoteText, author: first.quoteAuthor || author };
    } catch (err) {
        console.warn('[quote] Quote Garden failed:', err.message);
        return null;
    }
}

async function fetchFromWikiquote(author) {
    try {
        const searchUrl = `https://en.wikiquote.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(author)}&srlimit=5&format=json&origin=*`;
        const searchRes = await fetchWithTimeoutQuote(searchUrl, QUOTE_FETCH_TIMEOUT_MS);
        if (!searchRes.ok) throw new Error(`search HTTP ${searchRes.status}`);
        const searchJson = await searchRes.json();
        const hits = searchJson?.query?.search || [];

        const lastWord = author.toLowerCase().split(/\s+/).pop();
        const match = hits.find(h => (h.title || '').toLowerCase().includes(lastWord));
        if (!match) throw new Error('no matching wikiquote page');

        const pageUrl = `https://en.wikiquote.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(match.title)}&format=json&origin=*`;
        const pageRes = await fetchWithTimeoutQuote(pageUrl, QUOTE_FETCH_TIMEOUT_MS);
        if (!pageRes.ok) throw new Error(`page HTTP ${pageRes.status}`);
        const pageJson = await pageRes.json();
        const pages = pageJson?.query?.pages || {};
        const page = Object.values(pages)[0];
        const text = page?.extract || '';
        if (!text) throw new Error('no extract');

        const candidates = text
            .split(/\n{2,}/)
            .map(s => s.trim())
            .filter(s =>
                s.length > 40 &&
                s.length < 260 &&
                !s.startsWith('=') &&
                !s.includes('Wikiquote') &&
                !s.includes('Wikipedia') &&
                !/^[\w\s]+:$/.test(s)
            );

        if (!candidates.length) throw new Error('no quote candidates');

        const pick = candidates[Math.floor(Math.random() * Math.min(candidates.length, 6))];
        return {
            quote: pick.replace(/^["“”'"'']+|["“”'"'']+$/g, '').trim(),
            author
        };
    } catch (err) {
        console.warn('[quote] Wikiquote failed:', err.message);
        return null;
    }
}

async function fetchOnlineQuote(author) {
    const garden = await fetchFromQuoteGarden(author);
    if (garden) return garden;
    const wikiquote = await fetchFromWikiquote(author);
    if (wikiquote) return wikiquote;
    return null;
}

async function fetchAuthorPortrait(author) {
    if (!author) return null;
    const nameParts = author
        .replace(/[^A-Za-zÀ-ÿ' -]/g, '')
        .split(/\s+/)
        .filter(Boolean);
    const lastName = (nameParts[nameParts.length - 1] || '').toLowerCase();

    const tryTitle = async (title) => {
        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|pageprops&format=json&pithumbsize=220&redirects=1&origin=*`;
            const res = await fetchWithTimeoutQuote(url, PORTRAIT_FETCH_TIMEOUT_MS);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const pages = json?.query?.pages || {};
            const page = Object.values(pages)[0];
            if (!page || page.missing !== undefined) return null;
            if (page.pageprops?.disambiguation !== undefined) return null;
            const pageTitle = (page.title || '').toLowerCase();
            if (lastName && !pageTitle.includes(lastName)) return null;
            const thumb = page.thumbnail?.source;
            if (!thumb) return null;
            if (!/\.(jpe?g|png|svg|webp)(\?|$)/i.test(thumb)) return null;
            return thumb;
        } catch (err) {
            console.warn('[portrait] lookup failed for', title, err.message);
            return null;
        }
    };

    let thumb = await tryTitle(author);
    if (thumb) return thumb;

    const cleaned = author
        .replace(/\b(jr|sr|ii|iii|iv)\.?\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (cleaned && cleaned.toLowerCase() !== author.toLowerCase()) {
        thumb = await tryTitle(cleaned);
        if (thumb) return thumb;
    }

    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(author)}&srlimit=5&format=json&origin=*`;
        const res = await fetchWithTimeoutQuote(searchUrl, PORTRAIT_FETCH_TIMEOUT_MS);
        if (res.ok) {
            const json = await res.json();
            const hits = json?.query?.search || [];
            const match = hits.find(h => {
                const t = (h.title || '').toLowerCase();
                return lastName && t.includes(lastName);
            });
            if (match) {
                thumb = await tryTitle(match.title);
                if (thumb) return thumb;
            }
        }
    } catch (err) {
        console.warn('[portrait] search failed for', author, err.message);
    }

    return null;
}

let quoteRollState = {
    category: 'worldwide-famous',
    authors: [],
    index: 0,
    timer: null,
    autoAdvanceMs: 77000,
    paintToken: 0
};

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildQuoteCardHTML(q, color, direction, portraitUrl, loading) {
    const initials = (q.author || '?')
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');

    const portraitInner = portraitUrl
        ? `<img src="${portraitUrl}" alt="${escapeHtml(q.author || '')}" onerror="this.replaceWith(document.createTextNode('${initials}'))">`
        : `<span class="flyer__initials">${initials}</span>`;

    const animClass = direction === 'up' ? 'flyer--enter-up'
                     : direction === 'down' ? 'flyer--enter-down'
                     : '';
    const loadingClass = loading ? 'flyer--loading' : '';

    return `
        <div class="flyer ${animClass} ${loadingClass}" style="--flyer-accent:${color};">
            <div class="flyer__roll flyer__roll--top"></div>
            <div class="flyer__paper">
                <div class="flyer__portrait">${portraitInner}</div>
                <p class="flyer__quote">“${escapeHtml(q.quote || '')}”</p>
                <span class="flyer__author">— ${escapeHtml(q.author || '')}</span>
                ${q.role ? `<span class="flyer__role">${escapeHtml(q.role)}</span>` : ''}
            </div>
            <div class="flyer__roll flyer__roll--bottom"></div>
        </div>
    `;
}

async function paintQuoteRoll(direction) {
    const list = document.getElementById('quoteRollList');
    if (!list) return;

    const author = quoteRollState.authors[quoteRollState.index];
    if (!author) {
        list.innerHTML = `<div class="quote-roll-empty">Nta magambo abonetse muri itsinda ryatoranyijwe.</div>`;
        return;
    }

    const color = QUOTE_CATEGORY_COLORS[quoteRollState.category]
               || QUOTE_CATEGORY_COLORS['worldwide-famous'];

    const fallbackPool = LOCAL_QUOTES_FALLBACK[quoteRollState.category]
                      || LOCAL_QUOTES_FALLBACK['worldwide-famous'];
    const fallback = fallbackPool.find(f => f.author === author)
                  || fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
                  || { quote: 'Ubwenge bw\'abanyacyubahiro.', author };

    const myToken = ++quoteRollState.paintToken;
    list.innerHTML = buildQuoteCardHTML(fallback, color, direction, null, true);

    const [onlineQuote, portraitUrl] = await Promise.all([
        fetchOnlineQuote(author),
        fetchAuthorPortrait(author)
    ]);

    if (myToken !== quoteRollState.paintToken) return;

    const finalQuote = onlineQuote ? onlineQuote : fallback;
    list.innerHTML = buildQuoteCardHTML(finalQuote, color, direction, portraitUrl, false);
}

function scheduleQuoteAutoAdvance() {
    if (quoteRollState.timer) clearTimeout(quoteRollState.timer);
    quoteRollState.timer = setTimeout(() => {
        quoteRollNext(true);
    }, quoteRollState.autoAdvanceMs);
}

function setQuoteCategory(category, preserveIndex) {
    const key = QUOTE_AUTHORS_BY_CATEGORY[category]
        ? category
        : 'worldwide-famous';
    quoteRollState.category = key;

    const authors = QUOTE_AUTHORS_BY_CATEGORY[key];
    quoteRollState.authors = shuffleArray(authors);
    if (!preserveIndex) quoteRollState.index = 0;
    if (quoteRollState.index >= quoteRollState.authors.length) quoteRollState.index = 0;

    const sel = document.getElementById('quoteContinentSelect');
    if (sel && sel.value !== key) sel.value = key;

    paintQuoteRoll('');
    scheduleQuoteAutoAdvance();
}

function onQuoteCategoryChange(value) {
    setQuoteCategory(value, false);
}

function quoteRollNext() {
    if (!quoteRollState.authors.length) return;
    quoteRollState.index = (quoteRollState.index + 1) % quoteRollState.authors.length;
    paintQuoteRoll('down');
    scheduleQuoteAutoAdvance();
}

function quoteRollPrev() {
    if (!quoteRollState.authors.length) return;
    quoteRollState.index = (quoteRollState.index - 1 + quoteRollState.authors.length) % quoteRollState.authors.length;
    paintQuoteRoll('up');
    scheduleQuoteAutoAdvance();
}

function renderQuoteRoll(category) {
    setQuoteCategory(category || 'worldwide-famous', false);
}

// ==================== GLOBAL EXPORTS ====================
window.showTab = showTab;
window.handleFileUpload = handleFileUpload;
window.extractStories = extractStories;
window.generateFlyer = generateFlyer;
window.openEditor = openEditor;
window.closeEditor = closeEditor;
window.saveEditedStory = saveEditedStory;
window.toggleFlyerExpansion = toggleFlyerExpansion;
window.handleLike = handleLike;
window.handleKnew = handleKnew;
window.handleDidntKnow = handleDidntKnow;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.filterByContinent = filterByContinent;
window.filterByCategory = filterByCategory;
window.sortBy = sortBy;
window.clearAllFilters = clearAllFilters;
window.showLoginModal = showLoginModal;
window.hideLoginModal = hideLoginModal;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.continueAsAnonymous = continueAsAnonymous;
window.updateUserStatus = updateUserStatus;
window.showUserAccount = showUserAccount;
window.getCurrentUser = getCurrentUser;
window.uploadFlyerPicture = uploadFlyerPicture;
window.uploadFlyerPictureForStory = uploadFlyerPictureForStory;
window.applyFlyerImageUrl = applyFlyerImageUrl;
window.refreshAllColors = refreshAllColors;
window.refreshProverb = refreshProverb;
window.toggleProverbTranslations = toggleProverbTranslations;
window.showProverbTranslations = toggleProverbTranslations; // alias
window.hideProverbTranslations = hideProverbTranslations;
window.loadProverb = loadProverb;
window.quoteRollNext = quoteRollNext;
window.quoteRollPrev = quoteRollPrev;
window.onQuoteCategoryChange = onQuoteCategoryChange;
window.renderQuoteRoll = renderQuoteRoll;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    const userRole = localStorage.getItem('wrzkk_user_role');
    if (!userRole) setTimeout(() => showLoginModal(), 500);
    else updateUserStatus();

    // Proverb FIRST, so it never waits on the cloud fetch
    loadProverb();

    // Collection can load in parallel
    initializeCollection();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase();
            displayFlyers();
            updateActiveFilters();
        });
    }

    setTimeout(addColorRefreshButton, 1000);
    startLogoColorCycle();

    // Quote roll init — respects the <option selected> in HTML
    const sel = document.getElementById('quoteContinentSelect');
    if (sel) onQuoteCategoryChange(sel.value);

    // Real-time sync with Supabase
    startFlyerRealtime();

    // Manager link: only shown to approved managers (checked from cloud)
    // Runs after account-bar.js has finished rebuilding the nav.
    setTimeout(injectManagerLink, 300);
});
