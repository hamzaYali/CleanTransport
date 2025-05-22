import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the list of announcement IDs the user has seen
export function getSeenAnnouncementIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const seenIds = localStorage.getItem('seenAnnouncementIds');
    return seenIds ? JSON.parse(seenIds) : [];
  } catch (error) {
    console.error('Error getting seen announcements:', error);
    return [];
  }
}

// Mark announcements as seen
export function markAnnouncementsAsSeen(announcementIds: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const currentSeenIds = getSeenAnnouncementIds();
    const allSeenIds = [...new Set([...currentSeenIds, ...announcementIds])]; // Deduplicate
    localStorage.setItem('seenAnnouncementIds', JSON.stringify(allSeenIds));
    console.log('Marked announcements as seen:', announcementIds);
    console.log('All seen announcements:', allSeenIds);
  } catch (error) {
    console.error('Error marking announcements as seen:', error);
  }
}

// Check if there are any unseen announcements
export function hasUnseenAnnouncements(announcements: { id: string }[]): boolean {
  if (announcements.length === 0) return false;
  
  const seenIds = getSeenAnnouncementIds();
  const unseenAnnouncements = announcements.filter(a => !seenIds.includes(a.id));
  
  console.log('Unseen announcements:', unseenAnnouncements.length);
  return unseenAnnouncements.length > 0;
}

// Count unseen announcements
export function countUnseenAnnouncements(announcements: { id: string }[]): number {
  if (announcements.length === 0) return 0;
  
  const seenIds = getSeenAnnouncementIds();
  const unseenAnnouncements = announcements.filter(a => !seenIds.includes(a.id));
  
  return unseenAnnouncements.length;
}
