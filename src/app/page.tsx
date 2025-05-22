'use client';

import React, { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { DashboardHeader } from '@/components/dashboard/header';
import { ScheduleView } from '@/components/dashboard/schedule-view';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaPlus } from 'react-icons/fa';
import { Transport } from '@/lib/data';
import { AddTransportForm } from '@/components/admin/add-transport-form';
import { toast } from "sonner";
import { 
  deleteTransport, 
  fetchTransportsByDate 
} from '@/lib/db-service';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [transportToEdit, setTransportToEdit] = useState<Transport | undefined>(undefined);
  
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = !!user; // User is logged in = admin
  
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedTransports = await fetchTransportsByDate(dateStr);
        if (fetchedTransports) {
          setTransports(fetchedTransports);
        }
      } catch (error) {
        toast.error("Failed to fetch transport data");
      }
    };

    fetchData();
  }, [dateStr]);
  
  const handlePreviousDate = () => {
    setCurrentDate(prev => addDays(prev, -1));
  };
  
  const handleNextDate = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };
  
  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };
  
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };
  
  const handleDeleteTransport = async (id: string) => {
    if (!isAdmin) {
      toast.error("You must be logged in as an admin to delete transports");
      return;
    }
    
    try {
      if (!id) {
        toast.error("Failed to delete transport: Missing ID");
        return;
      }
      
      const success = await deleteTransport(id);
      
      if (success) {
        const updatedTransports = transports.filter(transport => transport.id !== id);
        setTransports(updatedTransports);
        toast.success("Transport deleted successfully!");
        
        const refreshedTransports = await fetchTransportsByDate(dateStr);
        setTransports(refreshedTransports);
      } else {
        toast.error("Failed to delete transport. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to delete transport. Please try again.");
    }
  };

  const handleEditTransport = (transport: Transport) => {
    if (!isAdmin) {
      toast.error("You must be logged in as an admin to edit transports");
      return;
    }
    
    try {
      if (!transport?.id) {
        toast.error("Failed to edit transport: Missing ID");
        return;
      }
      
      setTransportToEdit(transport);
      setShowAddForm(true);
    } catch (error) {
      toast.error("Failed to set up transport edit.");
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        date={currentDate}
        onPreviousDate={handlePreviousDate}
        onNextDate={handleNextDate}
        onTodayClick={handleTodayClick}
        onDateSelect={handleDateSelect}
      />
      
      <div className="mb-6">
        {showAddForm ? (
          <AddTransportForm 
            onCancel={() => {
              setShowAddForm(false);
              setTransportToEdit(undefined);
            }}
            transportToEdit={transportToEdit}
            onSuccess={async () => {
              const fetchedTransports = await fetchTransportsByDate(dateStr);
              setTransports(fetchedTransports);
            }}
          />
        ) : (
          isAdmin && (
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-secondary hover:bg-secondary-hover text-secondary-foreground"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Add Transport Schedule
              </Button>
            </div>
          )
        )}
      </div>

      <ScheduleView 
        date={currentDate} 
        transports={transports} 
        role={isAdmin ? "admin" : "viewer"}
        onDeleteTransport={handleDeleteTransport}
        onEditTransport={handleEditTransport}
      />
    </div>
  );
}
