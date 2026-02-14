'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import RealTimeNotifications from '@/components/notifications/RealTimeNotifications'; // ← YOUR IMPORT

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  return (
    <nav className="bg-gradient-to-r from-blue-50 to-gray-50 border-b border-blue-100 fixed top-0 left-0 right-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 text-blue-400 hover:text-blue-600 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-blue-700 font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-semibold text-gray-800 tracking-tight hidden sm:block">
                CareOps
              </span>
            </Link>
          </div>

          {/* Right: Notifications + User Menu */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* ← RealTimeNotifications placed here – most natural spot */}
            <RealTimeNotifications />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-full hover:bg-blue-100 transition-all duration-200"
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${getAvatarColor(
                    user.firstName
                  )} flex items-center justify-center shadow-inner flex-shrink-0`}
                >
                  <span className="text-white text-xs sm:text-sm font-medium tracking-wide">
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-800 tracking-tight">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-blue-500 font-light">
                    {user.role === 'OWNER' ? 'Owner' : 'Staff'}
                  </p>
                </div>

                <ChevronDown className="w-4 h-4 text-blue-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                    <Link
                      href="/settings/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User className="w-4 h-4 mr-3 text-gray-500" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-500" />
                      Settings
                    </Link>
                    <hr className="border-gray-100" />
                    <button
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
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