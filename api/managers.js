import { createClient } from '@supabase/supabase-js';

// With SUPABASE_SERVICE_ROLE_KEY set in Vercel, the managers table can stay closed to the
// public anon role. Without it we fall back to the anon key, which then needs read access.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Columns that may ever reach the browser — the password stays on the server.
const PUBLIC_COLS = 'id,email,name,role,is_active,last_active,created_at';

function normEmail(email) {
    return String(email || '').toLowerCase().trim();
}

function toPublic(row) {
    if (!row) return null;
    const { password, ...safe } = row;
    return safe;
}

// Lets us tell "no manager accounts at all" apart from "wrong password".
// An empty table and an RLS-blocked SELECT look identical here, hence the hint.
async function countManagers() {
    const { count, error } = await supabase
        .from('managers')
        .select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return count || 0;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // ---------- LOGIN VERIFICATION (password compared here, never returned) ----------
        if (req.method === 'POST' && req.body && req.body.action === 'verify') {
            const email = normEmail(req.body.email);
            const password = String(req.body.password ?? '');

            if (!email || !password) {
                return res.status(400).json({ error: 'email_and_password_required' });
            }

            if (!await countManagers()) {
                return res.status(503).json({
                    error: 'no_managers_in_database',
                    hint: 'The managers table is empty, or an RLS policy blocks the anon role from reading it'
                });
            }

            const { data, error } = await supabase
                .from('managers')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) return res.status(500).json({ error: error.message });
            if (!data) return res.status(404).json({ error: 'email_not_registered' });
            if (data.is_active === false) return res.status(403).json({ inactive: true });
            if (data.password !== password) return res.status(401).json({ error: 'wrong_password' });

            return res.status(200).json({ ok: true, manager: toPublic(data) });
        }

        // ---------- CHANGE PASSWORD (the old password must be correct) ----------
        if (req.method === 'POST' && req.body && req.body.action === 'change_password') {
            const email = normEmail(req.body.email);
            const currentPassword = String(req.body.current_password ?? '');
            const newPassword = String(req.body.new_password ?? '');

            if (!email || !currentPassword || !newPassword) {
                return res.status(400).json({ error: 'email_and_passwords_required' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'password_too_short' });
            }

            const { data, error } = await supabase
                .from('managers')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) return res.status(500).json({ error: error.message });
            if (!data) return res.status(404).json({ error: 'no_manager_account' });
            if (data.password !== currentPassword) return res.status(401).json({ error: 'wrong_password' });

            const { data: rotated, error: updError } = await supabase
                .from('managers')
                .update({ password: newPassword })
                .eq('id', data.id)
                .select(PUBLIC_COLS)
                .single();

            if (updError) return res.status(500).json({ error: updError.message });
            return res.status(200).json({ ok: true, manager: rotated });
        }

        // ---------- LIST ----------
        if (req.method === 'GET') {
            const { email } = req.query;
            let query = supabase
                .from('managers')
                .select(PUBLIC_COLS)
                .order('created_at', { ascending: true });

            if (email) query = query.eq('email', normEmail(email));

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(data || []);
        }

        // ---------- ADD / UPSERT ----------
        if (req.method === 'POST') {
            const body = { ...req.body };
            delete body.action;
            if (!body.email) return res.status(400).json({ error: 'email required' });
            body.email = normEmail(body.email);
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
                .select(PUBLIC_COLS)
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
            // A password may only be rotated through change_password, which proves the old one
            if (updates.password !== undefined) {
                return res.status(400).json({ error: 'password_change_requires_change_password_action' });
            }
            if (updates.email) updates.email = normEmail(updates.email);

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
                .select(PUBLIC_COLS)
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
