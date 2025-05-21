// Export Service
import { Transport } from './data';
import { format } from 'date-fns';

// This function generates a CSV file from transport data
export async function generateScheduleCSV(date: Date, transports: Transport[]): Promise<void> {
  // Make sure we're running on the client
  if (typeof window === 'undefined') {
    return Promise.reject('CSV generation can only run on the client side');
  }

  try {
    // Define column headers
    const headers = [
      'Pick up Time',
      'Client Name',
      'Phone',
      'Pickup Address',
      'Dropoff Address',
      'Clients Count',
      'Car Seats',
      'Staff Requesting',
      'Driver',
      'Return Time'
    ];
    
    // Format data for CSV
    const sortedTransports = transports
      .sort((a, b) => {
        const timeA = new Date(`01/01/2023 ${a.pickup.time}`);
        const timeB = new Date(`01/01/2023 ${b.pickup.time}`);
        return timeA.getTime() - timeB.getTime();
      });
    
    // Helper function to escape CSV fields properly
    const escapeCSV = (field) => {
      // If field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
      if (field && (field.includes('"') || field.includes(',') || field.includes('\n'))) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field || '';
    };
    
    // Convert data to CSV rows
    const rows = sortedTransports.map(transport => [
      transport.pickup.time,
      transport.client.name,
      transport.client.phone,
      transport.pickup.location,
      transport.dropoff.location,
      transport.clientCount.toString(),
      (transport.carSeats || 0).toString(),
      transport.staff.requestedBy,
      transport.staff.driver,
      transport.dropoff.time
    ].map(escapeCSV).join(','));
    
    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows
    ].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    const fileName = `Transport_Schedule_${format(date, 'yyyy-MM-dd')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    // Append to document, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error generating CSV:", error);
    return Promise.reject(error);
  }
} 