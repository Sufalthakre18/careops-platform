// components/layout/DashboardLayout.tsx
'use client';
import React, { useState } from 'react'; // Add useState
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Loading from '../ui/Loading';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Add state for sidebar
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  if (loading) {
    return <Loading fullScreen />;
  }
  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> {/* Subtle background gradient for depth */}
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} /> {/* Pass toggle function */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} /> {/* Pass open state */}
      <main className="ml-0 md:ml-64 mt-16 p-4 md:p-8 min-h-[calc(100vh-4rem)] transition-all duration-300"> {/* Responsive padding */}
        {children}
      </main>
      {isSidebarOpen && ( // Overlay for mobile
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}