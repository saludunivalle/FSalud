// src/services/docsService.js
import api from './api';
import axios from 'axios';

export const getActiveRequests = async (userId) => {
  try {
    const response = await axios.get(
      'https://fsalud-server-saludunivalles-projects.vercel.app/getActiveRequests',
      { params: { userId } }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error(error.response?.data?.message || 'Error al obtener solicitudes activas');
  }
};

export const createNewRequest = async (requestData) => {
  try {
    const response = await axios.post('https://fsalud-server-saludunivalles-projects.vercel.app/createNewRequest', requestData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al crear solicitud');
  }
};

export const getSolicitud = async (id_solicitud) => {
  try {
    const response = await axios.get('https://fsalud-server-saludunivalles-projects.vercel.app/getSolicitud', {
      params: { id_solicitud }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener detalles de la solicitud');
  }
};

export const getLastId = async (sheetName) => {
  try {
    const response = await axios.get('https://fsalud-server-saludunivalles-projects.vercel.app/getLastId', {
      params: { sheetName }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al obtener último ID');
  }
};

export const generateReport = async (solicitudId, formNumber) => {
  try {
    const response = await axios.post('https://fsalud-server-saludunivalles-projects.vercel.app/generateReport', {
      solicitudId,
      formNumber
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al generar reporte');
  }
};