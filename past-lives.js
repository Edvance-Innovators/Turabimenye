// ============================================================
// PAST & FUTURE LIVES — quiz logic
// ============================================================

// ---------- 9 lives (8 originals + Atlantean) ----------
// yearLabel = estimated era on the timeline (past or future)
const PL_LIVES = [
    {
        key: 'priest',
        emoji: '🏛️',
        era: 'Misiri ya Kera',
        yearLabel: '~3000–30 M.Y.',
        title: 'Umutambyi / Farawo',
        desc: 'Ubutware, ubumenyi bw’imyumvire, n’imihango y’icyubahiro.',
        gifts: 'Kuyobora mu buryo bw’umwuka, gusobanukirwa amabanga, kwigisha.',
        shadow: 'Kwigira hejuru, kugundira ubutware, kwifunga mu migenzo.',
        traces: 'Ukunda ibintu by’imihango, ufite intuition ikomeye, ukunda ukuri.'
    },
    {
        key: 'knight',
        emoji: '⚔️',
        era: 'Ikinyejana cya 12',
        yearLabel: '~1100–1400 M.Y.',
        title: 'Umurwanyi w’icyubahiro / Umukorikori',
        desc: 'Icyubahiro, ubukorikori, n’ukwitanga ku nzira nziza.',
        gifts: 'Gukora ibintu byiza, kwitanga, gukunda umuco.',
        shadow: 'Gukabya, kwitwara nabi, kugira ngo “nirwanire” ibintu bitari ngombwa.',
        traces: 'Ufite amahame akomeye, ukunda ibintu byakozwe n’amaboko, ufite umurava.'
    },
    {
        key: 'warrior',
        emoji: '🛡️',
        era: 'Viking',
        yearLabel: '~793–1066 M.Y.',
        title: 'Intwari / Umushakashatsi',
        desc: 'Ubutwari, urugendo, n’ibikorwa bitinya nta shiti.',
        gifts: 'Kurwanira abandi, guhiga intego, kutinya ubutayu.',
        shadow: 'Kutitonda, gushaka intambara ahantu hose, kutihangana.',
        traces: 'Ukunda ibintu bishya, ufite ubwoba buke, uhangana n’ibigeragezo.'
    },
    {
        key: 'diplomat',
        emoji: '📜',
        era: 'Ingoma y’Aziya',
        yearLabel: '~600–1600 M.Y.',
        title: 'Umunyamahoro / Umufilozofe',
        desc: 'Ubwumvikane, ubwenge, n’ubuyobozi buhanganye.',
        gifts: 'Gushyira amahoro, gutekereza cyane, guhuza abantu.',
        shadow: 'Kutavuga ukuri, kwirinda gukemura ibibazo, kwikunda mu bitekerezo.',
        traces: 'Ukunda amahoro, utekereza mbere yo kuvuga, ufasha abandi mu bwenge.'
    },
    {
        key: 'healer',
        emoji: '🌿',
        era: 'Umuryango wa kera',
        yearLabel: '~10,000–3000 M.Y.',
        title: 'Umuvuzi / Umushaman',
        desc: 'Intuition, kuvura, n’ihuriro n’isi itaboneka.',
        gifts: 'Kuvura abandi, kumva ibintu, guhuza umubiri n’umutima.',
        shadow: 'Kwitanga cyane, kwirengagiza ubuzima bwawe, gutakaza imipaka.',
        traces: 'Abandi baza kugusaba inama, ufite intuition ikomeye, ukunda ibidukikije.'
    },
    {
        key: 'inventor',
        emoji: '⚙️',
        era: 'Igihe cya Victorian',
        yearLabel: '~1837–1901 M.Y.',
        title: 'Umuhanga / Umuvuguruzi',
        desc: 'Iterambere, imibereho myiza, n’impinduka zishingiye kuri gahunda.',
        gifts: 'Guhanga ibintu, guhindura gahunda, gufasha abandi.',
        shadow: 'Gukabya, gushaka guhindura byose, kutihangana n’abandi.',
        traces: 'Ukunda gahunda, ufite ibitekerezo bishya, ukunda guhindura ibintu.'
    },
    {
        key: 'visionary',
        emoji: '🚀',
        era: 'Ejo hazaza',
        yearLabel: '~2150–2400 N.Y.',
        title: 'Uwihariye / Umuvumbuzi',
        desc: 'Ubuhanga, amahirwe, n’icyerekezo kirenze igihe.',
        gifts: 'Kureba kure, guhanga ibintu bishya, kuyobora abandi mu nzira nshya.',
        shadow: 'Kutaba mu gihe kiriho, kwirengagiza ibintu by’ibanze, kubura abafasha.',
        traces: 'Ufite intego nini, utekereza kure, ukunda ibintu bishya n’ubuhanga.'
    },
    {
        key: 'artist',
        emoji: '🎨',
        era: 'Renaissance',
        yearLabel: '~1400–1600 M.Y.',
        title: 'Umuhanzi / Umuhanga mu by’ubwenge',
        desc: 'Ubuhanzi, ubushakashatsi bw’ubwenge, n’ubwiza.',
        gifts: 'Guhanga, kwiga, kubona ubwiza aho buhari.',
        shadow: 'Kutizera, guhindagurika mu byiyumvo, kutihangana.',
        traces: 'Ukunda ubuhanzi n’ubwiza, ufite ubwenge bwinshi, uhindagurika mu byiyumvo.'
    },
    {
        // ===== 9th life: Atlantean =====
        key: 'atlantean',
        emoji: '🌊',
        era: 'Atlantis ya Kera',
        yearLabel: '~9600 M.Y. (cyangwa mbere)',
        title: 'Umunyamazi wa Atlantisi',
        desc: 'Ubumenyi bwahishwe, ingufu z’amazi n’ubumenyi bwa kera bwatakaye.',
        gifts: 'Kumenya ibintu bya kera, gukoresha ingufu z’ibintu, kureba ikirenga.',
        shadow: 'Kwibagirwa ubutabera, kwifuza ubutware bwinshi, gukoresha ingufu nabi.',
        traces: 'Ufite intuition ikomeye, ukunda amazi n’ibintu bya kera, wumva hari ikintu kirimo kubura.'
    }
];

