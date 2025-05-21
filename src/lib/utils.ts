import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the last time announcements were viewed
export function getLastAnnouncementView(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('lastAnnouncementView');
  } catch (error) {
    console.error('Error getting last announcement view time:', error);
    return null;
  }
}

// Update the last time announcements were viewed
export function updateLastAnnouncementView(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('lastAnnouncementView', new Date().toISOString());
  } catch (error) {
    console.error('Error updating last announcement view time:', error);
  }
}

// Count new announcements since last view
export function countNewAnnouncements(announcements: any[]): number {
  const lastViewTime = getLastAnnouncementView();
  
  if (!lastViewTime) {
    // If never viewed before, all announcements are new
    return announcements.length;
  }
  
  const lastViewDate = new Date(lastViewTime);
  
  // Count announcements with timestamps newer than lastViewTime
  return announcements.filter(announcement => {
    const announcementDate = new Date(announcement.timestamp);
    return announcementDate > lastViewDate;
  }).length;
}
