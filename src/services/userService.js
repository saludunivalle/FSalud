// src/services/userService.js
import api from './api';
import axios from 'axios';

export const getUserData = async (userId) => {
  try {
    const response = await axios.get(`https://fsalud-server-saludunivalles-projects.vercel.app/getUser`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener información del usuario');
  }
};

export const updateUserData = async (userId, userData) => {
  try {
    // Ensure the backend has a route like POST /api/users/:userId/first-login
    // that maps to the usersController.updateFirstLogin function.
    const response = await axios.post(`https://fsalud-server-saludunivalles-projects.vercel.app/api/users/${userId}/first-login`, userData);
    return response.data;
  } catch (error) {
    // Log the full error response if available for more details
    console.error("Error in updateUserData:", error.response ? error.response.data : error.message);
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Error al actualizar información del usuario');
  }
};