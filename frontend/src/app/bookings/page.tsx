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
import { Calendar, Plus, Search } from 'lucide-react';
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

  const [alert, setAlert] = useState<any>(null);

  const [formData, setFormData] = useState({
    bookingTypeId: '',
    scheduledAt: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  });

  // ==============================
  // LOAD DATA
  // ==============================

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

      setBookings(bookingsRes.data.data);
      setBookingTypes(typesRes.data.data);
      setWorkspace(workspaceRes.data.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load bookings' });
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // CREATE BOOKING
  // ==============================

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await bookingAPI.create({
        workspaceId: workspace.id,
        ...formData,
      });

      setAlert({ type: 'success', message: 'Booking created successfully!' });
      closeModal();
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  // ==============================
  // STATUS UPDATE
  // ==============================

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await bookingAPI.updateStatus(id, status);
      setAlert({ type: 'success', message: 'Status updated!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  // ==============================
  // DELETE BOOKING
  // ==============================

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;

    try {
      await bookingAPI.delete(id);
      setAlert({ type: 'success', message: 'Booking cancelled!' });
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

  // ==============================
  // OWNER REDIRECT LOGIC
  // ==============================

  const handleNewBookingClick = () => {
    if (user?.role === 'OWNER' && bookingTypes.length === 0) {
      setAlert({
        type: 'error',
        message: 'Please create at least one booking type first.',
      });

      setTimeout(() => {
        router.push('/bookings/admin');
      }, 1000);

      return;
    }

    setShowModal(true);
  };

  // ==============================
  // FILTER
  // ==============================

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.customerEmail
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL' || booking.status === filterStatus;

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

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-gray-500">Manage all appointments</p>
          </div>

          <div className="flex gap-3">
            {/* OWNER ONLY BUTTON */}
            {user?.role === 'OWNER' && (
              <Button
                variant="secondary"
                onClick={() => router.push('/bookings/admin')}
              >
                Manage Booking Types
              </Button>
            )}

            <Button onClick={handleNewBookingClick}>
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>


        {/* ALERT */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* FILTER */}
        <Card>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="border rounded-lg px-3 py-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </Card>

        {/* BOOKINGS LIST */}
        <Card>
          <div className="space-y-4">
            {filteredBookings.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No bookings found
              </div>
            )}

            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
              >
                <div>
                  <h4 className="font-semibold">{booking.customerName}</h4>
                  <p className="text-sm text-gray-500">
                    {booking.customerEmail}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(booking.scheduledAt)}
                  </p>
                </div>

                <div className="flex gap-3 items-center">
                  <select
                    value={booking.status}
                    onChange={(e) =>
                      handleStatusChange(booking.id, e.target.value)
                    }
                    className="border rounded-lg px-2 py-1 text-sm"
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
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* CREATE MODAL */}
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title="Create Booking"
        >
          <form onSubmit={handleCreate} className="space-y-4">

            <select
              className="input"
              value={formData.bookingTypeId}
              onChange={(e) =>
                setFormData({ ...formData, bookingTypeId: e.target.value })
              }
              required
            >
              <option value="">Select Booking Type</option>
              {bookingTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.duration} min)
                </option>
              ))}
            </select>

            <Input
              type="datetime-local"
              label="Scheduled At"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              required
            />

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

            <Input
              label="Phone"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
            />

            <textarea
              className="input"
              rows={3}
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
              >
                Cancel
              </Button>

              <Button type="submit">
                Create Booking
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
