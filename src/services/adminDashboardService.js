// src/services/adminDashboardService.js
import api from './api';
import axios from 'axios';

// Sistema de caché simple
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

/**
 * Utility function para hacer retry con backoff exponencial en el frontend
 * @param {Function} fn - Función a ejecutar
 * @param {number} retries - Número de reintentos
 * @param {number} delay - Delay inicial en ms
 * @returns {Promise} - Resultado de la función
 */
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    // Si es un error de rate limiting (429 o 500 con mensaje de quota) y aún tenemos reintentos
    const isRateLimit = error.response?.status === 429 || 
                       error.response?.status === 500 && 
                       (error.response?.data?.message?.includes('Quota exceeded') || 
                        error.message?.includes('Quota exceeded'));
    
    if (isRateLimit && retries > 0) {
      console.log(`Rate limit detectado, esperando ${delay}ms antes de reintentar. Reintentos restantes: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2); // Duplicar el delay
    }
    throw error;
  }
};

/**
 * Función helper para obtener datos con caché
 * @param {string} cacheKey - Clave del caché
 * @param {Function} fetchFn - Función para obtener datos
 * @returns {Promise} - Datos cacheados o frescos
 */
const getWithCache = async (cacheKey, fetchFn) => {
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Cache hit para: ${cacheKey}`);
    return cached.data;
  }
  
  console.log(`Cache miss para: ${cacheKey}, obteniendo datos frescos...`);
  const data = await retryWithBackoff(fetchFn);
  
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};

/**
 * Función para limpiar cache específico
 * @param {string} pattern - Patrón para limpiar ciertas entradas
 */
export const clearAdminDashboardCache = (pattern = null) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  console.log('Cache de admin dashboard limpiado:', pattern ? `patrón: ${pattern}` : 'completo');
};

/**
 * Obtiene todos los datos del dashboard de admin usando el endpoint consolidado
 * @returns {Promise<Object>} - Datos completos del dashboard de admin
 */
export const getAdminDashboardData = async () => {
  return getWithCache('admin-dashboard', async () => {
    console.log('Obteniendo datos del dashboard de admin...');
    const response = await api.get('/api/v1/admin-dashboard');
    console.log('Respuesta del dashboard de admin:', response.data);
    return response.data;
  });
};

/**
 * Transforma los datos del backend para el componente AdminDashboard
 * @param {Object} backendData - Datos del backend
 * @returns {Object} - Datos transformados para el frontend
 */
