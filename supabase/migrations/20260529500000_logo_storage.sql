-- Bucket público para logos procesados en admin (Vercel no puede escribir en disco)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "logos public read" on storage.objects;
create policy "logos public read"
  on storage.objects for select
  using (bucket_id = 'logos');

drop policy if exists "logos admin write" on storage.objects;
create policy "logos admin write"
  on storage.objects for all
  using (bucket_id = 'logos' and public.is_cms_admin())
  with check (bucket_id = 'logos' and public.is_cms_admin());
