-- Run after 04_transfer.sql. Product details, categories, featured flag, social links.
alter table products add column category text not null default 'other',
  add column description_en text not null default '', add column description_ar text not null default '',
  add column featured bool not null default false;
insert into settings values ('instagram','""'),('tiktok','""');
