import { apiRequest } from '../../services/api.js';

export const authService = {
  register: (formData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(formData) }),
  login: (formData) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(formData) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => apiRequest('/auth/me'),
};
