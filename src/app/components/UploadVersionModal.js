
'use client';
import { useState } from 'react';
import axios from 'axios';

export default function UploadVersionModal({ isOpen, onClose, documentId, onVersionUploaded }) {
  const [versionNumber, setVersionNumber] = useState('');
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const apiUrl = 'https://localhost:8080';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 50MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!versionNumber || !file) {
      setError("Número de versión y archivo son obligatorios.");
      return;
    }
    if (!documentId) {
      setError("ID de documento no proporcionado.");
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      
      const formData = new FormData();
      formData.append('documentId', documentId.toString());
      formData.append('versionNumber', versionNumber);
      formData.append('file', file);
      if (comments.trim()) {
        formData.append('comments', comments.trim());
      }

      
      const response = await axios.post(`${apiUrl}/api/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        timeout: 300000, 
      });

      
      onVersionUploaded(response.data);
      
      
      setVersionNumber('');
      setFile(null);
      setComments('');
      
      
      onClose();
      
    } catch (err) {
      console.error("Error uploading version:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Tiempo de espera agotado. El archivo puede ser muy grande.');
      } else if (err.response?.status === 413) {
        setError('El archivo es demasiado grande. Máximo 50MB permitido.');
      } else if (err.response?.status === 400) {
        setError('Datos de entrada inválidos. Verifica que todos los campos sean correctos.');
      } else if (err.response?.status === 500) {
        setError('Error interno del servidor. Verifica la conexión con Dropbox.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || "Error al subir la versión.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setVersionNumber('');
    setFile(null);
    setComments('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Subir Nueva Versión</h3>
        
        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label htmlFor="versionNum" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Versión <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              id="versionNum" 
              value={versionNumber} 
              onChange={(e) => setVersionNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
              disabled={isSubmitting}
              min="1"
              placeholder="Ej: 1, 2, 3..." 
            />
          </div>

          
          <div className="mb-4">
            <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-1">
              Archivo <span className="text-red-500">*</span>
            </label>
            <input 
              type="file" 
              id="fileInput" 
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required 
              disabled={isSubmitting}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-1">
                Archivo seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Máximo 50MB. Tipos permitidos: PDF, Word, Excel, PowerPoint, imágenes, texto.
            </p>
          </div>

          
          <div className="mb-6">
            <label htmlFor="versionComments" className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios
            </label>
            <textarea 
              id="versionComments" 
              value={comments} 
              onChange={(e) => setComments(e.target.value)}
              rows="3" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              disabled={isSubmitting}
              placeholder="Describe los cambios en esta versión..."
            />
          </div>

          
          <p className="text-xs text-gray-500 mb-2">
            Para el documento ID: {documentId}
          </p>

          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3">
              <p className="text-sm">{error}</p>
            </div>
          )}

          
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => { 
                onClose(); 
                resetForm(); 
              }} 
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !file || !versionNumber}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </span>
              ) : (
                "Subir Versión"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}