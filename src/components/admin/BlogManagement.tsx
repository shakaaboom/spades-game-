
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Edit, Trash2, ChevronRight } from "lucide-react";

export const BlogManagement = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Mock data - would come from API in real implementation
  const blogs = [
    {
      id: "blog_1",
      title: "Introduction to Spades Strategy",
      excerpt: "Learn the fundamentals of strategic play in Spades...",
      publishDate: "Jul 10, 2023",
      author: "Admin",
      status: "published",
      image: ""
    },
    {
      id: "blog_2",
      title: "Advanced Bidding Techniques",
      excerpt: "Master the art of precise bidding with these expert tips...",
      publishDate: "Jul 5, 2023",
      author: "Admin",
      status: "published",
      image: ""
    },
    {
      id: "blog_3",
      title: "Upcoming Tournament Announcement",
      excerpt: "Get ready for our biggest tournament yet with $1000 in prizes...",
      publishDate: "Jun 28, 2023",
      author: "Admin",
      status: "published",
      image: ""
    },
    {
      id: "blog_4",
      title: "Partner Communication in Spades",
      excerpt: "Effective signaling and communication strategies for team play...",
      publishDate: "Draft",
      author: "Admin",
      status: "draft",
      image: ""
    }
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = (isDraft: boolean = false) => {
    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a title for your blog post",
        variant: "destructive",
      });
      return;
    }

    if (!content) {
      toast({
        title: "Content required",
        description: "Please enter some content for your blog post",
        variant: "destructive",
      });
      return;
    }

    // Handle blog publishing - would use API in real implementation
    toast({
      title: isDraft ? "Draft saved" : "Blog published",
      description: `"${title}" has been ${isDraft ? 'saved as a draft' : 'published'} successfully`,
    });

    // Reset form
    setTitle("");
    setContent("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (blogId: string, blogTitle: string) => {
    toast({
      title: "Edit blog",
      description: `Editing blog "${blogTitle}"`,
    });
    // In a real implementation, we would load the blog data into the form
  };

  const handleDelete = (blogId: string, blogTitle: string) => {
    toast({
      title: "Delete blog",
      description: `Blog "${blogTitle}" has been deleted`,
    });
    // In a real implementation, we would delete the blog via API
  };

  return (
    <Tabs defaultValue="create" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create">Create Blog Post</TabsTrigger>
        <TabsTrigger value="manage">Manage Posts</TabsTrigger>
      </TabsList>
      
      <TabsContent value="create">
        <Card>
          <CardHeader>
            <CardTitle>Create New Blog Post</CardTitle>
            <CardDescription>
              Write and publish blog posts to engage with your user community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Blog Title</Label>
                <Input
                  id="title"
                  placeholder="Enter blog title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Blog Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your blog content here..."
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Featured Image</Label>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('image')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Image className="h-4 w-4" />
                    Upload Image
                  </Button>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imageFile && (
                    <span className="text-sm text-muted-foreground">
                      {imageFile.name}
                    </span>
                  )}
                </div>
                
                {imagePreview && (
                  <div className="mt-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-40 rounded-md object-cover" 
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => handlePublish(true)}>
                  Save as Draft
                </Button>
                <Button onClick={() => handlePublish(false)}>
                  Publish Blog
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="manage">
        <Card>
          <CardHeader>
            <CardTitle>Blog Posts</CardTitle>
            <CardDescription>
              Manage your existing blog posts and drafts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div 
                  key={blog.id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                  <div className="flex-shrink-0">
                    {blog.image ? (
                      <img 
                        src={blog.image} 
                        alt={blog.title} 
                        className="w-20 h-20 rounded-md object-cover" 
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground opacity-50" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium">{blog.title}</h3>
                      {blog.status === "draft" && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback>{blog.author.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        {blog.author}
                      </div>
                      <span>{blog.publishDate}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 md:ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(blog.id, blog.title)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(blog.id, blog.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
