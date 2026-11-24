import { supabase } from '@/lib/supabase';

// Legacy-style sort strings: '-created_date' → created_date DESC
function parseSort(sort) {
  if (!sort) return null;
  const descending = sort.startsWith('-');
  return { column: descending ? sort.slice(1) : sort, ascending: !descending };
}

function createEntity(table) {
  return {
    async filter(where = {}, sort, limit) {
      let q = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(where)) {
        if (value === undefined) continue;
        q = Array.isArray(value) ? q.in(key, value) : q.eq(key, value);
      }
      const s = parseSort(sort);
      if (s) q = q.order(s.column, { ascending: s.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    async list(sort, limit) {
      return this.filter({}, sort, limit);
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}

export const Skill = createEntity('skills');
export const Exchange = createEntity('exchanges');
export const Message = createEntity('messages');
export const Review = createEntity('reviews');
export const Report = createEntity('reports');
export const VerificationRequest = createEntity('verification_requests');
export const ActivityLog = createEntity('activity_logs');
export const UserWarning = createEntity('user_warnings');
export const Notification = createEntity('notifications');

// Reads about OTHER users go through the privacy-preserving view.
// Admin writes (verify/suspend) and admin lists hit profiles (RLS gates them).
const publicUsers = createEntity('public_profiles');
const rawProfiles = createEntity('profiles');

export const User = {
  filter: (where, sort, limit) => publicUsers.filter(where, sort, limit),
  list: (sort, limit) => rawProfiles.list(sort, limit), // Admin.jsx only; RLS enforces
  update: (id, payload) => rawProfiles.update(id, payload),
};
