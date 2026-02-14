'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, MessageSquare, Package, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardData {
  bookings: {
    today: number;
    upcoming: number;
    completed: number;
    noShow: number;
  };
  leads: {
    new: number;
    total: number;
    activeConversations: number;
    unansweredMessages: number;
  };
  forms: {
    pending: number;
    overdue: number;
    completed: number;
  };
  inventory: {
    lowStockCount: number;
    lowStockItems: any[];
  };
  alerts: {
    active: number;
    critical: number;
  };
}

export default function EnhancedDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  const statsCards = [
    {
      title: 'Today\'s Bookings',
      value: data.bookings.today,
      icon: Calendar,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Active Leads',
      value: data.leads.new,
      icon: Users,
      color: 'bg-green-500',
      change: '+23%',
      changeType: 'positive',
    },
    {
      title: 'Unanswered Messages',
      value: data.leads.unansweredMessages,
      icon: MessageSquare,
      color: 'bg-orange-500',
      change: data.leads.unansweredMessages > 0 ? 'Action needed' : 'All clear',
      changeType: data.leads.unansweredMessages > 0 ? 'negative' : 'positive',
    },
    {
      title: 'Critical Alerts',
      value: data.alerts.critical,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: data.alerts.critical > 0 ? 'Needs attention' : 'No issues',
      changeType: data.alerts.critical > 0 ? 'negative' : 'positive',
    },
  ];

  // Chart data
  const bookingChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Bookings',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const conversionChartData = {
    labels: ['Leads', 'Contacted', 'Interested', 'Booked'],
    datasets: [
      {
        label: 'Conversion Funnel',
        data: [100, 75, 45, 28],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-indigo-200">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-900">AI-Powered Insights</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trend</h3>
          <Line data={bookingChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <Bar data={conversionChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-indigo-200 p-6 mb-8">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-indigo-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Insights & Recommendations</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  <strong>Peak booking time:</strong> Your busiest day is Friday. Consider offering early bird discounts on Mon-Wed to balance the load.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  <strong>Response time:</strong> Customers who receive replies within 10 minutes are 3x more likely to book.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  <strong>No-show reduction:</strong> Send automated reminders 24h before appointments to reduce no-shows by 40%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {data.inventory.lowStockCount > 0 && (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6 mb-8">
          <div className="flex items-start gap-3">
            <Package className="w-6 h-6 text-yellow-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Low Stock Alert ({data.inventory.lowStockCount} items)
              </h3>
              <div className="space-y-2">
                {data.inventory.lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-medium text-yellow-700">
                      {item.quantity} {item.unit} remaining
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition text-left">
          <h4 className="font-semibold text-gray-900 mb-1">Add New Booking</h4>
          <p className="text-sm text-gray-600">Schedule an appointment</p>
        </button>
        <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition text-left">
          <h4 className="font-semibold text-gray-900 mb-1">View Inbox</h4>
          <p className="text-sm text-gray-600">Check unread messages</p>
        </button>
        <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition text-left">
          <h4 className="font-semibold text-gray-900 mb-1">Generate Report</h4>
          <p className="text-sm text-gray-600">Download analytics</p>
        </button>
      </div>
    </div>
  );
}