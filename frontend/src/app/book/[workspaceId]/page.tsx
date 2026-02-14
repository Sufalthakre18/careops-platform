'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  MessageCircle,
  Loader2,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import AIChatbot from '@/components/AIChatbot';

interface BookingType {
  id: string;
  name: string;
  description: string;
  duration: number;
  location: string;
  price: number;
  currency: string;
}

interface Slot {
  time: string;
  dateTime: string;
}

export default function PublicBookingPortal({ workspaceId }: { workspaceId: string }) {
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    loadBookingTypes();
  }, []);

  useEffect(() => {
    if (selectedType && selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedType, selectedDate]);

  const loadBookingTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/types?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setBookingTypes(data.data);
      } else {
        alert('Failed to load available services');
      }
    } catch (err) {
      console.error(err);
      alert('Could not connect to booking service');
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadAvailableSlots = async (date: string) => {
    if (!selectedType) return;

    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/types/${selectedType.id}/available-slots?date=${date}`
      );
      const data = await res.json();

      if (data.success) {
        setAvailableSlots(data.data.slots || []);
      } else {
        console.log('No slots available for this date');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    // Validation
    if (!selectedType) {
      alert('Please select a service');
      return;
    }
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }
    if (!customerData.name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!customerData.email.trim()) {
      alert('Please enter your email');
      return;
    }

    setSubmitting(true);

    try {
      const slot = availableSlots.find((s) => s.time === selectedSlot);
      const scheduledAt = slot?.dateTime || `${selectedDate}T${selectedSlot}:00.000Z`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          bookingTypeId: selectedType.id,
          scheduledAt,
          customerName: customerData.name.trim(),
          customerEmail: customerData.email.trim(),
          customerPhone: customerData.phone.trim() || undefined,
          notes: customerData.notes.trim() || undefined,
        }),
      });

      const result = await res.json();

      if (result.success) {
        // Show success message
        setShowSuccess(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedType(null);
          setSelectedDate(new Date().toISOString().split('T')[0]);
          setSelectedSlot('');
          setAvailableSlots([]);
          setCustomerData({ name: '', email: '', phone: '', notes: '' });
        }, 3000);
      } else {
        alert(result.message || 'Booking failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Book Your Appointment
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Select a service, choose a convenient time, and we'll take care of the rest.
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-4 animate-in fade-in duration-300">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-green-900 text-lg">Booking Confirmed!</h3>
              <p className="text-green-700">
                Check your email for confirmation and details. We look forward to seeing you!
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12">
          {/* ─── LEFT ─── Services */}
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-600" />
              Available Services
            </h2>

            {loadingTypes ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              </div>
            ) : bookingTypes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No services available at the moment</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {bookingTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedType?.id === type.id
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {type.name}
                      </h3>
                      <ChevronRight
                        className={`w-6 h-6 transition-transform ${
                          selectedType?.id === type.id ? 'text-indigo-600 rotate-90' : 'text-gray-400'
                        }`}
                      />
                    </div>

                    <p className="mt-2 text-gray-600 line-clamp-2">{type.description}</p>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {type.duration} min
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {type.location || 'Location TBD'}
                      </div>
                      {type.price > 0 && (
                        <div className="flex items-center gap-1.5 font-medium text-indigo-700">
                          <DollarSign className="w-4 h-4" />
                          {type.currency} {type.price}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── RIGHT ─── Booking Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:sticky lg:top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Clock className="w-7 h-7 text-indigo-600" />
                Booking Details
              </h2>

              {!selectedType ? (
                <div className="text-center py-16">
                  <Calendar className="w-20 h-20 mx-auto text-gray-200 mb-6" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    Select a service to continue
                  </h3>
                  <p className="text-gray-500">
                    Choose one of our services on the left to see available times
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Service Summary */}
                  <div className="p-5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                    <p className="font-semibold text-indigo-900 text-lg">
                      {selectedType.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-indigo-700">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedType.duration} minutes
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedType.location}
                      </span>
                      {selectedType.price > 0 && (
                        <span className="font-medium flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {selectedType.currency} {selectedType.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      required
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Times <span className="text-red-500">*</span>
                      </label>

                      {loadingSlots ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot.dateTime}
                                type="button"
                                onClick={() => setSelectedSlot(slot.time)}
                                className={`py-3 px-4 rounded-xl text-center font-medium transition-all ${
                                  selectedSlot === slot.time
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-800 hover:bg-indigo-100 hover:text-indigo-700'
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                          <Clock className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">No available slots for this date.</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Try another day or service.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="space-y-5 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={customerData.notes}
                        onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                        placeholder="Any special requests or information we should know..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Create Booking Button */}
                  <button
                    onClick={handleBooking}
                    disabled={submitting || !selectedSlot}
                    className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Create Booking
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By creating a booking, you agree to receive confirmation emails and reminders.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="Open AI assistant"
      >
        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {/* AI Chatbot Window */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <AIChatbot workspaceId={workspaceId} onClose={() => setShowChatbot(false)} />
        </div>
      )}
    </div>
  );
}