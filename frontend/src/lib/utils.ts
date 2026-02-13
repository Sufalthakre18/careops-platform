import { format, formatDistanceToNow } from 'date-fns';

// Format date helper
export const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy') => {
  return format(new Date(date), formatStr);
};

// Format relative time
export const formatRelativeTime = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Get status color
export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'badge-warning',
    CONFIRMED: 'badge-info',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-danger',
    NO_SHOW: 'badge-danger',
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-danger',
    CONNECTED: 'badge-success',
    DISCONNECTED: 'badge-danger',
    RESOLVED: 'badge-success',
    DISMISSED: 'badge-secondary',
  };
  return colors[status] || 'badge-info';
};

// Get alert priority color
export const getAlertPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    LOW: 'text-blue-600 bg-blue-50',
    MEDIUM: 'text-yellow-600 bg-yellow-50',
    HIGH: 'text-orange-600 bg-orange-50',
    CRITICAL: 'text-red-600 bg-red-50',
  };
  return colors[priority] || 'text-gray-600 bg-gray-50';
};

// Truncate text
export const truncate = (text: string, length: number = 50) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Class names helper
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Handle API errors
// Handle API errors (Improved)
export const handleApiError = (error: any): string => {
  if (!error.response) {
    return 'Network error. Please check your internet connection.';
  }

  const { data } = error.response;

  // Express-validator style errors
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const firstError = data.errors[0];
    return firstError.msg || firstError.message || 'Validation error';
  }

  // Standard backend message
  if (data?.message) {
    return data.message;
  }

  return 'Something went wrong. Please try again.';
};


// Validate email
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone
export const isValidPhone = (phone: string) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Format phone number
export const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Get initials from name
export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Generate random color for avatar
export const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};