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
import { Building, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState<string>('INACTIVE');

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
      const workspace = response.data.data;

      setWorkspaceStatus(workspace.status);

      setFormData({
        businessName: workspace.businessName,
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      await workspaceAPI.update(formData);
      setAlert({ type: 'success', message: 'Settings saved successfully!' });
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
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your workspace information and activation status
          </p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* WORKSPACE STATUS CARD */}
        <Card title="Workspace Status" description="Activation and system status">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-gray-600" />

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
                >
                  {workspaceStatus}
                </Badge>
              </div>
            </div>

            {workspaceStatus !== 'ACTIVE' && (
              <Button
                onClick={handleActivate}
                loading={activating}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate Workspace
              </Button>
            )}
          </div>

          {workspaceStatus !== 'ACTIVE' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Your workspace must be activated before creating bookings.
            </div>
          )}
        </Card>

        {/* SETTINGS FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">

          <Card title="Business Information" description="Update your business details">
            <div className="space-y-4">

              <Input
                label="Business Name"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-2 gap-4">
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

            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

        </form>

      </div>
    </DashboardLayout>
  );
}
