/*
  # Create profiles table and related structures

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text, default 'Student')
      - `plan` (text, default 'free')
      - `plan_activated_at` (timestamptz, nullable)
      - `plan_expires_at` (timestamptz, nullable)
      - `roadmap_generations_count` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to manage their own profiles

  3. Functions & Triggers
    - Create function to handle new user profile creation
    - Add trigger to automatically create profile when user signs up
*/

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

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to handle new user profile creation
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Insert demo user profile if demo user exists
INSERT INTO profiles (
  id,
  full_name,
  plan,
  created_at
) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'Demo User',
  'premium',
  now()
WHERE EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;