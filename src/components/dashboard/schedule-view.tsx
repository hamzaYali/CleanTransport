import React, { useState } from 'react';
import { format } from 'date-fns';
import { Transport } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FaInfoCircle, FaTrash, FaEdit, FaFileExcel, FaMapMarkerAlt, FaTable, FaThLarge } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateScheduleCSV } from '@/lib/export-service';

interface ScheduleViewProps {
  date: Date;
  transports: Transport[];
  role: 'admin' | 'employee' | 'viewer';
  onDeleteTransport?: (id: string) => void;
  onEditTransport?: (transport: Transport) => void;
}

export function ScheduleView({ date, transports, role, onDeleteTransport, onEditTransport }: ScheduleViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<'all' | 'omaha' | 'lincoln'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const formattedDate = format(date, 'MM/dd/yyyy');
  
  // Filter transports based on location
  const filteredTransports = transports.filter(transport => {
    if (selectedLocation === 'all') return true;
    
    const pickupLower = transport.pickup.location.toLowerCase();
    const dropoffLower = transport.dropoff.location.toLowerCase();
    
    if (selectedLocation === 'omaha') {
      return pickupLower.includes('omaha') || dropoffLower.includes('omaha');
    }
    
    if (selectedLocation === 'lincoln') {
      return pickupLower.includes('lincoln') || dropoffLower.includes('lincoln');
    }
    
    return true;
  });

  // Sort transports by time
  const sortedTransports = filteredTransports
    .sort((a, b) => {
      const timeA = new Date(`01/01/2023 ${a.pickup.time}`);
      const timeB = new Date(`01/01/2023 ${b.pickup.time}`);
      return timeA.getTime() - timeB.getTime();
    });
  
  // Function to handle CSV download
  const handleDownloadCSV = async () => {
    try {
      await generateScheduleCSV(date, filteredTransports);
      toast.success("Transport schedule exported to CSV successfully!");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to export schedule. Please try again.");
    }
  };

  // Helper function to get driver initials
  const getDriverInitials = (driverName: string) => {
    return driverName.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  return (
    <div className="space-y-6 w-full">
      {/* Header with filters and export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {filteredTransports.length} transport{filteredTransports.length !== 1 ? 's' : ''} scheduled
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedLocation === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLocation('all')}
              className="flex items-center gap-2"
            >
              <FaMapMarkerAlt className="h-4 w-4" />
              All Locations
            </Button>
            <Button
              variant={selectedLocation === 'omaha' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLocation('omaha')}
              className="flex items-center gap-2"
            >
              <FaMapMarkerAlt className="h-4 w-4" />
              Omaha
            </Button>
            <Button
              variant={selectedLocation === 'lincoln' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLocation('lincoln')}
              className="flex items-center gap-2"
            >
              <FaMapMarkerAlt className="h-4 w-4" />
              Lincoln
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {filteredTransports.length > 0 && (
            <>
              <div className="flex rounded-md shadow-sm" role="group">
                <Button
                  variant={viewMode === 'table' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex items-center gap-2 rounded-r-none"
                >
                  <FaTable className="h-4 w-4" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'card' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="flex items-center gap-2 rounded-l-none"
                >
                  <FaThLarge className="h-4 w-4" />
                  Cards
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                className="bg-primary/5 hover:bg-primary/10 text-primary flex items-center gap-2"
              >
                <FaFileExcel className="h-4 w-4" />
                Export to CSV
              </Button>
            </>
          )}
        </div>
      </div>
      
      {filteredTransports.length > 0 ? (
        <>
          {/* Table View */}
          {viewMode === 'table' && (
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
                  {sortedTransports.map((transport) => (
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
          )}

          {/* Card View */}
          {viewMode === 'card' && (
            <div className="space-y-3 p-1">
              {sortedTransports.map((transport) => (
                <div key={transport.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">{transport.client.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl font-bold text-primary">{transport.pickup.time}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {transport.clientCount} client{transport.clientCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {role === 'admin' && (onDeleteTransport || onEditTransport) && (
                      <div className="flex gap-2 ml-4">
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
                            className="w-10 h-10 p-0 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <FaEdit className="w-4 h-4" />
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
                            className="w-10 h-10 p-0 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <FaTrash className="w-4 h-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="space-y-3">
                    {/* Pickup Section */}
                    <div className="border-l-4 border-green-400 pl-3 py-1">
                      <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Pickup</p>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{transport.pickup.location}</p>
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        📞 {transport.client.phone}
                      </p>
                    </div>

                    {/* Dropoff Section */}
                    <div className="border-l-4 border-red-400 pl-3 py-1">
                      <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Dropoff</p>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{transport.dropoff.location}</p>
                      <p className="text-xs text-gray-600 mt-1">Return: {transport.dropoff.time}</p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {getDriverInitials(transport.staff.driver)}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{transport.staff.driver}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        🚗 {transport.carSeats || 0} seats
                      </span>
                    </div>
                  </div>
                  
                  {/* Staff Requesting */}
                  <div className="mt-3 pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Requested by:</span> {transport.staff.requestedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
          <FaInfoCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-lg font-medium">
            {selectedLocation === 'all' 
              ? 'No transports scheduled for today.'
              : `No transports scheduled for ${selectedLocation} today.`}
          </p>
          {role === 'admin' ? (
            <p className="text-muted-foreground text-sm mt-1">Click on "Add Transport Schedule" to add a new transport</p>
          ) : (
            <p className="text-muted-foreground">If this is a mistake, please contact the administrator.</p>
          )}
        </div>
      )}
    </div>
  );
} 