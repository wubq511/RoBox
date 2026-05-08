create or replace function public.get_dashboard_snapshot(p_user_id uuid)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  with user_items as materialized (
    select *
    from public.items
    where user_id = p_user_id
  ),
  item_counts as (
    select
      count(*)::integer as total,
      count(*) filter (where type = 'prompt')::integer as prompts,
      count(*) filter (where type = 'skill')::integer as skills,
      count(*) filter (where type = 'tool')::integer as tools,
      count(*) filter (where is_analyzed = false)::integer as pending
    from user_items
  ),
  favorite_items as (
    select *
    from user_items
    where is_favorite = true
    order by updated_at desc
    limit 8
  ),
  recent_candidates as (
    select *
    from user_items
    order by updated_at desc
    limit 20
  ),
  latest_copies as (
    select
      usage_logs.item_id,
      max(usage_logs.created_at) as latest_copied_at
    from public.usage_logs
    inner join recent_candidates on recent_candidates.id = usage_logs.item_id
    group by usage_logs.item_id
  ),
  recent_items as (
    select
      recent_candidates.*,
      coalesce(latest_copies.latest_copied_at, recent_candidates.updated_at) as latest_activity_at
    from recent_candidates
    left join latest_copies on latest_copies.item_id = recent_candidates.id
    order by latest_activity_at desc
    limit 4
  ),
  pending_items as (
    select *
    from recent_candidates
    where is_analyzed = false
    order by updated_at desc
    limit 4
  )
  select jsonb_build_object(
    'counts', (
      select jsonb_build_object(
        'total', total,
        'prompts', prompts,
        'skills', skills,
        'tools', tools,
        'pending', pending
      )
      from item_counts
    ),
    'favorites', (
      select coalesce(
        jsonb_agg(to_jsonb(favorite_items) order by updated_at desc),
        '[]'::jsonb
      )
      from favorite_items
    ),
    'pending', (
      select coalesce(
        jsonb_agg(to_jsonb(pending_items) order by updated_at desc),
        '[]'::jsonb
      )
      from pending_items
    ),
    'recent', (
      select coalesce(
        jsonb_agg((to_jsonb(recent_items) - 'latest_activity_at') order by latest_activity_at desc),
        '[]'::jsonb
      )
      from recent_items
    )
  );
$$;

revoke execute on function public.get_dashboard_snapshot(uuid) from public;
revoke execute on function public.get_dashboard_snapshot(uuid) from anon;
grant execute on function public.get_dashboard_snapshot(uuid) to authenticated;
