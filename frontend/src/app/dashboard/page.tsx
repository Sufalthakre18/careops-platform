'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { dashboardAPI, workspaceAPI } from '@/lib/api';
import { formatDate, getStatusColor, handleApiError } from '@/lib/utils';
import {
  Calendar,
  Users,
  FileText,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, overviewRes, alertsRes] = await Promise.all([
        workspaceAPI.getStats(),
        dashboardAPI.getOverview(),
        dashboardAPI.getAlerts(),
      ]);

      setStats(statsRes.data.data);
      setOverview(overviewRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contacts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalContacts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalBookings || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Forms</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalForms || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.activeAlerts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Bookings */}
          <div className="lg:col-span-2">
            <Card title="Today's Bookings" description="Scheduled appointments for today">
              <div className="space-y-4">
                {overview?.todayBookings?.length > 0 ? (
                  overview.todayBookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {booking.bookingType.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {booking.contact.firstName} {booking.contact.lastName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(booking.startTime, 'h:mm a')} -{' '}
                            {formatDate(booking.endTime, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No bookings scheduled for today</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Active Alerts */}
          <div>
            <Card title="Active Alerts" description="Requires your attention">
              <div className="space-y-3">
                {alerts?.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">
                          {alert.title}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {alert.message}
                        </p>
                      </div>
                      <Badge variant="danger" className="ml-2">
                        {alert.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!alerts || alerts.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No active alerts</p>
                  </div>
                )}
              </div>
              {alerts?.length > 0 && (
                <Link
                  href="/alerts"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium mt-4"
                >
                  View all alerts →
                </Link>
              )}
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card title="Recent Contacts" description="Latest customer inquiries">
          <div className="space-y-3">
            {overview?.recentContacts?.slice(0, 5).map((contact: any) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm">
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{contact.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatDate(contact.createdAt, 'MMM dd, yyyy')}
                  </p>
                  <Badge variant="info" className="mt-1">
                    {contact.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}