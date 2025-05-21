import React from 'react';
import { format } from 'date-fns';
import { Transport } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FaInfoCircle, FaTrash, FaEdit, FaFileExcel } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateScheduleCSV } from '@/lib/export-service';

interface ScheduleViewProps {
  date: Date;
  transports: Transport[];
  role: 'admin' | 'employee';
  onDeleteTransport?: (id: string) => void;
  onEditTransport?: (transport: Transport) => void;
}

export function ScheduleView({ date, transports, role, onDeleteTransport, onEditTransport }: ScheduleViewProps) {
  const formattedDate = format(date, 'MM/dd/yyyy');
  
  // Function to handle CSV download
  const handleDownloadCSV = async () => {
    try {
      await generateScheduleCSV(date, transports);
      toast.success("Transport schedule exported to CSV successfully!");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to export schedule. Please try again.");
    }
  };
  
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {transports.length} transport{transports.length !== 1 ? 's' : ''} scheduled
        </div>
        
        {/* Export to CSV button */}
        {transports.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            className="bg-primary/5 hover:bg-primary/10 text-primary flex items-center gap-2"
          >
            <FaFileExcel className="h-4 w-4" />
            Export to CSV
          </Button>
        )}
      </div>
      
      {transports.length > 0 ? (
        <div className="responsive-table-container border rounded-md">
          <Table>
            <TableHeader className="bg-accent">
              <TableRow>
                <TableHead className="text-sm font-semibold w-[70px]">Pick up</TableHead>
                <TableHead className="text-sm font-semibold w-[120px]">Client</TableHead>
                <TableHead className="text-sm font-semibold w-[100px]">Phone</TableHead>
                <TableHead className="text-sm font-semibold">Pickup Address</TableHead>
                <TableHead className="text-sm font-semibold">Dropoff Address</TableHead>
                <TableHead className="text-sm font-semibold w-[60px] text-center">Clients</TableHead>
                <TableHead className="text-sm font-semibold w-[60px] text-center">Car Seats</TableHead>
                <TableHead className="text-sm font-semibold w-[230px]">Staff Requesting</TableHead>
                <TableHead className="text-sm font-semibold w-[100px]">Driver</TableHead>
                <TableHead className="text-sm font-semibold w-[70px]">Return</TableHead>
                {role === 'admin' && (onDeleteTransport || onEditTransport) && (
                  <TableHead className="text-sm font-semibold w-[100px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transports
                .sort((a, b) => {
                  // Sort by time (convert from "09:00 AM" format to date for comparison)
                  const timeA = new Date(`01/01/2023 ${a.pickup.time}`);
                  const timeB = new Date(`01/01/2023 ${b.pickup.time}`);
                  return timeA.getTime() - timeB.getTime();
                })
                .map((transport) => (
                  <TableRow key={transport.id} className="hover:bg-accent/30">
                    <TableCell className="font-medium whitespace-nowrap">{transport.pickup.time}</TableCell>
                    <TableCell>{transport.client.name}</TableCell>
                    <TableCell>{transport.client.phone}</TableCell>
                    <TableCell className="pickup-location">{transport.pickup.location}</TableCell>
                    <TableCell className="dropoff-location">{transport.dropoff.location}</TableCell>
                    <TableCell className="text-center">{transport.clientCount}</TableCell>
                    <TableCell className="text-center">{transport.carSeats || 0}</TableCell>
                    <TableCell className="whitespace-nowrap">{transport.staff.requestedBy}</TableCell>
                    <TableCell>{transport.staff.driver}</TableCell>
                    <TableCell className="whitespace-nowrap">{transport.dropoff.time}</TableCell>
                    {role === 'admin' && (onDeleteTransport || onEditTransport) && (
                      <TableCell className="w-[100px]">
                        <div className="flex space-x-2">
                          {onEditTransport && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (transport && transport.id) {
                                  onEditTransport(transport);
                                } else {
                                  console.error("Cannot edit: Invalid transport data", transport);
                                }
                              }}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            >
                              <FaEdit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                          {onDeleteTransport && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (transport && transport.id) {
                                  onDeleteTransport(transport.id);
                                } else {
                                  console.error("Cannot delete: Invalid transport ID", transport);
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                            >
                              <FaTrash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
          <FaInfoCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-lg font-medium">No transports scheduled for today</p>
          {role === 'admin' && (
            <p className="text-muted-foreground text-sm mt-1">Click on "Schedule Transport" to add a new transport</p>
          )}
        </div>
      )}
    </div>
  );
} 