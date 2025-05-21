
import { useLocation, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Start countdown for redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRedirecting(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [location.pathname]);

  if (redirecting) {
    return <Navigate to="/lobby" replace />;
  }

  return (
    <Layout hideFooter>
      <div className="min-h-[90vh] flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-lg text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-muted-foreground mb-8">
            Redirecting to lobby in {countdown} seconds...
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Go Home</Link>
            </Button>
            <Button asChild>
              <Link to="/lobby">Go to Lobby</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
