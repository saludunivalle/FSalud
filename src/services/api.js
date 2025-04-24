// src/services/api.js
import axios from 'axios';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://fsalud-server-saludunivalles-projects.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token de autenticación a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('google_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores comunes
    if (error.response && error.response.status === 401) {
      // Redireccionar al login si la sesión expiró
      localStorage.removeItem('google_token');
      localStorage.removeItem('email');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;