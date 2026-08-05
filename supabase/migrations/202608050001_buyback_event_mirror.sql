-- Optional read mirror for confirmed BuybackExecuted events.
-- The Robinhood Chain vault and its logs remain the source of truth.

create table if not exists public.buyback_events (
  chain_id bigint not null check (chain_id > 0),
  vault_address text not null check (vault_address ~ '^0x[0-9a-f]{40}$'),
  execution_id numeric(78, 0) not null check (execution_id >= 1),
  transaction_hash text not null check (transaction_hash ~ '^0x[0-9a-f]{64}$'),
  log_index integer not null check (log_index >= 0),
  block_number numeric(78, 0) not null check (block_number >= 0),
  input_asset text not null check (input_asset ~ '^0x[0-9a-f]{40}$'),
  amount_in_raw numeric(78, 0) not null check (amount_in_raw >= 0),
  zazu_received_raw numeric(78, 0) not null check (zazu_received_raw >= 0),
  destination text not null check (destination ~ '^0x[0-9a-f]{40}$'),
  event_timestamp bigint not null check (event_timestamp > 0),
  executed_at timestamptz not null,
  indexed_at timestamptz not null default now(),
  primary key (chain_id, vault_address, execution_id),
  unique (chain_id, transaction_hash, log_index)
);

create index if not exists buyback_events_history_idx
  on public.buyback_events (chain_id, vault_address, execution_id desc);

create index if not exists buyback_events_block_idx
  on public.buyback_events (chain_id, vault_address, block_number desc, log_index desc);

create index if not exists buyback_events_time_idx
  on public.buyback_events (chain_id, vault_address, executed_at desc);

create table if not exists public.buyback_sync_state (
  chain_id bigint not null check (chain_id > 0),
  vault_address text not null check (vault_address ~ '^0x[0-9a-f]{40}$'),
  last_confirmed_block numeric(78, 0) not null check (last_confirmed_block >= 0),
  last_confirmed_block_hash text
    check (
      last_confirmed_block_hash is null
      or last_confirmed_block_hash ~ '^0x[0-9a-f]{64}$'
    ),
  updated_at timestamptz not null default now(),
  primary key (chain_id, vault_address)
);

alter table public.buyback_events enable row level security;
alter table public.buyback_sync_state enable row level security;

revoke all on table public.buyback_events from anon, authenticated;
revoke all on table public.buyback_sync_state from anon, authenticated;
revoke all on table public.buyback_events from service_role;
revoke all on table public.buyback_sync_state from service_role;
grant select on table public.buyback_events to anon, authenticated;
grant select on table public.buyback_sync_state to anon, authenticated;
grant select, insert, update, delete on table public.buyback_events to service_role;
grant select, insert, update, delete on table public.buyback_sync_state to service_role;

drop policy if exists buyback_events_public_read on public.buyback_events;
create policy buyback_events_public_read
  on public.buyback_events
  for select
  to anon, authenticated
  using (true);

drop policy if exists buyback_sync_state_public_read on public.buyback_sync_state;
create policy buyback_sync_state_public_read
  on public.buyback_sync_state
  for select
  to anon, authenticated
  using (true);

create or replace function public.upsert_buyback_event(
  p_chain_id bigint,
  p_vault_address text,
  p_execution_id numeric,
  p_transaction_hash text,
  p_log_index integer,
  p_block_number numeric,
  p_input_asset text,
  p_amount_in_raw numeric,
  p_zazu_received_raw numeric,
  p_destination text,
  p_event_timestamp bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  insert into public.buyback_events (
    chain_id,
    vault_address,
    execution_id,
    transaction_hash,
    log_index,
    block_number,
    input_asset,
    amount_in_raw,
    zazu_received_raw,
    destination,
    event_timestamp,
    executed_at
  )
  values (
    p_chain_id,
    lower(p_vault_address),
    p_execution_id,
    lower(p_transaction_hash),
    p_log_index,
    p_block_number,
    lower(p_input_asset),
    p_amount_in_raw,
    p_zazu_received_raw,
    lower(p_destination),
    p_event_timestamp,
    to_timestamp(p_event_timestamp::double precision)
  )
  on conflict (chain_id, vault_address, execution_id)
  do update
    set indexed_at = now()
  where public.buyback_events.transaction_hash = excluded.transaction_hash
    and public.buyback_events.log_index = excluded.log_index
    and public.buyback_events.block_number = excluded.block_number
    and public.buyback_events.input_asset = excluded.input_asset
    and public.buyback_events.amount_in_raw = excluded.amount_in_raw
    and public.buyback_events.zazu_received_raw = excluded.zazu_received_raw
    and public.buyback_events.destination = excluded.destination
    and public.buyback_events.event_timestamp = excluded.event_timestamp;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

revoke all on function public.upsert_buyback_event(
  bigint,
  text,
  numeric,
  text,
  integer,
  numeric,
  text,
  numeric,
  numeric,
  text,
  bigint
) from public, anon, authenticated;

grant execute on function public.upsert_buyback_event(
  bigint,
  text,
  numeric,
  text,
  integer,
  numeric,
  text,
  numeric,
  numeric,
  text,
  bigint
) to service_role;
