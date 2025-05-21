import React from 'react';
import { format } from 'date-fns';
import { Transport } from '@/lib/data';
import { TransportCard } from './transport-card';
import { FaInfoCircle } from 'react-icons/fa';

interface DailyViewProps {
  date: Date;
  transports: Transport[];
  role: 'admin' | 'employee';
}

export function DailyView({ date, transports, role }: DailyViewProps) {
  const formattedDate = format(date, 'yyyy-MM-dd');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daily Transports</h2>
        <div className="text-sm text-muted-foreground">
          {transports.length} transport{transports.length !== 1 ? 's' : ''} scheduled
        </div>
      </div>
      
      {transports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transports.map((transport) => (
            <TransportCard key={transport.id} transport={transport} role={role} />
          ))}
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