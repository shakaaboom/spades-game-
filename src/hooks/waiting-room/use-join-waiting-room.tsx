
import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseJoinWaitingRoomProps {
  user: any;
  profile: any;
  refreshProfile: () => Promise<any>;
  refreshWaitingRoom: () => Promise<void>;
}

export const useJoinWaitingRoom = ({
  user,
  profile,
  refreshProfile,
  refreshWaitingRoom
}: UseJoinWaitingRoomProps) => {
  const { toast } = useToast();
  
  const joinWaitingRoom = useCallback(async (targetRoomId: string): Promise<boolean> => {
    if (!user) {
      console.error("Cannot join room - no user logged in");
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a waiting room",
        variant: "destructive"
      });
      return false;
    }

    // Debug profile state at join time
    console.log("[DEBUG] Join room profile state:", {
      profileExists: !!profile,
      profileId: profile?.id,
      profileUsername: profile?.username,
      userId: user?.id,
      userEmail: user?.email
    });

    // Try to ensure we have a profile before joining
    let profileData = profile;
    if (!profileData) {
      console.log("Profile not loaded yet, refreshing before join attempt...");
      try {
        profileData = await refreshProfile();
        console.log("[DEBUG] Refreshed profile result:", profileData);
        
        if (!profileData) {
          console.error("Profile still not available after refresh");
          toast({
            title: "Profile Error",
            description: "Unable to load your profile data",
            variant: "destructive"
          });
          // We'll continue anyway, but with missing profile data
        }
      } catch (error) {
        console.error("Error refreshing profile:", error);
        // Continue with the join attempt anyway
      }
    }

    console.log("Joining waiting room directly:", targetRoomId, "User:", user.id, "Profile:", profileData);
    
    try {
      // Extra debugging to check profile data
      if (profileData) {
        console.log("DEBUG - Current profile data:", {
          id: profileData.id,
          username: profileData.username,
          avatar_url: profileData.avatar_url
        });
      } else {
        console.error("DEBUG - Profile is null or undefined!");
      }

      const { data: existingPlayer, error: checkError } = await supabase
        .from('game_players')
        .select('user_id')
        .eq('game_id', targetRoomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking if user is in room:", checkError);
      }

      if (existingPlayer) {
        console.log("User already in waiting room:", targetRoomId);
        await refreshWaitingRoom();
        return true;
      }

      const { data: players, error: playersError } = await supabase
        .from('game_players')
        .select('position')
        .eq('game_id', targetRoomId);

      if (playersError) {
        console.error("Error getting existing players:", playersError);
        return false;
      }

      const positions = ['south', 'west', 'north', 'east'];
      const takenPositions = players?.map(p => p.position) || [];
      const availablePosition = positions.find(p => !takenPositions.includes(p)) || 'south';

      console.log("Adding player to position:", availablePosition);

      // Determine username to use - with fallbacks
      let usernameToUse: string;
      
      if (profileData && profileData.username) {
        usernameToUse = profileData.username;
        console.log("Using profile username:", usernameToUse);
      } else if (user.email) {
        usernameToUse = user.email.split('@')[0];
        console.log("Using email-based username:", usernameToUse);
      } else {
        usernameToUse = `Player_${Math.floor(Math.random() * 1000)}`;
        console.log("Using random username:", usernameToUse);
      }

      // Add a delay to ensure profile updates are processed
      await new Promise(resolve => setTimeout(resolve, 500));

      // If the profile doesn't have a username, update it first
      if (profileData && !profileData.username && user.email) {
        console.log("Profile missing username, updating with email-based username");
        const emailUsername = user.email.split('@')[0];
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: emailUsername })
          .eq('id', user.id);
          
        if (updateError) {
          console.error("Error updating profile username:", updateError);
        } else {
          console.log("Updated profile username to:", emailUsername);
          usernameToUse = emailUsername;
        }
      }

      // Insert the player into the game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: targetRoomId,
          user_id: user.id,
          position: availablePosition,
          is_ready: false
        });

      if (joinError) {
        console.error("Error joining waiting room:", joinError);
        if (joinError.code === '23505') {
          console.log("User already exists in room (constraint violation)");
          await refreshWaitingRoom();
          return true;
        }
        toast({
          title: "Error",
          description: "Failed to join waiting room",
          variant: "destructive"
        });
        return false;
      }

      // Log the player join event with the username
      const { error: eventError } = await supabase
        .from('game_player_events')
        .insert({
          game_id: targetRoomId,
          player_id: user.id,
          player_name: usernameToUse,
          event_type: 'join'
        });
        
      if (eventError) {
        console.error("Error logging player join event:", eventError);
      }

      console.log("Successfully joined waiting room:", targetRoomId, "with username:", usernameToUse);
      await refreshWaitingRoom();
      return true;
    } catch (error) {
      console.error("Error in joinWaitingRoom:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [user, profile, refreshProfile, refreshWaitingRoom, toast]);

  return { joinWaitingRoom };
};
