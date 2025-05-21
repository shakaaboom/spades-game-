import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.error("Error fetching balance:", error);
          return;
        }
    
        if (data) {
          setBalance(data.balance);
        }
      }
    };

    fetchBalance();

    // Real-time updates
    const subscription = supabase
      .channel(`profiles_updates_${user?.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        setBalance(payload.new.balance);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  if (isLoading || balance === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    const authRedirectUrl = `/auth${location.search}`;
    return <Navigate to={authRedirectUrl} state={{ from: location }} replace />;
  }

  if (location.pathname === "/leaderboard") {
    return <>{children || <Outlet />}</>;
  }

  if (location.pathname === "/wallet") {
    return <>{children || <Outlet />}</>;
  }

  if (balance === 0 && location.pathname.startsWith("/simple-waiting-room")) {
    return <Navigate to="/wallet" replace />;
  }

  return <>{children || <Outlet />}</>;
};

export default ProtectedRoute;
