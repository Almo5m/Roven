-- Run after 07_catalog.sql. Verified reviews through a per-order link, plus structured FAQ, size chart and payment methods.
alter table orders add column review_token text unique not null default replace(gen_random_uuid()::text,'-','');

alter table testimonials add column status text not null default 'pending' check (status in ('pending','approved','hidden')),
  add column order_id uuid unique references orders(id) on delete set null, add column verified bool not null default false;
update testimonials set status = case when active then 'approved' else 'hidden' end;
drop policy "public reads active testimonials" on testimonials;
alter table testimonials drop column active;
create policy "public reads approved testimonials" on testimonials for select using (status='approved');

create function get_review_request(p_token text) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('name', split_part(o.customer->>'name',' ',1), 'done', exists(select 1 from testimonials t where t.order_id=o.id))
  from orders o where o.review_token=p_token and o.status in ('shipped','delivered') limit 1 $$;

create function submit_review(p_token text, p_rating int, p_text text, p_name text) returns boolean
language plpgsql security definer set search_path=public as $$
declare oid uuid;
begin
  if p_rating not between 1 and 5 or length(trim(p_text)) not between 1 and 400 or length(trim(p_name)) not between 1 and 40 then raise exception 'bad review'; end if;
  select id into oid from orders where review_token=p_token and status in ('shipped','delivered');
  if oid is null then return false; end if;
  insert into testimonials(name,rating,text,order_id,verified,status) values (trim(p_name),p_rating,trim(p_text),oid,true,'pending');
  return true;
exception when unique_violation then return false;
end $$;
grant execute on function get_review_request(text), submit_review(text,int,text,text) to anon, authenticated;

insert into settings values ('faq','[]'),('transfer_methods','[]') on conflict do nothing;