// ---------- 12 questions ----------
// Each option maps to one of the original 8 lives (keys match).
// Atlantean is NOT directly selectable — it wins only through the
// combination rule below (healer + priest + visionary blend).
const PL_QUESTIONS = [
    {
        q: 'Winjira mu iduka ry’ibintu bya kera. Ni iki kikurura mbere?',
        opts: [
            { letter: 'A', label: 'Intwaro n’ibikoresho by’intambara', hint: 'Ukuboko kwawe kwifuza inkota nk’aho uyizi', key: 'warrior' },
            { letter: 'B', label: 'Inyandiko za kera n’amakarita', hint: 'Wumva nk’uri mu rugo', key: 'diplomat' },
            { letter: 'C', label: 'Ibintu byiza byakozwe n’amaboko', hint: 'Umenya ubukorikori bw’igihe kirekire', key: 'knight' },
            { letter: 'D', label: 'Ibikoresho byo kugenda n’indege', hint: 'Ijwi ry’ibirenze rya kure riraguhamagara', key: 'visionary' }
        ]
    },
    {
        q: 'Ufite umunsi wuzuye ubusa. Ukora iki?',
        opts: [
            { letter: 'A', label: 'Kwiga ibintu bishya mu bitabo', hint: 'Ubwenge n’ubushakashatsi', key: 'artist' },
            { letter: 'B', label: 'Kugenda ahantu hashya', hint: 'Urugendo n’ibintu bishya', key: 'warrior' },
            { letter: 'C', label: 'Gufasha abandi', hint: 'Kuvura no kwita ku bandi', key: 'healer' },
            { letter: 'D', label: 'Kubaka cyangwa gukora ikintu', hint: 'Gukora ibintu bifatika', key: 'inventor' }
        ]
    },
    {
        q: 'Ni iyihe nzozi ukunze kubona?',
        opts: [
            { letter: 'A', label: 'Amatemberero mu nsi ya kera', hint: 'Ahantu hashaje n’abantu b’igihe kirekire', key: 'priest' },
            { letter: 'B', label: 'Intambara n’ibikorwa by’ubutwari', hint: 'Kurwana no guhiga', key: 'warrior' },
            { letter: 'C', label: 'Ibintu bishya n’isi y’ejo hazaza', hint: 'Iterambere n’ubuhanga', key: 'visionary' },
            { letter: 'D', label: 'Amahoro n’ubwiza', hint: 'Umutuzo n’ubuhanzi', key: 'artist' }
        ]
    },
    {
        q: 'Abandi bakubwira ko uri...',
        opts: [
            { letter: 'A', label: 'Umukomezi cyane', hint: 'Ufite ubwoba buke', key: 'warrior' },
            { letter: 'B', label: 'Umuntu w’amahoro', hint: 'Uhuza abandi', key: 'diplomat' },
            { letter: 'C', label: 'Umuntu w’ubwenge', hint: 'Utekereza cyane', key: 'artist' },
            { letter: 'D', label: 'Umuntu w’umutima mwiza', hint: 'Ufasha abandi', key: 'healer' }
        ]
    },
    {
        q: 'Igihe ufite ikibazo gikomeye, ukora iki?',
        opts: [
            { letter: 'A', label: 'Nshaka inama ku Mana cyangwa mu buryo bw’umwuka', hint: 'Kwizera n’ubushishozi', key: 'priest' },
            { letter: 'B', label: 'Ntekereza cyane mbere yo gufata icyemezo', hint: 'Ubwenge n’ubushishozi', key: 'diplomat' },
            { letter: 'C', label: 'Nshaka abandi bafasha', hint: 'Ubufatanye n’ubwumvikane', key: 'healer' },
            { letter: 'D', label: 'Nshaka igisubizo gishya', hint: 'Guhanga n’iterambere', key: 'inventor' }
        ]
    },
    {
        q: 'Uhitamo gukorera mu...',
        opts: [
            { letter: 'A', label: 'Ahantu hatuje cyane', hint: 'Umutuzo n’ubwiza', key: 'artist' },
            { letter: 'B', label: 'Ahantu hari abantu benshi', hint: 'Kuyobora no guhuza abandi', key: 'priest' },
            { letter: 'C', label: 'Ahantu h’ubuhanga', hint: 'Iterambere n’ubuhanga', key: 'inventor' },
            { letter: 'D', label: 'Ahantu h’ibirunga cyangwa ishyamba', hint: 'Ibidukikije n’ubuvuzi', key: 'healer' }
        ]
    },
    {
        q: 'Ni iyihe mpano ufite cyane?',
        opts: [
            { letter: 'A', label: 'Gukunda abantu', hint: 'Urukundo n’ubwitange', key: 'healer' },
            { letter: 'B', label: 'Guhanga ibintu bishya', hint: 'Ubuhanzi n’ubuhanga', key: 'inventor' },
            { letter: 'C', label: 'Kuyobora abandi', hint: 'Ubuyobozi n’intego', key: 'visionary' },
            { letter: 'D', label: 'Kurwana no guhiga', hint: 'Ubutwari n’ubushobozi', key: 'warrior' }
        ]
    },
    {
        q: 'Ufite umwanya muto w’umudendezo. Ujya he?',
        opts: [
            { letter: 'A', label: 'Mu irerero ry’ibitabo', hint: 'Ubwenge n’ubushakashatsi', key: 'artist' },
            { letter: 'B', label: 'Mu misitu cyangwa ku musozi', hint: 'Ibidukikije n’ubuvuzi', key: 'healer' },
            { letter: 'C', label: 'Mu kirere cyangwa mu nzira nshya', hint: 'Iterambere n’ubuhanga', key: 'visionary' },
            { letter: 'D', label: 'Mu nzu y’ihariwe n’imyitozo', hint: 'Kwiga n’ubuhanga', key: 'priest' }
        ]
    },
    {
        q: 'Ni iyihe mbabazi ukunze kwifuza?',
        opts: [
            { letter: 'A', label: 'Kugira ubwenge buhambaye', hint: 'Ubwenge n’ubumenyi', key: 'artist' },
            { letter: 'B', label: 'Kugira ingufu nyinshi', hint: 'Imbaraga n’ubushobozi', key: 'warrior' },
            { letter: 'C', label: 'Kugira amahoro mu mutima', hint: 'Umutuzo n’ubwumvikane', key: 'diplomat' },
            { letter: 'D', label: 'Kugira imbaraga zo kuvura', hint: 'Kuvura n’ubwitange', key: 'healer' }
        ]
    },
    {
        q: 'Uhitamo gute ku byerekeye urukundo?',
        opts: [
            { letter: 'A', label: 'Ndi umunyabwoba gato', hint: 'Kwitinya n’ubwoba', key: 'artist' },
            { letter: 'B', label: 'Ndi umunyamahane akomeye', hint: 'Amahame n’ubudahemuka', key: 'knight' },
            { letter: 'C', label: 'Ndi umunyabwenge mu by’urukundo', hint: 'Ubwenge n’ubushishozi', key: 'diplomat' },
            { letter: 'D', label: 'Ndi umunyabwoba buke', hint: 'Ubutwari n’ubwitange', key: 'warrior' }
        ]
    },
    {
        q: 'Ufite ikibazo mu muryango. Ukora iki?',
        opts: [
            { letter: 'A', label: 'Nshaka ubwumvikane', hint: 'Amahoro n’ubufatanye', key: 'diplomat' },
            { letter: 'B', label: 'Nshaka kureba ibintu mu ruhande rw’Imana', hint: 'Kwizera n’ubushishozi', key: 'priest' },
            { letter: 'C', label: 'Nshaka gufasha buri wese', hint: 'Kuvura n’ubwitange', key: 'healer' },
            { letter: 'D', label: 'Nshaka gukemura ikibazo ako kanya', hint: 'Gukemura n’ubushobozi', key: 'warrior' }
        ]
    },
    {
        q: 'Uhagaze imbere y’urukiko rw’amateka. Uri nde?',
        opts: [
            { letter: 'A', label: 'Umwami cyangwa umukuru w’igihugu', hint: 'Ubuyobozi n’intego', key: 'visionary' },
            { letter: 'B', label: 'Umuhanga w’amategeko', hint: 'Ubwenge n’ubushishozi', key: 'diplomat' },
            { letter: 'C', label: 'Umunyamakuru cyangwa umuhanzi', hint: 'Ubuhanzi n’itumanaho', key: 'artist' },
            { letter: 'D', label: 'Umurwanyi w’ubutwari', hint: 'Ubutwari n’ubwitange', key: 'knight' }
        ]
    }
];

