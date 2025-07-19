

import axios from 'axios';

const API_URL = 'https://localhost:8080';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Obtiene todas las anotaciones para una versión de documento específica.
 * @param {string|number} versionId - El ID de la versión del documento.
 * @returns {Promise<Array>} - Una promesa que resuelve a un array de anotaciones.
 */
const getAnnotationsByVersion = async (versionId) => {
  try {
    const response = await apiClient.get(`/api/annotations/version/${versionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching annotations for version ${versionId}:`, error.response?.data || error.message);
    throw new Error('No se pudieron cargar las anotaciones.');
  }
};

/**
 * Crea una nueva anotación.
 * @param {string|number} versionId - El ID de la versión del documento.
 * @param {object} annotationData - Los datos de la nueva anotación.
 * @returns {Promise<object>} - Una promesa que resuelve al objeto de la anotación creada.
 */
const createAnnotation = async (versionId, annotationData) => {
  try {
    
    const response = await apiClient.post(`/api/annotations/version/${versionId}`, annotationData);
    return response.data;
  } catch (error) {
    console.error('Error creating annotation:', error.response?.data || error.message);
    throw new Error('No se pudo crear la anotación.');
  }
};

/**
 * Actualiza una anotación existente.
 * @param {string|number} annotationId - El ID de la anotación a actualizar.
 * @param {object} updateData - Los datos a actualizar.
 * @returns {Promise<object>} - Una promesa que resuelve al objeto de la anotación actualizada.
 */
const updateAnnotation = async (annotationId, updateData) => {
  try {
    const response = await apiClient.put(`/api/annotations/${annotationId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating annotation ${annotationId}:`, error.response?.data || error.message);
    throw new Error('No se pudo actualizar la anotación.');
  }
};

/**
 * Elimina una anotación.
 * @param {string|number} annotationId - El ID de la anotación a eliminar.
 * @returns {Promise<void>}
 */
const deleteAnnotation = async (annotationId) => {
  try {
    await apiClient.delete(`/api/annotations/delete/${annotationId}`);
  } catch (error) {
    console.error(`Error deleting annotation ${annotationId}:`, error.response?.data || error.message);
    throw new Error('No se pudo eliminar la anotación.');
  }
};

const annotationService = {
  getAnnotationsByVersion,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
};

export default annotationService;