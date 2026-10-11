import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // ==================== GET ====================
        if (req.method === 'GET') {
            const { user_id, id, title, dedupe } = req.query;

            // --- Manual dedupe trigger: GET /api/flyers?dedupe=1 ---
            if (dedupe === '1') {
                const { data: all, error } = await supabase
                    .from('flyers')
                    .select('id, title, created_at')
                    .order('created_at', { ascending: true });

                if (error) return res.status(500).json({ error: error.message });

                const seen = new Map();
                const toDelete = [];

                for (const row of (all || [])) {
                    const key = String(row.title || '').trim().toLowerCase();
                    if (!key) continue;
                    if (seen.has(key)) toDelete.push(row.id);
                    else seen.set(key, row.id);
                }

                if (toDelete.length) {
                    const { error: delErr } = await supabase
                        .from('flyers')
                        .delete()
                        .in('id', toDelete);
                    if (delErr) return res.status(500).json({ error: delErr.message });
                }

                return res.status(200).json({
                    ok: true,
                    total: (all || []).length,
                    duplicatesRemoved: toDelete.length,
                    removedIds: toDelete
                });
            }

            // --- Normal read ---
            let query = supabase
                .from('flyers')
                .select('*')
                .order('created_at', { ascending: false });

            if (id) {
                const cleanId = String(id).trim();
                query = query.filter('id::text', 'ilike', `${cleanId}%`);
            } else if (user_id) {
                query = query.eq('user_id', user_id);
            } else if (title) {
                query = query.eq('title', title);
            }

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(data);
        }

        // ==================== POST ====================
        if (req.method === 'POST') {
            const { data, error } = await supabase
                .from('flyers')
                .insert([req.body])
                .select()
                .single();
            if (error) return res.status(500).json({ error: error.message });
            return res.status(201).json(data);
        }

        // ==================== PUT ====================
        if (req.method === 'PUT') {
            const body = req.body || {};
            const { id, ...updates } = body;

            if (!id) return res.status(400).json({ error: 'id required' });

            const cleanId = String(id).trim();

            let realId = cleanId;
            if (cleanId.length < 36) {
                const { data: found, error: findErr } = await supabase
                    .from('flyers')
                    .select('id')
                    .filter('id::text', 'ilike', `${cleanId}%`)
                    .limit(1)
                    .maybeSingle();

                if (findErr) return res.status(500).json({ error: findErr.message });
                if (!found) return res.status(404).json({ error: 'Flyer not found' });
                realId = found.id;
            }

            const { data, error } = await supabase
                .from('flyers')
                .update(updates)
                .eq('id', realId)
                .select()
                .maybeSingle();

            if (error) return res.status(500).json({ error: error.message });
            if (!data) return res.status(404).json({ error: 'Flyer not found' });
            return res.status(200).json(data);
        }

        // ==================== DELETE ====================
        if (req.method === 'DELETE') {
            const rawId = req.query.id;
            if (!rawId) return res.status(400).json({ error: 'id required' });

            const cleanId = String(rawId).trim();

            let realId = cleanId;
            if (cleanId.length < 36) {
                const { data: found, error: findErr } = await supabase
                    .from('flyers')
                    .select('id')
                    .filter('id::text', 'ilike', `${cleanId}%`)
                    .limit(1)
                    .maybeSingle();

                if (findErr) return res.status(500).json({ error: findErr.message });
                if (!found) return res.status(404).json({ error: 'Flyer not found' });
                realId = found.id;
            }

            const { error } = await supabase
                .from('flyers')
                .delete()
                .eq('id', realId);

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ ok: true });
        }

        // ==================== FALLBACK ====================
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[flyers] EXCEPTION:', err);
        return res.status(500).json({ error: err.message });
    }
}
