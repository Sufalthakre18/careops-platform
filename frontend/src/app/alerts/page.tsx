'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { alertAPI } from '@/lib/api';
import { formatDate, getAlertPriorityColor, handleApiError } from '@/lib/utils';
import { Bell, CheckCircle, X } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [filterStatus]);

  const loadAlerts = async () => {
    try {
      const params = filterStatus !== 'ALL' ? { status: filterStatus } : {};
      const response = await alertAPI.getAll(params);
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertAPI.markAsResolved(id);
      setNotification({ type: 'success', message: 'Alert resolved successfully!' });
      loadAlerts();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await alertAPI.markAsDismissed(id);
      setNotification({ type: 'success', message: 'Alert dismissed successfully!' });
      loadAlerts();
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterPriority === 'ALL') return true;
    return alert.priority === filterPriority;
  });

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">Manage system notifications and alerts</p>
        </div>

        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
                <option value="ALL">All</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <Card key={alert.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${getAlertPriorityColor(alert.priority)}`}>
                      <span className="text-2xl">{getPriorityIcon(alert.priority)}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
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
                              : alert.status === 'RESOLVED'
                              ? 'success'
                              : 'default'
                          }
                        >
                          {alert.status}
                        </Badge>
                      </div>

                      <p className="text-gray-700 mb-3">{alert.message}</p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Type: {alert.type}</span>
                        <span>•</span>
                        <span>{formatDate(alert.createdAt, 'MMM dd, yyyy h:mm a')}</span>
                      </div>

                      {alert.link && (
                        <a
                          href={alert.link}
                          className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View details →
                        </a>
                      )}
                    </div>
                  </div>

                  {alert.status === 'ACTIVE' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No alerts found</p>
                <p className="text-sm mt-1">
                  {filterStatus === 'ACTIVE'
                    ? "You're all caught up!"
                    : 'Try changing the filters'}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Summary */}
        {alerts.length > 0 && (
          <Card title="Summary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {alerts.filter((a) => a.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Active</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {alerts.filter((a) => a.priority === 'CRITICAL' && a.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {alerts.filter((a) => a.status === 'RESOLVED').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Resolved</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-600">
                  {alerts.filter((a) => a.status === 'DISMISSED').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Dismissed</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}