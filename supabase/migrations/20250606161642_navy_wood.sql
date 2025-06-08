/*
  # Fix quiz_attempts foreign key constraint

  1. Changes
    - Drop the existing foreign key constraint that references the custom users table
    - Add a new foreign key constraint that references auth.users table
    - This ensures quiz_attempts.user_id correctly references the authenticated user's ID

  2. Security
    - Maintains existing RLS policies
    - No changes to data access patterns
*/

-- Drop the existing foreign key constraint
ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;