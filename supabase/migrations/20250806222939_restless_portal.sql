/*
  # Create user profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `gender` (text)
      - `age` (integer)
      - `country` (text)
      - `interests` (text array)
      - `followers_count` (integer, default 0)
      - `following_count` (integer, default 0)
      - `posts_count` (integer, default 0)
      - `is_verified` (boolean, default false)
      - `is_private` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to read/update their own profile
    - Add policy for public profile viewing
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  gender text,
  age integer,
  country text,
  interests text[] DEFAULT '{}',
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Public profiles can be viewed by anyone
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (NOT is_private);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    first_name,
    last_name,
    gender,
    age,
    country,
    interests
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'gender',
    COALESCE((new.raw_user_meta_data->>'age')::integer, null),
    new.raw_user_meta_data->>'country',
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'interests')),
      '{}'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();