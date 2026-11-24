-- In-app notifications for exchange requests and status changes.
-- Rows are only ever written by the trigger functions below (security
-- definer, not grantable to users) — regular users can read/mark-read
-- their own rows but can never insert or forge one for someone else.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('exchange_request', 'exchange_status')),
  title text not null,
  body text,
  exchange_id uuid references public.exchanges (id) on delete cascade,
  read boolean not null default false,
  created_date timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id) where not read;
create index notifications_user_created_idx on public.notifications (user_id, created_date desc);

alter table public.notifications enable row level security;

create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.notifications;

-- new exchange request -> notify whichever party didn't create it
create or replace function public.notify_new_exchange()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recipient uuid;
begin
  recipient := case when new.created_by = new.provider_id
                     then new.requester_id else new.provider_id end;
  if recipient is not null then
    insert into public.notifications (user_id, type, title, body, exchange_id)
    values (
      recipient,
      'exchange_request',
      'New exchange request',
      coalesce(new.requester_name, 'Someone')
        || ' wants to exchange for "' || coalesce(new.skill_title, 'your skill') || '"',
      new.id
    );
  end if;
  return new;
end $$;
create trigger exchanges_notify_insert
  after insert on public.exchanges
  for each row execute function public.notify_new_exchange();

-- status change -> notify whichever party didn't make the change
create or replace function public.notify_exchange_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recipient uuid;
  status_label text;
begin
  if new.status = old.status then
    return new;
  end if;
  recipient := case when auth.uid() = new.provider_id
                     then new.requester_id else new.provider_id end;
  status_label := case new.status
    when 'accepted'    then 'accepted'
    when 'declined'    then 'declined'
    when 'in_progress' then 'marked as in progress'
    when 'completed'   then 'marked as completed'
    when 'cancelled'   then 'cancelled'
    when 'disputed'    then 'disputed'
    else new.status
  end;
  if recipient is not null then
    insert into public.notifications (user_id, type, title, body, exchange_id)
    values (
      recipient,
      'exchange_status',
      'Exchange update',
      'Your exchange for "' || coalesce(new.skill_title, 'a skill') || '" was ' || status_label,
      new.id
    );
  end if;
  return new;
end $$;
create trigger exchanges_notify_status
  after update on public.exchanges
  for each row execute function public.notify_exchange_status_change();
