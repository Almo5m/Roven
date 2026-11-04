-- Run after schema.sql. Admin sign-in check + product image storage.
create policy "admin reads own row" on admins for select using (user_id = auth.uid());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('products','products',true,3145728,array['image/jpeg','image/png','image/webp']);
create policy "public reads product images" on storage.objects for select using (bucket_id='products');
create policy "admin uploads product images" on storage.objects for insert with check (bucket_id='products' and public.is_admin());
create policy "admin deletes product images" on storage.objects for delete using (bucket_id='products' and public.is_admin());

-- Make yourself admin: sign up once in Supabase Auth, then run with your own user id:
-- insert into admins(user_id) values ('PASTE-YOUR-USER-ID');
