'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { bookingTypeAPI, bookingAPI } from '@/lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function BookingAdminPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

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
  // CREATE / UPDATE BOOKING TYPE
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

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

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
                <div>
                  <h4 className="font-semibold">{type.name}</h4>
                  <p className="text-sm text-gray-500">
                    {type.description}
                  </p>
                  <p className="text-sm text-gray-400">
                    {type.duration} min • {type.currency} {type.price}
                  </p>
                </div>

                <div className="flex gap-2">
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

        {/* CREATE / EDIT MODAL */}
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingType ? 'Edit Booking Type' : 'Create Booking Type'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              label="Name"
              value={typeForm.name}
              onChange={(e) =>
                setTypeForm({ ...typeForm, name: e.target.value })
              }
              required
            />

            <Input
              label="Description"
              value={typeForm.description}
              onChange={(e) =>
                setTypeForm({ ...typeForm, description: e.target.value })
              }
            />

            <Input
              label="Duration (minutes)"
              type="number"
              value={typeForm.duration}
              onChange={(e) =>
                setTypeForm({ ...typeForm, duration: Number(e.target.value) })
              }
              required
            />

            <Input
              label="Location"
              value={typeForm.location}
              onChange={(e) =>
                setTypeForm({ ...typeForm, location: e.target.value })
              }
            />

            <Input
              label="Price"
              type="number"
              value={typeForm.price}
              onChange={(e) =>
                setTypeForm({ ...typeForm, price: Number(e.target.value) })
              }
            />

            <Input
              label="Currency (USD, INR, EUR...)"
              value={typeForm.currency}
              onChange={(e) =>
                setTypeForm({ ...typeForm, currency: e.target.value })
              }
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={closeModal}
              >
                Cancel
              </Button>

              <Button type="submit">
                {editingType ? 'Update' : 'Create'}
              </Button>
            </div>

          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
