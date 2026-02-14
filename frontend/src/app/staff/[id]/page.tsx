'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { staffAPI } from '@/lib/api';
import { formatDate, handleApiError } from '@/lib/utils';
import { ArrowLeft, Save, Key, Trash2, UserCheck, UserX } from 'lucide-react';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    status: 'ACTIVE',
  });

  const [permissions, setPermissions] = useState({
    canAccessInbox: false,
    canManageBookings: false,
    canViewForms: false,
    canManageForms: false,
    canViewInventory: false,
    canManageInventory: false,
    canManageContacts: false,
  });

  useEffect(() => {
    loadStaff();
  }, [staffId]);

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getById(staffId);
      const member = response.data.data;
      
      setStaff(member);
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        status: member.status || 'ACTIVE',
      });
      setPermissions({
        canAccessInbox: member.permissions?.canAccessInbox || false,
        canManageBookings: member.permissions?.canManageBookings || false,
        canViewForms: member.permissions?.canViewForms || false,
        canManageForms: member.permissions?.canManageForms || false,
        canViewInventory: member.permissions?.canViewInventory || false,
        canManageInventory: member.permissions?.canManageInventory || false,
        canManageContacts: member.permissions?.canManageContacts || false,
      });
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update basic info
      await staffAPI.update(staffId, formData);
      
      // Update permissions
      await staffAPI.updatePermissions(staffId, permissions);
      
      setAlert({ type: 'success', message: 'Staff member updated successfully!' });
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    try {
      await staffAPI.activate(staffId);
      setAlert({ type: 'success', message: 'Staff member activated!' });
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    try {
      await staffAPI.deactivate(staffId);
      setAlert({ type: 'success', message: 'Staff member deactivated!' });
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset this staff member\'s password?')) return;

    try {
      await staffAPI.resetPassword(staffId);
      setAlert({ type: 'success', message: 'Password reset email sent!' });
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this staff member? This cannot be undone.')) return;

    try {
      await staffAPI.remove(staffId);
      setAlert({ type: 'success', message: 'Staff member removed!' });
      setTimeout(() => router.push('/staff'), 1500);
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

  if (!staff) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Staff member not found</p>
          <Button variant="secondary" onClick={() => router.push('/staff')} className="mt-4">
            Back to Staff
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/staff')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {staff.firstName} {staff.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{staff.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {staff.status === 'ACTIVE' ? (
              <Button variant="secondary" onClick={handleDeactivate}>
                <UserX className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            ) : (
              <Button variant="primary" onClick={handleActivate}>
                <UserCheck className="w-4 h-4 mr-2" />
                Activate
              </Button>
            )}
            <Button variant="secondary" onClick={handleResetPassword}>
              <Key className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
            <Button variant="danger" onClick={handleRemove}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Status Card */}
        <Card title="Status">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <Badge
                variant={
                  staff.status === 'ACTIVE'
                    ? 'success'
                    : staff.status === 'PENDING'
                    ? 'warning'
                    : 'danger'
                }
                className="mt-1"
              >
                {staff.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium text-gray-900 mt-1">{staff.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Joined</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatDate(staff.createdAt, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <Card
            title="Basic Information"
            description="Update staff member details"
            action={
              <Button type="submit" loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Email:</span> {staff.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. To update, remove this staff member and send a new invitation.
                </p>
              </div>
            </div>
          </Card>

          {/* Permissions */}
          <Card
            title="Permissions"
            description="Manage what this staff member can access"
          >
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={permissions.canAccessInbox}
                  onChange={(e) =>
                    setPermissions({ ...permissions, canAccessInbox: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Access Inbox</p>
                  <p className="text-xs text-gray-500">View and respond to messages</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={permissions.canManageBookings}
                  onChange={(e) =>
                    setPermissions({ ...permissions, canManageBookings: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Bookings</p>
                  <p className="text-xs text-gray-500">Create, edit, and cancel bookings</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={permissions.canViewForms}
                  onChange={(e) =>
                    setPermissions({ ...permissions, canViewForms: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">View Forms</p>
                  <p className="text-xs text-gray-500">View forms and submissions</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={permissions.canManageForms}
                  onChange={(e) =>
                    setPermissions({ ...permissions, canManageForms: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Forms</p>
                  <p className="text-xs text-gray-500">Create and edit forms</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={permissions.canViewInventory}
                  onChange={(e) =>
                    setPermissions({ ...permissions, canViewInventory: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">View Inventory</p>
                  <p className="text-xs text-gray-500">View inventory items and stock levels</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={permissions.canManageInventory}
                  onChange={(e) =>
                    setPermissions({ ...permissions, canManageInventory: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Inventory</p>
                  <p className="text-xs text-gray-500">Add, edit, and adjust inventory</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={permissions.canManageContacts}
                  onChange={(e) =>
                    setPermissions({ ...permissions, canManageContacts: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Contacts</p>
                  <p className="text-xs text-gray-500">Create, edit, and delete contacts</p>
                </div>
              </label>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}