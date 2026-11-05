create table if not exists app_state (
  id int primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);
-- Sem políticas: só o servidor (service_role) acessa os dados.
alter table app_state enable row level security;
