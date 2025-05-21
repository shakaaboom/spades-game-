
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { TransactionsManagement } from "@/components/admin/TransactionsManagement";
import { NotificationsManagement } from "@/components/admin/NotificationsManagement";
import { BlogManagement } from "@/components/admin/BlogManagement";
import { WaitingRoomsManagement } from "@/components/admin/WaitingRoomsManagement";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    if (user && user.email) {
      setIsChecking(true);
      // Check if the authenticated user's email is the admin email
      const adminEmail = "demetri.jrod@gmail.com";
      if (user.email.toLowerCase() === adminEmail.toLowerCase()) {
        setIsAuthorized(true);
        toast({
          title: "Access granted",
          description: "Welcome to the Admin Dashboard",
        });
      } else {
        setIsAuthorized(false);
        toast({
          title: "Access denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
      }
      setIsChecking(false);
    } else if (user === null) {
      // User is definitely not logged in
      setIsChecking(false);
    }
  }, [user, toast]);

  // If user is not logged in, redirect to auth page
  if (!isChecking && !user) {
    return <Navigate to="/auth" />;
  }

  // If still checking authorization status, show loading
  if (isChecking) {
    return (
      <Layout>
        <div className="container py-10 flex justify-center items-center min-h-[60vh]">
          <p>Verifying admin access...</p>
        </div>
      </Layout>
    );
  }

  // If user is logged in but not authorized, show access denied
  if (!isAuthorized) {
    return (
      <Layout>
        <div className="container max-w-md py-10">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>This area is restricted to admin users only.</p>
              <Button onClick={() => window.history.back()} className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Badge variant="outline" className="px-3 py-1">
            Admin: {user.email}
          </Badge>
        </div>

        <DashboardStats />

        <Tabs defaultValue="waiting-rooms" className="mt-6">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="waiting-rooms">Waiting Rooms</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="blog">Blog & Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="waiting-rooms">
            <WaitingRoomsManagement />
          </TabsContent>
          
          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
          
          <TabsContent value="transactions">
            <TransactionsManagement />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsManagement />
          </TabsContent>
          
          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