// ---------- State ----------
let plState = {
    fullName: '',
    birthdate: '',
    answers: [],
    currentIndex: 0
};

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    renderLivesGrid();
    renderTakenCount();
    updateResultCountOnMenu();
});

function renderLivesGrid() {
    const grid = document.getElementById('plLivesGrid');
    if (!grid) return;
    grid.innerHTML = PL_LIVES.map(l => `
        <div class="pl-life-card">
            <span class="pl-life-emoji">${l.emoji}</span>
            <h3>${l.title}</h3>
            <div class="pl-life-era">${l.era}</div>
            <div class="pl-life-year">${l.yearLabel}</div>
            <p class="pl-life-desc">${l.desc}</p>
        </div>
    `).join('');
}

function renderTakenCount() {
    const el = document.getElementById('plTakenCount');
    if (!el) return;
    const base = 12_100;
    const extra = Number(localStorage.getItem('wrzkk_pl_taken') || 0);
    el.textContent = `${(base + extra).toLocaleString('en-US')} abantu basanzwe bahuye n’ubuzima bwabo bwashize.`;
}

function updateResultCountOnMenu() {
    // Reserved for future: reflect saved count somewhere else
}

// ---------- Quiz flow ----------
function startPastLifeQuiz() {
    const nameEl = document.getElementById('plFullName');
    const dateEl = document.getElementById('plBirthdate');
    if (!nameEl.value.trim()) {
        alert('Andika amazina yawe yombi.');
        nameEl.focus();
        return;
    }
    if (!dateEl.value) {
        alert('Andika itariki y’amavuko.');
        dateEl.focus();
        return;
    }
    plState.fullName = nameEl.value.trim();
    plState.birthdate = dateEl.value;
    plState.answers = [];
    plState.currentIndex = 0;

    document.getElementById('plSetup').style.display = 'none';
    document.getElementById('plQuiz').style.display = 'block';
    document.getElementById('plResult').style.display = 'none';

    renderQuestion();
}

