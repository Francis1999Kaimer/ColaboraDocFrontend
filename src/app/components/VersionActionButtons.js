import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import documentDownloadService from '../../services/DocumentDownloadService';

const ArrowDownTrayIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const PencilIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const VersionActionButtons = ({ 
  version, 
  documentId, 
  projectId,
  currentUser,
  documentName,
  onDownload,
  onDelete,
  disabled = false,
  className = ""
}) => {
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();

  
  const isPdfFile = (version) => {
    if (!version) return false;
    return version.mimeType === 'application/pdf';
  };

  const handleAnnotate = () => {
    if (!version || !isPdfFile(version)) return;
    
    
    const versionDocumentId = version.documentId || version.document?.iddocument || documentId;
    
    
    const params = new URLSearchParams({
      versionId: version.idversion,
      documentId: versionDocumentId,
      projectId: projectId
    });
    
    router.push(`/annotations?${params.toString()}`);
  };

  const handleDownload = async () => {
    if (!version || downloading) return;
    
    try {
      setDownloading(true);
      
      if (onDownload) {
        await onDownload(version);
      } else {
        
        await documentDownloadService.downloadVersion(
          version.idversion,
          documentName || `Documento_v${version.versionNumber}`
        );
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!version || !onDelete) return;
    
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la versión ${version.versionNumber}? Esta acción no se puede deshacer.`
    );
    
    if (confirmed) {
      try {
        await onDelete(version);
      } catch (error) {
        console.error('Error deleting version:', error);
      }
    }
  };

  
  const canDownload = !disabled && version;
  const canDelete = !disabled && version && onDelete && currentUser;
  const canAnnotate = !disabled && version && isPdfFile(version);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      
      <button
        onClick={handleDownload}
        disabled={!canDownload || downloading}
        className={`
          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
          ${canDownload && !downloading
            ? 'text-green-700 bg-green-100 hover:bg-green-200 hover:text-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-1'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }
          ${downloading ? 'opacity-70' : ''}
        `}
        title={canDownload ? "Descargar documento" : "No disponible"}
      >
        {downloading ? (
          <div className="w-4 h-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <ArrowDownTrayIcon className="mr-2" />
        )}
        {downloading ? 'Descargando...' : 'Descargar'}
      </button>

      
      <button
        onClick={handleAnnotate}
        disabled={disabled || !canAnnotate}
        className={`
          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
          ${canAnnotate && !disabled
            ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 hover:text-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }
        `}
        title={canAnnotate ? "Anotar documento PDF" : "Solo disponible para archivos PDF"}
      >
        <PencilIcon className="mr-2" />
        Anotar
      </button>

      
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={disabled}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
            ${!disabled
              ? 'text-red-700 bg-red-100 hover:bg-red-200 hover:text-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }
          `}
          title="Eliminar versión"
        >
          <TrashIcon className="mr-2" />
          Eliminar
        </button>
      )}
    </div>
  );
};

export default VersionActionButtons;
