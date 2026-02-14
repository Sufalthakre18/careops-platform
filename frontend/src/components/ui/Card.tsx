// components/ui/Card.tsx
import React from 'react';
import { cn } from '@/lib/utils';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}
export default function Card({
  children,
  className,
  title,
  description,
  action,
}: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden', className)}> 
      {(title || description || action) && (
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50"> 
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500 font-light italic">{description}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}