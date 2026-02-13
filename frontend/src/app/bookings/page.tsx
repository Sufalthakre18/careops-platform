'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { bookingAPI, bookingTypeAPI, contactAPI } from '@/lib/api';
import { formatDate, formatRelativeTime, handleApiError } from '@/lib/utils';
import { Calendar, Plus, Filter, Search } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingTypes, setBookingTypes] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    contactId: '',
    bookingTypeId: '',
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, typesRes, contactsRes] = await Promise.all([
        bookingAPI.getAll(),
        bookingTypeAPI.getAll(),
        contactAPI.getAll(),
      ]);
      setBookings(bookingsRes.data.data);
      setBookingTypes(typesRes.data.data);
      setContacts(contactsRes.data.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookingAPI.create(formData);
      setAlert({ type: 'success', message: 'Booking created successfully!' });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookingAPI.update(selectedBooking.id, formData);
      setAlert({ type: 'success', message: 'Booking updated successfully!' });
      setShowModal(false);
      setSelectedBooking(null);
      resetForm();
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await bookingAPI.updateStatus(id, status);
      setAlert({ type: 'success', message: 'Status updated successfully!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      await bookingAPI.delete(id);
      setAlert({ type: 'success', message: 'Booking deleted successfully!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const resetForm = () => {
    setFormData({
      contactId: '',
      bookingTypeId: '',
      startTime: '',
      endTime: '',
      location: '',
      notes: '',
    });
  };

  const openEditModal = (booking: any) => {
    setSelectedBooking(booking);
    setFormData({
      contactId: booking.contactId,
      bookingTypeId: booking.bookingTypeId,
      startTime: new Date(booking.startTime).toISOString().slice(0, 16),
      endTime: new Date(booking.endTime).toISOString().slice(0, 16),
      location: booking.location || '',
      notes: booking.notes || '',
    });
    setShowModal(true);
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingType.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-1">Manage all your appointments</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedBooking(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bookings..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </Card>

        {/* Bookings List */}
        <Card>
          <div className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {booking.bookingType.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {booking.contact.firstName} {booking.contact.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(booking.startTime, 'MMM dd, yyyy · h:mm a')} -{' '}
                        {formatDate(booking.endTime, 'h:mm a')}
                      </p>
                      {booking.location && (
                        <p className="text-xs text-gray-500">📍 {booking.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <select
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No Show</option>
                    </select>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(booking)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(booking.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No bookings found</p>
                <p className="text-sm mt-1">Create your first booking to get started</p>
              </div>
            )}
          </div>
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedBooking(null);
            resetForm();
          }}
          title={selectedBooking ? 'Edit Booking' : 'Create New Booking'}
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedBooking(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={selectedBooking ? handleUpdate : handleCreate}
              >
                {selectedBooking ? 'Update' : 'Create'}
              </Button>
            </div>
          }
        >
          <form onSubmit={selectedBooking ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                required
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} - {contact.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={formData.bookingTypeId}
                onChange={(e) => setFormData({ ...formData, bookingTypeId: e.target.value })}
                required
              >
                <option value="">Select a type</option>
                {bookingTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.duration} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="Start Time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              <Input
                type="datetime-local"
                label="End Time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>

            <Input
              label="Location"
              placeholder="Enter location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}