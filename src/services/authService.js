// src/services/authService.js
import api from './api';
import axios from 'axios';

export const saveUser = async (userInfo) => {
  try {
    const response = await axios.post('https://siac-extension-server.vercel.app/saveUser', userInfo);
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