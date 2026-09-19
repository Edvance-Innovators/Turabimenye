// extract-kinnews.js
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');

const ZIP_PATH     = 'C:\\Users\\VDDwk\\Documents\\WrrrUxC\\data\\Kinyarwanda.zip';
const OUTPUT       = 'C:\\Users\\VDDwk\\Documents\\WrrrUxC\\data\\words.json';
const ENGLISH_PATH = 'C:\\Users\\VDDwk\\Documents\\WrrrUxC\\data\\english.txt';

// ================= LOAD ENGLISH STOPWORDS =================
let englishWords = new Set();
if (fs.existsSync(ENGLISH_PATH)) {
  const txt = fs.readFileSync(ENGLISH_PATH, 'utf8');
  txt.split('\n').forEach(w => {
    const clean = w.trim().toLowerCase();
    if (clean) englishWords.add(clean);
  });
  console.log(`📚 Loaded ${englishWords.size} English words to filter against.`);
} else {
  console.warn(`⚠️  No english.txt found at ${ENGLISH_PATH}. English words will NOT be filtered.`);
}

// ================= WORDS TO KEEP EVEN IF ENGLISH =================
// These appear in both languages but are commonly used in Kinyarwanda text.
const KEEP_IF_ENGLISH = new Set([
  'radio', 'telefoni', 'moto', 'bisi', 'kamera', 'foto', 'video',
  'internet', 'email', 'website', 'facebook', 'twitter', 'google',
  'gmail', 'wifi', 'cyber', 'polisi', 'ministeri', 'perezida',
  'dokoteri', 'militari', 'baniki', 'gas', 'kafe', 'siporo',
  'film', 'animasiyo', 'televiziyo', 'mizika', 'disiko'
]);

// ================= WORD CLEANING =================
function cleanWord(raw) {
  return raw
    .normalize('NFKC')
    // Strip all quotation-mark variants (straight, curly, low, backtick, acute)
    .replace(/[\u2018\u2019\u201C\u201D\u201E\u201F\u2039\u203A\u0060\u00B4'"`´]/g, '')
    // Keep letters and digits only
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase()
    .trim();
}

function addWordTo(set, raw) {
  const clean = cleanWord(raw);
  if (clean.length < 2) return;
  if (/^\d+$/.test(clean)) return;

  const digitCount = (clean.match(/\d/g) || []).length;
  if (digitCount / clean.length > 0.4) return;
  if (!/\p{L}/u.test(clean)) return;
  if (/^-/.test(clean)) return;
  if (/^(https?|www)/i.test(clean)) return;

  // Skip pure English words unless they're on the Kinyarwanda keep-list
  if (englishWords.has(clean) && !KEEP_IF_ENGLISH.has(clean)) return;

  set.add(clean);
}

// ================= CSV / TXT / JSON EXTRACTION =================
function extractFromCsvText(csvText, words) {
  let rows;
  try {
    rows = parse(csvText, {
      columns: true, skip_empty_lines: true,
      relax_quotes: true, relax_column_count: true, bom: true
    });
  } catch {
    rows = parse(csvText, {
      skip_empty_lines: true,
      relax_quotes: true, relax_column_count: true, bom: true
    });
  }

  const TEXT_COLUMNS = ['title', 'content', 'text', 'article', 'body', 'headline'];

  rows.forEach(row => {
    let text = '';
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      const keys = Object.keys(row);
      const chosen = keys.filter(k => TEXT_COLUMNS.includes(k.toLowerCase()));
      const use = chosen.length ? chosen : keys.filter(k =>
        !/^(id|url|link|date|time|label|category|tag|_)/i.test(k)
      );
      text = use.map(k => row[k]).filter(Boolean).join(' ');
    } else if (Array.isArray(row)) {
      text = row.filter(v => typeof v === 'string' && v.length > 20).join(' ');
    } else if (typeof row === 'string') {
      text = row;
    }

    text.split(/\s+/).forEach(tok => addWordTo(words, tok));
  });
}

function extractFromPlainText(text, words) {
  text.split(/\s+/).forEach(tok => addWordTo(words, tok));
}

// ================= MAIN =================
function main() {
  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`❌ ZIP not found at ${ZIP_PATH}`);
    process.exit(1);
  }

  console.log('📦 Reading ZIP...');
  const zip = new AdmZip(ZIP_PATH);
  const entries = zip.getEntries();

  console.log(`Found ${entries.length} entries.\n`);

  const allWords = new Set();
  let processed = 0;

  entries.forEach(entry => {
    if (entry.isDirectory) return;
    const name = entry.entryName.toLowerCase();

    if (/\.csv$/i.test(name)) {
      console.log(`📄 CSV: ${entry.entryName}`);
      const before = allWords.size;
      extractFromCsvText(entry.getData().toString('utf8'), allWords);
      console.log(`   → +${allWords.size - before} (total ${allWords.size})`);
      processed++;
    } else if (/\.txt$/i.test(name)) {
      console.log(`📄 TXT: ${entry.entryName}`);
      const before = allWords.size;
      extractFromPlainText(entry.getData().toString('utf8'), allWords);
      console.log(`   → +${allWords.size - before} (total ${allWords.size})`);
      processed++;
    } else if (/\.json$/i.test(name)) {
      console.log(`📄 JSON: ${entry.entryName}`);
      try {
        const json = JSON.parse(entry.getData().toString('utf8'));
        const before = allWords.size;
        const walk = n => {
          if (typeof n === 'string') addWordTo(allWords, n);
          else if (Array.isArray(n)) n.forEach(walk);
          else if (n && typeof n === 'object') Object.values(n).forEach(walk);
        };
        walk(json);
        console.log(`   → +${allWords.size - before} (total ${allWords.size})`);
        processed++;
      } catch {
        console.warn('   ⚠️ not valid JSON');
      }
    }
  });

  if (!processed) {
    console.error('❌ No CSV/TXT/JSON found.');
    process.exit(1);
  }

  const sorted = [...allWords].sort((a, b) => a.localeCompare(b, 'rw'));

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(sorted, null, 2), 'utf8');

  console.log('');
  console.log(`✅ Wrote ${sorted.length} unique Kinyarwanda words to ${OUTPUT}`);
  console.log(`   First 20: ${sorted.slice(0, 20).join(', ')}`);
}

main();