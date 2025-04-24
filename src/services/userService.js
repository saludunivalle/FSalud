// src/services/userService.js
import api from './api';
import axios from 'axios';

export const getUserData = async (userId) => {
  try {
    const response = await axios.get(`https://siac-extension-server.vercel.app/getUser`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener información del usuario');
  }
};

export const updateUserData = async (userId, userData) => {
  try {
    const response = await axios.post(`https://siac-extension-server.vercel.app/updateUser`, {
      userId,
      ...userData
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al actualizar información del usuario');
  }
};