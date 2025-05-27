/**
 * Agrupa documentos que tienen múltiples dosis
 * @param {Array} documentTypes - Lista de tipos de documentos
 * @returns {Array} - Lista de documentos agrupados por tipo base
 */
export const groupDocumentsByDose = (documentTypes) => {
  if (!Array.isArray(documentTypes)) return [];

  const groupedDocs = new Map();
  const standaloneDocuments = [];

  documentTypes.forEach(doc => {
    const dosis = parseInt(doc.dosis);
    // Si el documento tiene múltiples dosis, agruparlo
    if (!isNaN(dosis) && dosis > 1) {
      const baseName = doc.nombre_doc;
      
      if (!groupedDocs.has(doc.id_doc)) {
        groupedDocs.set(doc.id_doc, {
          id_doc: doc.id_doc,
          name: doc.nombre_doc,
          baseDoc: doc,
          isDoseGroup: true,
          totalDoses: dosis
        });
      }
    } else {
      // Documento que no tiene dosis múltiples
      standaloneDocuments.push({
        ...doc,
        isDoseGroup: false
      });
    }
  });

  // Convertir los grupos a array
  const groupedArray = Array.from(groupedDocs.values());

  // Combinar documentos agrupados y standalone
  return [...groupedArray, ...standaloneDocuments];
};

/**
 * Formatea el nombre base para mostrar
 * @param {string} baseName - Nombre base del documento
 * @returns {string} - Nombre formateado para mostrar
 */
