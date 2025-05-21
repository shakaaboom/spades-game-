import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "@/utils/profile-utils";

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [profileRefreshInProgress, setProfileRefreshInProgress] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Fetches and refreshes the user profile.
   */
  const refreshProfile = async (userId: string, user: any) => {
    if (!userId) {
      console.log("❌ Cannot refresh profile - no user ID provided");
      return null;
    }

    if (profileRefreshInProgress) {
      console.log("⏳ Profile fetch already in progress, skipping duplicate request");
      return null;
    }

    console.log(`[${new Date().toISOString()}] Refreshing profile for user:`, userId);
    setProfileRefreshInProgress(true);

    try {
      const profileData = await fetchProfile(userId, user);
      return profileData;
    } finally {
      setProfileRefreshInProgress(false);
    }
  };

  /**
   * Handles user sign-in and updates the online status in the database.
   */
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("🔹 Attempting to sign in:", email);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("❌ Sign in error:", error);
        return { error };
      }

      const user = data?.user;
      if (user?.id) {
        console.log("🔹 Updating online status for user ID:", user.id);
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_online: true })
          .eq("id", user.id);

        if (updateError) {
          console.error("❌ Failed to update is_online:", updateError);
        } else {
          console.log("✅ Successfully updated is_online for", user.id);
        }
      } else {
        console.error("❌ User ID not found after login.");
      }

      console.log("✅ Sign in successful:", data);
      return { data, error: null };
    } catch (error) {
      console.error("❌ Exception during sign in:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user sign-up and sets the online status for new users.
   */
  const signUp = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);
      console.log("🔹 Attempting to sign up with:", email, username);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            is_online: true, // Automatically set new users as online
          },
        },
      });

      if (!error) {
        toast({
          title: "✅ Account Created!",
          description: "Your account has been created successfully. Please verify your email.",
        });
        console.log("✅ Signup successful:", data);
      } else {
        console.error("❌ Error during sign up:", error);
      }

      return { data, error };
    } catch (error) {
      console.error("❌ Exception during sign up:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user sign-out and updates the online status in the database.
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("🔹 Signing out user");

      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) {
        console.error("❌ Error fetching user before sign-out:", authError);
        return false;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_online: false })
        .eq("id", userData.user.id);

      if (updateError) {
        console.error("❌ Failed to update is_online during sign-out:", updateError);
      } else {
        console.log("✅ User is now offline:", userData.user.id);
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error("❌ Error during sign out:", signOutError);
        toast({
          title: "Sign Out Failed",
          description: "There was an error signing out. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "✅ Signed Out",
        description: "You have been successfully signed out.",
      });

      navigate("/");
      return true;
    } catch (error) {
      console.error("❌ Exception during sign out:", error);
      toast({
        title: "Sign Out Failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Detects when the user closes the browser or tab and marks them as offline.
   */
  useEffect(() => {
    const markOfflineOnTabClose = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        console.error("❌ Error getting user for tab close:", error);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_online: false })
        .eq("id", userData.user.id);

      if (updateError) {
        console.error("❌ Failed to mark user offline on tab close:", updateError);
      } else {
        console.log("✅ User marked offline due to tab close:", userData.user.id);
      }
    };

    window.addEventListener("beforeunload", markOfflineOnTabClose);

    return () => {
      window.removeEventListener("beforeunload", markOfflineOnTabClose);
    };
  }, []);

  return {
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    setIsLoading,
  };
}
