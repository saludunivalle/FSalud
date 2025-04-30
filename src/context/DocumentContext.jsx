// src/context/DocumentContext.jsx (CORREGIDO)
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
        // Obtener tipos de documentos
        try {
          const typesResponse = await axios.get(`${BASE_URL}/getDocumentos`);
          setDocumentTypes(typesResponse.data || []);
        } catch (err) {
          console.error('Error al obtener tipos de documentos:', err);
          setDocumentTypes([]);
        }
        
        // Obtener solicitudes activas
        try {
          const activeResponse = await axios.get(
            `${BASE_URL}/getActiveRequests`,
            { params: { userId: user.id } }
          );
          
          // Procesar y guardar las solicitudes activas
          const requests = activeResponse.data;
          const requestsWithStages = requests.map((request) => ({
            ...request,
            etapa_actual: Number(request.formulario) || 0,
          }));
          
          setActiveRequests(requestsWithStages);
        } catch (err) {
          if (err.response?.status === 404) {
            setActiveRequests([]);
          } else {
            console.error('Error al obtener solicitudes activas:', err);
          }
        }
        
        // Obtener documentos del usuario
        try {
          const docsResponse = await axios.get(
            `${BASE_URL}/getUserDocuments`,
            { params: { userId: user.id } }
          );
          
          setUserDocuments(docsResponse.data || []);
        } catch (err) {
          console.error('Error al obtener documentos del usuario:', err);
          setUserDocuments([]);
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
        const typesResponse = await axios.get(`${BASE_URL}/getDocumentos`);
        setDocumentTypes(typesResponse.data || []);
      } catch (err) {
        console.error('Error al actualizar tipos de documentos:', err);
      }
      
      // Actualizar solicitudes activas
      try {
        const activeResponse = await axios.get(
          `${BASE_URL}/getActiveRequests`,
          { params: { userId: user.id } }
        );
        
        const requests = activeResponse.data;
        const requestsWithStages = requests.map((request) => ({
          ...request,
          etapa_actual: Number(request.formulario) || 0,
        }));
        
        setActiveRequests(requestsWithStages);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error al actualizar solicitudes activas:', err);
        }
      }
      
      // Actualizar documentos del usuario
      try {
        const docsResponse = await axios.get(
          `${BASE_URL}/getUserDocuments`,
          { params: { userId: user.id } }
        );
        
        setUserDocuments(docsResponse.data || []);
      } catch (err) {
        console.error('Error al actualizar documentos del usuario:', err);
      }
    } catch (error) {
      console.error('Error refreshing documents:', error);
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