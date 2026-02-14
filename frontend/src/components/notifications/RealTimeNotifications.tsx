'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Bell, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'alert' | 'system';
  timestamp: string;
}

export default function RealTimeNotifications() {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time events
    socket.on('notification', (data: Notification) => {
      console.log('📬 New notification:', data);
      setNotifications(prev => [data, ...prev]);
      
      // Show toast
      toast.info(data.title);
    });

    socket.on('booking:created', (data: any) => {
      console.log('📅 New booking:', data);
      toast.success('New booking created!');
    });

    socket.on('message:received', (data: any) => {
      console.log('💬 New message:', data);
      toast.info('New message received');
    });

    socket.on('alert:created', (data: any) => {
      console.log('🚨 New alert:', data);
      toast.error(`Alert: ${data.title}`);
    });

    return () => {
      socket.off('notification');
      socket.off('booking:created');
      socket.off('message:received');
      socket.off('alert:created');
    };
  }, [socket]);

  return (
    <>
      <toast.ToastContainer />
      
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
        {isConnected && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Notifications Panel */}
      {showPanel && (
        <div className="absolute right-0 top-16 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <h4 className="font-medium text-gray-900 mb-1">{notif.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                  <p className="text-xs text-gray-400">{new Date(notif.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}