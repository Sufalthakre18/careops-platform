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
import { formAPI } from '@/lib/api';
import { formatDate, handleApiError } from '@/lib/utils';
import { FileText, Plus, Eye } from 'lucide-react';

export default function FormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'INTAKE',
    fields: [] as any[],
  });

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const response = await formAPI.getAll();
      setForms(response.data.data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedForm) {
        await formAPI.update(selectedForm.id, formData);
        setAlert({ type: 'success', message: 'Form updated successfully!' });
      } else {
        await formAPI.create(formData);
        setAlert({ type: 'success', message: 'Form created successfully!' });
      }
      setShowModal(false);
      setSelectedForm(null);
      resetForm();
      loadForms();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      await formAPI.delete(id);
      setAlert({ type: 'success', message: 'Form deleted successfully!' });
      loadForms();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const loadSubmissions = async (formId: string) => {
    try {
      const response = await formAPI.getSubmissions(formId);
      setSubmissions(response.data.data);
      setShowSubmissions(true);
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'INTAKE',
      fields: [],
    });
  };

  const openEditModal = (form: any) => {
    setSelectedForm(form);
    setFormData({
      name: form.name,
      description: form.description || '',
      type: form.type,
      fields: form.fields || [],
    });
    setShowModal(true);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
            <p className="text-gray-600 mt-1">Manage customer forms and submissions</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedForm(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Form
          </Button>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.length > 0 ? (
            forms.map((form) => (
              <Card key={form.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {form.description || 'No description'}
                      </p>
                    </div>
                    <Badge variant="info">{form.type}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{form._count?.submissions || 0} submissions</span>
                    <span>Created {formatDate(form.createdAt, 'MMM dd, yyyy')}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadSubmissions(form.id)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(form)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(form.id)}
                    >
                      Delete
                    </Button>
                  </div>

                  {form.publicUrl && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Public URL:</p>
                      <input
                        type="text"
                        value={form.publicUrl}
                        readOnly
                        className="w-full text-xs px-2 py-1 bg-gray-50 border border-gray-300 rounded"
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No forms yet</p>
              <p className="text-sm mt-1">Create your first form to get started</p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedForm(null);
            resetForm();
          }}
          title={selectedForm ? 'Edit Form' : 'Create New Form'}
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedForm(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {selectedForm ? 'Update' : 'Create'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Form Name"
              placeholder="Customer Intake Form"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Type
              </label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="INTAKE">Intake Form</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="CONSENT">Consent Form</option>
                <option value="FEEDBACK">Feedback</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Describe this form..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </form>
        </Modal>

        {/* Submissions Modal */}
        <Modal
          isOpen={showSubmissions}
          onClose={() => setShowSubmissions(false)}
          title="Form Submissions"
          size="xl"
        >
          <div className="space-y-4">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {submission.contact?.firstName} {submission.contact?.lastName}
                    </p>
                    <Badge variant={submission.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {submission.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Submitted {formatDate(submission.submittedAt, 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No submissions yet</p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}