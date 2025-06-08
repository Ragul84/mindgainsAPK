/*
  # Complete Database Schema Setup

  1. New Tables
    - `users` (extends auth.users with additional fields)
    - `profiles` (user profile information)
    - `user_progress` (learning progress tracking)
    - `study_sessions` (study session records)
    - `quiz_attempts` (quiz attempt records with completed_at)
    - `quiz_analytics` (detailed quiz performance analytics)
    - `user_stats` (aggregated user statistics)
    - `generation_counts` (AI generation usage tracking)
    - `smart_notes_generations` (smart notes generation records)
    - `payment_orders` (payment transaction records)
    - `smart_notes` (user-generated smart notes)
    - `user_achievements` (achievement tracking)

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access control
    - Ensure users can only access their own data

  3. Functions & Triggers
    - User profile creation on signup
    - Level calculation based on XP
    - Generation count tracking
*/

-- First, drop all existing policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Get all policies and drop them
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors
END $$;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  username text,
  avatar_url text,
  xp integer DEFAULT 0,
  streak integer DEFAULT 0,
  level integer DEFAULT 1
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT 'Student',
  plan text DEFAULT 'free',
  plan_activated_at timestamptz,
  plan_expires_at timestamptz,
  roadmap_generations_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  progress integer NOT NULL,
  last_studied timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  duration integer NOT NULL,
  xp_earned integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create quiz_attempts table with completed_at column
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  quiz_type text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  xp_earned integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now()
);

-- Add completed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_attempts' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE quiz_attempts ADD COLUMN completed_at timestamptz DEFAULT now();
  END IF;
END $$;

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create quiz_analytics table
CREATE TABLE IF NOT EXISTS quiz_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  category_performance jsonb NOT NULL DEFAULT '{}',
  difficulty_performance jsonb NOT NULL DEFAULT '{}',
  insights text[] DEFAULT '{}',
  time_analysis jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_analytics ENABLE ROW LEVEL SECURITY;

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  total_quizzes_completed integer DEFAULT 0,
  total_correct_answers integer DEFAULT 0,
  total_questions_attempted integer DEFAULT 0,
  average_accuracy numeric(5,2) DEFAULT 0,
  total_study_time_minutes integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create generation_counts table
CREATE TABLE IF NOT EXISTS generation_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE generation_counts ENABLE ROW LEVEL SECURITY;

-- Create smart_notes_generations table
CREATE TABLE IF NOT EXISTS smart_notes_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_notes_generations ENABLE ROW LEVEL SECURITY;

-- Create payment_orders table
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  payment_id text,
  amount integer NOT NULL,
  currency text DEFAULT 'INR',
  plan text NOT NULL,
  status text DEFAULT 'created',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Create smart_notes table
CREATE TABLE IF NOT EXISTS smart_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_notes ENABLE ROW LEVEL SECURITY;

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Now create all policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own progress"
  ON user_progress FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own study sessions"
  ON study_sessions FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own quiz attempts"
  ON quiz_attempts FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz analytics"
  ON quiz_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz analytics"
  ON quiz_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation counts"
  ON generation_counts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation counts"
  ON generation_counts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own generation counts"
  ON generation_counts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON smart_notes_generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own generations"
  ON smart_notes_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own payment orders"
  ON payment_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment orders"
  ON payment_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment orders"
  ON payment_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own smart notes"
  ON smart_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smart notes"
  ON smart_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart notes"
  ON smart_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart notes"
  ON smart_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, plan, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    'free',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Level update function
CREATE OR REPLACE FUNCTION update_level_on_xp_change()
RETURNS trigger AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(NEW.xp / 1000) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generation count function
CREATE OR REPLACE FUNCTION increment_generation_count(p_user_id uuid, p_date date)
RETURNS void AS $$
BEGIN
  INSERT INTO generation_counts (user_id, date, count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    count = generation_counts.count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS update_level_trigger ON users;
CREATE TRIGGER update_level_trigger
  BEFORE UPDATE OF xp ON users
  FOR EACH ROW EXECUTE FUNCTION update_level_on_xp_change();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_generation_counts_user_date ON generation_counts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_generation_counts_date ON generation_counts(date);
CREATE INDEX IF NOT EXISTS idx_smart_notes_generations_user_id ON smart_notes_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notes_generations_date ON smart_notes_generations(generated_at);
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_user_id ON quiz_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_created_at ON quiz_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notes_user_id ON smart_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Create demo user safely (only if auth system allows)
DO $$
BEGIN
  -- Try to create demo user, but ignore if it fails
  -- This handles cases where auth.users has different constraints
  BEGIN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'demo@mindgains.ai',
      crypt('demo123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"full_name": "Demo User"}'::jsonb
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- If demo user creation fails, just continue
      NULL;
  END;
  
  -- Ensure demo user has profile (this should work regardless)
  INSERT INTO profiles (
    id,
    full_name,
    plan,
    created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo User',
    'premium',
    now()
  ) ON CONFLICT (id) DO NOTHING;
  
END $$;