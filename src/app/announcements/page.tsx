'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
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
import { updateLastAnnouncementView } from '@/lib/utils';
import { 
  addAnnouncement as addAnnouncementToDb, 
  updateAnnouncement as updateAnnouncementInDb,
  deleteAnnouncement as deleteAnnouncementFromDb,
  fetchAnnouncements
} from '@/lib/db-service';

// Helper function to create a new unique ID
const generateId = () => `A-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

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
  const { user } = useAuth();
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
      author: user?.username || 'Admin',
    };
    
    // Add the id only for editing, so new announcements get a proper UUID from Supabase
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
  const { user, isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>(undefined);
  
  // Initialize announcements from localStorage + sample data and mark as viewed
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        // Fetch announcements from Supabase
        const dbAnnouncements = await fetchAnnouncements();
        
        setAnnouncements(dbAnnouncements);
        
        // Mark announcements as viewed
        updateLastAnnouncementView();
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast.error("Failed to load announcements");
        
        // Fallback to local announcements if Supabase fetch fails
        const userAnnouncements = getLocalStorage('userAnnouncements', []);
        const sampleAnnouncements = getAnnouncements();
        const deletedAnnouncementIds = getLocalStorage('deletedAnnouncementIds', []);
        
        // Filter out deleted sample announcements
        const filteredSampleAnnouncements = sampleAnnouncements.filter(
          announcement => !deletedAnnouncementIds.includes(announcement.id)
        );
        
        setAnnouncements([...filteredSampleAnnouncements, ...userAnnouncements]);
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
        // Update the announcement in Supabase
        result = await updateAnnouncementInDb(announcement.id, announcement);
        
        if (result) {
          // Update local state
          const updatedAnnouncements = announcements.map(a => 
            a.id === announcement.id ? result : a
          );
          setAnnouncements(updatedAnnouncements);
          toast.success("Announcement updated successfully!");
        } else {
          toast.error("Failed to update announcement in database");
        }
      } else {
        // Add a new announcement to Supabase
        result = await addAnnouncementToDb(announcement);
        
        if (result) {
          // Update local state with the result from Supabase that includes the ID
          setAnnouncements([...announcements, result]);
          toast.success("Announcement created successfully!");
        } else {
          toast.error("Failed to add announcement to database");
        }
      }
      
      setShowForm(false);
      setEditingAnnouncement(undefined);
    } catch (error) {
      console.error("Error saving announcement to Supabase:", error);
      toast.error("Error saving announcement: " + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };
  
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      // Delete from Supabase
      const success = await deleteAnnouncementFromDb(id);
      
      if (success) {
        // Remove from displayed announcements
        const updatedAnnouncements = announcements.filter(a => a.id !== id);
        setAnnouncements(updatedAnnouncements);
        toast.success("Announcement deleted successfully!");
      } else {
        toast.error("Failed to delete announcement from database");
      }
    } catch (error) {
      console.error("Error deleting announcement from Supabase:", error);
      toast.error("Error deleting announcement: " + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  // Sort announcements by timestamp (newest first)
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    // Sort by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/')}
            className="mb-2 sm:mb-0"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
          <h1 className="text-2xl font-bold">Announcements</h1>
        </div>
        
        {isAuthenticated && user?.isAdmin && (
          <Button 
            onClick={() => {
              setEditingAnnouncement(undefined);
              setShowForm(true);
            }}
            className="bg-secondary hover:bg-secondary-hover text-secondary-foreground"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>
      
      {isAuthenticated && user?.isAdmin && showForm && (
        <AnnouncementForm 
          onSave={handleSaveAnnouncement}
          onCancel={() => {
            setShowForm(false);
            setEditingAnnouncement(undefined);
          }}
          announcementToEdit={editingAnnouncement}
        />
      )}
      
      <div className="space-y-4">
        {sortedAnnouncements.length > 0 ? (
          sortedAnnouncements.map(announcement => (
            <Card key={announcement.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <FaBullhorn className="text-primary h-4 w-4" />
                      {announcement.title}
                      {announcement.date === format(new Date(), 'yyyy-MM-dd') && (
                        <Badge variant="success" className="ml-2 text-[10px] h-5 px-1.5">NEW</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      Posted: {format(parseISO(announcement.date), 'MMM dd, yyyy')} at {format(parseISO(announcement.timestamp), 'h:mm a')} by {announcement.author}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={
                      announcement.priority === 'high' ? 'danger' : 
                      announcement.priority === 'medium' ? 'warning' : 'info'
                    }
                  >
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
              {isAuthenticated && user?.isAdmin && (
                <CardFooter className="pt-2 pb-4 flex justify-end">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAnnouncement(announcement)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      <FaEdit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <FaTrash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <FaBullhorn className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <p className="text-gray-500 mb-2">No announcements available.</p>
            {isAuthenticated && user?.isAdmin && (
              <Button 
                onClick={() => {
                  setEditingAnnouncement(undefined);
                  setShowForm(true);
                }}
                variant="outline"
                className="mt-4"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Create your first announcement
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 