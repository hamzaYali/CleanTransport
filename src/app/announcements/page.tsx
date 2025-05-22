'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { getAnnouncements, Announcement } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FaPlus, FaEdit, FaTrash, FaBullhorn, FaArrowLeft, 
  FaSearch, FaFilter, FaEye, FaCalendarAlt, FaStar
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, markAnnouncementsAsSeen, getSeenAnnouncementIds } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      // Author will be set by the database service based on the logged-in user
      author: announcementToEdit?.author || '',
    };
    
    // Add the id only for editing
    if (announcementToEdit?.id) {
      announcement.id = announcementToEdit.id;
    }
    
    onSave(announcement as Announcement);
  };
  
  return (
    <Card className="w-full shadow-lg border-0 mb-6 animate-in fade-in-50 duration-300">
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

// Card view of a single announcement
function AnnouncementCard({ 
  announcement, 
  isNew,
  isAdmin, 
  onEdit, 
  onDelete,
  onMarkRead
}: {
  announcement: Announcement,
  isNew: boolean,
  isAdmin: boolean,
  onEdit: (announcement: Announcement) => void,
  onDelete: (id: string) => void,
  onMarkRead: (id: string) => void
}) {
  // Format the date to show "Today", "Yesterday", or the actual date
  const formatAnnouncementDate = (dateStr: string, timestampStr: string) => {
    const timestamp = new Date(timestampStr);
    const timeString = format(timestamp, 'h:mm a');
    
    if (isToday(timestamp)) {
      return `Today at ${timeString}`;
    } else if (isYesterday(timestamp)) {
      return `Yesterday at ${timeString}`;
    } else {
      return `${format(timestamp, 'MMM dd, yyyy')} at ${timeString}`;
    }
  };
  
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
    <Card 
      className={cn(
        "overflow-hidden relative",
        isNew ? "border-l-4 border-l-green-500" : "",
        announcement.priority === 'high' ? "border-l-4 border-l-red-500" : "",
        announcement.priority === 'medium' ? "border-l-4 border-l-amber-500" : "",
        announcement.priority === 'low' ? "border-l-4 border-l-blue-500" : ""
      )}
    >
      {isNew && (
        <div className="absolute top-0 right-0 z-10">
          <div className="w-32 bg-green-500 text-white text-xs font-bold py-1 text-center transform rotate-45 translate-x-8 translate-y-3">
            NEW
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Badge className={getBadgeStyle(announcement.priority)}>
            {announcement.priority.toUpperCase()}
          </Badge>
          {isNew && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs flex items-center gap-1 h-6 px-2 text-green-600 hover:text-green-800"
              onClick={() => onMarkRead(announcement.id)}
            >
              <FaEye className="h-3 w-3" /> Mark as read
            </Button>
          )}
          {isAdmin && (
            <div className="flex space-x-2 ml-auto">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onEdit(announcement)}
              >
                <FaEdit className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onDelete(announcement.id)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-1">{announcement.title}</h2>
        <div className="text-sm text-gray-500 flex items-center gap-1 mb-4">
          <FaCalendarAlt className="h-3 w-3" />
          {formatAnnouncementDate(announcement.date, announcement.timestamp)}
          <span className="mx-1">•</span>
          <span className="font-medium">{announcement.author}</span>
        </div>
        
        <div className="whitespace-pre-wrap">
          {announcement.content}
        </div>
      </div>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  
  // Get seen announcement IDs from localStorage
  const seenIds = useMemo(() => getSeenAnnouncementIds(), [announcements]);
  
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
        
        // DON'T mark all loaded announcements as seen automatically
        // This was the previous bug - let users mark them as read manually
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast.error("Failed to load announcements");
        
        // Fallback to sample data
        const sampleAnnouncements = getAnnouncements();
        setAnnouncements(sampleAnnouncements);
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
      // Delete from database
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
  
  const handleMarkAsRead = (id: string) => {
    markAnnouncementsAsSeen([id]);
    toast.success("Marked as read");
    // Force a re-render to update the UI
    setAnnouncements([...announcements]);
  };

  // Filter announcements based on search, priority, and tabs
  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter(a => {
        // Text search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            a.title.toLowerCase().includes(query) || 
            a.content.toLowerCase().includes(query) ||
            a.author.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .filter(a => {
        // Priority filter
        if (priorityFilter !== 'all') {
          return a.priority === priorityFilter;
        }
        return true;
      })
      .filter(a => {
        // Tab filter
        if (activeTab === 'unread') {
          return !seenIds.includes(a.id);
        }
        return true;
      });
  }, [announcements, searchQuery, priorityFilter, activeTab, seenIds]);
  
  // Sort announcements by date (newest first)
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Calculate counts for tabs
  const unreadCount = announcements.filter(a => !seenIds.includes(a.id)).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-4"
            onClick={() => router.push('/')}
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back
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
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:w-1/2">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search announcements..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 self-end">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <span className="flex items-center gap-2">
                <FaFilter className="h-3 w-3" />
                <SelectValue placeholder="Filter by priority" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6 p-1 bg-gray-100 rounded-full w-fit">
          <TabsTrigger value="all" className="rounded-full px-6">
            All Announcements
            <Badge className="ml-2 bg-gray-500 text-white">{announcements.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-full px-6">
            Unread
            {unreadCount > 0 && <Badge className="ml-2 bg-green-500 text-white">{unreadCount}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="grid gap-6 animate-in fade-in-50 duration-300">
            {sortedAnnouncements.length > 0 ? (
              sortedAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isNew={!seenIds.includes(announcement.id)}
                  isAdmin={isAdmin}
                  onEdit={handleEditAnnouncement}
                  onDelete={handleDeleteAnnouncement}
                  onMarkRead={handleMarkAsRead}
                />
              ))
            ) : (
              <EmptyState query={searchQuery} filter={priorityFilter} tab={activeTab} />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          <div className="grid gap-6 animate-in fade-in-50 duration-300">
            {sortedAnnouncements.length > 0 ? (
              sortedAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isNew={!seenIds.includes(announcement.id)}
                  isAdmin={isAdmin}
                  onEdit={handleEditAnnouncement}
                  onDelete={handleDeleteAnnouncement}
                  onMarkRead={handleMarkAsRead}
                />
              ))
            ) : (
              <EmptyState query={searchQuery} filter={priorityFilter} tab={activeTab} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ query, filter, tab }: { query: string, filter: string, tab: string }) {
  // Create appropriate empty state message based on filters
  let message = "There are no announcements yet.";
  
  if (query) {
    message = `No announcements match your search "${query}".`;
  } else if (filter !== 'all') {
    message = `No ${filter} priority announcements found.`;
  } else if (tab === 'unread') {
    message = "You've read all announcements.";
  }
  
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
        <FaBullhorn className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Announcements Found</h3>
        <p className="text-muted-foreground">
          {message}
        </p>
      </CardContent>
    </Card>
  );
} 