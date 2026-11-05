create table if not exists app_state (
  id int primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table app_state enable row level security;
drop policy if exists "dono" on app_state;
create policy "dono" on app_state for all to authenticated
  using ((auth.jwt() ->> 'email') = 'pedro.morais@financas.app')
  with check ((auth.jwt() ->> 'email') = 'pedro.morais@financas.app');
