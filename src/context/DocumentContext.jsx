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
        // Obtener tipos de documentos DESDE EL BACKEND
        try {
          // Llama directamente a la ruta del backend que ya lee de Sheets
          const typesResponse = await axios.get(`${BASE_URL}/getDocumentos`); 
          // Verifica que la respuesta del backend tenga la propiedad 'data' y sea un array
          setDocumentTypes(Array.isArray(typesResponse.data?.data) ? typesResponse.data.data : []); 
        } catch (err) {
          console.error('Error al obtener tipos de documentos desde el backend:', err);
          setDocumentTypes([]); // Asegura array vacío en caso de error
        }
        
        // Obtener solicitudes activas
        try {
          const activeResponse = await axios.get(
            `${BASE_URL}/getActiveRequests`, // Usa BASE_URL
            { params: { userId: user.id } }
          );
          
          // Accede al objeto de respuesta { success: true, data: [...] }
          const responseData = activeResponse.data; 
          // Verifica si la propiedad 'data' DENTRO del objeto es un array
          const requests = Array.isArray(responseData?.data) ? responseData.data : []; 
          
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
            setActiveRequests([]); // Asegura que sea un array en caso de otros errores
          }
        }
        
        // Obtener documentos del usuario
        try {
          const docsResponse = await axios.get(
            `${BASE_URL}/getUserDocuments`, // Usa BASE_URL
            { params: { userId: user.id } }
          );
          
          // Aplica la misma lógica aquí para userDocuments
          const userDocsData = docsResponse.data;
          // El backend devuelve { success: true, data: [...] }
          setUserDocuments(Array.isArray(userDocsData?.data) ? userDocsData.data : []); 
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