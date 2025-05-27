import api from './api';

/**
 * Obtiene todos los programas académicos desde Google Sheets
 * @returns {Promise<Array>} Lista de programas académicos
 */
export const getAllPrograms = async () => {
  try {
    console.log('[programsService] Fetching programs from API...');
    const response = await api.get('/api/programs');
    
    if (response.data.success) {
      console.log('[programsService] Programs fetched successfully:', response.data.data.length);
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Error al obtener programas');
    }
  } catch (error) {
    console.error('[programsService] Error fetching programs:', error);
    
    // Si hay un error, devolver una lista básica como fallback
    const fallbackPrograms = [
      { value: 'MEDICINA', label: 'Medicina' },
      { value: 'ENFERMERIA', label: 'Enfermería' },
      { value: 'ODONTOLOGIA', label: 'Odontología' },
      { value: 'FISIOTERAPIA', label: 'Fisioterapia' },
      { value: 'FONOAUDIOLOGIA', label: 'Fonoaudiología' },
      { value: 'TERAPIA_OCUPACIONAL', label: 'Terapia Ocupacional' },
      { value: 'BACTERIOLOGIA', label: 'Bacteriología' }
    ];
    
    console.warn('[programsService] Using fallback programs list');
    return fallbackPrograms;
  }
}; 