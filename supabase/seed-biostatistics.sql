-- Adds "Fundamentals of Biostatistics" (7th ed., Bernard Rosner) with its preview PDF and cover.
-- Run AFTER supabase/add-book-preview.sql. Safe to run twice (skips if the ISBN already exists).
-- The files live in the website itself: /previews/fundamentals-of-biostatistics-7e.pdf and /covers/fundamentals-of-biostatistics-7e.jpg
-- Change floor / shelf below (or edit the book later in Admin) to match where the copy is really shelved.
insert into public.books
  (title, author, isbn, category, description, cover_url, preview_url, total_copies, available_copies, floor, section, shelf, row_label, position_label)
select
  'Fundamentals of Biostatistics', 'Bernard Rosner', '9780538735896', 'Biostatistics',
  'Introductory biostatistics textbook for upper-level undergraduate and graduate students in medicine and other health-related areas. Seventh edition, International Edition (Brooks/Cole, Cengage Learning, 2011). Call no. 570.15195 R813 F 2011.',
  '/covers/fundamentals-of-biostatistics-7e.jpg', '/previews/fundamentals-of-biostatistics-7e.pdf',
  1, 1, '1', 'Biostatistics', 'C', null, null
where not exists (select 1 from public.books where isbn = '9780538735896');
