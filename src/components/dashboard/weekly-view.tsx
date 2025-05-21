import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DaySchedule } from '@/lib/data';

interface WeeklyViewProps {
  date: Date;
  weeklySchedule: DaySchedule[];
  onSelectDate: (date: Date) => void;
}

export function WeeklyView({ date, weeklySchedule, onSelectDate }: WeeklyViewProps) {
  const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
  const endOfCurrentWeek = endOfWeek(date, { weekStartsOn: 1 });
  
  // Generate array of dates for the week
  const currentWeekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: endOfCurrentWeek,
  });
  
  // Count total transports for the week
  const totalTransports = weeklySchedule.reduce(
    (total, day) => total + day.transports.length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Weekly Overview</h2>
        <div className="text-sm text-muted-foreground">
          Week of {format(startOfCurrentWeek, 'MMM d')} - {format(endOfCurrentWeek, 'MMM d, yyyy')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="border-b">
            <h3 className="text-lg font-medium">Transport Calendar</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-0 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="p-4 border-b font-medium">
                  {day}
                </div>
              ))}
              
              {currentWeekDays.map((day) => {
                const dayData = weeklySchedule.find(
                  (d) => d.date === format(day, 'yyyy-MM-dd')
                );
                
                const transportCount = dayData ? dayData.transports.length : 0;
                const isCurrentDay = isSameDay(day, date);
                
                return (
                  <div
                    key={day.toString()}
                    className={`p-4 border border-t-0 ${
                      isCurrentDay ? 'bg-accent' : ''
                    } hover:bg-accent/50 cursor-pointer transition-colors`}
                    onClick={() => onSelectDate(day)}
                  >
                    <div className="font-medium">{format(day, 'd')}</div>
                    {transportCount > 0 ? (
                      <Badge className="mt-2 bg-primary">{transportCount}</Badge>
                    ) : (
                      <div className="w-6 h-6 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="border-b">
            <h3 className="text-lg font-medium">Weekly Summary</h3>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transports</p>
                <p className="text-2xl font-bold text-primary">{totalTransports}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Daily Breakdown</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Day</TableHead>
                      <TableHead>Transports</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklySchedule.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {format(new Date(day.date), 'EEE')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-full bg-muted h-2 rounded-full">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.max(day.transports.length * 10, 5)}%`,
                                }}
                              />
                            </div>
                            <span className="ml-2">{day.transports.length}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 