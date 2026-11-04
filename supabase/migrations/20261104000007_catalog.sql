-- Run after 06_ui.sql. Categories and collections managed from the dashboard.
create table categories(slug text primary key check(slug ~ '^[a-z0-9-]{2,30}$'), name_en text not null, name_ar text not null,
  image text, sort int not null default 0, active bool not null default true);
create table collections(slug text primary key check(slug ~ '^[a-z0-9-]{2,30}$'), name_en text not null, name_ar text not null,
  description_en text not null default '', description_ar text not null default '', image text,
  sort int not null default 0, active bool not null default true, on_home bool not null default true);
alter table products add column collections text[] not null default '{}';
alter table categories enable row level security; alter table collections enable row level security;
create policy "public reads active categories" on categories for select using (active);
create policy "admin manages categories" on categories for all using (is_admin()) with check (is_admin());
create policy "public reads active collections" on collections for select using (active);
create policy "admin manages collections" on collections for all using (is_admin()) with check (is_admin());
insert into categories(slug,name_en,name_ar,sort) values ('hoodie','Hoodies','هوديز',1),('sweatpants','Sweatpants','سويت بانتس',2),('sweatshirt','Sweatshirts','سويت شيرتس',3) on conflict do nothing;
