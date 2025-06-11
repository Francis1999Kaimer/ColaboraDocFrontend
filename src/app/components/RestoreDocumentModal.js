
'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const FolderIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M3.509 5.743A2 2 0 015.33 4.001H8.532a2 2 0 011.774 1.041l.46 1.004a1 1 0 00.887.52h4.838a2 2 0 011.992 1.829l-.011.117V15a2 2 0 01-2 2H5a2 2 0 01-2-2V7.432l.509-1.689z" />
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

const FolderArrowIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 transition-transform ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 transition-transform ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const XMarkIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-6 w-6 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

export default function RestoreDocumentModal({ 
  isOpen, 
  onClose, 
  document, 
  projectId, 
  onRestoreSuccess 
}) {
  const [projectFolders, setProjectFolders] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [originalLocation, setOriginalLocation] = useState(null);
  const [restoreType, setRestoreType] = useState('document'); 
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  
  const findOriginalLocation = (folders, parentFolderId, path = []) => {
    for (const folder of folders) {
      const currentPath = [...path, folder.name];
      
      
      if ((folder.id || folder.idfolder) === parentFolderId) {
        return {
          found: true,
          path: currentPath,
          parentFolder: folder
        };
      }
      
      
      const childFolders = folder.childFolders || folder.subfolders || folder.children || [];
      if (childFolders.length > 0) {
        const result = findOriginalLocation(childFolders, parentFolderId, currentPath);
        if (result.found) {
          return result;
        }
      }
    }
    return { found: false, path: [], parentFolder: null };
  };

  
  const fetchProjectFolders = useCallback(async () => {
    if (!projectId || !isOpen) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(
        `${apiUrl}/api/projects/${projectId}/folders`, 
        { withCredentials: true }
      );
      
      if (Array.isArray(response.data)) {
        const folders = response.data;
        setProjectFolders(folders);
        
        
        if (document?.parentFolderId) {
          const originalLocationResult = findOriginalLocation(folders, document.parentFolderId);
          
          if (originalLocationResult.found) {
            setOriginalLocation({
              state: 'found',
              folder: originalLocationResult.parentFolder,
              path: originalLocationResult.path
            });
            
            setSelectedParentId(document.parentFolderId);
          } else {
            setOriginalLocation({
              state: 'parent_deleted',
              folder: null,
              path: []
            });
          }
        } else {
          
          setOriginalLocation({
            state: 'root',
            folder: null,
            path: []
          });
          setSelectedParentId(null);
        }
      } else {
        setProjectFolders([]);
      }
    } catch (err) {
      console.error("Error fetching project folders:", err);
      setError("Error al cargar las carpetas del proyecto.");
    } finally {
      setLoading(false);
    }
  }, [projectId, isOpen, document?.parentFolderId, apiUrl]);

  useEffect(() => {
    if (isOpen) {
      fetchProjectFolders();
    }
  }, [fetchProjectFolders, isOpen]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderTree = (folders, level = 0) => {
    return folders.map(folder => {
      const folderId = folder.id || folder.idfolder;
      const folderName = folder.name;
      const childFolders = folder.childFolders || folder.subfolders || folder.children || [];
      const isExpanded = expandedFolders.has(folderId);
      const isSelected = selectedParentId === folderId;
      const isOriginalLocation = originalLocation?.state === 'found' && originalLocation?.folder?.id === folderId;
      
      return (
        <div key={folderId} className="select-none">
          <div 
            className={`flex items-center space-x-2 py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 ${
              isSelected ? 'bg-blue-100 border border-blue-300' : ''
            } ${isOriginalLocation ? 'bg-green-50 border border-green-300' : ''}`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => setSelectedParentId(folderId)}
          >
            {childFolders.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folderId);
                }}
                className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="text-gray-500" />
                ) : (
                  <ChevronRightIcon className="text-gray-500" />
                )}
              </button>
            )}
            {childFolders.length === 0 && (
              <div className="w-5 h-5 flex-shrink-0"></div>
            )}
            <FolderIcon className={`flex-shrink-0 ${isOriginalLocation ? 'text-green-600' : 'text-blue-600'}`} />
            <span className={`text-sm truncate ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'} ${isOriginalLocation ? 'text-green-800' : ''}`}>
              {folderName}
            </span>
            {isOriginalLocation && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                Ubicación original
              </span>
            )}
          </div>
          
          {isExpanded && childFolders.length > 0 && (
            <div>
              {renderFolderTree(childFolders, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleRestore = async () => {
    const documentId = document.id || document.iddocument;
    
    if (!documentId) {
      alert("❌ Error: ID de documento no válido.");
      return;
    }
    
    setRestoring(true);
    setError('');
    
    try {
      const payload = {
        parentFolderId: selectedParentId
      };
      
      const endpoint = restoreType === 'cascade' 
        ? `${apiUrl}/api/documents/${documentId}/restore-cascade`
        : `${apiUrl}/api/documents/${documentId}/restore`;
      
      await axios.post(endpoint, payload, { withCredentials: true });
      
      
      const successMessage = restoreType === 'cascade'
        ? `✅ Documento "${document.name}" y todas sus versiones restaurados exitosamente.`
        : `✅ Documento "${document.name}" restaurado exitosamente.`;
      alert(successMessage);
      
      
      if (onRestoreSuccess) {
        onRestoreSuccess(document);
      }
      
    } catch (err) {
      console.error("Error restoring document:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Error al restaurar el documento.";
      setError(errorMessage);
      alert(`❌ Error al restaurar el documento: ${errorMessage}`);
    } finally {
      setRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FolderArrowIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Restaurar Documento
              </h3>
              <p className="text-sm text-gray-600">
                "{document?.name}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon />
          </button>
        </div>

        
        <div className="flex-1 overflow-hidden p-6 space-y-6">
          
          {originalLocation && (
            <div className={`p-4 rounded-md border ${
              originalLocation.state === 'found' 
                ? 'bg-green-50 border-green-200'
                : originalLocation.state === 'root'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start space-x-3">
                <DocumentIcon className={`h-5 w-5 mt-0.5 ${
                  originalLocation.state === 'found' 
                    ? 'text-green-600'
                    : originalLocation.state === 'root'
                    ? 'text-blue-600'
                    : 'text-yellow-600'
                }`} />
                <div>
                  <h4 className={`text-sm font-medium ${
                    originalLocation.state === 'found' 
                      ? 'text-green-800'
                      : originalLocation.state === 'root'
                      ? 'text-blue-800'
                      : 'text-yellow-800'
                  }`}>
                    {originalLocation.state === 'found' 
                      ? 'Ubicación original encontrada'
                      : originalLocation.state === 'root'
                      ? 'Documento de carpeta raíz'
                      : 'Carpeta padre eliminada'
                    }
                  </h4>
                  <p className={`text-sm mt-1 ${
                    originalLocation.state === 'found' 
                      ? 'text-green-700'
                      : originalLocation.state === 'root'
                      ? 'text-blue-700'
                      : 'text-yellow-700'
                  }`}>
                    {originalLocation.state === 'found' 
                      ? `Ruta: ${originalLocation.path.join(' / ')}`
                      : originalLocation.state === 'root'
                      ? 'El documento estaba en la carpeta raíz del proyecto'
                      : 'La carpeta padre original ya no existe. Selecciona una nueva ubicación.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Tipo de restauración:
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="restoreType"
                  value="document"
                  checked={restoreType === 'document'}
                  onChange={(e) => setRestoreType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Restaurar solo documento</span>
                  <p className="text-xs text-gray-600">Restaura únicamente el documento seleccionado</p>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="restoreType"
                  value="cascade"
                  checked={restoreType === 'cascade'}
                  onChange={(e) => setRestoreType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Restaurar en cascada</span>
                  <p className="text-xs text-gray-600">Restaura el documento y todas sus versiones</p>
                </div>
              </label>
            </div>
          </div>

          
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Seleccionar carpeta de destino:
            </label>
            
            <div 
              className={`flex items-center space-x-2 py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 ${
                selectedParentId === null ? 'bg-blue-100 border border-blue-300' : ''
              } ${originalLocation?.state === 'root' ? 'bg-green-50 border border-green-300' : ''}`}
              onClick={() => setSelectedParentId(null)}
            >
              <FolderIcon className={`flex-shrink-0 ${originalLocation?.state === 'root' ? 'text-green-600' : 'text-blue-600'}`} />
              <span className={`text-sm ${selectedParentId === null ? 'font-medium text-blue-900' : 'text-gray-700'} ${originalLocation?.state === 'root' ? 'text-green-800' : ''}`}>
                Carpeta raíz del proyecto
              </span>
              {originalLocation?.state === 'root' && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  Ubicación original
                </span>
              )}
            </div>
          </div>

          
          {loading ? (
            <Loader text="Cargando carpetas..." />
          ) : error ? (
            <div className="text-center py-4 text-red-600">
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchProjectFolders}
                className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-gray-50">
              {projectFolders.length > 0 ? (
                <div className="p-2">
                  {renderFolderTree(projectFolders)}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No hay carpetas disponibles</p>
                </div>
              )}
            </div>
          )}
        </div>

        
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedParentId === null 
              ? "Se restaurará en la carpeta raíz del proyecto"
              : `Se restaurará en la carpeta seleccionada`
            }
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={restoring}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {restoring ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Restaurando...</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Restaurar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
