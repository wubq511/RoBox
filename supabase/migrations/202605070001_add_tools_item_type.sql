alter table public.items
  drop constraint if exists items_type_check;

alter table public.items
  add constraint items_type_check
  check (type in ('prompt', 'skill', 'tool'));

alter table public.user_categories
  drop constraint if exists user_categories_type_check;

alter table public.user_categories
  add constraint user_categories_type_check
  check (type in ('prompt', 'skill', 'tool'));

insert into public.user_categories (user_id, type, name, sort_order)
select
  users.user_id,
  'tool',
  categories.name,
  categories.sort_order
from (
  select distinct user_id
  from public.user_categories
) as users
cross join (
  values
    ('Writing', 0),
    ('Coding', 1),
    ('Research', 2),
    ('Design', 3),
    ('Study', 4),
    ('Agent', 5),
    ('Content', 6),
    ('Other', 7)
) as categories (name, sort_order)
on conflict (user_id, type, name) do nothing;
