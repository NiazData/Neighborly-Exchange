import { supabase } from '@/lib/supabase';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export async function UploadFile({ file }) {
  if (!ALLOWED.includes(file.type)) throw new Error('Only JPEG, PNG, or WebP images are allowed');
  if (file.size > MAX_BYTES) throw new Error('Image must be under 5 MB');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { file_url: data.publicUrl };
}
