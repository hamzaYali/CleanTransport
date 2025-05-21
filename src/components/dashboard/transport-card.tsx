import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaMapMarkerAlt, FaClock, FaUser, FaCar, FaClipboard } from 'react-icons/fa';
import { Transport } from '@/lib/data';

interface TransportCardProps {
  transport: Transport;
  role: 'admin' | 'employee';
}

export function TransportCard({ transport, role }: TransportCardProps) {
  const statusClass = {
    completed: 'status-badge-completed',
    'in-progress': 'status-badge-in-progress',
    scheduled: 'status-badge-scheduled',
  }[transport.status];

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200">
      <div className="gradient-card-header flex justify-between items-center">
        <h3 className="font-bold">Transport #{transport.id}</h3>
        <Badge className={statusClass}>
          {transport.status === 'in-progress' ? 'In Progress' : transport.status.charAt(0).toUpperCase() + transport.status.slice(1)}
        </Badge>
      </div>
      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Client</h4>
          <div className="flex items-center space-x-2">
            <FaUser className="text-primary h-4 w-4" />
            <div>
              <p className="font-medium">{transport.client.name}</p>
              <p className="text-sm text-muted-foreground">{transport.client.phone}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Pickup</h4>
            <div className="flex items-start space-x-2">
              <FaMapMarkerAlt className="text-pickup h-4 w-4 mt-1" />
              <div>
                <p className="font-medium pickup-location">{transport.pickup.location}</p>
                <div className="flex items-center mt-1">
                  <FaClock className="text-muted-foreground h-3 w-3 mr-1" />
                  <p className="text-sm text-muted-foreground">{transport.pickup.time}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Dropoff</h4>
            <div className="flex items-start space-x-2">
              <FaMapMarkerAlt className="text-dropoff h-4 w-4 mt-1" />
              <div>
                <p className="font-medium dropoff-location">{transport.dropoff.location}</p>
                <div className="flex items-center mt-1">
                  <FaClock className="text-muted-foreground h-3 w-3 mr-1" />
                  <p className="text-sm text-muted-foreground">{transport.dropoff.time}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Staff</h4>
            <p className="text-sm">Driver: {transport.staff.driver}</p>
            {transport.staff.assistant && (
              <p className="text-sm">Assistant: {transport.staff.assistant}</p>
            )}
          </div>

          <div>
            {transport.vehicle && (
              <div className="flex items-center space-x-2 mb-1">
                <FaCar className="text-muted-foreground h-3 w-3" />
                <p className="text-sm">{transport.vehicle}</p>
              </div>
            )}
            {transport.notes && (
              <div className="flex items-center space-x-2">
                <FaClipboard className="text-muted-foreground h-3 w-3" />
                <p className="text-sm">{transport.notes}</p>
              </div>
            )}
          </div>
        </div>

        {role === 'admin' && (
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 