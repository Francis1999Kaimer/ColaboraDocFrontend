
'use client';
import { useState, useEffect, useCallback } from 'react';
import DeletedFoldersView from './DeletedFoldersView';
import DeletedDocumentsView from './DeletedDocumentsView';
import DeletedVersionsView from './DeletedVersionsView';
import axios from 'axios';

const FolderIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M3.509 5.743A2 2 0 015.33 4.001H8.532a2 2 0 011.774 1.041l.46 1.004a1 1 0 00.887.52h4.838a2 2 0 011.992 1.829l-.011.117V15a2 2 0 01-2 2H5a2 2 0 01-2-2V7.432l.509-1.689z" />
  </svg>
);

const DocumentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-5 w-5 ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`h-4 w-4 transition-transform ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
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

export default function RecyclingBinView({ projectId, onItemRestored }) {
  const [activeTab, setActiveTab] = useState('folders');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';  const handleItemRestored = () => {
    
    if (onItemRestored) {
      onItemRestored();
    }
  };
  if (loading) {
    return <Loader text="Cargando papelera de reciclaje..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Papelera de Reciclaje</h2>
        <p className="text-sm text-gray-600">Restaure o elimine permanentemente elementos eliminados</p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      
      <div className="border-b border-gray-200 px-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('folders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'folders'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderIcon className="inline mr-2" />
            Carpetas Eliminadas
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentIcon className="inline mr-2" />
            Documentos Eliminados
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'versions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClockIcon className="inline mr-2" />
            Versiones Eliminadas
          </button>
        </nav>
      </div>

      
      <div className="p-6">
        {activeTab === 'folders' && (
          <div>

            <DeletedFoldersView
              projectId={projectId}
              onFolderRestored={handleItemRestored}
            />
          </div>
        )}        {activeTab === 'documents' && (
          <div>
            <DeletedDocumentsView
              projectId={projectId}
              onDocumentRestored={handleItemRestored}
            />
          </div>
        )}        {activeTab === 'versions' && (
          <div>
            <DeletedVersionsView
              projectId={projectId}
              onVersionRestored={handleItemRestored}
            />
          </div>
        )}
      </div>
    </div>
  );

}