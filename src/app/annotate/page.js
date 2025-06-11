'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AnnotationApp from '../components/AnnotationApp';
import { getCurrentUser } from '../../utils/cookieUtils';

export default function AnnotatePage() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const versionId = searchParams.get('versionId');
  const documentUrl = searchParams.get('documentUrl');

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
          name: `${user.names || user.firstName || ''} ${user.lastnames || user.lastName || ''}`.trim(),
          email: user.email,
          color: generateUserColor(user.id || user.userId)
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

  
  const generateUserColor = (userId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F39C12',
      '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71'
    ];
    
    if (!userId) return colors[0];
    
    
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleClose = () => {
    window.close(); 
    
    setTimeout(() => {
      window.history.back();
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando sistema de anotaciones...</div>
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
            onClick={() => window.close()}
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
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <AnnotationApp
        documentId={versionId}
        documentUrl={decodeURIComponent(documentUrl)}
        currentUser={currentUser}
        onClose={handleClose}
        isReadOnly={false}
      />
    </div>
  );
}
