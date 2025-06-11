
'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RestoreVersionModal from './RestoreVersionModal';

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

const Loader = ({ text = "Cargando..." }) => (
  <div className="flex items-center justify-center p-4 text-gray-900"> 
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="text-sm">{text}</p>
    </div>
  </div>
);

export default function DeletedVersionsView({ projectId, documentId, onVersionRestored }) {
  const [deletedVersions, setDeletedVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoringVersions, setRestoringVersions] = useState(new Set());
  const [permanentlyDeletingVersions, setPermanentlyDeletingVersions] = useState(new Set());
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';
  const fetchDeletedVersions = useCallback(async () => {
    
    if (documentId) {
      return fetchDeletedVersionsForDocument();
    }
    
    
    if (!projectId) return;
    
    setLoading(true);
    setError('');
    
    try {      const response = await axios.get(
        `${apiUrl}/api/versions/project/${projectId}/deleted`, 
        { withCredentials: true }
      );
      
      if (Array.isArray(response.data)) {
        console.log("Deleted versions for project data structure:", response.data);
        
        const normalizedVersions = response.data.map(version => ({
          id: version.idversion || version.id,
          versionNumber: version.versionNumber,
          comments: version.comments,
          fileSize: version.fileSize,
          mimeType: version.mimeType,
          deletedAt: version.deletedAt,
          deletedBy: version.deletedBy,
          uploadedBy: version.uploadedBy,
          createdAt: version.createdAt,
          documentId: version.documentId || version.document?.id,
          documentName: version.document?.name || version.documentName,
          ...version
        }));
        
        setDeletedVersions(normalizedVersions);
      } else {
        setDeletedVersions([]);
        setError("Formato de datos inesperado.");
      }
    } catch (err) {
      console.error("Error fetching deleted versions for project:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Error al cargar versiones eliminadas del proyecto.");
      setDeletedVersions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, documentId, apiUrl]);

  const fetchDeletedVersionsForDocument = useCallback(async () => {
    if (!documentId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(
        `${apiUrl}/api/documentos/${documentId}/versions/deleted`, 
        { withCredentials: true }
      );      
      if (Array.isArray(response.data)) {
        console.log("Deleted versions data structure:", response.data);
        
        const normalizedVersions = response.data.map(version => ({
          id: version.idversion || version.id,
          versionNumber: version.versionNumber,
          comments: version.comments,
          fileSize: version.fileSize,
          mimeType: version.mimeType,
          deletedAt: version.deletedAt,
          deletedBy: version.deletedBy,
          uploadedBy: version.uploadedBy,
          createdAt: version.createdAt,
          documentId: version.documentId || documentId, 
          documentName: version.document?.name || version.documentName,
          ...version
        }));
        
        setDeletedVersions(normalizedVersions);
      } else {
        setDeletedVersions([]);
        setError("Formato de datos inesperado.");
      }
    } catch (err) {
      console.error("Error fetching deleted versions:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Error al cargar versiones eliminadas.");
      setDeletedVersions([]);
    } finally {
      setLoading(false);
    }
  }, [documentId, apiUrl]);

  useEffect(() => {
    fetchDeletedVersions();
  }, [fetchDeletedVersions]);
  const handleRestoreVersion = async (version) => {
    const versionId = version.id || version.idversion;
    
    if (!versionId) {
      console.error("No version ID found:", version);
      alert("❌ Error: ID de versión no válido.");
      return;
    }
    
    
    if (projectId && !documentId) {
      setVersionToRestore(version);
      setShowRestoreModal(true);
      return;
    }
    
    
    await performVersionRestore(version);
  };

  const performVersionRestore = async (version, targetDocumentId = null) => {
    const versionId = version.id || version.idversion;
    
    if (restoringVersions.has(versionId)) return;
    
    console.log("Restoring version with ID:", versionId, "Full version object:", version);
    
    setRestoringVersions(prev => new Set([...prev, versionId]));
    
    try {
      
      const docId = targetDocumentId || version.documentId || documentId;
        await axios.post(
        `${apiUrl}/api/versions/${versionId}/restore`,
        { targetDocumentId: docId }, 
        { withCredentials: true }
      );
      
      
      setDeletedVersions(prev => prev.filter(v => (v.id || v.idversion) !== versionId));
      
      
      if (onVersionRestored) {
        onVersionRestored(version);
      }
      
      
      alert(`✅ Versión ${version.versionNumber} restaurada exitosamente.`);
      
    } catch (err) {
      console.error("Error restoring version:", err);
      handleRestoreError(err, version);
    } finally {
      setRestoringVersions(prev => {
        const newSet = new Set(prev);
        newSet.delete(versionId);
        return newSet;
      });
    }
  };

  const handleRestoreError = (err, version) => {
    const errorMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data || "Error al restaurar la versión.";
    
    
    if (errorMessage.includes("documento padre está eliminado") || errorMessage.includes("parent document")) {
      alert(`❌ Error: ${errorMessage}\n\nDebe restaurar el documento padre primero antes de restaurar esta versión.`);
      return;
    }
    
    
    if (errorMessage.includes("no está eliminada") || errorMessage.includes("not deleted")) {
      alert(`ℹ️ Información: La versión ${version.versionNumber} ya está activa y no necesita ser restaurada.`);
      return;
    }
    
    
    if (err.response?.status === 404 || errorMessage.includes("no encontrada") || errorMessage.includes("not found")) {
      alert(`❌ Error: La versión ${version.versionNumber} no fue encontrada. Es posible que haya sido eliminada permanentemente.`);
      
      setDeletedVersions(prev => prev.filter(v => (v.id || v.idversion) !== (version.id || version.idversion)));
      return;
    }
    
    
    if (err.response?.status === 403 || errorMessage.includes("permisos") || errorMessage.includes("permission")) {
      alert(`❌ Error de permisos: No tiene autorización para restaurar la versión ${version.versionNumber}.`);
      return;
    }
    
    
    alert(`❌ Error al restaurar la versión ${version.versionNumber}: ${errorMessage}`);
  };

  const handlePermanentDelete = async (version) => {
    const versionId = version.id || version.idversion;
    
    if (!versionId) {
      console.error("No version ID found:", version);
      alert("❌ Error: ID de versión no válido.");
      return;
    }
    
    const confirmMessage = `⚠️ ADVERTENCIA: Eliminación Permanente\n\n¿Estás seguro de que quieres eliminar PERMANENTEMENTE la versión ${version.versionNumber}?\n\nEsta acción NO se puede deshacer y se perderán todos los datos de la versión incluyendo el archivo.`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setPermanentlyDeletingVersions(prev => new Set([...prev, versionId]));
    
    try {
      
      await axios.delete(
        `${apiUrl}/api/versions/project/${versionId}/permanent`,
        { withCredentials: true }
      );
      
      setDeletedVersions(prev => prev.filter(v => (v.id || v.idversion) !== versionId));
      alert(`✅ Versión ${version.versionNumber} eliminada permanentemente.`);
      
    } catch (err) {
      console.error("Error permanently deleting version:", err);
      handlePermanentDeleteError(err, version);
    } finally {
      setPermanentlyDeletingVersions(prev => {
        const newSet = new Set(prev);
        newSet.delete(versionId);
        return newSet;
      });
    }
  };

  const handlePermanentDeleteError = (err, version) => {
    const errorMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data || "Error al eliminar permanentemente la versión.";
    
    
    if (err.response?.status === 404 && errorMessage.includes("Not Found")) {
      alert(`ℹ️ Funcionalidad no disponible: La eliminación permanente aún no está implementada en el servidor.`);
      return;
    }
    
    
    if (err.response?.status === 404 || errorMessage.includes("no encontrada") || errorMessage.includes("not found")) {
      alert(`❌ Error: La versión ${version.versionNumber} no fue encontrada.`);
      
      setDeletedVersions(prev => prev.filter(v => (v.id || v.idversion) !== (version.id || version.idversion)));
      return;
    }
    
    
    if (err.response?.status === 403 || errorMessage.includes("permisos") || errorMessage.includes("permission")) {
      alert(`❌ Error de permisos: No tiene autorización para eliminar permanentemente la versión ${version.versionNumber}.`);
      return;
    }
    
    
    alert(`❌ Error al eliminar permanentemente la versión ${version.versionNumber}: ${errorMessage}`);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <Loader text="Cargando versiones eliminadas..." />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-100 rounded-md border border-red-200">
        <p className="font-medium">Error al cargar versiones eliminadas</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDeletedVersions}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (deletedVersions.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-500">No hay versiones eliminadas</p>
        <p className="text-sm text-gray-400 mt-2">
          Las versiones eliminadas aparecerán aquí y podrán ser restauradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
        <div className="flex items-start space-x-3">
          <DocumentIcon className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-purple-800">
              Versiones Eliminadas ({deletedVersions.length})
            </h4>            <p className="text-sm text-purple-700 mt-1">
              {projectId && !documentId ? 
                'Las versiones eliminadas de todos los documentos del proyecto se muestran aquí. Puedes restaurarlas a su documento original o eliminarlas permanentemente.' :
                'Las versiones eliminadas se muestran aquí. Puedes restaurarlas o eliminarlas permanentemente.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {deletedVersions.map((version) => (
          <div key={version.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                    <span className="text-sm font-medium text-purple-700">v{version.versionNumber}</span>
                  </div>
                </div>                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">
                    Versión {version.versionNumber}
                    {projectId && version.documentName && (
                      <span className="text-gray-500 text-xs ml-2">
                        de "{version.documentName}"
                      </span>
                    )}
                  </h4>
                  {version.comments && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {version.comments}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {version.fileSize && (
                      <span>
                        Tamaño: {formatFileSize(version.fileSize)}
                      </span>
                    )}
                    {version.mimeType && (
                      <span>
                        Tipo: {version.mimeType}
                      </span>
                    )}
                    {version.uploadedBy && (
                      <span>
                        Subida por: {version.uploadedBy.names} {version.uploadedBy.lastnames}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    {version.createdAt && (
                      <span>
                        Creada: {new Date(version.createdAt).toLocaleString('es-ES')}
                      </span>
                    )}
                    {version.deletedAt && (
                      <span>
                        Eliminada: {new Date(version.deletedAt).toLocaleString('es-ES')}
                      </span>
                    )}
                    {version.deletedBy && (
                      <span>
                        Por: {version.deletedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>                <div className="flex flex-col space-y-2">
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRestoreVersion(version)}
                    disabled={restoringVersions.has(version.id || version.idversion)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={projectId && !documentId ? "Restaurar versión a su documento original" : "Restaurar versión"}
                  >
                    {restoringVersions.has(version.id || version.idversion) ? (
                      <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ArrowPathIcon className="h-4 w-4" />
                    )}
                    <span>{restoringVersions.has(version.id || version.idversion) ? 'Restaurando...' : 'Restaurar'}</span>
                  </button>
              
                </div>
              </div>
            </div>
          </div>        ))}
      </div>

      
      {showRestoreModal && versionToRestore && (
        <RestoreVersionModal
          version={versionToRestore}
          projectId={projectId}
          onRestore={(version, targetDocumentId) => {
            setShowRestoreModal(false);
            setVersionToRestore(null);
            performVersionRestore(version, targetDocumentId);
          }}
          onCancel={() => {
            setShowRestoreModal(false);
            setVersionToRestore(null);
          }}
        />
      )}
    </div>
  );
}