function renderQuestion() {
    const i = plState.currentIndex;
    const total = PL_QUESTIONS.length;
    const q = PL_QUESTIONS[i];

    // Progress
    const pct = Math.round(((i + 1) / total) * 100);
    document.getElementById('plProgressText').textContent = `Ikibazo ${i + 1} kuri ${total}`;
    document.getElementById('plProgressPercent').textContent = `${pct}%`;
    document.getElementById('plProgressFill').style.width = `${pct}%`;

    // Question
    document.getElementById('plQuestionText').textContent = q.q;

    // Options
    const optsEl = document.getElementById('plOptions');
    optsEl.innerHTML = q.opts.map((o, idx) => `
        <button type="button" class="pl-option" data-idx="${idx}">
            <span class="pl-opt-letter">${o.letter}</span>
            <span class="pl-opt-body">
                <span class="pl-opt-label">${o.label}</span>
                ${o.hint ? `<span class="pl-opt-hint">${o.hint}</span>` : ''}
            </span>
        </button>
    `).join('');

    optsEl.querySelectorAll('.pl-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.idx);
            answerQuestion(idx);
        });
    });
}

function answerQuestion(idx) {
    const q = PL_QUESTIONS[plState.currentIndex];
    plState.answers.push(q.opts[idx].key);

    // Disable further clicks briefly for a smooth feel
    document.querySelectorAll('.pl-option').forEach(b => b.disabled = true);

    setTimeout(() => {
        plState.currentIndex++;
        if (plState.currentIndex >= PL_QUESTIONS.length) {
            showResult();
        } else {
            renderQuestion();
        }
    }, 180);
}

