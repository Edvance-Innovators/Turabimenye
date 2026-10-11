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

                const seen = new Map();   // normalized title -> oldest id
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
                // Prefix match works for both full UUIDs and slug fragments.
                // Cast id to text first so it works whether the column is uuid or text.
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
            console.log('[flyers PUT] raw body:', JSON.stringify(req.body));
            const { id, ...updates } = req.body || {};
            console.log('[flyers PUT] extracted id:', id, '| len:', String(id).length, '| type:', typeof id);
            console.log('[flyers PUT] keys being updated:', Object.keys(updates));
        
            // ... rest of the PUT handler
    
            const { id, ...updates } = req.body || {};
            if (!id) return res.status(400).json({ error: 'id required' });

            const { data, error } = await supabase
                .from('flyers')
                .update(updates)
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) return res.status(500).json({ error: error.message });
            if (!data) return res.status(404).json({ error: 'Flyer not found' });
            return res.status(200).json(data);
        }

        // ==================== DELETE ====================
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'id required' });

            const { error } = await supabase
                .from('flyers')
                .delete()
                .eq('id', id);

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
