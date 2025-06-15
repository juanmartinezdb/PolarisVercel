import axios from 'axios';
import { apiClient } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export const authService = {
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await axiosInstance.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    });
    return response.data;
  }
};