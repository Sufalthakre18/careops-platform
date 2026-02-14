// components/layout/Sidebar.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  Package,
  Settings,
  Zap,
  UserPlus,
  Bell,
  BarChart3,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}
const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Automation', href: '/dashboard/automation', icon: Workflow },
  { name: 'Integrations', href: '/integrations', icon: Zap, ownerOnly: true },
  { name: 'Staff', href: '/staff', icon: UserPlus, ownerOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings, ownerOnly: true },
];
export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) { // Add props for open state
  const pathname = usePathname();
  const { user } = useAuth();
  if (!user) return null;
  const filteredNavItems = navItems.filter(
    (item) => !item.ownerOnly || user.role === 'OWNER'
  );
  return (
    <aside className={cn(
      "fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-blue-50 to-gray-50 border-r border-blue-100 overflow-y-auto transition-all duration-300 z-30 shadow-sm",
      "md:translate-x-0 md:block",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <nav className="p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose} // Close on link click
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-md',
                isActive
                  ? 'bg-blue-100 text-blue-700 font-semibold shadow-inner'
                  : 'text-gray-600 hover:bg-blue-50'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive ? 'text-blue-700' : 'text-blue-300'
                )}
              />
              <span className="text-base tracking-wide font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}