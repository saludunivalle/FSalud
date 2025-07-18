import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, transformUserProfileForComponents, clearUserProfileCache } from '../services/userProfileService';
import { clearCache } from '../services/userService';
import { getDoseGroupStatus } from '../utils/documentUtils';
import { useSaturation } from '../context/SaturationContext';

export const useStudentDocumentManager = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [documentStats, setDocumentStats] = useState({
    aprobados: 0,
    pendientes: 0,
    rechazados: 0,
    vencidos: 0,
    sinCargar: 0
  });
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  const { modoSaturado, setModoSaturado } = useSaturation();

  // Función para procesar documentos y calcular estadísticas
  const processDocuments = (transformedStudent) => {
    const processedDocuments = transformedStudent.documentos.map(doc => {
      if (doc.isDoseGroup) {
        // Función mejorada para obtener estado de documento individual
        const getDocumentStatus = (userDoc, docType) => {
          // Si no hay documento cargado
          if (!userDoc) {
            return 'sin cargar';
          }
          
          // Si existe el documento y tiene archivo o fecha de carga, está cargado
          const hasFile = userDoc.ruta_archivo && userDoc.ruta_archivo.trim() !== '';
          const hasUploadDate = userDoc.fecha_cargue && userDoc.fecha_cargue.trim() !== '';
          
          // Si no tiene archivo ni fecha de carga, considerar sin cargar
          if (!hasFile && !hasUploadDate) {
            return 'sin cargar';
          }
          
          // Devolver el estado que tiene asignado
          if (!userDoc.estado || userDoc.estado.trim() === '') {
            return 'pendiente';
          }
          
          // Normalizar el estado a los valores estándar
          const estadoOriginal = userDoc.estado.toLowerCase().trim();
          switch (estadoOriginal) {
            case 'aprobado':
            case 'cumplido':
              return 'aprobado';
            case 'rechazado':
              return 'rechazado';
            case 'vencido':
            case 'expirado':
              return 'vencido';
            case 'pendiente':
            case 'sin revisar':
              return 'pendiente';
            case 'sin cargar':
              return 'sin cargar';
            default:
              console.warn(`Estado no reconocido: ${estadoOriginal}, usando 'pendiente' como fallback`);
              return 'pendiente';
          }
        };
        
        // Obtener estado consolidado del grupo de dosis
        const doseGroupStatus = getDoseGroupStatus(
          { 
            baseDoc: doc.baseDoc, 
            totalDoses: doc.totalDoses 
          }, 
          doc.userDocs, 
          getDocumentStatus
        );
        
        return {
          ...doc,
          estado: doseGroupStatus.consolidatedStatus,
          doseStatuses: doseGroupStatus.doseStatuses,
          progress: doseGroupStatus.progress,
          completedDoses: doseGroupStatus.completedDoses,
          uploadedDoses: doseGroupStatus.uploadedDoses,
          fechaCargue: doseGroupStatus.latestUploadDate,
          fechaExpedicion: doseGroupStatus.latestExpeditionDate,
          fechaVencimiento: doseGroupStatus.latestExpirationDate,
          fechaRevision: doseGroupStatus.latestReviewDate
        };
      } else {
        // Para documentos normales - usar el estado ya procesado por transformUserForManager
        return doc;
      }
    });

    // Calcular estadísticas de documentos (considerando dosis individuales)
    const stats = {
      aprobados: 0,
      pendientes: 0,
      rechazados: 0,
      vencidos: 0,
      sinCargar: 0
    };
    
    processedDocuments.forEach(doc => {
      if (doc.isDoseGroup) {
        // Para grupos de dosis, contar cada dosis individual
        doc.doseStatuses?.forEach(doseStatus => {
          switch (doseStatus.status?.toLowerCase()) {
            case 'aprobado':
              stats.aprobados++;
              break;
            case 'pendiente':
              stats.pendientes++;
              break;
            case 'rechazado':
              stats.rechazados++;
              break;
            case 'vencido':
              stats.vencidos++;
              break;
            case 'sin cargar':
            default:
              stats.sinCargar++;
              break;
          }
        });
      } else {
        // Para documentos normales
        switch (doc.estado?.toLowerCase()) {
          case 'aprobado':
            stats.aprobados++;
            break;
          case 'pendiente':
            stats.pendientes++;
            break;
          case 'rechazado':
            stats.rechazados++;
            break;
          case 'vencido':
            stats.vencidos++;
            break;
          case 'sin cargar':
          default:
            stats.sinCargar++;
            break;
        }
      }
    });

    return { processedDocuments, stats };
  };

  // Cargar datos del estudiante
  const loadStudentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Cargando datos del estudiante: ${studentId}`);
      
      // Usar el nuevo endpoint consolidado
      const userProfileResponse = await getUserProfile(studentId);
      
      console.log('Respuesta del perfil consolidado:', userProfileResponse);
      
      if (!userProfileResponse.data || !userProfileResponse.data.user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Transformar datos al formato esperado por el componente
      const transformedStudent = transformUserProfileForComponents(userProfileResponse);
      
      // Procesar documentos y calcular estadísticas
      const { processedDocuments, stats } = processDocuments(transformedStudent);
      
      console.log('Estudiante transformado:', { ...transformedStudent, documentos: processedDocuments });
      setStudent({ ...transformedStudent, documentos: processedDocuments });
      setDocumentStats(stats);
      
    } catch (error) {
      console.error('Error cargando datos del estudiante:', error);
      
      // Manejo específico para errores de rate limiting
      if (error.response?.status === 429 || 
          (error.response?.status === 500 && error.message?.includes('Quota exceeded'))) {
        setModoSaturado(true);
        setError('El sistema está experimentando una alta demanda. Los datos se cargarán automáticamente en unos segundos...');
        
        // Reintentar después de 10 segundos con mensaje específico
        setTimeout(() => {
          console.log('Reintentando carga automática después de rate limit...');
          loadStudentData();
        }, 10000);
      } else if (error.message && error.message.includes('no encontrado')) {
        setError(error.message || 'Usuario no encontrado');
        // Si es un error 404, redirigir al dashboard después de un momento
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(error.message || 'Error al cargar los datos del estudiante');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para recargar datos
  const handleReload = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Limpiar cache específico del usuario antes de recargar
      clearCache(`user-${studentId}`);
      clearCache(`user-docs-${studentId}`);
      clearUserProfileCache(`user-profile-${studentId}`);
      
      // Usar el nuevo endpoint consolidado
      const userProfileResponse = await getUserProfile(studentId);
      
      console.log('Respuesta del perfil consolidado (reload):', userProfileResponse);
      
      if (!userProfileResponse.data || !userProfileResponse.data.user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Transformar datos al formato esperado por el componente
      const transformedStudent = transformUserProfileForComponents(userProfileResponse);
      
      // Procesar documentos y calcular estadísticas
      const { processedDocuments, stats } = processDocuments(transformedStudent);
      
      setStudent({ ...transformedStudent, documentos: processedDocuments });
      setDocumentStats(stats);
      
    } catch (error) {
      console.error('Error recargando datos:', error);
      
      // Manejo específico para errores de rate limiting en reload
      if (error.response?.status === 429 || 
          (error.response?.status === 500 && error.message?.includes('Quota exceeded'))) {
        setModoSaturado(true);
        setError('Sistema con alta demanda, reintentando automáticamente...');
        
        // Reintentar después de 8 segundos
        setTimeout(() => {
          console.log('Reintentando reload automático después de rate limit...');
          handleReload();
        }, 8000);
      } else {
        setError(error.message || 'Error al recargar los datos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId, navigate, setModoSaturado]);

  // Efecto para filtrar documentos
  useEffect(() => {
    if (!student?.documentos) {
      setFilteredDocuments([]);
      return;
    }

    let filtered = student.documentos;

    // Filtrar por estado de documentación
    if (statusFilter === 'Aprobados') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'aprobado');
    } else if (statusFilter === 'Pendientes') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'pendiente');
    } else if (statusFilter === 'Rechazados') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'rechazado');
    } else if (statusFilter === 'Vencidos') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'vencido');
    } else if (statusFilter === 'Sin cargar') {
      filtered = filtered.filter(doc => doc.estado?.toLowerCase() === 'sin cargar' || !doc.estado);
    }

    // Filtrar por término de búsqueda
    if (searchTerm !== '') {
      filtered = filtered.filter(doc => 
        doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.comentarios && doc.comentarios.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredDocuments(filtered);
  }, [student, statusFilter, searchTerm]);

  // Handlers para modales
  const handleOpenModal = (document) => {
    setSelectedDocument(document);
  };

  const handleCloseModal = (updatedDoc = null) => {
    if (updatedDoc) {
      // Limpiar cache específico antes de recargar datos
      console.log('Documento actualizado, limpiando cache y recargando datos...');
      clearCache(`user-${studentId}`);
      clearCache(`user-docs-${studentId}`);
      clearUserProfileCache(`user-profile-${studentId}`);
      handleReload();
    }
    
    setSelectedDocument(null);
  };

  const handleOpenUploadModal = (document) => {
    console.log('DEBUG - Opening upload modal with:', { document, student });
    
    // Validar que tengamos la información necesaria
    if (!student || (!student.id && !student.id_usuario)) {
      console.error('Error: Información del estudiante incompleta:', student);
      setError('Error: No se pudo obtener la información del estudiante');
      return;
    }
    
    if (!document || !document.id) {
      console.error('Error: Información del documento incompleta:', document);
      setError('Error: No se pudo obtener la información del documento');
      return;
    }
    
    setSelectedDocumentForUpload(document);
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setSelectedDocumentForUpload(null);
    setUploadModalOpen(false);
  };

  const handleDocumentUploaded = async () => {
    // Limpiar cache específico antes de recargar datos
    console.log('Documento cargado por admin, limpiando cache y recargando datos...');
    clearCache(`user-${studentId}`);
    clearCache(`user-docs-${studentId}`);
    clearUserProfileCache(`user-profile-${studentId}`);
    await handleReload();
  };

  // Funciones de utilidad
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getRowBackground = (status) => {
    switch (status?.toLowerCase()) {
      case 'aprobado':
        return 'success.light';
      case 'rechazado':
        return 'error.light';
      case 'vencido':
        return 'warning.light';
      case 'pendiente':
        return 'info.light';
      case 'no aplica':
        return 'grey.100';
      case 'sin cargar':
      default:
        return 'inherit';
    }
  };

  const getButtonColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'aprobado':
        return 'success';
      case 'rechazado':
        return 'error';
      case 'vencido':
        return 'warning';
      case 'pendiente':
        return 'info';
      case 'no aplica':
        return 'default';
      case 'sin cargar':
      default:
        return 'default';
    }
  };

  const handleStatusFilterClick = (status) => {
    if (statusFilter === status) {
      setStatusFilter('Todos');
    } else {
      setStatusFilter(status);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('Todos');
    setSearchTerm('');
  };

  return {
    // Estados
    loading,
    student,
    selectedDocument,
    selectedDocumentForUpload,
    uploadModalOpen,
    error,
    documentStats,
    statusFilter,
    searchTerm,
    filteredDocuments,
    modoSaturado,
    
    // Funciones
    loadStudentData,
    handleReload,
    handleOpenModal,
    handleCloseModal,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleDocumentUploaded,
    formatDate,
    getRowBackground,
    getButtonColor,
    handleStatusFilterClick,
    clearAllFilters,
    setSearchTerm,
    setStatusFilter
  };
}; 