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
import { alertAPI } from '@/lib/api';
import { formatDate, getAlertPriorityColor, handleApiError } from '@/lib/utils';
import { Bell, CheckCircle, X, Plus, Trash2, Check } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    type: 'SYSTEM',
    priority: 'MEDIUM',
    title: '',
    message: '',
    actionUrl: '',
  });

  useEffect(() => {
    loadData();
  }, [filterStatus, filterPriority, filterType]);

  const loadData = async () => {
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterType) params.type = filterType;

      const [alertsRes, summaryRes] = await Promise.all([
        alertAPI.getAll(params),
        alertAPI.getSummary(),
      ]);

      setAlerts(alertsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await alertAPI.create(formData);
      setNotification({ type: 'success', message: 'Alert created successfully!' });
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertAPI.delete(id);
      setNotification({ type: 'success', message: 'Alert acknowledged and removed!' });
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertAPI.delete(id);
      setNotification({ type: 'success', message: 'Alert resolved and removed!' });
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await alertAPI.delete(id);
      setNotification({ type: 'success', message: 'Alert deleted!' });
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) return;
    if (!confirm(`Delete ${selectedAlerts.length} alert(s) from database?`)) return;

    try {
      // Delete each alert
      await Promise.all(selectedAlerts.map(id => alertAPI.delete(id)));
      setNotification({ type: 'success', message: `${selectedAlerts.length} alerts acknowledged and removed!` });
      setSelectedAlerts([]);
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleBulkResolve = async () => {
    if (selectedAlerts.length === 0) return;
    if (!confirm(`Delete ${selectedAlerts.length} alert(s) from database?`)) return;

    try {
      // Delete each alert
      await Promise.all(selectedAlerts.map(id => alertAPI.delete(id)));
      setNotification({ type: 'success', message: `${selectedAlerts.length} alerts resolved and removed!` });
      setSelectedAlerts([]);
      loadData();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const toggleSelectAlert = (id: string) => {
    setSelectedAlerts((prev) =>
      prev.includes(id) ? prev.filter((alertId) => alertId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map((a) => a.id));
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'SYSTEM',
      priority: 'MEDIUM',
      title: '',
      message: '',
      actionUrl: '',
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '📢';
      case 'LOW':
        return 'ℹ️';
      default:
        return '📌';
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            <p className="text-gray-600 mt-1">Monitor and manage system notifications</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Alert
          </Button>
        </div>

        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{summary.byStatus.active}</p>
                <p className="text-sm text-gray-600 mt-1">Active</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{summary.byPriority.critical}</p>
                <p className="text-sm text-gray-600 mt-1">Critical</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{summary.byStatus.acknowledged}</p>
                <p className="text-sm text-gray-600 mt-1">Acknowledged</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{summary.byStatus.resolved}</p>
                <p className="text-sm text-gray-600 mt-1">Resolved</p>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="input"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="INVENTORY_LOW">Inventory Low</option>
                <option value="FORM_OVERDUE">Form Overdue</option>
                <option value="BOOKING_UNCONFIRMED">Booking Unconfirmed</option>
                <option value="MESSAGE_UNANSWERED">Message Unanswered</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedAlerts.length > 0 && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                {selectedAlerts.length} alert(s) selected
              </p>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="secondary" onClick={handleBulkAcknowledge}>
                  <Check className="w-4 h-4 mr-1" />
                  Acknowledge Selected
                </Button>
                <Button size="sm" variant="primary" onClick={handleBulkResolve}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Resolve Selected
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.length > 0 && (
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded"
                checked={selectedAlerts.length === alerts.length}
                onChange={toggleSelectAll}
              />
              <label className="ml-2 text-sm text-gray-700">Select All</label>
            </div>
          )}

          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <Card key={alert.id}>
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-primary-600 rounded"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={() => toggleSelectAlert(alert.id)}
                  />

                  <div className={`p-3 rounded-lg ${getAlertPriorityColor(alert.priority)}`}>
                    <span className="text-2xl">{getPriorityIcon(alert.priority)}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <Badge
                        variant={
                          alert.priority === 'CRITICAL' || alert.priority === 'HIGH'
                            ? 'danger'
                            : alert.priority === 'MEDIUM'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {alert.priority}
                      </Badge>
                      <Badge
                        variant={
                          alert.status === 'ACTIVE'
                            ? 'warning'
                            : alert.status === 'ACKNOWLEDGED'
                            ? 'info'
                            : 'success'
                        }
                      >
                        {alert.status}
                      </Badge>
                    </div>

                    <p className="text-gray-700 mb-2">{alert.message}</p>

                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span>{alert.type.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span>{formatDate(alert.createdAt, 'MMM dd, yyyy h:mm a')}</span>
                      {alert.acknowledgedAt && (
                        <>
                          <span>•</span>
                          <span>Acknowledged {formatDate(alert.acknowledgedAt, 'MMM dd')}</span>
                        </>
                      )}
                    </div>

                    <Link
                      href={`/alerts/${alert.id}`}
                      className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View details →
                    </Link>
                  </div>

                  <div className="flex items-center space-x-2">
                    {alert.status === 'ACTIVE' && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleResolve(alert.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(alert.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No alerts found</p>
                <p className="text-sm mt-1">
                  {filterStatus === 'ACTIVE' ? "You're all caught up!" : 'Try changing filters'}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Create Alert Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create Custom Alert"
          footer={
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate}>
                Create Alert
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="SYSTEM">System</option>
                  <option value="INVENTORY_LOW">Inventory Low</option>
                  <option value="FORM_OVERDUE">Form Overdue</option>
                  <option value="BOOKING_UNCONFIRMED">Booking Unconfirmed</option>
                  <option value="MESSAGE_UNANSWERED">Message Unanswered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="input"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <Input
              label="Title"
              placeholder="Alert title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Alert message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <Input
              label="Action URL (Optional)"
              placeholder="https://example.com/action"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
            />
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}