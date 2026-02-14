'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { contactAPI, workspaceAPI } from '@/lib/api';
import { formatDate, handleApiError } from '@/lib/utils';
import { Users, Plus, Search, Mail, Phone, Edit, Trash2, X } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    loadContacts();
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      const res = await workspaceAPI.getCurrent();
      setWorkspaceId(res.data.data.id);
    } catch (error) {
      console.error('Error loading workspace:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await contactAPI.getAll();
      setContacts(response.data.data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setAlert({ type: 'error', message: 'Failed to load contacts' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspaceId) {
      setModalError('Workspace not loaded. Please refresh.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      if (selectedContact) {
        // Update
        await contactAPI.update(selectedContact.id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
        });
        setAlert({ type: 'success', message: 'Contact updated successfully!' });
      } else {
        // Create
        await contactAPI.create({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          message: formData.message.trim() || undefined,
          workspaceId,
        });
        setAlert({ type: 'success', message: 'Contact created successfully!' });
      }

      closeModal();
      loadContacts();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Operation failed. Please try again.';
      setModalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact? This cannot be undone.')) return;

    try {
      await contactAPI.delete(id);
      setAlert({ type: 'success', message: 'Contact deleted successfully!' });
      loadContacts();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContact(null);
    setModalError(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    });
  };

  const openCreateModal = () => {
    setSelectedContact(null);
    resetForm();
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (contact: any) => {
    setSelectedContact(contact);
    setModalError(null);
    setFormData({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      message: contact.message || '',
    });
    setShowModal(true);
  };

  const filteredContacts = contacts.filter((contact) =>
    `${contact.firstName || ''} ${contact.lastName || ''} ${contact.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
              Contacts
            </h1>
            <p className="text-gray-600 mt-1">Manage your customer relationships</p>
          </div>

          <Button
            onClick={openCreateModal}
            disabled={!workspaceId}
            className="w-full sm:w-auto flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Contact
          </Button>
        </div>

        {/* Page-level Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Search & Filter */}
        <Card className="border-none shadow-sm bg-white rounded-xl">
          <div className="p-4 md:p-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Contacts List */}
        <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-16 md:py-24">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No contacts yet</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'No matching contacts found'
                  : 'Add your first contact to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors duration-150 gap-4"
                >
                  {/* Contact Info */}
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-medium text-lg">
                        {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '') || '?'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {contact.firstName} {contact.lastName}
                      </h4>

                      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1.5 text-gray-500" />
                          <span className="truncate max-w-[180px]">{contact.email}</span>
                        </div>

                        {contact.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1.5 text-gray-500" />
                            {contact.phone}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1.5">
                        Added {formatDate(contact.createdAt, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(contact)}
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(contact.id)}
                      className="flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Create / Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={selectedContact ? 'Edit Contact' : 'Add New Contact'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {modalError && (
              <Alert
                type="error"
                message={modalError}
                onClose={() => setModalError(null)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="John"
              />

              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Doe"
              />
            </div>

            <Input
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              required
            />

            <Input
              type="tel"
              label="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+91 98765 43210"
            />

            {!selectedContact && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Initial Message (optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 min-h-[100px]"
                  placeholder="Any message or note from this contact..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={submitting} loading={submitting}>
                {submitting
                  ? 'Saving...'
                  : selectedContact
                  ? 'Update Contact'
                  : 'Add Contact'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}