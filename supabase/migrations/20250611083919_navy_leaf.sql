/*
  # Add Current Affairs Statistics to user_stats table

  1. Changes
    - Add current_affairs_streak column
    - Add current_affairs_total column  
    - Add current_affairs_correct column
    - Add current_affairs_points column
    - Add last_quiz_date column
    - Add longest_streak column for tracking best streaks

  2. Indexes
    - Add index for current affairs performance queries
*/

-- Add Current Affairs specific columns to user_stats
DO $$
BEGIN
  -- Add current_affairs_streak column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'longest_streak'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN longest_streak integer DEFAULT 0;
  END IF;

  -- Add last_quiz_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'last_quiz_date'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN last_quiz_date date;
  END IF;

  -- Add current_affairs_correct column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'current_affairs_correct'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN current_affairs_correct integer DEFAULT 0;
  END IF;

  -- Add current_affairs_total column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'current_affairs_total'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN current_affairs_total integer DEFAULT 0;
  END IF;

  -- Add current_affairs_streak column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'current_affairs_streak'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN current_affairs_streak integer DEFAULT 0;
  END IF;

  -- Add current_affairs_points column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'current_affairs_points'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN current_affairs_points integer DEFAULT 0;
  END IF;
END $$;

-- Create index for current affairs performance queries
CREATE INDEX IF NOT EXISTS idx_user_stats_current_affairs 
ON user_stats(user_id, current_affairs_total, current_affairs_correct);

-- Create index for streak tracking
CREATE INDEX IF NOT EXISTS idx_user_stats_streak 
ON user_stats(current_streak DESC);