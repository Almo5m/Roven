-- Run after 05_content.sql. Editable page content, lookbook, testimonials. Hides the release countdown until a date is set.
update settings set value='""' where key='drop_date';
insert into settings values ('announcement_en','""'),('announcement_ar','""'),('about_en','""'),('about_ar','""'),
  ('faq_en','""'),('faq_ar','""'),('size_chart','""'),('lookbook','[]');
create table testimonials(id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 60),
  rating int not null default 5 check(rating between 1 and 5), text text not null check(length(text) between 1 and 400),
  active bool not null default true, created_at timestamptz default now());
alter table testimonials enable row level security;
create policy "public reads active testimonials" on testimonials for select using (active);
create policy "admin manages testimonials" on testimonials for all using (is_admin()) with check (is_admin());
