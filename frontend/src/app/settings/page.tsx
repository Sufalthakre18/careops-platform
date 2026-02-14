'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { workspaceAPI } from '@/lib/api';
import { handleApiError } from '@/lib/utils';
import { Building, Save, CheckCircle, Copy, ExternalLink } from 'lucide-react';

interface Workspace {
  id: string;
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  timezone: string;
  status: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState<string>('INACTIVE');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    timezone: '',
  });

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      const response = await workspaceAPI.getCurrent();
      const workspace: Workspace = response.data.data;

      setWorkspaceStatus(workspace.status);
      setWorkspaceId(workspace.id);
      setFormData({
        businessName: workspace.businessName || '',
        contactEmail: workspace.contactEmail || '',
        contactPhone: workspace.contactPhone || '',
        address: workspace.address || '',
        city: workspace.city || '',
        state: workspace.state || '',
        zipCode: workspace.zipCode || '',
        country: workspace.country || 'USA',
        timezone: workspace.timezone || 'America/New_York',
      });
    } catch (error) {
      console.error('Error loading workspace:', error);
      setAlert({ type: 'error', message: 'Failed to load workspace settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(workspaceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBookingLink = () => {
    const bookingLink = `${window.location.origin}/book/${workspaceId}`;
    navigator.clipboard.writeText(bookingLink);
    setAlert({ type: 'success', message: 'Booking link copied to clipboard!' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      await workspaceAPI.update(formData);
      setAlert({ type: 'success', message: 'Settings saved successfully!' });
      await loadWorkspace(); // Refresh data
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    setAlert(null);

    try {
      await workspaceAPI.activate();
      setAlert({ type: 'success', message: 'Workspace activated successfully!' });
      await loadWorkspace();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setActivating(false);
    }
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
      <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workspace Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your business information, public booking link, and activation status
          </p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* WORKSPACE ID & BOOKING LINK CARD */}
        <Card className="border-none shadow-md bg-white rounded-2xl">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Workspace ID & Public Booking Link
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Share this link with customers to let them book appointments directly
              </p>
            </div>

            <div className="space-y-6">
              {/* Workspace ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace ID
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={workspaceId}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-mono text-sm focus:outline-none"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyId}
                    className="min-w-[100px]"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Public Booking Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Booking Link
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/book/${workspaceId}`}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-blue-600 font-mono text-sm focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyBookingLink}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <a
                      href={`/book/${workspaceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </a>
                  </div>
                </div>
              </div>

              {/* Helper Tip */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-800">
                  💡 <strong>Pro tip:</strong> Add this booking link to your website, Instagram bio, 
                  WhatsApp business profile, or email signature so customers can book 24/7.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* WORKSPACE STATUS */}
        <Card title="Workspace Status" description="Check if your workspace is ready for customers">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Building className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <Badge
                    variant={
                      workspaceStatus === 'ACTIVE'
                        ? 'success'
                        : workspaceStatus === 'PENDING'
                        ? 'warning'
                        : 'danger'
                    }
                    className="mt-1"
                  >
                    {workspaceStatus}
                  </Badge>
                </div>
              </div>

              {workspaceStatus !== 'ACTIVE' && (
                <Button
                  onClick={handleActivate}
                  loading={activating}
                  variant="primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate Workspace
                </Button>
              )}
            </div>

            {workspaceStatus !== 'ACTIVE' && (
              <div className="mt-6 p-5 bg-yellow-50 border border-yellow-100 rounded-xl">
                <p className="font-medium text-yellow-800 mb-3">⚠️ Before activation, please ensure:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700 ml-1">
                  <li>At least one communication channel (Email or SMS) is configured</li>
                  <li>You have created at least one contact / form</li>
                  <li>At least one booking type / service is created</li>
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* SETTINGS FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Business Information" description="Update these details to reflect on customer-facing pages">
            <div className="p-6 space-y-6">
              <Input
                label="Business Name *"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="email"
                  label="Contact Email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                />
                <Input
                  type="tel"
                  label="Contact Phone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                />
              </div>

              {/* You can add more fields like address, city, etc. later */}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              loading={saving}
              className="min-w-[180px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}