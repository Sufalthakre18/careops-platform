'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import AIChatbot from '@/components/AIChatbot';
import { dashboardAPI, alertAPI, workspaceAPI } from '@/lib/api';
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
  MessageCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, overviewRes, alertsRes] = await Promise.all([
        workspaceAPI.getStats(),
        dashboardAPI.getOverview(),
        alertAPI.getAll(),
      ]);
      setStats(statsRes.data.data);
      setOverview(overviewRes.data.data);
      setAlerts(alertsRes.data.data);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setWorkspaceId(user.workspaceId || '');
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
      <div className="space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-600">
            Welcome back! Here's an overview of your operations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-5 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Contacts
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1">
                  {stats?.totalContacts || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Bookings
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1">
                  {stats?.totalBookings || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Active Forms
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1">
                  {stats?.totalForms || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Active Alerts
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1">
                  {stats?.activeAlerts || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Bookings */}
          <div className="lg:col-span-2">
            <Card
              title="Today's Bookings"
              description="Scheduled appointments for today"
              className="border-none shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-3 md:space-y-4">
                {overview?.todayBookings?.length > 0 ? (
                  overview.todayBookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                            {booking.bookingType.name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {booking.contact.firstName} {booking.contact.lastName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {formatDate(booking.startTime, 'h:mm a')} –{' '}
                            {formatDate(booking.endTime, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}
                        className="text-xs sm:text-sm px-3 py-1 rounded-full whitespace-nowrap"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 md:py-12 text-gray-500">
                    <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-base sm:text-lg">No bookings scheduled for today</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Active Alerts */}
          <div className="lg:col-span-1">
            <Card
              title="Active Alerts"
              description="Items requiring attention"
              className="border-none shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {alerts?.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-3 md:p-4 bg-red-50 border border-red-100 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-base font-semibold text-red-900 truncate">
                          {alert.title}
                        </p>
                        <p className="text-xs md:text-sm text-red-700 mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                      <Badge variant="danger" className="text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        {alert.priority}
                      </Badge>
                    </div>
                  </div>
                ))}

                {(!alerts || alerts.length === 0) && (
                  <div className="text-center py-10 md:py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-base sm:text-lg">No active alerts</p>
                  </div>
                )}
              </div>

              {alerts?.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/alerts"
                    className="text-sm md:text-base text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                  >
                    View all alerts →
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Recent Contacts */}
        <Card
          title="Recent Contacts"
          description="Latest customer interactions"
          className="border-none shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="space-y-3 md:space-y-4">
            {overview?.recentContacts?.slice(0, 5).map((contact: any) => (
              <div
                key={contact.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-700 font-semibold text-base sm:text-lg">
                      {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '') || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{contact.email}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-right">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatDate(contact.createdAt, 'MMM dd, yyyy')}
                  </p>
                  <Badge
                    variant="info"
                    className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full"
                  >
                    {contact.status}
                  </Badge>
                </div>
              </div>
            ))}

            {!overview?.recentContacts?.length && (
              <div className="text-center py-10 md:py-12 text-gray-500">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-base sm:text-lg">No recent contacts</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Floating AI Chatbot Button */}
      {!showChatbot && (
        <button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 
                     bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full 
                     shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 
                     flex items-center justify-center"
          title="AI Assistant"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chatbot Window */}
      {showChatbot && workspaceId && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 bg-black/60 sm:bg-transparent flex items-end sm:items-start justify-center sm:justify-end">
          <div className="w-full max-w-lg sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <AIChatbot
              workspaceId={workspaceId}
              onClose={() => setShowChatbot(false)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}