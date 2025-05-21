import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ProfileGameHistory from "@/components/profile/ProfileGameHistory";
import ProfileStats from "@/components/profile/ProfileStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditIcon, LogOut } from "lucide-react";
import { format } from "date-fns";
import CollapsibleChat from "@/components/chat/CollapsibleChat";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, profile, signOut, isLoading } = useAuth();
  
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);  // Loading state for avatar upload
  const [showAdminContact, setShowAdminContact] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const handleContactAdmin = () => {
    setShowAdminContact(true);
  };

  const handleEditAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);  

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;
  
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
  
      if (error) {
        console.error('Error uploading file:', error);
        setUploading(false);  
        return;
      }
  
      console.log('Upload successful:', data);
  
      const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath).data;
  
      console.log('Public URL:', publicUrl);
  
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
  
      if (updateError) {
        console.error('Error updating profile:', updateError);
        setUploading(false); 
        return;
      }
  
      setAvatarPreview(publicUrl);
      console.log('Avatar updated!');
      setUploading(false); 
      window.location.reload();

    } catch (err) {
      console.error('Unexpected error:', err);
      setUploading(false); 
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  const memberSince = profile.created_at
    ? format(new Date(profile.created_at), "MMM yyyy")
    : "Recently joined";

  return (
    <Layout onContactAdmin={handleContactAdmin}>
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* User Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center relative">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {uploading ? (
                        <div className="h-24 w-24 flex items-center justify-center">
                          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : (
                        <>
                          <AvatarImage
                            src={avatarPreview || profile.avatar_url}
                            alt={profile.username}
                          />
                          <AvatarFallback className="text-lg">
                            {profile.username?.slice(0, 2).toUpperCase() ||
                              user.email?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleEditAvatarClick}
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-white shadow"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>

                  <h2 className="mt-4 text-xl font-bold">
                    {profile.username || "Player"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>

                  <div className="flex items-center mt-2 space-x-2">
                    <Badge>
                      Level {Math.floor((profile.rating || 1000) / 100)}
                    </Badge>
                    {profile.is_online ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 border-green-200 text-green-700"
                      >
                        Online
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 border-gray-200 text-gray-700"
                      >
                        Offline
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Member since {memberSince}
                  </p>

                  <Button
                    variant="outline"
                    className="mt-4 w-full flex items-center gap-2"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Player Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileStats userId={profile.id} />
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2">
            <Tabs defaultValue="history" className="space-y-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="history">Game History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <ProfileGameHistory  playerId={profile.id}/>
                {/* playerId={profile.id} */}
              </TabsContent>

              <TabsContent value="settings">
                <ProfileSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <CollapsibleChat adminContact={showAdminContact} />
    </Layout>
  );
};

export default Profile;
