-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- certifications
CREATE TABLE certifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text NOT NULL CHECK (category IN ('IT', 'creative')),
  icon_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- courses
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  certification_id uuid NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  order_index int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- sections
CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- lessons
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video', 'text', 'quiz')),
  youtube_url text,
  content_body text,
  order_index int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- questions
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  choices jsonb NOT NULL,
  correct_choice_id text NOT NULL,
  explanation text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- quiz_results
CREATE TABLE quiz_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_choice_id text NOT NULL,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now()
);

-- progress
CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes
CREATE INDEX ON subscriptions(user_id);
CREATE INDEX ON courses(certification_id, order_index);
CREATE INDEX ON sections(course_id, order_index);
CREATE INDEX ON lessons(section_id, order_index);
CREATE INDEX ON questions(lesson_id, order_index);
CREATE INDEX ON quiz_results(user_id, question_id);
CREATE INDEX ON progress(user_id, lesson_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- certifications policies (published ones are public)
CREATE POLICY "Anyone can view published certifications" ON certifications
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage certifications" ON certifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- courses policies
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- sections policies
CREATE POLICY "Authenticated users can view sections" ON sections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sections" ON sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- lessons policies (subscribers only for content)
CREATE POLICY "Authenticated users can view published lessons" ON lessons
  FOR SELECT USING (
    is_published = true AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can manage lessons" ON lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- questions policies
CREATE POLICY "Subscribers can view questions" ON questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- quiz_results policies
CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- progress policies
CREATE POLICY "Users can view own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
