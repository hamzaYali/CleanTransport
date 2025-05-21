import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { format, parse, parseISO } from 'date-fns';
import { Transport } from '@/lib/data';
import { addTransport, updateTransport } from '@/lib/db-service';
import { toast } from "sonner";

// Convert 24-hour time format to 12-hour time format
const convertTo12HourFormat = (time24hr: string): string => {
  if (!time24hr) return '';
  
  try {
    // Special case for directly handling common formats
    if (time24hr.match(/^\d{2}:\d{2}$/)) {
      // Parse the time string into a Date object
      const timeDate = parse(time24hr, 'HH:mm', new Date());
      // Format the Date object into 12-hour time format with AM/PM
      return format(timeDate, 'h:mm a');
    } else if (time24hr.includes('AM') || time24hr.includes('PM')) {
      // Already in 12-hour format
      return time24hr;
    } else {
      return time24hr;
    }
  } catch (e) {
    console.error("Error converting time format:", e);
    return time24hr; // Return original if there's an error
  }
};

// Convert 12-hour time format (8:30 AM) to 24-hour format (08:30) for form input
const convertTo24HourFormat = (time12hr: string): string => {
  if (!time12hr) return '';
  
  try {
    // Parse the time string into a Date object
    const timeDate = parse(time12hr, 'h:mm a', new Date());
    // Format the Date object into 24-hour time format
    return format(timeDate, 'HH:mm');
  } catch (e) {
    console.error("Error converting time format:", e);
    return '';
  }
};

interface TransportFormProps {
  onCancel: () => void;
  transportToEdit?: Transport;
  onSuccess?: () => void; // New callback for refreshing data
}

