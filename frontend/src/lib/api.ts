import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Workspace APIs
export const workspaceAPI = {
  getCurrent: () =>
    api.get('/workspace/current'),
  
  update: (data: any) =>
    api.put('/workspace', data),
  
  getOnboardingStatus: () =>
    api.get('/workspace/onboarding'),
  
  activate: () =>
    api.post('/workspace/activate'),
  
  getStats: () =>
    api.get('/workspace/stats'),
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: () =>
    api.get('/dashboard/overview'),
  
  getAlerts: () =>
    api.get('/dashboard/alerts'),
};

// Booking Type APIs
export const bookingTypeAPI = {
  getAll: () =>
    api.get('/booking-types'),
  
  getById: (id: string) =>
    api.get(`/booking-types/${id}`),
  
  create: (data: any) =>
    api.post('/booking-types', data),
  
  update: (id: string, data: any) =>
    api.put(`/booking-types/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/booking-types/${id}`),
};

// Booking APIs
export const bookingAPI = {
  getAll: (params?: any) =>
    api.get('/bookings', { params }),
  
  getById: (id: string) =>
    api.get(`/bookings/${id}`),
  
  create: (data: any) =>
    api.post('/bookings', data),
  
  update: (id: string, data: any) =>
    api.put(`/bookings/${id}`, data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/bookings/${id}/status`, { status }),
  
  delete: (id: string) =>
    api.delete(`/bookings/${id}`),
};

// Contact APIs
export const contactAPI = {
  getAll: (params?: any) =>
    api.get('/contacts', { params }),
  
  getById: (id: string) =>
    api.get(`/contacts/${id}`),
  
  create: (data: any) =>
    api.post('/contacts', data),
  
  update: (id: string, data: any) =>
    api.put(`/contacts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
};

// Conversation APIs
export const conversationAPI = {
  getAll: () =>
    api.get('/conversations'),
  
  getById: (id: string) =>
    api.get(`/conversations/${id}`),
  
  getMessages: (id: string) =>
    api.get(`/conversations/${id}/messages`),
  
  sendMessage: (id: string, data: any) =>
    api.post(`/conversations/${id}/messages`, data),
  
  markAsRead: (id: string) =>
    api.patch(`/conversations/${id}/read`),
};

// Form APIs
export const formAPI = {
  getAll: () =>
    api.get('/forms'),
  
  getById: (id: string) =>
    api.get(`/forms/${id}`),
  
  create: (data: any) =>
    api.post('/forms', data),
  
  update: (id: string, data: any) =>
    api.put(`/forms/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/forms/${id}`),
  
  getSubmissions: (id: string) =>
    api.get(`/forms/${id}/submissions`),
};

// Inventory APIs
export const inventoryAPI = {
  getAll: () =>
    api.get('/inventory'),
  
  getById: (id: string) =>
    api.get(`/inventory/${id}`),
  
  create: (data: any) =>
    api.post('/inventory', data),
  
  update: (id: string, data: any) =>
    api.put(`/inventory/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/inventory/${id}`),
  
  adjustStock: (id: string, data: any) =>
    api.post(`/inventory/${id}/adjust`, data),
};

// Integration APIs
export const integrationAPI = {
  getAll: () =>
    api.get('/integrations'),
  
  create: (data: any) =>
    api.post('/integrations', data),
  
  update: (id: string, data: any) =>
    api.put(`/integrations/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/integrations/${id}`),
  
  testConnection: (id: string) =>
    api.post(`/integrations/${id}/test`),
};

// Staff APIs
export const staffAPI = {
  getAll: () =>
    api.get('/staff'),
  
  getById: (id: string) =>
    api.get(`/staff/${id}`),
  
  invite: (data: any) =>
    api.post('/staff/invite', data),
  
  updatePermissions: (id: string, permissions: any) =>
    api.put(`/staff/${id}/permissions`, { permissions }),
  
  activate: (id: string) =>
    api.post(`/staff/${id}/activate`),
  
  deactivate: (id: string) =>
    api.post(`/staff/${id}/deactivate`),
  
  remove: (id: string) =>
    api.delete(`/staff/${id}`),
  
  resetPassword: (id: string) =>
    api.post(`/staff/${id}/reset-password`),
};

// Alert APIs
export const alertAPI = {
  getAll: (params?: any) =>
    api.get('/alerts', { params }),
  
  markAsResolved: (id: string) =>
    api.patch(`/alerts/${id}/resolve`),
  
  markAsDismissed: (id: string) =>
    api.patch(`/alerts/${id}/dismiss`),
};

export default api;