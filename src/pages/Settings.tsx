import { useState } from "react";
import { User, CreditCard, Moon, Sun, Bell, MessageSquare, Trash2, Upload } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/ui/theme-provider";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme, isDarkMode } = useTheme();
  const [displayName, setDisplayName] = useState("Player123");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chatSoundsEnabled, setChatSoundsEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
  };

  const handleClearChatHistory = () => {
    toast({
      title: "Chat History Cleared",
      description: "Your chat history has been deleted.",
    });
  };

  const handleToggleDarkMode = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
    toast({
      title: "Theme Changed",
      description: `Theme switched to ${checked ? "dark" : "light"} mode.`,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
        });
      }, 1500);
    }
  };

  return (
    <Layout>
      <main className="flex-grow pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile, appearance, and notification preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="mb-8">
            <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account profile details and public information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
                          <AvatarFallback>
                            <User className="h-12 w-12" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0">
                          <Button 
                            variant="secondary" 
                            size="icon"
                            className="h-8 w-8 rounded-full shadow"
                            onClick={() => document.getElementById("avatar-upload")?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                          <input 
                            type="file" 
                            id="avatar-upload" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </div>
                      </div>
                      
                      <div className="flex-grow space-y-4">
                        <div>
                          <Label htmlFor="display-name">Display Name</Label>
                          <Input 
                            id="display-name" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-email">Email Address</Label>
                          <Input 
                            id="user-email" 
                            type="email" 
                            value="player@example.com"
                            disabled
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            To change your email, please contact support
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>
                      Manage your deposit and withdrawal options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-medium">Payment Methods</p>
                            <p className="text-sm text-muted-foreground">
                              Add or remove payment methods
                            </p>
                          </div>
                        </div>
                        <Button variant="outline">Manage</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the app looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isDarkMode ? (
                        <Moon className="h-5 w-5 text-primary" />
                      ) : (
                        <Sun className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Toggle between light and dark themes
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={isDarkMode}
                      onCheckedChange={handleToggleDarkMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Configure your notification and sound preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Bell className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Game Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive alerts for game invites and turn reminders
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Chat Sound Effects</p>
                        <p className="text-sm text-muted-foreground">
                          Play sounds when receiving chat messages
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={chatSoundsEnabled}
                      onCheckedChange={setChatSoundsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Trash2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Chat History</p>
                        <p className="text-sm text-muted-foreground">
                          Clear your in-game chat history
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleClearChatHistory}
                    >
                      Clear History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </Layout>
  );
};

export default Settings;