export function AddTransportForm({ 
  onCancel, 
  transportToEdit,
  onSuccess
}: TransportFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [clientCount, setClientCount] = useState(1);
  const [carSeats, setCarSeats] = useState(0);
  const [staffRequestedBy, setStaffRequestedBy] = useState('');
  const [driver, setDriver] = useState('');
  
  // Initialize form with transport data when editing
  useEffect(() => {
    if (transportToEdit) {
      try {
        // Set date
        setDate(parseISO(transportToEdit.pickup.date));
        
        // Set client info
        setClientName(transportToEdit.client.name);
        setClientPhone(transportToEdit.client.phone);
        
        // Set pickup/dropoff info
        setPickupLocation(transportToEdit.pickup.location);
        setDropoffLocation(transportToEdit.dropoff.location);
        
        // Convert times from 12-hour to 24-hour format for the input fields
        setPickupTime(convertTo24HourFormat(transportToEdit.pickup.time));
        if (transportToEdit.dropoff.time) {
          setDropoffTime(convertTo24HourFormat(transportToEdit.dropoff.time));
        }
        
        // Set other fields
        setClientCount(transportToEdit.clientCount);
        setCarSeats(transportToEdit.carSeats || 0);
        setStaffRequestedBy(transportToEdit.staff.requestedBy);
        setDriver(transportToEdit.staff.driver);
      } catch (error) {
        console.error('Error initializing form with transport data:', error);
      }
    }
  }, [transportToEdit]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create the transport object with all fields
      const transportData: Omit<Transport, 'id'> = {
        client: {
          name: clientName,
          phone: clientPhone,
        },
        pickup: {
          location: pickupLocation,
          time: convertTo12HourFormat(pickupTime), // Convert to 12-hour format
          date: format(date, 'yyyy-MM-dd'),
        },
        dropoff: {
          location: dropoffLocation,
          time: dropoffTime ? convertTo12HourFormat(dropoffTime) : '', // Convert to 12-hour format if present
          date: format(date, 'yyyy-MM-dd'),
        },
        staff: {
          requestedBy: staffRequestedBy,
          driver: driver,
        },
        clientCount: clientCount,
        carSeats: carSeats,
        status: 'scheduled',
      };
      
      let result;
      
      // If editing an existing transport, update it
      if (transportToEdit) {
        if (!transportToEdit.id) {
          console.error("Missing ID for transport update");
          toast.error("Failed to update: Missing ID");
          return;
        }
        
        try {
          result = await updateTransport(transportToEdit.id, transportData);
          
          if (result) {
            toast.success("Transport updated successfully!");
          } else {
            console.error("Update transport returned null");
            toast.error("Failed to update transport");
            return;
          }
        } catch (updateError) {
          console.error("Exception during transport update:", updateError);
          toast.error("Error updating transport: " + (updateError instanceof Error ? updateError.message : String(updateError)));
          return;
        }
      } else {
        // Otherwise add a new transport
        try {
          result = await addTransport(transportData);
          if (result) {
            toast.success("Transport added successfully!");
          } else {
            console.error("Add transport returned null");
            toast.error("Failed to add transport");
            return;
          }
        } catch (addError) {
          console.error("Exception during transport add:", addError);
          toast.error("Error adding transport: " + (addError instanceof Error ? addError.message : String(addError)));
          return;
        }
      }
      
      if (result) {
        onCancel(); // Close the form
        // Call the success callback to refresh data if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("Failed to save transport");
      }
    } catch (error) {
      console.error("Error in transport save:", error);
      toast.error("Error saving transport: " + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const isEditMode = !!transportToEdit;
  
  return (
    <Card className="w-full shadow-lg border-0 overflow-hidden">
      <CardHeader className="bg-primary text-white px-6 py-4">
        <CardTitle className="text-xl">{isEditMode ? 'Edit Transport' : 'Add New Transport'}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6" id="transportForm">
          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Transport Details</h3>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="flex items-center">
                <DatePicker 
                  date={date} 
                  onSelect={setDate} 
                  className="!bg-white !text-gray-800 w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Trip Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="pickupTime">Pickup Time</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dropoffTime" className="flex items-center">
                  Return Time <span className="text-xs text-gray-500 ml-2">(optional)</span>
                </Label>
                <Input
                  id="dropoffTime"
                  type="time"
                  value={dropoffTime}
                  onChange={(e) => setDropoffTime(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="pickupLocation">Pickup Address</Label>
              <Input
                id="pickupLocation"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dropoffLocation">Dropoff Address</Label>
              <Input
                id="dropoffLocation"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                required
                className="bg-white"
              />
            </div>
          </div>
          
          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="clientCount">Number of Clients</Label>
                <Input
                  id="clientCount"
                  type="number"
                  min="1"
                  value={clientCount}
                  onChange={(e) => setClientCount(parseInt(e.target.value))}
                  required
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carSeats">Car Seats Needed</Label>
                <Input
                  id="carSeats"
                  type="number"
                  min="0"
                  value={carSeats}
                  onChange={(e) => setCarSeats(parseInt(e.target.value))}
                  required
                  className="bg-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffRequestedBy">Staff Requesting</Label>
                <select
                  id="staffRequestedBy"
                  value={staffRequestedBy}
                  onChange={(e) => setStaffRequestedBy(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select staff member</option>
                  <option value="Abdullah L. - 531-444-9529">Abdullah L. - 531-444-9529</option>
                  <option value="Adam A. - 402-889-7086">Adam A. - 402-889-7086</option>
                  <option value="Aramy G. - 531-250-7069">Aramy G. - 531-250-7069</option>
                  <option value="Beatrice M. - 402-810-0116">Beatrice M. - 402-810-0116</option>
                  <option value="Bibi Z. - 402-677-4111">Bibi Z. - 402-677-4111</option>
                  <option value="Celina O. - 531-444-8631">Celina O. - 531-444-8631</option>
                  <option value="Claire Y. - 531-250-5462">Claire Y. - 531-250-5462</option>
                  <option value="Ehblu W. - 402-889-7091">Ehblu W. - 402-889-7091</option>
                  <option value="Ehtheyu S. - 402-810-0693">Ehtheyu S. - 402-810-0693</option>
                  <option value="Fartun A. - 531-444-9528">Fartun A. - 531-444-9528</option>
                  <option value="Magda S. - 531-250-7089">Magda S. - 531-250-7089</option>
                  <option value="Malek Z. - 531-250-7095">Malek Z. - 531-250-7095</option>
                  <option value="Mary H. - 531-444-7182">Mary H. - 531-444-7182</option>
                  <option value="Monir N. - 531-444-6244">Monir N. - 531-444-6244</option>
                  <option value="Noussouraddine Z. - 402-979-2984">Noussouraddine Z. - 402-979-2984</option>
                  <option value="Olive M. - 402-677-1561">Olive M. - 402-677-1561</option>
                  <option value="Poe M. - 531-301-9503">Poe M. - 531-301-9503</option>
                  <option value="Rhay W. - 402-889-7094">Rhay W. - 402-889-7094</option>
                  <option value="Rhode I. - 402-677-0385">Rhode I. - 402-677-0385</option>
                  <option value="Rock S. - 531-444-6063">Rock S. - 531-444-6063</option>
                  <option value="Tetyana B. - 531-444-7777">Tetyana B. - 531-444-7777</option>
                  <option value="Tim W. - 402-889-7065">Tim W. - 402-889-7065</option>
                  <option value="Viktoriia S. - 531-250-7074">Viktoriia S. - 531-250-7074</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driver">Driver</Label>
                <Input
                  id="driver"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        </form>
        
        <div className="flex justify-end space-x-3 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-slate-300 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            className="bg-primary hover:bg-primary/90 text-white px-6"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }}
          >
            {isEditMode ? 'Update Transport' : 'Add Transport'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 