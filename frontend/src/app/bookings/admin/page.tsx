'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Badge from '@/components/ui/Badge';
import { bookingTypeAPI, bookingAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';

export default function BookingAdminPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedTypeForAvailability, setSelectedTypeForAvailability] = useState<any>(null);
  const [availabilityList, setAvailabilityList] = useState<any[]>([]);
  const [availabilityForm, setAvailabilityForm] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
  });
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [alert, setAlert] = useState<any>(null);

  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
    duration: 30,
    location: '',
    price: 0,
    currency: 'USD',
  });

  // =============================
  // LOAD DATA
  // =============================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [typesRes, bookingsRes] = await Promise.all([
        bookingTypeAPI.getAll(),
        bookingAPI.getAll(),
      ]);

      setTypes(typesRes.data.data);
      setBookings(bookingsRes.data.data);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // BOOKING TYPE CRUD
  // =============================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: typeForm.name,
      description: typeForm.description,
      duration: Number(typeForm.duration),
      location: typeForm.location,
      price: Number(typeForm.price),
      currency: typeForm.currency,
    };

    try {
      if (editingType) {
        await bookingTypeAPI.update(editingType.id, payload);
        setAlert({ type: 'success', message: 'Booking type updated' });
      } else {
        await bookingTypeAPI.create(payload);
        setAlert({ type: 'success', message: 'Booking type created' });
      }

      closeModal();
      loadData();
    } catch {
      setAlert({ type: 'error', message: 'Something went wrong' });
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Delete this booking type?')) return;

    try {
      await bookingTypeAPI.delete(id);
      setAlert({ type: 'success', message: 'Deleted successfully' });
      loadData();
    } catch {
      setAlert({ type: 'error', message: 'Delete failed' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingType(null);
    setTypeForm({
      name: '',
      description: '',
      duration: 30,
      location: '',
      price: 0,
      currency: 'USD',
    });
  };

  // =============================
  // AVAILABILITY MANAGEMENT
  // =============================

  const openAvailabilityModal = async (type: any) => {
    setSelectedTypeForAvailability(type);
    setShowAvailabilityModal(true);
    await loadAvailability(type.id);
  };

  const loadAvailability = async (typeId: string) => {
    setLoadingAvailability(true);
    try {
      const response = await bookingTypeAPI.getAvailability(typeId);
      setAvailabilityList(response.data.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load availability' });
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeForAvailability) return;

    try {
      await bookingTypeAPI.addAvailability(selectedTypeForAvailability.id, availabilityForm);
      setAlert({ type: 'success', message: 'Availability added' });
      // Reload availability
      await loadAvailability(selectedTypeForAvailability.id);
      // Reset form
      setAvailabilityForm({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
      });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to add availability' });
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (!confirm('Delete this availability slot?')) return;

    try {
      await bookingTypeAPI.deleteAvailability(availabilityId);
      setAlert({ type: 'success', message: 'Availability deleted' });
      // Reload availability
      if (selectedTypeForAvailability) {
        await loadAvailability(selectedTypeForAvailability.id);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete availability' });
    }
  };

  // =============================
  // RENDER
  // =============================

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

  const daysOfWeek = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* BOOKING TYPES */}
        <Card
          title="Booking Types"
          action={
            <Button
              onClick={() => {
                closeModal();
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Type
            </Button>
          }
        >
          <div className="space-y-4">
            {types.map((type) => (
              <div
                key={type.id}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{type.name}</h4>
                  <p className="text-sm text-gray-500">{type.description}</p>
                  <p className="text-sm text-gray-400">
                    {type.duration} min • {type.currency} {type.price}
                  </p>
                  <div className="mt-2">
                    <Badge variant="info" className="mr-2">
                      {type.availability?.length || 0} time slots
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openAvailabilityModal(type)}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Availability
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingType(type);
                      setTypeForm({
                        name: type.name,
                        description: type.description || '',
                        duration: type.duration,
                        location: type.location || '',
                        price: type.price || 0,
                        currency: type.currency || 'USD',
                      });
                      setShowModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteType(type.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* CREATE / EDIT BOOKING TYPE MODAL */}
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingType ? 'Edit Booking Type' : 'Create Booking Type'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              required
            />
            <Input
              label="Description"
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={typeForm.duration}
              onChange={(e) => setTypeForm({ ...typeForm, duration: Number(e.target.value) })}
              required
            />
            <Input
              label="Location"
              value={typeForm.location}
              onChange={(e) => setTypeForm({ ...typeForm, location: e.target.value })}
            />
            <Input
              label="Price"
              type="number"
              value={typeForm.price}
              onChange={(e) => setTypeForm({ ...typeForm, price: Number(e.target.value) })}
            />
            <Input
              label="Currency (USD, INR, EUR...)"
              value={typeForm.currency}
              onChange={(e) => setTypeForm({ ...typeForm, currency: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">{editingType ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Modal>

        {/* AVAILABILITY MODAL */}
        <Modal
          isOpen={showAvailabilityModal}
          onClose={() => {
            setShowAvailabilityModal(false);
            setSelectedTypeForAvailability(null);
            setAvailabilityList([]);
          }}
          title={`Manage Availability: ${selectedTypeForAvailability?.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Add new availability form */}
            <form onSubmit={handleAddAvailability} className="space-y-4 border-b pb-4">
              <h3 className="font-medium">Add New Time Slot</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    className="input"
                    value={availabilityForm.dayOfWeek}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, dayOfWeek: e.target.value })
                    }
                    required
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="input"
                    value={availabilityForm.startTime}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    className="input"
                    value={availabilityForm.endTime}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Add Slot
                </Button>
              </div>
            </form>

            {/* Existing availability list */}
            <div>
              <h3 className="font-medium mb-3">Current Availability</h3>
              {loadingAvailability ? (
                <Loading />
              ) : availabilityList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No availability slots configured.</p>
              ) : (
                <div className="space-y-2">
                  {availabilityList.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {slot.dayOfWeek.charAt(0) + slot.dayOfWeek.slice(1).toLowerCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteAvailability(slot.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}