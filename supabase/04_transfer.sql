-- Run after 03_extras.sql. Manual transfer payment (InstaPay / wallet / bank) with receipt upload.
alter table orders drop constraint orders_method_check;
alter table orders add constraint orders_method_check check(method in('cod','online','transfer'));
alter table orders add column receipt text;
insert into settings values ('transfer_info','"Add your InstaPay address, wallet number or bank details in Dashboard > Settings."');

create or replace function create_order(p_customer jsonb, p_items jsonb, p_method text, p_coupon text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare q jsonb; it jsonb; pr products; n int; cde text:=upper(trim(coalesce(p_coupon,''))); trk text;
begin
  if p_method not in ('cod','online','transfer') then raise exception 'bad method'; end if;
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
    p_method,case when p_method in ('online','transfer') then 'awaiting_payment' else 'new' end,trk);
  return q||jsonb_build_object('tracking',trk);
end $$;

create or replace function track_order(p_code text, p_phone text) returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('status',status,'total',total,'created_at',created_at,'items',items,'method',method,'has_receipt',receipt is not null)
  from orders where tracking=upper(trim(p_code)) and customer->>'phone'=regexp_replace(p_phone,'\s','','g') limit 1 $$;

-- Private bucket: customers can upload (2 MB, images only), only admins can read.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('receipts','receipts',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy "anyone uploads receipts" on storage.objects for insert
  with check (bucket_id='receipts' and (storage.foldername(name))[1] like 'RV-%');
create policy "admin reads receipts" on storage.objects for select using (bucket_id='receipts' and public.is_admin());

create function attach_receipt(p_code text, p_phone text, p_path text) returns boolean
language plpgsql security definer set search_path=public as $$
declare c text:=upper(trim(p_code)); k int;
begin
  update orders set receipt=p_path where tracking=c and customer->>'phone'=regexp_replace(p_phone,'\s','','g')
    and method='transfer' and status='awaiting_payment' and p_path like c||'/%';
  get diagnostics k = row_count; return k=1;
end $$;
grant execute on function attach_receipt(text,text,text), track_order(text,text) to anon, authenticated;
