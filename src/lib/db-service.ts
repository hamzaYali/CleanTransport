import { format, addDays } from 'date-fns';
import { Transport, Announcement, DaySchedule } from './data';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

// ===== Transport Operations =====

/**
 * Get transports scheduled for a specific date
 */
export async function fetchTransportsByDate(date: string): Promise<Transport[]> {
  try {
    const { data, error } = await supabase
      .from('transports')
      .select(`
        id,
        client_name,
        client_phone,
        pickup_location,
        pickup_time,
        pickup_date,
        dropoff_location,
        dropoff_time,
        dropoff_date,
        requested_by,
        driver_id,
        assistant_id,
        client_count,
        status,
        notes,
        vehicle,
        car_seats
      `)
      .eq('pickup_date', date)
      .order('pickup_time');

    if (error) {
      console.error('Error fetching transports:', error);
      return [];
    }

    // Convert database format to app format
    return data.map(t => ({
      id: t.id,
      client: {
        name: t.client_name,
        phone: t.client_phone || '',
      },
      pickup: {
        location: t.pickup_location,
        time: t.pickup_time || '',
        date: t.pickup_date,
      },
      dropoff: {
        location: t.dropoff_location || '',
        time: t.dropoff_time || '',
        date: t.dropoff_date || t.pickup_date,
      },
      staff: {
        requestedBy: t.requested_by || '',
        driver: t.driver_id,
        assistant: t.assistant_id,
      },
      clientCount: t.client_count || 1,
      status: t.status as 'completed' | 'in-progress' | 'scheduled',
      notes: t.notes,
      vehicle: t.vehicle,
      carSeats: t.car_seats || 0,
    }));
  } catch (error) {
    console.error('Exception in fetchTransportsByDate:', error);
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
    
    // Get all transports for the next 7 days
    const { data, error } = await supabase
      .from('transports')
      .select(`
        id,
        client_name,
        client_phone,
        pickup_location,
        pickup_time,
        pickup_date,
        dropoff_location,
        dropoff_time,
        dropoff_date,
        requested_by,
        driver_id,
        assistant_id,
        client_count,
        status,
        notes,
        vehicle,
        car_seats
      `)
      .in('pickup_date', dates)
      .order('pickup_date')
      .order('pickup_time');
    
    if (error) {
      console.error('Error fetching weekly schedule:', error);
      // Return empty schedule with dates
      return dates.map(date => ({ date, transports: [] }));
    }
    
    // Convert and group by date
    const transportsByDate = data.reduce((acc, t) => {
      const date = t.pickup_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push({
        id: t.id,
        client: {
          name: t.client_name,
          phone: t.client_phone || '',
        },
        pickup: {
          location: t.pickup_location,
          time: t.pickup_time || '',
          date: t.pickup_date,
        },
        dropoff: {
          location: t.dropoff_location || '',
          time: t.dropoff_time || '',
          date: t.dropoff_date || t.pickup_date,
        },
        staff: {
          requestedBy: t.requested_by || '',
          driver: t.driver_id,
          assistant: t.assistant_id,
        },
        clientCount: t.client_count || 1,
        status: t.status as 'completed' | 'in-progress' | 'scheduled',
        notes: t.notes,
        vehicle: t.vehicle,
        carSeats: t.car_seats || 0,
      });
      
      return acc;
    }, {} as Record<string, Transport[]>);
    
    // Create the weekly schedule with all dates
    for (const date of dates) {
      weeklySchedule.push({
        date,
        transports: transportsByDate[date] || [],
      });
    }
    
    return weeklySchedule;
  } catch (error) {
    console.error('Exception in fetchWeeklySchedule:', error);
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
    
    console.log("Adding transport with data:", JSON.stringify(transport, null, 2));
    
    // Convert to database format
    const dbTransport = {
      client_name: transport.client.name,
      client_phone: transport.client.phone || '',
      pickup_location: transport.pickup.location,
      pickup_time: transport.pickup.time || '',
      pickup_date: transport.pickup.date,
      dropoff_location: transport.dropoff?.location || '',
      dropoff_time: transport.dropoff?.time || '',
      dropoff_date: transport.dropoff?.date || transport.pickup.date,
      requested_by: transport.staff.requestedBy || null,
      driver_id: transport.staff.driver,
      assistant_id: transport.staff.assistant || null,
      client_count: transport.clientCount || 1,
      status: transport.status || 'scheduled',
      notes: transport.notes || null,
      vehicle: transport.vehicle || null,
      car_seats: transport.carSeats || 0,
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('transports')
      .insert(dbTransport)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding transport:', error);
      return null;
    }
    
    // Convert back to app format
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
        requestedBy: data.requested_by || '',
        driver: data.driver_id,
        assistant: data.assistant_id,
      },
      clientCount: data.client_count || 1,
      status: data.status as 'completed' | 'in-progress' | 'scheduled',
      notes: data.notes,
      vehicle: data.vehicle,
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
    
    // Convert to database format
    const dbTransport = {
      client_name: transport.client.name,
      client_phone: transport.client.phone || '',
      pickup_location: transport.pickup.location,
      pickup_time: transport.pickup.time || '',
      pickup_date: transport.pickup.date,
      dropoff_location: transport.dropoff?.location || '',
      dropoff_time: transport.dropoff?.time || '',
      dropoff_date: transport.dropoff?.date || transport.pickup.date,
      requested_by: transport.staff.requestedBy || null,
      driver_id: transport.staff.driver,
      assistant_id: transport.staff.assistant || null,
      client_count: transport.clientCount || 1,
      status: transport.status || 'scheduled',
      notes: transport.notes || null,
      vehicle: transport.vehicle || null,
      car_seats: transport.carSeats || 0,
    };
    
    // Update in database
    const { data, error } = await supabase
      .from('transports')
      .update(dbTransport)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating transport:', error);
      return null;
    }
    
    // Convert back to app format
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
        requestedBy: data.requested_by || '',
        driver: data.driver_id,
        assistant: data.assistant_id,
      },
      clientCount: data.client_count || 1,
      status: data.status as 'completed' | 'in-progress' | 'scheduled',
      notes: data.notes,
      vehicle: data.vehicle,
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
    
    // Delete from database
    const { error } = await supabase
      .from('transports')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting transport:', error);
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
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        content,
        date,
        timestamp,
        priority,
        author_id,
        profiles!announcements_author_id_fkey(id, name, email)
      `)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
    
    // Convert to app format
    return data.map(a => {
      const profileData = a.profiles;
      let authorName = 'Anonymous';
      
      // Try to get the name or fall back to email or user id
      if (profileData && Array.isArray(profileData) && profileData.length > 0) {
        const profile = profileData[0];
        authorName = profile.name || profile.email || profile.id || 'Admin';
      } else if (a.author_id) {
        authorName = 'Admin';
      }
      
      return {
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.date,
        timestamp: a.timestamp,
        priority: a.priority as 'high' | 'medium' | 'low',
        author: authorName,
      };
    });
  } catch (error) {
    console.error('Exception in fetchAnnouncements:', error);
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
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }
    
    // Convert to database format
    const dbAnnouncement = {
      title: announcement.title,
      content: announcement.content,
      date: announcement.date || format(new Date(), 'yyyy-MM-dd'),
      timestamp: announcement.timestamp || new Date().toISOString(),
      priority: announcement.priority || 'normal',
      author_id: user.id,
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('announcements')
      .insert(dbAnnouncement)
      .select(`
        id,
        title,
        content,
        date,
        timestamp,
        priority,
        author_id,
        profiles!announcements_author_id_fkey(id, name, email)
      `)
      .single();
    
    if (error) {
      console.error('Error adding announcement:', error);
      return null;
    }
    
    // Convert to app format
    const profileData = data.profiles;
    let authorName = 'Anonymous';
    
    // Try to get the name or fall back to email or user id
    if (profileData && Array.isArray(profileData) && profileData.length > 0) {
      const profile = profileData[0];
      authorName = profile.name || profile.email || profile.id || 'Admin';
    } else if (data.author_id) {
      authorName = 'Admin';
    }
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date,
      timestamp: data.timestamp,
      priority: data.priority as 'high' | 'medium' | 'low',
      author: authorName,
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
    
    // Convert to database format
    const dbAnnouncement = {
      title: announcement.title,
      content: announcement.content,
      date: announcement.date || format(new Date(), 'yyyy-MM-dd'),
      priority: announcement.priority || 'normal',
    };
    
    // Update in database
    const { data, error } = await supabase
      .from('announcements')
      .update(dbAnnouncement)
      .eq('id', id)
      .select(`
        id,
        title,
        content,
        date,
        timestamp,
        priority,
        author_id,
        profiles!announcements_author_id_fkey(id, name, email)
      `)
      .single();
    
    if (error) {
      console.error('Error updating announcement:', error);
      return null;
    }
    
    // Convert to app format
    const profileData = data.profiles;
    let authorName = 'Anonymous';
    
    // Try to get the name or fall back to email or user id
    if (profileData && Array.isArray(profileData) && profileData.length > 0) {
      const profile = profileData[0];
      authorName = profile.name || profile.email || profile.id || 'Admin';
    } else if (data.author_id) {
      authorName = 'Admin';
    }
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date,
      timestamp: data.timestamp,
      priority: data.priority as 'high' | 'medium' | 'low',
      author: authorName,
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
    
    // Delete from database
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in deleteAnnouncement:', error);
    return false;
  }
} 