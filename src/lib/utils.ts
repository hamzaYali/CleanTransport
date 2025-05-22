import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the last time announcements were viewed
export function getLastAnnouncementView(): number {
  if (typeof window === 'undefined') return 0;
  const ts = localStorage.getItem('lastAnnouncementView');
  return ts ? parseInt(ts, 10) : 0;
}

// Update the last time announcements were viewed
export function updateLastAnnouncementView() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lastAnnouncementView', Date.now().toString());
}

// Count new announcements since last view
export function countNewAnnouncements(announcements: { timestamp: string }[]): number {
  const lastSeen = getLastAnnouncementView();
  return announcements.filter(a => new Date(a.timestamp).getTime() > lastSeen).length;
}
