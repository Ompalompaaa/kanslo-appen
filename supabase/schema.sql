-- Run this in the Supabase SQL editor (Database > SQL Editor) for your project.

create table if not exists daily_feelings (
  name text primary key,
  color text not null,
  feeling text not null,
  date text not null,
  updated_at timestamptz not null default now()
);

alter table daily_feelings enable row level security;

-- This is a private 2-person hobby app with no login system, so access is
-- gated only by knowing the Supabase URL + anon key, not by user identity.
create policy "Anyone can read daily feelings"
  on daily_feelings for select
  using (true);

create policy "Anyone can insert daily feelings"
  on daily_feelings for insert
  with check (true);

create policy "Anyone can update daily feelings"
  on daily_feelings for update
  using (true);

-- Enable realtime updates for this table (or toggle it on in
-- Database > Replication in the Supabase dashboard).
alter publication supabase_realtime add table daily_feelings;
