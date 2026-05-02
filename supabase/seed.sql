-- =====================================================================
-- que seed data (development)
-- =====================================================================
-- 4 資格 × 各 1-2 コース × セクション × レッスン × 問題 のミニマルセット。
-- 全 is_published = true / status = 'published' で公開状態。
-- =====================================================================

-- certifications
insert into public.certifications (slug, name, description, category, is_published, order_index) values
  ('ip',   'ITパスポート',     'IT基礎リテラシーを測る国家試験',                'IT',       true, 1),
  ('fe',   '基本情報技術者',   'IT エンジニアの登竜門。テクノロジ・マネジメント・ストラテジ', 'IT',       true, 2),
  ('spi',  'SPI',              '採用試験で広く使われる総合適性検査',            'business', true, 3),
  ('boki', '簿記2級',          '商業簿記と工業簿記の理解を測る検定',            'business', true, 4);

-- 取得しやすいよう、コースを cert ごとに 1 つずつ
with c as (
  select id, slug from public.certifications
)
insert into public.courses (certification_id, title, description, thumbnail_url, is_published, order_index)
select c.id,
       case c.slug
         when 'ip'   then 'IT パスポート 標準コース'
         when 'fe'   then '基本情報技術者 標準コース'
         when 'spi'  then 'SPI 標準コース'
         when 'boki' then '簿記2級 標準コース'
       end,
       'Que の標準カリキュラム',
       case c.slug
         when 'ip'   then 'course-ip.png'
         when 'fe'   then 'course-fe.png'
         when 'spi'  then 'course-spi.png'
         when 'boki' then 'course-boki.png'
       end,
       true, 1
  from c;

-- 各コースに 2 セクション
with crs as (
  select courses.id as course_id, certifications.slug as cert_slug
    from public.courses
    join public.certifications on certifications.id = courses.certification_id
)
insert into public.sections (course_id, title, is_published, order_index)
select course_id, title, true, order_index
  from crs
  cross join lateral (
    values
      ('section1', 1),
      ('section2', 2)
  ) as v(_unused, order_index)
  cross join lateral (
    select case
      when crs.cert_slug = 'ip'   and order_index = 1 then 'システム戦略の基礎'
      when crs.cert_slug = 'ip'   and order_index = 2 then 'マネジメントとセキュリティ'
      when crs.cert_slug = 'fe'   and order_index = 1 then 'データベースの基礎'
      when crs.cert_slug = 'fe'   and order_index = 2 then 'アルゴリズムとデータ構造'
      when crs.cert_slug = 'spi'  and order_index = 1 then '言語問題の基礎'
      when crs.cert_slug = 'spi'  and order_index = 2 then '非言語問題の基礎'
      when crs.cert_slug = 'boki' and order_index = 1 then '商業簿記の基礎'
      when crs.cert_slug = 'boki' and order_index = 2 then '工業簿記の基礎'
    end as title
  ) as t;

-- 各セクションに 2 レッスン
with sec as (
  select id as section_id, title as section_title from public.sections
)
insert into public.lessons (section_id, title, content_type, body, duration_seconds, is_published, order_index)
select section_id,
       section_title || ' レッスン ' || idx,
       'text',
       '## 概要' || E'\n\nこのレッスンでは ' || section_title || ' の重要ポイントを学びます。',
       420,
       true,
       idx
  from sec
  cross join generate_series(1, 2) as idx;

-- 各レッスンに 1 問のサンプル問題
with les as (
  select id as lesson_id, title from public.lessons
)
insert into public.questions (lesson_id, format, question_text, choices, correct_choice_id, explanation, status, order_index)
select lesson_id,
       'multiple_choice',
       title || ' に関する確認問題: 次のうち、正しい記述はどれか？',
       jsonb_build_array(
         jsonb_build_object('id', 'a', 'text', '選択肢 A の説明文'),
         jsonb_build_object('id', 'b', 'text', '選択肢 B の説明文（正解）'),
         jsonb_build_object('id', 'c', 'text', '選択肢 C の説明文'),
         jsonb_build_object('id', 'd', 'text', '選択肢 D の説明文')
       ),
       'b',
       '正解は B。 ' || title || ' の文脈では選択肢 B が定義に合致します。',
       'published',
       1
  from les;
