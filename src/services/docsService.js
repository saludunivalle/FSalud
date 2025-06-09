// src/services/documentService.js
import api from './api';
import axios from 'axios';

const BASE_URL = 'https://fsalud-server-saludunivalles-projects.vercel.app';

/**
 * Obtiene la lista de tipos de documentos disponibles
 */

/**
 * Obtiene los documentos cargados por un usuario
 * @param {string} userId - ID del usuario
 */
export const getUserDocuments = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/getUserDocuments`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return []; // Si no hay documentos, devolver array vacío
    }
    throw new Error(error.response?.data?.message || 'Error al obtener documentos del usuario');
  }
};

/**
 * Sube un documento a la plataforma
 * @param {FormData} formData - Formulario con el archivo y metadatos
 */
export const uploadDocument = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/uploadDocument`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al cargar el documento');
  }
};

/**
 * Actualiza un documento existente
 * @param {string} documentId - ID del documento del usuario
 * @param {FormData} formData - Formulario con el archivo y metadatos
 */
export const updateDocument = async (documentId, formData) => {
  try {
    formData.append('documentId', documentId);
    const response = await axios.post(`${BASE_URL}/updateDocument`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al actualizar el documento');
  }
};

/**
 * Elimina un documento del usuario
 * @param {string} documentId - ID del documento del usuario a eliminar
 */
export const deleteDocument = async (documentId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/deleteDocument`, {
      params: { documentId }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al eliminar el documento');
  }
};

/**
 * Obtiene un documento específico del usuario
 * @param {string} userId - ID del usuario
 * @param {string} documentId - ID del tipo de documento
 */
export const getUserDocument = async (userId, documentId) => {
  try {
    const response = await axios.get(`${BASE_URL}/getUserDocument`, {
      params: { userId, documentId }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Si no existe, devolver null
    }
    throw new Error(error.response?.data?.message || 'Error al obtener el documento');
  }
};

/**
 * Verifica si un documento está vigente o ha expirado
 * @param {object} document - Documento del usuario
 * @param {object} documentType - Tipo de documento
 */
export const isDocumentExpired = (document, documentType) => {
  // Si el documento no vence, nunca está expirado
  if (documentType.vence !== 'si') {
    return false;
  }
  
  // Si no tiene fecha de vencimiento, no podemos determinar si está expirado
  if (!document || !document.fecha_vencimiento) {
    return false;
  }
  
  const expirationDate = new Date(document.fecha_vencimiento);
  const today = new Date();
  
  return expirationDate < today;
};

/**
 * Calcula la fecha de vencimiento basada en la fecha de expedición y el tiempo de vencimiento
 * @param {string} expeditionDate - Fecha de expedición (YYYY-MM-DD)
 * @param {number} expirationTime - Tiempo de vencimiento en meses
 */
export const calculateExpirationDate = (expeditionDate, expirationTime) => {
  if (!expeditionDate || !expirationTime) {
    return null;
  }
  
  const date = new Date(expeditionDate);
  date.setMonth(date.getMonth() + parseInt(expirationTime));
  
  return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

/**
 * Obtiene estadísticas de documentos desde el backend
 */
export const getDocumentStatistics = async () => {
  try {
    console.log('Obteniendo estadísticas de documentos...');
    const response = await api.get('/api/documentos/estadisticas');
    console.log('Respuesta estadísticas:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener estadísticas de documentos');
  }
};

/**
 * Revisa y actualiza el estado de un documento
 * @param {string} documentId - ID del documento del usuario
 * @param {object} reviewData - Datos de la revisión (estado, comentario)
 */
export const reviewDocument = async (documentId, reviewData) => {
  // Mapeo de estados del frontend al backend para asegurar compatibilidad.
  const estadoBackend = ((estado) => {
    const estadoMinusculas = estado?.toLowerCase();
    switch (estadoMinusculas) {
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
        return 'Pendiente';
      case 'sin cargar':
        return 'Sin cargar';
      default:
        // Si el estado no es uno de los conocidos, se loguea y se envía tal cual.
        console.warn(`Estado no mapeado detectado: '${estado}'. Se intentará enviar sin cambios.`);
        return estado;
    }
  })(reviewData.estado);

  // Crear una copia de los datos para no modificar el objeto original.
  const dataToSend = {
    ...reviewData,
    estado: estadoBackend,
  };

  try {
    console.log(`Revisando documento ${documentId} (datos para backend):`, dataToSend);
    const response = await api.put(`/api/documentos/revisar/${documentId}`, dataToSend);
    console.log('Respuesta revisión documento:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error revisando documento:', error);
    // Extraer un mensaje de error más claro si está disponible
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al revisar el documento';
    throw new Error(errorMessage);
  }
};

export default {
  getUserDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getUserDocument,
  isDocumentExpired,
  calculateExpirationDate,
  getDocumentStatistics,
  reviewDocument
};