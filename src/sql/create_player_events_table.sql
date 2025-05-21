

-- Create a table to track player events (join, leave, ready status changes)
CREATE TABLE IF NOT EXISTS public.game_player_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('join', 'leave', 'ready', 'unready')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add indexes
    CONSTRAINT game_player_events_game_id_idx FOREIGN KEY (game_id) REFERENCES public.games(id),
    CONSTRAINT game_player_events_player_id_idx FOREIGN KEY (player_id) REFERENCES public.profiles(id)
);

-- Add RLS policies
ALTER TABLE public.game_player_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events
CREATE POLICY "Anyone can view player events"
    ON public.game_player_events
    FOR SELECT
    USING (true);

-- Only authenticated users can create events
CREATE POLICY "Authenticated users can create player events"
    ON public.game_player_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_player_events;

