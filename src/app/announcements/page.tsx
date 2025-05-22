'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { getAnnouncements, Announcement } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaPlus, FaEdit, FaTrash, FaBullhorn, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, markAnnouncementsAsSeen, getSeenAnnouncementIds } from '@/lib/utils';
import { 
  addAnnouncement as addAnnouncementToDb, 
  updateAnnouncement as updateAnnouncementInDb,
  deleteAnnouncement as deleteAnnouncementFromDb,
  fetchAnnouncements
} from '@/lib/db-service';
import { useAuth } from '@/lib/auth-context';

// Safe localStorage access that only runs on the client
const getLocalStorage = (key: string, defaultValue: any = null) => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`Error getting localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setLocalStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

// AnnouncementForm component for adding/editing announcements
function AnnouncementForm({ 
  onSave, 
  onCancel, 
  announcementToEdit 
}: { 
  onSave: (announcement: Announcement) => void; 
  onCancel: () => void; 
  announcementToEdit?: Announcement;
}) {
  const [title, setTitle] = useState(announcementToEdit?.title || '');
  const [content, setContent] = useState(announcementToEdit?.content || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(announcementToEdit?.priority || 'medium');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const currentDate = format(now, 'yyyy-MM-dd');
    
    // Only include the ID if it's an edit
    const announcement: Omit<Announcement, 'id'> & { id?: string } = {
      title,
      content,
      date: currentDate,
      timestamp: now.toISOString(),
      priority,
      author: 'Administrator',
    };
    
    // Add the id only for editing
    if (announcementToEdit?.id) {
      announcement.id = announcementToEdit.id;
    }
    
    onSave(announcement as Announcement);
  };
  
  return (
    <Card className="w-full shadow-lg border-0 mb-6">
      <CardHeader className="bg-primary text-white">
        <CardTitle className="text-xl">{announcementToEdit ? 'Edit Announcement' : 'New Announcement'}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="bg-white resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as 'high' | 'medium' | 'low')}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-white">
              {announcementToEdit ? 'Update' : 'Create'} Announcement
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Array<Announcement>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>(undefined);
  const { user } = useAuth();
  const isAdmin = !!user; // User is logged in = admin
  
  // Initialize announcements from localStorage + sample data
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        console.log('Debug - Announcements page loaded');
        
        // Fetch announcements from Supabase and ensure it's the correct type
        const fetchedAnnouncements = await fetchAnnouncements();
        
        // Filter out any null values and ensure type safety
        const validAnnouncements = fetchedAnnouncements
          .filter(Boolean) as Announcement[];
        
        // Set announcements state with the fetched data
        setAnnouncements(validAnnouncements);
        
        // Mark all loaded announcements as seen
        const announcementIds = validAnnouncements.map(a => a.id);
        console.log('Marking announcements as seen:', announcementIds);
        markAnnouncementsAsSeen(announcementIds);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast.error("Failed to load announcements");
        
        // Fallback to sample data
        const sampleAnnouncements = getAnnouncements();
        setAnnouncements(sampleAnnouncements);
        
        // Mark sample announcements as seen too
        if (sampleAnnouncements.length > 0) {
          markAnnouncementsAsSeen(sampleAnnouncements.map(a => a.id));
        }
      }
    };
    
    loadAnnouncements();
  }, []);
  
  const handleSaveAnnouncement = async (announcement: Announcement) => {
    // Check if this is an edit of an existing announcement
    const isEdit = announcements.some(a => a.id === announcement.id);
    
    try {
      let result: Announcement | null = null;
      
      if (isEdit) {
        // Update the announcement
        result = await updateAnnouncementInDb(announcement.id, announcement);
        
        if (result) {
          // Update local state with non-null result
          const updatedAnnouncements = announcements.map(a => 
            a.id === announcement.id ? result! : a
          ) as Announcement[];
          setAnnouncements(updatedAnnouncements);
          toast.success("Announcement updated successfully!");
        } else {
          toast.error("Failed to update announcement");
        }
      } else {
        // Add a new announcement
        result = await addAnnouncementToDb(announcement);
        
        if (result) {
          // Update local state with the result that includes the ID
          setAnnouncements([...announcements, result]);
          toast.success("Announcement created successfully!");
        } else {
          toast.error("Failed to add announcement");
        }
      }
      
      setShowForm(false);
      setEditingAnnouncement(undefined);
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Error saving announcement: " + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };
  
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      // Delete from localStorage
      const success = await deleteAnnouncementFromDb(id);
      
      if (success) {
        // Remove from displayed announcements
        const updatedAnnouncements = announcements.filter(a => a.id !== id);
        setAnnouncements(updatedAnnouncements);
        toast.success("Announcement deleted successfully!");
      } else {
        toast.error("Failed to delete announcement");
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement. Please try again.");
    }
  };
  
  // Sort announcements by date (newest first)
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Function to get appropriate badge style based on priority
  const getBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'medium':
        return 'bg-amber-500 text-white hover:bg-amber-600';
      default:
        return 'bg-blue-500 text-white hover:bg-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-4"
            onClick={() => router.push('/')}
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => {
              setEditingAnnouncement(undefined);
              setShowForm(true);
            }}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>
      
      {showForm && isAdmin && (
        <AnnouncementForm 
          onSave={handleSaveAnnouncement}
          onCancel={() => {
            setShowForm(false);
            setEditingAnnouncement(undefined);
          }}
          announcementToEdit={editingAnnouncement}
        />
      )}
      
      <div className="grid gap-6">
        {sortedAnnouncements.length > 0 ? (
          sortedAnnouncements.map((announcement) => {
            // Determine if this announcement has been seen before
            const seenIds = getSeenAnnouncementIds();
            const isNew = !seenIds.includes(announcement.id);
            
            return (
              <Card 
                key={announcement.id} 
                className="overflow-hidden relative"
              >
                {isNew && (
                  <div className="absolute top-0 right-0">
                    <div className="w-32 bg-green-500 text-white text-xs font-bold py-1 text-center transform rotate-45 translate-x-8 translate-y-3">
                      NEW
                    </div>
                  </div>
                )}
                <CardHeader className="bg-slate-50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className={getBadgeStyle(announcement.priority)}>
                        {announcement.priority.toUpperCase()}
                      </Badge>
                      <CardTitle className="mt-2 text-xl">{announcement.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {announcement.date} at {format(new Date(announcement.timestamp), 'h:mm a')} by {announcement.author}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEditAnnouncement(announcement)}
                          >
                            <FaEdit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 whitespace-pre-wrap">
                  {announcement.content}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <FaBullhorn className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Announcements Yet</h3>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? "There are no announcements posted yet. Create one to get started."
                  : "There are no announcements posted yet."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 