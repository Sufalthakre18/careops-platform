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
// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';

    // Do NOT auto-redirect for login/register errors
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
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

  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  logout: () =>
    api.post('/auth/logout'),
};

// Workspace APIs
export const workspaceAPI = {
  getCurrent: () =>
    api.get('/workspaces/current'),

  update: (data: any) =>
    api.put('/workspaces/current', data),

  getOnboardingStatus: () =>
    api.get('/workspaces/onboarding-status'),

  activate: () =>
    api.post('/workspaces/activate'),

  getStats: () =>
    api.get('/workspaces/stats'),
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
    api.get('/bookings/types'),

  getById: (id: string) =>
    api.get(`/bookings/types/${id}`),

  create: (data: any) =>
    api.post('/bookings/types', data),

  update: (id: string, data: any) =>
    api.put(`/bookings/types/${id}`, data),

  delete: (id: string) =>
    api.delete(`/bookings/types/${id}`),

  // Availability endpoints
  getAvailability: (typeId: string) =>
    api.get(`/bookings/types/${typeId}/availability`),

  addAvailability: (typeId: string, data: { dayOfWeek: string; startTime: string; endTime: string }) =>
    api.post(`/bookings/types/${typeId}/availability`, data),

  deleteAvailability: (availabilityId: string) =>
    api.delete(`/bookings/availability/${availabilityId}`),

  getAvailableSlots: (typeId: string, date: string) =>
    api.get(`/bookings/types/${typeId}/available-slots`, { params: { date } }),
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
    api.put(`/bookings/${id}/status`, { status }),

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
  api.post('/contacts/admin', data), 

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
  
  sendMessage: (id: string, data: any) =>
    api.post(`/conversations/${id}/messages`, data),
  
  updateStatus: (id: string, status: string) =>
    api.put(`/conversations/${id}/status`, { status }),
};

// form api
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
  
  getAllSubmissions: (params?: any) =>
    api.get('/forms/submissions/all', { params }),
  
  getSubmissionById: (id: string) =>
    api.get(`/forms/submissions/${id}`),
  
  submitForm: (submissionId: string, data: any) =>
    api.post(`/forms/submissions/${submissionId}`, { data }),
  
  createAndSubmit: (formId: string, data: any) =>
    api.post(`/forms/${formId}/submissions`, { data }),
  
  linkToBookingType: (formId: string, bookingTypeId: string, data?: any) =>
    api.post(`/forms/${formId}/booking-types/${bookingTypeId}`, data),
};


// Inventory APIs
export const inventoryAPI = {
  getAll: (params?: any) =>
    api.get('/inventory', { params }),
  
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
  
  updateQuantity: (id: string, data: any) =>
    api.put(`/inventory/${id}/quantity`, data),
  
  getUsageHistory: (id: string, params?: any) =>
    api.get(`/inventory/${id}/usage`, { params }),
  
  getLowStockItems: () =>
    api.get('/inventory/alerts/low-stock'),
};

// Integration APIs
export const integrationAPI = {
  getAll: () =>
    api.get('/integrations'),

  createEmail: (data: any) =>
    api.post('/integrations/email', data),

  updateEmail: (id: string, data: any) =>
    api.put(`/integrations/email`, data),

  deleteEmail: (id: string) =>
    api.delete(`/integrations/email`),
  createSms: (data: any) =>
    api.post('/integrations/sms', data),
  createWebhook: (data: any) =>
    api.post('/integrations/webhook', data),

  createCalendar: (data: { icalUrl?: string; useBuiltInOnly?: boolean }) =>
    api.post('/integrations/calendar', data),

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

  update: (id: string, data: any) =>
    api.put(`/staff/${id}`, data),
  
  invite: (data: any) =>
    api.post('/staff/invite', data),
  
  updatePermissions: (id: string, permissions: any) =>
    api.put(`/staff/${id}/permissions`, permissions),
  
  activate: (id: string) =>
    api.put(`/staff/${id}/activate`),
  
  deactivate: (id: string) =>
    api.put(`/staff/${id}/deactivate`),
  
  remove: (id: string) =>
    api.delete(`/staff/${id}`),
  
  resetPassword: (id: string) =>
    api.post(`/staff/${id}/reset-password`),
};

// Alert APIs
export const alertAPI = {
  getAll: (params?: any) =>
    api.get('/alerts', { params }),
  
  getSummary: () =>
    api.get('/alerts/summary'),
  
  getById: (id: string) =>
    api.get(`/alerts/${id}`),
  
  create: (data: any) =>
    api.post('/alerts', data),
  
  acknowledge: (id: string) =>
    api.put(`/alerts/${id}/acknowledge`),
  
  resolve: (id: string) =>
    api.put(`/alerts/${id}/resolve`),
  
  delete: (id: string) =>
    api.delete(`/alerts/${id}`),
  
  bulkAcknowledge: (alertIds: string[]) =>
    api.put('/alerts/bulk/acknowledge', { alertIds }),
  
  bulkResolve: (alertIds: string[]) =>
    api.put('/alerts/bulk/resolve', { alertIds }),
};


// AI APIs
export const aiAPI = {
  // Chat with AI (public)
  chat: (message: string, workspaceId: string, conversationHistory?: any[]) =>
    api.post('/ai/chat', { message, workspaceId, conversationHistory }),

  // Get AI-suggested reply
  suggestReply: (conversationId: string) =>
    api.post('/ai/suggest-reply', { conversationId }),

  // Analyze sentiment
  analyzeSentiment: (text: string) =>
    api.post('/ai/analyze-sentiment', { text }),

  // Extract booking intent
  extractIntent: (message: string) =>
    api.post('/ai/extract-intent', { message }),

  // Generate form questions
  generateFormQuestions: (description: string, numberOfQuestions?: number) =>
    api.post('/ai/generate-form', { description, numberOfQuestions }),

  // Summarize conversation
  summarizeConversation: (conversationId: string) =>
    api.post('/ai/summarize-conversation', { conversationId }),

  // Recommend booking slot
  recommendSlot: (preferences: string, availableSlots: string[]) =>
    api.post('/ai/recommend-slot', { preferences, availableSlots }),
};

// Automation APIs
export const automationAPI = {
  // Get all automation rules
  getAll: () => 
    api.get('/automation'),

  // Get single rule
  getById: (id: string) => 
    api.get(`/automation/${id}`),

  // Create automation rule
  create: (data: any) => 
    api.post('/automation', data),

  // Update automation rule
  update: (id: string, data: any) => 
    api.put(`/automation/${id}`, data),

  // Toggle automation rule
  toggle: (id: string) => 
    api.put(`/automation/${id}/toggle`),

  // Delete automation rule
  delete: (id: string) => 
    api.delete(`/automation/${id}`),

  // Get templates
  getTemplates: () => 
    api.get('/automation/templates/list'),

  // Create from template
  createFromTemplate: (templateId: string, config?: any) =>
    api.post(`/automation/templates/${templateId}`, { config }),
};

export default api;