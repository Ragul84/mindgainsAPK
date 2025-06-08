/*
  # Add Quiz Analytics Tables

  1. New Tables
    - `quiz_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `quiz_attempt_id` (uuid, references quiz_attempts)
      - `category_performance` (jsonb)
      - `difficulty_performance` (jsonb)
      - `insights` (text array)
      - `time_analysis` (jsonb)
      - `created_at` (timestamp)

    - `user_stats`
      - `user_id` (uuid, primary key, references users)
      - `total_xp` (integer)
      - `current_level` (integer)
      - `total_quizzes_completed` (integer)
      - `total_correct_answers` (integer)
      - `total_questions_attempted` (integer)
      - `average_accuracy` (numeric)
      - `total_study_time_minutes` (integer)
      - `current_streak` (integer)
      - `best_streak` (integer)
      - `last_activity_date` (date)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to access their own data
*/

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

CREATE POLICY "Users can view their own quiz analytics"
  ON quiz_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz analytics"
  ON quiz_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can view their own stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_user_id ON quiz_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_created_at ON quiz_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(current_level DESC);