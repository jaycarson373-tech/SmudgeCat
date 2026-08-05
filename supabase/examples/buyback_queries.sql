-- Server-side, service-role-only idempotent upsert.
-- Bind $1 through $11 from the confirmed BuybackExecuted log.
-- The caller must halt and reconcile the chain if the function returns false.
prepare zazu_buyback_upsert (
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
) as
select public.upsert_buyback_event(
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11
);

-- Public newest-first page. Validate limit as 1 through 50 and offset as
-- non-negative in the calling server before binding.
prepare zazu_buyback_page (bigint, text, integer, integer) as
select
  execution_id,
  transaction_hash,
  block_number,
  input_asset,
  amount_in_raw,
  zazu_received_raw,
  destination,
  event_timestamp,
  executed_at
from public.buyback_events
where chain_id = $1
  and vault_address = lower($2)
order by execution_id desc
limit $3
offset $4;

-- Public totals derived from mirrored events. On-chain vault getters remain canonical.
prepare zazu_buyback_mirror_totals (bigint, text) as
select
  count(*) as execution_count,
  coalesce(sum(amount_in_raw), 0) as amount_in_raw,
  coalesce(sum(zazu_received_raw), 0) as zazu_received_raw,
  max(event_timestamp) as latest_event_timestamp
from public.buyback_events
where chain_id = $1
  and vault_address = lower($2);
