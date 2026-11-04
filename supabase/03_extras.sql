-- Run after 02_admin.sql. Settings, stock, coupons, shipping, order tracking.
create table settings(key text primary key, value jsonb not null);
alter table settings enable row level security;
create policy "public reads settings" on settings for select using (true);
create policy "admin writes settings" on settings for all using (is_admin()) with check (is_admin());
insert into settings values ('drop_date','"2026-12-01T18:00:00+02:00"'),('shipping_fee','60'),('free_shipping_over','0');

alter table products add column stock jsonb; -- e.g. {"S":10,"M":5}; null means stock is not tracked
create table coupons(code text primary key check(code=upper(code) and length(code) between 3 and 20),
  percent int not null check(percent between 1 and 90), active bool not null default true, max_uses int, uses int not null default 0);
alter table coupons enable row level security;
create policy "admin manages coupons" on coupons for all using (is_admin()) with check (is_admin());
alter table orders add column tracking text unique, add column subtotal int default 0, add column discount int default 0,
  add column shipping int default 0, add column coupon text;

create function quote_order(p_items jsonb, p_coupon text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare sub int:=0; it jsonb; pr products; pct int:=0; disc int; fee int; free_over int;
begin
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'bad items'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    select * into pr from products where id=it->>'product_id' and active;
    if not found or not (it->>'size' = any(pr.sizes)) then raise exception 'bad item'; end if;
    sub:=sub+pr.price;
  end loop;
  if coalesce(p_coupon,'')<>'' then
    select percent into pct from coupons where code=upper(trim(p_coupon)) and active and (max_uses is null or uses<max_uses);
    if not found then raise exception 'bad coupon'; end if;
  end if;
  disc:=sub*pct/100;
  select value::text::int into fee from settings where key='shipping_fee';
  select value::text::int into free_over from settings where key='free_shipping_over';
  if coalesce(free_over,0)>0 and sub-disc>=free_over then fee:=0; end if;
  return jsonb_build_object('subtotal',sub,'discount',disc,'shipping',coalesce(fee,0),'total',sub-disc+coalesce(fee,0));
end $$;

drop function create_order(jsonb,jsonb,text);
create function create_order(p_customer jsonb, p_items jsonb, p_method text, p_coupon text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare q jsonb; it jsonb; pr products; n int; cde text:=upper(trim(coalesce(p_coupon,''))); trk text;
begin
  if p_method not in ('cod','online') then raise exception 'bad method'; end if;
  if length(p_customer->>'name')<2 or (p_customer->>'phone') !~ '^\+?[0-9]{10,14}$' then raise exception 'bad customer'; end if;
  q:=quote_order(p_items, cde);
  for it in select * from jsonb_array_elements(p_items) loop
    select * into pr from products where id=it->>'product_id' for update;
    if pr.stock is not null then
      n:=coalesce((pr.stock->>(it->>'size'))::int,0);
      if n<1 then raise exception 'sold out'; end if;
      update products set stock=jsonb_set(stock,array[it->>'size'],to_jsonb(n-1)) where id=pr.id;
    end if;
  end loop;
  if cde<>'' then update coupons set uses=uses+1 where code=cde; end if;
  trk:='RV-'||upper(substr(md5(random()::text||clock_timestamp()::text),1,8));
  insert into orders(customer,items,total,subtotal,discount,shipping,coupon,method,status,tracking)
  values(p_customer,p_items,(q->>'total')::int,(q->>'subtotal')::int,(q->>'discount')::int,(q->>'shipping')::int,nullif(cde,''),
    p_method,case when p_method='online' then 'awaiting_payment' else 'new' end,trk);
  return q||jsonb_build_object('tracking',trk);
end $$;

create function track_order(p_code text, p_phone text) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('status',status,'total',total,'created_at',created_at,'items',items) from orders
  where tracking=upper(trim(p_code)) and customer->>'phone'=regexp_replace(p_phone,'\s','','g') limit 1 $$;

create function restore_stock() returns trigger language plpgsql security definer set search_path=public as $$
declare it jsonb;
begin
  if new.status='cancelled' and old.status<>'cancelled' then
    for it in select * from jsonb_array_elements(old.items) loop
      update products set stock=jsonb_set(stock,array[it->>'size'],to_jsonb(coalesce((stock->>(it->>'size'))::int,0)+1))
      where id=it->>'product_id' and stock is not null;
    end loop;
    if new.coupon is not null then update coupons set uses=greatest(uses-1,0) where code=new.coupon; end if;
  end if;
  return new;
end $$;
create trigger orders_cancel after update on orders for each row execute function restore_stock();

grant execute on function quote_order(jsonb,text), create_order(jsonb,jsonb,text,text), track_order(text,text) to anon, authenticated;
