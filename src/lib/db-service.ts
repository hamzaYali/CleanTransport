import { format, addDays } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { TABLES } from './supabase';
import { Transport, Announcement, DaySchedule } from './data';

// Create Supabase client
const supabase = createClient();

// ===== Transport Operations =====

/**
 * Get transports scheduled for a specific date
 */
export async function fetchTransportsByDate(date: string): Promise<Transport[]> {
  try {
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
    // Ensure required fields are present
    if (!transport.client?.name || !transport.client?.phone ||
        !transport.pickup?.location || !transport.pickup?.time || !transport.pickup?.date ||
        !transport.dropoff?.location || !transport.staff?.requestedBy || !transport.staff?.driver) {
      console.error("Missing required fields:", transport);
      return null;
    }
    
    // Transform from application schema to database schema
    const transportData = {
      client_name: transport.client.name,
      client_phone: transport.client.phone,
      pickup_location: transport.pickup.location,
      pickup_time: transport.pickup.time,
      pickup_date: transport.pickup.date,
      dropoff_location: transport.dropoff.location,
      dropoff_time: transport.dropoff.time || '',
      dropoff_date: transport.dropoff.date,
      staff_requester: transport.staff.requestedBy,
      staff_driver: transport.staff.driver,
      staff_assistant: transport.staff.assistant || null,
      client_count: transport.clientCount || 1,
      status: transport.status || 'scheduled',
      notes: transport.notes || null,
      vehicle: transport.vehicle || null,
      car_seats: transport.carSeats || 0,
    };
    
    const { data, error } = await supabase
      .from(TABLES.TRANSPORTS)
      .insert(transportData)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding transport:', error);
      return null;
    }
    
    // Transform back to application schema
    return {
      id: data.id,
      client: {
        name: data.client_name,
        phone: data.client_phone,
      },
      pickup: {
        location: data.pickup_location,
        time: data.pickup_time,
        date: data.pickup_date,
      },
      dropoff: {
        location: data.dropoff_location,
        time: data.dropoff_time,
        date: data.dropoff_date,
      },
      staff: {
        requestedBy: data.staff_requester,
        driver: data.staff_driver,
        assistant: data.staff_assistant || undefined,
      },
      clientCount: data.client_count,
      status: data.status,
      notes: data.notes || undefined,
      vehicle: data.vehicle || undefined,
      carSeats: data.car_seats || 0,
    };
  } catch (error) {
    console.error('Error adding transport:', error);
    return null;
  }
}

/**
 * Update an existing transport
 */
export async function updateTransport(id: string, transport: Omit<Transport, 'id'>): Promise<Transport | null> {
  try {
    // Ensure required fields are present
    if (!transport.client?.name || !transport.client?.phone ||
        !transport.pickup?.location || !transport.pickup?.time || !transport.pickup?.date ||
        !transport.dropoff?.location || !transport.staff?.requestedBy || !transport.staff?.driver) {
      console.error("Missing required fields for update:", transport);
      return null;
    }
    
    // First, verify the transport exists
    try {
      const { data: checkData, error: checkError } = await supabase
        .from(TABLES.TRANSPORTS)
        .select('id')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error('Error checking transport existence:', checkError);
        return null;
      }
      
      if (!checkData) {
        console.error('Transport with ID does not exist:', id);
        return null;
      }
    } catch (selectionError) {
      console.error('Exception during transport existence check:', selectionError);
      return null;
    }
    
    // Transform from application schema to database schema
    const transportData = {
      client_name: transport.client.name,
      client_phone: transport.client.phone,
      pickup_location: transport.pickup.location,
      pickup_time: transport.pickup.time,
      pickup_date: transport.pickup.date,
      dropoff_location: transport.dropoff.location,
      dropoff_time: transport.dropoff.time || '',
      dropoff_date: transport.dropoff.date,
      staff_requester: transport.staff.requestedBy,
      staff_driver: transport.staff.driver,
      staff_assistant: transport.staff.assistant || null,
      client_count: transport.clientCount || 1,
      status: transport.status || 'scheduled',
      notes: transport.notes || null,
      vehicle: transport.vehicle || null,
      car_seats: transport.carSeats || 0,
    };
    
    // Perform the update operation
    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSPORTS)
        .update(transportData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating transport:', error);
        return null;
      }
      
      // Transform back to application schema
      return {
        id: data.id,
        client: {
          name: data.client_name,
          phone: data.client_phone,
        },
        pickup: {
          location: data.pickup_location,
          time: data.pickup_time,
          date: data.pickup_date,
        },
        dropoff: {
          location: data.dropoff_location,
          time: data.dropoff_time,
          date: data.dropoff_date,
        },
        staff: {
          requestedBy: data.staff_requester,
          driver: data.staff_driver,
          assistant: data.staff_assistant || undefined,
        },
        clientCount: data.client_count,
        status: data.status,
        notes: data.notes || undefined,
        vehicle: data.vehicle || undefined,
        carSeats: data.car_seats || 0,
      };
    } catch (updateError) {
      console.error('Exception during update operation:', updateError);
      return null;
    }
  } catch (error) {
    console.error('Error updating transport:', error);
    return null;
  }
}

/**
 * Delete a transport
 */
export async function deleteTransport(id: string): Promise<boolean> {
  try {
    if (!id) {
      console.error("Cannot delete transport: Missing ID");
      return false;
    }
    
    // First, verify the transport exists
    try {
      const { data: checkData, error: checkError } = await supabase
        .from(TABLES.TRANSPORTS)
        .select('id')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error('Error checking transport existence:', checkError);
        return false;
      }
      
      if (!checkData) {
        console.error('Transport with ID does not exist:', id);
        return false;
      }
    } catch (selectionError) {
      console.error('Exception during transport existence check:', selectionError);
      return false;
    }
    
    // Now perform the delete operation
    try {
      const { error } = await supabase
        .from(TABLES.TRANSPORTS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting transport:', error);
        return false;
      }
    } catch (deleteError) {
      console.error('Exception during delete operation:', deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting transport:', error);
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
    const { data, error } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .insert({
        title: announcement.title,
        content: announcement.content,
        date: announcement.date,
        timestamp: announcement.timestamp,
        priority: announcement.priority,
        author: announcement.author,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding announcement:', error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date,
      timestamp: data.timestamp,
      priority: data.priority,
      author: data.author,
    };
  } catch (error) {
    console.error('Error adding announcement:', error);
    return null;
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(id: string, announcement: Omit<Announcement, 'id'>): Promise<Announcement | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .update({
        title: announcement.title,
        content: announcement.content,
        date: announcement.date,
        timestamp: announcement.timestamp,
        priority: announcement.priority,
        author: announcement.author,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating announcement:', error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date,
      timestamp: data.timestamp,
      priority: data.priority,
      author: data.author,
    };
  } catch (error) {
    console.error('Error updating announcement:', error);
    return null;
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return false;
  }
} 