'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, User, LogOut, Settings, ChevronDown, Menu, AlertTriangle, X } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { alertAPI } from '@/lib/api'; // ← ADD THIS

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // ← ADD THIS
  const [alerts, setAlerts] = useState<any[]>([]); // ← ADD THIS
  const [unreadCount, setUnreadCount] = useState(0); // ← ADD THIS

  // ← ADD THIS: Load alerts
  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    try {
      const response = await alertAPI.getAll();
      const activeAlerts = response.data.data.filter(
        (alert: any) => alert.status === 'ACTIVE'
      );
      setAlerts(activeAlerts);
      setUnreadCount(activeAlerts.length);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-gradient-to-r from-blue-50 to-gray-50 border-b border-blue-100 fixed top-0 left-0 right-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={onMenuClick}
              className="md:hidden p-2 text-blue-300 hover:text-blue-500 transition-colors duration-200"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-blue-700 font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-semibold text-gray-800 tracking-tight">CareOps</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* ========================================== */}
            {/* ← FIXED: Notifications with Dropdown */}
            {/* ========================================== */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-blue-300 hover:text-blue-500 transition-colors duration-200"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {alerts.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {alerts.map((alert) => (
                          <Link
                            key={alert.id}
                            href="/alerts"
                            onClick={() => setShowNotifications(false)}
                            className="block p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {alert.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {alert.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(alert.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {alerts.length > 0 && (
                      <div className="p-3 border-t border-gray-200">
                        <Link
                          href="/alerts"
                          onClick={() => setShowNotifications(false)}
                          className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View all alerts →
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 p-2 rounded-full hover:bg-blue-100 transition-all duration-200 shadow-sm"
              >
                <div
                  className={`w-8 h-8 rounded-full ${getAvatarColor(
                    user.firstName
                  )} flex items-center justify-center shadow-inner`}
                >
                  <span className="text-white text-sm font-medium tracking-wide">
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-800 tracking-tight">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-blue-400 font-light">
                    {user.role === 'OWNER' ? '👑 Owner' : '👤 Staff'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-300" />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-md border border-blue-100 py-1 z-20 overflow-hidden">
                    <Link
                      href="/settings/profile"
                      className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="font-medium tracking-wide">Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings className="w-4 h-4 text-blue-400" />
                      <span className="font-medium tracking-wide">Settings</span>
                    </Link>
                    <hr className="my-1 border-blue-100" />
                    <button
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium tracking-wide">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}