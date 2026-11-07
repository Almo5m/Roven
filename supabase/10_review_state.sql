-- Run after 09_visits.sql. The review page can now tell apart: invalid link / order not shipped yet / cancelled / already reviewed.
create or replace function get_review_request(p_token text) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'name', split_part(o.customer->>'name',' ',1),
    'state', case when o.status = 'cancelled' then 'cancelled'
                  when exists(select 1 from testimonials t where t.order_id = o.id) then 'done'
                  when o.status in ('shipped','delivered') then 'ready'
                  else 'not_shipped' end)
  from orders o where o.review_token = p_token limit 1 $$;
