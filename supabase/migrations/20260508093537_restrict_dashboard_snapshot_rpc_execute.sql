revoke execute on function public.get_dashboard_snapshot(uuid) from public;
revoke execute on function public.get_dashboard_snapshot(uuid) from anon;
grant execute on function public.get_dashboard_snapshot(uuid) to authenticated;
