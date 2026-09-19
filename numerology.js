// ========== NUMEROLOGY CORE ==========
const PYTHAGOREAN = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
};

const EGYPTIAN = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
    S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
};

const LATIN = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 9,
    K: 10, L: 20, M: 30, N: 40, O: 50, P: 60, Q: 70, R: 80, S: 90,
    T: 100, U: 200, V: 200, W: 200, X: 300, Y: 400, Z: 500
};

const AFRO_SUMERIAN = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 0, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 0, Y: 7, Z: 8
};

const AFRO_SUMERIAN_2 = (() => {
    const order = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S','T','U','V','W','Y','Z'];
    const chart = {};
    order.forEach((letter, i) => { chart[letter] = i + 1; });
    chart.Q = 0;
    chart.X = 0;
    return chart;
})();

const NUMBER_MEANINGS = {
    1: 'Leadership, beginnings, independence.',
    2: 'Partnership, diplomacy, balance.',
    3: 'Expression, creativity, communication.',
    4: 'Structure, work, foundations.',
    5: 'Change, freedom, curiosity.',
    6: 'Care, home, responsibility.',
    7: 'Study, spirit, inner search.',
    8: 'Power, results, material mastery.',
    9: 'Compassion, completion, service.',
    11: 'Master intuition and vision.',
    22: 'Master builder; large-scale plans.',
    33: 'Master teacher; healing through service.'
};

const NUMBER_MEANINGS_EXTENDED = Object.assign({}, NUMBER_MEANINGS, {
    10: 'New cycle, fresh start, self-reliance.',
    12: 'Order, harmony, cosmic structure.',
    13: 'Transformation, rebirth, inner power.',
    14: 'Movement, communication, adaptability.',
    15: 'Magnetism, attraction, natural charm.',
    16: 'Introspection, analysis, spiritual depth.',
    17: 'Immortality, legacy, far-reaching vision.',
    18: 'Material and spiritual conflict, endurance.',
    19: 'Sun, success, illumination.',
    20: 'Judgment, awakening, renewal.',
    21: 'Completion, victory, universal love.',
    23: 'Royalty, protection, divine guidance.',
    24: 'Fulfillment, sanctuary, cosmic harmony.'
});

const DB_KEY = 'wrzkk_numerology_added';

// ============ SEPARATE STORAGE KEYS PER CATEGORY ============
const DB_KEY_NAMES  = 'wrzkk_numerology_names_added';
const DB_KEY_WORDS  = 'wrzkk_numerology_words_added';
const DB_KEY_PLACES = 'wrzkk_numerology_places_added';

// Three separate databases
let nameDatabase  = [];
let wordDatabase  = [];
let placeDatabase = [];

// Three separate seed-key sets so we know what came from the JSON files
let seedKeysNames  = new Set();
let seedKeysWords  = new Set();
let seedKeysPlaces = new Set();

let pendingAddName = '';
let lastQuery = '';
let currentNumbers = null;

// Currently selected category tab
let currentCategory = 'names'; // 'names' | 'words' | 'places'

function databaseFor(category) {
    if (category === 'words')  return wordDatabase;
    if (category === 'places') return placeDatabase;
    return nameDatabase;
}

function seedKeysFor(category) {
    if (category === 'words')  return seedKeysWords;
    if (category === 'places') return seedKeysPlaces;
    return seedKeysNames;
}

function storageKeyFor(category) {
    if (category === 'words')  return DB_KEY_WORDS;
    if (category === 'places') return DB_KEY_PLACES;
    return DB_KEY_NAMES;
}

// ============ HOUSES & SIGNS ============
const HOUSES = [
    { num: 1, name: 'Inzu ya 1 — Ubuntu', sign: 'Aries', desc: 'Ishusho, umubiri, uko utangira ibintu.' },
    { num: 2, name: 'Inzu ya 2 — Ubutunzi', sign: 'Taurus', desc: 'Amafaranga, agaciro, ibintu ufite.' },
    { num: 3, name: 'Inzu ya 3 — Itumanaho', sign: 'Gemini', desc: 'Gusoma, kwiga, abavandimwe.' },
    { num: 4, name: 'Inzu ya 4 — Umuryango', sign: 'Cancer', desc: 'Urugo, umuryango, umuzi.' },
    { num: 5, name: 'Inzu ya 5 — Ibyishimo', sign: 'Leo', desc: 'Ibihangano, urukundo, abana.' },
    { num: 6, name: 'Inzu ya 6 — Ubuzima', sign: 'Virgo', desc: 'Akazi, ubuzima, inshingano.' },
    { num: 7, name: 'Inzu ya 7 — Ubufatanye', sign: 'Libra', desc: 'Umubano, isezerano, abandi.' },
    { num: 8, name: 'Inzu ya 8 — Guhinduka', sign: 'Scorpio', desc: 'Urupfu, kuvuka, amafaranga y’abandi.' },
    { num: 9, name: 'Inzu ya 9 — Ubushakashatsi', sign: 'Sagittarius', desc: 'Ingendo, kwizera, filozofiya.' },
    { num: 10, name: 'Inzu ya 10 — Umwuga', sign: 'Capricorn', desc: 'Umwuga, izina, intego.' },
    { num: 11, name: 'Inzu ya 11 — Abasabane', sign: 'Aquarius', desc: 'Inshuti, imiryango, intego rusange.' },
    { num: 12, name: 'Inzu ya 12 — Ibanga', sign: 'Pisces', desc: 'Ibanga, imyumvire, kuruhuka.' }
];

const SIGNS = [
    { name: 'Aries', glyph: '♈', start: [3, 21], end: [4, 19], element: 'Umuriro' },
    { name: 'Taurus', glyph: '♉', start: [4, 20], end: [5, 20], element: 'Ubutaka' },
    { name: 'Gemini', glyph: '♊', start: [5, 21], end: [6, 20], element: 'Umuyaga' },
    { name: 'Cancer', glyph: '♋', start: [6, 21], end: [7, 22], element: 'Amazi' },
    { name: 'Leo', glyph: '♌', start: [7, 23], end: [8, 22], element: 'Umuriro' },
    { name: 'Virgo', glyph: '♍', start: [8, 23], end: [9, 22], element: 'Ubutaka' },
    { name: 'Libra', glyph: '♎', start: [9, 23], end: [10, 22], element: 'Umuyaga' },
    { name: 'Scorpio', glyph: '♏', start: [10, 23], end: [11, 21], element: 'Amazi' },
    { name: 'Sagittarius', glyph: '♐', start: [11, 22], end: [12, 21], element: 'Umuriro' },
    { name: 'Capricorn', glyph: '♑', start: [12, 22], end: [1, 19], element: 'Ubutaka' },
    { name: 'Aquarius', glyph: '♒', start: [1, 20], end: [2, 18], element: 'Umuyaga' },
    { name: 'Pisces', glyph: '♓', start: [2, 19], end: [3, 20], element: 'Amazi' }
];

