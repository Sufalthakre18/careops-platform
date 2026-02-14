'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { bookingAPI, bookingTypeAPI, workspaceAPI } from '@/lib/api';
import { formatDate, handleApiError } from '@/lib/utils';
import { Calendar, Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingTypes, setBookingTypes] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    bookingTypeId: '',
    scheduledAt: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, typesRes, workspaceRes] = await Promise.all([
        bookingAPI.getAll(),
        bookingTypeAPI.getAll(),
        workspaceAPI.getCurrent(),
      ]);

      setBookings(bookingsRes.data.data || []);
      setBookingTypes(typesRes.data.data || []);
      setWorkspace(workspaceRes.data.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load bookings' });
    } finally {
      setLoading(false);
    }
  };

  // Create new booking
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookingAPI.create({
        workspaceId: workspace?.id,
        ...formData,
      });
      setAlert({ type: 'success', message: 'Booking created successfully!' });
      closeModal();
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  // Update booking status
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await bookingAPI.updateStatus(id, status);
      setAlert({ type: 'success', message: 'Status updated!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  // Cancel booking
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingAPI.delete(id);
      setAlert({ type: 'success', message: 'Booking cancelled successfully!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      bookingTypeId: '',
      scheduledAt: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
    });
  };

  const handleNewBookingClick = () => {
    if (user?.role === 'OWNER' && bookingTypes.length === 0) {
      setAlert({
        type: 'error',
        message: 'Please create at least one booking type first.',
      });
      setTimeout(() => router.push('/bookings/admin'), 1800);
      return;
    }
    setShowModal(true);
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      (booking.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.customerEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase());

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
      <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Bookings
            </h1>
            <p className="text-gray-600 mt-1">Manage and view all appointments</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {user?.role === 'OWNER' && (
              <Button
                variant="secondary"
                onClick={() => router.push('/bookings/admin')}
                className="w-full sm:w-auto"
              >
                Manage Booking Types
              </Button>
            )}
            <Button
              onClick={handleNewBookingClick}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
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
        <Card className="border-none shadow-sm bg-white rounded-xl">
          <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              className="w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </Card>

        {/* Bookings List */}
        <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 md:py-24">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No bookings found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Create your first booking to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Left - Info */}
                  <div className="flex-1 mb-4 sm:mb-0">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {booking.customerName}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{booking.customerEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(booking.scheduledAt, 'MMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>

                  {/* Right - Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <select
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                      className="w-full sm:w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No Show</option>
                    </select>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(booking.id)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Create Booking Modal */}
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title="Create New Booking"
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                value={formData.bookingTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, bookingTypeId: e.target.value })
                }
                required
              >
                <option value="">Select a service...</option>
                {bookingTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.duration} min)
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="datetime-local"
              label="Date & Time"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Customer Name"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                required
              />
              <Input
                label="Customer Email"
                type="email"
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, customerEmail: e.target.value })
                }
                required
              />
            </div>

            <Input
              label="Phone Number"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 min-h-[100px]"
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button type="submit">Create Booking</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}