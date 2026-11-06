-- Run after 08_reviews_flex.sql. Own visit statistics, shown in the dashboard (no third-party tracker).
-- Stores only: page, language, device type, country, referring site, and a random per-tab session code. No IP address, no name.
create table page_views(
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null, lang text not null, ref text, device text not null, country text, sid text not null);
create index page_views_created on page_views(created_at);
alter table page_views enable row level security;
create policy "admin reads page views" on page_views for select using (is_admin());
-- no insert policy: visits are written only through track_view(), which validates every field.

create function track_view(p_path text, p_lang text, p_ref text, p_device text, p_country text, p_sid text) returns void
language plpgsql security definer set search_path=public as $$
begin
  if p_path !~ '^/[A-Za-z0-9/_-]{0,150}$' or p_path ~ '^/(admin|review)(/|$)' then return; end if;
  if p_lang not in ('en','ar') or p_device not in ('mobile','tablet','desktop') then return; end if;
  if p_sid !~ '^[A-Za-z0-9]{8,40}$' then return; end if;
  if coalesce(p_ref,'') <> '' and p_ref !~ '^[a-zA-Z0-9.-]{1,100}$' then p_ref := null; end if;
  if coalesce(p_country,'') <> '' and p_country !~ '^[A-Z]{2}$' then p_country := null; end if;
  if (select count(*) from page_views where created_at > now() - interval '1 minute') > 300 then return; end if; -- flood guard
  insert into page_views(path,lang,ref,device,country,sid) values (p_path,p_lang,nullif(p_ref,''),p_device,nullif(p_country,''),p_sid);
end $$;
grant execute on function track_view(text,text,text,text,text,text) to anon, authenticated;

create function visit_stats(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare d int := least(greatest(coalesce(p_days,30),1),90);
  today date := (now() at time zone 'Africa/Cairo')::date;
  start_day date := today - (d-1);
  since timestamptz := start_day::timestamp at time zone 'Africa/Cairo';
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'views', (select count(*) from page_views where created_at >= since),
    'sessions', (select count(distinct sid) from page_views where created_at >= since),
    'today_views', (select count(*) from page_views where (created_at at time zone 'Africa/Cairo')::date = today),
    'today_sessions', (select count(distinct sid) from page_views where (created_at at time zone 'Africa/Cairo')::date = today),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('d', to_char(g.day,'YYYY-MM-DD'), 'views', coalesce(v.views,0), 'sessions', coalesce(v.sessions,0)) order by g.day),'[]'::jsonb)
      from generate_series(start_day, today, interval '1 day') as g(day)
      left join (select (created_at at time zone 'Africa/Cairo')::date as dd, count(*) as views, count(distinct sid) as sessions
                 from page_views where created_at >= since group by 1) v on v.dd = g.day::date),
    'pages', (select coalesce(jsonb_agg(jsonb_build_object('k',k,'n',n) order by n desc),'[]'::jsonb) from (select path as k, count(*) as n from page_views where created_at >= since group by 1 order by 2 desc limit 10) t),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('k',k,'n',n) order by n desc),'[]'::jsonb) from (select coalesce(ref,'direct') as k, count(*) as n from page_views where created_at >= since group by 1 order by 2 desc limit 8) t),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('k',k,'n',n) order by n desc),'[]'::jsonb) from (select coalesce(country,'??') as k, count(*) as n from page_views where created_at >= since group by 1 order by 2 desc limit 8) t),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('k',k,'n',n) order by n desc),'[]'::jsonb) from (select device as k, count(*) as n from page_views where created_at >= since group by 1) t),
    'langs', (select coalesce(jsonb_agg(jsonb_build_object('k',k,'n',n) order by n desc),'[]'::jsonb) from (select lang as k, count(*) as n from page_views where created_at >= since group by 1) t));
end $$;
revoke all on function visit_stats(int) from public;
grant execute on function visit_stats(int) to authenticated;

-- Optional cleanup of very old rows (run now and then, or schedule it with pg_cron):
-- delete from page_views where created_at < now() - interval '400 days';
