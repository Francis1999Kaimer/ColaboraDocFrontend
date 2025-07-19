
'use client';
import { useState } from 'react';
import axios from 'axios';

const ExclamationTriangleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-6 w-6 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.75 0a9 9 0 1119.5 0A9.013 9.013 0 0112 21c-4.5 0-8.25-3.5-8.25-7.75 0-1.125.75-2.25 1.5-3m6.75-7.5a9 9 0 00-9 9M15 12v.01" />
  </svg>
);

const FolderIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path d="M3.509 5.743A2 2 0 015.33 4.001H8.532a2 2 0 011.774 1.041l.46 1.004a1 1 0 00.887.52h4.838a2 2 0 011.992 1.829l-.011.117V15a2 2 0 01-2 2H5a2 2 0 01-2-2V7.432l.509-1.689z" />
  </svg>
);

const DocumentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path fillRule="evenodd" d="M3 3.75A1.75 1.75 0 014.75 2h5.5a.75.75 0 010 1.5h-5.5A.25.25 0 004.5 3.75v12.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V8.5a.75.75 0 011.5 0v7.75A1.75 1.75 0 0115.25 18H4.75A1.75 1.75 0 013 16.25V3.75z" clipRule="evenodd" />
  </svg>
);

export default function DeleteFolderModal({ 
  isOpen, 
  onClose, 
  folder, 
  onFolderDeleted,
  folderStats = { documents: 0, subfolders: 0 }
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const apiUrl = 'https://localhost:8080';

  const handleDelete = async () => {
    if (!folder) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      const params = deleteReason.trim() ? `?deletedBy=${encodeURIComponent(deleteReason.trim())}` : '';
      await axios.delete(
        `${apiUrl}/api/folders/delete/${folder.id}${params}`, 
        { withCredentials: true }
      );
      
      onFolderDeleted(folder);
      onClose();
      setDeleteReason('');
    } catch (err) {
      console.error("Error deleting folder:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Error al eliminar la carpeta.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setDeleteReason('');
    onClose();
  };

  if (!isOpen || !folder) return null;

  const hasContent = folderStats.documents > 0 || folderStats.subfolders > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Eliminar Carpeta
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              ¿Estás seguro de que quieres eliminar "{folder.name}"?
            </p>
          </div>
        </div>

        {hasContent && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Esta carpeta contiene:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {folderStats.documents > 0 && (
                    <li className="flex items-center space-x-1">
                      <DocumentIcon className="text-yellow-600" />
                      <span>{folderStats.documents} documento{folderStats.documents !== 1 ? 's' : ''}</span>
                    </li>
                  )}
                  {folderStats.subfolders > 0 && (
                    <li className="flex items-center space-x-1">
                      <FolderIcon className="text-yellow-600" />
                      <span>{folderStats.subfolders} subcarpeta{folderStats.subfolders !== 1 ? 's' : ''}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Los elementos se moverán a la papelera</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Podrás restaurarlos más tarde</span>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-1">
            Motivo (opcional)
          </label>
          <input
            type="text"
            id="deleteReason"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Ej: Contenido obsoleto, reorganización..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isDeleting}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isDeleting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isDeleting ? "Eliminando..." : "Mover a Papelera"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
