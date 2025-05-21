
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const NotificationsManagement = () => {
  const [notificationType, setNotificationType] = useState("global");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationContent, setNotificationContent] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [isPersistent, setIsPersistent] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  // Mock data - would come from API in real implementation
  const users = [
    { id: "usr_1", name: "Alex Johnson" },
    { id: "usr_2", name: "Sarah Williams" },
    { id: "usr_3", name: "Miguel Rodriguez" },
    { id: "usr_4", name: "Leila Patel" },
    { id: "usr_5", name: "James Wilson" }
  ];

  const handleSendNotification = () => {
    if (!notificationTitle || !notificationContent) {
      toast({
        title: "Missing fields",
        description: "Please fill out both title and content",
        variant: "destructive",
      });
      return;
    }

    if (notificationType === "individual" && !targetUser) {
      toast({
        title: "Missing target user",
        description: "Please select a user to send the notification to",
        variant: "destructive",
      });
      return;
    }

    // Handle notification sending - would use API in real implementation
    toast({
      title: "Notification sent",
      description: `${notificationType === "global" ? "Global" : "Individual"} notification sent ${notificationType === "individual" ? `to ${users.find(u => u.id === targetUser)?.name}` : "to all users"}`,
    });

    // Reset form
    setNotificationTitle("");
    setNotificationContent("");
    setIsPersistent(false);
    setIsUrgent(false);
    if (notificationType === "individual") {
      setTargetUser("");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
          <CardDescription>
            Create and send notifications to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select
                value={notificationType}
                onValueChange={setNotificationType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Announcement</SelectItem>
                  <SelectItem value="individual">Individual Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {notificationType === "individual" && (
              <div className="space-y-2">
                <Label>Target User</Label>
                <Select
                  value={targetUser}
                  onValueChange={setTargetUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="Enter notification title"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Notification Content</Label>
              <Textarea
                id="content"
                placeholder="Enter notification content"
                rows={4}
                value={notificationContent}
                onChange={(e) => setNotificationContent(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="persistent"
                checked={isPersistent}
                onCheckedChange={setIsPersistent}
              />
              <Label htmlFor="persistent">Persistent (requires user acknowledgment)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="urgent"
                checked={isUrgent}
                onCheckedChange={setIsUrgent}
              />
              <Label htmlFor="urgent">Mark as Urgent</Label>
            </div>

            <Button onClick={handleSendNotification} className="w-full">
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            History of recently sent notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "notif_1",
                title: "System Maintenance",
                content: "The system will be undergoing maintenance on Saturday from 2-4 AM EST.",
                type: "global",
                date: "Jul 12, 2023",
                urgent: true
              },
              {
                id: "notif_2",
                title: "New Game Mode Available",
                content: "Try out our new tournament mode with increased rewards!",
                type: "global",
                date: "Jul 10, 2023",
                urgent: false
              },
              {
                id: "notif_3",
                title: "Account Verification",
                content: "Please verify your account to unlock withdrawal functionality.",
                type: "individual",
                recipient: "Leila Patel",
                date: "Jul 8, 2023",
                urgent: true
              },
              {
                id: "notif_4",
                title: "Bonus Credits Added",
                content: "You've received 50 bonus credits for referring a friend!",
                type: "individual",
                recipient: "Miguel Rodriguez",
                date: "Jul 5, 2023",
                urgent: false
              }
            ].map((notif) => (
              <div key={notif.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{notif.title}</h3>
                  {notif.urgent && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{notif.content}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {notif.type === "global" ? "Global" : `Sent to ${notif.recipient}`}
                  </span>
                  <span>{notif.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
