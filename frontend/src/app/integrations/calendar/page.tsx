'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event, View, Components } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { bookingAPI } from '@/lib/api';
import { handleApiError, formatDate } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu,
  Grid,
  List,
  CalendarDays
} from 'lucide-react';

// Custom CSS for premium look
const customStyles = `
  .rbc-calendar {
    font-family: 'Inter', sans-serif;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
  }
  .rbc-header {
    padding: 12px 4px;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
    color: #6b7280;
    border-bottom: 1px solid #f3f4f6;
  }
  .rbc-month-view {
    border: none;
  }
  .rbc-month-row {
    border-top: 1px solid #f3f4f6;
  }
  .rbc-day-bg {
    transition: background-color 0.2s;
  }
  .rbc-day-bg:hover {
    background-color: #f9fafb;
  }
  .rbc-today {
    background-color: #eff6ff;
  }
  .rbc-off-range-bg {
    background-color: #f9fafb;
  }
  .rbc-event {
    border: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .rbc-event:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  .rbc-toolbar {
    margin-bottom: 20px;
    padding: 12px 16px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .rbc-toolbar .rbc-toolbar-label {
    flex: 1 1 auto;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
    order: 1;
  }
  .rbc-toolbar .rbc-btn-group {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: white;
    display: inline-flex;
    order: 0;
  }
  .rbc-toolbar .rbc-btn-group:first-of-type {
    order: 0;
  }
  .rbc-toolbar .rbc-btn-group:last-of-type {
    order: 2;
  }
  .rbc-btn-group button {
    border: none;
    background: white;
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .rbc-btn-group button:hover {
    background: #f3f4f6;
  }
  .rbc-btn-group button.rbc-active {
    background: #6366f1;
    color: white;
  }
  .rbc-btn-group button svg {
    width: 16px;
    height: 16px;
  }
  .rbc-agenda-view {
    border-top: 1px solid #e5e7eb;
  }
  .rbc-agenda-table {
    border: none;
  }
  .rbc-agenda-table thead {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }
  .rbc-agenda-table th {
    padding: 10px;
    font-weight: 600;
    color: #374151;
  }
  .rbc-agenda-table td {
    padding: 12px 10px;
    border-bottom: 1px solid #f3f4f6;
  }
`;

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  status?: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  CONFIRMED: 'bg-green-100 border-green-300 text-green-800',
  COMPLETED: 'bg-blue-100 border-blue-300 text-blue-800',
  CANCELLED: 'bg-red-100 border-red-300 text-red-800',
  NO_SHOW: 'bg-gray-100 border-gray-300 text-gray-800',
};

const EventComponent = ({ event }: { event: CalendarEvent }) => {
  const status = event.resource?.status || 'PENDING';
  const colorClass = statusColors[status] || 'bg-gray-100 border-gray-300 text-gray-800';
  return (
    <div className={`px-2 py-1 rounded-md border-l-4 ${colorClass} text-xs font-medium truncate`}>
      {event.title}
    </div>
  );
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingAPI.getAll({ limit: 500 });
      const bookings = response.data.data;

      const calendarEvents: CalendarEvent[] = bookings.map((booking: any) => {
        const start = new Date(booking.scheduledAt);
        const end = new Date(start.getTime() + booking.duration * 60000);
        return {
          id: booking.id,
          title: `${booking.customerName} - ${booking.bookingType?.name || 'Booking'}`,
          start,
          end,
          resource: booking,
          status: booking.status,
        };
      });

      setEvents(calendarEvents);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleNavigate = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const todayEvents = useMemo(() => {
    return events.filter(event => isSameDay(event.start, new Date()));
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => event.start > now && event.status !== 'CANCELLED')
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 5);
  }, [events]);

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{customStyles}</style>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">Manage your schedule and bookings</p>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mini Date Picker Card */}
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-indigo-600" />
                Jump to Date
              </h3>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setSelectedDate(date);
                  }
                }}
              />
              <div className="flex mt-3 space-x-2">
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>

            {/* Today's Events */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-indigo-600" />
                Today ({todayEvents.length})
              </h3>
              <div className="space-y-2">
                {todayEvents.length > 0 ? (
                  todayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{event.resource?.customerName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusColors[event.status || 'PENDING']}`}>
                        {event.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No events today</p>
                )}
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-indigo-600" />
                Upcoming
              </h3>
              <div className="space-y-2">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{event.resource?.customerName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {format(event.start, 'MMM dd, h:mm a')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
                )}
              </div>
            </Card>
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <div className="h-[700px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  views={['month', 'week', 'day', 'agenda']}
                  defaultView="month"
                  view={view}
                  date={selectedDate}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                  onSelectEvent={handleSelectEvent}
                  popup
                  tooltipAccessor={(event: CalendarEvent) =>
                    `${event.title}\nTime: ${format(event.start, 'h:mm a')} - ${format(
                      event.end,
                      'h:mm a'
                    )}\nStatus: ${event.status || 'PENDING'}`
                  }
                  components={{
                    event: EventComponent,
                  }}
                  eventPropGetter={(event: CalendarEvent) => ({
                    className: `border-l-4 ${statusColors[event.status || 'PENDING']}`,
                  })}
                  messages={{
                    agenda: 'List',
                    day: 'Day',
                    month: 'Month',
                    week: 'Week',
                    work_week: 'Work Week',
                    today: 'Today',
                    previous: 'Prev',
                    next: 'Next',
                    showMore: (total) => `+${total} more`,
                  }}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Details</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium text-gray-900">{selectedEvent.resource?.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{selectedEvent.resource?.customerEmail}</p>
                  </div>
                </div>
                {selectedEvent.resource?.customerPhone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedEvent.resource?.customerPhone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}
                      <br />
                      {format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-gray-400 mt-0.5 flex items-center justify-center">
                    {selectedEvent.status === 'CONFIRMED' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : selectedEvent.status === 'CANCELLED' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-gray-900">{selectedEvent.status}</p>
                  </div>
                </div>
                {selectedEvent.resource?.bookingType?.location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{selectedEvent.resource.bookingType.location}</p>
                    </div>
                  </div>
                )}
                {selectedEvent.resource?.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-700 mt-1">{selectedEvent.resource.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}