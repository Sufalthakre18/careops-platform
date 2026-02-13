'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { authAPI } from '@/lib/api';
import { handleApiError } from '@/lib/utils';
import { User, Save } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getMe();
      const user = response.data.data;

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      await authAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      setAlert({
        type: 'success',
        message: 'Profile updated successfully!',
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: handleApiError(error),
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <User size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your personal account information
            </p>
          </div>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit}>
          <Card
            title="Personal Information"
            description="Update your profile details"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firstName: e.target.value,
                    })
                  }
                  required
                />

                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastName: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <Input
                label="Email Address"
                value={formData.email}
                disabled
                helperText="Email cannot be changed"
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                >
                  <Save size={18} />
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
