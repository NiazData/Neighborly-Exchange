import { supabase } from '@/lib/supabase';

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }
  return user;
}

export const auth = {
  async me() {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;
    return data;
  },

  async updateMe(payload) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('profiles').update(payload).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  redirectToLogin(fromPath) {
    const from = encodeURIComponent(fromPath || window.location.pathname);
    window.location.assign(`/login?from=${from}`);
  },
};
