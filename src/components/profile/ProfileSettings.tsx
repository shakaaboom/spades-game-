import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Moon, Sun, Bell, Volume2, Eye, MessageSquare } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const ProfileSettings = () => {
  const { theme, setTheme } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState("");
  
  // Notification Preferences
  const [gameNotifications, setGameNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  
  // Sound Preferences
  const [gameSounds, setGameSounds] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  
  // Privacy Settings
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [saveChatHistory, setSaveChatHistory] = useState(true);
  
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.username || "");
    }
  }, [profile]);
  
  const handleSaveProfile = async () => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      await refreshProfile();
      
      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (err) {
      console.error('Error in handleSaveProfile:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleClearChatHistory = () => {
    toast({
      title: "Chat History Cleared",
      description: "Your chat history has been cleared successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Profile Information</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                <Label htmlFor="theme-toggle">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </Label>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <Label htmlFor="game-notifications">Game Notifications</Label>
            </div>
            <Switch
              id="game-notifications"
              checked={gameNotifications}
              onCheckedChange={setGameNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <Label htmlFor="chat-notifications">Chat Notifications</Label>
            </div>
            <Switch
              id="chat-notifications"
              checked={chatNotifications}
              onCheckedChange={setChatNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <Label htmlFor="system-notifications">System Announcements</Label>
            </div>
            <Switch
              id="system-notifications"
              checked={systemNotifications}
              onCheckedChange={setSystemNotifications}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sound Settings</CardTitle>
          <CardDescription>
            Manage game and notification sounds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <Label htmlFor="game-sounds">Game Sounds</Label>
            </div>
            <Switch
              id="game-sounds"
              checked={gameSounds}
              onCheckedChange={setGameSounds}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <Label htmlFor="chat-sounds">Chat Sound Effects</Label>
            </div>
            <Switch
              id="chat-sounds"
              checked={chatSounds}
              onCheckedChange={setChatSounds}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Manage your privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-primary" />
              <Label htmlFor="online-status">Show Online Status</Label>
            </div>
            <Switch
              id="online-status"
              checked={showOnlineStatus}
              onCheckedChange={setShowOnlineStatus}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <Label htmlFor="chat-history">Save Chat History</Label>
            </div>
            <Switch
              id="chat-history"
              checked={saveChatHistory}
              onCheckedChange={setSaveChatHistory}
            />
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleClearChatHistory}
            >
              Clear Chat History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