// ---------- Scoring ----------
function tallyScores(answers) {
    const scores = {};
    PL_LIVES.forEach(l => { scores[l.key] = 0; });

    answers.forEach(key => {
        if (scores[key] !== undefined) scores[key]++;
    });

    // Deterministic nudge from name + birthdate: adds a small hash-based bias
    // so two users with the same answers get slightly different weightings.
    const seed = hashString(plState.fullName + '|' + plState.birthdate);
    PL_LIVES.forEach((l, i) => {
        scores[l.key] += ((seed >> (i * 3)) & 0x3) * 0.15;
    });

    return scores;
}

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// ---------- Winner pick (with Atlantean combination rule) ----------
function pickWinner(scores, answers) {
    // ---- Atlantean combination check ----
    // Atlantean wins when the answers blend three mystical-ish energies
    // at once: healer + priest + visionary.
    const counts = { healer: 0, priest: 0, visionary: 0 };
    (answers || []).forEach(key => {
        if (counts[key] !== undefined) counts[key]++;
    });
    const atlanteanTotal = counts.healer + counts.priest + counts.visionary;

    // Highest score among the original 8 (excluding Atlantean)
    const highestOriginal = Math.max(
        ...PL_LIVES
            .filter(l => l.key !== 'atlantean')
            .map(l => scores[l.key])
    );

    const isAtlantean =
        counts.healer    >= 1 &&
        counts.priest    >= 1 &&
        counts.visionary >= 1 &&
        atlanteanTotal   >= 5 &&
        highestOriginal  <= 5;

    if (isAtlantean) {
        // Give Atlantean the top score so the bars reflect the pick
        scores.atlantean = Math.max(...Object.values(scores)) + 1;
        return 'atlantean';
    }

    // ---- Normal pick (original 8 only) ----
    let winner = PL_LIVES[0].key;
    let best = -Infinity;
    for (const l of PL_LIVES) {
        if (l.key === 'atlantean') continue;
        if (scores[l.key] > best) {
            best = scores[l.key];
            winner = l.key;
        }
    }
    return winner;
}