export const transformAdminDashboardData = (backendData) => {
  if (!backendData || !backendData.data) {
    console.warn('Datos del backend incompletos:', backendData);
    return {
      users: [],
      pendingDocuments: [],
      stats: {
        totalUsers: 0,
        totalStudents: 0,
        totalAdmins: 0,
        totalDocuments: 0,
        pendingDocuments: 0,
        approvedDocuments: 0,
        rejectedDocuments: 0,
        expiredDocuments: 0
      },
      statsByProgram: {}
    };
  }

  const { users, userDocuments, documentTypes, programs, pendingDocumentsList, stats, statsByProgram } = backendData.data;

  // Transformar usuarios para el frontend con estadísticas de documentos
  const transformedUsers = users.map(user => {
    // Filtrar documentos de este usuario
    const userDocs = userDocuments.filter(doc => doc.id_persona === user.id_usuario);
    
    // Calcular estadísticas de documentos para este usuario
    const userStats = {
      documentosPendientes: 0,
      documentosAprobados: 0,
      documentosRechazados: 0,
      documentosVencidos: 0,
      documentosSinCargar: 0
    };
    
    // Contar documentos por estado
    userDocs.forEach(doc => {
      const estado = doc.estado ? doc.estado.toLowerCase() : '';
      switch (estado) {
        case 'pendiente':
        case 'sin revisar':
          userStats.documentosPendientes++;
          break;
        case 'aprobado':
        case 'cumplido':
          userStats.documentosAprobados++;
          break;
        case 'rechazado':
          userStats.documentosRechazados++;
          break;
        case 'vencido':
        case 'expirado':
          userStats.documentosVencidos++;
          break;
        default:
          userStats.documentosSinCargar++;
          break;
      }
    });
    
    // Calcular total de documentos requeridos
    const totalDocumentosRequeridos = documentTypes.length;
    
    // Calcular documentos sin cargar (tipos de documento que no han sido subidos)
    const documentosSubidos = userDocs.length;
    userStats.documentosSinCargar = Math.max(0, totalDocumentosRequeridos - documentosSubidos);
    
    // Determinar si el usuario está completo
    const estaCompleto = user.primer_login === 'si' && 
                        user.programa_academico && 
                        user.documento_usuario && 
                        user.telefono && 
                        user.fecha_nac;
    
    // El usuario está completamente documentado si no tiene documentos sin cargar, pendientes, rechazados o vencidos
    const documentacionCompleta = userStats.documentosSinCargar === 0 && 
                                 userStats.documentosPendientes === 0 && 
                                 userStats.documentosRechazados === 0 && 
                                 userStats.documentosVencidos === 0 &&
                                 userStats.documentosAprobados > 0;
    
    return {
      id: user.id_usuario,
      nombre: user.nombre_usuario || '',
      apellido: user.apellido_usuario || '',
      codigo: user.documento_usuario || '',
      email: user.correo_usuario || '',
      celular: user.telefono || '',
      rol: user.rol && (user.rol.toLowerCase() === 'admin' || user.rol.toLowerCase() === 'administrador') ? 'Admin' : 
           (user.rol && (user.rol.toLowerCase() === 'docente' || user.rol.toLowerCase() === 'profesor')) ? 'Docente' : 'Estudiante',
      programa: user.programa_academico || 'Sin asignar',
      sede: user.sede || 'Sin asignar',
      completado: estaCompleto && documentacionCompleta,
      
      // Estadísticas de documentos
      documentosPendientes: userStats.documentosPendientes,
      documentosAprobados: userStats.documentosAprobados,
      documentosRechazados: userStats.documentosRechazados,
      documentosVencidos: userStats.documentosVencidos,
      documentosSinCargar: userStats.documentosSinCargar,
      totalDocumentosRequeridos: totalDocumentosRequeridos,
      
      // Datos adicionales
      tipoDoc: user.tipoDoc || '',
      fecha_nac: user.fecha_nac || '',
      email_personal: user.email || '',
      primer_login: user.primer_login || 'no',
      hasDocuments: userDocs.length > 0
    };
  });

  // Transformar documentos pendientes para el frontend
  const transformedPendingDocuments = pendingDocumentsList.map(doc => ({
    id: doc.id_usuarioDoc,
    id_doc: doc.id_doc,
    nombre_doc: doc.nombre_doc,
    dosis: doc.dosis,
    fecha_cargue: doc.fecha_cargue,
    fecha_expedicion: doc.fecha_expedicion,
    fecha_vencimiento: doc.fecha_vencimiento,
    fecha_revision: doc.fecha_revision,
    estado: doc.estado,
    comentarios: doc.comentario || doc.comentarios || '',
    ruta_archivo: doc.ruta_archivo,
    nombre_archivo: doc.nombre_archivo,
    user: doc.user ? {
      id: doc.user.id_usuario,
      nombre: doc.user.nombre_usuario,
      apellido: doc.user.apellido_usuario,
      email: doc.user.correo_usuario,
      programa: doc.user.programa_academico,
      sede: doc.user.sede
    } : null,
    documentType: doc.documentType ? {
      id_doc: doc.documentType.id_doc,
      nombre_doc: doc.documentType.nombre_doc,
      descripcion: doc.documentType.descripcion,
      vence: doc.documentType.vence,
      tiempo_vencimiento: doc.documentType.tiempo_vencimiento
    } : null
  }));

  // Transformar tipos de documentos
  const transformedDocumentTypes = documentTypes.map(docType => ({
    id_doc: docType.id_doc,
    nombre_doc: docType.nombre_doc,
    descripcion: docType.descripcion,
    dosis: docType.dosis,
    vence: docType.vence,
    tiempo_vencimiento: docType.tiempo_vencimiento,
    obligatorio: docType.obligatorio
  }));

  // Transformar programas
  const transformedPrograms = programs.map(program => ({
    id_programa: program.id_programa,
    nombre_programa: program.nombre_programa,
    sede: program.sede
  }));

  return {
    users: transformedUsers,
    pendingDocuments: transformedPendingDocuments,
    documentTypes: transformedDocumentTypes,
    programs: transformedPrograms,
    stats,
    statsByProgram
  };
};

/**
 * Función principal para obtener y transformar datos del dashboard de admin
 * @returns {Promise<Object>} - Datos transformados del dashboard
 */
export const getAdminDashboard = async () => {
  try {
    const backendData = await getAdminDashboardData();
    return transformAdminDashboardData(backendData);
  } catch (error) {
    console.error('Error obteniendo datos del dashboard de admin:', error);
    throw error;
  }
};

/**
 * Función para forzar la recarga de datos del dashboard (limpiar cache)
 * @returns {Promise<Object>} - Datos frescos del dashboard
 */
export const refreshAdminDashboard = async () => {
  console.log('Forzando recarga del dashboard de admin...');
  clearAdminDashboardCache('admin-dashboard');
  return await getAdminDashboard();
}; 