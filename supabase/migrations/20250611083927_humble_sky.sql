/*
  # Create Current Affairs Daily Questions Table

  1. New Tables
    - `current_affairs_daily`
      - `id` (integer, primary key)
      - `date` (date, not null)
      - `sequence_order` (integer, not null)
      - `topic` (text, not null)
      - `question` (text, not null)
      - `answer` (text, not null)
      - `options` (jsonb, nullable for non-MCQ questions)
      - `type` (varchar, not null - mcq, true-false, reveal)
      - `category` (varchar, not null)
      - `difficulty` (varchar, not null)
      - `exam_relevance` (integer, nullable)
      - `keywords` (jsonb, nullable)
      - `explanation` (text, nullable)
      - `source` (text, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp, default now())

    - `user_progress_sessions`
      - `id` (integer, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_date` (date, not null)
      - `session_type` (varchar, not null)
      - `questions_answered` (integer)
      - `correct_answers` (integer)
      - `accuracy_percentage` (double precision)
      - `xp_earned` (integer)
      - `time_spent_seconds` (integer)
      - `perfect_score` (boolean)
      - `hearts_remaining` (integer)
      - `session_completed` (boolean)
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on user_progress_sessions table
    - Allow public read access for current_affairs_daily
    - Users can only access their own progress sessions

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create current_affairs_daily table
CREATE TABLE IF NOT EXISTS current_affairs_daily (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date date NOT NULL,
  sequence_order integer NOT NULL,
  topic text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  options jsonb,
  type varchar(20) NOT NULL,
  category varchar(20) NOT NULL,
  difficulty varchar(10) NOT NULL,
  exam_relevance integer,
  keywords jsonb,
  explanation text,
  source text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Create user_progress_sessions table
CREATE TABLE IF NOT EXISTS user_progress_sessions (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id),
  session_date date NOT NULL,
  session_type varchar(20) NOT NULL,
  questions_answered integer,
  correct_answers integer,
  accuracy_percentage double precision,
  xp_earned integer,
  time_spent_seconds integer,
  perfect_score boolean,
  hearts_remaining integer,
  session_completed boolean,
  created_at timestamp without time zone DEFAULT now()
);

-- Enable RLS on user_progress_sessions (current_affairs_daily is public read)
ALTER TABLE user_progress_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress_sessions
CREATE POLICY "Users can view their own progress sessions"
  ON user_progress_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress sessions"
  ON user_progress_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress sessions"
  ON user_progress_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_current_affairs_daily_date 
ON current_affairs_daily(date, sequence_order);

CREATE INDEX IF NOT EXISTS idx_current_affairs_daily_active 
ON current_affairs_daily(is_active, date);

CREATE INDEX IF NOT EXISTS idx_user_progress_sessions_user_date 
ON user_progress_sessions(user_id, session_date);

CREATE INDEX IF NOT EXISTS idx_user_progress_sessions_type 
ON user_progress_sessions(session_type, session_date);

-- Insert sample current affairs questions for today
INSERT INTO current_affairs_daily (
  date, sequence_order, topic, question, answer, options, type, category, difficulty, exam_relevance, keywords, explanation, source, is_active
) VALUES 
(
  CURRENT_DATE, 1, 'Budget 2025', 
  'What is the fiscal deficit target for 2025-26?', 
  '4.9%',
  '["4.5%", "4.9%", "5.1%", "5.3%"]'::jsonb,
  'mcq', 'economy', 'medium', 95,
  '["Budget", "Fiscal Deficit", "Economy"]'::jsonb,
  'Budget 2025 set the fiscal deficit target at 4.9% of GDP for the financial year 2025-26.',
  'Union Budget 2025', true
),
(
  CURRENT_DATE, 2, 'Supreme Court Verdict',
  'SC upheld the constitutional validity of Aadhaar for banking',
  'true',
  null,
  'true-false', 'politics', 'medium', 92,
  '["Supreme Court", "Aadhaar", "Banking"]'::jsonb,
  'Supreme Court upheld Aadhaar linking for banking services while ensuring privacy safeguards.',
  'Supreme Court of India', true
),
(
  CURRENT_DATE, 3, 'Digital India Initiative',
  'Which ministry launched the new AI governance framework?',
  'Ministry of Electronics and IT',
  null,
  'reveal', 'schemes', 'medium', 88,
  '["AI Governance", "Digital India", "MeitY"]'::jsonb,
  'Ministry of Electronics and IT (MeitY) launched comprehensive AI governance framework for responsible AI development.',
  'Ministry of Electronics and IT', true
),
(
  CURRENT_DATE, 4, 'Economic Survey 2025',
  'India''s projected GDP growth rate for 2025-26 is 6.8%',
  'true',
  null,
  'true-false', 'economy', 'medium', 94,
  '["GDP Growth", "Economic Survey", "Fiscal Year"]'::jsonb,
  'The Economic Survey 2025 projects India''s GDP growth at 6.8% for FY 2025-26, driven by domestic consumption and investment.',
  'Economic Survey 2025', true
),
(
  CURRENT_DATE, 5, 'Space Mission Update',
  'Which is ISRO''s next major mission after Chandrayaan-3?',
  'Gaganyaan',
  '["Mangalyaan-2", "Gaganyaan", "Shukrayaan-1", "Aditya-L2"]'::jsonb,
  'mcq', 'general', 'medium', 85,
  '["ISRO", "Gaganyaan", "Human Spaceflight"]'::jsonb,
  'ISRO''s Gaganyaan mission aims to send Indian astronauts to space, with first uncrewed test scheduled for 2025.',
  'ISRO', true
),
(
  CURRENT_DATE, 6, 'Climate Summit 2025',
  'India committed to achieve net-zero emissions by 2070',
  'true',
  null,
  'true-false', 'international', 'medium', 92,
  '["Net Zero", "Climate Change", "COP29"]'::jsonb,
  'India reaffirmed its commitment to achieve net-zero emissions by 2070 at the Global Climate Summit 2025.',
  'Ministry of Environment', true
),
(
  CURRENT_DATE, 7, 'Agricultural Reforms',
  'What is the MSP increase percentage for wheat in 2025-26?',
  '6.2%',
  '["5.8%", "6.2%", "7.1%", "8.5%"]'::jsonb,
  'mcq', 'schemes', 'hard', 87,
  '["MSP", "Wheat", "Agricultural Policy"]'::jsonb,
  'MSP for wheat increased by 6.2% to ₹2,425 per quintal for 2025-26, supporting farmer income.',
  'Ministry of Agriculture', true
),
(
  CURRENT_DATE, 8, 'India-Japan Partnership',
  'What is the focus of the new India-Japan semiconductor alliance?',
  'Manufacturing & Research',
  null,
  'reveal', 'international', 'medium', 83,
  '["India-Japan", "Semiconductors", "Technology"]'::jsonb,
  'India-Japan semiconductor alliance focuses on joint manufacturing facilities and R&D centers for advanced chips.',
  'Ministry of External Affairs', true
)
ON CONFLICT DO NOTHING;