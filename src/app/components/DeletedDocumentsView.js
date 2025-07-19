
'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RestoreDocumentModal from './RestoreDocumentModal';

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ArrowPathIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const DocumentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const FolderIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M3.509 5.743A2 2 0 015.33 4.001H8.532a2 2 0 011.774 1.041l.46 1.004a1 1 0 00.887.52h4.838a2 2 0 011.992 1.829l-.011.117V15a2 2 0 01-2 2H5a2 2 0 01-2-2V7.432l.509-1.689z" />
  </svg>
);

const FolderOpenIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const Loader = ({ text = "Cargando..." }) => (
  <div className="flex items-center justify-center p-4 text-gray-900"> 
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="text-sm">{text}</p>
    </div>
  </div>
);

export default function DeletedDocumentsView({ projectId, onDocumentRestored }) {
  const [deletedDocuments, setDeletedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permanentlyDeletingDocuments, setPermanentlyDeletingDocuments] = useState(new Set());
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedDocumentForRestore, setSelectedDocumentForRestore] = useState(null);
  const apiUrl = 'https://localhost:8080';

  const fetchDeletedDocuments = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(
        `${apiUrl}/api/documents/project/${projectId}/deleted`, 
        { withCredentials: true }
      );
      
      if (Array.isArray(response.data)) {
        console.log("Deleted documents data structure:", response.data);
        
        const normalizedDocuments = response.data.map(document => ({
          id: document.iddocument || document.id,
          name: document.name,
          description: document.description,
          deletedAt: document.deletedAt,
          deletedBy: document.deletedBy,
          parentFolderId: document.parentFolderId,
          parentFolderName: document.parentFolderName,
          folderPath: document.folderPath,
          ...document
        }));
        
        setDeletedDocuments(normalizedDocuments);
      } else {
        setDeletedDocuments([]);
        setError("Formato de datos inesperado.");
      }
    } catch (err) {
      console.error("Error fetching deleted documents:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Error al cargar documentos eliminados.");
      setDeletedDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, apiUrl]);

  useEffect(() => {
    fetchDeletedDocuments();
  }, [fetchDeletedDocuments]);

  const handleOpenRestoreModal = (document) => {
    setSelectedDocumentForRestore(document);
    setRestoreModalOpen(true);
  };

  const handleCloseRestoreModal = () => {
    setRestoreModalOpen(false);
    setSelectedDocumentForRestore(null);
  };

  const handleRestoreSuccess = (document) => {
    
    setDeletedDocuments(prev => prev.filter(d => (d.id || d.iddocument) !== (document.id || document.iddocument)));
    
    
    if (onDocumentRestored) {
      onDocumentRestored(document);
    }
    
    
    handleCloseRestoreModal();
  };

  const handlePermanentDelete = async (document) => {
    const documentId = document.id || document.iddocument;
    
    if (!documentId) {
      console.error("No document ID found:", document);
      alert("❌ Error: ID de documento no válido.");
      return;
    }
    
    const confirmMessage = `⚠️ ADVERTENCIA: Eliminación Permanente\n\n¿Estás seguro de que quieres eliminar PERMANENTEMENTE el documento "${document.name}"?\n\nEsta acción NO se puede deshacer y se perderán todos los datos del documento y sus versiones.`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setPermanentlyDeletingDocuments(prev => new Set([...prev, documentId]));
    
    try {
      
      await axios.delete(
        `${apiUrl}/api/documents/${documentId}/permanent`,
        { withCredentials: true }
      );
      
      setDeletedDocuments(prev => prev.filter(d => (d.id || d.iddocument) !== documentId));
      alert(`✅ Documento "${document.name}" eliminado permanentemente.`);
      
    } catch (err) {
      console.error("Error permanently deleting document:", err);
      handlePermanentDeleteError(err, document);
    } finally {
      setPermanentlyDeletingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handlePermanentDeleteError = (err, document) => {
    const errorMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data || "Error al eliminar permanentemente el documento.";
    
    
    if (err.response?.status === 404 && errorMessage.includes("Not Found")) {
      alert(`ℹ️ Funcionalidad no disponible: La eliminación permanente aún no está implementada en el servidor.`);
      return;
    }
    
    
    if (err.response?.status === 404 || errorMessage.includes("no encontrado") || errorMessage.includes("not found")) {
      alert(`❌ Error: El documento "${document.name}" no fue encontrado.`);
      
      setDeletedDocuments(prev => prev.filter(d => (d.id || d.iddocument) !== (document.id || document.iddocument)));
      return;
    }
    
    
    if (err.response?.status === 403 || errorMessage.includes("permisos") || errorMessage.includes("permission")) {
      alert(`❌ Error de permisos: No tiene autorización para eliminar permanentemente el documento "${document.name}".`);
      return;
    }
    
    
    alert(`❌ Error al eliminar permanentemente el documento "${document.name}": ${errorMessage}`);
  };

  if (loading) {
    return <Loader text="Cargando documentos eliminados..." />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-100 rounded-md border border-red-200">
        <p className="font-medium">Error al cargar documentos eliminados</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDeletedDocuments}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (deletedDocuments.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-500">No hay documentos eliminados</p>
        <p className="text-sm text-gray-400 mt-2">
          Los documentos eliminados aparecerán aquí y podrán ser restaurados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start space-x-3">
          <DocumentIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">
              Documentos Eliminados ({deletedDocuments.length})
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Los documentos eliminados se muestran aquí. Puedes restaurarlos a una ubicación específica
              o eliminarlos permanentemente.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {deletedDocuments.map((document) => (
          <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <DocumentIcon className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {document.name}
                  </h4>
                  {document.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {document.description}
                    </p>
                  )}
                  
                  
                  {(document.parentFolderName || document.folderPath) && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                      <FolderOpenIcon className="h-3 w-3" />
                      <span>
                        Ubicación original: {document.folderPath || document.parentFolderName || 'Carpeta raíz'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {document.deletedAt && (
                      <span>
                        Eliminado: {new Date(document.deletedAt).toLocaleString('es-ES')}
                      </span>
                    )}
                    {document.deletedBy && (
                      <span>
                        Por: {document.deletedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleOpenRestoreModal(document)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
                  title="Restaurar documento"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Restaurar</span>
                </button>
              
              </div>
            </div>
          </div>
        ))}
      </div>

      
      {restoreModalOpen && selectedDocumentForRestore && (
        <RestoreDocumentModal
          isOpen={restoreModalOpen}
          onClose={handleCloseRestoreModal}
          document={selectedDocumentForRestore}
          projectId={projectId}
          onRestoreSuccess={handleRestoreSuccess}
        />
      )}
    </div>
  );
}
