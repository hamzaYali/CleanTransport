import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FaBullhorn, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { DatePicker } from '@/components/ui/date-picker';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

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
  const { user, signOut } = useAuth();
  
  // Handle click on announcements button
  const handleAnnouncementsClick = () => {
    router.push('/announcements');
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out of admin');
      router.push('/'); // Stay on schedule page since site password is still valid
    } catch (error) {
      toast.error('Failed to sign out');
      console.error('Sign out error:', error);
    }
  };

  const handleSiteLogout = () => {
    Cookies.remove('site_authenticated');
    signOut(); // Also sign out of admin when exiting site
    toast.success('Logged out of site');
    router.push('/auth');
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
          className="bg-white/10 hover:bg-white/20 text-white" 
          onClick={handleAnnouncementsClick}
        >
          <FaBullhorn className="mr-2 h-5 w-5" />
          Announcements
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => window.open('https://forms.office.com/Pages/ResponsePage.aspx?id=bYdLbkfZPUOYDCNz1yij-T-U7_DMDzBMvlEMDtKlwEtUNTJGMFlGVzZFSU1GQjI3NldVNzUyRFhRWi4u', '_blank')}
        >
          Request Transport
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
                Sign out of Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSiteLogout}>
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                Exit Site
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