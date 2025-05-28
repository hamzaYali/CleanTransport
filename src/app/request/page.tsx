'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { addTransport } from '@/lib/db-service';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '@/lib/auth-context';

export default function RequestTransportPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Redirect non-admin users to home page
  if (!user) {
    router.push('/');
    return null;
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [date, setDate] = useState<Date>(new Date());
  const [form, setForm] = useState({
    name: '',
    phone: '',
    pickupLocation: '',
    pickupTime: '',
    dropoffLocation: '',
    dropoffTime: '',
    clientCount: 1,
    carSeats: 0,
    notes: '',
    staffRequestedBy: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const transportData = {
        client: {
          name: form.name,
          phone: form.phone,
        },
        pickup: {
          location: form.pickupLocation,
          time: form.pickupTime,
          date: format(date, 'yyyy-MM-dd'),
        },
        dropoff: {
          location: form.dropoffLocation,
          time: form.dropoffTime,
          date: format(date, 'yyyy-MM-dd'),
        },
        staff: {
          requestedBy: form.staffRequestedBy,
          driver: '',
        },
        clientCount: parseInt(form.clientCount.toString()),
        carSeats: parseInt(form.carSeats.toString()),
        status: 'scheduled' as const,
        notes: form.notes || '',
      };

      const result = await addTransport(transportData);
      
      if (result) {
        toast.success('Transport request submitted successfully!');
        router.push('/');
      } else {
        toast.error('Failed to submit transport request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting transport request:', error);
      toast.error('Failed to submit transport request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return !!form.name && !!form.phone && !!form.staffRequestedBy;
      case 2:
        return !!form.pickupLocation && !!form.pickupTime && !!form.dropoffLocation;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  const steps = [
    { number: 1, title: 'Client Details' },
    { number: 2, title: 'Trip Information' },
    { number: 3, title: 'Additional Details' }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-base">Client Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-2"
                  placeholder="Enter client's full name"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-base">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="mt-2"
                  placeholder="Enter contact phone number"
                />
              </div>
              <div>
                <Label htmlFor="staffRequestedBy" className="text-base">Staff Member</Label>
                <select
                  id="staffRequestedBy"
                  name="staffRequestedBy"
                  value={form.staffRequestedBy}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select requesting staff member</option>
                  <option value="Abdullah L. - 531-444-9529">Abdullah L. - 531-444-9529</option>
                  <option value="Adam A. - 402-889-7086">Adam A. - 402-889-7086</option>
                  <option value="Aramy G. - 531-250-7069">Aramy G. - 531-250-7069</option>
                  <option value="Beatrice M. - 402-810-0116">Beatrice M. - 402-810-0116</option>
                  <option value="Bibi Z. - 402-677-4111">Bibi Z. - 402-677-4111</option>
                  <option value="Celina O. - 531-444-8631">Celina O. - 531-444-8631</option>
                  <option value="Claire Y. - 531-250-5462">Claire Y. - 531-250-5462</option>
                  <option value="Eh Say - 531-444-8689">Eh Say - 531-444-8689</option>
                  <option value="Ehblu W. - 402-889-7091">Ehblu W. - 402-889-7091</option>
                  <option value="Ehtheyu S. - 402-810-0693">Ehtheyu S. - 402-810-0693</option>
                  <option value="Fartun A. - 531-444-9528">Fartun A. - 531-444-9528</option>
                  <option value="Jamie G. - 531-250-7083">Jamie G. - 531-250-7083</option>
                  <option value="Janeth A. - 402-677-5127">Janeth A. - 402-677-5127</option>
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
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div>
              <Label className="text-base">Transport Date</Label>
              <DatePicker 
                date={date} 
                onSelect={setDate} 
                className="mt-2 w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="pickupTime" className="text-base">Pickup Time</Label>
                <Input
                  id="pickupTime"
                  name="pickupTime"
                  type="time"
                  value={form.pickupTime}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="dropoffTime" className="text-base">Return Time <span className="text-sm text-gray-500">(optional)</span></Label>
                <Input
                  id="dropoffTime"
                  name="dropoffTime"
                  type="time"
                  value={form.dropoffTime}
                  onChange={handleChange}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pickupLocation" className="text-base">Pickup Address</Label>
              <Input
                id="pickupLocation"
                name="pickupLocation"
                value={form.pickupLocation}
                onChange={handleChange}
                required
                className="mt-2"
                placeholder="Enter pickup location"
              />
            </div>

            <div>
              <Label htmlFor="dropoffLocation" className="text-base">Dropoff Address</Label>
              <Input
                id="dropoffLocation"
                name="dropoffLocation"
                value={form.dropoffLocation}
                onChange={handleChange}
                required
                className="mt-2"
                placeholder="Enter destination address"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="clientCount" className="text-base">Number of Passengers</Label>
                <Input
                  id="clientCount"
                  name="clientCount"
                  type="number"
                  min="1"
                  value={form.clientCount}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="carSeats" className="text-base">Car Seats Needed</Label>
                <Input
                  id="carSeats"
                  name="carSeats"
                  type="number"
                  min="0"
                  value={form.carSeats}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-base">Additional Notes <span className="text-sm text-gray-500">(optional)</span></Label>
              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="mt-2 resize-none"
                placeholder="Any special requirements or information we should know about"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button 
            type="button" 
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Transport Request</h1>
          <div className="w-[72px]"></div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                      ${currentStep === step.number 
                        ? 'bg-primary text-white' 
                        : currentStep > step.number 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'}`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span className={`text-sm ${currentStep === step.number ? 'text-primary font-medium' : 'text-gray-600'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className={`h-1 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {renderStep()}
              
              <div className="flex justify-between pt-8 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="text-gray-600"
                  >
                    <FaArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed}
                    className="bg-primary text-white"
                  >
                    Next
                    <FaArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="bg-primary text-white" 
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 