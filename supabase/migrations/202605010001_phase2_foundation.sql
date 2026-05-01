create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('prompt', 'skill')),
  title text not null default '',
  summary text not null default '',
  content text not null,
  category text not null default 'Other'
    check (
      category in (
        'Writing',
        'Coding',
        'Research',
        'Design',
        'Study',
        'Agent',
        'Content',
        'Other'
      )
    ),
  tags text[] not null default '{}'::text[],
  source_url text,
  is_favorite boolean not null default false,
  is_analyzed boolean not null default false,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index items_user_updated_at_idx on public.items (user_id, updated_at desc);
create index items_user_type_idx on public.items (user_id, type);
create index items_user_category_idx on public.items (user_id, category);
create index items_tags_idx on public.items using gin (tags);

create trigger set_items_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

create table public.prompt_variables (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  name text not null,
  description text not null default '',
  default_value text not null default '',
  required boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (item_id, name)
);

create index prompt_variables_item_order_idx
  on public.prompt_variables (item_id, sort_order asc);

create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  action text not null check (action in ('copy_raw', 'copy_final')),
  created_at timestamptz not null default timezone('utc', now())
);

create index usage_logs_item_created_at_idx
  on public.usage_logs (item_id, created_at desc);

grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update, delete on public.prompt_variables to authenticated;
grant select, insert on public.usage_logs to authenticated;

alter table public.items enable row level security;
alter table public.prompt_variables enable row level security;
alter table public.usage_logs enable row level security;

create policy "items_select_own"
on public.items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "items_insert_own"
on public.items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "items_update_own"
on public.items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "items_delete_own"
on public.items
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "prompt_variables_select_own"
on public.prompt_variables
for select
to authenticated
using (
  exists (
    select 1
    from public.items
    where items.id = prompt_variables.item_id
      and items.user_id = (select auth.uid())
  )
);

create policy "prompt_variables_insert_own"
on public.prompt_variables
for insert
to authenticated
with check (
  exists (
    select 1
    from public.items
    where items.id = prompt_variables.item_id
      and items.user_id = (select auth.uid())
  )
);

create policy "prompt_variables_update_own"
on public.prompt_variables
for update
to authenticated
using (
  exists (
    select 1
    from public.items
    where items.id = prompt_variables.item_id
      and items.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.items
    where items.id = prompt_variables.item_id
      and items.user_id = (select auth.uid())
  )
);

create policy "prompt_variables_delete_own"
on public.prompt_variables
for delete
to authenticated
using (
  exists (
    select 1
    from public.items
    where items.id = prompt_variables.item_id
      and items.user_id = (select auth.uid())
  )
);

create policy "usage_logs_select_own"
on public.usage_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.items
    where items.id = usage_logs.item_id
      and items.user_id = (select auth.uid())
  )
);

create policy "usage_logs_insert_own"
on public.usage_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.items
    where items.id = usage_logs.item_id
      and items.user_id = (select auth.uid())
  )
);
