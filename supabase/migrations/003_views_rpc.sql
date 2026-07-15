-- Skill view counter RPC.
-- RLS on public.skills only lets owners UPDATE their own rows, so a visitor
-- incrementing `views` via a direct UPDATE would be rejected. This
-- security-definer function lets any visitor (anon or authenticated) bump
-- the view count on an active skill without granting broader update rights.
create or replace function public.increment_skill_views(skill uuid)
returns void language sql security definer set search_path = public as
$$ update public.skills set views = views + 1 where id = skill and status = 'active' $$;
grant execute on function public.increment_skill_views(uuid) to anon, authenticated;
