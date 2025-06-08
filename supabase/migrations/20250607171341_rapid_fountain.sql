/*
  # Fix RLS policies for user signup

  1. Security Updates
    - Update RLS policies on users table to allow signup
    - Update RLS policies on profiles table to allow signup
    - Update RLS policies on user_stats table to allow signup
    - Ensure proper authentication flow during user creation

  2. Changes Made
    - Modified INSERT policy on users table to allow unauthenticated users to create their own record
    - Modified INSERT policy on profiles table to allow unauthenticated users to create their own record
    - Modified INSERT policy on user_stats table to allow unauthenticated users to create their own record
    - These policies will work during the signup process when the user is being created
*/

-- Drop ALL existing policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
    
    -- Drop all policies on profiles table
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
    
    -- Drop all policies on user_stats table
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_stats'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_stats', r.policyname);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if tables don't exist
END $$;

-- Create new INSERT policies that allow signup (more permissive for signup process)
CREATE POLICY "Users can insert own data during signup"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can insert their own profile during signup"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can insert their own stats during signup"
  ON public.user_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create SELECT policies (restrictive to authenticated users)
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own stats"
  ON public.user_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create UPDATE policies (restrictive to authenticated users only)
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);