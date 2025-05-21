import { useState, useEffect, useRef } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const OFFLINE_THRESHOLD = 60000; // 1 minute in milliseconds - more aggressive cleanup

const updateUserActivity = async (userId: string, isOnline: boolean, authToken: string) => {
  if (!userId) return;

  const profileUrl = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  const lastActiveAt = new Date().toISOString();

  try {
    await fetch(profileUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${authToken}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ 
        is_online: isOnline,
        last_active_at: lastActiveAt 
      }),
      keepalive: true,
    });

    // Clean up stale online statuses more aggressively
    if (!isOnline) {
      const staleTime = new Date(Date.now() - OFFLINE_THRESHOLD).toISOString();
      
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?last_active_at=lt.${staleTime}&is_online=eq.true`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${authToken}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ 
          is_online: false 
        }),
      });
    }
  } catch (error) {
    console.error("Failed to update user activity:", error);
  }
};

const useOnlineStatus = (userId: string | null) => {
  const heartbeatInterval = useRef<number>();
  const cleanupInterval = useRef<number>();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const authToken = localStorage.getItem(`sb-oqtzvbhguatgwucfltin-auth-token`);
    if (!authToken) {
      console.warn("No auth token found in localStorage");
      return;
    }

    const accessToken = JSON.parse(authToken).access_token;

    const markOnline = async () => {
      setIsOnline(true);
      await updateUserActivity(userId, true, accessToken);
    };

    const markOffline = async () => {
      setIsOnline(false);
      await updateUserActivity(userId, false, accessToken);
    };

    const startHeartbeat = () => {
      markOnline();
      stopHeartbeat(); // Clear existing interval if any
      heartbeatInterval.current = window.setInterval(markOnline, HEARTBEAT_INTERVAL);
    };

    const stopHeartbeat = () => {
      if (heartbeatInterval.current) {
        window.clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
        markOffline();
      } else {
        startHeartbeat();
      }
    };

    const handleUnload = () => {
      markOffline();
    };

    const handleOnline = () => {
      startHeartbeat();
    };

    const handleOffline = () => {
      stopHeartbeat();
      markOffline();
    };

    // Initial setup
    startHeartbeat();

    // Start cleanup interval - runs every 30 seconds
    cleanupInterval.current = window.setInterval(() => {
      const staleTime = new Date(Date.now() - OFFLINE_THRESHOLD).toISOString();
      fetch(`${SUPABASE_URL}/rest/v1/profiles?last_active_at=lt.${staleTime}&is_online=eq.true`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ 
          is_online: false 
        }),
      }).catch(console.error);
    }, HEARTBEAT_INTERVAL);

    // Event listeners
    window.addEventListener("focus", startHeartbeat);
    window.addEventListener("blur", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      stopHeartbeat();
      if (cleanupInterval.current) {
        window.clearInterval(cleanupInterval.current);
      }
      window.removeEventListener("focus", startHeartbeat);
      window.removeEventListener("blur", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      markOffline();
    };  
  }, [userId]);

  return isOnline;
};

export default useOnlineStatus;
