import React, { useEffect, useState } from 'react';
import { cn, countNewAnnouncements, updateLastAnnouncementView } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FaUser, FaSignOutAlt, FaBullhorn } from 'react-icons/fa';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { getAnnouncements } from '@/lib/data';
import { fetchAnnouncements } from '@/lib/db-service';

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
  onLoginClick: () => void;
  onDateSelect: (date: Date) => void;
}

export function DashboardHeader({
  date,
  onPreviousDate,
  onNextDate,
  onTodayClick,
  onLoginClick,
  onDateSelect,
}: DashboardHeaderProps) {
  const formattedDate = format(date, 'MMMM d, yyyy');
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);
  
  // Calculate number of new announcements
  useEffect(() => {
    // Fetch announcements and count new ones
    const loadAndCountAnnouncements = async () => {
      try {
        // Fetch announcements from Supabase
        const dbAnnouncements = await fetchAnnouncements();
        
        // Count new announcements (ones posted since last view)
        const count = countNewAnnouncements(dbAnnouncements);
        setNewAnnouncementsCount(count);
      } catch (error) {
        console.error("Error fetching announcements for counter:", error);
        
        // Fallback to local data if Supabase fetch fails
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

  // Update the handleLogout function
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout process:", error);
      // Fallback direct navigation if there's an error
      window.location.href = '/';
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
        {isAuthenticated ? (
          <div className="flex items-center space-x-2">
            <span className="text-white/80">
              Welcome, {user?.username}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 hover:bg-white/20 text-white" 
              onClick={handleLogout}
            >
              <FaSignOutAlt className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white" onClick={onLoginClick}>
            <FaUser className="mr-2 h-4 w-4" />
            Login
          </Button>
        )}
      </div>
    </div>
  );
} 