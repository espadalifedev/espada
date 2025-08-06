/*
  # Create follows table for social media functionality

  1. New Tables
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references profiles.id)
      - `following_id` (uuid, references profiles.id)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `follows` table
    - Add policies for follow/unfollow functionality
*/

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view follows where they are involved
CREATE POLICY "Users can view follows they are involved in"
  ON follows
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = following_id AND NOT is_private
    )
  );

-- Users can create follows (follow others)
CREATE POLICY "Users can follow others"
  ON follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows (unfollow)
CREATE POLICY "Users can unfollow others"
  ON follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for followed user
    UPDATE profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for unfollowed user
    UPDATE profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update follow counts
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE PROCEDURE public.update_follow_counts();