/*
  # Fix generation count function and tables

  1. Functions
    - Create increment_generation_count function
    - Handle upsert logic for daily counts
  
  2. Tables
    - Ensure generation_counts table exists
    - Add proper indexes and policies
*/

-- Create generation_counts table if it doesn't exist
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

CREATE POLICY "Users can view their own generation counts"
  ON generation_counts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generation counts"
  ON generation_counts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation counts"
  ON generation_counts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create or replace the increment function
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generation_counts_user_date ON generation_counts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_generation_counts_date ON generation_counts(date);

-- Ensure smart_notes_generations table exists
CREATE TABLE IF NOT EXISTS smart_notes_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_notes_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own generations"
  ON smart_notes_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own generations"
  ON smart_notes_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_smart_notes_generations_user_id ON smart_notes_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notes_generations_date ON smart_notes_generations(generated_at);