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

// Nueva función para obtener todos los usuarios
export const getAllUsers = async () => {
  try {
    console.log('Obteniendo todos los usuarios...');
    const response = await api.get('/api/users/all');
    console.log('Respuesta getAllUsers:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error en getAllUsers:', error.response ? error.response.data : error.message);
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Error al obtener lista de usuarios');
  }
};

// Función para obtener usuario específico por ID (para StudentDocumentManager)
export const getUserById = async (userId) => {
  try {
    console.log(`Obteniendo usuario por ID: ${userId}...`);
    const response = await api.get(`/api/users/id/${userId}`);
    console.log('Respuesta getUserById:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo usuario ${userId}:`, error);
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Error al obtener datos del usuario');
  }
};

// Función para obtener documentos de un usuario con detalles completos
export const getUserDocumentsWithDetails = async (userId) => {
  try {
    console.log(`Obteniendo documentos detallados para usuario ${userId}...`);
    const response = await api.get(`/api/documentos/usuario/${userId}`);
    console.log(`Documentos detallados del usuario ${userId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo documentos detallados del usuario ${userId}:`, error);
    // Si no tiene documentos, devolver estructura vacía
    return { success: true, data: [] };
  }
};

// Función para obtener tipos de documentos requeridos
export const getRequiredDocumentTypes = async () => {
  try {
    console.log('Obteniendo tipos de documentos requeridos...');
    const response = await api.get('/api/documentos/tipos');
    console.log('Tipos de documentos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo tipos de documentos:', error);
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Error al obtener tipos de documentos');
  }
};

// Función para transformar datos del usuario para el StudentDocumentManager
export const transformUserForManager = (backendUser, userDocuments = [], documentTypes = []) => {
  console.log(`🔄 transformUserForManager - ${backendUser.nombre_usuario}: ${userDocuments.length} documentos`);
  
  const user = {
    id: backendUser.id_usuario,
    nombre: backendUser.nombre_usuario || '',
    apellido: backendUser.apellido_usuario || '',
    codigo: backendUser.documento_usuario && backendUser.documento_usuario.trim() !== '' ? backendUser.documento_usuario : '',
    email: backendUser.correo_usuario || '',
    celular: backendUser.telefono || '',
    rol: backendUser.rol === 'docente' || backendUser.rol === 'profesor' ? 'Docente' : 'Estudiante',
    programa: backendUser.programa_academico || 'Sin asignar',
    sede: backendUser.sede || 'Sin asignar',
    nivel: 'Pregrado',
    escenarios: 'Por asignar',
    rotacion: 'Por asignar',
    completado: backendUser.primer_login === 'si' && 
               backendUser.programa_academico && 
               backendUser.documento_usuario && 
               backendUser.telefono && 
               backendUser.fecha_nac,
    documentos: [],
    userDocuments: userDocuments, // Agregar documentos del usuario para gestión de dosis
    documentTypes: documentTypes   // Agregar tipos de documentos para gestión de dosis
  };

  // Crear mapa de documentos del usuario por tipo
  const userDocsMap = {};
  userDocuments.forEach(doc => {
    // Usar id_doc como key en lugar de id_tipo_documento
    const docKey = doc.id_doc || doc.id_tipo_documento;
    if (!userDocsMap[docKey]) {
      userDocsMap[docKey] = [];
    }
    userDocsMap[docKey].push(doc);
  });

  // Generar lista completa de documentos (cargados y por cargar)
  const documentList = documentTypes.map((docType, index) => {
    // Usar id_doc como key principal
    const docKey = docType.id_doc || docType.id_tipo_documento;
    const userDocs = userDocsMap[docKey] || [];
    const dosis = parseInt(docType.dosis) || 1;
    
    if (dosis > 1) {
      // Documento con múltiples dosis - crear grupo
      return {
        id: docKey,
        id_usuarioDoc: null,
        id_tipo_documento: docKey,
        nombre: docType.nombre_doc || docType.nombre_documento || 'Documento sin nombre',
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
      const userDoc = userDocs[0]; // Tomar el primer documento si existe
      
      if (userDoc) {
        // Documento cargado por el usuario
        // Determinar el estado del documento usando lógica mejorada
        let documentoEstado;
        const hasFile = userDoc.ruta_archivo && userDoc.ruta_archivo.trim() !== '';
        const hasUploadDate = userDoc.fecha_cargue && userDoc.fecha_cargue.trim() !== '';
        
        // Si no tiene archivo ni fecha de carga, considerar sin cargar
        if (!hasFile && !hasUploadDate) {
          documentoEstado = 'sin cargar';
        } else if (!userDoc.estado || userDoc.estado.trim() === '') {
          // Si tiene archivo o fecha de carga pero no estado, considerar pendiente
          documentoEstado = 'pendiente';
        } else {
          // Devolver el estado que tiene asignado, unificando terminología
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
              documentoEstado = userDoc.estado.toLowerCase(); // Usar el estado original si es estándar
              break;
          }
        }
        
        return {
          id: userDoc.id_usuarioDoc || userDoc.id || index + 1,
          id_usuarioDoc: userDoc.id_usuarioDoc,
          id_tipo_documento: docKey,
          nombre: docType.nombre_doc || docType.nombre_documento || userDoc.nombre_doc || 'Documento sin nombre',
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
        // Documento no cargado - SIEMPRE mostrar todos los documentos requeridos
        return {
          id: index + 1,
          id_usuarioDoc: null,
          id_tipo_documento: docKey,
          nombre: docType.nombre_doc || docType.nombre_documento || 'Documento sin nombre',
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

  user.documentos = documentList;
  return user;
};

// Función para obtener documentos de un usuario específico
export const getUserDocuments = async (userId) => {
  try {
    console.log(`Obteniendo documentos para usuario ${userId}...`);
    const response = await api.get(`/api/documentos/usuario/${userId}`);
    console.log(`Documentos del usuario ${userId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo documentos del usuario ${userId}:`, error);
    // Si no tiene documentos, devolver estructura vacía
    return { success: true, data: [] };
  }
};

// Función para obtener usuarios con estadísticas reales de documentos
export const getUsersWithDocumentStats = async () => {
  try {
    console.log('Obteniendo usuarios con estadísticas de documentos...');
    
    // Obtener todos los usuarios y tipos de documentos en paralelo
    const [usersResponse, documentTypesResponse] = await Promise.all([
      getAllUsers(),
      getRequiredDocumentTypes()
    ]);
    
    const users = usersResponse.data || usersResponse || [];
    const documentTypes = documentTypesResponse.data || [];
    
    console.log('Tipos de documentos obtenidos:', documentTypes.map(dt => ({ id: dt.id_doc, nombre: dt.nombre_doc, dosis: dt.dosis })));
    
    // Calcular total de documentos requeridos considerando dosis múltiples
    const totalDocumentosRequeridos = documentTypes.reduce((total, docType) => {
      const dosis = parseInt(docType.dosis) || 1;
      console.log(`Documento ${docType.nombre_doc}: ${dosis} dosis`);
      return total + dosis;
    }, 0);
    
    console.log(`Total de documentos requeridos calculado: ${totalDocumentosRequeridos} (de ${documentTypes.length} tipos de documentos)`);
    
    console.log(`Procesando ${users.length} usuarios con ${totalDocumentosRequeridos} documentos requeridos totales (incluyendo dosis)...`);
    
    // Para cada usuario, obtener sus documentos y calcular estadísticas
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          const documentsResponse = await getUserDocuments(user.id_usuario);
          const documents = documentsResponse.data || [];
          
          console.log(`Usuario ${user.nombre_usuario}: tiene ${documents.length} documentos cargados de ${totalDocumentosRequeridos} requeridos`);
          
          // Debug: mostrar documentos con su estado real
          console.log(`🔍 DEBUG - Documentos del usuario ${user.nombre_usuario}:`, documents.map(doc => ({
            id: doc.id_usuarioDoc,
            nombre: doc.nombre_doc || 'Sin nombre',
            estado_original: doc.estado,
            tiene_archivo: !!(doc.ruta_archivo && doc.ruta_archivo.trim() !== ''),
            fecha_cargue: doc.fecha_cargue,
            es_pendiente_revision: (!doc.estado || doc.estado.trim() === '') && 
                                  (doc.ruta_archivo && doc.ruta_archivo.trim() !== '' || doc.fecha_cargue && doc.fecha_cargue.trim() !== '')
          })));
          
          // Reiniciar estadísticas
          const stats = {
            documentosPendientes: 0,
            documentosAprobados: 0,
            documentosRechazados: 0,
            documentosVencidos: 0,
            documentosSinCargar: 0
          };
          
          // Lógica de conteo mejorada: iterar sobre los tipos de doc requeridos
          documentTypes.forEach(docType => {
            const dosisRequeridas = parseInt(docType.dosis) || 1;
            const userDocsForType = documents.filter(d => d.id_doc === docType.id_doc);
            
            if (userDocsForType.length === 0) {
              // Si no hay ningún documento cargado para este tipo, todos cuentan como "sin cargar"
              stats.documentosSinCargar += dosisRequeridas;
            } else {
              // Si hay documentos cargados, verificar el estado de cada dosis
              for (let i = 1; i <= dosisRequeridas; i++) {
                const doseDoc = userDocsForType.find(d => parseInt(d.numero_dosis) === i);
                
                if (!doseDoc) {
                  stats.documentosSinCargar++;
                  continue;
                }
                
                // Determinar el estado real del documento
                let realStatus = 'sin cargar';
                const hasFile = doseDoc.ruta_archivo && doseDoc.ruta_archivo.trim() !== '';
                const hasUploadDate = doseDoc.fecha_cargue && doseDoc.fecha_cargue.trim() !== '';

                if (hasFile || hasUploadDate) {
                  realStatus = (doseDoc.estado && doseDoc.estado.trim() !== '') ? doseDoc.estado.toLowerCase() : 'pendiente';
                }
                
                // Normalizar y contar
                switch (realStatus) {
                  case 'pendiente':
                  case 'sin revisar':
                    stats.documentosPendientes++;
                    break;
                  case 'aprobado':
                  case 'cumplido':
                    stats.documentosAprobados++;
                    break;
                  case 'rechazado':
                    stats.documentosRechazados++;
                    break;
                  case 'vencido':
                  case 'expirado':
                    stats.documentosVencidos++;
                    break;
                  default: // 'sin cargar' y otros casos
                    stats.documentosSinCargar++;
                    break;
                }
              }
            }
          });
          
          // Los documentos sin cargar también incluyen los tipos de documento que no han sido subidos
          const documentosPorSubir = Math.max(0, totalDocumentosRequeridos - documents.length);
          stats.documentosSinCargar += documentosPorSubir;
          
          const userWithStats = {
            ...user,
            documentStats: stats,
            hasDocuments: documents.length > 0,
            totalDocumentosRequeridos // Agregar el total para usar en el frontend
          };
          
          console.log(`📊 Usuario ${user.nombre_usuario} procesado:`, {
            aprobados: stats.documentosAprobados,
            pendientes: stats.documentosPendientes, // ⭐ Este es el valor clave
            rechazados: stats.documentosRechazados,
            vencidos: stats.documentosVencidos,
            sinCargar: stats.documentosSinCargar,
            total: totalDocumentosRequeridos
          });
          
          return userWithStats;
        } catch (error) {
          console.error(`Error obteniendo documentos para usuario ${user.id_usuario}:`, error);
          // Si hay error, usar estadísticas por defecto
          return {
            ...user,
            documentStats: {
              documentosPendientes: 0,
              documentosAprobados: 0,
              documentosRechazados: 0,
              documentosVencidos: 0,
              documentosSinCargar: totalDocumentosRequeridos
            },
            hasDocuments: false,
            totalDocumentosRequeridos
          };
        }
      })
    );
    
    console.log('Usuarios con estadísticas procesados:', usersWithStats.length);
    return usersWithStats;
    
  } catch (error) {
    console.error('Error obteniendo usuarios con estadísticas:', error);
    throw error;
  }
};

// Función para transformar datos del backend al formato del dashboard
export const transformUsersForDashboard = (backendUsers) => {
  return backendUsers.map((user, index) => {
    const estaCompleto = user.primer_login === 'si' && 
                        user.programa_academico && 
                        user.documento_usuario && 
                        user.telefono && 
                        user.fecha_nac;
    
    // Usar estadísticas reales si están disponibles, sino usar valores por defecto
    const stats = user.documentStats || {
      documentosPendientes: 0,
      documentosAprobados: 0,
      documentosRechazados: 0,
      documentosVencidos: 0,
      documentosSinCargar: 0 // Será calculado dinámicamente si no está disponible
    };
    
    console.log(`Usuario ${user.nombre_usuario}: totalDocumentosRequeridos=${user.totalDocumentosRequeridos}, stats:`, stats);
    
    // Mapear roles correctamente - solo mostrar Estudiante ya que no incluimos admins
    let rolDisplay = 'Estudiante';
    if (user.rol === 'docente' || user.rol === 'profesor') {
      rolDisplay = 'Docente';
    }
    
    // El usuario está completado SOLO si:
    // 1. Ha completado su perfil (primer_login, etc.)
    // 2. NO tiene documentos sin cargar (documentosSinCargar === 0)
    // 3. NO tiene documentos pendientes, rechazados o vencidos
    // 4. Tiene al menos algunos documentos aprobados
    const documentacionCompleta = stats.documentosSinCargar === 0 && 
                                 stats.documentosPendientes === 0 && 
                                 stats.documentosRechazados === 0 && 
                                 stats.documentosVencidos === 0 &&
                                 stats.documentosAprobados > 0;
    
    const transformedUser = {
      id: user.id_usuario || index + 1,
      nombre: user.nombre_usuario || '',
      apellido: user.apellido_usuario || '',
      codigo: user.documento_usuario && user.documento_usuario.trim() !== '' ? user.documento_usuario : '',
      email: user.correo_usuario || '',
      celular: user.telefono || '',
      rol: rolDisplay,
      documentosFaltantes: stats.documentosSinCargar > 0 ? 'Sí' : 'No',
      
      // Usar estadísticas reales
      documentosPendientes: stats.documentosPendientes,
      documentosAprobados: stats.documentosAprobados,
      documentosRechazados: stats.documentosRechazados,
      documentosVencidos: stats.documentosVencidos,
      documentosSinCargar: stats.documentosSinCargar,
      
      // Incluir el total de documentos requeridos para mostrar el indicador correcto
      totalDocumentosRequeridos: user.totalDocumentosRequeridos,
      
      programa: user.programa_academico || 'Sin asignar',
      sede: user.sede || 'Sin asignar',
      nivel: 'Pregrado',
      escenarios: 'Por asignar',
      rotacion: 'Por asignar',
      completado: estaCompleto && documentacionCompleta, // Solo completo si perfil Y documentación están completos
      
      // Datos adicionales del backend
      tipoDoc: user.tipoDoc || '',
      fecha_nac: user.fecha_nac || '',
      email_personal: user.email || '',
      primer_login: user.primer_login || 'no',
      hasDocuments: user.hasDocuments || false
    };
    
    console.log(`Usuario transformado ${transformedUser.nombre}: indicador=${transformedUser.documentosAprobados}/${transformedUser.totalDocumentosRequeridos}`);
    
    return transformedUser;
  }).filter(user => user.id && user.email); // Filtrar usuarios sin datos básicos
};

// Crear usuario desde el panel de administración
export const createUserFromAdmin = async (userData) => {
  try {
    const response = await api.post('/api/admin/create-user', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Error al crear usuario');
  }
};