// ---------- Result ----------
function showResult() {
    const scores = tallyScores(plState.answers);
    const winnerKey = pickWinner(scores, plState.answers);
    const winner = PL_LIVES.find(l => l.key === winnerKey);

    // Fill result card
    document.getElementById('plResEmoji').textContent = winner.emoji;
    document.getElementById('plResEra').textContent = `${winner.era} · ${winner.yearLabel}`;
    document.getElementById('plResTitle').textContent = winner.title;
    document.getElementById('plResSub').textContent = winner.desc;
    document.getElementById('plResGifts').textContent = winner.gifts;
    document.getElementById('plResShadow').textContent = winner.shadow;
    document.getElementById('plResTraces').textContent = winner.traces;

    // Bars — order Atlantean to show up when it wins by boosting its score
    const max = Math.max(...Object.values(scores), 1);
    const barsEl = document.getElementById('plBars');
    barsEl.innerHTML = PL_LIVES.map(l => {
        const pct = Math.round((scores[l.key] / max) * 100);
        // Extract just the first word of the Kinyarwanda title for the bar label
        const shortLabel = l.title.split(' / ')[0].split(' ').slice(0, 2).join(' ');
        return `
            <div class="pl-bar-row">
                <span class="pl-bar-label">${l.emoji} ${shortLabel}</span>
                <div class="pl-bar-track"><div class="pl-bar-fill" style="width:${pct}%"></div></div>
                <span class="pl-bar-value">${pct}%</span>
            </div>
        `;
    }).join('');

    document.getElementById('plQuiz').style.display = 'none';
    document.getElementById('plResult').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Increment taken count once per session
    if (!sessionStorage.getItem('wrzkk_pl_counted')) {
        const extra = Number(localStorage.getItem('wrzkk_pl_taken') || 0) + 1;
        localStorage.setItem('wrzkk_pl_taken', String(extra));
        sessionStorage.setItem('wrzkk_pl_counted', '1');
        renderTakenCount();
    }
}

// ---------- Save to account ----------
function savePastLifeResult() {
    if (!window.AccountBar) {
        alert('Konti yawe ntiraboneka kuri iyi page.');
        return;
    }
    if (!window.AccountBar.isRegistered()) {
        alert('Injira cyangwa wiyandikishe kugira ngo ubike ibisubizo.');
        return;
    }
    const scores = tallyScores(plState.answers);
    const winnerKey = pickWinner(scores, plState.answers);
    const winner = PL_LIVES.find(l => l.key === winnerKey);

    const ok = window.AccountBar.saveMatch({
        type: 'past-life',
        source: plState.fullName,
        target: winner.title,
        systems: { era: winner.era, year: winner.yearLabel, key: winner.key },
        names: [plState.fullName],
        note: `${winner.emoji} ${winner.title} · ${winner.era} · ${winner.yearLabel}`
    });
    alert(ok ? '✅ Ibisubizo byabitswe mu konti yawe.' : 'ℹ️ Ibi byari byabitswe.');
}

// ---------- Restart ----------
function restartPastLifeQuiz() {
    plState.answers = [];
    plState.currentIndex = 0;
    document.getElementById('plResult').style.display = 'none';
    document.getElementById('plQuiz').style.display = 'none';
    document.getElementById('plSetup').style.display = 'block';
    sessionStorage.removeItem('wrzkk_pl_counted');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Expose to inline handlers
window.startPastLifeQuiz = startPastLifeQuiz;
window.restartPastLifeQuiz = restartPastLifeQuiz;
window.savePastLifeResult = savePastLifeResult;