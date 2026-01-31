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
    me: () => api.get('/auth/me/'),
    updateMe: (data) => {
        const hasFile =
            data &&
            typeof data === 'object' &&
            (data.avatar instanceof File);
        if (!hasFile) return api.patch('/auth/me/', data);

        const form = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v === undefined) return;
            if (v === null) {
                form.append(k, '');
                return;
            }
            form.append(k, v);
        });

        return api.patch('/auth/me/', form, {
            headers: {'Content-Type': 'multipart/form-data'},
        });
    },
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
    getAll: (params) => api.get('/transactions/', {params}),
    create: (data) => api.post('/transactions/', data),
    update: (id, data) => api.put(`/transactions/${id}/`, data),
    delete: (id) => api.delete(`/transactions/${id}/`),
    getSummary: () => api.get('/transactions/summary/'),
    getByCategory: () => api.get('/transactions/by_category/'),
    getBalanceHistory: (days = 7) => api.get('/transactions/balance_history/', {params: {days}}),
    getDailyBalance: (days = 30) => api.get('/transactions/daily_balance/', {params: {days}}),
};

// Insights
export const insightsAPI = {
    get: () => api.get('/insights/'),
};

// Piggy Banks
export const piggyBanksAPI = {
    getAll: () => api.get('/piggy_banks/'),
    create: (data) => api.post('/piggy_banks/', data),
    update: (id, data) => api.put(`/piggy_banks/${id}/`, data),
    delete: (id) => api.delete(`/piggy_banks/${id}/`),
    getSummary: (id) => api.get(`/piggy_banks/${id}/summary/`),
    getDaily: (id, days = 30) => api.get(`/piggy_banks/${id}/daily/`, {params: {days}}),
    getForecast: (id, days = 30) => api.get(`/piggy_banks/${id}/forecast/`, {params: {days}}),
};

export const piggyBankTransactionsAPI = {
    getAll: (params) => api.get('/piggy_bank_transactions/', {params}),
    create: (data) => api.post('/piggy_bank_transactions/', data),
    delete: (id) => api.delete(`/piggy_bank_transactions/${id}/`),
};

export default api;