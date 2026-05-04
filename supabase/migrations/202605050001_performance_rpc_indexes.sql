create extension if not exists pg_trgm;

create index if not exists items_user_favorite_updated_idx
  on public.items (user_id, is_favorite, updated_at desc);

create index if not exists items_title_trgm_idx
  on public.items using gin (title gin_trgm_ops);

create or replace function public.toggle_favorite(p_item_id uuid, p_user_id uuid)
returns setof public.items
language sql
security definer
as $$
  update public.items
  set is_favorite = not is_favorite
  where id = p_item_id and user_id = p_user_id
  returning *;
$$;

create or replace function public.get_latest_copied_at(p_item_ids uuid[])
returns table(item_id uuid, latest_copied_at timestamptz)
language sql
stable
security definer
as $$
  select item_id, max(created_at) as latest_copied_at
  from public.usage_logs
  where item_id = any(p_item_ids)
  group by item_id;
$$;

create or replace function public.increment_usage_count(p_item_id uuid, p_user_id uuid, p_action text)
returns setof public.items
language sql
security definer
as $$
  with log_insert as (
    insert into public.usage_logs (item_id, action)
    values (p_item_id, p_action)
  )
  update public.items
  set usage_count = coalesce(usage_count, 0) + 1
  where id = p_item_id and user_id = p_user_id
  returning *;
$$;

grant execute on function public.toggle_favorite(uuid, uuid) to authenticated;
grant execute on function public.get_latest_copied_at(uuid[]) to authenticated;
grant execute on function public.increment_usage_count(uuid, uuid, text) to authenticated;
