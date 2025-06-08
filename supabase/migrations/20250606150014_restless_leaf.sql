/*
  # Add completed_at column to quiz_attempts table

  1. Changes
    - Add `completed_at` column to `quiz_attempts` table
    - Set default value to `created_at` for existing records
    - Update existing records to have completed_at = created_at

  2. Notes
    - This ensures backward compatibility with existing quiz attempts
    - New quiz attempts should set completed_at when the quiz is finished
*/

-- Add the completed_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_attempts' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.quiz_attempts 
    ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Update existing records to set completed_at = created_at
UPDATE public.quiz_attempts 
SET completed_at = created_at 
WHERE completed_at IS NULL;

-- Set default value for future records
ALTER TABLE public.quiz_attempts 
ALTER COLUMN completed_at SET DEFAULT now();