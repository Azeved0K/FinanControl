import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories/'),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
};

// Transactions
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions/', { params }),
  create: (data) => api.post('/transactions/', data),
  update: (id, data) => api.put(`/transactions/${id}/`, data),
  delete: (id) => api.delete(`/transactions/${id}/`),
  getSummary: () => api.get('/transactions/summary/'),
  getByCategory: () => api.get('/transactions/by_category/'),
};

// Insights
export const insightsAPI = {
  get: () => api.get('/insights/'),
};

export default api;