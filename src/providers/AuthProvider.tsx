import { useState, useEffect, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthContext, AuthProviderProps } from "@/contexts/AuthContext";
import { useAuthActions } from "@/hooks/auth/use-auth-actions";
import { fetchProfile } from "@/utils/profile-utils";

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);
  const { toast } = useToast();
  const {
    isLoading,
    signIn,
    signUp,
    signOut: signOutAction,
    refreshProfile: refreshProfileAction,
    setIsLoading,
  } = useAuthActions();

  const refreshProfile = useCallback(async () => {
    if (!user) {
      console.log("Cannot refresh profile - no user logged in");
      return null;
    }
    console.log(
      `[${new Date().toISOString()}] Explicitly refreshing profile for user:`,
      user.id
    );
    const profileData = await refreshProfileAction(user.id, user);

    if (profileData) {
      console.log("Successfully refreshed profile:", profileData);
      setProfile(profileData);
      setProfileLoaded(true);

      // Ensure profile has a username
      if (!profileData.username && user.email) {
        console.log("Profile missing username, attempting to update");
        try {
          const emailUsername = user.email.split("@")[0];
          const { data: updatedProfile, error } = await supabase
            .from("profiles")
            .update({ username: emailUsername })
            .eq("id", user.id)
            .select()
            .maybeSingle();

          if (error) {
            console.error("Error updating profile username:", error);
          } else if (updatedProfile) {
            console.log("Updated profile with username:", updatedProfile);
            setProfile(updatedProfile);
          }
        } catch (err) {
          console.error("Error in username update:", err);
        }
      }
    } else {
      console.log("Profile refresh failed or returned null");
      setProfile(null);
      setProfileLoaded(false);
    }

    return profileData;
  }, [user, refreshProfileAction]);

  // Improved handler for fetching profile with better error handling
  const handleFetchProfile = useCallback(
    async (userId: string, userObj: User) => {
      setIsLoading(true);
      try {
        console.log(`Fetching profile for user ${userId}`);
        const profileData = await fetchProfile(userId, userObj);

        if (profileData) {
          console.log("Profile fetched successfully:", profileData);

          // Ensure profile has a username
          if (!profileData.username && userObj.email) {
            console.log("Profile missing username, attempting to update");
            try {
              const emailUsername = userObj.email.split("@")[0];
              const { data: updatedProfile, error } = await supabase
                .from("profiles")
                .update({ username: emailUsername })
                .eq("id", userId)
                .select()
                .maybeSingle();

              if (error) {
                console.error("Error updating profile username:", error);
                setProfile(profileData);
              } else if (updatedProfile) {
                console.log("Updated profile with username:", updatedProfile);
                setProfile(updatedProfile);
              } else {
                setProfile(profileData);
              }
            } catch (err) {
              console.error("Error in username update:", err);
              setProfile(profileData);
            }
          } else {
            setProfile(profileData);
          }

          setProfileLoaded(true);
        } else {
          console.log("No profile data returned");
          setProfile(null);
          setProfileLoaded(false);

          // Attempt one more profile refresh after a delay
          setTimeout(() => {
            console.log("Attempting delayed profile fetch");
            fetchProfile(userId, userObj).then((delayedProfile) => {
              if (delayedProfile) {
                console.log(
                  "Delayed profile fetch successful:",
                  delayedProfile
                );
                setProfile(delayedProfile);
                setProfileLoaded(true);
              } else {
                console.log("Delayed profile fetch failed");
              }
            });
          }, 1000);
        }

        setInitialLoadCompleted(true);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setProfileLoaded(false);
        setInitialLoadCompleted(true);
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading]
  );

  // Custom sign out function that ensures proper state cleanup
  const signOut = useCallback(async () => {
    console.log("AuthProvider: Initiating sign out process");

    // First clear our local state
    setUser(null);
    setProfile(null);
    setProfileLoaded(false);
    setSession(null);

    // Then call the actual sign out action
    const success = await signOutAction();

    console.log("Sign out completed with status:", success);
    return success;
  }, [signOutAction]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await handleFetchProfile(session.user.id, session.user);
        } else {
          setInitialLoadCompleted(true);
        }
      } catch (error) {
        console.error("Error fetching initial session:", error);
      } finally {
        setIsLoading(false);
        setInitialLoadCompleted(true);
      }
    };

    fetchSession();
  }, [handleFetchProfile]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && event === "SIGNED_IN") {
        console.log("User signed in");
        // toast({
        //   title: "Welcome back!",
        //   description: "You've successfully signed in",
        // });
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setProfile(null);
        setProfileLoaded(false);
        setInitialLoadCompleted(true);
        toast({
          title: "Signed out",
          description: "You've been successfully signed out",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        profileLoaded,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
