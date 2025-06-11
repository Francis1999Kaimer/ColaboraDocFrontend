'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PDFViewerDynamic from '../components/PDFViewerDynamic';
import { getCurrentUser } from '../../utils/cookieUtils';

export default function ViewPage() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const versionId = searchParams.get('versionId');
  const documentUrl = searchParams.get('documentUrl');
  const documentName = searchParams.get('documentName') || 'Documento';

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        
        const user = await getCurrentUser();
        
        if (!user) {
          throw new Error('No hay sesión activa');
        }

        
        const userInfo = {
          id: user.id || user.userId,
          name: (user.names || user.firstName || '') + ' ' + (user.lastnames || user.lastName || ''),
          email: user.email
        };
          setCurrentUser(userInfo);
      } catch (err) {
        console.error('Error getting user info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
  }, []);

  const handleClose = () => {
    window.close();
    setTimeout(() => {
      window.history.back();
    }, 100);
  };
  const handleDownload = async () => {
    try {
      
      const response = await fetch(decodeURIComponent(documentUrl), {
        credentials: 'include' 
      });
      
      if (!response.ok) {
        throw new Error('Error al acceder al documento');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando visor de documentos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!versionId || !documentUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-6 max-w-md">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Parámetros Faltantes</h2>
          <p className="text-gray-600 mb-4">
            No se proporcionaron los parámetros necesarios para cargar el documento.
          </p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{decodeURIComponent(documentName)}</h1>
            <p className="text-sm text-gray-500">Modo solo lectura</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Descargar</span>
          </button>
          
          <a
            href={`/annotate?versionId=${versionId}&documentUrl=${encodeURIComponent(documentUrl)}&documentName=${encodeURIComponent(documentName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Anotar</span>
          </a>
        </div>
      </div>      <div className="flex-1 overflow-hidden">
        <PDFViewerDynamic
          documentUrl={decodeURIComponent(documentUrl)}
          documentId={versionId}
          currentUser={currentUser}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
