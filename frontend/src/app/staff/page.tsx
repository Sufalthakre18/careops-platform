'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { staffAPI } from '@/lib/api';
import { formatDate, handleApiError } from '@/lib/utils';
import { UserPlus, Mail, Shield, Key } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
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
  }, []);

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      setStaff(response.data.data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffAPI.invite({
        ...inviteData,
        permissions,
      });
      setAlert({ type: 'success', message: 'Invitation sent successfully!' });
      setShowInviteModal(false);
      resetInviteForm();
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      await staffAPI.updatePermissions(selectedStaff.id, permissions);
      setAlert({ type: 'success', message: 'Permissions updated successfully!' });
      setShowPermissionsModal(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await staffAPI.activate(id);
      setAlert({ type: 'success', message: 'Staff member activated!' });
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    try {
      await staffAPI.deactivate(id);
      setAlert({ type: 'success', message: 'Staff member deactivated!' });
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Are you sure you want to reset this staff member\'s password?')) return;

    try {
      await staffAPI.resetPassword(id);
      setAlert({ type: 'success', message: 'Password reset email sent!' });
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member? This cannot be undone.')) return;

    try {
      await staffAPI.remove(id);
      setAlert({ type: 'success', message: 'Staff member removed!' });
      loadStaff();
    } catch (error) {
      setAlert({ type: 'error', message: handleApiError(error) });
    }
  };

  const resetInviteForm = () => {
    setInviteData({
      email: '',
      firstName: '',
      lastName: '',
    });
    setPermissions({
      canAccessInbox: false,
      canManageBookings: false,
      canViewForms: false,
      canManageForms: false,
      canViewInventory: false,
      canManageInventory: false,
      canManageContacts: false,
    });
  };

  const openPermissionsModal = (member: any) => {
    setSelectedStaff(member);
    setPermissions({
      canAccessInbox: member.permissions?.canAccessInbox || false,
      canManageBookings: member.permissions?.canManageBookings || false,
      canViewForms: member.permissions?.canViewForms || false,
      canManageForms: member.permissions?.canManageForms || false,
      canViewInventory: member.permissions?.canViewInventory || false,
      canManageInventory: member.permissions?.canManageInventory || false,
      canManageContacts: member.permissions?.canManageContacts || false,
    });
    setShowPermissionsModal(true);
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
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">Manage team members and permissions</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              resetInviteForm();
              setShowInviteModal(true);
            }}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Invite Staff
          </Button>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Staff List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staff.length > 0 ? (
            staff.map((member) => (
              <Card key={member.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium text-lg">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        member.status === 'ACTIVE'
                          ? 'success'
                          : member.status === 'PENDING'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.permissions?.canAccessInbox && (
                        <Badge variant="info">Inbox</Badge>
                      )}
                      {member.permissions?.canManageBookings && (
                        <Badge variant="info">Bookings</Badge>
                      )}
                      {member.permissions?.canManageForms && (
                        <Badge variant="info">Forms</Badge>
                      )}
                      {member.permissions?.canManageInventory && (
                        <Badge variant="info">Inventory</Badge>
                      )}
                      {member.permissions?.canManageContacts && (
                        <Badge variant="info">Contacts</Badge>
                      )}
                      {!Object.values(member.permissions || {}).some(Boolean) && (
                        <span className="text-sm text-gray-500">No permissions set</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Role: {member.role}</p>
                    <p>Joined: {formatDate(member.createdAt, 'MMM dd, yyyy')}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                    <Link href={`/staff/${member.id}`} className="flex-1">
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full"
                      >
                        Edit Details
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openPermissionsModal(member)}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Permissions
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleResetPassword(member.id)}
                    >
                      <Key className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    {member.status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeactivate(member.id)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleActivate(member.id)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No staff members yet</p>
              <p className="text-sm mt-1">Invite your first team member to get started</p>
            </div>
          )}
        </div>

        {/* Invite Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            resetInviteForm();
          }}
          title="Invite Staff Member"
          size="lg"
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowInviteModal(false);
                  resetInviteForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleInvite}>
                Send Invitation
              </Button>
            </div>
          }
        >
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="staff@example.com"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                value={inviteData.firstName}
                onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={inviteData.lastName}
                onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Set Permissions</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    checked={permissions.canAccessInbox}
                    onChange={(e) => setPermissions({ ...permissions, canAccessInbox: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Access Inbox</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    checked={permissions.canManageBookings}
                    onChange={(e) => setPermissions({ ...permissions, canManageBookings: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Manage Bookings</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    checked={permissions.canViewForms}
                    onChange={(e) => setPermissions({ ...permissions, canViewForms: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">View Forms</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    checked={permissions.canManageForms}
                    onChange={(e) => setPermissions({ ...permissions, canManageForms: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Manage Forms</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    checked={permissions.canViewInventory}
                    onChange={(e) => setPermissions({ ...permissions, canViewInventory: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">View Inventory</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    checked={permissions.canManageInventory}
                    onChange={(e) => setPermissions({ ...permissions, canManageInventory: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Manage Inventory</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    checked={permissions.canManageContacts}
                    onChange={(e) => setPermissions({ ...permissions, canManageContacts: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Manage Contacts</span>
                </label>
              </div>
            </div>
          </form>
        </Modal>

        {/* Permissions Modal */}
        <Modal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedStaff(null);
          }}
          title={`Update Permissions: ${selectedStaff?.firstName} ${selectedStaff?.lastName}`}
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedStaff(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdatePermissions}>
                Update Permissions
              </Button>
            </div>
          }
        >
          <form onSubmit={handleUpdatePermissions} className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={permissions.canAccessInbox}
                onChange={(e) => setPermissions({ ...permissions, canAccessInbox: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Access Inbox</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={permissions.canManageBookings}
                onChange={(e) => setPermissions({ ...permissions, canManageBookings: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Manage Bookings</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={permissions.canViewForms}
                onChange={(e) => setPermissions({ ...permissions, canViewForms: e.target.checked })}
              />
              <span className="text-sm text-gray-700">View Forms</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={permissions.canManageForms}
                onChange={(e) => setPermissions({ ...permissions, canManageForms: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Manage Forms</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={permissions.canViewInventory}
                onChange={(e) => setPermissions({ ...permissions, canViewInventory: e.target.checked })}
              />
              <span className="text-sm text-gray-700">View Inventory</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={permissions.canManageInventory}
                onChange={(e) => setPermissions({ ...permissions, canManageInventory: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Manage Inventory</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={permissions.canManageContacts}
                onChange={(e) => setPermissions({ ...permissions, canManageContacts: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Manage Contacts</span>
            </label>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}