function requireRegisteredAccount() {
    const role = localStorage.getItem('wrzkk_user_role');
    const email = localStorage.getItem('wrzkk_user_email');
    if (role === 'registered' && email) return true;
    alert('🔢 Numeroloji ni kubafite konti. Injira cyangwa iyandikishe mbere.');
    window.location.href = 'index.html';
    return false;
}

function normalizeName(text) {
    return (text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z\s'-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function displayName(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function lettersOf(text) {
    return normalizeName(text).replace(/[^A-Z]/g, '').split('');
}

function reduceNumber(value, keepMasters) {
    let n = value;
    const steps = [n];
    while (n > 9) {
        if (keepMasters && (n === 11 || n === 22 || n === 33)) break;
        n = String(n).split('').reduce((sum, d) => sum + Number(d), 0);
        steps.push(n);
    }
    return { value: n, steps };
}

function reduceNumberExtended(value) {
    let n = value;
    const steps = [n];
    while (n > 24) {
        n = String(n).split('').reduce((sum, d) => sum + Number(d), 0);
        steps.push(n);
    }
    return { value: n, steps };
}

function mapLetters(text, chart) {
    return lettersOf(text).map((letter) => ({
        letter,
        value: chart[letter] ?? 0
    }));
}

function mapLettersAfro(text, chart) {
    return lettersOf(text).map((letter) => ({
        letter,
        value: chart[letter] ?? 0
    })).filter(item => item.letter !== 'Q' && item.letter !== 'X');
}

function calculateSystem(text, chart, keepMasters) {
    const mapped = mapLetters(text, chart);
    const total = mapped.reduce((sum, item) => sum + item.value, 0);
    const reduced = reduceNumber(total, keepMasters);
    return {
        mapped,
        total,
        reduced: reduced.value,
        steps: reduced.steps,
        meaning: NUMBER_MEANINGS[reduced.value] || NUMBER_MEANINGS[reduceNumber(reduced.value, false).value] || ''
    };
}

function calculateAfro(text) {
    const mapped = mapLettersAfro(text, AFRO_SUMERIAN);
    const total = mapped.reduce((sum, item) => sum + item.value, 0);
    const reduced = reduceNumber(total, false);
    return {
        mapped,
        total,
        reduced: reduced.value,
        steps: reduced.steps,
        meaning: NUMBER_MEANINGS[reduced.value] || NUMBER_MEANINGS[reduceNumber(reduced.value, false).value] || ''
    };
}

function calculateSebidegede2(text) {
    const mapped = mapLettersAfro(text, AFRO_SUMERIAN_2);
    const total = mapped.reduce((sum, item) => sum + item.value, 0);
    const reduced = reduceNumberExtended(total);
    const difference = Math.abs(200 - total);
    return {
        mapped,
        total,
        reduced: reduced.value,
        steps: reduced.steps,
        meaning: NUMBER_MEANINGS_EXTENDED[reduced.value] || 'Umubare wihariye.',
        difference
    };
}

function calculateAll(text) {
    return {
        input: text.trim(),
        normalized: normalizeName(text),
        pythagorean: calculateSystem(text, PYTHAGOREAN, true),
        egyptian: calculateSystem(text, EGYPTIAN, false),
        latin: calculateSystem(text, LATIN, false),
        afro: calculateAfro(text),
        sebidegede2: calculateSebidegede2(text)
    };
}

function recordFromName(name) {
    const calc = calculateAll(name);
    return {
        name: displayName(name),
        key: calc.normalized,
        pythagorean: calc.pythagorean.reduced,
        egyptian: calc.egyptian.reduced,
        latin: calc.latin.reduced,
        afro: calc.afro.reduced,
        sebidegede2: calc.sebidegede2.reduced,
        pythagoreanTotal: calc.pythagorean.total,
        egyptianTotal: calc.egyptian.total,
        latinTotal: calc.latin.total,
        afroTotal: calc.afro.total,
        sebidegede2Total: calc.sebidegede2.total,
        sebidegede2Diff: calc.sebidegede2.difference
    };
}

// ============ STORAGE PER CATEGORY ============
function loadStoredRecords(category) {
    try {
        const raw = JSON.parse(localStorage.getItem(storageKeyFor(category)) || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

function saveStoredRecords(category, records) {
    try {
        localStorage.setItem(storageKeyFor(category), JSON.stringify(records));
    } catch (error) {
        console.warn('Could not save numerology records for', category, error);
    }
}

function mergeDatabase(seedNames, storedRecords) {
    const byKey = new Map();

    seedNames.forEach((name) => {
        const key = normalizeName(name);
        if (!key || byKey.has(key)) return;
        byKey.set(key, recordFromName(name));
    });

    storedRecords.forEach((record) => {
        if (!record?.key && !record?.name) return;
        const key = record.key || normalizeName(record.name);
        if (!key || byKey.has(key)) return;
        byKey.set(key, recordFromName(record.name || record.key));
    });

    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// EXACT match only — search inside the current category only.
function findStoredRecord(query, category) {
    const key = normalizeName(query);
    if (!key) return null;
    return databaseFor(category).find((record) => record.key === key) || null;
}

// ========== STRICT PER-SYSTEM MATCHING (per category) ==========
function findMatchesBySystem(calc, excludeKey, category) {
    const groups = {
        pythagorean: [],
        egyptian: [],
        latin: [],
        afro: [],
        sebidegede2: []
    };
    if (!calc) return groups;

    const qPyth = calc.pythagorean.total;
    const qEgyp = calc.egyptian.total;
    const qLat  = calc.latin.total;
    const qAfr  = calc.afro.total;
    const qSeb  = calc.sebidegede2.total;

    const db = databaseFor(category);

    db.forEach((entry) => {
        if (excludeKey && entry.key === excludeKey) return;

        if (entry.pythagoreanTotal === qPyth) groups.pythagorean.push(entry);
        if (entry.egyptianTotal === qEgyp)    groups.egyptian.push(entry);
        if (entry.latinTotal === qLat)        groups.latin.push(entry);
        if (entry.afroTotal === qAfr)         groups.afro.push(entry);
        if (entry.sebidegede2Total === qSeb)  groups.sebidegede2.push(entry);
    });

    Object.keys(groups).forEach(k =>
        groups[k].sort((a, b) => a.name.localeCompare(b.name))
    );
    return groups;
}

function findNamesBySebidegede2Value(value, excludeKey, category) {
    if (value === null || value === undefined) return [];
    const db = databaseFor(category);
    return db
        .filter((entry) => {
            if (excludeKey && entry.key === excludeKey) return false;
            return entry.sebidegede2Total === value;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

// ============ ADD / SAVE / DOWNLOAD ============
function saveAddedRecords(category) {
    const seedKeys = seedKeysFor(category);
    const db = databaseFor(category);
    const extras = db.filter((record) => !seedKeys.has(record.key));
    saveStoredRecords(category, extras);
}

function addNameToDatabase(name, category) {
    const record = recordFromName(name);
    if (!record.key) return null;

    const existing = findStoredRecord(record.key, category);
    if (existing) return existing;

    const db = databaseFor(category);
    db.push(record);
    db.sort((a, b) => a.name.localeCompare(b.name));
    saveAddedRecords(category);
    updateTabCounts();
    return record;
}

function downloadJsonFile(filename, list) {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function downloadFamilyNamesFile() {
    downloadJsonFile('family-names.json', nameDatabase.map(r => r.name));
}

function downloadWordsFile() {
    downloadJsonFile('words.json', wordDatabase.map(r => r.name));
}

function downloadPlacesFile() {
    downloadJsonFile('places.json', placeDatabase.map(r => r.name));
}

// ============ RENDER HELPERS ============
function renderBreakdown(mapped) {
    return mapped.map((item) => (
        `<span class="num-chip"><b>${item.letter}</b> ${item.value}</span>`
    )).join('');
}

function renderSystemCard(title, result, extraClass) {
    return `
        <article class="num-card ${extraClass || ''}">
            <h3>${title}</h3>
            <p class="num-total">Igiteranyo: <strong>${result.total}</strong></p>
            <p class="num-reduced">Umubare: <strong>${result.reduced}</strong></p>
            <p class="num-steps">${result.steps.join(' → ')}</p>
            <p class="num-meaning">${result.meaning}</p>
            <div class="num-chips">${renderBreakdown(result.mapped)}</div>
        </article>
    `;
}

function renderAfroPanel(afroResult, sebidegede2Result) {
    const targetValue = sebidegede2Result.difference;
    const valueNames = findNamesBySebidegede2Value(targetValue, null, currentCategory);

    return `
        <div class="afro-panel">
            <div class="afro-panel-header">AFRO-SUMERIAN</div>
            <div class="afro-columns">
                <div class="afro-division">
                    <h3>Afro-Sumerian <span class="sub">(cyclic, Q & X ntibikoreshwa)</span></h3>
                    <p class="num-total">Igiteranyo: <strong>${afroResult.total}</strong></p>
                    <p class="num-reduced">Umubare: <strong>${afroResult.reduced}</strong></p>
                    <p class="num-steps">${afroResult.steps.join(' → ')}</p>
                    <p class="num-meaning">${afroResult.meaning}</p>
                    <div class="num-chips">${renderBreakdown(afroResult.mapped)}</div>
                </div>
                <div class="afro-division">
                    <h3>Sebidegede 2 <span class="sub">(non-cyclic, igera kuri 24)</span></h3>
                    <p class="num-total">Igiteranyo: <strong>${sebidegede2Result.total}</strong></p>
                    <p class="num-reduced">Umubare: <strong>${sebidegede2Result.reduced}</strong></p>
                    <p class="num-steps">${sebidegede2Result.steps.join(' → ')}</p>
                    <p class="num-meaning">${sebidegede2Result.meaning}</p>
                    <div class="num-chips">${renderBreakdown(sebidegede2Result.mapped)}</div>

                    <div class="sebidegede-diff">
                        <h4>➖ Itandukaniro kuri 200</h4>
                        <p class="diff-value">200 − ${sebidegede2Result.total} = ${sebidegede2Result.difference}</p>
                        <p style="font-size:0.85rem; color:#6a4c93; margin-bottom:8px;">
                            Amazina afite igiteranyo cya Sebidegede 2 kingana na <strong>${sebidegede2Result.difference}</strong>:
                        </p>
                        <div class="diff-names">
                            ${valueNames.length
                                ? valueNames.map(n => `<span class="diff-name-pill">${n.name} (${n.sebidegede2Total})</span>`).join('')
                                : '<span style="color:#999; font-size:0.85rem;">Nta mazina abonetse.</span>'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderNamePills(entries) {
    if (!entries.length) return '<p class="num-empty" style="color:#666">Nta mazina ahuye muri iyi sisitemu.</p>';
    return `<div class="name-pills">${entries.map((entry) => (
        `<button type="button" class="name-pill" data-name="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</button>`
    )).join('')}</div>`;
}

function saveMatchBlock(source, category, sysKey, sysLabel, sysTotal, namesCsv) {
    if (!window.AccountBar) return;
    const names = namesCsv.split(',').map(s => s.trim()).filter(Boolean);
    const ok = window.AccountBar.saveMatch({
        type: category,
        source,
        target: sysLabel,
        systems: { [sysKey]: sysTotal },
        names,
        note: `${names.length} ${names.length === 1 ? 'izina' : 'amazina'} · ${sysLabel} = ${sysTotal}`
    });
    alert(ok ? '✅ Byabitswe mu konti yawe.' : 'ℹ️ Ibi byari byabitswe.');
}
window.saveMatchBlock = saveMatchBlock;
window.saveMatchBlock = saveMatchBlock;

function renderCorrespondingGroups(groups, calc, matchedName, category) {
    const label = category === 'names' ? 'Amazina'
                : category === 'words' ? 'Amagambo'
                : 'Ahantu';

    const title = matchedName
        ? `${label} ahuye na ${matchedName} muri sisitemu imwe`
        : `${label} ahuye muri sisitemu imwe`;

    const systems = [
        { key: 'pythagorean', label: 'Pythagorean', total: calc.pythagorean.total, reduced: calc.pythagorean.reduced, color: '#764ba2' },
        { key: 'egyptian',    label: 'Egyptian',    total: calc.egyptian.total,    reduced: calc.egyptian.reduced,    color: '#d4a017' },
        { key: 'latin',       label: 'Latin',       total: calc.latin.total,       reduced: calc.latin.reduced,       color: '#2f80ed' },
        { key: 'afro',        label: 'Afro-Sumerian', total: calc.afro.total,      reduced: calc.afro.reduced,        color: '#b8860b' },
        { key: 'sebidegede2', label: 'Sebidegede 2',  total: calc.sebidegede2.total, reduced: calc.sebidegede2.reduced, color: '#8b4513' }
    ];

    const blocks = systems.map(sys => {
        const entries = groups[sys.key] || [];
        const valLabel = sys.total === sys.reduced
            ? `${sys.total}`
            : `${sys.total} (→ ${sys.reduced})`;
    
        const namesList = entries.map(e => e.name).join(', ');
        const escapedNames = escapeHtml(namesList).replace(/'/g, "\\'");
        const source = escapeHtml(matchedName || '').replace(/'/g, "\\'");
    
        return `
            <div class="match-block" style="border-left: 6px solid ${sys.color};">
                <h3>${sys.label} = <strong>${valLabel}</strong> · ${entries.length} ${entries.length === 1 ? 'izina' : 'amazina'}</h3>
                <p class="match-rule">${label} afite <strong>igiteranyo nyacyo</strong> cya ${sys.label} kingana na <strong>${sys.total}</strong> gusa.</p>
                ${renderNamePills(entries)}
                ${entries.length ? `
                    <button type="button" class="save-match-btn"
                            onclick="saveMatchBlock('${source}', '${category}', '${sys.key}', '${sys.label}', ${sys.total}, '${escapedNames}')">
                        💾 Bika mu konti
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');

    return `<h2>${title}</h2>${blocks}`;
}

function escapeJs(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function bindNamePills(container) {
    container.querySelectorAll('.name-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            const input = document.getElementById('numerologyInput');
            if (input) input.value = btn.dataset.name;
            renderResults(btn.dataset.name);
        });
    });
}

function showAddPrompt(name, calc, correspondingHtml, category) {
    pendingAddName = name;
    const label = category === 'names' ? 'izina ry’umuryango'
                : category === 'words' ? 'ijambo'
                : 'ahantu';

    const fileHint = category === 'names' ? 'family-names.json'
                   : category === 'words' ? 'words.json'
                   : 'places.json';

    return `
        <div class="add-prompt">
            <h2>Iri ${label} ntiriri muri database</h2>
            <p>
                “<strong>${displayName(name)}</strong>” ntiriri muri <code>${fileHint}</code>.
                Pythagorean <strong>${calc.pythagorean.total} → ${calc.pythagorean.reduced}</strong>,
                Egyptian <strong>${calc.egyptian.total} → ${calc.egyptian.reduced}</strong>,
                Latin <strong>${calc.latin.total} → ${calc.latin.reduced}</strong>,
                Afro-Sumerian <strong>${calc.afro.total} → ${calc.afro.reduced}</strong>,
                Sebidegede 2 <strong>${calc.sebidegede2.total} → ${calc.sebidegede2.reduced}</strong>
                (itandukaniro kuri 200: <strong>${calc.sebidegede2.difference}</strong>).
            </p>
            <p>Ushaka kurongera muri database (${label})?</p>
            <div class="add-actions">
                <button type="button" id="confirmAddName">Ongeraho</button>
                <button type="button" id="skipAddName" class="ghost">Oya</button>
            </div>
        </div>
        ${correspondingHtml}
    `;
}

// ========== ASTROLOGY (only shown for names) ==========
function getSunSign(month, day) {
    for (const sign of SIGNS) {
        const [sm, sd] = sign.start;
        const [em, ed] = sign.end;
        if (sm <= em) {
            if ((month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)) return sign;
        } else {
            if ((month === sm && day >= sd) || (month === em && day <= ed) || month > sm || month < em) return sign;
        }
    }
    return SIGNS[0];
}

function getPlanetaryPositions(date) {
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const daysSinceJ2000 = (date - J2000) / 86400000;
    const bodies = [
        { name: 'Sun', glyph: '☉', period: 365.256, offset: 280.46 },
        { name: 'Moon', glyph: '☽', period: 27.322, offset: 218.32 },
        { name: 'Mercury', glyph: '☿', period: 87.969, offset: 252.25 },
        { name: 'Venus', glyph: '♀', period: 224.701, offset: 181.98 },
        { name: 'Mars', glyph: '♂', period: 686.980, offset: 355.43 },
        { name: 'Jupiter', glyph: '♃', period: 4332.589, offset: 34.35 },
        { name: 'Saturn', glyph: '♄', period: 10759.22, offset: 50.08 },
        { name: 'Uranus', glyph: '♅', period: 30685.4, offset: 314.06 },
        { name: 'Neptune', glyph: '♆', period: 60189.0, offset: 304.35 },
        { name: 'Pluto', glyph: '♇', period: 90560.0, offset: 238.93 }
    ];
    return bodies.map(b => {
        const degrees = (b.offset + (360 / b.period) * daysSinceJ2000) % 360;
        const normalized = ((degrees % 360) + 360) % 360;
        const signIndex = Math.floor(normalized / 30);
        const degreeInSign = normalized % 30;
        return { ...b, longitude: normalized, sign: SIGNS[signIndex], degree: degreeInSign.toFixed(1) };
    });
}

function getLifePathNumber(dateStr) {
    const d = new Date(dateStr);
    const digits = String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    let sum = digits.split('').reduce((s, c) => s + Number(c), 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = String(sum).split('').reduce((s, c) => s + Number(c), 0);
    }
    return sum;
}

function getPersonalYear(dateStr) {
    const d = new Date(dateStr);
    const year = new Date().getFullYear();
    const digits = String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + String(year);
    let sum = digits.split('').reduce((s, c) => s + Number(c), 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = String(sum).split('').reduce((s, c) => s + Number(c), 0);
    }
    return sum;
}

function renderAstroChart(numbers, birthData) {
    const astroSection = document.getElementById('astroSection');
    if (!astroSection) return;

    // Astrology only for names
    if (currentCategory !== 'names') {
        astroSection.style.display = 'none';
        return;
    }

    const bigEl = document.getElementById('astroBigNumber');
    const labelEl = document.getElementById('astroLabel');
    const descEl = document.getElementById('astroDesc');
    if (bigEl) bigEl.textContent = numbers.pythagorean;
    if (labelEl) labelEl.textContent = 'Umubare w\'inyenyeri (Pythagorean)';
    if (descEl) descEl.textContent = NUMBER_MEANINGS[numbers.pythagorean] || NUMBER_MEANINGS[1] || '';

    const houseSection = document.getElementById('houseSection');
    const houseCardContainer = document.getElementById('houseCardContainer');
    const birthSummary = document.getElementById('birthSummary');
    const bodiesSection = document.getElementById('bodiesSection');
    const bodiesGrid = document.getElementById('bodiesGrid');
    const liveSection = document.getElementById('liveSection');

    if (birthData && birthData.date) {
        const d = new Date(birthData.date);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const sunSign = getSunSign(month, day);
        const lifePath = getLifePathNumber(birthData.date);
        const personalYear = getPersonalYear(birthData.date);
        const planets = getPlanetaryPositions(d);

        if (birthSummary) {
            birthSummary.innerHTML = `
                <span class="birth-chip">☀️ <strong>${sunSign.glyph} ${sunSign.name}</strong> (${sunSign.element})</span>
                <span class="birth-chip">🔢 Umubare w'ubuzima: <strong>${lifePath}</strong></span>
                <span class="birth-chip">📅 Umwaka bwite: <strong>${personalYear}</strong></span>
                ${birthData.time ? `<span class="birth-chip">🕐 Isaha: <strong>${birthData.time}</strong></span>` : ''}
                ${birthData.place ? `<span class="birth-chip">📍 <strong>${birthData.place}</strong></span>` : ''}
            `;
        }

        if (bodiesGrid) {
            bodiesGrid.innerHTML = planets.map(p => `
                <div class="body-card">
                    <span class="body-glyph">${p.glyph}</span>
                    <div class="body-info">
                        <strong>${p.name}</strong>
                        <span>${p.sign.glyph} ${p.sign.name} ${p.degree}°</span>
                    </div>
                </div>
            `).join('');
        }
        if (bodiesSection) bodiesSection.style.display = 'block';

        const sunIndex = SIGNS.findIndex(s => s.name === sunSign.name);
        const houseNum = sunIndex + 1;
        const house = HOUSES.find(h => h.num === houseNum) || HOUSES[0];
        const houseSign = SIGNS[sunIndex];

        if (houseCardContainer) {
            houseCardContainer.innerHTML = `
                <div class="house-card-single">
                    <span class="house-num">Inzu ${house.num} — ${house.name.split('—')[1]?.trim() || house.name}</span>
                    <span class="house-name">${house.desc}</span>
                    <span class="house-sign">${houseSign.glyph} ${houseSign.name} · ${houseSign.element}</span>
                </div>
            `;
        }
        if (houseSection) houseSection.style.display = 'block';

        renderLiveAdvice(planets, sunSign, lifePath, personalYear, birthData);
        renderNatalWheel(planets, sunSign);
    } else {
        if (birthSummary) birthSummary.innerHTML = '';
        if (houseSection) houseSection.style.display = 'none';
        if (bodiesSection) bodiesSection.style.display = 'none';
        if (liveSection) liveSection.style.display = 'none';
        renderNatalWheel(null, null);
    }

    astroSection.style.display = 'block';
}

function renderNatalWheel(planets, sunSign) {
    const svg = document.getElementById('astroChartSvg');
    if (!svg) return;
    svg.innerHTML = '';

    const cx = 180, cy = 180;
    const rOuter = 170, rZodiac = 140, rPlanet = 115, rInner = 85, rCenter = 50;

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', cx); bg.setAttribute('cy', cy);
    bg.setAttribute('r', rOuter);
    bg.setAttribute('fill', '#faf7ff');
    bg.setAttribute('stroke', '#8e44ad');
    bg.setAttribute('stroke-width', '2');
    svg.appendChild(bg);

    const zodiacColors = [
        '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db',
        '#9b59b6','#e84393','#d35400','#27ae60','#2980b9','#8e44ad'
    ];
    for (let i = 0; i < 12; i++) {
        const startA = (i * 30 - 90) * Math.PI / 180;
        const endA = ((i + 1) * 30 - 90) * Math.PI / 180;
        const x1 = cx + rZodiac * Math.cos(startA);
        const y1 = cy + rZodiac * Math.sin(startA);
        const x2 = cx + rOuter * Math.cos(startA);
        const y2 = cy + rOuter * Math.sin(startA);
        const x3 = cx + rOuter * Math.cos(endA);
        const y3 = cy + rOuter * Math.sin(endA);
        const x4 = cx + rZodiac * Math.cos(endA);
        const y4 = cy + rZodiac * Math.sin(endA);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dAttr = `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rZodiac} ${rZodiac} 0 0 0 ${x1} ${y1} Z`;
        path.setAttribute('d', dAttr);
        path.setAttribute('fill', zodiacColors[i]);
        path.setAttribute('opacity', '0.85');
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '1.5');
        svg.appendChild(path);

        const midA = (i * 30 + 15 - 90) * Math.PI / 180;
        const gx = cx + ((rZodiac + rOuter) / 2) * Math.cos(midA);
        const gy = cy + ((rZodiac + rOuter) / 2) * Math.sin(midA);
        const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        glyph.setAttribute('x', gx); glyph.setAttribute('y', gy + 6);
        glyph.setAttribute('text-anchor', 'middle');
        glyph.setAttribute('font-size', '16');
        glyph.setAttribute('fill', '#fff');
        glyph.setAttribute('font-weight', 'bold');
        glyph.textContent = SIGNS[i].glyph;
        svg.appendChild(glyph);
    }

    const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    inner.setAttribute('cx', cx); inner.setAttribute('cy', cy);
    inner.setAttribute('r', rInner);
    inner.setAttribute('fill', '#fff');
    inner.setAttribute('stroke', '#8e44ad');
    inner.setAttribute('stroke-width', '1.5');
    svg.appendChild(inner);

    for (let i = 0; i < 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const x1 = cx + rInner * Math.cos(a);
        const y1 = cy + rInner * Math.sin(a);
        const x2 = cx + rZodiac * Math.cos(a);
        const y2 = cy + rZodiac * Math.sin(a);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#b39ddb');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }

    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', cx); center.setAttribute('cy', cy);
    center.setAttribute('r', rCenter);
    center.setAttribute('fill', '#f8f4ff');
    center.setAttribute('stroke', '#8e44ad');
    center.setAttribute('stroke-width', '1.5');
    svg.appendChild(center);

    const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerText.setAttribute('x', cx); centerText.setAttribute('y', cy + 8);
    centerText.setAttribute('text-anchor', 'middle');
    centerText.setAttribute('font-size', '26');
    centerText.setAttribute('fill', '#8e44ad');
    centerText.textContent = sunSign ? sunSign.glyph : '☉';
    svg.appendChild(centerText);

    if (planets && planets.length) {
        const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
        const usedAngles = [];
        sorted.forEach((p) => {
            let angle = p.longitude;
            for (const used of usedAngles) if (Math.abs(angle - used) < 4) angle += 5;
            usedAngles.push(angle);

            const rad = (angle - 90) * Math.PI / 180;
            const px = cx + rPlanet * Math.cos(rad);
            const py = cy + rPlanet * Math.sin(rad);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', px); circle.setAttribute('cy', py);
            circle.setAttribute('r', '9');
            circle.setAttribute('fill', '#8e44ad');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '1.5');
            svg.appendChild(circle);

            const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            glyph.setAttribute('x', px); glyph.setAttribute('y', py + 4);
            glyph.setAttribute('text-anchor', 'middle');
            glyph.setAttribute('font-size', '11');
            glyph.setAttribute('fill', '#fff');
            glyph.setAttribute('font-weight', 'bold');
            glyph.textContent = p.glyph;
            svg.appendChild(glyph);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', px); line.setAttribute('y1', py);
            line.setAttribute('x2', cx + rInner * Math.cos(rad));
            line.setAttribute('y2', cy + rInner * Math.sin(rad));
            line.setAttribute('stroke', '#b39ddb');
            line.setAttribute('stroke-width', '0.8');
            line.setAttribute('opacity', '0.5');
            svg.appendChild(line);
        });
    }
}

function renderLiveAdvice(planets, sunSign, lifePath, personalYear, birthData) {
    const liveSection = document.getElementById('liveSection');
    const liveTime = document.getElementById('liveTime');
    const adviceList = document.getElementById('adviceList');
    if (!liveSection || !adviceList) return;

    const now = new Date();
    const nowStr = now.toLocaleString('rw-RW', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    if (liveTime) liveTime.textContent = `📅 ${nowStr} — Ibihe bishya kuva ubu`;

    const advice = [];
    const sunAdvice = {
        Aries: 'Uyu munsi ni mwiza wo gutangira ibintu bishya. Koresha ingufu zawe.',
        Taurus: 'Shyira imbere umutekano n’ubutunzi. Ibyishimo biri mu bintu byoroshye.',
        Gemini: 'Itumanaho ni urufunguzo. Vugana n’abandi, andika, soma.',
        Cancer: 'Ibyiyumvo byawe ni byinshi. Fasha umuryango wawe.',
        Leo: 'Icyubahiro n’ubuhanzi biragukwiriye. Erekana ibyo ushoboye.',
        Virgo: 'Gucunga akazi n’ubuzima ni byiza. Kora gahunda.',
        Libra: 'Ubufatanye n’amahoro ni ngombwa. Shakira ubwumvikane.',
        Scorpio: 'Ihinduka rirabaho. Emera ibyiyumvo byawe byimbitse.',
        Sagittarius: 'Ingendo cyangwa kwiga bishobora kugutera imbere. Fungura intego nshya.',
        Capricorn: 'Akazi n’inshingano biragutegereje. Komeza imbaraga.',
        Aquarius: 'Ubuhanzi n’ubushakashatsi ni byiza. Tekereza ibintu bishya.',
        Pisces: 'Ibyiyumvo n’ubuhanzi biramurika. Rest, meditate.'
    };
    if (sunSign && sunAdvice[sunSign.name]) {
        advice.push({ icon: '☀️', label: `Izuba muri ${sunSign.name}`, text: sunAdvice[sunSign.name] });
    }

    const lifePathAdvice = {
        1: 'Tangira ibintu bishya. Koresha ubushobozi bwawe bwo kuyobora.',
        2: 'Fasha abandi. Ubufatanye n’amahoro ni ngombwa.',
        3: 'Vuga ibyo uri mu mutima. Ubuhanzi buragutegeye.',
        4: 'Kora gahunda. Gukora cyane bizana ibisubizo.',
        5: 'Emera impinduka. Inzira nshya zirafunguka.',
        6: 'Fasha umuryango. Urukundo ni urufunguzo.',
        7: 'Shakisha ukuri. Kwiga no gutekereza ni ngombwa.',
        8: 'Koresha ubushobozi bwawe mu bucuruzi. Amafaranga araza.',
        9: 'Fasha abandi. Kurangiza ibintu ni byiza.',
        11: 'Koresha ubushishozi bwawe. Intuition ni ingufu.',
        22: 'Kora ibintu binini. Ubushobozi bwawe ni bwinshi.',
        33: 'Fasha abandi mu buryo bwimbitse. Ufite impano yo kuvura.'
    };
    if (lifePathAdvice[lifePath]) {
        advice.push({ icon: '🔢', label: `Umubare w'ubuzima ${lifePath}`, text: lifePathAdvice[lifePath] });
    }

    const personalYearAdvice = {
        1: 'Umwaka w’intango. Tangira ibintu bishya.',
        2: 'Umwaka w’ubufatanye. Kora n’abandi.',
        3: 'Umwaka w’ubuhanzi. Vuga ibyo uri mu mutima.',
        4: 'Umwaka w’akazi. Kora gahunda.',
        5: 'Umwaka w’impinduka. Emera ibishya.',
        6: 'Umwaka w’umuryango. Fasha abandi.',
        7: 'Umwaka w’ubushakashatsi. Kwiga no gutekereza.',
        8: 'Umwaka w’ubutunzi. Koresha ubushobozi bwawe.',
        9: 'Umwaka w’ukurangiza. Funga ibintu bishaje.',
        11: 'Umwaka w’ubushishozi. Koresha intuition.',
        22: 'Umwaka w’ibintu binini. Kora ibintu bikomeye.',
        33: 'Umwaka w’impano. Fasha abandi.'
    };
    if (personalYearAdvice[personalYear]) {
        advice.push({ icon: '📅', label: `Umwaka bwite ${personalYear}`, text: personalYearAdvice[personalYear] });
    }

    const moonPlanet = planets.find(p => p.name === 'Moon');
    if (moonPlanet) advice.push({ icon: '☽', label: `Ukwezi muri ${moonPlanet.sign.name}`, text: `Ibyiyumvo byawe bigenda muri ${moonPlanet.sign.name}. ${moonPlanet.sign.element} element iriho.` });
    const mercury = planets.find(p => p.name === 'Mercury');
    if (mercury) advice.push({ icon: '☿', label: `Mercury muri ${mercury.sign.name}`, text: `Itumanaho n’ubwenge bigenda muri ${mercury.sign.name}.` });
    const venus = planets.find(p => p.name === 'Venus');
    if (venus) advice.push({ icon: '♀', label: `Venus muri ${venus.sign.name}`, text: `Urukundo n’ubwiza bigenda muri ${venus.sign.name}.` });
    const mars = planets.find(p => p.name === 'Mars');
    if (mars) advice.push({ icon: '♂', label: `Mars muri ${mars.sign.name}`, text: `Ingufu n’ubushake bigenda muri ${mars.sign.name}.` });

    const hour = now.getHours();
    if (hour < 6) advice.push({ icon: '🌙', label: 'Igihe cyo kuruhuka', text: 'Nijoro ni igihe cyo kuruhuka no kurota.' });
    else if (hour < 12) advice.push({ icon: '🌅', label: 'Igitondo', text: 'Igitondo ni igihe cyiza cyo gutangira.' });
    else if (hour < 18) advice.push({ icon: '☀️', label: 'Nyuma ya saa sita', text: 'Nyuma ya saa sita ni igihe cyo gukora.' });
    else advice.push({ icon: '🌆', label: 'Nimugororo', text: 'Nimugoroba ni igihe cyo kuruhuka.' });

    adviceList.innerHTML = advice.map(a => `
        <div class="advice-item">
            <span class="advice-icon">${a.icon}</span>
            <span class="advice-label">${a.label}</span>
            ${a.text}
        </div>
    `).join('');
    liveSection.style.display = 'block';
}

// ============ MAIN RENDER ============
function renderResults(query, justAdded = false) {
    const resultsEl = document.getElementById('numerologyResults');
    const familiesEl = document.getElementById('familyResults');
    const astroSection = document.getElementById('astroSection');
    if (!resultsEl || !familiesEl) return;
    lastQuery = query;

    // ---- NEW: record in history ----
    if (window.AccountBar && query.trim()) {
        window.AccountBar.pushHistory({
            type: currentCategory === 'names' ? 'name'
                : currentCategory === 'words' ? 'word' : 'place',
            query: query.trim(),
            at: new Date().toISOString(),
            link: `numerology.html?tab=${currentCategory}&q=${encodeURIComponent(query.trim())}`
        });
    }
    // ---- END NEW ----

    if (!query.trim()) {
        resultsEl.innerHTML = '<p class="num-empty">Andika ijambo.</p>';
        familiesEl.innerHTML = '';
        if (astroSection) astroSection.style.display = 'none';
        return;
    }

    const stored = findStoredRecord(query, currentCategory);
    const calc = calculateAll(query);
    if (!calc.normalized) {
        resultsEl.innerHTML = '<p class="num-empty">Andika ijambo gifite inyuguti.</p>';
        familiesEl.innerHTML = '';
        if (astroSection) astroSection.style.display = 'none';
        return;
    }

    const numbers = {
        pythagorean: calc.pythagorean.reduced,
        egyptian: calc.egyptian.reduced,
        latin: calc.latin.reduced,
        afro: calc.afro.reduced,
        sebidegede2: calc.sebidegede2.reduced
    };

    currentNumbers = numbers;

    resultsEl.innerHTML = `
        <p class="num-query">
            “${query.trim()}”
            → <code>${calc.normalized}</code>
            ${stored ? '<span class="stored-tag">muri database</span>' : '<span class="new-tag">ntiriri muri database</span>'}
            ${justAdded ? '<span class="stored-tag">ryongewe</span>' : ''}
        </p>

        ${renderAfroPanel(calc.afro, calc.sebidegede2)}

        <div class="num-grid" style="margin-top: 18px;">
            ${renderSystemCard('Pythagorean', calc.pythagorean, 'sys-pyth')}
            ${renderSystemCard('Egyptian', calc.egyptian, 'sys-egypt')}
            ${renderSystemCard('Latin', calc.latin, 'sys-latin')}
        </div>
    `;

    // Astrology only for names.
    if (currentCategory === 'names') {
        renderAstroChart(numbers, null);
    } else if (astroSection) {
        astroSection.style.display = 'none';
    }

    const groups = findMatchesBySystem(calc, stored?.key || calc.normalized, currentCategory);
    const correspondingHtml = renderCorrespondingGroups(groups, calc, displayName(query), currentCategory);

    if (!stored) {
        familiesEl.innerHTML = showAddPrompt(query, calc, correspondingHtml, currentCategory);
        document.getElementById('confirmAddName')?.addEventListener('click', () => {
            const added = addNameToDatabase(pendingAddName, currentCategory);
            pendingAddName = '';
            if (added) renderResults(added.name, true);
        });
        document.getElementById('skipAddName')?.addEventListener('click', () => {
            pendingAddName = '';
            familiesEl.innerHTML = correspondingHtml;
            bindNamePills(familiesEl);
        });
        bindNamePills(familiesEl);
        return;
    }

    familiesEl.innerHTML = correspondingHtml;
    bindNamePills(familiesEl);
}

// ============ TABS ============
function switchNumerologyTab(category) {
    if (!['names', 'words', 'places'].includes(category)) return;
    currentCategory = category;

    // Update tab active state
    document.querySelectorAll('.num-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.cat === category);
    });

    // Update input placeholder
    const input = document.getElementById('numerologyInput');
    if (input) {
        if (category === 'names') input.placeholder = 'Andika izina...';
        else if (category === 'words') input.placeholder = 'Andika ijambo...';
        else input.placeholder = 'Andika ahantu...';
        input.value = '';
    }

    // Hide previous results & astrology
    const resultsEl = document.getElementById('numerologyResults');
    const familiesEl = document.getElementById('familyResults');
    const astroSection = document.getElementById('astroSection');
    if (resultsEl) resultsEl.innerHTML = '';
    if (familiesEl) familiesEl.innerHTML = '';
    if (astroSection) astroSection.style.display = 'none';

    // Reset birth form when leaving names
    if (category !== 'names') {
        const bf = document.getElementById('birthForm');
        if (bf) bf.reset();
    }
}

function updateTabCounts() {
    const cn = document.getElementById('countNames');
    const cw = document.getElementById('countWords');
    const cp = document.getElementById('countPlaces');
    if (cn) cn.textContent = nameDatabase.length;
    if (cw) cw.textContent = wordDatabase.length;
    if (cp) cp.textContent = placeDatabase.length;
}

// ============ LOADING ============
function parseSeedNames(data) {
    if (Array.isArray(data)) {
        return data.map((item) => (typeof item === 'string' ? item : item?.family || item?.name || item?.word || item?.place || '')).filter(Boolean);
    }
    if (Array.isArray(data?.families)) {
        return data.families.map((item) => (typeof item === 'string' ? item : item?.family || '')).filter(Boolean);
    }
    if (Array.isArray(data?.words)) {
        return data.words.map((item) => (typeof item === 'string' ? item : item?.word || '')).filter(Boolean);
    }
    if (Array.isArray(data?.places)) {
        return data.places.map((item) => (typeof item === 'string' ? item : item?.place || '')).filter(Boolean);
    }
    return [];
}

async function loadCategoryFile(url) {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
            return parseSeedNames(await response.json());
        }
    } catch {}
    return [];
}

async function loadAllDatabases() {
    const note = document.getElementById('familyFileNote');

    // Names: prefer window.FAMILY_NAMES_SEED, then fall back to fetch()
    let seedNames = parseSeedNames(window.FAMILY_NAMES_SEED || []);
    if (!seedNames.length) {
        seedNames = await loadCategoryFile('data/family-names.json');
    }

    // Words: prefer window.WORDS_SEED, then fall back to fetch()
    let seedWords = parseSeedNames(window.WORDS_SEED || []);
    if (!seedWords.length) {
        seedWords = await loadCategoryFile('data/words.json');
    }

    // Places: prefer window.PLACES_SEED, then fall back to fetch()
    let seedPlaces = parseSeedNames(window.PLACES_SEED || []);
    if (!seedPlaces.length) {
        seedPlaces = await loadCategoryFile('data/places.json');
    }

    seedKeysNames  = new Set(seedNames.map((name) => normalizeName(name)).filter(Boolean));
    seedKeysWords  = new Set(seedWords.map((name) => normalizeName(name)).filter(Boolean));
    seedKeysPlaces = new Set(seedPlaces.map((name) => normalizeName(name)).filter(Boolean));

    nameDatabase  = mergeDatabase(seedNames,  loadStoredRecords('names'));
    wordDatabase  = mergeDatabase(seedWords,  loadStoredRecords('words'));
    placeDatabase = mergeDatabase(seedPlaces, loadStoredRecords('places'));

    updateTabCounts();

    if (note) {
        const total = nameDatabase.length + wordDatabase.length + placeDatabase.length;
        note.textContent = total
            ? `${nameDatabase.length} amazina · ${wordDatabase.length} amagambo · ${placeDatabase.length} ahantu.`
            : 'Nta makuru yabonetse. Reba ko data/words.js na data/places.js biriho.';
    }
}

// ============ BINDING ============
function bindForm() {
    const form = document.getElementById('numerologyForm');
    const input = document.getElementById('numerologyInput');
    const downloadBtn = document.getElementById('downloadFamilyNames');
    const downloadWordsBtn = document.getElementById('downloadWords');
    const downloadPlacesBtn = document.getElementById('downloadPlaces');
    if (!form || !input) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        renderResults(input.value);
    });

    downloadBtn?.addEventListener('click', downloadFamilyNamesFile);
    downloadWordsBtn?.addEventListener('click', downloadWordsFile);
    downloadPlacesBtn?.addEventListener('click', downloadPlacesFile);
}

function bindBirthForm() {
    const birthForm = document.getElementById('birthForm');
    if (!birthForm) return;
    birthForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (currentCategory !== 'names') {
            alert('Ikarita y’inyenyeri iboneka gusa ku mazina.');
            return;
        }
        const date = document.getElementById('birthDate').value;
        const time = document.getElementById('birthTime').value;
        const place = document.getElementById('birthPlace').value;
        if (!date) return;
        if (currentNumbers) renderAstroChart(currentNumbers, { date, time, place });
        else alert('Banza wandike izina kugira ngo ubone imibare.');
    });
}

function fillGreeting() {
    const name = localStorage.getItem('wrzkk_user_name') || localStorage.getItem('wrzkk_user_email') || '';
    const el = document.getElementById('numerologyUser');
    if (el) el.textContent = name;
}

// Expose the tab switcher to inline onclick handlers
window.switchNumerologyTab = switchNumerologyTab;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireRegisteredAccount()) return;
    await loadAllDatabases();
    bindForm();
    bindBirthForm();
    fillGreeting();

    // ---- NEW: read query string ----
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const q   = params.get('q');
    if (tab && ['names','words','places'].includes(tab)) {
        switchNumerologyTab(tab);
    } else {
        switchNumerologyTab('names');
    }
    if (q) {
        const input = document.getElementById('numerologyInput');
        if (input) input.value = q;
        renderResults(q);
    }
    // ---- END NEW ----
    switchNumerologyTab('names');
});