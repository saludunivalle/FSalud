// src/context/DocumentContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';

// Crear el contexto
const DocumentContext = createContext();

// Hook personalizado para usar el contexto
export const useDocuments = () => useContext(DocumentContext);

// Proveedor del contexto
export const DocumentProvider = ({ children }) => {
  const { user, isLogin } = useUser();
  const [documents, setDocuments] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar documentos cuando el usuario inicia sesión
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isLogin || !user) return;
      
      setLoading(true);
      try {
        // Ejemplo de cómo podrías obtener los documentos activos
        const activeResponse = await axios.get(
          'https://siac-extension-server.vercel.app/getActiveRequests',
          { params: { userId: user.id } }
        );
        
        // Procesar y guardar las solicitudes activas
        const requests = activeResponse.data;
        const requestsWithStages = requests.map((request) => ({
          ...request,
          etapa_actual: Number(request.formulario) || 0,
        }));
        
        setActiveRequests(requestsWithStages);
        setError(null);
      } catch (err) {
        if (err.response?.status === 404) {
          setActiveRequests([]);
        } else {
          setError(err.message || 'Error al cargar documentos');
          console.error('Error fetching documents:', err);
        }
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
      const activeResponse = await axios.get(
        'https://siac-extension-server.vercel.app/getActiveRequests',
        { params: { userId: user.id } }
      );
      
      const requests = activeResponse.data;
      const requestsWithStages = requests.map((request) => ({
        ...request,
        etapa_actual: Number(request.formulario) || 0,
      }));
      
      setActiveRequests(requestsWithStages);
    } catch (error) {
      console.error('Error refreshing documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Valores disponibles en el contexto
  const value = {
    documents,
    activeRequests,
    completedRequests,
    loading,
    error,
    refreshDocuments
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export default DocumentContext;