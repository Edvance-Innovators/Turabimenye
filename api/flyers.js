import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', ', POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
         if (req.method === 'GET') {
    const { user_id, id, dedupe } = req.query;

    // --- Manual dedupe trigger: GET /api/flyers?dedupe=1 ---
    if (dedupe === '1') {
        try {
            const { data: all, error } = await supabase
                .from('flyers')
                .select('id, title, created_at')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const seen = new Map();   // normalized title -> first (oldest) id
            const toDelete = [];

            for (const row of (all || [])) {
                const key = String(row.title || '').trim().toLowerCase();
                if (!key) continue;
                if (seen.has(key)) {
                    toDelete.push(row.id);
                } else {
                    seen.set(key, row.id);
                }
            }

            if (toDelete.length) {
                const { error: delErr } = await supabase
                    .from('flyers')
                    .delete()
                    .in('id', toDelete);
                if (delErr) throw delErr;
            }

            return res.status(200).json({
                ok: true,
                total: (all || []).length,
                duplicatesRemoved: toDelete.length,
                removedIds: toDelete
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // --- Normal read ---
    let query = supabase.from('flyers').select('*').order('created_at', { ascending: false });
    if (id && String(id).length < 36) {
        query = query.ilike('id', `${id}%`);
    } else if (id) {
        query = query.eq('id', id);
    } else if (user_id) {
        query = query.eq('user_id', user_id);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
}

        if (req.method === 'POST') {
            const { data, error } = await supabase
                .from('flyers')
                .insert([req.body])
                .select()
                .single();
            if (error) throw error;
            return res.status(201).json(data);
        }

        if (req.method === 'PUT') {
            const { id, ...updates } = req.body;
            const { data, error } = await supabase
                .from('flyers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'id required' });
            const { error } = await supabase.from('flyers').delete().eq('id', id);
            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ ok: true });
}

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
