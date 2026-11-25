-- Keep only TWO sample ads (one Strings, one Keyboards). The other samples are hidden, not deleted.
update public.listings
   set status = 'removed'
 where is_sample::int = 1
   and title not in ('Acoustic guitar', 'Electric keyboard');

select id, title, status from public.listings where is_sample::int = 1 order by id;
