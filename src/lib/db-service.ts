import { format, addDays } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { TABLES } from './supabase';
import { Transport, Announcement, DaySchedule } from './data';

// Create Supabase client - recreate on each call to prevent stale client issues
function getSupabaseClient() {
  return createClient();
}

// ===== Transport Operations =====

/**
 * Get transports scheduled for a specific date
 */
export async function fetchTransportsByDate(date: string): Promise<Transport[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.TRANSPORTS)
      .select('*')
      .eq('pickup_date', date)
      .order('pickup_time');
    
    if (error) {
      console.error('Error fetching transports:', error);
      return [];
    }
    
    // Transform from database schema to application schema
    return data.map(item => ({
      id: item.id,
      client: {
        name: item.client_name,
        phone: item.client_phone,
      },
      pickup: {
        location: item.pickup_location,
        time: item.pickup_time,
        date: item.pickup_date,
      },
      dropoff: {
        location: item.dropoff_location,
        time: item.dropoff_time,
        date: item.dropoff_date,
      },
      staff: {
        requestedBy: item.staff_requester,
        driver: item.staff_driver,
        assistant: item.staff_assistant || undefined,
      },
      clientCount: item.client_count,
      status: item.status,
      notes: item.notes || undefined,
      vehicle: item.vehicle || undefined,
      carSeats: item.car_seats || 0,
    }));
  } catch (error) {
    console.error('Error fetching transports:', error);
    return [];
  }
}

/**
 * Get transports for the next 7 days
 */
export async function fetchWeeklySchedule(): Promise<DaySchedule[]> {
  const weeklySchedule: DaySchedule[] = [];
  const today = new Date();
  
  try {
    // Prepare dates for the next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const currentDate = addDays(today, i);
      return format(currentDate, 'yyyy-MM-dd');
    });
    
    // Fetch all transports for the week in a single query
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.TRANSPORTS)
      .select('*')
      .in('pickup_date', dates)
      .order('pickup_time');
    
    if (error) {
      console.error('Error fetching weekly schedule:', error);
      // Return empty schedule with dates
      return dates.map(date => ({
        date,
        transports: [],
      }));
    }
    
    // Transform from database schema to application schema
    const transformedData = data.map(item => ({
      id: item.id,
      client: {
        name: item.client_name,
        phone: item.client_phone,
      },
      pickup: {
        location: item.pickup_location,
        time: item.pickup_time,
        date: item.pickup_date,
      },
      dropoff: {
        location: item.dropoff_location,
        time: item.dropoff_time,
        date: item.dropoff_date,
      },
      staff: {
        requestedBy: item.staff_requester,
        driver: item.staff_driver,
        assistant: item.staff_assistant || undefined,
      },
      clientCount: item.client_count,
      status: item.status,
      notes: item.notes || undefined,
      vehicle: item.vehicle || undefined,
      carSeats: item.car_seats || 0,
    }));
    
    // Group by date
    for (const date of dates) {
      const transportsForDay = transformedData.filter(
        transport => transport.pickup.date === date
      );
      
      weeklySchedule.push({
        date,
        transports: transportsForDay,
      });
    }
    
    return weeklySchedule;
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    // Return empty schedule with dates
    return Array.from({ length: 7 }, (_, i) => {
      const currentDate = addDays(today, i);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      return {
        date: formattedDate,
        transports: [],
      };
    });
  }
}

/**
 * Add a new transport
 */
export async function addTransport(transport: Omit<Transport, 'id'>): Promise<Transport | null> {
  try {
    // Simple validation
    if (!transport.client?.name || !transport.pickup?.location || !transport.staff?.driver) {
      console.error("Missing critical transport fields");
      return null;
    }
    
    // Create a clean data object for insert
    const transportData = {
      client_name: transport.client.name,
      client_phone: transport.client.phone || '',
      pickup_location: transport.pickup.location,
      pickup_time: transport.pickup.time || '',
      pickup_date: transport.pickup.date,
      dropoff_location: transport.dropoff?.location || '',
      dropoff_time: transport.dropoff?.time || '',
      dropoff_date: transport.dropoff?.date || transport.pickup.date,
      staff_requester: transport.staff.requestedBy || '',
      staff_driver: transport.staff.driver,
      staff_assistant: transport.staff.assistant || null,
      client_count: transport.clientCount || 1,
      status: transport.status || 'scheduled',
      notes: transport.notes || null,
      vehicle: transport.vehicle || null,
      car_seats: transport.carSeats || 0,
    };
    
    // Direct insert with simplified error handling
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.TRANSPORTS)
      .insert(transportData)
      .select()
      .single();
    
    if (error) {
      console.error('Transport insert failed:', error.message);
      return null;
    }
    
    if (!data) {
      console.error('Transport insert returned no data');
      return null;
    }
    
    // Return the created transport with consistent formatting
    return {
      id: data.id,
      client: {
        name: data.client_name,
        phone: data.client_phone || '',
      },
      pickup: {
        location: data.pickup_location,
        time: data.pickup_time || '',
        date: data.pickup_date,
      },
      dropoff: {
        location: data.dropoff_location || '',
        time: data.dropoff_time || '',
        date: data.dropoff_date || data.pickup_date,
      },
      staff: {
        requestedBy: data.staff_requester || '',
        driver: data.staff_driver,
        assistant: data.staff_assistant || undefined,
      },
      clientCount: data.client_count || 1,
      status: data.status || 'scheduled',
      notes: data.notes || undefined,
      vehicle: data.vehicle || undefined,
      carSeats: data.car_seats || 0,
    };
  } catch (error) {
    console.error('Exception in addTransport:', error);
    return null;
  }
}

/**
 * Update an existing transport
 */
