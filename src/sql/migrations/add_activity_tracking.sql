-- Add last_active_at column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
        ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT NOW();
    END IF;
END $$;

-- Add last_active_at column to solo_players table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'solo_players' AND column_name = 'last_active_at') THEN
        ALTER TABLE solo_players ADD COLUMN last_active_at timestamptz DEFAULT NOW();
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_solo_players_last_active ON solo_players(last_active_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at); 