const formatBaseName = (baseName) => {
  // Mapeo de nombres específicos
  const nameMap = {
    'Hep_A': 'Hepatitis A',
    'Hep': 'Hepatitis A',
    'Hep_B': 'Hepatitis B',
    'Tetano': 'Tétanos',
    'Var': 'Varicela',
    'COVID-19': 'COVID-19',
    'COVID': 'COVID-19'
  };
  
  // Buscar mapeo exacto primero
  if (nameMap[baseName]) {
    return nameMap[baseName];
  }
  
  // Buscar mapeo parcial
  for (const [key, value] of Object.entries(nameMap)) {
    if (baseName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Formateo por defecto: reemplazar guiones bajos con espacios y capitalizar
  return baseName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Obtiene el estado consolidado de un grupo de dosis
 * @param {Object} doseGroup - Grupo de dosis
 * @param {Array} userDocuments - Documentos del usuario
 * @param {Function} getDocumentStatus - Función para obtener estado
 * @returns {Object} - Estado consolidado y información de dosis
 */
export const getDoseGroupStatus = (doseGroup, userDocuments, getDocumentStatus) => {
  if (!doseGroup || !doseGroup.baseDoc || !Array.isArray(userDocuments)) {
    return {
      consolidatedStatus: 'sin cargar',
      completedDoses: 0,
      uploadedDoses: 0,
      totalDoses: doseGroup?.totalDoses || 0,
      doseStatuses: [],
      progress: '0/0',
      latestUploadDate: null,
      latestExpeditionDate: null,
      latestExpirationDate: null,
      latestReviewDate: null
    };
  }
  
  const totalDoses = doseGroup.totalDoses || parseInt(doseGroup.baseDoc.dosis) || 1;
  const isCovid = doseGroup.baseDoc?.nombre_doc?.toLowerCase().includes('covid');
  
  // Para COVID, obtener todas las dosis cargadas sin importar el número
  let doseStatuses = [];
  
  if (isCovid) {
    // Para COVID, mostrar todas las dosis realmente cargadas
    const covidDoses = userDocuments.filter(ud => ud.id_doc === doseGroup.baseDoc.id_doc);
    doseStatuses = covidDoses.map((userDoc, index) => {
      const status = getDocumentStatus(userDoc, doseGroup.baseDoc);
      return {
        doseNumber: userDoc.numero_dosis, // Para COVID puede ser texto
        status,
        userDoc,
        originalDoc: doseGroup.baseDoc
      };
    });
  } else {
    // Para documentos regulares, verificar cada dosis numerada
    doseStatuses = Array.from(
      { length: totalDoses },
      (_, i) => i + 1
    ).map(doseNumber => {
      const userDoc = userDocuments.find(ud => 
        ud.id_doc === doseGroup.baseDoc.id_doc && 
        parseInt(ud.numero_dosis) === doseNumber
      );
      const status = getDocumentStatus(userDoc, doseGroup.baseDoc);
      
      return {
        doseNumber,
        status,
        userDoc,
        originalDoc: doseGroup.baseDoc
      };
    });
  }

  // Determinar estado consolidado
  const completedDoses = doseStatuses.filter(d => d.status === 'Aprobado' || d.status === 'aprobado' || d.status === 'cumplido').length;
  const uploadedDoses = doseStatuses.filter(d => d.userDoc && d.status !== 'Sin cargar').length; // Dosis que han sido cargadas
  const pendingDoses = doseStatuses.filter(d => d.status === 'Pendiente' || d.status === 'pendiente' || d.status === 'sin revisar').length;
  const rejectedDoses = doseStatuses.filter(d => d.status === 'Rechazado' || d.status === 'rechazado').length;
  const totalDosesCount = isCovid ? Math.max(doseStatuses.length, totalDoses) : totalDoses;

  // Extraer fechas más recientes de las dosis cargadas
  const uploadedDoseStatuses = doseStatuses.filter(d => d.userDoc);
  
  let latestUploadDate = null;
  let latestExpeditionDate = null;
  let latestExpirationDate = null;
  let latestReviewDate = null;

  if (uploadedDoseStatuses.length > 0) {
    // Encontrar la fecha de carga más reciente
    const uploadDates = uploadedDoseStatuses
      .map(d => d.userDoc.fecha_cargue)
      .filter(date => date)
      .map(date => new Date(date))
      .filter(date => !isNaN(date.getTime()));
    
    if (uploadDates.length > 0) {
      latestUploadDate = new Date(Math.max(...uploadDates)).toISOString().split('T')[0];
    }

    // Encontrar la fecha de expedición más reciente
    const expeditionDates = uploadedDoseStatuses
      .map(d => d.userDoc.fecha_expedicion)
      .filter(date => date)
      .map(date => new Date(date))
      .filter(date => !isNaN(date.getTime()));
    
    if (expeditionDates.length > 0) {
      latestExpeditionDate = new Date(Math.max(...expeditionDates)).toISOString().split('T')[0];
    }

    // Encontrar la fecha de vencimiento más reciente
    const expirationDates = uploadedDoseStatuses
      .map(d => d.userDoc.fecha_vencimiento)
      .filter(date => date)
      .map(date => new Date(date))
      .filter(date => !isNaN(date.getTime()));
    
    if (expirationDates.length > 0) {
      latestExpirationDate = new Date(Math.max(...expirationDates)).toISOString().split('T')[0];
    }

    // Encontrar la fecha de revisión más reciente
    const reviewDates = uploadedDoseStatuses
      .map(d => d.userDoc.fecha_revision)
      .filter(date => date)
      .map(date => new Date(date))
      .filter(date => !isNaN(date.getTime()));
    
    if (reviewDates.length > 0) {
      latestReviewDate = new Date(Math.max(...reviewDates)).toISOString().split('T')[0];
    }
  }

  let consolidatedStatus;
  if (completedDoses === totalDosesCount) {
    consolidatedStatus = 'aprobado';
  } else if (rejectedDoses > 0) {
    consolidatedStatus = 'rechazado';
  } else if (pendingDoses > 0) {
    consolidatedStatus = 'pendiente';
  } else if (uploadedDoses > 0) {
    consolidatedStatus = 'pendiente'; // Si hay dosis cargadas pero no revisadas
  } else {
    consolidatedStatus = 'sin cargar';
  }

  return {
    consolidatedStatus,
    completedDoses,
    uploadedDoses,
    totalDoses: totalDosesCount,
    doseStatuses,
    progress: isCovid ? `${uploadedDoses} dosis` : `${uploadedDoses}/${totalDosesCount}`,
    latestUploadDate,
    latestExpeditionDate,
    latestExpirationDate,
    latestReviewDate
  };
};

/**
 * Verifica si un documento es parte de un grupo de dosis
 * @param {Object} document - Documento a verificar
 * @returns {boolean} - true si es parte de un grupo de dosis
 */
export const isDoseDocument = (document) => {
  const dosis = parseInt(document?.dosis);
  return !isNaN(dosis) && dosis > 1;
}; 