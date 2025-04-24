// src/services/authService.js - Actualizado
import api from './api';

export const saveUser = async (userInfo) => {
  try {
    const response = await api.post('/auth/google', userInfo);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al guardar usuario');
  }
};

export const validateToken = async (token) => {
  try {
    const response = await api.post('/auth/validate', { token });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Token inválido');
  }
};

export const logout = () => {
  localStorage.removeItem('google_token');
  localStorage.removeItem('email');
  localStorage.removeItem('user_id');
  localStorage.removeItem('name');
};