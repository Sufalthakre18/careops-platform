'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { alertAPI } from '@/lib/api';
import { formatDate, getAlertPriorityColor, handleApiError } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Check, Trash2, ExternalLink, Clock } from 'lucide-react';

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;

  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAlert();
  }, [alertId]);

  const loadAlert = async () => {
    try {
      const response = await alertAPI.getById(alertId);
      setAlert(response.data.data);
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!confirm('This will acknowledge and permanently delete this alert. Continue?')) return;

    try {
      await alertAPI.delete(alertId);
      setNotification({ type: 'success', message: 'Alert acknowledged and removed!' });
      setTimeout(() => router.push('/alerts'), 1500);
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleResolve = async () => {
    if (!confirm('This will resolve and permanently delete this alert. Continue?')) return;

    try {
      await alertAPI.delete(alertId);
      setNotification({ type: 'success', message: 'Alert resolved and removed!' });
      setTimeout(() => router.push('/alerts'), 1500);
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await alertAPI.delete(alertId);
      setNotification({ type: 'success', message: 'Alert deleted!' });
      router.push('/alerts');
    } catch (error) {
      setNotification({ type: 'error', message: handleApiError(error) });
    }
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

  const getEntityLink = () => {
    if (!alert?.entityType || !alert?.entityId) return null;

    const routes: Record<string, string> = {
      INVENTORY_ITEM: `/inventory`,
      BOOKING: `/bookings`,
      FORM_SUBMISSION: `/forms/submissions`,
      CONTACT: `/contacts`,
    };

    return routes[alert.entityType];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen />
      </DashboardLayout>
    );
  }

  if (!alert) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Alert not found</p>
          <Button variant="secondary" onClick={() => router.push('/alerts')} className="mt-4">
            Back to Alerts
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header - stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/alerts')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Alert Details</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage this alert</p>
            </div>
          </div>

          {/* Action buttons - wrap on mobile */}
          <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-x-2">
            {alert.status === 'ACTIVE' && (
              <>
                <Button variant="secondary" size="sm" onClick={handleAcknowledge}>
                  <Check className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Acknowledge</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleResolve}>
                  <CheckCircle className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Resolve</span>
                </Button>
              </>
            )}
            {alert.status === 'ACKNOWLEDGED' && (
              <Button variant="primary" size="sm" onClick={handleResolve}>
                <CheckCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Resolve</span>
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>

        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Alert Content */}
        <Card>
          <div className="space-y-6">
            {/* Title and Badges - stack on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className={`p-4 rounded-lg ${getAlertPriorityColor(alert.priority)} self-start`}>
                <span className="text-3xl">{getPriorityIcon(alert.priority)}</span>
              </div>

              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 break-words">{alert.title}</h2>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      alert.priority === 'CRITICAL' || alert.priority === 'HIGH'
                        ? 'danger'
                        : alert.priority === 'MEDIUM'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {alert.priority} Priority
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

                  <Badge variant="default">
                    {alert.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{alert.message}</p>
            </div>

            {/* Entity Information */}
            {alert.entityType && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Related Entity</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Type: {alert.entityType.replace(/_/g, ' ')}
                      </p>
                      {alert.entityId && (
                        <p className="text-xs text-gray-500 mt-1 break-all">ID: {alert.entityId}</p>
                      )}
                    </div>

                    {getEntityLink() && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(getEntityLink()!)}
                        className="self-start sm:self-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Entity
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action URL */}
            {alert.actionUrl && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Action Required</h3>
                <a
                  href={alert.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm break-all"
                >
                  {alert.actionUrl}
                  <ExternalLink className="w-4 h-4 ml-1 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Timeline */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Activity Timeline</h3>
              <div className="space-y-3">
                {/* Created */}
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Alert Created</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="break-words">{formatDate(alert.createdAt, 'MMM dd, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </div>

                {/* Acknowledged */}
                {alert.acknowledgedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Acknowledged</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="break-words">{formatDate(alert.acknowledgedAt, 'MMM dd, yyyy h:mm a')}</span>
                      </div>
                      {alert.acknowledgedBy && (
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          By User ID: {alert.acknowledgedBy}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolved */}
                {alert.resolvedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Resolved</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="break-words">{formatDate(alert.resolvedAt, 'MMM dd, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Alert ID</p>
                  <p className="text-gray-900 font-mono text-xs mt-1 break-all">{alert.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Workspace ID</p>
                  <p className="text-gray-900 font-mono text-xs mt-1 break-all">{alert.workspaceId}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}