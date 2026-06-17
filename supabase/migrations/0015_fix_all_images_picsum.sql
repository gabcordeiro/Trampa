-- Fix all broken LoremFlickr image URLs.
-- Run this in the Supabase SQL Editor.

-- 1) Category cover photos — one curated Picsum seed per category
update public.categories set cover_url = case slug
  when 'cleaning'    then 'https://picsum.photos/seed/cleaning7/640/480'
  when 'plumbing'    then 'https://picsum.photos/seed/plumber3/640/480'
  when 'electrical'  then 'https://picsum.photos/seed/electric5/640/480'
  when 'painting'    then 'https://picsum.photos/seed/painter2/640/480'
  when 'gardening'   then 'https://picsum.photos/seed/garden42/640/480'
  when 'moving'      then 'https://picsum.photos/seed/moving17/640/480'
  when 'tech-repair' then 'https://picsum.photos/seed/laptop99/640/480'
  when 'beauty'      then 'https://picsum.photos/seed/beauty88/640/480'
  when 'tutoring'    then 'https://picsum.photos/seed/tutor55/640/480'
  when 'pet-care'    then 'https://picsum.photos/seed/petdog11/640/480'
  when 'events'      then 'https://picsum.photos/seed/party33/640/480'
  when 'other'       then 'https://picsum.photos/seed/tools66/640/480'
  else 'https://picsum.photos/seed/' || slug || '77/640/480'
end
where cover_url is null or cover_url like '%loremflickr%';

-- 2) Service photos — stable hash-based Picsum seed per (service, position)
update public.service_photos
set url = 'https://picsum.photos/seed/'
       || encode(sha256((service_id::text || position::text)::bytea), 'hex')
       || '/640/480'
where url like '%loremflickr%';
