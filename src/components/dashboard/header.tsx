import React, { useEffect, useState } from 'react';
import { cn, countNewAnnouncements, updateLastAnnouncementView } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FaBullhorn, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { DatePicker } from '@/components/ui/date-picker';
import { useRouter } from 'next/navigation';
import { getAnnouncements } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Safe localStorage access functions
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

interface DashboardHeaderProps {
  date: Date;
  onPreviousDate: () => void;
  onNextDate: () => void;
  onTodayClick: () => void;
  onDateSelect: (date: Date) => void;
}

export function DashboardHeader({
  date,
  onPreviousDate,
  onNextDate,
  onTodayClick,
  onDateSelect,
}: DashboardHeaderProps) {
  const formattedDate = format(date, 'MMMM d, yyyy');
  const router = useRouter();
  const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);
  const { user, signOut } = useAuth();
  
  // Calculate number of new announcements
  useEffect(() => {
    // Fetch announcements and count new ones
    const loadAndCountAnnouncements = async () => {
      try {
        // Use local data for announcements
        const userAnnouncements = getLocalStorage('userAnnouncements', []);
        const sampleAnnouncements = getAnnouncements();
        const deletedAnnouncementIds = getLocalStorage('deletedAnnouncementIds', []);
        
        // Filter out deleted sample announcements
        const filteredSampleAnnouncements = sampleAnnouncements.filter(
          announcement => !deletedAnnouncementIds.includes(announcement.id)
        );
        
        // Combine announcements
        const allAnnouncements = [...filteredSampleAnnouncements, ...userAnnouncements];
        
        // Count new announcements (ones posted since last view)
        const count = countNewAnnouncements(allAnnouncements);
        setNewAnnouncementsCount(count);
      } catch (error) {
        console.error("Error processing announcements:", error);
      }
    };
    
    loadAndCountAnnouncements();
  }, []);
  
  // Handle click on announcements button
  const handleAnnouncementsClick = () => {
    // Update the last viewed time
    updateLastAnnouncementView();
    
    // Navigate to announcements page
    router.push('/announcements');
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 bg-primary p-4 rounded-lg text-white mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transport Schedule</h1>
        <p className="text-white/80">{formattedDate}</p>
      </div>
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={onPreviousDate}>
            Previous
          </Button>
          <Button variant="secondary" size="sm" onClick={onTodayClick}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={onNextDate}>
            Next
          </Button>
        </div>
        <DatePicker 
          date={date}
          onSelect={onDateSelect}
        />
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white/10 hover:bg-white/20 text-white relative"
          onClick={handleAnnouncementsClick}
        >
          <FaBullhorn className="mr-2 h-4 w-4" />
          Announcements
          {newAnnouncementsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {newAnnouncementsCount}
            </span>
          )}
        </Button>
        
        {user ? (
          // Show admin controls if logged in
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <FaUserCircle className="mr-2 h-4 w-4" />
                Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Show login button if not logged in
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={() => router.push('/login')}
          >
            <FaUserCircle className="mr-2 h-4 w-4" />
            Admin Login
          </Button>
        )}
      </div>
    </div>
  );
} 