// src/context/DocumentContext.jsx (Corregido)
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';

// Crear el contexto
const DocumentContext = createContext();

// Hook personalizado para usar el contexto
export const useDocuments = () => useContext(DocumentContext);

// API Base URL
const BASE_URL = 'https://fsalud-server-saludunivalles-projects.vercel.app';

// Proveedor del contexto
export const DocumentProvider = ({ children }) => {
  const { user, isLogin } = useUser();
  const [documentTypes, setDocumentTypes] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [userDocuments, setUserDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar documentos cuando el usuario inicia sesión
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isLogin || !user) return;
      
      setLoading(true);
      try {
        // Obtener tipos de documentos DESDE EL BACKEND
        try {
          // Usar la nueva ruta de la API de documentos
          const typesResponse = await axios.get(`${BASE_URL}/api/documentos/tipos`); 
          // Verifica que la respuesta del backend tenga la propiedad 'data' y sea un array
          setDocumentTypes(Array.isArray(typesResponse.data?.data) ? typesResponse.data.data : []); 
        } catch (err) {
          console.error('Error al obtener tipos de documentos desde el backend:', err);
          setDocumentTypes([]); // Asegura array vacío en caso de error
        }
        
        // Inicializar solicitudes activas como array vacío por ahora
        setActiveRequests([]);
        
        // Obtener documentos del usuario
        try {
          const docsResponse = await axios.get(
            `${BASE_URL}/api/documentos/usuario/${user.id}` // Usar la nueva ruta de la API
          );
          
          // Aplica la misma lógica aquí para userDocuments
          let userDocsData = [];
          if (Array.isArray(docsResponse.data)) {
            userDocsData = docsResponse.data;
          } else if (docsResponse.data && Array.isArray(docsResponse.data.data)) {
            userDocsData = docsResponse.data.data;
          } else {
            console.warn("Formato inesperado en la respuesta de getUserDocuments:", docsResponse.data);
            userDocsData = [];
          }
          
          setUserDocuments(userDocsData);
        } catch (err) {
          console.error('Error al obtener documentos del usuario:', err);
          setUserDocuments([]); // Asegura que sea un array en caso de error
        }
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Error al cargar documentos');
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user, isLogin]);

  // Función para actualizar documentos
  const refreshDocuments = async () => {
    if (!isLogin || !user) return;
    
    setLoading(true);
    try {
      // Actualizar tipos de documentos
      try {
        const typesResponse = await axios.get(`${BASE_URL}/api/documentos/tipos`);
        // Verificar formato de respuesta
        if (typesResponse.data && Array.isArray(typesResponse.data.data)) {
          setDocumentTypes(typesResponse.data.data);
        } else if (Array.isArray(typesResponse.data)) {
          setDocumentTypes(typesResponse.data);
        } else {
          console.warn("Formato inesperado en la respuesta de tipos de documentos:", typesResponse.data);
        }
      } catch (err) {
        console.error('Error al actualizar tipos de documentos:', err);
      }
      
      // Mantener solicitudes activas como array vacío por ahora
      setActiveRequests([]);
      
      // Actualizar documentos del usuario
      try {
        const docsResponse = await axios.get(
          `${BASE_URL}/api/documentos/usuario/${user.id}`
        );
        
        // Verificar formato de respuesta
        let userDocsData = [];
        if (Array.isArray(docsResponse.data)) {
          userDocsData = docsResponse.data;
        } else if (docsResponse.data && Array.isArray(docsResponse.data.data)) {
          userDocsData = docsResponse.data.data;
        } else {
          console.warn("Formato inesperado en la respuesta de getUserDocuments:", docsResponse.data);
          userDocsData = [];
        }
        
        setUserDocuments(userDocsData);
        
        return userDocsData; // Retornar los datos para usar en otros componentes
      } catch (err) {
        console.error('Error al actualizar documentos del usuario:', err);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing documents:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si un documento está vencido
  const isDocumentExpired = (document, documentType) => {
    if (!document || !documentType || documentType.vence !== 'si') {
      return false;
    }
    
    if (!document.fecha_vencimiento) {
      return false;
    }
    
    const expirationDate = new Date(document.fecha_vencimiento);
    const today = new Date();
    
    return expirationDate < today;
  };

  // Función para obtener el estado de un documento
  const getDocumentStatus = (document, documentType) => {
    if (!document) {
      return 'Sin cargar';
    }
    
    let status = document.estado || 'Pendiente';
    
    // Si está aprobado pero vencido, cambiar estado
    if ((status.toLowerCase() === 'cumplido' || status.toLowerCase() === 'aprobado') && 
        isDocumentExpired(document, documentType)) {
      return 'Vencido';
    }
    
    // Mapear estados del backend a frontend
    if (status.toLowerCase() === 'cumplido') {
      return 'Aprobado';
    } else if (status.toLowerCase() === 'sin revisar') {
      return 'Pendiente';
    }
    
    return status;
  };

  // Valores disponibles en el contexto
  const value = {
    documentTypes,
    activeRequests,
    completedRequests,
    userDocuments,
    setUserDocuments, // Exposing setter for direct updates
    loading,
    error,
    refreshDocuments,
    isDocumentExpired,
    getDocumentStatus
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export default DocumentContext;