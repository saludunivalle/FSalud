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
  const { estado, comentario, fecha_vencimiento } = reviewData;

  // Frontend validation before sending to backend
  const estadosValidos = ['Aprobado', 'Rechazado', 'Vencido', 'Pendiente'];
  const estadoNormalizado = estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();

  if (!estadosValidos.map(s => s.toLowerCase()).includes(estado.toLowerCase())) {
    throw new Error(`Estado '${estado}' no válido. Estados válidos: ${estadosValidos.join(', ')}`);
  }

  const token = localStorage.getItem('google_token');
  if (!token) {
    throw new Error('Token de autenticación no encontrado');
  }

  // Mapear estados del frontend a estados del backend
  const estadoBackend = {
    'Aprobado': 'Aprobado',
    'Rechazado': 'Rechazado',
    'Vencido': 'Vencido',
    'Pendiente': 'Pendiente'
  }[estadoNormalizado] || estadoNormalizado;

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
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al revisar el documento';
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene datos consolidados para la revisión de un documento específico
 * @param {string} documentId - ID del documento a revisar
 * @returns {Promise<Object>} - Datos consolidados para revisión
 */
export const getDocumentReviewData = async (documentId) => {
  try {
    console.log(`🔄 Obteniendo datos para revisión del documento ${documentId}...`);
    
    const response = await api.get(`/api/v1/document-review/${documentId}`);
    
    console.log(`✅ Datos para revisión del documento ${documentId} obtenidos exitosamente`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error obteniendo datos para revisión del documento ${documentId}:`, error);
    
    // Manejo específico para errores de rate limiting
    if (error.response?.status === 429) {
      throw new Error('El sistema está experimentando una alta demanda. Inténtalo de nuevo en unos momentos.');
    }
    
    // Manejo para documento no encontrado
    if (error.response?.status === 404) {
      throw new Error('Documento no encontrado');
    }
    
    throw new Error(error.response?.data?.error || 'Error al obtener datos para revisión');
  }
};

/**
 * Actualiza múltiples documentos de forma masiva
 * @param {Array} updates - Array de actualizaciones de documentos
 * @returns {Promise<Object>} - Resultado de la actualización masiva
 */
export const batchUpdateDocuments = async (updates) => {
  try {
    console.log(`🔄 Iniciando actualización masiva de ${updates.length} documentos...`);
    
    const response = await api.post('/api/v1/documents/batch-update', {
      updates: updates
    });
    
    console.log(`✅ Actualización masiva completada exitosamente`);
    return response.data;
  } catch (error) {
    console.error('❌ Error en actualización masiva de documentos:', error);
    
    // Manejo específico para errores de rate limiting
    if (error.response?.status === 429) {
      throw new Error('El sistema está experimentando una alta demanda. Inténtalo de nuevo en unos momentos.');
    }
    
    // Manejo para documentos no encontrados
    if (error.response?.status === 404) {
      throw new Error('Uno o más documentos no fueron encontrados');
    }
    
    // Manejo para errores de validación
    if (error.response?.status === 400) {
      const details = error.response?.data?.details || [];
      throw new Error(`Datos de actualización inválidos: ${details.join(', ')}`);
    }
    
    throw new Error(error.response?.data?.error || 'Error al realizar la actualización masiva');
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