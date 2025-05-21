
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

export async function fetchProfile(userId: string, user: User | null) {
  console.log(`[${new Date().toISOString()}] Fetching profile for user:`, userId);
  
  try {
    // Add a small delay to ensure any previous database operations have completed
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Attempting to fetch profile data for user ${userId} from Supabase`);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();  // Using maybeSingle() to handle not found more gracefully
    
    console.log(`Profile fetch completed for user ${userId}, result:`, data ? 'found' : 'not found');

    if (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', JSON.stringify(error));
      return null;
    } 
    
    if (!data) {
      console.log(`No profile data found for user ${userId}, attempting to create one`);
      
      // If no profile exists, create one
      try {
        console.log(`Creating new profile for user ${userId}`);
        
        // Create a more detailed profile with a default username derived from email
        const username = user?.email?.split('@')[0] || `user_${Date.now().toString().slice(-6)}`;
        const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`;
        
        console.log(`Inserting profile with username: ${username}, avatar: ${avatarUrl}`);
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ 
            id: userId, 
            username: username,
            avatar_url: avatarUrl,
            games_played: 0,
            games_won: 0,
            rating: 1000
          })
          .select()  // Added explicit select() to fetch the newly created profile
          .maybeSingle();  // Use maybeSingle() for consistency
          
        if (createError) {
          console.error('Error creating profile:', createError);
          console.error('Create error details:', JSON.stringify(createError));
          
          // Try one more time with a delay - sometimes there's a race condition
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to fetch the profile again, it might have been created in the meantime
          const { data: retryProfile, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
          if (retryError || !retryProfile) {
            console.error('Final retry to fetch profile failed:', retryError);
            return null;
          }
          
          console.log('Profile found on retry:', retryProfile);
          return retryProfile;
        }
        
        console.log('New profile created successfully:', newProfile);
        return newProfile;
      } catch (createProfileError) {
        console.error('Exception creating profile:', createProfileError);
        console.error('Create exception details:', createProfileError instanceof Error ? createProfileError.message : String(createProfileError));
        return null;
      }
    }
    
    console.log('Profile data retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception fetching profile:', error);
    console.error('Fetch exception details:', error instanceof Error ? error.message : String(error));
    return null;
  }
}
