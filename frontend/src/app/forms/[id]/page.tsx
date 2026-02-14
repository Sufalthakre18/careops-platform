'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formAPI, bookingTypeAPI } from '@/lib/api';
import { handleApiError } from '@/lib/utils';
import { Link2, Save, ArrowLeft, Eye } from 'lucide-react';

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<any>(null);
  const [bookingTypes, setBookingTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [linkData, setLinkData] = useState({
    bookingTypeId: '',
    sendAfterBooking: true,
    reminderAfterDays: 1,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'INTAKE',
    config: { fields: [] as any[] },
  });

  useEffect(() => {
    loadData();
  }, [formId]);

  const loadData = async () => {
    try {
      const [formRes, typesRes] = await Promise.all([
        formAPI.getById(formId),
        bookingTypeAPI.getAll(),
      ]);

      const formData = formRes.data.data;
      setForm(formData);
      setFormData({
        name: formData.name,
        description: formData.description || '',
        type: formData.type,
        config: formData.config || { fields: [] },
      });

      setBookingTypes(typesRes.data.data);
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await formAPI.update(formId, formData);
      setAlert({ type: 'success', message: 'Form updated successfully!' });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkBookingType = async () => {
    if (!linkData.bookingTypeId) {
      setAlert({ type: 'error', message: 'Please select a booking type' });
      return;
    }

    try {
      await formAPI.linkToBookingType(formId, linkData.bookingTypeId, {
        sendAfterBooking: linkData.sendAfterBooking,
        reminderAfterDays: linkData.reminderAfterDays,
      });
      setAlert({ type: 'success', message: 'Form linked to booking type!' });
      setShowLinkModal(false);
      setLinkData({ bookingTypeId: '', sendAfterBooking: true, reminderAfterDays: 1 });
      loadData();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const addField = () => {
    setFormData({
      ...formData,
      config: {
        fields: [...formData.config.fields, { label: '', type: 'text', required: false }],
      },
    });
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...formData.config.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData({ ...formData, config: { fields: newFields } });
  };

  const removeField = (index: number) => {
    const newFields = formData.config.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, config: { fields: newFields } });
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/forms')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{form?.name}</h1>
              <p className="text-gray-600 mt-1">Configure and manage your form</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => setShowLinkModal(true)}>
              <Link2 className="w-4 h-4 mr-2" />
              Link to Booking
            </Button>
            <Button variant="secondary" onClick={() => setShowSubmissionsModal(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Submissions ({form?.submissions?.length || 0})
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Basic Info */}
        <Card title="Basic Information">
          <div className="space-y-4">
            <Input
              label="Form Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form Type</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="CONTACT">Contact Form</option>
                <option value="INTAKE">Intake Form</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="CUSTOM">Custom Form</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Form Fields */}
        <Card
          title="Form Fields"
          description="Design your form fields"
          action={
            <Button size="sm" variant="secondary" onClick={addField}>
              Add Field
            </Button>
          }
        >
          <div className="space-y-3">
            {formData.config.fields.map((field, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Field Label"
                    value={field.label}
                    onChange={(e) => updateField(index, 'label', e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                    <select
                      className="input"
                      value={field.type}
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="tel">Phone</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 rounded"
                      checked={field.required}
                      onChange={(e) => updateField(index, 'required', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Required Field</span>
                  </label>

                  <Button size="sm" variant="danger" onClick={() => removeField(index)}>
                    Remove Field
                  </Button>
                </div>
              </div>
            ))}

            {formData.config.fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No fields added yet. Click "Add Field" to get started.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Linked Booking Types */}
        <Card title="Linked Booking Types" description="Forms connected to booking types">
          {form?.bookingTypes && form.bookingTypes.length > 0 ? (
            <div className="space-y-2">
              {form.bookingTypes.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{link.bookingType.name}</p>
                    <p className="text-sm text-gray-600">
                      {link.sendAfterBooking ? 'Sent after booking' : 'Manual send'}
                      {link.reminderAfterDays && ` • Reminder after ${link.reminderAfterDays} day(s)`}
                    </p>
                  </div>
                  <Badge variant="success">Linked</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No booking types linked yet</p>
            </div>
          )}
        </Card>

        {/* Link Modal */}
        <Modal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          title="Link Form to Booking Type"
          footer={
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleLinkBookingType}>
                Link Form
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={linkData.bookingTypeId}
                onChange={(e) => setLinkData({ ...linkData, bookingTypeId: e.target.value })}
              >
                <option value="">Select booking type</option>
                {bookingTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded"
                checked={linkData.sendAfterBooking}
                onChange={(e) => setLinkData({ ...linkData, sendAfterBooking: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Send automatically after booking</span>
            </label>

            <Input
              type="number"
              label="Reminder After Days"
              value={linkData.reminderAfterDays}
              onChange={(e) =>
                setLinkData({ ...linkData, reminderAfterDays: parseInt(e.target.value) || 1 })
              }
              min={1}
            />
          </div>
        </Modal>

        {/* Submissions Modal */}
        <Modal
          isOpen={showSubmissionsModal}
          onClose={() => setShowSubmissionsModal(false)}
          title="Form Submissions"
          size="xl"
        >
          <div className="space-y-3">
            {form?.submissions && form.submissions.length > 0 ? (
              form.submissions.map((submission: any) => (
                <div key={submission.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {submission.contact?.firstName} {submission.contact?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={submission.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {submission.status}
                    </Badge>
                  </div>
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