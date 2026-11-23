import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('expense_tracker_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('expense_tracker_user');
      localStorage.removeItem('expense_tracker_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const refreshToken = () => api.post('/auth/refresh');

// ===== EXPENSES =====
export const getExpenses = (params = {}) => api.get('/expenses', { params });
export const addExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const getMonthlySummary = () => api.get('/expenses/summary');

// ===== CATEGORIES =====
export const getCategories = () => api.get('/categories');
export const addCategory = (data) => api.post('/categories', data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// ===== BUDGETS =====
export const getBudgets = () => api.get('/budgets');
export const setBudget = (data) => api.post('/budgets', data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

// ===== RECURRING EXPENSES =====
export const getRecurringExpenses = () => api.get('/recurring');
export const createRecurringExpense = (data) => api.post('/recurring', data);
export const toggleRecurringExpense = (id) => api.put(`/recurring/${id}/toggle`);
export const deleteRecurringExpense = (id) => api.delete(`/recurring/${id}`);

// ===== INSIGHTS =====
export const getInsights = () => api.get('/expenses/insights');

// ===== EXPORTS =====
export const getCsvExportUrl = () => `${API_BASE_URL}/expenses/export/csv`;
export const getPdfExportUrl = () => `${API_BASE_URL}/expenses/export/pdf`;

export default api;
