-- =====================================================================
-- Storage: audio bucket
-- =====================================================================
-- ElevenLabs TTS で生成した mp3 を保存する公開バケット。
-- 学習者は誰でも音声を再生できる（公開コンテンツ）。
-- 書き込みは admin のみ。
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', true, 52428800, array['audio/mpeg', 'audio/mp4', 'audio/wav'])
on conflict (id) do nothing;

-- 公開読み取り
create policy "audio public read"
  on storage.objects for select
  using (bucket_id = 'audio');

-- admin のみ書き込み (insert / update / delete)
create policy "audio admin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'audio' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "audio admin update"
  on storage.objects for update
  using (
    bucket_id = 'audio' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "audio admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'audio' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
