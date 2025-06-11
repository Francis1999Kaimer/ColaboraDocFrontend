
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

export default function RestoreFolderModal({ 
  isOpen, 
  onClose, 
  folder, 
  projectId, 
  onRestoreSuccess 
}) {  const [projectFolders, setProjectFolders] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [originalLocation, setOriginalLocation] = useState(null);  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  
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
      try {      const response = await axios.get(
        `${apiUrl}/api/projects/${projectId}/folders`, 
        { withCredentials: true }
      );        
      const folderId = folder?.id || folder?.idfolder;
      const filteredFolders = filterFolderHierarchy(response.data, folderId);
      setProjectFolders(filteredFolders);

      
      const parentFolderId = folder?.parentFolderId;
      if (parentFolderId) {
        
        const originalLocationResult = findOriginalLocation(response.data, parentFolderId);
        if (originalLocationResult.found) {
          setOriginalLocation({
            type: 'found',
            path: originalLocationResult.path,
            parentFolder: originalLocationResult.parentFolder
          });        } else {
          setOriginalLocation({
            type: 'parent_deleted',
            message: 'La carpeta padre original también fue eliminada'
          });
        }
        
        
        if (originalLocationResult.found) {
          setSelectedParentId(parentFolderId);
        }
      } else {
        
        setOriginalLocation({
          type: 'root',
          message: 'Raíz del proyecto'
        });
        
      }
    } catch (err) {
      console.error('Error fetching project folders:', err);
      setError('Error al cargar la estructura de carpetas');
    } finally {
      setLoading(false);
    }  }, [projectId, apiUrl, isOpen, folder]);  
  const filterFolderHierarchy = (folders, excludeFolderId) => {
    return folders
      .filter(folder => (folder.id || folder.idfolder) !== excludeFolderId)
      .map(folder => {
        
        const children = folder.childFolders || folder.subfolders || folder.children || [];
        return {
          ...folder,
          
          id: folder.id || folder.idfolder,
          childFolders: children.length > 0 ? filterFolderHierarchy(children, excludeFolderId) : []
        };
      });
  };

  
  const toggleFolderExpansion = (folderId) => {
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
  const FolderTreeNode = ({ folder, level = 0 }) => {
    
    const children = folder.childFolders || folder.subfolders || folder.children || [];
    const hasSubfolders = children && children.length > 0;    const folderId = folder.id || folder.idfolder;    const isExpanded = expandedFolders.has(folderId);
    const isSelected = selectedParentId === folderId;
    const isOriginalParent = originalLocation?.type === 'found' && 
                            originalLocation?.parentFolder && 
                            (originalLocation.parentFolder.id || originalLocation.parentFolder.idfolder) === folderId;return (
      <div key={folderId}>        <label
          className={`flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 border-blue-300' : ''
          } ${
            isOriginalParent ? 'bg-green-50 border-green-300' : ''
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-center flex-1">
            
            {hasSubfolders ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFolderExpansion(folderId);
                }}
                className="mr-1 p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="text-gray-500" />
                ) : (
                  <ChevronRightIcon className="text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 mr-1"></div>
            )}

            
            <input
              type="radio"
              name="parentFolder"
              value={folderId}
              checked={isSelected}
              onChange={() => setSelectedParentId(folderId)}
              className="mr-3 text-blue-600 focus:ring-blue-500"
            />

            
            <FolderIcon className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {folder.name}
                </span>
                {isOriginalParent && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Ubicación original
                  </span>
                )}
              </div>
              {folder.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {folder.description}
                </p>
              )}            </div>
          </div>
        </label>         
        {hasSubfolders && isExpanded && (
          <div className="mt-2 ml-2 space-y-1">
            {children.map(subfolder => (
              <FolderTreeNode 
                key={subfolder.id || subfolder.idfolder} 
                folder={subfolder} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };  useEffect(() => {
    if (isOpen) {
      fetchProjectFolders();
      setSelectedParentId(null);
      setError('');
      setExpandedFolders(new Set()); 
      setOriginalLocation(null); 
    }
  }, [isOpen, fetchProjectFolders]);

  const handleRestore = async (cascade = false) => {
    const folderId = folder?.id || folder?.idfolder;
    
    if (!folderId) {
      setError('ID de carpeta no válido');
      return;
    }

    setRestoring(true);
    setError('');

    try {
      const endpoint = cascade 
        ? `${apiUrl}/api/folders/${folderId}/restore-cascade`
        : `${apiUrl}/api/folders/${folderId}/restore`;
      
      const params = selectedParentId ? { newParentFolderId: selectedParentId } : {};
      
      const response = await axios.post(endpoint, null, {
        params,
        withCredentials: true
      });

      
      alert(`✅ ${response.data}`);
      
      
      if (onRestoreSuccess) {
        onRestoreSuccess();
      }
      onClose();
      
    } catch (err) {
      console.error('Error restoring folder:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.response?.data || 
                          'Error al restaurar la carpeta';
      setError(errorMessage);
    } finally {
      setRestoring(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <ArrowPathIcon className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Restaurar Carpeta</h3>
          </div>
          <button
            onClick={onClose}
            disabled={restoring}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <FolderIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">{folder?.name}</span>
            </div>
            <p className="text-sm text-blue-700">
              {folder?.description || 'Sin descripción'}
            </p>
          </div>

          
          {originalLocation && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Ubicación original:
              </h4>
              {originalLocation.type === 'found' && (
                <div className="flex items-center text-sm text-gray-700">
                  <span className="font-mono bg-white px-2 py-1 rounded border">
                    /{originalLocation.path.join('/')}/
                  </span>
                </div>
              )}
              {originalLocation.type === 'root' && (
                <div className="flex items-center text-sm text-gray-700">
                  <span className="font-mono bg-white px-2 py-1 rounded border">
                    / (Raíz del proyecto)
                  </span>
                </div>
              )}
              {originalLocation.type === 'parent_deleted' && (
                <div className="flex items-center text-sm text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {originalLocation.message}
                </div>
              )}
            </div>
          )}

          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FolderArrowIcon className="inline h-4 w-4 mr-2" />
              Seleccionar carpeta padre (opcional):
            </label>
            
            {loading ? (
              <Loader text="Cargando carpetas..." />
            ) : (
              <div className="space-y-2">                
                <label className={`flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedParentId === null && originalLocation?.type === 'root' ? 'bg-green-50 border-green-300' : ''
                }`}>
                  <input
                    type="radio"
                    name="parentFolder"
                    value=""
                    checked={selectedParentId === null}
                    onChange={() => setSelectedParentId(null)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <FolderIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-medium">
                      Raíz del proyecto
                    </span>
                    {originalLocation?.type === 'root' && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Ubicación original
                      </span>
                    )}
                  </div>
                </label>

                
                <div className="space-y-1">
                  {projectFolders.map((projectFolder) => (
                    <FolderTreeNode 
                      key={projectFolder.id} 
                      folder={projectFolder} 
                      level={0} 
                    />
                  ))}
                </div>

                {projectFolders.length === 0 && !loading && (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    No hay otras carpetas disponibles en el proyecto
                  </p>
                )}
              </div>
            )}
          </div>

          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}


        </div>

        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={restoring}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleRestore(false)}
            disabled={restoring || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {restoring ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Restaurando...
              </>
            ) : (
              <>
                <FolderIcon className="h-4 w-4 mr-2" />
                Restaurar Solo Carpeta
              </>
            )}
          </button>
          <button
            onClick={() => handleRestore(true)}
            disabled={restoring || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {restoring ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Restaurando...
              </>
            ) : (
              <>
                <FolderArrowIcon className="h-4 w-4 mr-2" />
                Restaurar Cascada
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
