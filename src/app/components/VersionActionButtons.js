import React, { useState } from 'react';
import documentDownloadService from '../../services/DocumentDownloadService';


const PencilIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

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

const VersionActionButtons = ({ 
  version, 
  documentId, 
  projectId,
  currentUser,
  documentName,
  onAnnotate,
  onDownload,
  onDelete,
  disabled = false,
  className = ""
}) => {
  const [downloading, setDownloading] = useState(false);
  const [annotateLoading, setAnnotateLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  
  const handleAnnotate = async () => {
    if (disabled || annotateLoading) return;

    try {
      setAnnotateLoading(true);
      
      if (onAnnotate) {
        await onAnnotate(version);      } else {
        
        const versionId = version.id || version.idversion;
        const annotateDocumentName = documentName || `Versión ${version.versionNumber}`;
        const documentUrl = `${apiUrl}/api/versions/${versionId}/download`;
        
        
        const annotateUrl = `/annotate?versionId=${versionId}&documentUrl=${encodeURIComponent(documentUrl)}&documentName=${encodeURIComponent(annotateDocumentName)}`;
        window.open(annotateUrl, '_blank');
      }    } catch (error) {
      console.error('Error opening annotation app:', error);
      alert('Error al abrir el sistema de anotaciones');
    } finally {
      setAnnotateLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (disabled || downloading) return;

    try {
      setDownloading(true);
      
      if (onDownload) {
        await onDownload(version);
      } else {
        
        const versionId = version.id || version.idversion;
        const options = {
          documentName: documentName,
          versionNumber: version.versionNumber
        };
        
        await documentDownloadService.downloadVersion(versionId, options);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(`Error al descargar el documento: ${error.message}`);
    } finally {
      setDownloading(false);
    }  };
  
  
  const handleDelete = async () => {
    if (disabled || deleting) return;

    try {
      setDeleting(true);
      
      if (onDelete) {
        await onDelete(version);
      } else {
        
        console.log('Delete version:', version);
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      alert(`Error al eliminar la versión: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };
  
  
  
  const isPDF = documentDownloadService.supportsAnnotations(version.mimeType) ||
               version.dropboxFileId?.toLowerCase().endsWith('.pdf') ||
               version.filename?.toLowerCase().endsWith('.pdf') ||
               version.documentName?.toLowerCase().endsWith('.pdf');
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      
      {isPDF && (
        <button
          onClick={handleAnnotate}
          disabled={disabled || annotateLoading}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Anotar documento (solo PDF)"
        >
          {annotateLoading ? (
            <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <PencilIcon />
          )}
          <span className="hidden sm:inline">{annotateLoading ? 'Abriendo...' : 'Anotar'}</span>
        </button>
      )}

      
      <button
        onClick={handleDownload}
        disabled={disabled || downloading}
        className="flex items-center space-x-1 px-2 py-1 text-xs text-purple-700 bg-purple-100 border border-purple-300 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Descargar archivo"
      >
        {downloading ? (
          <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <ArrowDownTrayIcon />        )}
        <span className="hidden sm:inline">{downloading ? 'Descargando...' : 'Descargar'}</span>
      </button>

      
      <button
        onClick={handleDelete}
        disabled={disabled || deleting}
        className="flex items-center space-x-1 px-2 py-1 text-xs text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Eliminar versión"
      >
        {deleting ? (
          <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <TrashIcon />
        )}
        <span className="hidden sm:inline">{deleting ? 'Eliminando...' : 'Eliminar'}</span>
      </button>
    </div>
  );
};

export default VersionActionButtons;
