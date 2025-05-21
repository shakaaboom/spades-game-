
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface UseProfileCheckProps {
  user: any;
  profile: any;
  profileRefreshAttempted: boolean;
  setProfileRefreshAttempted: (value: boolean) => void;
  setProfileReady: (value: boolean) => void;
  silent?: boolean; // Option for silent profile checking
  maxRetries?: number; // Maximum number of retry attempts
}

export const useProfileCheck = ({
  user,
  profile,
  profileRefreshAttempted,
  setProfileRefreshAttempted,
  setProfileReady,
  silent = false, // Default to showing toasts
  maxRetries = 3 // Default to 3 retries
}: UseProfileCheckProps) => {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const attemptProfileRefresh = useCallback(async () => {
    if (isRefreshing || retryCount >= maxRetries || !user) {
      return null;
    }
    
    setIsRefreshing(true);
    console.log(`useProfileCheck - Attempting profile refresh (${retryCount + 1}/${maxRetries})`);
    
    try {
      const profileData = await refreshProfile();
      
      if (profileData) {
        console.log("useProfileCheck - Profile refresh successful:", profileData);
        setProfileReady(true);
        
        if (!silent) {
          toast({
            title: "Profile Loaded",
            description: `Welcome, ${profileData.username || user.email}!`,
          });
        }
        
        return profileData;
      } else {
        console.log("useProfileCheck - Profile refresh returned null");
        setRetryCount(prev => prev + 1);
        
        // Set profile ready even if we don't have data, to avoid blocking the UI
        if (retryCount >= maxRetries - 1) {
          setProfileReady(true);
          
          if (!silent) {
            toast({
              title: "Profile Note",
              description: "Using limited profile data. Some features may be restricted.",
              variant: "default"
            });
          }
        }
        
        return null;
      }
    } catch (err) {
      console.error("useProfileCheck - Error refreshing profile:", err);
      setRetryCount(prev => prev + 1);
      
      // Set profile ready even on error, to avoid blocking the UI after max retries
      if (retryCount >= maxRetries - 1) {
        setProfileReady(true);
        
        if (!silent) {
          toast({
            title: "Profile Note",
            description: "Using limited profile data. You can retry loading later.",
            variant: "default"
          });
        }
      }
      
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [user, refreshProfile, retryCount, maxRetries, silent, toast, setProfileReady, isRefreshing]);
  
  useEffect(() => {
    // If we have a user but no profile and haven't attempted a refresh yet, try to fetch the profile
    if (user && !profile && !profileRefreshAttempted) {
      console.log("useProfileCheck - Profile not available, refreshing for user:", user.id);
      setProfileRefreshAttempted(true);
      
      // Set profile ready immediately to prevent blocking the UI
      // This enables game joining even while profile is being loaded
      setProfileReady(true);
      
      attemptProfileRefresh();
    } else if (user && profile) {
      console.log("useProfileCheck - Profile already available:", profile);
      
      // Set profile ready
      setProfileReady(true);
      
      // Only show welcome toast if not in silent mode
      if (!silent) {
        toast({
          title: "Profile Ready",
          description: `Welcome, ${profile.username || user.email}!`,
        });
      }
    }
  }, [user, profile, attemptProfileRefresh, profileRefreshAttempted, setProfileRefreshAttempted, setProfileReady, toast, silent]);
  
  // Set up retry mechanism
  useEffect(() => {
    if (user && !profile && profileRefreshAttempted && retryCount < maxRetries && !isRefreshing) {
      const retryTimer = setTimeout(() => {
        console.log(`Scheduling retry ${retryCount + 1} of ${maxRetries}`);
        attemptProfileRefresh();
      }, 1500 * (retryCount + 1)); // Increasing delay for each retry
      
      return () => clearTimeout(retryTimer);
    }
  }, [user, profile, profileRefreshAttempted, retryCount, maxRetries, isRefreshing, attemptProfileRefresh]);
  
  return { 
    refreshProfile: attemptProfileRefresh,
    isRefreshing,
    retryCount,
    maxRetries 
  };
};
