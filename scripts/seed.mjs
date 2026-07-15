// Local-only seeding. Run:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local use only).');
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false } });

const DEMO = [
  { name: 'Sarah Thompson', city: 'Queens, NY',   lat: 40.7282, lng: -73.7949,
    skills: [{ title: 'Dog Walking & Pet Sitting', category: 'pet care', type: 'offering',
               description: 'Animal lover offering dog walking and pet sitting. Experience with all breeds and sizes.',
               availability: 'Daily, flexible hours' }] },
  { name: 'Mike Johnson', city: 'Brooklyn, NY',   lat: 40.6782, lng: -73.9442,
    skills: [{ title: 'Home Electrical Repairs', category: 'home repairs', type: 'offering',
               description: 'Basic electrical repairs: outlet replacement, light fixtures, switches.',
               availability: 'Weekends' }] },
  { name: 'Maria Garcia', city: 'Astoria, NY',    lat: 40.7644, lng: -73.9235,
    skills: [{ title: 'Spanish Language Tutoring', category: 'languages', type: 'offering',
               description: 'Native speaker offering conversational practice and grammar lessons.',
               availability: 'Weekday evenings' }] },
  { name: 'Antoine Dubois', city: 'Queens, NY',   lat: 40.7128, lng: -73.7900,
    skills: [{ title: 'Professional Chef — Cooking Classes', category: 'cooking', type: 'offering',
               description: 'Retired chef offering lessons in your kitchen or mine. Italian and French cuisine.',
               availability: 'Weekends' }] },
  { name: 'Carol Williams', city: 'Brooklyn, NY', lat: 40.6850, lng: -73.9500,
    skills: [{ title: 'Need Help Setting Up Smart Home', category: 'technology', type: 'requesting',
               description: 'Looking for someone tech-savvy to set up smart home devices.',
               availability: 'Weekday afternoons' }] },
  { name: 'Priya Patel', city: 'Astoria, NY',     lat: 40.7700, lng: -73.9200,
    skills: [
      { title: 'Vegetable Garden Planning', category: 'gardening', type: 'offering',
        description: 'Help planning and planting a small vegetable garden this season.',
        availability: 'Weekends' },
      { title: 'Math Tutoring for High Schoolers', category: 'teaching', type: 'offering',
        description: 'Algebra through calculus. Patient, exam-focused tutoring.',
        availability: 'Weekday evenings' },
      { title: 'Looking for Bike Repair Help', category: 'home repairs', type: 'requesting',
        description: 'My commuter bike needs a tune-up — happy to trade tutoring.',
        availability: 'Flexible' },
    ] },
];

for (const person of DEMO) {
  const email = `${person.name.toLowerCase().replace(/[^a-z]+/g, '.')}@demo.neighbourly.local`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email, password: crypto.randomUUID(), email_confirm: true,
    user_metadata: { full_name: person.name },
  });
  if (error) { console.error(email, error.message); continue; }
  const uid = created.user.id;
  const { error: profileError } = await admin.from('profiles').update({
    bio: `Hi, I'm ${person.name.split(' ')[0]} — happy to swap skills with neighbors!`,
    location: { city: person.city, lat: person.lat, lng: person.lng },
    is_demo: true,
  }).eq('id', uid);
  if (profileError) console.error(person.name, profileError.message);
  for (const skill of person.skills) {
    const { error: skillError } = await admin.from('skills')
      .insert({ ...skill, user_id: uid, is_demo: true });
    if (skillError) console.error(skill.title, skillError.message);
  }
  console.log(`seeded ${person.name}`);
}
console.log('Done. Remove all demo data later with:');
console.log("  delete from auth.users where id in (select id from profiles where is_demo);");
