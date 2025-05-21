/*
  # Add presence system

  1. New Tables
    - `user_presence`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `last_seen` (timestamp)
      - `status` (text) - Can be 'online' or 'offline'

  2. Security
    - Enable RLS on `user_presence` table
    - Add policies for users to update their own presence
    - Add policies for anyone to view presence data
*/

CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  last_seen timestamptz DEFAULT now(),
  status text DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  UNIQUE (user_id)
);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own presence
CREATE POLICY "Users can update their own presence"
  ON user_presence
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own presence
CREATE POLICY "Users can insert their own presence"
  ON user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view presence data
CREATE POLICY "Anyone can view presence"
  ON user_presence
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to update or create presence
CREATE OR REPLACE FUNCTION update_presence()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up stale presence data
CREATE TRIGGER cleanup_presence
  BEFORE INSERT OR UPDATE ON user_presence
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_presence();