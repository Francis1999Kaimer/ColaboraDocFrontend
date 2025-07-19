
'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RestoreFolderModal from './RestoreFolderModal';

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

const FolderIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M3.509 5.743A2 2 0 015.33 4.001H8.532a2 2 0 011.774 1.041l.46 1.004a1 1 0 00.887.52h4.838a2 2 0 011.992 1.829l-.011.117V15a2 2 0 01-2 2H5a2 2 0 01-2-2V7.432l.509-1.689z" />
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

export default function DeletedFoldersView({ projectId, onFolderRestored }) {
  const [deletedFolders, setDeletedFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permanentlyDeletingFolders, setPermanentlyDeletingFolders] = useState(new Set());
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedFolderForRestore, setSelectedFolderForRestore] = useState(null);
  const apiUrl = 'https://localhost:8080';

  const fetchDeletedFolders = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(
        `${apiUrl}/api/folders/project/${projectId}/deleted`, 
        { withCredentials: true }
      );
        if (Array.isArray(response.data)) {
        
        console.log("Deleted folders data structure:", response.data);
        
        
        const normalizedFolders = response.data.map(folder => ({
          id: folder.idfolder || folder.id,
          name: folder.name,
          description: folder.description,
          deletedAt: folder.deletedAt,
          deletedBy: folder.deletedBy,
          
          ...folder
        }));
        
        setDeletedFolders(normalizedFolders);
      } else {
        setDeletedFolders([]);
        setError("Formato de datos inesperado.");
      }
    } catch (err) {
      console.error("Error fetching deleted folders:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Error al cargar carpetas eliminadas.");
      setDeletedFolders([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, apiUrl]);

  useEffect(() => {
    fetchDeletedFolders();
  }, [fetchDeletedFolders]);  const handleRestoreFolder = (folder) => {
    setSelectedFolderForRestore(folder);
    setRestoreModalOpen(true);
  };

  const handleRestoreSuccess = () => {
    
    fetchDeletedFolders();
    
    
    if (onFolderRestored) {
      onFolderRestored(selectedFolderForRestore);
    }
    
    
    setRestoreModalOpen(false);
    setSelectedFolderForRestore(null);
  };

  const handleCloseRestoreModal = () => {
    setRestoreModalOpen(false);
    setSelectedFolderForRestore(null);
  };const handlePermanentDelete = async (folder) => {
    
    const folderId = folder.id || folder.idfolder;
    
    if (!folderId) {
      console.error("No folder ID found:", folder);
      alert("❌ Error: ID de carpeta no válido.");
      return;
    }
    
    const confirmMessage = `⚠️ ADVERTENCIA: Eliminación Permanente\n\n¿Estás seguro de que quieres eliminar PERMANENTEMENTE la carpeta "${folder.name}"?\n\nEsta acción NO se puede deshacer y se perderán todos los datos de la carpeta y su contenido.`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setPermanentlyDeletingFolders(prev => new Set([...prev, folderId]));
    
    try {
      
      await axios.delete(
        `${apiUrl}/api/folders/${folderId}/permanent`,
        { withCredentials: true }
      );
      
      setDeletedFolders(prev => prev.filter(f => (f.id || f.idfolder) !== folderId));
      alert(`✅ Carpeta "${folder.name}" eliminada permanentemente.`);
      
    } catch (err) {
      console.error("Error permanently deleting folder:", err);
      handlePermanentDeleteError(err, folder);
    } finally {
      setPermanentlyDeletingFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    }
  };

  const handlePermanentDeleteError = (err, folder) => {
    const errorMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data || "Error al eliminar permanentemente la carpeta.";
    
    
    if (err.response?.status === 404 && errorMessage.includes("Not Found")) {
      alert(`ℹ️ Funcionalidad no disponible: La eliminación permanente aún no está implementada en el servidor.`);
      return;
    }
    
    
    if (err.response?.status === 404 || errorMessage.includes("no encontrada") || errorMessage.includes("not found")) {
      alert(`❌ Error: La carpeta "${folder.name}" no fue encontrada.`);
      
      setDeletedFolders(prev => prev.filter(f => (f.id || f.idfolder) !== (folder.id || folder.idfolder)));
      return;
    }
    
    
    if (err.response?.status === 403 || errorMessage.includes("permisos") || errorMessage.includes("permission")) {
      alert(`❌ Error de permisos: No tiene autorización para eliminar permanentemente la carpeta "${folder.name}".`);
      return;
    }
    
    
    alert(`❌ Error al eliminar permanentemente la carpeta "${folder.name}": ${errorMessage}`);
  };

  if (loading) {
    return <Loader text="Cargando carpetas eliminadas..." />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-100 rounded-md border border-red-200">
        <p className="font-medium">Error al cargar carpetas eliminadas</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDeletedFolders}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (deletedFolders.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <TrashIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-500">No hay carpetas eliminadas</p>
        <p className="text-sm text-gray-400 mt-2">
          Las carpetas eliminadas aparecerán aquí y podrán ser restauradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start space-x-3">
          <TrashIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">
              Carpetas Eliminadas ({deletedFolders.length})
            </h4>            <p className="text-sm text-blue-700 mt-1">
              Las carpetas eliminadas se muestran aquí. Puedes usar "Restaurar" para restaurar solo la carpeta, o eliminarlas permanentemente.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {deletedFolders.map((folder) => (
          <div key={folder.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <FolderIcon className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {folder.name}
                  </h4>
                  {folder.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {folder.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {folder.deletedAt && (
                      <span>
                        Eliminada: {new Date(folder.deletedAt).toLocaleString('es-ES')}
                      </span>
                    )}
                    {folder.deletedBy && (
                      <span>
                        Por: {folder.deletedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleRestoreFolder(folder)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
                  title="Restaurar carpeta"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Restaurar</span>
                </button>
                
                          
                </div>
            </div>
          </div>
        ))}
      </div>

      
      <RestoreFolderModal
        isOpen={restoreModalOpen}
        onClose={handleCloseRestoreModal}
        folder={selectedFolderForRestore}
        projectId={projectId}
        onRestoreSuccess={handleRestoreSuccess}
      />
    </div>
  );
}
