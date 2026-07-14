-- helpers -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select not is_suspended from public.profiles where id = auth.uid()), false) $$;

-- now that is_admin() exists, attach the unhide guard from 001
create trigger skills_guard_unhide
  before update on public.skills
  for each row execute function public.guard_skill_unhide();

-- privileged profile columns are admin-only (triggers bypass via setting)
create or replace function public.guard_profile_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.bypass_guard', true), 'off') = 'on' then
    return new;
  end if;
  if not public.is_admin() and (
       new.is_admin       is distinct from old.is_admin
    or new.is_verified    is distinct from old.is_verified
    or new.is_suspended   is distinct from old.is_suspended
    or new.warnings_count is distinct from old.warnings_count
    or new.rating_avg     is distinct from old.rating_avg
    or new.rating_count   is distinct from old.rating_count
    or new.phone_verified is distinct from old.phone_verified
  ) then
    raise exception 'Not allowed to change protected profile fields';
  end if;
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- public view: the ONLY way other users read a profile ------------------
create view public.public_profiles as
select id, full_name, avatar_url, bio,
       jsonb_strip_nulls(jsonb_build_object(
         'city', location->>'city',
         'lat', fuzzy_lat, 'lng', fuzzy_lng)) as location,
       fuzzy_lat, fuzzy_lng,
       is_verified, rating_avg, rating_count, total_exchanges, created_date
from public.profiles
where not is_suspended;
-- view runs as owner (postgres) → bypasses profiles RLS by design
grant select on public.public_profiles to anon, authenticated;

-- RLS -------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.skills                enable row level security;
alter table public.exchanges             enable row level security;
alter table public.messages              enable row level security;
alter table public.reviews               enable row level security;
alter table public.verification_requests enable row level security;
alter table public.reports               enable row level security;
alter table public.user_warnings         enable row level security;
alter table public.activity_logs         enable row level security;

-- profiles: own row or admin only (others use public_profiles view)
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using ((id = auth.uid() and public.is_active()) or public.is_admin());

-- skills
create policy skills_select_public on public.skills for select
  to anon, authenticated
  using (status = 'active' or user_id = auth.uid() or public.is_admin());
create policy skills_insert on public.skills for insert
  with check (user_id = auth.uid() and public.is_active());
create policy skills_update on public.skills for update
  using ((user_id = auth.uid() and public.is_active()) or public.is_admin());
create policy skills_delete on public.skills for delete
  using (user_id = auth.uid() or public.is_admin());

-- exchanges: participants + admin
create policy exchanges_select on public.exchanges for select
  using (requester_id = auth.uid() or provider_id = auth.uid() or public.is_admin());
create policy exchanges_insert on public.exchanges for insert
  with check (
    created_by = auth.uid()
    and (requester_id = auth.uid() or provider_id = auth.uid())
    and public.is_active()
    and exists (select 1 from public.skills s
                where s.id = skill_id
                  and s.status = 'active'
                  and s.user_id in (requester_id, provider_id)
                  and s.user_id <> auth.uid())
  );
create policy exchanges_update on public.exchanges for update
  using (((requester_id = auth.uid() or provider_id = auth.uid())
          and public.is_active()) or public.is_admin());

-- messages: participants of a live exchange
create policy messages_select on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());
create policy messages_insert on public.messages for insert
  with check (
    sender_id = auth.uid() and public.is_active()
    and exists (select 1 from public.exchanges e
                where e.id = exchange_id
                  and auth.uid() in (e.requester_id, e.provider_id)
                  and e.status in ('pending','accepted','in_progress')
                  and receiver_id in (e.requester_id, e.provider_id)
                  and receiver_id <> auth.uid())
  );
create policy messages_update_read on public.messages for update
  using (receiver_id = auth.uid());   -- guard trigger restricts to read-flag

-- reviews: readable by all, insert gated on completed participation
create policy reviews_select on public.reviews for select
  to anon, authenticated using (true);
create policy reviews_insert on public.reviews for insert
  with check (
    reviewer_id = auth.uid() and public.is_active()
    and exists (select 1 from public.exchanges e
                where e.id = exchange_id
                  and e.status = 'completed'
                  and auth.uid() in (e.requester_id, e.provider_id)
                  and reviewee_id in (e.requester_id, e.provider_id)
                  and reviewee_id <> auth.uid())
  );

-- verification_requests
create policy vr_select on public.verification_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy vr_insert on public.verification_requests for insert
  with check (user_id = auth.uid() and public.is_active());
create policy vr_update on public.verification_requests for update
  using (public.is_admin());

-- reports: write your own, admins manage
create policy reports_select on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_insert on public.reports for insert
  with check (reporter_id = auth.uid() and public.is_active());
create policy reports_update on public.reports for update
  using (public.is_admin());

-- user_warnings: user sees own, admin manages
create policy warnings_select on public.user_warnings for select
  using (user_id = auth.uid() or public.is_admin());
create policy warnings_insert on public.user_warnings for insert
  with check (public.is_admin());

-- activity_logs: any authenticated writes own actions, only admin reads
create policy logs_select on public.activity_logs for select
  using (public.is_admin());
create policy logs_insert on public.activity_logs for insert
  with check (actor_id = auth.uid());

-- storage: public avatars bucket, users write only their own folder ------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select
  to public using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars'
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = auth.uid()::text);
