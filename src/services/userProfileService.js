// src/services/userProfileService.js
import api from './api';

// Cache simple en memoria para el frontend
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Función para hacer retry con backoff exponencial en el frontend
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
export const clearUserProfileCache = (pattern = null) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  console.log('Cache de user profile limpiado:', pattern ? `patrón: ${pattern}` : 'completo');
};

/**
 * Obtiene el perfil completo de un usuario usando el nuevo endpoint consolidado
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - Perfil completo del usuario
 */
export const getUserProfile = async (userId) => {
  return getWithCache(`user-profile-${userId}`, async () => {
    try {
      console.log(`🔄 Obteniendo perfil completo del usuario ${userId} desde el nuevo endpoint consolidado...`);
      
      const response = await api.get(`/api/v1/user-profile/${userId}`);
      
      console.log(`✅ Perfil del usuario ${userId} obtenido exitosamente:`, {
        user: response.data.data.user?.nombre_usuario,
        documentsCount: response.data.data.documents?.length,
        documentTypesCount: response.data.data.documentTypes?.length,
        stats: response.data.data.stats
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo perfil del usuario ${userId}:`, error);
      
      // Manejo específico para errores de rate limiting
      if (error.response?.status === 429) {
        throw new Error('El sistema está experimentando una alta demanda. Inténtalo de nuevo en unos momentos.');
      }
      
      // Manejo para usuario no encontrado
      if (error.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      
      throw new Error(error.response?.data?.error || 'Error al obtener el perfil del usuario');
    }
  });
};

/**
 * Obtiene el perfil completo de un usuario sin cache (forzar actualización)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - Perfil completo del usuario
 */
export const getUserProfileFresh = async (userId) => {
  try {
    console.log(`🔄 Obteniendo perfil fresco del usuario ${userId}...`);
    
    // Limpiar cache específico para este usuario
    clearUserProfileCache(`user-profile-${userId}`);
    
    const response = await api.get(`/api/v1/user-profile/${userId}`);
    
    console.log(`✅ Perfil fresco del usuario ${userId} obtenido exitosamente`);
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error obteniendo perfil fresco del usuario ${userId}:`, error);
    throw new Error(error.response?.data?.error || 'Error al obtener el perfil del usuario');
  }
};

/**
 * Transforma los datos del perfil para compatibilidad con componentes existentes
 * @param {Object} userProfile - Datos del perfil del usuario
 * @returns {Object} - Datos transformados para el frontend
 */
export const transformUserProfileForComponents = (userProfile) => {
  const { user, documents, documentTypes, stats } = userProfile.data;
  
  // Transformar para compatibilidad con transformUserForManager
  const transformedUser = {
    id: user.id_usuario,
    nombre: user.nombre_usuario || '',
    apellido: user.apellido_usuario || '',
    codigo: user.documento_usuario && user.documento_usuario.trim() !== '' ? user.documento_usuario : '',
    email: user.correo_usuario || '',
    celular: user.telefono || '',
    rol: user.rol && (user.rol.toLowerCase() === 'docente' || user.rol.toLowerCase() === 'profesor' || user.rol.toLowerCase() === 'admin' || user.rol.toLowerCase() === 'administrador') ? 'Docente' : 'Estudiante',
    programa: user.programa_academico || 'Sin asignar',
    sede: user.sede || 'Sin asignar',
    nivel: 'Pregrado',
    escenarios: 'Por asignar',
    rotacion: 'Por asignar',
    completado: user.primer_login === 'si' && 
               user.programa_academico && 
               user.documento_usuario && 
               user.telefono && 
               user.fecha_nac,
    documentos: [],
    userDocuments: documents,
    documentTypes: documentTypes
  };

  // Debug: Log del rol transformado
  console.log(`🔍 Debug Frontend - Rol original: "${user.rol}" -> Transformado: "${transformedUser.rol}"`);

  // Crear mapa de documentos del usuario por tipo
  const userDocsMap = {};
  documents.forEach(doc => {
    const docKey = doc.id_doc || doc.id_tipo_documento;
    if (!userDocsMap[docKey]) {
      userDocsMap[docKey] = [];
    }
    userDocsMap[docKey].push(doc);
  });

  // Generar lista completa de documentos (cargados y por cargar)
  const documentList = documentTypes.map((docType, index) => {
    const docKey = docType.id_doc || docType.id_tipo_documento;
    const userDocs = userDocsMap[docKey] || [];
    const dosis = parseInt(docType.dosis) || 1;
    
    if (dosis > 1) {
      // Documento con múltiples dosis - crear grupo
      return {
        id: docKey,
        id_usuarioDoc: null,
        id_tipo_documento: docKey,
        nombre: docType.nombre_doc || 'Documento sin nombre',
        estado: 'sin cargar', // Se calculará el estado consolidado después
        isDoseGroup: true,
        dosis: dosis,
        totalDoses: dosis,
        baseDoc: docType,
        userDocs: userDocs,
        vence: docType.vence === 'si' || docType.vence === true,
        tiempoVencimiento: docType.tiempo_vencimiento || null,
        descripcion: docType.descripcion || ''
      };
    } else {
      // Documento normal
      const userDoc = userDocs[0];
      
      if (userDoc) {
        // Documento cargado por el usuario
        let documentoEstado;
        const hasFile = userDoc.ruta_archivo && userDoc.ruta_archivo.trim() !== '';
        const hasUploadDate = userDoc.fecha_cargue && userDoc.fecha_cargue.trim() !== '';
        
        if (!hasFile && !hasUploadDate) {
          documentoEstado = 'sin cargar';
        } else if (!userDoc.estado || userDoc.estado.trim() === '') {
          documentoEstado = 'pendiente';
        } else {
          switch (userDoc.estado.toLowerCase()) {
            case 'cumplido':
              documentoEstado = 'aprobado';
              break;
            case 'expirado':
              documentoEstado = 'vencido';
              break;
            case 'sin revisar':
              documentoEstado = 'pendiente';
              break;
            default:
              documentoEstado = userDoc.estado.toLowerCase();
              break;
          }
        }
        
        return {
          id: userDoc.id_usuarioDoc || userDoc.id || index + 1,
          id_usuarioDoc: userDoc.id_usuarioDoc,
          id_tipo_documento: docKey,
          nombre: docType.nombre_doc || userDoc.nombre_doc || 'Documento sin nombre',
          estado: documentoEstado,
          fechaExpedicion: userDoc.fecha_expedicion || '',
          fechaVencimiento: userDoc.fecha_vencimiento || null,
          fechaCargue: userDoc.fecha_cargue || '',
          fechaRevision: userDoc.fecha_revision || '',
          comentarios: userDoc.comentarios || '',
          rutaArchivo: userDoc.ruta_archivo || '',
          vence: docType.vence === 'si' || docType.vence === true,
          tiempoVencimiento: docType.tiempo_vencimiento || null,
          descripcion: docType.descripcion || '',
          dosis: 1,
          isDoseGroup: false
        };
      } else {
        // Documento no cargado
        return {
          id: index + 1,
          id_usuarioDoc: null,
          id_tipo_documento: docKey,
          nombre: docType.nombre_doc || 'Documento sin nombre',
          estado: 'sin cargar',
          fechaExpedicion: '',
          fechaVencimiento: null,
          fechaCargue: '',
          fechaRevision: '',
          comentarios: '',
          rutaArchivo: '',
          vence: docType.vence === 'si' || docType.vence === true,
          tiempoVencimiento: docType.tiempo_vencimiento || null,
          descripcion: docType.descripcion || '',
          dosis: 1,
          isDoseGroup: false
        };
      }
    }
  });

  transformedUser.documentos = documentList;
  return transformedUser;
};

/**
 * Función de utilidad para obtener estadísticas del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - Estadísticas del usuario
 */
export const getUserStats = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    return userProfile.data.stats;
  } catch (error) {
    console.error(`Error obteniendo estadísticas del usuario ${userId}:`, error);
    throw error;
  }
}; 