export async function updateTransport(id: string, transport: Omit<Transport, 'id'>): Promise<Transport | null> {
  try {
    if (!id) {
      console.error("Missing transport ID for update");
      return null;
    }
    
    // Simple validation
    if (!transport.client?.name || !transport.pickup?.location || !transport.staff?.driver) {
      console.error("Missing critical transport fields");
      return null;
    }
    
    // Create a clean data object for update
    const transportData = {
      client_name: transport.client.name,
      client_phone: transport.client.phone || '',
      pickup_location: transport.pickup.location,
      pickup_time: transport.pickup.time || '',
      pickup_date: transport.pickup.date,
      dropoff_location: transport.dropoff?.location || '',
      dropoff_time: transport.dropoff?.time || '',
      dropoff_date: transport.dropoff?.date || transport.pickup.date,
      staff_requester: transport.staff.requestedBy || '',
      staff_driver: transport.staff.driver,
      staff_assistant: transport.staff.assistant || null,
      client_count: transport.clientCount || 1,
      status: transport.status || 'scheduled',
      notes: transport.notes || null,
      vehicle: transport.vehicle || null,
      car_seats: transport.carSeats || 0,
    };
    
    // Direct update with simplified error handling
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.TRANSPORTS)
      .update(transportData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Transport update failed:', error.message);
      return null;
    }
    
    if (!data) {
      console.error('Transport update returned no data');
      return null;
    }
    
    // Return the updated transport with consistent formatting
    return {
      id: data.id,
      client: {
        name: data.client_name,
        phone: data.client_phone || '',
      },
      pickup: {
        location: data.pickup_location,
        time: data.pickup_time || '',
        date: data.pickup_date,
      },
      dropoff: {
        location: data.dropoff_location || '',
        time: data.dropoff_time || '',
        date: data.dropoff_date || data.pickup_date,
      },
      staff: {
        requestedBy: data.staff_requester || '',
        driver: data.staff_driver,
        assistant: data.staff_assistant || undefined,
      },
      clientCount: data.client_count || 1,
      status: data.status || 'scheduled',
      notes: data.notes || undefined,
      vehicle: data.vehicle || undefined,
      carSeats: data.car_seats || 0,
    };
  } catch (error) {
    console.error('Exception in updateTransport:', error);
    return null;
  }
}

/**
 * Delete a transport
 */
export async function deleteTransport(id: string): Promise<boolean> {
  try {
    if (!id) {
      console.error("Missing transport ID for delete");
      return false;
    }
    
    // Direct delete with simplified error handling
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.TRANSPORTS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Transport delete failed:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in deleteTransport:', error);
    return false;
  }
}

// ===== Announcement Operations =====

/**
 * Get all announcements
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
    
    // Transform from database schema to application schema
    return data.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      date: item.date,
      timestamp: item.timestamp,
      priority: item.priority,
      author: item.author,
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

/**
 * Add a new announcement
 */
export async function addAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<Announcement | null> {
  try {
    // Simple validation
    if (!announcement.title || !announcement.content) {
      console.error("Missing critical announcement fields");
      return null;
    }
    
    // Create clean data object with fallbacks
    const announcementData = {
      title: announcement.title,
      content: announcement.content,
      date: announcement.date || format(new Date(), 'yyyy-MM-dd'),
      timestamp: announcement.timestamp || new Date().toISOString(),
      priority: announcement.priority || 'normal',
      author: announcement.author || 'Anonymous',
    };
    
    // Direct insert with improved error handling
    const supabase = getSupabaseClient();
    
    // Debug auth state
    const { data: authData } = await supabase.auth.getSession();
    console.log('Auth session when adding announcement:', 
      authData?.session ? 'Active session' : 'No active session');
    
    const { data, error } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .insert(announcementData)
      .select()
      .single();
    
    if (error) {
      console.error('Announcement insert failed:', error.message);
      console.error('Error details:', error);
      return null;
    }
    
    if (!data) {
      console.error('Announcement insert returned no data');
      return null;
    }
    
    // Return consistent formatted result
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date || format(new Date(), 'yyyy-MM-dd'),
      timestamp: data.timestamp || new Date().toISOString(),
      priority: data.priority || 'normal',
      author: data.author || 'Anonymous',
    };
  } catch (error) {
    console.error('Exception in addAnnouncement:', error);
    return null;
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(id: string, announcement: Omit<Announcement, 'id'>): Promise<Announcement | null> {
  try {
    if (!id) {
      console.error("Missing announcement ID for update");
      return null;
    }
    
    // Simple validation
    if (!announcement.title || !announcement.content) {
      console.error("Missing critical announcement fields");
      return null;
    }
    
    // Create clean data object with fallbacks
    const announcementData = {
      title: announcement.title,
      content: announcement.content,
      date: announcement.date || format(new Date(), 'yyyy-MM-dd'),
      timestamp: announcement.timestamp || new Date().toISOString(),
      priority: announcement.priority || 'normal',
      author: announcement.author || 'Anonymous',
    };
    
    // Direct update with improved error handling
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .update(announcementData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Announcement update failed:', error.message);
      return null;
    }
    
    if (!data) {
      console.error('Announcement update returned no data');
      return null;
    }
    
    // Return consistent formatted result
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date || format(new Date(), 'yyyy-MM-dd'),
      timestamp: data.timestamp || new Date().toISOString(),
      priority: data.priority || 'normal',
      author: data.author || 'Anonymous',
    };
  } catch (error) {
    console.error('Exception in updateAnnouncement:', error);
    return null;
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    if (!id) {
      console.error("Missing announcement ID for delete");
      return false;
    }
    
    // Direct delete with improved error handling
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Announcement delete failed:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in deleteAnnouncement:', error);
    return false;
  }
} 