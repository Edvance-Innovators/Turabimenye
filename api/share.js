// api/share.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function slugify(text) {
    return String(text || 'flyer')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

export default async function handler(req, res) {
    try {
        // Path is /f/<slug>-<shortId> or /f/<shortId>
        const pathParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
        const last = decodeURIComponent(pathParts[pathParts.length - 1] || '');
        const shortId = (last.match(/([a-f0-9]{6,})$/i) || [])[1] || last;

        if (!shortId) {
            return res.status(400).send('Invalid link');
        }

        // Find the flyer by matching the first chars of its id
        const { data, error } = await supabase
            .from('flyers')
            .select('*')
            .ilike('id', `${shortId}%`)
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(404).send(`
                <!DOCTYPE html>
                <html><head>
                    <meta charset="utf-8">
                    <title>Flyer ntibonetse — TURABIMENYE!</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>body{font-family:system-ui;padding:40px;text-align:center;background:#1a1233;color:#fff}
                    a{color:#ffd966;font-weight:700}</style>
                </head><body>
                    <h1>😕 Iyi flyer ntibonetse</h1>
                    <p>Yasibwe cyangwa ntiyigeze ibaho.</p>
                    <a href="/">← Subira ku ipaji nyamukuru</a>
                </body></html>
            `);
        }

        const title = data.title || 'Flyer — TURABIMENYE!';
        const description = (data.preview_description || data.full_description || '').slice(0, 160);
        const flyerPageUrl = `https://turabimenye.vercel.app/flyer.html?id=${data.id}`;
        const slug = slugify(data.title);
        const canonicalUrl = `https://turabimenye.vercel.app/f/${slug}-${String(data.id).slice(0, 8)}`;

        // Choose preview image: prefer public http(s) urls.
        let previewImage = '';
        if (typeof data.image === 'string' && /^https?:\/\//i.test(data.image)) {
            previewImage = data.image;
        } else {
            previewImage = 'https://turabimenye.vercel.app/logo.png';
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

        return res.status(200).send(`<!DOCTYPE html>
<html lang="rw">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} — TURABIMENYE!</title>

    <!-- Open Graph (WhatsApp, Facebook, LinkedIn, iMessage) -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(previewImage)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:site_name" content="TURABIMENYE!">

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(previewImage)}">

    <!-- Instantly redirect humans to the full viewer -->
    <meta http-equiv="refresh" content="0; url=${escapeHtml(flyerPageUrl)}">
    <link rel="canonical" href="${escapeHtml(flyerPageUrl)}">
</head>
<body style="font-family:system-ui;padding:40px;text-align:center;background:#1a1233;color:#fff">
    <p>Bazana kuri iyi nkuru…</p>
    <p><a href="${escapeHtml(flyerPageUrl)}" style="color:#ffd966;font-weight:700">Kanda hano niba utajyanywe.</a></p>
    <script>window.location.replace(${JSON.stringify(flyerPageUrl)});</script>
</body>
</html>`);
    } catch (err) {
        console.error('[share]', err);
        return res.status(500).send('Server error');
    }
}
