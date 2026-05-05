create table public.user_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('prompt', 'skill')),
  name text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, type, name)
);

create index user_categories_user_type_idx
  on public.user_categories (user_id, type, sort_order asc);

alter table public.user_categories enable row level security;

create policy "user_categories_select_own"
on public.user_categories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_categories_insert_own"
on public.user_categories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_categories_update_own"
on public.user_categories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_categories_delete_own"
on public.user_categories
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_categories to authenticated;

alter table public.items drop constraint items_category_check;

insert into public.user_categories (user_id, type, name, sort_order)
select
  sub.user_id,
  sub.type,
  sub.cat,
  sub.row_num - 1
from (
  select
    u.user_id,
    t.type,
    c.cat,
    row_number() over (partition by u.user_id, t.type order by c.ord) as row_num
  from (select distinct user_id from public.items) as u (user_id)
  cross join (values ('prompt'), ('skill')) as t (type)
  cross join (
    values
      ('Writing', 1),
      ('Coding', 2),
      ('Research', 3),
      ('Design', 4),
      ('Study', 5),
      ('Agent', 6),
      ('Content', 7),
      ('Other', 8)
  ) as c (cat, ord)
) as sub;
