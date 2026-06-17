-- Replace LoremFlickr URLs (which can go offline) with Picsum Photos
-- (https://picsum.photos) — a highly reliable open CDN backed by Unsplash images.
-- Uses service ID hash for stable/consistent images per listing.
-- Run this in the Supabase SQL Editor if images are not showing.
update public.service_photos
set url = 'https://picsum.photos/seed/' || encode(sha256((service_id::text || position::text)::bytea), 'hex') || '/640/480'
where url like '%loremflickr%';
