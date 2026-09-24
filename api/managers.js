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
        // ---------- LIST ----------
        if (req.method === 'GET') {
            const { email } = req.query;
            let query = supabase
                .from('managers')
                .select('*')
                .order('created_at', { ascending: true });

            if (email) query = query.eq('email', email.toLowerCase().trim());

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(data || []);
        }

        // ---------- ADD / UPSERT ----------
        if (req.method === 'POST') {
            const body = { ...req.body };
            if (!body.email) return res.status(400).json({ error: 'email required' });
            body.email = String(body.email).toLowerCase().trim();
            if (!body.password) return res.status(400).json({ error: 'password required' });
            if (!body.role) body.role = 'manager';

            // Reject if someone tries to create a second super_admin
            if (body.role === 'super_admin') {
                const { data: existingSuper } = await supabase
                    .from('managers')
                    .select('email')
                    .eq('role', 'super_admin')
                    .maybeSingle();
                if (existingSuper && existingSuper.email !== body.email) {
                    return res.status(409).json({ error: 'A super admin already exists' });
                }
            }

            const { data, error } = await supabase
                .from('managers')
                .insert([body])
                .select()
                .single();

            if (error) {
                // Unique violation → return 409 with friendly message
                if (error.code === '23505') {
                    return res.status(409).json({ error: 'This email is already a manager' });
                }
                return res.status(500).json({ error: error.message });
            }
            return res.status(201).json(data);
        }

        // ---------- UPDATE ----------
        if (req.method === 'PUT') {
            const { id, ...updates } = req.body || {};
            if (!id) return res.status(400).json({ error: 'id required' });
            if (updates.email) updates.email = String(updates.email).toLowerCase().trim();

            // Don't let anyone demote or deactivate the last super admin
            if (updates.role && updates.role !== 'super_admin') {
                const { data: current } = await supabase
                    .from('managers').select('role').eq('id', id).maybeSingle();
                if (current?.role === 'super_admin') {
                    return res.status(400).json({ error: 'Cannot demote the super admin' });
                }
            }
            if (updates.is_active === false) {
                const { data: current } = await supabase
                    .from('managers').select('role').eq('id', id).maybeSingle();
                if (current?.role === 'super_admin') {
                    return res.status(400).json({ error: 'Cannot deactivate the super admin' });
                }
            }

            const { data, error } = await supabase
                .from('managers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(data);
        }

        // ---------- DELETE ----------
        if (req.method === 'DELETE') {
            const { id, email } = req.query;
            if (!id && !email) return res.status(400).json({ error: 'id or email required' });

            // Look up target to make sure it's not the super admin
            let lookup = supabase.from('managers').select('role, email');
            if (id) lookup = lookup.eq('id', id);
            else lookup = lookup.eq('email', String(email).toLowerCase().trim());
            const { data: target } = await lookup.maybeSingle();

            if (!target) return res.status(404).json({ error: 'Manager not found' });
            if (target.role === 'super_admin') {
                return res.status(400).json({ error: 'Cannot delete the super admin' });
            }

            let del = supabase.from('managers').delete();
            if (id) del = del.eq('id', id);
            else del = del.eq('email', target.email);

            const { error } = await del;
            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[managers]', err);
        return res.status(500).json({ error: err.message });
    }
}
