import React, { useState, useEffect, useCallback } from 'react';
import DocumentViewerDynamic from './DocumentViewerDynamic';
import ActiveUsersIndicator from './ActiveUsersIndicator';
import { useAnnotationManager } from '../../services/AnnotationManager';
import annotationWebSocketService from '../../services/AnnotationWebSocketService';

const AnnotationApp = ({ 
  documentId, 
  documentUrl, 
  currentUser, 
  onClose,
  isReadOnly = false 
}) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursors, setCursors] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('annotations'); 
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [annotationFilter, setAnnotationFilter] = useState('all'); 

  const {
    manager,
    annotations,
    loading,
    error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation
  } = useAnnotationManager(documentId, currentUser?.id, currentUser?.name);

  
  useEffect(() => {
    if (manager) {
      
      annotationWebSocketService.onUsersUpdate = (users) => {
        setActiveUsers(users.filter(user => user.id !== currentUser?.id));
      };

      
      annotationWebSocketService.onCursorUpdate = (cursorData) => {
        setCursors(prev => {
          const filtered = prev.filter(cursor => cursor.userId !== cursorData.userId);
          return [...filtered, cursorData];
        });

        
        setTimeout(() => {
          setCursors(prev => prev.filter(cursor => 
            cursor.userId !== cursorData.userId || 
            new Date(cursor.timestamp) > new Date(cursorData.timestamp)
          ));
        }, 3000);
      };
    }

    return () => {
      if (annotationWebSocketService.onUsersUpdate) {
        annotationWebSocketService.onUsersUpdate = null;
      }
      if (annotationWebSocketService.onCursorUpdate) {
        annotationWebSocketService.onCursorUpdate = null;
      }
    };
  }, [manager, currentUser?.id]);

  
  const handleAnnotationCreate = useCallback(async (annotationData) => {
    try {
      await createAnnotation(annotationData);
    } catch (error) {
      console.error('Error creating annotation:', error);
      
    }
  }, [createAnnotation]);

  
  const handleAnnotationUpdate = useCallback(async (annotationId, updates) => {
    try {
      await updateAnnotation(annotationId, updates);
      setSelectedAnnotation(null);
    } catch (error) {
      console.error('Error updating annotation:', error);
      
    }
  }, [updateAnnotation]);

  
  const handleAnnotationDelete = useCallback(async (annotationId) => {
    try {
      await deleteAnnotation(annotationId);
      setSelectedAnnotation(null);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      
    }
  }, [deleteAnnotation]);

  
  const handleCursorMove = useCallback((x, y, pageNumber) => {
    if (annotationWebSocketService.isConnected()) {
      annotationWebSocketService.updateCursor(x, y, pageNumber);
    }
  }, []);

  
  const getFilteredAnnotations = () => {
    let filtered = annotations;

    switch (annotationFilter) {
      case 'mine':
        filtered = annotations.filter(ann => ann.userId === currentUser?.id);
        break;
      case 'highlights':
        filtered = annotations.filter(ann => ann.type === 'highlight');
        break;
      case 'notes':
        filtered = annotations.filter(ann => ann.type === 'note');
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Conectando al sistema de anotaciones...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de Conexión</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      
      <div className={`flex-1 ${showSidebar ? 'mr-80' : ''} transition-all duration-300`}>
        <div className="h-full flex flex-col">
          
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Volver
              </button>
              <h1 className="text-lg font-semibold">Visor de Documentos</h1>
            </div>            <div className="flex items-center space-x-3">
              
              <ActiveUsersIndicator
                activeUsers={activeUsers}
                currentUser={currentUser}
                maxVisible={5}
                showNames={false}
                size="md"
              />

              
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                {showSidebar ? '→' : '←'} Panel
              </button>
            </div>
          </div>          
          <div className="flex-1">
            <DocumentViewerDynamic
              documentUrl={documentUrl}
              annotations={annotations}
              onAnnotationCreate={handleAnnotationCreate}
              onAnnotationUpdate={handleAnnotationUpdate}
              onAnnotationDelete={handleAnnotationDelete}
              onCursorMove={handleCursorMove}
              cursors={cursors}
              currentUser={currentUser}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      </div>

      
      {showSidebar && (
        <div className="w-80 bg-white border-l shadow-lg flex flex-col">
          
          <div className="border-b p-4">
            <div className="flex space-x-1">
              <button
                onClick={() => setSidebarTab('annotations')}
                className={`px-3 py-1 rounded text-sm ${
                  sidebarTab === 'annotations' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Anotaciones ({annotations.length})
              </button>
              <button
                onClick={() => setSidebarTab('users')}
                className={`px-3 py-1 rounded text-sm ${
                  sidebarTab === 'users' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Usuarios ({activeUsers.length + 1})
              </button>
            </div>
          </div>

          
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'annotations' && (
              <div className="p-4">
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por:
                  </label>
                  <select
                    value={annotationFilter}
                    onChange={(e) => setAnnotationFilter(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="all">Todas las anotaciones</option>
                    <option value="mine">Mis anotaciones</option>
                    <option value="highlights">Solo resaltados</option>
                    <option value="notes">Solo notas</option>
                  </select>
                </div>

                
                <div className="space-y-3">
                  {getFilteredAnnotations().map(annotation => (
                    <div
                      key={annotation.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedAnnotation?.id === annotation.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <span className="font-medium text-sm">
                            {annotation.type === 'highlight' ? '📝' : 
                             annotation.type === 'note' ? '💬' : '➤'}
                            {annotation.userName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Pág. {annotation.pageNumber}
                        </span>
                      </div>
                      
                      {annotation.text && (
                        <p className="text-sm text-gray-700 mb-2">{annotation.text}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(annotation.createdAt)}</span>
                        {annotation.userId === currentUser?.id && !isReadOnly && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAnnotation(annotation);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('¿Eliminar esta anotación?')) {
                                  handleAnnotationDelete(annotation.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {getFilteredAnnotations().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <p>No hay anotaciones</p>
                      {!isReadOnly && (
                        <p className="text-sm mt-1">
                          Usa las herramientas de anotación para crear la primera
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {sidebarTab === 'users' && (
              <div className="p-4">
                <div className="space-y-3">
                  
                  <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: currentUser?.color || '#4F46E5' }}
                    >
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{currentUser?.name} (Tú)</div>
                      <div className="text-sm text-gray-600">Editor</div>
                    </div>
                  </div>

                  
                  {activeUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 p-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">
                          Conectado {formatDate(user.joinedAt)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">👤</div>
                      <p>Solo tú estás conectado</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      
      {selectedAnnotation && selectedAnnotation.userId === currentUser?.id && !isReadOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Editar Anotación</h3>
              <button
                onClick={() => setSelectedAnnotation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto de la anotación:
                </label>
                <textarea
                  value={selectedAnnotation.text || ''}
                  onChange={(e) => setSelectedAnnotation({
                    ...selectedAnnotation,
                    text: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                  rows="4"
                  placeholder="Escribe el contenido de la anotación..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedAnnotation(null)}
                  className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleAnnotationUpdate(selectedAnnotation.id, {
                      text: selectedAnnotation.text
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationApp;
