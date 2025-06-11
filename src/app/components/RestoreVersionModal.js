
'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DocumentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const FolderIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const Loader = ({ text = "Cargando..." }) => (
  <div className="flex items-center justify-center p-4">
    <div className="flex flex-col items-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  </div>
);

export default function RestoreVersionModal({ version, projectId, onRestore, onCancel }) {
  const [originalDocument, setOriginalDocument] = useState(null);
  const [originalDocumentPath, setOriginalDocumentPath] = useState('');
  const [documentExists, setDocumentExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  
  const findDocumentInHierarchy = useCallback((folders, documentId) => {
    for (const folder of folders) {
      
      if (folder.documents) {
        const document = folder.documents.find(doc => 
          (doc.iddocument || doc.id) === documentId
        );
        if (document) {
          return {
            document,
            path: folder.name,
            folderId: folder.idfolder || folder.id
          };
        }
      }
      
      
      if (folder.childFolders && folder.childFolders.length > 0) {
        const result = findDocumentInHierarchy(folder.childFolders, documentId);
        if (result) {
          return {
            ...result,
            path: `${folder.name} > ${result.path}`
          };
        }
      }
    }
    return null;
  }, []);

  const checkDocumentExists = useCallback(async () => {
    if (!projectId || !version.documentId) return;
    
    setLoading(true);
    setError('');
    
    try {
      
      const response = await axios.get(
        `${apiUrl}/api/projects/${projectId}/folders`,
        { withCredentials: true }
      );
      
      if (Array.isArray(response.data)) {
        
        const result = findDocumentInHierarchy(response.data, version.documentId);
        
        if (result) {
          setOriginalDocument(result.document);
          setOriginalDocumentPath(result.path);
          setDocumentExists(true);
        } else {
          setDocumentExists(false);
          setOriginalDocument(null);
          setOriginalDocumentPath('');
        }
      } else {
        setError("Formato de datos inesperado al cargar la jerarquía del proyecto.");
      }
    } catch (err) {
      console.error("Error checking document existence:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Error al verificar la existencia del documento.");
    } finally {
      setLoading(false);
    }
  }, [projectId, version.documentId, apiUrl, findDocumentInHierarchy]);

  useEffect(() => {
    checkDocumentExists();
  }, [checkDocumentExists]);

  const handleRestore = () => {
    if (!documentExists || !originalDocument) {
      alert('No se puede restaurar: el documento original no existe o no está activo.');
      return;
    }
    
    
    onRestore(version, originalDocument.iddocument || originalDocument.id);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
              <span className="text-lg font-medium text-purple-700">v{version.versionNumber}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Restaurar Versión {version.versionNumber}
              </h3>
              <p className="text-sm text-gray-600">
                Verificando disponibilidad del documento original
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        
        <div className="p-6 space-y-6">
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Información de la Versión</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {version.comments && (
                <p><span className="font-medium">Comentarios:</span> {version.comments}</p>
              )}
              {version.uploadedBy && (
                <p><span className="font-medium">Subida por:</span> {version.uploadedBy.names} {version.uploadedBy.lastnames}</p>
              )}
              {version.uploadedAt && (
                <p><span className="font-medium">Fecha de subida:</span> {new Date(version.uploadedAt).toLocaleString('es-ES')}</p>
              )}
              {version.document && (
                <p><span className="font-medium">Documento original:</span> {version.document.name}</p>
              )}
            </div>
          </div>

          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <DocumentIcon className="inline mr-2 text-blue-600" />
              Estado del Documento Original
            </label>
            
            {loading ? (
              <Loader text="Verificando documento..." />
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <button
                  onClick={checkDocumentExists}
                  className="text-sm text-red-700 hover:text-red-800 underline"
                >
                  Reintentar verificación
                </button>
              </div>
            ) : documentExists && originalDocument ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-800">
                      Documento disponible para restauración
                    </h4>
                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <p><span className="font-medium">Nombre:</span> {originalDocument.name}</p>
                      {originalDocument.description && (
                        <p><span className="font-medium">Descripción:</span> {originalDocument.description}</p>
                      )}
                      <p><span className="font-medium">Ubicación:</span> {originalDocumentPath}</p>
                      <p><span className="font-medium">Creado por:</span> {originalDocument.createdBy?.names} {originalDocument.createdBy?.lastnames}</p>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">ℹ️ Información:</span> La versión se restaurará únicamente en este documento original. 
                        No es posible restaurar versiones en documentos diferentes al original.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800">
                      Documento no disponible
                    </h4>
                    <div className="mt-2 space-y-2 text-sm text-red-700">
                      <p>
                        El documento original "{version.document?.name || 'Sin nombre'}" no está disponible 
                        en la jerarquía activa del proyecto.
                      </p>
                      <p className="font-medium">
                        Posibles causas:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>El documento ha sido eliminado</li>
                        <li>El documento está en la papelera de reciclaje</li>
                        <li>La carpeta que contiene el documento ha sido eliminada</li>
                        <li>No tiene permisos para acceder al documento</li>
                      </ul>
                      <p className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                        <span className="font-medium">💡 Sugerencia:</span> Para restaurar esta versión, 
                        primero debe restaurar el documento original desde la papelera de reciclaje.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleRestore}
            disabled={!documentExists || !originalDocument || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!documentExists ? "El documento original no está disponible" : "Restaurar versión en documento original"}
          >
            {documentExists ? 'Restaurar Versión' : 'No Disponible'}
          </button>
        </div>
      </div>
    </div>
  );
}
