-- ROVEN schema. Run once in the Supabase SQL editor.
create table products(id text primary key, name_en text not null, name_ar text not null, price int not null check(price>=0),
  sizes text[] not null, colors text[] not null, images text[] default '{}', active bool default true, sort int default 0);
create table orders(id uuid primary key default gen_random_uuid(), customer jsonb not null, items jsonb not null,
  total int not null, method text not null check(method in('cod','online')),
  status text not null default 'new' check(status in('new','confirmed','shipped','delivered','cancelled','awaiting_payment')),
  created_at timestamptz default now());
create table admins(user_id uuid primary key references auth.users on delete cascade);

alter table products enable row level security; alter table orders enable row level security; alter table admins enable row level security;
create function is_admin() returns bool language sql stable security definer set search_path=public
  as $$ select exists(select 1 from admins where user_id=auth.uid()) $$;

create policy "public reads active products" on products for select using (active);
create policy "admin manages products" on products for all using (is_admin()) with check (is_admin());
create policy "admin reads orders" on orders for select using (is_admin());
create policy "admin updates orders" on orders for update using (is_admin()) with check (is_admin());
-- no insert policy on orders: customers can only order through create_order(), which prices items on the server.

create function create_order(p_customer jsonb, p_items jsonb, p_method text) returns uuid
language plpgsql security definer set search_path=public as $$
declare t int:=0; it jsonb; pr products; oid uuid;
begin
  if p_method not in ('cod','online') then raise exception 'bad method'; end if;
  if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'bad items'; end if;
  if length(p_customer->>'name')<2 or (p_customer->>'phone') !~ '^\+?[0-9]{10,14}$' then raise exception 'bad customer'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    select * into pr from products where id=it->>'product_id' and active;
    if not found or not (it->>'size' = any(pr.sizes)) then raise exception 'bad item'; end if;
    t:=t+pr.price;
  end loop;
  insert into orders(customer,items,total,method,status)
    values(p_customer,p_items,t,p_method,case when p_method='online' then 'awaiting_payment' else 'new' end) returning id into oid;
  return oid;
end $$;
grant execute on function create_order(jsonb,jsonb,text) to anon, authenticated;
