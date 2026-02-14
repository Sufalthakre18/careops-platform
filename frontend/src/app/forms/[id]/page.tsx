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
import { Link2, Save, ArrowLeft, Eye, Plus, Trash2 } from 'lucide-react';

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

      const formDataFromApi = formRes.data.data;
      setForm(formDataFromApi);
      setFormData({
        name: formDataFromApi.name || '',
        description: formDataFromApi.description || '',
        type: formDataFromApi.type || 'INTAKE',
        config: formDataFromApi.config || { fields: [] },
      });

      setBookingTypes(typesRes.data.data || []);
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
      setAlert({ type: 'success', message: 'Form saved successfully!' });
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
      setAlert({ type: 'success', message: 'Form successfully linked!' });
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
        ...formData.config,
        fields: [...formData.config.fields, { label: '', type: 'text', required: false }],
      },
    });
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...formData.config.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData({
      ...formData,
      config: { ...formData.config, fields: newFields },
    });
  };

  const removeField = (index: number) => {
    const newFields = formData.config.fields.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      config: { ...formData.config, fields: newFields },
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
      <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/forms')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                {form?.name || 'Form Builder'}
              </h1>
              <p className="text-gray-600 mt-1">Customize your form fields & settings</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => setShowLinkModal(true)}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Link to Booking
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowSubmissionsModal(true)}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Submissions ({form?.submissions?.length || 0})
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Basic Info */}
        <Card className="border-none shadow-sm rounded-xl">
          <div className="p-5 md:p-6 space-y-5">
            <Input
              label="Form Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. New Client Intake Form"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Form Type
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="CONTACT">Contact Form</option>
                <option value="INTAKE">Intake Form</option>
                <option value="AGREEMENT">Agreement Form</option>
                <option value="CUSTOM">Custom Form</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 min-h-[100px]"
                rows={3}
                placeholder="Brief description of what this form is for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Form Fields */}
        <Card
          title="Form Fields"
          description="Add, edit, or remove questions your customers will answer"
          className="border-none shadow-sm rounded-xl"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={addField}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Field
            </Button>
          }
        >
          <div className="p-5 md:p-6 space-y-4">
            {formData.config.fields.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-lg font-medium">No fields yet</p>
                <p className="text-sm mt-2">Click "Add Field" to start building your form</p>
              </div>
            ) : (
              formData.config.fields.map((field: any, index: number) => (
                <div
                  key={index}
                  className="p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4 hover:shadow-sm transition-shadow"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Field Label *"
                      value={field.label}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                      placeholder="e.g. Full Name, Date of Birth"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Field Type
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        value={field.type}
                        onChange={(e) => updateField(index, 'type', e.target.value)}
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Paragraph Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="tel">Phone</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={field.required || false}
                        onChange={(e) => updateField(index, 'required', e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">Required</span>
                    </label>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeField(index)}
                      className="flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Linked Booking Types */}
        <Card title="Linked Booking Types" className="border-none shadow-sm rounded-xl">
          <div className="p-5 md:p-6">
            {form?.bookingTypes?.length > 0 ? (
              <div className="space-y-3">
                {form.bookingTypes.map((link: any) => (
                  <div
                    key={link.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{link.bookingType.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {link.sendAfterBooking
                          ? 'Sent automatically after booking'
                          : 'Manual send only'}
                        {link.reminderAfterDays > 0 &&
                          ` • Reminder after ${link.reminderAfterDays} day(s)`}
                      </p>
                    </div>
                    <Badge variant="success" className="self-start sm:self-center">
                      Linked
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">This form is not linked to any booking type yet</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setShowLinkModal(true)}
                >
                  Link a Booking Type
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Link Modal */}
        <Modal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          title="Link Form to Booking Type"
          size="md"
        >
          <div className="space-y-5 p-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Booking Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                value={linkData.bookingTypeId}
                onChange={(e) => setLinkData({ ...linkData, bookingTypeId: e.target.value })}
              >
                <option value="">Choose a booking type...</option>
                {bookingTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.duration} min)
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={linkData.sendAfterBooking}
                onChange={(e) => setLinkData({ ...linkData, sendAfterBooking: e.target.checked })}
              />
              <span className="text-sm text-gray-700">
                Automatically send this form after booking is confirmed
              </span>
            </label>

            <Input
              type="number"
              label="Send Reminder After (days)"
              value={linkData.reminderAfterDays}
              onChange={(e) =>
                setLinkData({ ...linkData, reminderAfterDays: Number(e.target.value) || 1 })
              }
              min={0}
              helperText="0 = no reminder"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleLinkBookingType}>
                Link Form
              </Button>
            </div>
          </div>
        </Modal>

        {/* Submissions Modal */}
        <Modal
          isOpen={showSubmissionsModal}
          onClose={() => setShowSubmissionsModal(false)}
          title="Form Submissions"
          size="xl"
        >
          <div className="p-2">
            {form?.submissions?.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {form.submissions.map((submission: any) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {submission.contact?.firstName || 'Unknown'}{' '}
                          {submission.contact?.lastName || ''}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Submitted {new Date(submission.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={submission.status === 'COMPLETED' ? 'success' : 'warning'}
                      >
                        {submission.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No submissions yet</p>
                <p className="text-sm mt-2">
                  Once customers start filling out this form, submissions will appear here.
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}